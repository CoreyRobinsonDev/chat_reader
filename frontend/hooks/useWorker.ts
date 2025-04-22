import { useEffect, useState } from "react";


const blob = new Blob([
    `
    self.onmessage = (e) => {
        postMessage(e.data * 2)
    }
`
], {type: "application/typescript"})


export default function useWorker(num: number) {
    const [state, setState] = useState<number[]>([])


    useEffect(() => {
        for (let i = num; i < num+10; i++) {
            const w = new Worker(URL.createObjectURL(blob))
            w.postMessage(i)

            w.onmessage = (e: MessageEvent<number>) => {
                setState(prev => {
                    let temp = [...prev]
                    temp[i-num] = e.data
                    return temp
                })
            }
        }
    },[])

    return state
}
