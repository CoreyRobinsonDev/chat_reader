import type { Server } from "bun"
import type { Method, Route } from "./types"

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

