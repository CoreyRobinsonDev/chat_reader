import { Code } from "./types";

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

export const log = {
    info: (msg: string) => {
        const date = new Date()
        const hour = ('0'+date.getHours()).slice(-2)
        const min = ('0'+date.getMinutes()).slice(-2)
        const sec = ('0'+date.getSeconds()).slice(-2)
        const mon = ('0'+date.getMonth()).slice(-2)
        const day = ('0'+date.getDate()).slice(-2)

        console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[34mINF\x1b[0m : ${msg}`)
    },
    debug: (msg: string) => {
        const date = new Date()
        const hour = ('0'+date.getHours()).slice(-2)
        const min = ('0'+date.getMinutes()).slice(-2)
        const sec = ('0'+date.getSeconds()).slice(-2)
        const mon = ('0'+date.getMonth()).slice(-2)
        const day = ('0'+date.getDate()).slice(-2)

        console.log(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[33mDBG\x1b[0m : ${msg}`)
    },
    error: (msg: string) => {
        const date = new Date()
        const hour = ('0'+date.getHours()).slice(-2)
        const min = ('0'+date.getMinutes()).slice(-2)
        const sec = ('0'+date.getSeconds()).slice(-2)
        const mon = ('0'+date.getMonth()).slice(-2)
        const day = ('0'+date.getDate()).slice(-2)

        console.error(`\x1b[90m[${date.getFullYear()}/${mon}/${day} ${hour}:${min}:${sec}]\x1b[0m \x1b[31mERR\x1b[0m : ${msg}`)
    },
}
