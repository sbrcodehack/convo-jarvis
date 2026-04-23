let recognition;
let isListening = false;
let fullTranscript = "";

// Initialize Speech Recognition
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported in this browser");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-IN";

  recognition.onresult = (event) => {
    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    document.getElementById("transcript").innerText = transcript;
    fullTranscript += " " + transcript;
  };

  recognition.onend = () => {
    if (isListening) recognition.start(); // auto restart
  };
}

// Start Listening
function startListening() {
  if (!recognition) initRecognition();

  isListening = true;
  recognition.start();
  document.getElementById("status").innerText = "Status: Listening...";
}

// Stop Listening
function stopListening() {
  isListening = false;
  recognition.stop();
  document.getElementById("status").innerText = "Status: Stopped";
}

// Generate Summary (Basic AI Logic)
function generateSummary() {
  if (!fullTranscript) {
    alert("No data to summarize!");
    return;
  }

  // Simple keyword-based summary (replace later with AI API)
  let words = fullTranscript.split(" ");
  let wordCount = words.length;

  let summary = `
    Total Words Spoken: ${wordCount}
    Sample: ${words.slice(0, 50).join(" ")}...
  `;

  document.getElementById("summary").innerText = summary;
}
