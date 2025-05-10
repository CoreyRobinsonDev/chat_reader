import { createRoot } from "react-dom/client"

import ComboboxWithCheckbox from "./components/ui/combobox"
import Chat from "./components/Chat"
import { FetchBtn } from "./components/FetchBtn"
import { useAtomValue } from "jotai"
import { streamerList } from "./atoms"
import StreamerCard from "./components/StreamerCard"


function App() {
    const streamers = useAtomValue(streamerList)

    return <main className="flex flex-col align-middle gap-4 p-4 w-screen max-h-screen">
        <div className="w-200 max-w-[97%] flex gap-4 m-auto">
            <ComboboxWithCheckbox /> 
            <FetchBtn />
        </div>
        <div className="w-200 max-w-[97%] flex gap-4 flex-wrap m-auto">
            {streamers.map((streamer, i) => <StreamerCard key={`streamer-${i}`} streamer={streamer} />)}
        </div>
        <Chat />
    </main>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
