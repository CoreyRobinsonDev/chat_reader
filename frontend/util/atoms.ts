import { atomWithStorage } from "jotai/utils"
import { type Streamer } from "./util/types"

export const streamerList = atomWithStorage<Streamer[]>("streamerList", [])


