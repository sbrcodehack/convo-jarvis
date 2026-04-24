let vad;
let stream;
let recorder;

let currentChunk = null;
let voiceChunks = [];

let saveTimer;

// 2 minutes
const SAVE_INTERVAL = 10000;

async function start() {
  document.getElementById("status").innerText = "Initializing...";

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 🎤 Recorder
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (e) => {
    currentChunk = e.data;
  };

  recorder.start(400); // collect chunks every 400ms

  // 🔥 VAD setup
  vad = await vadWeb.VAD.create({
    stream: stream,

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

  document.getElementById("status").innerText = "Listening...";
}

function saveRecording() {
  if (voiceChunks.length === 0) {
    console.log("No voice in this interval");
    return;
  }

  const blob = new Blob(voiceChunks, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  document.getElementById("recordings").appendChild(audio);

  console.log("Saved chunk");

  // reset
  voiceChunks = [];
}

function stop() {
  if (vad) vad.pause();
  if (recorder) recorder.stop();
  clearInterval(saveTimer);

  saveRecording();

  document.getElementById("status").innerText = "Stopped";
}
