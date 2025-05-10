import { useEffect, useState } from "react";
import type { ChatExtended, Streamer } from "../util/types";
import { useAtom, useSetAtom } from "jotai";
import { profileUrls, queriedMessages, streamerList } from "../atoms";
import { Button } from "./ui/button";

const domain = "localhost:3000"
// const domain = "streamfeed.chat"

export function FetchBtn() {
    const [streamers, setStreamers] = useAtom(streamerList)
    const [queriedStreamers, setQueriedStreamers] = useState<Streamer[]>([])
    const setChatMessages = useSetAtom(queriedMessages)
    const setProfileUrls = useSetAtom(profileUrls)

    useEffect(() => {
        if (queriedStreamers.length === 0) {
            setStreamers(prev => prev.map(s => {s.connected = "FAIL"; return s}))
        }
    }, [])

    const queryStreamers = () => {
        const delta = streamers.filter(s => !queriedStreamers.some(qs => qs.name === s.name && qs.platform === s.platform))

        for (let i = 0; i < delta.length; i++) {
            const chatWorker = new Worker(URL.createObjectURL(chatBlob))
            const profileWorker = new Worker(URL.createObjectURL(profileBlob))
            chatWorker.postMessage(delta[i])
            profileWorker.postMessage(delta[i])

            chatWorker.onmessage = (e: MessageEvent<ChatExtended[]>) => {
                setStreamers(prev => prev.map(s => {
                    if (s.name === e.data[0].name && s.platform === e.data[0].platform) {
                        s.connected = e.data[0].connected
                    }
                    return s
                }))
                setChatMessages(prev => {
                    // NOTE: would be cool to up the array length but limit the displayed amount to allow chatter logs search
                    if (prev.length > 200) {
                        return [...prev.slice(-200), ...e.data]
                    }
                    return prev.length === 0 ? e.data : [...prev, ...e.data]
                })
            }

            profileWorker.onmessage = (e: MessageEvent<{
                name: string,
                platform: Streamer["platform"],
                profileUrl: string
            }>) => {
                setProfileUrls(prev => {
                    return typeof prev === "undefined"
                        ? {[e.data.name+e.data.platform]: e.data.profileUrl}
                        : {[e.data.name+e.data.platform]: e.data.profileUrl, ...prev}
                })
            }
        }

        setQueriedStreamers(streamers)
    }


    return <Button 
        className="bg-yellow-300 border-black cursor-pointer font-bold mt-1"
        variant="reverse"
        onClick={queryStreamers}
    >{streamers.some(streamer => streamer.connected === "PENDING") ? <span className="spinner"></span> : "Connect"}</Button>
}

const profileBlob = new Blob([
    `
    self.onmessage = async (e) => {
        const platform = e.data.platform
        const name = e.data.name

        const profileUrl = await fetch(\`http://${domain}/api/\$\{platform.toLowerCase()\}/\$\{name.toLowerCase()\}/profile\`)
            .then(res => res.json())

        postMessage({
            name,
            platform,
            profileUrl: profileUrl.message
        })
    }
`
])
const chatBlob = new Blob([
    `
    self.onmessage = async (e) => {
        const platform = e.data.platform
        const name = e.data.name

        const ws = new WebSocket(\`ws://${domain}/api/\$\{platform.toLowerCase()\}/\$\{name.toLowerCase()\}/chat\`)

        ws.addEventListener("message", e => {
            const data = JSON.parse(e.data).map(item => {
                item.name = name
                item.platform = platform
                item.connected = "SUCCESS"
                return item
            })
            postMessage(data)
        })

        ws.addEventListener("close", e => {
            postMessage([{
                name,
                platform,
                connected: "FAIL",
                userName: "Error",
                userColor: [255,8,10],
                content: \`(\$\{e.code\}) \$\{e.reason\}\`
            }])
        })

        postMessage([{
            name,
            platform,
            userName: "Info",
            connected: "PENDING",
            userColor: [0,80,255],
            content: \`Connecting to \$\{name\}'s chat on \$\{platform.toLowerCase()\}...\`
        }])
    }
`
], {type: "application/typescript"})
