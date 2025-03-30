import type { Option, DbUser } from "./types"
import { log, openDB } from "./util"


export default async function getChat() {
    using db = openDB()
    using query = db.query("select * from user")
    const users = query.all() as DbUser[]
    log.debug(users)
    // console.log(await getUserAccessToken(process.env.TWITCH_REFRESH_TOKEN))
}

async function getUserAccessToken(refreshToken?: string) {
    const redirectURI = "http://localhost:3000"
    const clientID = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET
    const code = process.env.TWITCH_USER_AUTH_CODE
    let json: {
        access_token: string,
        expires_in?: number, 
        refresh_token: string,
        scope: string[],
        token_type: string
    } | { status: number, message: string, error?: string } = Object()

    if (!refreshToken) {
        const res = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `client_id=${clientID}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${redirectURI}`
        })
        json = await res.json()

    }

    const res = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `client_id=${clientID}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`
    })

    json = await res.json()

    return json
}

// NOTE: hit this URL in the browser and grab the value of the `code` param if this token breaks
async function getUserCode() {
    const redirectURI = "http://localhost:3000"
    // TODO: use some crypt library to generate a random set of characters for the `state` parameter
    const state = Math.floor(Math.random() * 1_000_000)
    // NOTE: scope must be URL encoded
    const scope = "user%3Aread%3Achat%20user%3Aread%3Aemotes"
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${redirectURI}&response_type=code&scope=${scope}&state=${state}`

    console.log(url)

}

async function getClientAccessToken(): Promise<Option<string>> {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    })
    const json: {
        access_token: string,
        expires_in: number,
        token_type: string
    } = await res.json()

    return json.access_token
}

