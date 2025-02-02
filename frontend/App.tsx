import { useEffect, useState } from "react"
import type { Chat } from "../backend/types"
import { createRoot } from "react-dom/client"
import Test from "./components/Test"


function App() {
	const domain = "ws://localhost:3000"
	//const domain = "https://chat-reader.fly.dev"
	const [chat, setChat] = useState<Chat[]>()
	const [ready, setReady] = useState(false)

	useEffect(() => {
		const ws = new WebSocket(`${domain}?streamer=classybeef&platform=kick`)

		ws.addEventListener("message", e => {
			const data = JSON.parse(e.data).reverse()
			setReady(true)
			setChat(prev => prev ? [...prev, ...data] : data)
			console.log(data)
		})

		ws.addEventListener("close", e => {
			console.log(`ERROR ${e.code}: ${e.reason}`)
		})

		return () => ws.close()
	}, [])

	if (ready) {
		return <ul>{chat!.map((item, key) => <li key={`chat-${key}`}>{item.userName}: {item.content}</li>)}</ul>
	} else {
		return <div>Loading...</div>
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<Test/>)
})
