import { useEffect, useRef } from "react"
import type { Chat } from "../../backend/types"
import { FaTwitch, FaTwitter, FaYoutube, FaInfoCircle } from "react-icons/fa"
import { SiKick } from "react-icons/si"
import { MdCancel } from "react-icons/md"
import type { JSX } from "react"
import useFetchChats from "../hooks/useFetchChat"

export default function Chat(
    {streamerList, setStreamerList}: {
        streamerList: {platform: string, streamer: string }[],
        setStreamerList: React.Dispatch<React.SetStateAction<{
            streamer: string;
            platform: string;
        }[]>>
    }
) {
    const [chatStreams, webSockets, setWebSockets] = useFetchChats(streamerList)
    const messageEnd = useRef<HTMLDivElement>(null)

    const icon: {[U: string]: JSX.Element} = {
        TWITCH: <FaTwitch />,
        TWITTER: <FaTwitter />,
        KICK: <SiKick />,
        YOUTUBE: <FaYoutube />
    }

    const removeStreamer = (platform: string, streamer: string) => {
        setStreamerList(prev => {
            const updated = prev.filter(item => (streamer !== item.streamer || platform !== item.platform))
            localStorage.setItem("streamerList", JSON.stringify(updated))

            // NOTE: adding this logic outside of the useFetchChats hooks because for some reason updating streamerList to an empty array doesn't trigger the useEffect
            if (updated.length === 0) {
                webSockets.forEach(ws => ws.close())
                setWebSockets([])
            }
            return updated 
        })
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
                : <li className="message-content">
                    <span className="mini-icon"><FaInfoCircle /></span>
                    <span style={{color: "dodgerblue"}}>Info</span>: Connecting to chat...
                </li>}
            <div ref={messageEnd}></div>
        </ul>
        <ul>
            {streamerList.map((item, key) => <button className="streamer-list" key={`list-${key}`}>
                <span className="mini-icon" data-platform={item.platform}>{icon[item.platform]}</span>
                <span>{item.streamer}</span>
                <span 
                    tabIndex={0}
                    className="streamer-list_remove" 
                    onClick={() => removeStreamer(item.platform, item.streamer)}
                ><MdCancel /></span>
            </button>)}
        </ul>
    </section>
}

