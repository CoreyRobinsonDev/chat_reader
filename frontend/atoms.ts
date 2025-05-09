import { atomWithStorage } from "jotai/utils"
import { type Streamer } from "./util/types"
import { atom } from "jotai"

export const streamerList = atomWithStorage<Streamer[]>("streamerList", [])
export const streamerListHistory = atomWithStorage<Streamer[]>("streamerListHistory", [])
export const fetchToggle = atom(false) 



