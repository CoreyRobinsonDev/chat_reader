import { goto, initBrowser, kick } from "./backend/scrape.ts";
import { log, Resp } from "./backend/util.ts";
import type { Browser } from "puppeteer";
import { match, SocketCode, type WebSocketData, Platform } from "./backend/types.ts";
//@ts-ignore: don't know why tsls can't find this
import index from "./frontend/index.html" 


export const BROWSER: Browser = match<Browser>(await initBrowser(), {
	Ok: (val) => {
        log.info("Browser started")
		return val
	},
	Err: (e) => log.error(`Error on browser init : ${e.message}`)
})


const s = Bun.serve<WebSocketData>({
	idleTimeout: 30,
    //@ts-ignore: bun v1.2.4
	routes: {
		"/*": index,
        "/api/:platform/:streamer": async (req: any) => {
            const {platform, streamer}: {platform: string, streamer: string} = req.params
            if (!s.upgrade(req, {
                data: {
                    streamer: streamer.toUpperCase(), 
                    platform: platform.toUpperCase(),
                    userIp: s.requestIP(req)?.address
                }
            })) {
                return Resp.InternalServerError("Upgrade failed")
            }
        }
	},
	websocket: {
		perMessageDeflate: true,
		message(ws) {
			ws.close(SocketCode.MessageProhibited, "Message Prohibited")	
		},
		async open(ws) {
			const userIp = ws.data.userIp
			const streamer = ws.data.streamer
			const platform = ws.data.platform
            log.debug(`[${userIp}] has connected`)

			if (!streamer) {
                log.debug(`[${userIp}] has disconnected`)
				ws.close(SocketCode.BadRequest, `No Streamer Provided`)
				return
			} else if (!(platform in Platform)) {
                log.debug(`[${userIp}] has disconnected`)
				ws.close(SocketCode.BadRequest, `Invalid Plaform: ${ws.data.platform}`)
				return
			}
			
            log.debug(`[${userIp}] /${platform}/${streamer}`)
			ws.subscribe(platform+streamer)
			if (s.subscriberCount(platform+streamer) > 1) return


			switch (platform) {
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
                    log.debug(`[${userIp}] has disconnected`)
                    log.error(`Error on visiting ${site}`)
					return
				}

				while (s.subscriberCount(platform+streamer) > 0) {
					const chat = await kick(page.unwrap())

					if (chat.isErr()) {
						ws.unsubscribe(platform+streamer)
						ws.close(SocketCode.InternalServerError, `Error on scraping ${site}`)
						await page.unwrap().close()
                        log.debug(`[${userIp}] has disconnected`)
                        log.error(`Error on scraping ${site}`)
						return
					}

					if (chat.unwrap().length === 0) {
                        log.debug(`[${userIp}] has disconnected`)
                        log.debug(`${platform} streamer ${streamer} is offline`)
						ws.close(SocketCode.BadRequest, `${platform} streamer ${streamer} is offline`)
						await page.unwrap().close()
						return
					}

					const idx = chat.unwrap().findIndex(el => el.userName === lastUsername && el.content === lastContent)
					if (idx === -1) {
						if (chat.unwrap().length === 0) {
                            emptyResponses++
                            if (emptyResponses >= emptyRepsonseLimit) {
                                log.debug(`[${userIp}] has disconnected`)
                                log.debug(`${platform} streamer ${streamer} is offline`)
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
                                log.debug(`[${userIp}] has disconnected`)
                                log.debug(`${platform} streamer ${streamer} is offline`)
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
                log.debug(`[${userIp}] has disconnected`)
                log.debug(`Call to ${platform} is unimplemented`)
			}
		},
		async close(ws) {
			ws.unsubscribe(ws.data.platform+ws.data.streamer)
            log.debug(`[${ws.data.userIp}] has exited`)
		}
	}
})



// shutdown on ctrl-c
process.on("SIGINT", async () => {
	await BROWSER.close()
})

log.info(`Listening on ${s.url}`)
