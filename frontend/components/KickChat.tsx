import { useEffect, useState } from "react"
import type { Chat } from "../../backend/types"

export default function KickChat({streamer}: {streamer: string}) {
    const domain = "ws://localhost:3000"
    const [chat, setChat] = useState<Chat[]>()
    const [ready, setReady] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const ws = new WebSocket(`${domain}/api/kick/${streamer}`)

        ws.addEventListener("message", e => {
            const data = JSON.parse(e.data).reverse()
            setReady(true)
            setChat(prev => prev ? [...prev, ...data] : data)
            console.log(data)
        })

        ws.addEventListener("close", e => {
            setError(`${e.code}: ${e.reason}`)
            setHasError(true)
        })

        return () => ws.close()
    }, [])

    if (hasError) {
        return <section>
            <span>{error}</span>
        </section>
    }
    if (ready) {
        return <ul>{chat!.map((item, key) => <li key={`chat-${key}`}>{item.userName}: {item.content}</li>)}</ul>
    } else {
        return <div>Loading...</div>
    }
}
