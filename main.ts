import UrlPattern from "url-pattern"
import { getKickChat } from "./routes.ts";
import { initBrowser } from "./scrape.ts";
import { Resp, router, Tab, TabController } from "./util.ts";
import type { Browser } from "puppeteer";
import { match, type Route } from "./types.ts";


export const TC: TabController = new TabController()
export const BROWSER: Browser = match<Browser>(await initBrowser(), {
	Ok: (val) => val,
	Err: (e) => console.error(e.message)
})

const routes: Route[] = [
	{
		method: ["GET"],
		pattern: new UrlPattern("/kick/:streamer"),
		handler: getKickChat
	},
]

const s = Bun.serve({
	idleTimeout: 20,
	fetch(req, server) {
		return router(req, server, routes, defaultHandler)
	}
})

function defaultHandler(req: Request): Response {
	try {
		return Resp.NotFound(`${URL.parse(req.url)?.pathname} Not Found`)
	} catch(e) {
		console.error(e)
		return Resp.InternalServerError()
	}
}

// shutdown on ctrl-c
process.on("SIGINT", async () => {
	await BROWSER.close()
})




console.log(`Listening on ${s.url}`)
