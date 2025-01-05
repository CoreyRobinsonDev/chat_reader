Deno.serve((req, connInfo) => {
	return router(
		req, connInfo,
		{path: "/kick", handler: getKickChat},
	)
})

function getKickChat(
	req: Request, 
	connInfo: Deno.ServeHandlerInfo<Deno.NetAddr>,
) {
	let timer: number
	console.log(`${connInfo.remoteAddr.hostname}:${connInfo.remoteAddr.port}`)

	const body = new ReadableStream({
		start(controller) {
			timer = setInterval(() => {
				controller.enqueue("Hello, World!\n")
			}, 1000)
		},
		cancel() {
			clearInterval(timer)
		}
	})
	
	return new Response(body.pipeThrough(new TextEncoderStream()), {
		headers: {
			"content-type": "text/plain; charset=utf-8"
		}
	})
}


function router(
	req: Request, 
	connInfo: Deno.ServeHandlerInfo<Deno.NetAddr>,
	...routes: { 
		path: string, 
		handler: Deno.ServeHandler<Deno.NetAddr>
	}[]
) {
	for (const route of routes) {
		if (URL.parse(req.url)?.pathname === route.path) {
			return route.handler(req, connInfo)
		}
	}
	return new Response(
		JSON.stringify({
			status: 404,
			message: `${URL.parse(req.url)?.pathname} Not Found`,
		}), 
		{status: 404}
	)
}

function Ok<T>(result: T): Result<T> {
	return new Result(result, undefined)
}

function Err<T>(msg: string): Result<T> {
	return new Result<T>(undefined, new Error(msg))
}

class Result<T> {
	private ok: T | undefined
	private err: Error | undefined

	constructor(ok: T | undefined, err: Error | undefined) {
		this.ok = ok
		this.err = err
	}

	unwrap() {
		if (typeof this.ok === "undefined" && this.err) {
			console.error(this.err.message)
			Deno.exit(1)
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occured on an empty Result")
			Deno.exit(1)
		} else {
			return this.ok
		}
	}

	unwrapOr(or: T) {
		if (typeof this.ok === "undefined" && this.err) {
			return or
		} else if (typeof this.ok === "undefined" && !this.err) {
			console.error("An unwrap occured on an empty Result")
			Deno.exit(1)
		} else {
			return this.ok
		}
	}
}
