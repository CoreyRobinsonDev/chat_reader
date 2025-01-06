import { type Route, route } from "jsr:@std/http/unstable-route"
import { type Browser } from "npm:puppeteer@^23.11.1";
import { getKickChat } from "./routes.ts";
import { initBrowser } from "./scrape.ts";
import { Resp } from "./util.ts";


export const BROWSER: Browser = (await initBrowser()).unwrap()
const routes: Route[] = [
	{
		method: ["GET"],
		pattern: new URLPattern({pathname: "/kick/:streamer"}),
		// @ts-ignore: TS doesn't like that I'm asking for more info to be passed, Deno doesn't care
		handler: getKickChat
	}
]


function defaultHandler(req: Request): Response {
	return Resp.NotFound(`${URL.parse(req.url)?.pathname} Not Found`)
}

Deno.serve(route(routes, defaultHandler))



// shutdown on ctrl-c
Deno.addSignalListener("SIGINT", async () => {
	await BROWSER.close()
	Deno.exit(0)
})



