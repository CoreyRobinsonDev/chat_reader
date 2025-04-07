import { goto, initBrowser, kick } from "./backend/scrape.ts";
import { getCookies, log, openDB, Resp } from "./backend/util.ts";
import { match, SocketCode, type WebSocketData, Platform } from "./backend/types.ts";
import index from "./frontend/index.html" 
import getChat from "./backend/twitch.ts";
import type { RouterTypes } from "bun";
import type { Browser } from "puppeteer";


export const BROWSER: Browser = match<Browser>(await initBrowser(), {
	Ok: (val) => {
        log.info("Browser started")
		return val
	},
	Err: (e) => log.error(`Error on browser init : ${e.message}`)
})

type Routes = {
    "/*": RouterTypes.RouteValue<"/*">
    // "/api/register": RouterTypes.RouteValue<"/api/register">
    "/api/:platform/:streamer": RouterTypes.RouteValue<"/api/:platform/:streamer">
}

const s = Bun.serve<WebSocketData, Routes>({
	idleTimeout: 30,
	routes: {
		"/*": index,
        // "/api/register": {
        //     POST: async req => {
        //         const body: {
        //             clientName: string,
        //             secret: string
        //         } = await req.json()
        //         if (typeof body.clientName === "undefined") return Resp.BadRequest("Missing required 'clientName' key")
        //         if (typeof body.secret === "undefined") return Resp.BadRequest("Missing required 'secret' key")
        //         const token = jwt.sign(body, process.env.JWT_SECRET as string, {
        //             expiresIn: "7d"
        //         })
        //
        //         return new Response(
        //             JSON.stringify({
        //                 status: 201,
        //                 message: "Authenticated",
        //             }), {
        //                 status: 201,
        //                 headers: {
        //                     "Set-Cookie": `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`
        //                 } 
        //             }
        //         )
        //     }
        // },
        "/api/:platform/:streamer": req => {
            const {platform, streamer}: {platform: string, streamer: string} = req.params
            const clientId = getCookies(req).clientId

            if (!clientId) {
                if (!s.upgrade(req, {
                    data: {
                        streamer: streamer.toUpperCase(), 
                        platform: platform.toUpperCase(),
                        clientId,
                        toClose: {
                            socketCode: SocketCode.Unauthorized,
                            reason: "Client unauthenticated"
                        }
                    }
                })) {
                    return Resp.InternalServerError("Upgrade failed")
                }
                return Resp.Unauthorized()
            } else {
                using db = openDB()
                using query = db.query("select * from user where client_id = $clientId;")
                const result = query.all({clientId})

                if (result.length === 0) return Resp.Unauthorized()

                if (!s.upgrade(req, {
                    data: {
                        streamer: streamer.toUpperCase(), 
                        platform: platform.toUpperCase(),
                        clientId,
                    },
                })) {
                    return Resp.InternalServerError("Upgrade failed")
                }
                return Resp.Ok()
            }
        }
	},
	websocket: {
		perMessageDeflate: true,
		message(ws) {
			ws.close(SocketCode.MessageProhibited, "Message Prohibited")	
		},
		async open(ws) {
			const clientId = ws.data.clientId
			const streamer = ws.data.streamer
			const platform = ws.data.platform
			const toClose = ws.data.toClose
            log.debug(`[${clientId}] has connected`)

            if (!!toClose) {
                log.debug(`[${clientId}] has disconnected`)
                log.debug(`\t[${clientId}] ${toClose.reason}`)
                ws.close(toClose.socketCode, toClose.reason)
                return
            }

			if (!streamer) {
                log.debug(`[${clientId}] has disconnected`)
                log.debug(`\t[${clientId}] No Streamer Provided`)
				ws.close(SocketCode.BadRequest, `No Streamer Provided`)
				return
			} else if (!(platform in Platform)) {
                log.debug(`[${clientId}] has disconnected`)
                log.debug(`\t[${clientId}] Invalid Plaform: ${ws.data.platform}`)
				ws.close(SocketCode.BadRequest, `Invalid Plaform: ${ws.data.platform}`)
				return
			}
			
            log.debug(`[${clientId}] /${platform}/${streamer}`)
			ws.subscribe(platform+streamer)
			if (s.subscriberCount(platform+streamer) > 1) return


			switch (platform) {
            case Platform.TWITCH:
                getChat()
                break
			case Platform.KICK:
				const site = `https://kick.com/${streamer}/chatroom`
				const page = await goto(BROWSER, site)
				let lastUsername = "" 
                let lastContent = ""
                let emptyResponses = 0
                const emptyRepsonseLimit = 500

				if (page.isErr()) {
					ws.unsubscribe(platform+streamer)
					ws.close(SocketCode.InternalServerError, `Error on visiting ${site}`)
                    log.debug(`[${clientId}] has disconnected`)
                    log.error(`\tError on visiting ${site}`)
					return
				}

				while (s.subscriberCount(platform+streamer) > 0) {
					const chat = await kick(page.unwrap())

					if (chat.isErr()) {
						ws.unsubscribe(platform+streamer)
						ws.close(SocketCode.InternalServerError, `Error on scraping ${site}`)
						await page.unwrap().close()
                        log.debug(`[${clientId}] has disconnected`)
                        log.error(`\t[${clientId}] Error on scraping ${site}`)
						return
					}

					if (chat.unwrap().length === 0) {
                        log.debug(`[${clientId}] has disconnected`)
                        log.debug(`\t[${clientId}] ${platform} streamer ${streamer} is offline`)
						ws.close(SocketCode.BadRequest, `${platform.toLowerCase()} streamer ${streamer.toLowerCase()} is offline`)
						await page.unwrap().close()
						return
					}

					const idx = chat.unwrap().findIndex(el => el.userName === lastUsername && el.content === lastContent)
					if (idx === -1) {
						if (chat.unwrap().length === 0) {
                            emptyResponses++
                            if (emptyResponses >= emptyRepsonseLimit) {
                                log.debug(`[${clientId}] has disconnected`)
                                log.debug(`\t${platform} streamer ${streamer} is offline`)
                                ws.close(SocketCode.BadRequest, `${platform} streamer ${streamer} is offline`)
                                await page.unwrap().close()
                                return
                            }
                            continue 
                        }
                        emptyResponses = 0
						s.publish(platform+streamer, JSON.stringify(chat.unwrap()), true)
					} else {
						if (chat.unwrap().slice(0, idx).length === 0) {
                            emptyResponses++
                            if (emptyResponses >= emptyRepsonseLimit) {
                                log.debug(`[${clientId}] has disconnected`)
                                log.debug(`\t${platform} streamer ${streamer} is offline`)
                                ws.close(SocketCode.BadRequest, `${platform} streamer ${streamer} is offline`)
                                await page.unwrap().close()
                                return
                            }
                            continue 
                        }
                        emptyResponses = 0
						s.publish(platform+streamer, JSON.stringify(chat.unwrap().slice(0, idx)), true)
					}
					lastUsername = chat.unwrap()[0].userName
					lastContent = chat.unwrap()[0].content
					await Bun.sleep(100)
				}
				await page.unwrap().close()
                break
            default:
                ws.unsubscribe(platform+streamer)
                ws.close(SocketCode.InternalServerError, `Call to ${platform} is unimplemented`)
                log.debug(`[${clientId}] has disconnected`)
                log.debug(`\t[${clientId}] Call to ${platform} is unimplemented`)
			}
		},
		async close(ws) {
			ws.unsubscribe(ws.data.platform+ws.data.streamer)
            log.debug(`[${ws.data.clientId}] has exited`)
		}
	}
})



// shutdown on ctrl-c
process.on("SIGINT", async () => {
	await BROWSER.close()
})

log.info(`Listening on ${s.url}`)
