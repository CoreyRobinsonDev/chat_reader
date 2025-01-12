import type { Server } from "bun"
import { Code, Platform, Result, type Option, type Method, type Route, Err, match } from "./types"
import type { Page } from "puppeteer"
import { BROWSER } from "./main"
import { checkIfOnline, goto } from "./scrape"


export function diff(arr1: string[], arr2: string[]): string[] {
	const diffResult: {
		added: string[];
		removed: string[];
		unchanged: string[];
	} = {
		added: [],
		removed: [],
		unchanged: [],
	};
	const visited = new Set<number>();

	for (const el of arr1) {
		const idx = arr2.findIndex((el, idx) => el === el && !visited.has(idx));
		if (idx !== -1) {
			diffResult.unchanged.push(el);
		  	visited.add(idx);
		} else {
		  	diffResult.removed.push(el);
		}
	}

	arr2.forEach((el, idx) => {
		if (!visited.has(idx)) {
		  	diffResult.added.push(el);
		}
	});

	return diffResult.added;
}

export class TabController {
	tabs: Tab[] = []

	getTab(streamer: string) {
		return this.tabs.find(tab => tab.streamer === streamer)
	}

	async connectTab(platform: Platform, streamer: string): Promise<Tab> {
		const tab = this.tabs.find(tab => tab.streamer === streamer)
		if (!tab) {
			const newTab = new Tab(platform, streamer)
			this.tabs.push(newTab)
			return await newTab.openPage()
		} else {
			tab.listeners++
			return tab
		}
	}

	leaveTab(tab: Tab) {
		tab.listeners--	
		if (tab.listeners <= 0) {
			match(tab.page!, {
				Ok: (p) => p.close(),
				Err: () => {}
			})
			this.tabs = this.tabs.filter(t => t.streamer !== tab.streamer)
		}
	}
}

export class Tab {
	platform: Platform
	streamer: string
	listeners: number
	page: Option<Result<Page>>


	constructor(platform: Platform, streamer: string) {
		this.streamer = streamer
		this.listeners = 1
		this.platform = platform
	}

	async openPage(): Promise<this> {
		switch (this.platform) {
		case Platform.KICK:
			if (!this.streamer) {
				this.page = Err("No Kick streamer provided")
				break
			}
			const isOnline = await checkIfOnline(BROWSER, this.platform, this.streamer)
			if (!isOnline) {
				this.page = Err(`Kick streamer ${this.streamer} is offline or doesn't exist`)
				break
			} 
			const page = await goto(BROWSER, `https://kick.com/${this.streamer}/chatroom`)
			if (page.isErr()) {
				this.page = Err(page.unwrapErr().message)
				break
			} else {
				this.page = page
				break
			}
		}
		return this
	}
}

export const Resp = {
	Ok(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 200,
				code: Code.OK,
				message: msg ?? "Ok",
			}), 
			{status: 200}
		)
	},
	BadRequest(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 400,
				code: Code.ERR,
				message: msg ?? "Bad Request",
			}), 
			{status: 400}
		)
	},
	NotFound(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 404,
				code: Code.ERR,
				message: msg ?? "Not Found",
			}), 
			{status: 404}
		)
	},
	MethodNotAllowed(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 405,
				code: Code.ERR,
				message: msg ?? "Method Not Allowed",
			}), 
			{status: 405}
		)
	},
	InternalServerError(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 500,
				code: Code.ERR,
				message: msg ?? "Internal Server Error",
			}), 
			{status: 500}
		)
	}
}

export async function router(
	req: Request, 
	server: Server, 
	routes: Route[], 
	defaultHandler?: (req: Request) => Response
): Promise<Response> {
	const path = new URL(req.url).pathname
	
	for (const route of routes) {
		if (!!route.pattern.match(path)) {
			if (route.method.includes(req.method as Method)) {
				return await route.handler(req, route.pattern.match(path), server)
			} else {
				return Resp.MethodNotAllowed()
			}
		}
	}
	return defaultHandler?.(req) ?? Resp.InternalServerError()
}

