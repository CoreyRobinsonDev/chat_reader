import { goto, initBrowser, kick } from "./backend/scrape.ts";
import { log, Resp, tryCatch, unwrap } from "./backend/util.ts";
import { SocketCode, type WebSocketData, Platform } from "./backend/types.ts";
import index from "./frontend/index.html" 
import type { RouterTypes } from "bun";

export const BROWSER = unwrap(await tryCatch(initBrowser()))

type Routes = {
    "/*": RouterTypes.RouteValue<"/*">
    "/api/:platform/:streamer": RouterTypes.RouteValue<"/api/:platform/:streamer">
}

const s = Bun.serve<WebSocketData, Routes>({
	idleTimeout: 30,
	routes: {
		"/*": index,
        "/api/:platform/:streamer": req => {
            const {platform, streamer}: {platform: string, streamer: string} = req.params

            if (!s.upgrade(req, {
                data: {
                    streamer: streamer.toUpperCase(), 
                    platform: platform.toUpperCase(),
                    clientId: Bun.randomUUIDv7()
                },
            })) {
                return Resp.InternalServerError("Upgrade failed")
            }
            return Resp.Ok()
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
            log.debug(`[${clientId}] has connected`)


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
                log.debug("twitch")
                break
			case Platform.KICK:
				const site = `https://kick.com/${streamer}/chatroom`
				const [page, pageErr] = await tryCatch(goto(BROWSER, site))
				let lastUsername = "" 
                let lastContent = ""
                let emptyResponses = 0
                const emptyRepsonseLimit = 500

				if (!page) {
					ws.unsubscribe(platform+streamer)
					ws.close(SocketCode.InternalServerError, `Error on visiting ${site}`)
                    log.debug(`[${clientId}] has disconnected`)
                    log.error(`\tError on visiting ${site}`)
                    log.error(`\t${pageErr}`)
					return
				}

				while (s.subscriberCount(platform+streamer) > 0) {
					const [chat, chatErr] = await tryCatch(kick(page))

					if (!chat) {
						ws.unsubscribe(platform+streamer)
						ws.close(SocketCode.InternalServerError, `Error on scraping ${site}`)
						await page.close()
                        log.debug(`[${clientId}] has disconnected`)
                        log.error(`\t[${clientId}] Error on scraping ${site}`)
                        log.error(`\t${chatErr}`)
						return
					}

					if (chat.length === 0) {
                        log.debug(`[${clientId}] has disconnected`)
                        log.debug(`\t[${clientId}] ${platform} streamer ${streamer} is offline`)
						ws.unsubscribe(platform+streamer)
						ws.close(SocketCode.BadRequest, `${platform.toLowerCase()} streamer ${streamer.toLowerCase()} is offline`)
						await page.close()
						return
					}

					const idx = chat.findIndex(el => el.userName === lastUsername && el.content === lastContent)
					if (idx === -1) {
						if (chat.length === 0) {
                            emptyResponses++
                            if (emptyResponses >= emptyRepsonseLimit) {
                                log.debug(`[${clientId}] has disconnected`)
                                log.debug(`\t${platform} streamer ${streamer} is offline`)
						        ws.unsubscribe(platform+streamer)
                                ws.close(SocketCode.BadRequest, `${platform} streamer ${streamer} is offline`)
                                await page.close()
                                return
                            }
                            continue 
                        }
                        emptyResponses = 0
						s.publish(platform+streamer, JSON.stringify(chat), true)
					} else {
						if (chat.slice(0, idx).length === 0) {
                            emptyResponses++
                            if (emptyResponses >= emptyRepsonseLimit) {
                                log.debug(`[${clientId}] has disconnected`)
                                log.debug(`\t${platform} streamer ${streamer} is offline`)
                                ws.close(SocketCode.BadRequest, `${platform} streamer ${streamer} is offline`)
                                await page.close()
                                return
                            }
                            continue 
                        }
                        emptyResponses = 0
						s.publish(platform+streamer, JSON.stringify(chat.slice(0, idx)), true)
					}
					lastUsername = chat[0].userName
					lastContent = chat[0].content
					await Bun.sleep(100)
				}
				await page.close()
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
