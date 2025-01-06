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
	NotFound(msg?: string): Response {
		return new Response(
			JSON.stringify({
				status: 404,
				message: msg ?? "Not Found",
			}), 
			{status: 404}
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

