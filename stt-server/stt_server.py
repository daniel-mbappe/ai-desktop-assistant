import socketio
import vosk
import sys
import json

sio = socketio.Server(cors_allowed_origins="*")
app = socketio.WSGIApp(sio)

# Load Vosk model
MODEL_PATH = "./models/vosk-model-small-en-us-0.15"  # adjust if needed
sample_rate = 16000
model = vosk.Model(MODEL_PATH)

recognizer = vosk.KaldiRecognizer(model, sample_rate)


@sio.event
def connect(sid, environ):
    print(f"🔗 Client connected: {sid}")


@sio.on("audio_chunk")
def handle_audio_chunk(sid, data):
    global recognizer
    if recognizer.AcceptWaveform(data):
        res = json.loads(recognizer.Result())
        sio.emit("stt_result", res, to=sid)
    else:
        res = json.loads(recognizer.PartialResult())
        sio.emit("stt_partial", res, to=sid)


@sio.on("end_stream")
def handle_end_stream(sid):
    """
    Called when frontend stops mic.
    Finalizes recognition and resets recognizer.
    """
    global recognizer
    print(f"🛑 End of stream from {sid}")

    final_res = json.loads(recognizer.FinalResult())
    sio.emit("stt_final", final_res, to=sid)

    # Reset recognizer for next session
    recognizer = vosk.KaldiRecognizer(model, sample_rate)


@sio.event
def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")


if __name__ == "__main__":
    import eventlet
    import eventlet.wsgi

    print("🚀 Vosk STT server running on http://localhost:5000")
    eventlet.wsgi.server(eventlet.listen(("localhost", 5000)), app)
