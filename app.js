let audioContext;
let analyser;
let microphone;
let dataArray;

let mediaRecorder;
let stream;

let isSpeaking = false;

// 🔧 Tune these
const RMS_THRESHOLD = 0.02;
const SMOOTHING = 0.8;
const SILENCE_DELAY = 1500;

let smoothedVolume = 0;
let silenceTimer = null;

// 🔥 Store ONLY voice chunks
let finalChunks = [];
let tempChunks = [];

async function startListening() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  microphone = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = 2048;
  dataArray = new Uint8Array(analyser.fftSize);

  microphone.connect(analyser);

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    tempChunks.push(event.data);
  };

  mediaRecorder.start(500); // collect every 500ms

  detectVoice();
}

function detectVoice() {
  requestAnimationFrame(detectVoice);

  analyser.getByteTimeDomainData(dataArray);

  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let normalized = (dataArray[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }

  let rms = Math.sqrt(sumSquares / dataArray.length);

  smoothedVolume = SMOOTHING * smoothedVolume + (1 - SMOOTHING) * rms;

  document.getElementById("volume").innerText = smoothedVolume.toFixed(4);

  if (smoothedVolume > RMS_THRESHOLD) {
    document.getElementById("status").innerText = "🟢 Speaking";

    isSpeaking = true;
    clearTimeout(silenceTimer);

  } else {
    document.getElementById("status").innerText = "🔴 Silent";

    if (isSpeaking) {
      silenceTimer = setTimeout(() => {
        isSpeaking = false;
      }, SILENCE_DELAY);
    }
  }

  processChunks();
}

function processChunks() {
  if (tempChunks.length > 0) {
    if (isSpeaking) {
      // ✅ Keep only voice chunks
      finalChunks.push(...tempChunks);
    }
    // ❌ Discard noise chunks automatically
    tempChunks = [];
  }
}

// 🔥 Final export (ONE FILE)
function stopAndSave() {
  mediaRecorder.stop();

  const blob = new Blob(finalChunks, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  document.getElementById("recordings").appendChild(audio);

  console.log("✅ Final voice-only recording saved");
}
