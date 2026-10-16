# ClearCaption V2.1 — User Guide

ClearCaption V2 is a static web app prototype with two transcription modes and a separate projector window:
- **Live microphone captions** using the browser's Web Speech API.
- **Recorded audio transcription** using Whisper through Transformers.js in the browser.
- **Projector display** in a separate movable window with white text on black, showing up to five recent caption lines and the current interim words.
- Adjustable projector text size, transcript clearing, fullscreen, and transcript download.

## Files

- `index.html` — operator/control screen.
- `styles.css` — operator screen styling.
- `app.js` — microphone, audio-file transcription, transcript and projector synchronization.
- `display.html` — separate audience/projector screen.
- `display.css` — projector appearance (black background, white text).
- `display.js` — renders caption updates in the projector window.

## Run locally

1. Extract the ZIP.
2. Open the `clearcaption-v2` folder in VS Code.
3. Run it with a local web server, for example the VS Code **Live Server** extension.
4. Open the local URL in the latest Google Chrome or Microsoft Edge.

Opening `index.html` directly using a `file://` URL may prevent some browser features from working. Use a local server or host the files on GitHub Pages.

## Live microphone captions

1. Select the speech language.
2. Click **Start captions**.
3. Allow microphone access when the browser asks.
4. Speak clearly. Recognized words appear in the transcript.
5. Click **Stop listening** when finished.

Live speech recognition support varies by browser. The app recommends current Chrome or Edge. The browser speech service may require internet access.

## Transcribe a recorded audio file

1. Click **Choose audio file** and select an audio file supported by your browser, such as WAV, MP3, M4A, OGG, or WebM.
2. Select the closest available speech language.
3. Click **Transcribe recording** and wait.
4. On first use, the app downloads the Transformers.js runtime and Whisper model. This requires an internet connection and can take time; the model is cached by the browser where supported.
5. The transcription is added to the main transcript and sent to the projector window.

The app first tries the browser audio decoder. If that decoder cannot read the file (which can happen with some MP3 files), it attempts a fallback conversion using FFmpeg.wasm; the first fallback use requires internet and may download additional files. Long or large recordings may use significant memory and take several minutes. Try a shorter recording if processing fails. Recorded-audio transcription runs in the browser; no API key is required.

## Projector / external monitor

1. Connect the projector or monitor to the computer.
2. In the operating system's display settings, select **Extend** rather than Duplicate/Mirror.
3. In ClearCaption, click **Open projector display**. If nothing opens, allow pop-ups for the site and try again.
4. Drag the new **ClearCaption — Projector Display** window to the projector screen.
5. Click **Enter full screen** inside the projector window.
6. Start microphone captions or transcribe an audio recording from the operator screen. The projector updates automatically.
7. Press `Esc` or use the display's button to leave full screen when finished.

The browser cannot enable an external display or move its own window automatically; that is done by the user through the operating system.

## Publish on GitHub Pages

1. Create or open a GitHub repository.
2. Upload all six files (`index.html`, `styles.css`, `app.js`, `display.html`, `display.css`, and `display.js`) into the repository's root folder.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, select the `main` branch and `/(root)`, then save.
5. Open the published site. The projector window must use the same published site origin, so keep all six files in the same folder.

## Important limitations

- This is a front-end prototype, not a guaranteed professional transcription service. Accuracy depends on the microphone, accent, background noise, browser and model.
- The available live recognition language list is limited to the options shown in the app. The Whisper model supports multiple languages, but the UI maps only the listed options.
- The first recorded-audio transcription needs internet to download the AI model. Large files may be slow or exceed available browser memory.
- The browser's Web Speech API is separate from Whisper. They can have different accuracy and availability.
- The projector shows the latest five finalized caption lines plus any interim text; it is intentionally not a full transcript editor.
- Test captions before using them for important accessibility, legal, medical, or safety decisions.

## Quick test checklist

- [ ] Allow microphone access and verify live words appear.
- [ ] Open the projector window and move it to the second screen.
- [ ] Confirm projector text is white on black and updates live.
- [ ] Change projector text size from the operator screen.
- [ ] Upload a short audio recording and confirm the transcript appears in both windows.
- [ ] Clear and download the transcript.
- [ ] Test in the same browser where the app is hosted.
