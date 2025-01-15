import type { Server } from "bun";
import { BROWSER, TC } from "./main.ts";
import { checkIfOnline, goto } from "./scrape.ts";
import { diff, Resp, Tab } from "./util.ts";
import { Code, Platform } from "./types.ts";

export async function getKickChat(
	req: Request,
	params?: any,
	server?: Server
) {
	let timer: Timer
	console.log(server?.requestIP(req))
	const streamer = params.streamer
	let chatStream: ReadableStream<any>
	let tab: Tab
	try {
		chatStream = new ReadableStream({
			async start(controller) {
				controller.enqueue(JSON.stringify({
					status: 200,
					code: Code.CON,
					message: `Connecting to ${streamer} chatroom...`
				}))

				tab = await TC.connectTab(Platform.KICK, streamer)
				if (tab.page?.isErr()) {
					controller.enqueue(JSON.stringify({
						status: 400,
						code: Code.ERR,
						message: tab.page.unwrapErr().message
					}))
					controller.close()
				}
				controller.enqueue(JSON.stringify({
					status: 200,
					code: Code.CON,
					message: `Connected to ${streamer} chatroom...`
				}))
				timer = setInterval(async () => {
					let chat = await tab.page?.unwrap().$$eval("div.chat-entry > div", chats => {
						return chats.map(el => {
							const badgeImg = el.querySelector("img.icon")?.getAttribute("src")
							const badgeName = el.querySelector("img.icon")?.getAttribute("alt")
							const userName = el.querySelector(".chat-entry-username")?.textContent
							const userColor = el.querySelector(".chat-entry-username")?.getAttribute("style")
								?.split("(").at(-1)
								?.split(",")
								.slice(0, 3)
								.map((el, idx) => {
									if (idx === 2) {
										return Number(el.trim().split(")")[0])
									}
									return Number(el.trim())
								})
							return {
								badgeName,
								badgeImg,
								userName,
								userColor
							}
						})
					})
					console.log(chat)
					// const diffChats = diff(prevChat, chat ?? [])
					// prevChat = chat ?? []
					// chat = diffChats
					try {
						// TODO: Research the following error on client exit:
						// Can only call ReadableStreamDefaultController.enqueue on instances of ReadableStreamDefaultController
						controller.enqueue(JSON.stringify({
							status: 200,
							code: Code.MSG,
							message: chat
						}))
					} catch(_) { }
				}, 1000)
			},
			cancel() {
				clearInterval(timer)
				TC.leaveTab(tab)
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
