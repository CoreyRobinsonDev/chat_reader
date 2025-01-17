import { Browser, executablePath, Page, type LaunchOptions } from "puppeteer";
import stealthPlugin from "puppeteer-extra-plugin-stealth"
import puppeteer from "puppeteer-extra"
import { Err, match, Ok, Platform, Result } from "./types.ts";


const MAX_TIMEOUT: number = 10_000
const CONFIG: LaunchOptions = {
	args: ["--no-sandbox", "--disable-setuid-sandbox"],
	defaultViewport: { width: 1980, height: 1024 },
	slowMo: 50, 
	executablePath: executablePath(),
	headless: true, 
}


export async function initBrowser(): Promise<Result<Browser>> {
	puppeteer.use(stealthPlugin())
	let browser: Browser

	try {
		browser = await puppeteer.launch(CONFIG)
		return Ok(browser)
	} catch(_) {
		return Err("Unhandled error on browser initialization")
	}
}


export async function goto(browser: Browser, site: string): Promise<Result<Page>> {
	const page = await browser.newPage()
	page.setDefaultTimeout(MAX_TIMEOUT)

	try {
		await page.goto(site, {
			waitUntil: "networkidle2"
		})
		return Ok(page)
	} catch (_) {
		await page.close()
		return Err(`Unhandled error on page.goto(${site})`)
	}
}


export async function checkIfOnline(browser: Browser, platfrom: Platform, streamer: string): Promise<boolean> {
	switch(platfrom) {
	case Platform.KICK: {
		const page: Page | undefined = match<Page>(await goto(browser, `https://kick.com/${streamer}`), {
			Ok: (val) => val,
			Err: (_) => undefined
		})
		if (typeof page === "undefined") return false
		try {
			const offline = await page.$eval("h2", h2 => {
				return h2.textContent
			})
			await page.close()
			if (offline === "Oops, something went wrong") {
				return false
			} else if (offline === `${streamer} is offline`) {
				return false
			} else {
				// NOTE: I'm guessing here, might need to more conditions
				return false
			}
		} catch(_) {
			await page.close()
			// true because it throws when the streamer is online
			return true
		}
	}
	default:
		return false
	}
}

