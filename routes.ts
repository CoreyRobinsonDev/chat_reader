import { BROWSER } from "./main.ts";
import { checkIfOnline, goto } from "./scrape.ts";
import { Resp } from "./util.ts";

export async function getKickChat(
	_req: Request,
	params?: URLPatternResult,
	connInfo?: Deno.ServeHandlerInfo<Deno.NetAddr>,
) {
	let timer: number
	console.log(`${connInfo?.remoteAddr.hostname}:${connInfo?.remoteAddr.port}`)
	const streamer = params?.pathname.groups.streamer
	if (!streamer) return Resp.BadRequest("No Kick streamer provided")
	const isOnline = await checkIfOnline(BROWSER, "kick", streamer)
	if (!isOnline) return Resp.BadRequest(`Kick streamer ${streamer} is offline or doesn't exist`)

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
