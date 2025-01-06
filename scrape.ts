import { executablePath, type LaunchOptions, type Browser, Page } from "npm:puppeteer@^23.11.1"
import puppeteer from "npm:puppeteer-extra@^3.3.6"
import stealthPlugin from "npm:puppeteer-extra-plugin-stealth@^2.11.2"
import { Err, Ok, Result } from "./types.ts";

const MAX_TIMEOUT: number = 10_000
const CONFIG: LaunchOptions = {
	args: ["--no-sandbox", "--disable-setuid-sandbox"],
	defaultViewport: { width: 1980, height: 1024 },
	slowMo: 50, 
	executablePath: "/usr/bin/google-chrome-stable",
	headless: false, 
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


export async function checkIfOnline(browser: Browser, platfrom: string, streamer: string): Promise<boolean> {
	const channelPage = await browser.newPage()
	switch(platfrom) {
	case "kick":
		try {
			await channelPage.goto(`https://kick.com/${streamer}`, {
				waitUntil: "networkidle2"
			})
		} catch(_) { return false }
		try {
			const offline = await channelPage.$eval("h2", h2 => {
				return h2.textContent
			})
			// instead of reaturning undefined it returns this specific string of text, imagine
			if (offline === "Oops, something went wrong") return false
			await channelPage.close()
			return !offline?.includes("offline")
		} catch(_) {
			await channelPage.close()
			return true
		}
	default:
		return false
	}
}

