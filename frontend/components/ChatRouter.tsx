import Chat from "./Chat";

export default function ChatRouter(
    {streamerList, setStreamerList}: {
        streamerList: {platform: string, streamer: string }[],
        setStreamerList: React.Dispatch<React.SetStateAction<{
            streamer: string;
            platform: string;
        }[]>>
    }
) {

    return <>
        <section className="chat-container">
            {streamerList.length > 0
                ? <Chat streamerList={streamerList} setStreamerList={setStreamerList} />
                : <></>}
        </section>
    </>
}
