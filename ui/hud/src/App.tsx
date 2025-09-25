import { useEffect, useState } from 'react';
import { startMic, stopMic, socket } from "./mic";

export default function App() {
  const [listening, setListening] = useState(false);
  const [caption, setCaption] = useState("");
  const [finals, setFinals] = useState<string[]>([]);

  useEffect(() => {
    socket.on("stt_partial", (msg) => {
      if (msg.partial) setCaption(msg.partial);
    });

    socket.on("stt_result", (msg) => {
      if (msg.text) {
        setFinals((prev) => [...prev, msg.text]);
        setCaption(""); // clear partial
      }
    });

    socket.on("stt_final", (msg) => {
      if (msg.text) {
        setFinals((prev) => [...prev, msg.text]);
        setCaption(""); // clear partial
      }
    });

    return () => {
      socket.off("stt_partial");
      socket.off("stt_result");
      socket.off("stt_final");
    };
  }, []);

  useEffect(() => {
    // optional: clean up on unmount
    return () => {
      if (listening) stopMic();
    };
  }, [listening]);

  const toggle = async () => {
    if (!listening) {
      try {
        await startMic().catch((err) => console.log(err));
        setListening(true);
      } catch (err) {
        console.error("Failed to start mic:", err);
      }
    } else {
      stopMic();
      setListening(false);
    }
  };

  // return <></>

  return (
    <div className="w-[300px] rounded-2xl border border-white/20 bg-[rgba(20,20,28,0.7)] backdrop-blur-lg flex flex-col gap-3 p-3 text-white select-none">
      <div className="font-semibold">AI Assistant</div>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20 transition"
          onClick={toggle}
        >
          {listening ? "Stop Listening (PTT)" : "Start Listening (PTT)"}
        </button>

        <button
          className="rounded-lg bg-red-500/80 px-3 py-2 hover:bg-red-600/80 transition"
          onClick={() => (window as any).aiGirl?.quit?.()}
        >
          Quit
        </button>
      </div>

      <div className="w-full flex flex-col gap-3">
        {/* Show live partial */}
        <p className="text-gray-400 italic">{caption}</p>

        {/* Show history of finals */}
        {finals.map((f, i) => (
          <p key={i} className="text-white">
            {f}
          </p>
        ))}
      </div>

      {/* <input
        placeholder="Type a message…"
        className="w-full rounded-md px-2 py-1 focus:outline-none"
      /> */}
    </div>
  );
}
