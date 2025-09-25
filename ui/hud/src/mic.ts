import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

let audioContext: AudioContext | null = null;
let processor: ScriptProcessorNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;

export async function startMic() {
  if (audioContext) return;

  // const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // audioContext = new AudioContext();
  // processor = audioContext.createScriptProcessor(4096, 1, 1);
  // source = audioContext.createMediaStreamSource(stream);

  // // High-pass filter
  // const filter = audioContext.createBiquadFilter();
  // filter.type = "highpass";
  // filter.frequency.value = 200; // cut below 200Hz

  // // Gain normalize
  // const gainNode = audioContext.createGain();
  // gainNode.gain.value = 1.2; // tweak if needed

  // source.connect(filter).connect(gainNode).connect(processor);

  // processor.connect(audioContext.destination);
  // processor.onaudioprocess = (event) => {
  //   const input = event.inputBuffer.getChannelData(0);
  //   const pcm16 = floatTo16BitPCM(input);
  //   socket.emit("audio_chunk", pcm16);
  // };



  audioContext = new AudioContext({ sampleRate: 16000 }); // force 16kHz if supported
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  source = audioContext.createMediaStreamSource(stream);

  // ScriptProcessor is deprecated but works in Electron (safer than AudioWorklet for now)
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const pcm16 = floatTo16BitPCM(input);
    socket.emit("audio_chunk", pcm16);
  };

  console.log("🎙️ Mic started");
}

export function stopMic() {
  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (source) {
    source.disconnect();
    source = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  socket.emit("end_stream");
  console.log("🛑 Mic stopped");
}

// 🔽 Conversion utility
function floatTo16BitPCM(float32Array: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

export { socket }
