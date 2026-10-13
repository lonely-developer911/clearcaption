# ClearCaption — Live Speech-to-Text MVP

A frontend-only live captioning prototype for lectures, meetings, church services, and conversations.

## Run it

1. Extract `clearcaption-mvp.zip`.
2. Open the `live-caption-app` folder in Visual Studio Code.
3. Recommended: install the VS Code extension **Live Server**.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Open the local URL in a recent version of Google Chrome or Microsoft Edge.
6. Click **Start captions** and allow microphone access.

You can also open `index.html` directly in a browser, but using Live Server is recommended. Microphone and speech recognition permissions depend on browser security rules.

## Included

- Live speech-to-text using the browser's Web Speech API
- Start / Stop captions
- Clear transcript
- Language selection (availability varies by browser)
- Adjustable caption text size
- Dark, light, and high-contrast caption themes
- Full-screen caption display
- Download final transcript as `.txt`
- Word count and basic microphone / recognition error messages
- Responsive layout for desktop and mobile

## Important limitations

- Best tested in recent Chrome or Edge. Browser support is not universal.
- Speech recognition may rely on a network service; this MVP does not guarantee offline transcription.
- Language options and accuracy vary by browser, operating system, microphone, accent, and room noise.
- Some browsers may stop recognition periodically; the app attempts to reconnect while listening.
- Interim words are provisional and can change. The downloaded transcript contains finalized recognized text.
- This is an accessibility aid, not a certified or guaranteed-accurate transcript. Test with intended users and real environments before relying on it.
- Audio is handled by the browser's speech-recognition service where applicable. This app itself does not store or upload audio to a custom server.

## Suggested 3-day plan

**Day 1:** Get the MVP running and test microphone recognition.
**Day 2:** Test with real speakers and different room conditions; tune layout and language behavior.
**Day 3:** Fix issues, rehearse the demo, and deploy using a static hosting provider if needed.

## Files

- `index.html` — page structure
- `styles.css` — responsive interface and caption themes
- `app.js` — speech recognition and UI behavior
