import { BROWSER } from "./main.ts";

export function Ok<T>(result: T): Result<T> {
	return new Result(result, undefined)
}

export function Err<T>(msg: string): Result<T> {
	return new Result<T>(undefined, new Error(msg))
}

export class Result<T> {
	ok: T | undefined
	err: Error | undefined

	constructor(ok: T | undefined, err: Error | undefined) {
		this.ok = ok
		this.err = err
	}

	async unwrap(): Promise<T> {
		if (typeof this.ok === "undefined" && this.err) {
			console.error(this.err.message)
			await BROWSER.close()
			Deno.exit(1)
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occured on an empty Result")
			await BROWSER.close()
			Deno.exit(1)
		} else {
			return this.ok!
		}
	}

	async unwrapOr(or: T): Promise<T> {
		if (typeof this.ok === "undefined" && this.err) {
			return or
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occured on an empty Result")
			await BROWSER.close()
			Deno.exit(1)
		} else {
			return this.ok!
		}
	}

	hasErr(): boolean {
		return !!this.err && !this.ok
	}
}
