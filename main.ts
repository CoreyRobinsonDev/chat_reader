import { getChat, getProfile, goto, initBrowser } from "./backend/scrape.ts";
import { LinkedList, Node, log, Resp, tryCatch, unwrap } from "./backend/util.ts";
import { SocketCode, type WebSocketData, Platform } from "./backend/types.ts";
import index from "./frontend/index.html" 
import type { RouterTypes } from "bun";

export const BROWSER = unwrap(await tryCatch(initBrowser()))

type Routes = {
    "/": RouterTypes.RouteValue<"/">
    "/*": RouterTypes.RouteValue<"/*">
    "/health": RouterTypes.RouteValue<"/health">
    "/health/downstream": RouterTypes.RouteValue<"/health/downstream">
    "/api/:platform/:streamer/chat": RouterTypes.RouteValue<"/api/:platform/:streamer/chat">
    "/api/:platform/:streamer/profile": RouterTypes.RouteValue<"/api/:platform/:streamer/profile">
}

const s = Bun.serve<WebSocketData, Routes>({
    idleTimeout: 30,
	routes: {
		"/": index,
        "/*": Resp.NotFound(),
        "/health": Resp.Ok("Up"),
        "/health/downstream": async () => {
            const kickRes = await fetch("https://kick.com")
            const twitchRes = await fetch("https://twitch.tv")

            const ll = new LinkedList<number>
            log.debug(ll.toString())
            ll.addFront(new Node(3))
            ll.addFront(new Node(2))
            ll.addFront(new Node(1))
            log.debug(ll.toString())
            log.debug(ll.removeFront())
            log.debug(ll.removeBack())
            log.debug(ll.toString())
            log.debug(ll.removeBack())
            log.debug(ll.removeBack())
            log.debug(ll.toString())
            ll.addBack(new Node(1))
            ll.addBack(new Node(2))
            ll.addBack(new Node(3))
            log.debug(ll.removeFront())
            log.debug(ll.removeFront())
            log.debug(ll.removeFront())
            log.debug(ll.toString())

            return Response.json({
                status: 200,
                message: "Up",
                downstream: {
                    twitch: twitchRes.ok ? "Up" : "Down",
                    kick: kickRes.ok ? "Up" : "Down",
                }
            }, { status: 200 })
        },
        "/api/:platform/:streamer/profile": async req => {
            let {platform, streamer}: {platform: string, streamer: string} = req.params
            platform = platform.toUpperCase()
            streamer = streamer.toLowerCase()

			if (!streamer) {
				return Resp.BadRequest(`No Streamer Provided`)
			} else if (!(platform in Platform)) {
				return Resp.BadRequest(`Invalid Plaform: ${platform}`)
			}

            let site = ""
			switch (platform) {
            case Platform.TWITCH:
                site = `https://twitch.tv/${streamer}`
                break
			case Platform.KICK:
                site = `https://kick.com/${streamer}`
                break
            default:
                return Resp.BadRequest(`Call to ${platform} is unimplemented`)
			}

            const [page, pageErr] = await tryCatch(goto(BROWSER, site))
            if (!page) {
                log.error(pageErr)
                return Resp.BadRequest(`Error on visiting ${site}`)
            }

            const [profileUrl, profileUrlErr] = await tryCatch(getProfile(platform as Platform, streamer, page))
            if (!profileUrl) {
                log.error(profileUrlErr)
                return Resp.BadRequest(`Error on fetching ${site} profile`)
            }

            return Resp.Ok(profileUrl)
        },
        "/api/:platform/:streamer/chat": async req => {
            // TODO: sleeping to prevent a burst request to 3rd party sites
            // surely there's a better way
            const sec = [1000, 2000, 3000]
            const offset = Math.floor(Math.random() * 3)
            await Bun.sleep(sec[offset])

            const {platform, streamer}: {platform: string, streamer: string} = req.params

            if (!s.upgrade(req, {
                data: {
                    streamer: streamer.toLowerCase(), 
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

            let site = ""
			switch (platform) {
            case Platform.TWITCH:
                site = `https://twitch.tv/popout/${streamer}/chat`
                break
			case Platform.KICK:
                site = `https://kick.com/${streamer}/chatroom`
                break
            default:
                ws.unsubscribe(platform+streamer)
                ws.close(SocketCode.InternalServerError, `Call to ${platform} is unimplemented`)
                log.debug(`[${clientId}] has disconnected`)
                log.debug(`\t[${clientId}] Call to ${platform} is unimplemented`)
			}

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
                const [chat, chatErr] = await tryCatch(getChat(platform, page))

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
                            ws.close(SocketCode.BadRequest, `${platform.toLowerCase()} streamer ${streamer} is offline`)
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
                            ws.close(SocketCode.BadRequest, `${platform.toLowerCase()} streamer ${streamer} is offline`)
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
            return
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
