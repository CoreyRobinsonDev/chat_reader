import { useCallback, useEffect, useState } from "react";
import type { Chat } from "../../backend/types";
import type { Streamer } from "../util/types";
import { useAtomValue } from "jotai";
import { streamerList } from "../atoms";
import { Button } from "./ui/button";

// const domain = "localhost:3000"
const domain = "streamfeed.chat"

export function FetchBtn(
    {setChatMessages, setProfileUrls}:
    {
        setChatMessages: React.Dispatch<React.SetStateAction<(Chat & {
            name: string,
            platform: Streamer["platform"],
        })[]>>,
        setProfileUrls: React.Dispatch<React.SetStateAction<{
            [U: string]: string;
        }>>
    }
) {
    const streamers = useAtomValue(streamerList)
    // const [streamers, setStreamers] = useState(streamerListFromStore)
    const [queriedStreamers, setQueriedStreamers] = useState<Streamer[]>([])

    // useEffect(() => {
    //     setStreamers(streamerListFromStore)
    //     console.log("from effect:", streamers)
    //     console.log("from effect:", streamerListFromStore)
    // }, [streamerListFromStore])

    const queryStreamers = () => {
        const delta = streamers.filter(s => !queriedStreamers.some(qs => qs.name === s.name && qs.platform === s.platform))

        for (let i = 0; i < delta.length; i++) {
            const chatWorker = new Worker(URL.createObjectURL(chatBlob))
            const profileWorker = new Worker(URL.createObjectURL(profileBlob))
            chatWorker.postMessage(delta[i])
            profileWorker.postMessage(delta[i])

            chatWorker.onmessage = (e: MessageEvent<(Chat & {name: string, platform: Streamer["platform"]})[]>) => {
                setChatMessages(prev => {
                    // NOTE: would be cool to up the array length but limit the displayed amount, but allow chatter logs search
                    if (prev.length > 150) {
                        return [...prev.slice(-150), ...e.data]
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
    >Connect</Button>
}

const profileBlob = new Blob([
    `
    self.onmessage = async (e) => {
        const platform = e.data.platform
        const name = e.data.name

        const profileUrl = await fetch(\`https://${domain}/api/\$\{platform.toLowerCase()\}/\$\{name.toLowerCase()\}/profile\`)
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

        const ws = new WebSocket(\`wss://${domain}/api/\$\{platform.toLowerCase()\}/\$\{name.toLowerCase()\}/chat\`)

        ws.addEventListener("message", e => {
            const data = JSON.parse(e.data).map(item => {
                item.name = name
                item.platform = platform
                return item
            })
            postMessage(data)
        })

        ws.addEventListener("close", e => {
            postMessage([{
                name,
                platform,
                userName: "Error",
                userColor: [255,8,10],
                content: \`(\$\{e.code\}) \$\{e.reason\}\`
            }])
        })

        postMessage([{
            name,
            platform,
            userName: "Info",
            userColor: [0,80,255],
            content: \`Connecting to \$\{name\}'s chat on \$\{platform.toLowerCase()\}...\`
        }])
    }
`
], {type: "application/typescript"})
