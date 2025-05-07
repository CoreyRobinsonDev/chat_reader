import { createRoot } from "react-dom/client"

import ComboboxWithCheckbox from "./components/ui/combobox"
import Chat from "./components/Chat"


function App() {

    return <main className="flex flex-col align-middle gap-4 p-4 w-screen max-h-screen">
        <ComboboxWithCheckbox /> 
        <Chat />
    </main>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
