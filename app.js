let vad;
let stream;
let recorder;

let currentChunk = null;
let voiceChunks = [];
let saveTimer;

const SAVE_INTERVAL = 120000; // 2 min

async function start() {
  try {
    document.getElementById("status").innerText = "Initializing...";

    // 🎤 Get mic
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Mic enabled");

    // 🎤 Recorder
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      currentChunk = e.data;
    };
    recorder.start(400);

    // 🔥 IMPORTANT FIX: check vadWeb exists
    if (!window.vadWeb) {
      throw new Error("VAD library not loaded");
    }

    // 🔥 Create VAD with explicit config
    vad = await window.vadWeb.VAD.create({
      stream: stream,
      model: "tiny", // more stable than default

      onSpeechStart: () => {
        document.getElementById("status").innerText = "🟢 Speaking";
      },

      onSpeechEnd: () => {
        document.getElementById("status").innerText = "🔴 Silent";
      },

      onFrameProcessed: (prob) => {
        if (prob.isSpeech && currentChunk) {
          voiceChunks.push(currentChunk);
        }
      }
    });

    vad.start();

    // ⏱ Auto-save
    saveTimer = setInterval(saveRecording, SAVE_INTERVAL);

    document.getElementById("status").innerText = "🎧 Listening...";

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "❌ Error: " + err.message;
  }
}

function saveRecording() {
  if (voiceChunks.length === 0) return;

  const blob = new Blob(voiceChunks, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  document.getElementById("recordings").appendChild(audio);

  voiceChunks = [];
}

function stop() {
  if (vad) vad.pause();
  if (recorder) recorder.stop();
  clearInterval(saveTimer);

  saveRecording();

  document.getElementById("status").innerText = "⛔ Stopped";
}
