export function Ok<T>(result: T): Result<T> {
	return new Result(result, undefined)
}

export function Err<T>(msg: string): Result<T> {
	return new Result<T>(undefined, new Error(msg))
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
			Deno.exit(1)
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occured on an empty Result")
			Deno.exit(1)
		} else {
			return this.ok!
		}
	}

	unwrapOr(or: T): T {
		if (typeof this.ok === "undefined" && this.err) {
			return or
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occured on an empty Result")
			Deno.exit(1)
		} else {
			return this.ok!
		}
	}
}
