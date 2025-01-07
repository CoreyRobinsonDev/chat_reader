import type { Server } from "bun";
import { BROWSER } from "./main.ts";
import { checkIfOnline, goto } from "./scrape.ts";
import { Resp } from "./util.ts";

export async function getKickChat(
	req: Request,
	params?: any,
	server?: Server
) {
	let timer: Timer
	console.log(server?.requestIP(req))
	const streamer = params.streamer
	if (!streamer) return Resp.BadRequest("No Kick streamer provided")
	const isOnline = await checkIfOnline(BROWSER, "kick", streamer)
	if (!isOnline) return Resp.BadRequest(`Kick streamer ${streamer} is offline or doesn't exist`)
	const page = await goto(BROWSER, `https://kick.com/${streamer}/chatroom`)
	if (page.isErr()) {
		return Resp.InternalServerError(page.unwrapErr().message)
	}

	const body = new ReadableStream({
		start(controller) {
			controller.enqueue(JSON.stringify({
				status: 200,
				message: `Connected to ${streamer} chatroom...`
			}))
			timer = setInterval(async () => {
				let chat = [""]
				try {
					chat = await page.unwrap().$$eval("div.chat-entry > div", chats => {
						return chats.map(el => el.innerText)
					})
				} catch(e: any) {
					console.error(e.message)
					return Resp.InternalServerError()
				}
				try {
					controller.enqueue(JSON.stringify({
						status: 200,
						message: chat
					}))
				} catch(e: any) {
					console.error(e)
					return Resp.InternalServerError()
				}
			}, 1000)
		},
		async cancel() {
			clearInterval(timer)
			await page.unwrap().close()
		}
	})
	
	return new Response(body.pipeThrough(new TextEncoderStream()), {
		headers: {
			"content-type": "text/plain; charset=utf-8"
		}
	})
}
