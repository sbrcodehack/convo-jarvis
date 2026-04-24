let audioContext;
let analyser;
let microphone;
let dataArray;

let mediaRecorder;
let audioChunks = [];

let isSpeaking = false;
let silenceTimer = null;

// 🔧 Tune these
const RMS_THRESHOLD = 0.02;   // try 0.01–0.05
const SILENCE_DELAY = 2000;   // ms
const SMOOTHING = 0.8;        // 0–1 (higher = smoother)

let smoothedVolume = 0;

async function startListening() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  microphone = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = 2048; // better resolution
  dataArray = new Uint8Array(analyser.fftSize);

  microphone.connect(analyser);

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = saveAudio;

  detectVoice();
}

function detectVoice() {
  requestAnimationFrame(detectVoice);

  analyser.getByteTimeDomainData(dataArray);

  // 🔥 RMS calculation
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let normalized = (dataArray[i] - 128) / 128; // center at 0
    sumSquares += normalized * normalized;
  }
  let rms = Math.sqrt(sumSquares / dataArray.length);

  // 🔥 smoothing (important!)
  smoothedVolume = SMOOTHING * smoothedVolume + (1 - SMOOTHING) * rms;

  document.getElementById("volume").innerText = smoothedVolume.toFixed(4);

  if (smoothedVolume > RMS_THRESHOLD) {
    document.getElementById("status").innerText = "🟢 Speaking";

    if (!isSpeaking) {
      startRecording();
      isSpeaking = true;
    }

    clearTimeout(silenceTimer);

  } else {
    document.getElementById("status").innerText = "🔴 Silent";

    if (isSpeaking) {
      silenceTimer = setTimeout(() => {
        stopRecording();
        isSpeaking = false;
      }, SILENCE_DELAY);
    }
  }
}

function startRecording() {
  audioChunks = [];
  mediaRecorder.start();
  console.log("🎤 Recording started");
}

function stopRecording() {
  mediaRecorder.stop();
  console.log("⛔ Recording stopped");
}

function saveAudio() {
  const blob = new Blob(audioChunks, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  document.getElementById("recordings").appendChild(audio);
}
