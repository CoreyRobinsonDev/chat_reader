export type Success<T> = [ T, undefined ] 

export type Failure<E> = [ undefined, E ]

export type Result<T, E = Error> = Success<T> | Failure<E>

export type WebSocketData = {
	streamer: string
	platform: Platform
	clientId: string
}

export type Chat = {
	badgeName?: string
	badgeImg?: string
	userName: string
	userColor: number[]
	content: string
	emoteContainer?: {[U: string]: string}
}

export type Option<T> = T | undefined

export enum Platform {
	KICK = "KICK",
	TWITCH = "TWITCH",
	TWITTER = "TWITTER",
	YOUTUBE = "YOUTUBE"
}

export enum SocketCode {
	MessageProhibited = 4000,
	BadRequest = 4001,
	Unauthorized = 4002,
	InternalServerError = 1011
}

