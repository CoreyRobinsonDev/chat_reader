import Chat from "./Chat";

export default function ChatRouter({streamerList}: {streamerList: {platform: string, streamer: string}[]}) {

    return <>
        <section className="chat-container">
            {streamerList.length > 0
                ? <Chat streamerList={streamerList} />
                : <></>}
        </section>
    </>
}
