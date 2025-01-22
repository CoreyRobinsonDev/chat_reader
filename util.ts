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

