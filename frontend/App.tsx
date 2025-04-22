import { createRoot } from "react-dom/client"

import ComboboxWithCheckbox from "./components/ui/combobox"
import useWorker from "./hooks/useWorker"
import { useEffect } from "react"


function App() {
    const num = useWorker(10)

    useEffect(() => {
        console.log(num)
    }, [num])

    return <main>
        <ComboboxWithCheckbox /> 
    </main>
}

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<App/>)
})
