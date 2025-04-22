import { createRoot } from "react-dom/client"

import ComboboxWithCheckbox from "./components/ui/combobox"


function App() {
    return <main>
        <ComboboxWithCheckbox /> 
    </main>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
