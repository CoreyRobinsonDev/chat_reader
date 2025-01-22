import { Code } from "./types";



export function diff(arr1: string[], arr2: string[]): string[] {
	const diffResult: {
		added: string[];
		removed: string[];
		unchanged: string[];
	} = {
		added: [],
		removed: [],
		unchanged: [],
	};
	const visited = new Set<number>();

	for (const el of arr1) {
		const idx = arr2.findIndex((el, idx) => el === el && !visited.has(idx));
		if (idx !== -1) {
			diffResult.unchanged.push(el);
		  	visited.add(idx);
		} else {
		  	diffResult.removed.push(el);
		}
	}

	arr2.forEach((el, idx) => {
		if (!visited.has(idx)) {
		  	diffResult.added.push(el);
		}
	});

	return diffResult.added;
}


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

