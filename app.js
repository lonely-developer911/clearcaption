(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const languageSelect = document.getElementById('languageSelect');
  const fontSizeRange = document.getElementById('fontSizeRange');
  const fontSizeLabel = document.getElementById('fontSizeLabel');
  const themeSelect = document.getElementById('themeSelect');
  const captionCard = document.getElementById('captionCard');
  const captionOutput = document.getElementById('captionOutput');
  const finalTranscript = document.getElementById('finalTranscript');
  const interimTranscript = document.getElementById('interimTranscript');
  const emptyState = document.getElementById('emptyState');
  const statusText = document.getElementById('statusText');
  const liveIndicator = document.getElementById('liveIndicator');
  const captionSubhead = document.getElementById('captionSubhead');
  const wordCount = document.getElementById('wordCount');
  const notice = document.getElementById('notice');

  let recognition = null;
  let isListening = false;
  let shouldRestart = false;
  let finalText = '';
  let hasStarted = false;

  function setStatus(message, live = false) {
    statusText.textContent = message;
    liveIndicator.classList.toggle('is-live', live);
  }
  function showNotice(message, isError = false) {
    notice.textContent = message;
    notice.hidden = false;
    notice.classList.toggle('error', isError);
  }
  function hideNotice() {
    notice.hidden = true;
    notice.classList.remove('error');
    notice.textContent = '';
  }
  function updateCounts() {
    const text = finalText.trim();
    const count = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${count} ${count === 1 ? 'word' : 'words'}`;
    downloadBtn.disabled = count === 0;
    emptyState.hidden = hasStarted || text.length > 0 || interimTranscript.textContent.length > 0;
  }
  function scrollToLatest() {
    captionOutput.scrollTop = captionOutput.scrollHeight;
  }
  function buildRecognition() {
    if (!SpeechRecognition) return null;
    const instance = new SpeechRecognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = languageSelect.value;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      isListening = true;
      hasStarted = true;
      setStatus('Listening now', true);
      captionSubhead.textContent = 'Listening — words will appear as they are recognized';
      startBtn.disabled = true;
      stopBtn.disabled = false;
      hideNotice();
      updateCounts();
    };
    instance.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript.trim() + ' ';
        } else {
          interim += transcript;
        }
      }
      finalTranscript.textContent = finalText;
      interimTranscript.textContent = interim;
      updateCounts();
      scrollToLatest();
    };
    instance.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access was blocked. Allow microphone permission in your browser settings, then try again.',
        'service-not-allowed': 'This browser has blocked speech recognition. Try Chrome or Edge and check your browser permissions.',
        'no-speech': 'No speech was detected. Keep the microphone close to the speaker and try again.',
        'audio-capture': 'No microphone was found. Connect or enable a microphone, then try again.',
        'network': 'Speech recognition needs a network connection in this browser. Check your connection and retry.',
        'language-not-supported': 'This speech language may not be supported by the current browser. Choose another language.'
      };
      const message = messages[event.error] || `Speech recognition error: ${event.error}. Please try again.`;
      showNotice(message, event.error !== 'no-speech');
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
        shouldRestart = false;
      }
    };
    instance.onend = () => {
      isListening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      if (shouldRestart) {
        // Some browsers end recognition periodically even when continuous mode is enabled.
        try { instance.lang = languageSelect.value; instance.start(); }
        catch (_) { setStatus('Reconnecting…'); }
      } else {
        setStatus(finalText.trim() ? 'Captions paused' : 'Ready to start', false);
        captionSubhead.textContent = finalText.trim() ? 'Transcript paused' : 'Your transcript will appear here';
      }
      updateCounts();
    };
    return instance;
  }

  function startListening() {
    hideNotice();
    if (!SpeechRecognition) {
      showNotice('Live speech recognition is not supported by this browser. Please open this app in a recent version of Google Chrome or Microsoft Edge.', true);
      return;
    }
    if (isListening) return;
    if (!recognition) recognition = buildRecognition();
    recognition.lang = languageSelect.value;
    shouldRestart = true;
    try {
      recognition.start();
    } catch (error) {
      showNotice('The microphone is already starting or unavailable. Wait a moment and try again.', true);
    }
  }

  function stopListening() {
    shouldRestart = false;
    if (recognition && isListening) {
      try { recognition.stop(); } catch (_) {}
    } else {
      isListening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus('Captions paused', false);
    }
  }

  startBtn.addEventListener('click', startListening);
  stopBtn.addEventListener('click', stopListening);

  clearBtn.addEventListener('click', () => {
    finalText = '';
    finalTranscript.textContent = '';
    interimTranscript.textContent = '';
    hasStarted = false;
    updateCounts();
    captionSubhead.textContent = isListening ? 'Listening — words will appear as they are recognized' : 'Your transcript will appear here';
    if (!isListening) setStatus('Ready to start', false);
    hideNotice();
  });

  languageSelect.addEventListener('change', () => {
    if (isListening) {
      // Restart so the selected language takes effect.
      stopListening();
      window.setTimeout(startListening, 250);
    } else if (recognition) {
      recognition.lang = languageSelect.value;
    }
  });

  fontSizeRange.addEventListener('input', () => {
    const size = Number(fontSizeRange.value);
    captionOutput.style.fontSize = `${size}px`;
    fontSizeLabel.textContent = `${size} px`;
  });

  themeSelect.addEventListener('change', () => {
    captionCard.classList.remove('theme-light', 'theme-yellow');
    if (themeSelect.value === 'light') captionCard.classList.add('theme-light');
    if (themeSelect.value === 'yellow') captionCard.classList.add('theme-yellow');
  });

  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await captionCard.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      showNotice('Full-screen mode is not available in this browser or window.', true);
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.innerHTML = document.fullscreenElement
      ? '⛶ <span>Exit full screen</span>'
      : '⛶ <span>Full screen</span>';
  });

  downloadBtn.addEventListener('click', () => {
    const text = finalText.trim();
    if (!text) return;
    const blob = new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearcaption-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  updateCounts();
  if (!SpeechRecognition) {
    showNotice('Your current browser may not support live speech recognition. Use a recent version of Google Chrome or Microsoft Edge for the quickest setup.', false);
  }
})(); 
