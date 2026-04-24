let audioContext;
let analyser;
let microphone;
let dataArray;

let mediaRecorder;
let audioChunks = [];

let isSpeaking = false;
let silenceTimer = null;

const THRESHOLD = 25; // 🔧 adjust this

async function startListening() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  microphone = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

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

  analyser.getByteFrequencyData(dataArray);

  let volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

  document.getElementById("volume").innerText = volume.toFixed(2);

  if (volume > THRESHOLD) {
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
      }, 2000); // 2 sec silence
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
