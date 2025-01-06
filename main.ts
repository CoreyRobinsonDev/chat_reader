import { type Browser } from "npm:puppeteer@^23.11.1";
import { getKickChat } from "./routes.ts";
import { initBrowser } from "./scrape.ts";
import { router } from "./util.ts";


export const BROWSER: Browser = (await initBrowser()).unwrap()

Deno.serve((req, connInfo) => {
	return router(
		req, connInfo,
		{path: "/kick/{}", handler: getKickChat},
	)
})

// shutdown on ctrl-c
Deno.addSignalListener("SIGINT", async () => {
	await BROWSER.close()
	Deno.exit(0)
})



