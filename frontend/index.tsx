import { createRoot } from "react-dom/client"
import App from "./app"
import Test from "./Test"

document.addEventListener("DOMContentLoaded", () => {
	const root = createRoot(document.getElementById("root")!)
	root.render(<Test/>)
})
