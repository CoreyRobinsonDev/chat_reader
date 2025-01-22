import { checkIfOnline, goto, initBrowser, kick } from "./scrape.ts";
import { Resp } from "./util.ts";
import type { Browser } from "puppeteer";
import { match, SocketCode, type WebSocketData, Platform } from "./types.ts";


export const BROWSER: Browser = match<Browser>(await initBrowser(), {
	Ok: (val) => val,
	Err: (e) => console.error(e.message)
})


const s = Bun.serve<WebSocketData>({
	idleTimeout: 30,
	fetch(req, server) {
		if (!server.upgrade(req, {
			data: {
				streamer: new URL(req.url).searchParams.get("streamer"),
				platform: new URL(req.url).searchParams.get("platform")?.toUpperCase(),
				userIp: server.requestIP(req)?.address
			}
		})) {
			return Resp.InternalServerError("Upgrade failed")
		}
	},
	websocket: {
		message(ws) {
			ws.close(SocketCode.MessageProhibited, "Message Prohibited")	
		},
		async open(ws) {
			const user = ws.data.userIp
			const streamer = ws.data.streamer
			const platform = ws.data.platform
			console.log(`[${user}] has connected`)

			if (!streamer) {
				console.log(`[${user}] has disconnected`)
				ws.close(SocketCode.BadRequest, `No Streamer Provided`)
				return
			} else if (!(platform in Platform)) {
				console.log(`[${user}] has disconnected`)
				ws.close(SocketCode.BadRequest, `Invalid Plaform: ${ws.data.platform}`)
				return
			}
			
			console.log(`[${user}] /kick/${streamer}`)

			ws.subscribe(platform+streamer)
			if (s.subscriberCount(platform+streamer) > 1) return

			const isOnline = await checkIfOnline(BROWSER, platform, streamer)
			if (!isOnline) {
				console.log(`[${user}] has disconnected`)
				ws.close(SocketCode.BadRequest, `${platform} streamer ${streamer} is offline`)
				return
			}

			switch (platform) {
			case Platform.KICK:
				const site = `https://kick.com/${streamer}/chatroom`
				const page = await goto(BROWSER, site)
				let lastUsername = "" 

				if (page.isErr()) {
					ws.unsubscribe(platform+streamer)
					console.log(`[${user}] has disconnected`)
					ws.close(SocketCode.InternalServerError, `Error on visiting ${site}`)
					return
				}
				while (s.subscriberCount(platform+streamer) > 0) {
					const chat = await kick(page.unwrap())
					if (chat.isErr()) {
						await page.unwrap().close()
						ws.unsubscribe(platform+streamer)
						console.log(`[${user}] has disconnected`)
						ws.close(SocketCode.InternalServerError, `Error on scraping ${site}`)
						return
					}
					const idx = chat.unwrap().findIndex(el => el.userName === lastUsername)
					if (idx === -1) {
						s.publish(platform+streamer, JSON.stringify(chat.unwrap()))
					} else {
						s.publish(platform+streamer, JSON.stringify(chat.unwrap().slice(0, idx)))
					}
					lastUsername = chat.unwrap()[0].userName
					await Bun.sleep(1000)
				}
				await page.unwrap().close()
			}

		},
		async close(ws) {
			ws.unsubscribe(ws.data.platform+ws.data.streamer)
			console.log(`[${ws.data.userIp}] has disconnected`)
		}
	}
})



// shutdown on ctrl-c
process.on("SIGINT", async () => {
	await BROWSER.close()
})




console.log(`Listening on ${s.url}`)
