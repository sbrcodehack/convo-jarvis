let vad;
let mediaStream;
let recorder;

let finalChunks = [];
let currentChunk = null;

// ⏱️ 2 minutes = 120000 ms
const SAVE_INTERVAL = 10000;

let saveTimer;

async function startListening() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  recorder = new MediaRecorder(mediaStream);

  recorder.ondataavailable = (e) => {
    currentChunk = e.data;
  };

  recorder.start(500); // capture every 500ms

  // 🔥 VAD setup
  vad = await vadWeb.VAD.create({
    stream: mediaStream,

    onSpeechStart: () => {
      console.log("🟢 Human voice started");
    },

    onSpeechEnd: () => {
      console.log("🔴 Human voice ended");
    },

    onFrameProcessed: (probs) => {
      if (probs.isSpeech && currentChunk) {
        finalChunks.push(currentChunk);
      }

      document.getElementById("status").innerText =
        probs.isSpeech ? "🟢 Speaking" : "🔴 Silent";
    }
  });

  vad.start();

  // ⏱️ Start auto-save timer
  saveTimer = setInterval(saveRecording, SAVE_INTERVAL);
}

function saveRecording() {
  if (finalChunks.length === 0) {
    console.log("No voice detected in this interval");
    return;
  }

  const blob = new Blob(finalChunks, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  document.getElementById("recordings").appendChild(audio);

  console.log("✅ Auto-saved 2-minute voice chunk");

  // 🔥 Reset buffer for next interval
  finalChunks = [];
}

function stopListening() {
  vad.pause();
  recorder.stop();
  clearInterval(saveTimer);

  // Save remaining data
  saveRecording();

  console.log("⛔ Stopped completely");
}
