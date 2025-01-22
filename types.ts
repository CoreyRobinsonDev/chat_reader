import { BROWSER } from "./main.ts";

export type WebSocketData = {
	streamer: string
	platform: Platform
	userIp: string
}

export type Chat = {
	badgeName?: string, 
	badgeImg?: string,
	userName: string,
	userColor: number[],
	content: string,
	emoteContaner?: {[U: string]: string}
}

export type Option<T> = T | undefined

export enum Platform {
	KICK = "KICK",
	TWITCH = "TWITCH",
	TWITTER = "TWITTER",
	YOUTUBE = "YOUTUBE"
}

export enum SocketCode {
	MessageProhibited = 4000,
	BadRequest = 4001,
	InternalServerError = 1011
}

export enum Code {
	OK,
	CON,
	MSG,
	ERR
} 

export function Ok<T>(result: T): Result<T> {
	return new Result(result, undefined)
}

export function Err<T>(msg: string): Result<T> {
	return new Result<T>(undefined, new Error(msg))
}

export function match<T>(result: Result<T>, obj: {
	Ok: (val: T) => any | void,
	Err: (e: Error) => any | void
}): any | void {
	if (result.isErr()) {
		return obj.Err(result.unwrapErr())
	} else {
		return obj.Ok(result.unwrap())
	}
}

export class Result<T> {
	private ok: T | undefined
	private err: Error | undefined

	constructor(ok: T | undefined, err: Error | undefined) {
		this.ok = ok
		this.err = err
	}

	unwrap(): T {
		if (typeof this.ok === "undefined" && this.err) {
			console.error(this.err.message)
			BROWSER.close().then(() => process.exit(1))
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occurred on an empty Result")
			BROWSER.close().then(() => process.exit(1))
		}
		return this.ok!
	}

	unwrapOr(or: T): T {
		if (typeof this.ok === "undefined" && this.err) {
			return or
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrapOr occurred on an empty Result")
			BROWSER.close().then(() => process.exit(1))
		}
		return this.ok!
	}

	unwrapErr(): Error {
		if (typeof this.err === "undefined" && this.ok) {
			console.error("An unwrapErr occurred on an Result without an Error")
			BROWSER.close().then(() => process.exit(1))
		} else if (typeof this.err === "undefined" && !this.ok) {
			console.error("An unwrapErr occurred on an empty Result")
			BROWSER.close().then(() => process.exit(1))
		}
		return this.err!
	}

	isErr(): boolean {
		return !!this.err && !this.ok
	}
}

