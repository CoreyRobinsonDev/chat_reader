import type { Server } from "bun";
import { BROWSER, TC } from "./main.ts";
import { checkIfOnline, goto } from "./scrape.ts";
import { diff, Resp } from "./util.ts";
import { Code, Platform } from "./types.ts";

export async function getKickChat(
	req: Request,
	params?: any,
	server?: Server
) {
	let timer: Timer
	console.log(server?.requestIP(req))
	const streamer = params.streamer
	const tab = await TC.connectTab(Platform.KICK, streamer)
	console.log(TC)
	let chatStream: ReadableStream<any>
	try {
		chatStream = new ReadableStream({
			start(controller) {
				let prevChat: string[] = []
				controller.enqueue(JSON.stringify({
					status: 200,
					code: Code.CON,
					message: `Connected to ${streamer} chatroom...`
				}))
				timer = setInterval(async () => {
					let chat: string[] | undefined
					try {
						chat = await tab.page?.unwrap().$$eval("div.chat-entry > div", chats => {
							return chats.map(el => el.innerText)
						})
						const diffChats = diff(prevChat, chat ?? [])
						prevChat = chat ?? []
						chat = diffChats
					} catch(e: any) {
						console.error(e.message)
						throw e
					}
					try {
						controller.enqueue(JSON.stringify({
							status: 200,
							code: Code.MSG,
							message: chat
						}))
					} catch(e: any) {
						console.error(e.message)
						throw e
					}
				}, 1000)
			},
			async cancel() {
				clearInterval(timer)
				TC.leaveTab(tab)
				console.log(TC)
			}
		})
	} catch(_) {
		return Resp.InternalServerError()
	}
	
	return new Response(chatStream, {
		headers: {
			"content-type": "text/plain; charset=utf-8"
		}
	})
}
