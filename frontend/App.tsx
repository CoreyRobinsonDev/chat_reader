import { createRoot } from "react-dom/client"
import KickChat from "./components/KickChat"
import { useState, type JSX } from "react"
import { FaTwitch, FaTwitter, FaYoutube } from "react-icons/fa"
import { SiKick } from "react-icons/si"

type Icon = {
    [U: string]: JSX.Element
}

function App() {
    const [selectedPlatform, setSelectedPlatform] = useState(localStorage.getItem("platform") ?? "TWITCH")
    const icon: Icon = {
        TWITCH: <FaTwitch />,
        TWITTER: <FaTwitter />,
        KICK: <SiKick />,
        YOUTUBE: <FaYoutube />
    }

    const setPlatform = (platform: string) => {
        setSelectedPlatform(platform)
        localStorage.setItem("platform", platform)
    }



    return <div className="container" data-platform={selectedPlatform}>
        <header className="header">
            <div className="header_group">
                <div className="input-contianer">
                    <span className="icon">
                        {icon[selectedPlatform]}
                    </span>
                    <input 
                        className="streamer-input"
                        type="text" 
                        placeholder="Find streamer..." 
                    />
                </div>
                <ul className="icon_menu">
                    <li data-platform="TWITCH" className="icon_menu_item" onClick={() => setPlatform("TWITCH")}><span>{icon.TWITCH}</span> </li>
                    <li data-platform="TWITTER" className="icon_menu_item" onClick={() => setPlatform("TWITTER")}><span>{icon.TWITTER}</span> </li>
                    <li data-platform="KICK" className="icon_menu_item" onClick={() => setPlatform("KICK")}><span>{icon.KICK}</span> </li>
                    <li data-platform="YOUTUBE" className="icon_menu_item" onClick={() => setPlatform("YOUTUBE")}><span>{icon.YOUTUBE}</span> </li>
                </ul>
            </div>
       </header>
        <section className="chat-container">
        </section>
    </div>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
