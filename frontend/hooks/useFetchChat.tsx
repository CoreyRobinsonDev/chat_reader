import { useEffect, useState } from "react"
import { type Chat } from "../../backend/types"

type ChatStream = {
    platfrom: string,
    streamer: string,
    chat: Chat[]
}



export default function useFetchChats(streamList: {platform: string, streamer: string}[]
): [ChatStream[], WebSocket[], React.Dispatch<React.SetStateAction<WebSocket[]>>] {
    const domain = "ws://localhost:3000"
    const [chatStream, setChatStream] = useState<ChatStream[]>([])
    const [cachedStreamList, setCachedStreamList] = useState<{platform: string, streamer: string}[]>([])
    const [webSockets, setWebSockets] = useState<WebSocket[]>([])

    useEffect(() => {
        let list: {platform: string, streamer: string}[] = []
        let timeouts: Timer[] = []

        console.log(streamList)
        console.log(cachedStreamList)
        if (streamList.length > cachedStreamList.length) {
            list = streamList.filter((item) => {
                for (const cachedItem of cachedStreamList) {
                    if (item.streamer === cachedItem.streamer 
                        && item.platform === cachedItem.platform
                    ) return false
                }
                return true
            })
        } else if (streamList.length < cachedStreamList.length) {
            setCachedStreamList(prev => {
                return prev.filter((cachedItem) => {
                    for (const item of streamList) {
                        if (cachedItem.streamer === item.streamer 
                            && cachedItem.platform === item.platform
                        ) return true
                    }
                    const idx = webSockets.findIndex((ws) => ws.url.includes(cachedItem.streamer.toLowerCase())
                        && ws.url.includes(cachedItem.platform.toLowerCase()))
                    webSockets[idx]?.close()
                    setWebSockets(prev => {
                        const updated = prev.filter((_, i) => i !== idx)
                        console.log(updated)
                        return updated
                    })
                    console.log(idx)
                    return false
                })
            })
        } else {
            webSockets.forEach(ws => ws.close())
            setWebSockets([])
        }
        setCachedStreamList(streamList)

        for (const entry of list) {
            let ws = new WebSocket("")
            timeouts.push(setTimeout(() => {
                ws = new WebSocket(`${domain}/api/${entry.platform}/${entry.streamer}`)
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
                })

                ws.addEventListener("close", e => {
                    console.log(e)
                    setChatStream(prev => 
                        [...prev, {
                            streamer: entry.streamer, 
                            platfrom: entry.platform, 
                            chat: [{
                                userName: "Error",
                                userColor: [255,0,0],
                                content: `${e.reason ?? "Disconnected"}`
                            }]
                        }]
                    )
                })
            }, 0))
            setWebSockets(prev => {
                const update = [...prev, ws]
                console.log(update) 
                return update
            })
        }
        
        return () => {
            timeouts.forEach(timer => clearTimeout(timer))
        }
        
    }, [streamList])

    return [chatStream, webSockets, setWebSockets]
}
