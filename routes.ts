import { BROWSER } from "./main.ts";
import { checkIfOnline, goto } from "./scrape.ts";

export async function getKickChat(
	connInfo: Deno.ServeHandlerInfo<Deno.NetAddr>,
	pathParam?: string
) {
	let timer: number
	console.log(`${connInfo.remoteAddr.hostname}:${connInfo.remoteAddr.port}`)
	const streamer = pathParam
	const isOnline = await checkIfOnline(BROWSER, "kick", streamer)
	const page = (await goto(BROWSER, `https://kick.com/${streamer}/chatroom`)).unwrap()

	const body = new ReadableStream({
		start(controller) {
			timer = setInterval(() => {
				controller.enqueue("Hello, World!")
			}, 1000)
		},
		async cancel() {
			clearInterval(timer)
			await page.close()
		}
	})
	
	return new Response(body.pipeThrough(new TextEncoderStream()), {
		headers: {
			"content-type": "text/plain; charset=utf-8"
		}
	})
}
