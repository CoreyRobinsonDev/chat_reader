import { Database } from "bun:sqlite"

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

export function openDB() {
    return new Database("db.sqlite", {
        strict: true,
        create: true
    })
}

export function getCookies(req: Request) {
    const cookies = req.headers.get("Cookie") ?? ""
    const cookiesObj: {[U: string]: string | undefined } = {}


    for (const cookie of cookies!.split("; ")) {
        const [key, val] = cookie.split("=")
        cookiesObj[key] = val
    }

    return cookiesObj
}
