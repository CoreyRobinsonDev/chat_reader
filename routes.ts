import type { Server } from "bun";
import { TC } from "./main.ts";
import { diff, Resp, Tab } from "./util.ts";
import { Code, Platform, type Chat } from "./types.ts";

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
					TC.leaveTab(tab)
				}
				controller.enqueue(JSON.stringify({
					status: 200,
					code: Code.CON,
					message: `Connected to ${streamer} chatroom...`
				}))
				let chat: Chat[] = []
				let prevChat: Chat[] = []
				timer = setInterval(async () => {
					try {
						chat = await tab.page?.unwrap().$$eval("div.chat-entry > div", chats => {
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
								const contentHTML = el.querySelector(".font-bold.text-white + span")?.children
								let content = ""
								let emoteContainer: Chat["emoteContaner"] = {}
								for (let i = 0; i < (contentHTML?.length ?? 0); i++) {
									const className = contentHTML?.item(i)?.querySelector(".chat-emote-container, .chat-entry-content")?.className
									if (className === "chat-emote-container") {
										const emoteName = contentHTML?.item(i)?.querySelector(".chat-emote-container > div > img")?.getAttribute("alt")
										const emoteSrc = contentHTML?.item(i)?.querySelector(".chat-emote-container > div > img")?.getAttribute("src")
										if (content.length > 0) {
											content += " " + emoteName
										} else { content += emoteName }
										if (typeof emoteName === "string") {
											emoteContainer[emoteName] = emoteSrc ?? "ERR"
										}
									} else if (className === "chat-entry-content") {
										if (content.length > 0) {
											content += " " + contentHTML?.item(i)?.querySelector(".chat-entry-content")?.textContent
										} else {
											content += contentHTML?.item(i)?.querySelector(".chat-entry-content")?.textContent
										}
									}
								}


								return {
									badgeName: badgeName ? badgeName : undefined,
									badgeImg: badgeImg ? badgeImg : undefined,
									userName: userName ? userName : "ERR",
									userColor: userColor ? userColor : [0,0,0],
									content,
									emoteContainer 
								}
							})
						}) ?? []
					} catch(e: any) {
						console.error(e.message)
					}
					const diffChatContent = diff(prevChat.map(el => el.content), chat.map(el => el.content))
					prevChat = chat
					chat = chat.filter(el => diffChatContent.includes(el.content))
					try {
						// TODO: Research the following error on client exit:
						// Can only call ReadableStreamDefaultController.enqueue on instances of ReadableStreamDefaultController
						controller.enqueue(JSON.stringify({
							status: 200,
							code: Code.MSG,
							message: chat
						}))
					} catch(_) { 
						console.error("Enqueue Error Occurred")
					}
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
