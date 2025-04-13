import type { Failure, Result, Success } from "./types"

export const Resp = {
	Ok(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 200,
				message: msg ?? "Ok",
			}), 
			{status: 200}
		)
	},
	BadRequest(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 400,
				message: msg ?? "Bad Request",
			}), 
			{status: 400}
		)
	},
    Unauthorized(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 401,
				message: msg ?? "Unauthenticated",
			}), 
			{status: 401}
		)
    },
	NotFound(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 404,
				message: msg ?? "Not Found",
			}), 
			{status: 404}
		)
	},
	MethodNotAllowed(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 405,
				message: msg ?? "Method Not Allowed",
			}), 
			{status: 405}
		)
	},
	InternalServerError(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 500,
				message: msg ?? "Internal Server Error",
			}), 
			{status: 500}
		)
	}
}

export const log = {
    info: (msg: any) => {
        const date = new Date()
        const hour = ('0'+date.getHours()).slice(-2)
        const min = ('0'+date.getMinutes()).slice(-2)
        const sec = ('0'+date.getSeconds()).slice(-2)
        const mon = ('0'+date.getMonth()).slice(-2)
        const day = ('0'+date.getDate()).slice(-2)

        if (typeof msg === "string") {
            const lines = msg.split("\n")

            for (const line of lines) {
                console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[34mINF\x1b[0m :`, line)
            }
        } else {
            console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[34mINF\x1b[0m :`, msg)
        }
        

    },
    debug: (msg: any) => {
        const date = new Date()
        const hour = ('0'+date.getHours()).slice(-2)
        const min = ('0'+date.getMinutes()).slice(-2)
        const sec = ('0'+date.getSeconds()).slice(-2)
        const mon = ('0'+date.getMonth()).slice(-2)
        const day = ('0'+date.getDate()).slice(-2)

        if (typeof msg === "string") {
            const lines = msg.split("\n")

            for (const line of lines) {
                console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[33mDBG\x1b[0m :`, line)
            }
        } else {
            console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[33mDBG\x1b[0m :`, msg)
        }
    },
    error: (msg: any) => {
        const date = new Date()
        const hour = ('0'+date.getHours()).slice(-2)
        const min = ('0'+date.getMinutes()).slice(-2)
        const sec = ('0'+date.getSeconds()).slice(-2)
        const mon = ('0'+date.getMonth()).slice(-2)
        const day = ('0'+date.getDate()).slice(-2)

        if (typeof msg === "string") {
            const lines = msg.split("\n")

            for (const line of lines) {
                console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[31mERR\x1b[0m :`, line)
            }
        } else {
            console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[31mERR\x1b[0m :`, msg)
        }
    },
}

export async function tryCatch<T, E = Error>(
    promise: Promise<T>
): Promise<Result<T, E>> {
    try {
        const data = await promise
        return [ data, undefined ]
    } catch (error) {
        return [ undefined, error as E ]
    }
}

export function unwrap<T>(result: Result<T, Error>): T {
    const [data, err] = result

    if (!data && err) {
        log.error(err.message)
        process.exit(1)
    }
    return data!
}

export function unwrapOr<T>(result: Result<T, Error>, substitute: T):  T {
    const [data, err] = result

    if (!data && err) {
        return substitute
    }
    return data!
}

export function unwrapOrElse<T>(result: Result<T, Error>, fn: () => T): T {
    const [data, err] = result

    if (!data && err) {
        return fn()
    }
    return data!
}


export function Ok<T>(data: T): Success<T> {
    return [ data, undefined ]
}

export function Err(error: Error): Failure<Error> {
    return [  undefined, error ]
}
