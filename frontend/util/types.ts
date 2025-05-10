import type { Chat } from "../../backend/types"

export type Streamer = {
    platform: "TWITCH" 
    | "TWITTER"
    | "YOUTUBE"
    | "KICK"
    name: string,
    connected: "SUCCESS" | "FAIL" | "PENDING"
} 

export type ChatExtended = Chat & Streamer
