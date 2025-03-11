import { createRoot } from "react-dom/client"
import { useEffect, useRef, useState, type JSX } from "react"
import { FaTwitch, FaTwitter, FaYoutube, FaSearch } from "react-icons/fa"
import { SiKick } from "react-icons/si"
import ChatRouter from "./components/ChatRouter"


function App() {
    const [selectedPlatform, setSelectedPlatform] = useState(localStorage.getItem("platform") ?? "TWITCH")
    const [streamer, setStreamer] = useState("")
    const [streamerList, setStreamerList] = useState<{streamer: string, platform: string}[]>(
        JSON.parse(localStorage.getItem("streamerList") ?? "[]")  
    )
    const input = useRef<HTMLInputElement>(null)

    const icon: {[U: string]: JSX.Element} = {
        TWITCH: <FaTwitch />,
        TWITTER: <FaTwitter />,
        KICK: <SiKick />,
        YOUTUBE: <FaYoutube />
    }

    const setPlatform = (platform: string) => {
        setSelectedPlatform(platform)
        localStorage.setItem("platform", platform)
        input.current?.focus()
    }

    const formSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (streamer.length === 0 
            || streamerList.filter(item => item.platform === selectedPlatform && item.streamer === streamer.toLowerCase()).length > 0 
        ) return
        setStreamerList(prev => {
            const arr = [...prev, {streamer: streamer.toLowerCase(), platform: selectedPlatform}]
            localStorage.setItem("streamerList", JSON.stringify(arr))
            return arr
        })
        setStreamer("")
    }

    useEffect(() => {
        input.current?.focus()
    }, [])


    return <div className="container" data-platform={selectedPlatform}>
        <header className="header">
            <div className="header_group">
                <div className="input-contianer">
                    <span className="icon">
                        {icon[selectedPlatform]}
                    </span>
                    <form className="streamer-form" onSubmit={(e) => formSubmit(e)}>
                        <input 
                            ref={input}
                            className="streamer-input"
                            type="text" 
                            placeholder="add stream chat..." 
                            value={streamer}
                            onChange={(e) => setStreamer(e.target.value)}
                        />
                        <button type="submit"><FaSearch /></button>
                    </form>
                </div>
                <ul className="icon_menu">
                    <button 
                        data-platform="TWITCH" 
                        className="icon_menu_item" 
                        onClick={() => setPlatform("TWITCH")}>
                        <span>{icon.TWITCH}</span> 
                    </button>
                    <button 
                        data-platform="TWITTER" 
                        className="icon_menu_item" 
                        onClick={() => setPlatform("TWITTER")}>
                        <span>{icon.TWITTER}</span> 
                    </button>
                    <button 
                        data-platform="KICK" 
                        className="icon_menu_item" 
                        onClick={() => setPlatform("KICK")}>
                        <span>{icon.KICK}</span> 
                    </button>
                    <button 
                        data-platform="YOUTUBE" 
                        className="icon_menu_item" 
                        onClick={() => setPlatform("YOUTUBE")}>
                        <span>{icon.YOUTUBE}</span> 
                    </button>
                </ul>
            </div>
        </header>
        <ChatRouter streamerList={streamerList} setStreamerList={setStreamerList} />
    </div>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
