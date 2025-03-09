import { useEffect, useState } from "react"
import { type Option, type Chat } from "../../backend/types"

export default function useFetchChat(platform: string, streamer: string): [Chat[], boolean, Option<string>] {
    const domain = "ws://localhost:3000"
    const [chat, setChat] = useState<Chat[]>([])
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<Option<string>>(undefined)

    useEffect(() => {
        const ws = new WebSocket(`${domain}/api/${platform}/${streamer}`)

        ws.addEventListener("message", e => {
            const data = JSON.parse(e.data).reverse()
            setReady(true)
            setChat(prev => prev ? [...prev, ...data] : data)
            console.log(data)
        })

        ws.addEventListener("close", e => {
            setError(`${e.code}: ${e.reason}`)
        })

        return () => ws.close()
    }, [])

    return [chat, ready, error]
}
