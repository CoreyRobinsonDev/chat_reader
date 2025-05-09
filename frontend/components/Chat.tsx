import { useEffect, useState, type JSX  } from "react"

import Twitter from "../components/ui/icons/Twitter"
import Twitch from "../components/ui/icons/Twitch"
import Kick from "../components/ui/icons/Kick"
import Youtube from "../components/ui/icons/Youtube"
import { Card, CardContent } from "./ui/card"
import type { Chat, } from "../../backend/types"
import { useAtomValue } from "jotai"
import { streamerList as sl } from "../util/atoms"
import useChatScroll from "../hooks/useChatScroll"
import type { Streamer } from "../util/types"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"

const domain = "localhost:3000"
// const domain = "streamfeed.chat"

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

type ChatExtended = Chat & {
    name: string,
    platform: Streamer["platform"],
}

export default function Chat() {
    const streamers = useAtomValue(sl)
    const [chatMessages, setChatMessages] = useState<ChatExtended[]>([])
    const [profileUrls, setProfileUrls] = useState<{[U: string]: string}>({})
    const ref = useChatScroll()

    useEffect(() => {
        for (let i = 0; i < streamers.length; i++) {
            const chatWorker = new Worker(URL.createObjectURL(chatBlob))
            const profileWorker = new Worker(URL.createObjectURL(profileBlob))
            chatWorker.postMessage(streamers[i])
            profileWorker.postMessage(streamers[i])

            chatWorker.onmessage = (e: MessageEvent<ChatExtended[]>) => {
                setChatMessages(prev => {
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
                        ? {[e.data.name]: e.data.profileUrl}
                        : {[e.data.name]: e.data.profileUrl, ...prev}
                })
            }
        }
    },[streamers])


    return <Card className="w-200 max-w-[97%] max-h-300 m-auto p-2">
        <CardContent 
            className="overflow-y-scroll no-scrollbar w-full"
            ref={ref}
        >
            {
                chatMessages.length === 0
                ? <></>
                : chatMessages
                    .map((chatMsg, i) => <Message key={`chatMsg-${i}`} chatMsg={chatMsg} profileUrls={profileUrls} />)
            }

        </CardContent>
    </Card>
}

function Message({chatMsg, profileUrls}: {chatMsg: ChatExtended, profileUrls: {[U: string]: string}}) {
    const icon: {[U: string]: JSX.Element} = {
        TWITCH: <Twitch data-platform="TWITCH" className="w-5 text-brand" />,
        TWITTER: <Twitter data-platform="TWITTER" className="w-5 text-brand"/>,
        KICK: <Kick data-platform="KICK" className="w-5 text-brand"/>,
        YOUTUBE: <Youtube data-platform="YOUTUBE" className="w-5 text-brand"/>
    }

    return <p data-platform={chatMsg.platform} 
        className="flex gap-1 border-l-4 border-brand pl-1"
    >
        <span className="flex gap-x-1 flex-wrap align-middle" data-meta={JSON.stringify(chatMsg)}>
            <Avatar>
                <AvatarImage className="w-5 h-5 rounded m-auto" src={profileUrls[chatMsg.name]} alt={chatMsg.name} />
                <AvatarFallback>{chatMsg.name[0].toUpperCase() + chatMsg.name.at(-1)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            { chatMsg.badgeImg && <img className="w-5 h-5 m-auto" src={chatMsg.badgeImg} alt={chatMsg.badgeName} />}
            {/*<span data-platform={chatMsg.platform} className="m-y-auto text-brand stroke-brand">{icon[chatMsg.platform]}</span>*/}
            <span>
                <span 
                    style={{color: `rgb(${chatMsg.userColor[0]}, ${chatMsg.userColor[1]}, ${chatMsg.userColor[2]})`}}
                    className="font-bold"
                >{chatMsg.userName}</span>
                <span>:</span>
            </span>
            {
            chatMsg.content.split(" ").map(word => (
                typeof chatMsg.emoteContainer !== "undefined" && typeof chatMsg.emoteContainer[word] !== "undefined"
                ? <img 
                    className="h-8"
                    src={chatMsg.emoteContainer[word]} 
                    alt={word} 
                />
                : <span>{word}</span>
            ))
        }</span>
    </p>
}

