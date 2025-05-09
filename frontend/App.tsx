import { createRoot } from "react-dom/client"

import ComboboxWithCheckbox from "./components/ui/combobox"
import Chat from "./components/Chat"
import type { Streamer } from "./util/types"
import type { Chat as ChatType } from "../backend/types"
import { useState } from "react"
import { FetchBtn } from "./components/FetchBtn"


function App() {
    const [chatMessages, setChatMessages] = useState<(ChatType & {name: string, platform: Streamer["platform"]})[]>([])
    const [profileUrls, setProfileUrls] = useState<{[U: string]: string}>({})

    return <main className="flex flex-col align-middle gap-4 p-4 w-screen max-h-screen">
        <div className="w-200 max-w-[97%] flex gap-4 m-auto">
            <ComboboxWithCheckbox /> 
            <FetchBtn setChatMessages={setChatMessages} setProfileUrls={setProfileUrls} />
        </div>
        <Chat chatMessages={chatMessages} profileUrls={profileUrls} />
    </main>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
