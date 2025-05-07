import { CheckIcon, ChevronsUpDown, X } from "lucide-react"

import * as React from "react"

import { Button } from "./button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover"
import Twitter from "./icons/Twitter"
import Twitch from "./icons/Twitch"
import Kick from "./icons/Kick"
import Youtube from "./icons/Youtube"
import { useAtom } from "jotai"

import { streamerListHistory as slh, streamerList } from "../../atoms"
import type { Streamer } from "../../util/types"


export default function ComboboxWithCheckbox() {
    console.count("ComboboxWithCheckbox")
    const [open, setOpen] = React.useState(false)
    const [input, setInput] = React.useState("")
    const [streamerListHistory, setStreamerListHistory] = useAtom(slh)
    const [selectedStreamers, setSelectedStreamers] = useAtom(streamerList)

    const inputRef = React.useRef<HTMLInputElement>(null)

    // FIX: clicks to removeStreamer props up and runs addStreamer so the selectedStreamer isn't removed
    const removeStreamer = React.useCallback((platform: Streamer["platform"], name: string) => {
        setSelectedStreamers((prev) => prev.filter(streamer => streamer.name !== name || streamer.platform !== platform))
        setStreamerListHistory((prev) => prev.filter(streamer => streamer.name !== name || streamer.platform !== platform))
    },[])

    const addStreamer = React.useCallback((platform: Streamer["platform"], name: string) => {
        setStreamerListHistory((prev) => {
            if (
                !prev.some(streamer => streamer.platform === platform && streamer.name === name)
                && name !== ""
            ) {
                return [...prev, {platform, name}]
            } else { return prev }
        })
        inputRef.current!.focus()
    }, [])

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "/") {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="noShadow"
                    role="combobox"
                    aria-expanded={open}
                    className="w-200 min-w-[280px] max-w-[97%] justify-between m-auto bg-main-foreground text-main shadow-shadow"
                >
                    {selectedStreamers.length > 0
                        ? selectedStreamers.map((streamer) => streamer.name).join(", ")
                        : "Select streamers..."}
                    <span className="flex gap-3">
                        <ChevronsUpDown className="m-auto text-muted-foreground" />
                        <span className="px-1 py-.5 border-dotted border-2 opacity-50">/</span>
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 border-0" align="start">
                <Command className="**:data-[slot=command-input-wrapper]:h-11">
                    <CommandInput ref={inputRef} placeholder="Search streamer..." onValueChange={(val) => setInput(val)} />
                    <CommandList>
                        <CommandEmpty>
                            <p className="pb-2">Add Streamer</p>
                        </CommandEmpty>
                        <CommandGroup className="p-2 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1 border-y-1 border-main-foreground">
                            {streamerListHistory.map((streamer) => (
                                <CommandItem
                                    key={streamer.name+streamer.platform}
                                    value={JSON.stringify(streamer)}
                                    className="group flex justify-between w-full"
                                    onSelect={(val) => {
                                        const currentStreamer: Streamer = JSON.parse(val)
                                        setSelectedStreamers(prev => 
                                            prev.some(item => item.name === currentStreamer.name && item.platform === currentStreamer.platform) 
                                            ? prev.filter(item => item.name !== currentStreamer.name || item.platform !== currentStreamer.platform)
                                            : [...prev, currentStreamer]
                                        )
                                    }}
                                >
                                    <div className="flex align-middle gap-2">
                                        <div
                                            className="grid place-content-center border-main-foreground pointer-events-none size-5 shrink-0 rounded-base border-2 transition-all select-none *:[svg]:opacity-0 data-[selected=true]:*:[svg]:opacity-100"
                                            data-selected={selectedStreamers.some(
                                                (f) => f.name === streamer.name && f.platform === streamer.platform
                                            )}
                                        >
                                            <CheckIcon className="size-4 text-current" />
                                        </div>
                                        <span className="flex gap-2 align-middle">
                                            <span 
                                                data-platform={streamer.platform}
                                                className="text-xs bg-brand text-brand-fg font-bold rounded-sm p-1"
                                            >{streamer.platform.toLowerCase()}</span>
                                            <span>{streamer.name}</span>
                                        </span>
                                    </div>
                                    <span className="cursor-pointer" onClick={() => removeStreamer(streamer.platform, streamer.name)}>
                                        <X className="flex align-middle group-hover:opacity-100 opacity-0" />
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <div className="flex gap-2 justify-evenly flex-wrap p-2">
                    <Button 
                        className="truncate w-fit max-w-full border-black" 
                        variant="reverse" 
                        onClick={() => addStreamer("TWITCH", input)}
                    ><Twitch />{input}</Button>
                    <Button 
                        className="truncate w-fit max-w-full border-black" 
                        variant="reverse" 
                        onClick={() => addStreamer("KICK", input)}
                    ><Kick />{input}</Button>
                    <Button 
                        className="truncate w-fit max-w-full border-black" 
                        variant="reverse" 
                        onClick={() => addStreamer("YOUTUBE", input)}
                    ><Youtube />{input}</Button>
                    <Button 
                        className="truncate w-fit max-w-full border-black" 
                        variant="reverse" 
                        onClick={() => addStreamer("TWITTER", input)}
                    ><Twitter />{input}</Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
