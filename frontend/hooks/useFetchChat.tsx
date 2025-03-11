import { useEffect, useState } from "react"
import { type Option, type Chat } from "../../backend/types"

type ChatStream = {
    platfrom: string,
    streamer: string,
    chat: Chat[]
}

export default function useFetchChats(streamList: {platform: string, streamer: string}[]): ChatStream[] {
    const domain = "ws://localhost:3000"
    const [chatStream, setChatStream] = useState<ChatStream[]>([])
    const [cachedStreamList, setCachedStreamList] = useState<{platform: string, streamer: string}[]>([])

    useEffect(() => {
        const list = streamList.filter((item) => {
            for (const cachedItem of cachedStreamList) {
                if (item.streamer === cachedItem.streamer 
                    && item.platform === cachedItem.platform
                ) return false
            }
            return true
        })
        const timeouts: Timer[] = []
        setCachedStreamList(streamList)

        for (const entry of list) {
            const t = setTimeout(() => {
                switch(entry.platform) {
                case "KICK":
                    const ws = new WebSocket(`${domain}/api/kick/${entry.streamer}`)

                    ws.addEventListener("message", e => {
                        const data = JSON.parse(e.data).reverse()
                        // NOTE: could be a race condition. we'll see
                        setChatStream(prev => 
                            [...prev, {
                                streamer: entry.streamer, 
                                platfrom: entry.platform, 
                                chat: data
                            }]
                        )
                        console.log(data)
                    })

                    ws.addEventListener("close", e => {
                        setChatStream(prev => 
                            [...prev, {
                                streamer: entry.streamer, 
                                platfrom: entry.platform, 
                                chat: [{
                                    userName: "Error",
                                    userColor: [255,0,0],
                                    content: `${e.reason}`
                                }]
                            }]
                        )
                    })

                    return () => ws.close()
                }
            }, 0)
            timeouts.push(t)
        }
        return () => timeouts.forEach(timer => clearTimeout(timer))
    }, [streamList])

    return chatStream
}
