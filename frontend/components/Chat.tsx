import { useEffect, useRef } from "react"
import type { Chat } from "../../backend/types"
import { FaTwitch, FaTwitter, FaYoutube, FaInfoCircle } from "react-icons/fa"
import { SiKick } from "react-icons/si"
import type { JSX } from "react"
import useFetchChats from "../hooks/useFetchChat"

export default function Chat({streamerList}: {streamerList: {platform: string, streamer: string}[]}) {
    const chatStreams = useFetchChats(streamerList)
    const messageEnd = useRef<HTMLDivElement>(null)

    const icon: {[U: string]: JSX.Element} = {
        TWITCH: <FaTwitch />,
        TWITTER: <FaTwitter />,
        KICK: <SiKick />,
        YOUTUBE: <FaYoutube />
    }

    useEffect(() => {
        const t = setTimeout(() => {
            messageEnd.current?.scrollIntoView({behavior: "smooth"})
        }, 300)
        return () => clearTimeout(t)
    }, [chatStreams])

    return <section className="chat">
        <ul className="message-list">
            {chatStreams.length > 0
                ? chatStreams.map((chatStream, i) => 
                    chatStream.chat.map((item, key) => <li className="message" key={`chat-${i}${key}`}>
                    <span className="message-content">
                    <span title={chatStream.streamer} data-platform={chatStream.platfrom} className="mini-icon">{icon[chatStream.platfrom]}</span>
                    <span 
                        className="message-username"
                        style={{color: `rgb(${item.userColor[0]},${item.userColor[1]},${item.userColor[2]})`}}
                    >{item.userName}</span>:
                        {
                        item.content.split(" ").map(word => typeof item?.emoteContainer?.[word] !== "undefined"
                            ? <img title={word} src={item.emoteContainer[word]} alt={word} width="32px" height="32px" />
                            : <span>{word}</span>)
                    }</span></li>))
                : <span className="message">
                    <span className="mini-icon"><FaInfoCircle /></span>
                    <span style={{color: "dodgerblue"}}>Info</span>: Connecting to chat...
                </span>}
            <div ref={messageEnd}></div>
        </ul>
        <ul>
            {streamerList.map((dat, key) => <button className="streamer-list" key={key}>
                <span className="mini-icon" data-platform={dat.platform}>{icon[dat.platform]}</span>
                <span>{dat.streamer}</span>
            </button>)}
        </ul>
    </section>
}
