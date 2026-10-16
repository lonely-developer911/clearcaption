# ClearCaption V2.1 — User Guide

ClearCaption V2 is a static web app prototype with two transcription modes and a separate projector window:
- **Live microphone captions** using the browser's Web Speech API.
- **Recorded audio transcription** using Whisper through Transformers.js in the browser.
- **Projector display** in a separate movable window with white text on black, showing up to five recent caption lines and the current interim words.
- Adjustable projector text size, transcript clearing, fullscreen, and transcript download.

## Important limitations

- This is a front-end prototype, not a guaranteed professional transcription service. Accuracy depends on the microphone, accent, background noise, browser and model.
- The available live recognition language list is limited to the options shown in the app. The Whisper model supports multiple languages, but the UI maps only the listed options.
- The first recorded-audio transcription needs internet to download the AI model. Large files may be slow or exceed available browser memory.
- The browser's Web Speech API is separate from Whisper. They can have different accuracy and availability.
- The projector shows the latest five finalized caption lines plus any interim text; it is intentionally not a full transcript editor.
- Test captions before using them for important accessibility, legal, medical, or safety decisions.

  

- Allow microphone access and verify live words appear.
- Open the projector window and move it to the second screen.

