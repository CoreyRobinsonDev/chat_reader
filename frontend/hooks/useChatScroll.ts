import { useEffect, useRef } from "react";

export default function useChatScroll() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const i = setInterval(() => {
            if (ref.current) {
                ref.current.scrollTop = ref.current.scrollHeight
            }
        }, 400)
        return () => clearInterval(i)
    }, [])
    return ref
}
