(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const channel = ("BroadcastChannel" in window) ? new BroadcastChannel("clearcaption-v2") : null;

  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), clearBtn = $("clearBtn");
  const projectorBtn = $("projectorBtn"), languageSelect = $("languageSelect");
  const fontSizeRange = $("fontSizeRange"), fontSizeLabel = $("fontSizeLabel");
  const finalTranscript = $("finalTranscript"), interimTranscript = $("interimTranscript");
  const emptyState = $("emptyState"), captionOutput = $("captionOutput");
  const wordCount = $("wordCount"), downloadBtn = $("downloadBtn");
  const notice = $("notice"), statusText = $("statusText"), liveIndicator = $("liveIndicator");
  const audioFile = $("audioFile"), fileName = $("fileName"), transcribeBtn = $("transcribeBtn");
  const audioStatus = $("audioStatus"), progressTrack = $("progressTrack"), progressBar = $("progressBar");

  let recognition = null, listening = false, shouldRestart = false, projectorWindow = null;
  let finalText = "", interimText = "", recognizerSupported = Boolean(SpeechRecognition);
  let transcriberPromise = null, transcriptionBusy = false;

  function setNotice(message) {
    notice.textContent = message;
    notice.hidden = !message;
  }
  function setStatus(message, active = false) {
    statusText.textContent = message;
    liveIndicator.classList.toggle("active", active);
  }
  function wordTotal(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }
  function broadcast() {
    const payload = {
      type: "caption-update",
      finalText,
      interimText,
      recentLines: finalText.split(/\n+/).filter(Boolean).slice(-5),
      fontSize: Number(fontSizeRange.value),
      status: listening ? "Listening…" : (transcriptionBusy ? "Transcribing recording…" : "Ready")
    };
    if (channel) channel.postMessage(payload);
    // Fallback for browsers where BroadcastChannel is unavailable.
    try { localStorage.setItem("clearcaption-v2-update", JSON.stringify({...payload, sentAt: Date.now()})); } catch (_) {}
  }
  function render() {
    finalTranscript.textContent = finalText;
    interimTranscript.textContent = interimText ? (finalText ? "\n" : "") + interimText : "";
    emptyState.hidden = Boolean(finalText || interimText);
    wordCount.textContent = `${wordTotal(finalText + " " + interimText)} words`;
    downloadBtn.disabled = !finalText.trim();
    $("captionSubhead").textContent = listening ? "Listening for speech…" : (finalText ? "Transcript updated" : "Your words will appear here");
    broadcast();
  }
  function appendFinal(text) {
    const cleaned = (text || "").trim();
    if (!cleaned) return;
    if (finalText && !/\n$/.test(finalText)) finalText += " ";
    finalText += cleaned;
    interimText = "";
    render();
  }
  function stopRecognition() {
    shouldRestart = false;
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch (_) {}
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus(transcriptionBusy ? "Transcribing recording…" : "Ready to start", false);
    render();
  }
  function startRecognition() {
    setNotice("");
    if (!recognizerSupported) {
      setNotice("Live speech recognition is not available in this browser. Try the latest Google Chrome or Microsoft Edge. Recorded-audio transcription may still work.");
      return;
    }
    if (listening) return;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageSelect.value;
      recognition.onstart = () => {
        listening = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        setStatus("Listening to microphone", true);
        render();
      };
      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const phrase = event.results[i][0].transcript;
          if (event.results[i].isFinal) appendFinal(phrase);
          else interim += phrase;
        }
        interimText = interim;
        render();
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldRestart = false;
          setNotice("Microphone permission was denied. Allow microphone access in your browser's site settings, then try again.");
        } else if (event.error === "no-speech") {
          // Quiet periods are normal; let the browser continue.
        } else {
          setNotice(`Speech recognition message: ${event.error}. If recognition stopped, press Start captions again.`);
        }
      };
      recognition.onend = () => {
        listening = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        if (shouldRestart) {
          window.setTimeout(() => { if (shouldRestart) startRecognition(); }, 250);
        } else {
          setStatus(transcriptionBusy ? "Transcribing recording…" : "Ready to start", false);
          interimText = "";
          render();
        }
      };
      shouldRestart = true;
      recognition.start();
    } catch (error) {
      shouldRestart = false;
      setNotice("Could not start speech recognition. Check browser support and microphone permission.");
      setStatus("Unable to start", false);
    }
  }

  startBtn.addEventListener("click", startRecognition);
  stopBtn.addEventListener("click", stopRecognition);
  clearBtn.addEventListener("click", () => {
    finalText = "";
    interimText = "";
    render();
    setNotice("Transcript cleared.");
  });

  fontSizeRange.addEventListener("input", () => {
    fontSizeLabel.textContent = `${fontSizeRange.value} px`;
    broadcast();
  });
  languageSelect.addEventListener("change", () => {
    if (listening) {
      stopRecognition();
      setNotice("Language changed. Press Start captions to resume using the new language.");
    }
  });

  projectorBtn.addEventListener("click", () => {
    projectorWindow = window.open("display.html", "ClearCaptionProjector", "popup=yes,width=1100,height=700,resizable=yes,scrollbars=no");
    if (!projectorWindow) {
      setNotice("The projector window was blocked by your browser. Allow pop-ups for this site, then click Open projector display again.");
      return;
    }
    projectorWindow.focus();
    setNotice("Projector display opened. Move its window to the external screen, then use its Enter full screen button.");
    broadcast();
  });

  $("fullscreenBtn").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await $("captionCard").requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { setNotice("Full screen could not be enabled by the browser."); }
  });

  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([finalText.trim() + "\n"], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clearcaption-transcript-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  audioFile.addEventListener("change", () => {
    const file = audioFile.files && audioFile.files[0];
    fileName.textContent = file ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)` : "No file selected";
    transcribeBtn.disabled = !file || transcriptionBusy;
    audioStatus.textContent = file ? "Ready to transcribe. Audio processing runs on this device after the model is downloaded." : "First use requires an internet connection to download the speech model.";
  });

  function languageForWhisper(value) {
    return ({"en-US":"english","en-GB":"english","en-NG":"english","fr-FR":"french","es-ES":"spanish","pt-BR":"portuguese"})[value] || "english";
  }
  async function getTranscriber() {
    if (!transcriberPromise) {
      transcriberPromise = (async () => {
        audioStatus.textContent = "Loading the transcription engine. The first download may be large; please wait…";
        progressTrack.hidden = false;
        progressBar.style.width = "8%";
        const module = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
        module.env.allowLocalModels = false;
        module.env.useBrowserCache = true;
        const pipeline = module.pipeline;
        const asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");
        progressBar.style.width = "35%";
        return asr;
      })().catch((err) => {
        transcriberPromise = null;
        throw err;
      });
    }
    return transcriberPromise;
  }
  function resampleTo16k(float32, sourceRate) {
    if (sourceRate === 16000) return float32;
    const ratio = sourceRate / 16000;
    const length = Math.max(1, Math.round(float32.length / ratio));
    const output = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const position = i * ratio;
      const left = Math.floor(position);
      const right = Math.min(left + 1, float32.length - 1);
      const weight = position - left;
      output[i] = float32[left] * (1 - weight) + float32[right] * weight;
    }
    return output;
  }
  async function decodeAudio(file) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is not supported in this browser. Try the latest Chrome or Edge.");
    const context = new AudioContextClass();
    let buffer;
    try {
      try {
        // Prefer the browser's native decoder because it is much faster and lighter.
        buffer = await context.decodeAudioData(await file.arrayBuffer());
      } catch (nativeDecodeError) {
        // Some browsers/builds cannot decode a particular MP3. Retry via FFmpeg.wasm.
        audioStatus.textContent = "This browser could not decode the file directly. Loading the MP3 compatibility decoder…";
        progressBar.style.width = "12%";
        try {
          const { FFmpeg } = await import("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js");
          const { toBlobURL } = await import("https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js");
          const ffmpeg = new FFmpeg();
          const coreBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
          await ffmpeg.load({
            coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm")
          });
          const inputName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "input-audio";
          const outputName = "clearcaption-converted.wav";
          await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
          audioStatus.textContent = "Converting audio to a compatible format…";
          await ffmpeg.exec(["-i", inputName, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", outputName]);
          const wavBytes = await ffmpeg.readFile(outputName);
          buffer = await context.decodeAudioData(wavBytes.buffer.slice(wavBytes.byteOffset, wavBytes.byteOffset + wavBytes.byteLength));
          try { await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName); } catch (_) {}
          ffmpeg.terminate();
        } catch (fallbackError) {
          const detail = fallbackError && fallbackError.message ? fallbackError.message : "Compatibility decoder failed";
          throw new Error(`The browser could not decode this audio file, and the compatibility decoder could not run (${detail}). Try opening the app in the latest Chrome or Edge, check your internet connection, or convert the MP3 to WAV and retry.`);
        }
      }
      const mono = new Float32Array(buffer.length);
      for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex++) {
        const channelData = buffer.getChannelData(channelIndex);
        for (let i = 0; i < channelData.length; i++) mono[i] += channelData[i] / buffer.numberOfChannels;
      }
      return resampleTo16k(mono, buffer.sampleRate);
    } finally {
      await context.close();
    }
  }
  transcribeBtn.addEventListener("click", async () => {
    const file = audioFile.files && audioFile.files[0];
    if (!file || transcriptionBusy) return;
    if (listening) stopRecognition();
    transcriptionBusy = true;
    transcribeBtn.disabled = true;
    startBtn.disabled = true;
    progressTrack.hidden = false;
    progressBar.style.width = "5%";
    setStatus("Transcribing recording…", true);
    setNotice("");
    try {
      audioStatus.textContent = "Preparing audio…";
      const audio = await decodeAudio(file);
      progressBar.style.width = "18%";
      const asr = await getTranscriber();
      audioStatus.textContent = "Transcribing audio. Longer recordings can take several minutes…";
      progressBar.style.width = "50%";
      const result = await asr(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: languageForWhisper(languageSelect.value),
        task: "transcribe"
      });
      const text = (result && result.text ? result.text : "").trim();
      if (!text) throw new Error("No speech was detected in this recording.");
      appendFinal(`\n[Audio: ${file.name}]\n${text}`);
      progressBar.style.width = "100%";
      audioStatus.textContent = "Transcription complete. The result has been added to the transcript.";
      setNotice("Recorded audio transcription completed.");
    } catch (error) {
      console.error(error);
      audioStatus.textContent = "Transcription could not be completed.";
      setNotice(`Audio transcription failed: ${error && error.message ? error.message : "Unknown error"}. Check your connection, try a supported audio format, or use a shorter recording.`);
    } finally {
      transcriptionBusy = false;
      transcribeBtn.disabled = !(audioFile.files && audioFile.files[0]);
      startBtn.disabled = false;
      progressTrack.hidden = true;
      progressBar.style.width = "0%";
      setStatus(listening ? "Listening to microphone" : "Ready to start", listening);
      render();
    }
  });

  // Synchronize with a projector window opened from this page.
  window.addEventListener("storage", (event) => {
    if (event.key === "clearcaption-v2-request") broadcast();
  });

  if (!recognizerSupported) {
    setNotice("Your browser does not expose live speech recognition. Try the latest Chrome or Edge. Recorded-audio transcription uses a separate in-browser AI model.");
    startBtn.disabled = true;
  }
  if (!channel) {
    audioStatus.textContent += " Cross-window live updates will use a browser storage fallback.";
  }
  render();
})();