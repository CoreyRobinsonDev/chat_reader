import { useEffect, useState } from "react";
import type { Chat } from "../../backend/types";
import type { Streamer } from "../util/types";


const blob = new Blob([
    `
    self.onmessage = (e) => {
        postMessage(e.data.platform + e.data.name)
        console.log("from worker:", e.data.name)
    }
`
], {type: "application/typescript"})


export default function useFetchChat(streamers: Streamer[]) {
    console.count("useFetchChat")
    const [state, setState] = useState<Chat[]>([])

    useEffect(() => {
        for (let i = 0; i < streamers.length; i++) {
            const w = new Worker(URL.createObjectURL(blob))
            w.postMessage(streamers[i])

            w.onmessage = (e: MessageEvent<Chat>) => {
                setState(prev => {
                    let temp = [...prev]
                    temp[i] = e.data
                    return temp
                })
            }
        }
    },[])

    return state.flat()
}
