export const Resp = {
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

export function router(
	req: Request, 
	connInfo: Deno.ServeHandlerInfo<Deno.NetAddr>,
	...routes: { 
		path: string, 
		handler: (connInfo: Deno.ServeHandlerInfo<Deno.NetAddr>, pathParam?: string) => Promise<Response>
	}[]
) {
	for (const route of routes) {
		let urlPathArr = URL.parse(req.url)!.pathname.split("/")
		let routePathArr = route.path.split("/")
		if (urlPathArr.length !== routePathArr.length) continue
		const idx = routePathArr.findIndex((val) => val === "{}")
		let pathParm: string | undefined

		if (idx === -1) {
			if (JSON.stringify(urlPathArr) !== JSON.stringify(routePathArr)) continue 
			return route.handler(connInfo)
		} else {
			pathParm = urlPathArr[idx]
			urlPathArr = urlPathArr.filter((_, i) => i !== idx)
			routePathArr = routePathArr.filter((_, i) => i !== idx)
			if (JSON.stringify(urlPathArr) !== JSON.stringify(routePathArr)) continue 
			return route.handler(connInfo, pathParm)
		}
	}
	return Resp.NotFound(`${URL.parse(req.url)?.pathname} Not Found`)
}

