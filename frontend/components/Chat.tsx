import { type JSX  } from "react"

import Twitter from "../components/ui/icons/Twitter"
import Twitch from "../components/ui/icons/Twitch"
import Kick from "../components/ui/icons/Kick"
import Youtube from "../components/ui/icons/Youtube"
import { Card, CardContent } from "./ui/card"
import type { Chat, } from "../../backend/types"
import useChatScroll from "../hooks/useChatScroll"
import type { ChatExtended } from "../util/types"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { useAtomValue } from "jotai"
import { profileUrls as pu, queriedMessages } from "../atoms"




export default function Chat() {
    const chatMessages = useAtomValue(queriedMessages)
    const profileUrls = useAtomValue(pu)
    const ref = useChatScroll()

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
        TWITTER: <Twitter data-platform="TWITTER" className="w-5 text-brand-fg"/>,
        KICK: <Kick data-platform="KICK" className="w-5 text-brand"/>,
        YOUTUBE: <Youtube data-platform="YOUTUBE" className="w-5 text-brand"/>
    }

    return <p data-platform={chatMsg.platform} 
        className="flex gap-1 border-l-4 border-brand pl-1"
    >
        <span className="flex gap-x-1 flex-wrap align-middle" data-meta={JSON.stringify(chatMsg)}>
            <Avatar>
                <AvatarImage className="w-5 h-5 rounded m-auto" src={profileUrls[chatMsg.name+chatMsg.platform]} alt={chatMsg.name} />
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

