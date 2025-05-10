import { Card } from "./ui/card";
import type { Streamer } from "../util/types";
import { type JSX  } from "react"

import Twitter from "../components/ui/icons/Twitter"
import Twitch from "../components/ui/icons/Twitch"
import Kick from "../components/ui/icons/Kick"
import Youtube from "../components/ui/icons/Youtube"

export default function StreamerCard({streamer}: {streamer: Streamer}) {
    const icon: {[U: string]: JSX.Element} = {
        TWITCH: <Twitch data-platform="TWITCH" className="w-5 text-brand" />,
        TWITTER: <Twitter data-platform="TWITTER" className="w-5 text-brand-fg"/>,
        KICK: <Kick data-platform="KICK" className="w-5 text-brand"/>,
        YOUTUBE: <Youtube data-platform="YOUTUBE" className="w-5 text-brand"/>
    }

    return <Card className="grow flex flex-row gap-2 p-4 w-fit">
        <span className={`rounded-full w-2 h-2 ${
            streamer.connected === "SUCCESS"
            ? "bg-green-600"
            : streamer.connected === "PENDING"
            ? "bg-yellow-600"
            : "bg-red-600"
            }`}></span>
        <span data-platform={streamer.platform} className="my-auto stroke-brand">{icon[streamer.platform]}</span>
        <h2 className="font-bold text-lg">{streamer.name}</h2>
    </Card>
}
