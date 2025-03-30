import { Browser, executablePath, Page, type LaunchOptions } from "puppeteer";
import stealthPlugin from "puppeteer-extra-plugin-stealth"
import puppeteer from "puppeteer-extra"
import { Err, Ok, Result, type Chat } from "./types.ts";


const MAX_TIMEOUT: number = 10_000
const CONFIG: LaunchOptions = {
	args: ["--no-sandbox", "--disable-setuid-sandbox"],
	defaultViewport: { width: 1980, height: 1024 },
	slowMo: 50, 
	executablePath: executablePath(),
	headless: true, 
}

export async function kick(page: Page): Promise<Result<Chat[]>> {
	let chat: Chat[]
	try {
	chat = await page.$$eval("div.chat-entry > div", chats => {
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
			let emoteContainer: Chat["emoteContainer"] = {}
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
				emoteContainer: Object.keys(emoteContainer).length > 0 ? emoteContainer : undefined
			}
		})
	}) ?? []
	} catch(e: any) {
		return Err(e.message)
	}

	return Ok(chat.reverse().filter(el => el.userName !== "ERR" || el.content.length !== 0))
}

export async function initBrowser(): Promise<Result<Browser>> {
	puppeteer.use(stealthPlugin())
	let browser: Browser

	try {
		browser = await puppeteer.launch(CONFIG)
		return Ok(browser)
	} catch(e: any) {
		return Err(e)
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



