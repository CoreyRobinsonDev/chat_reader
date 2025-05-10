import { atomWithStorage } from "jotai/utils"
import { type ChatExtended, type Streamer } from "./util/types"
import { atom } from "jotai"

export const streamerList = atomWithStorage<Streamer[]>("streamerList", [])
export const streamerListHistory = atomWithStorage<Streamer[]>("streamerListHistory", [])
export const fetchToggle = atom(false) 
export const queriedMessages = atom<ChatExtended[]>([])
export const profileUrls = atom<{[U: string]: string;}>({})
