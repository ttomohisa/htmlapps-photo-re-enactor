# APP_SPEC.md — Photo Re-Enactor v1.1.4

## 1. Product identity

- **Name:** Photo Re-Enactor / 同じ構図で撮る
- **Version:** v1.1.4
- **Purpose:** Use a previous or Before photo as a ghost overlay while photographing the same scene again.
- **Primary environment:** Smartphone camera, with desktop support.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. v1.0.0 outcome

v1.0.0 completes the first release scope: reference-photo overlay shooting, manual alignment, local composition guidance, comparison, and local exports in a smartphone-first flow.

1. Choose a JPEG / PNG / WebP reference image.
2. Review the selected image without requesting camera permission.
3. Start the camera after a plain-language privacy explanation.
4. Choose Ghost / Outline / Blink / Split to view the reference over the live camera.
5. Use the composition guide when available. If the reference itself needs adjustment, explicitly enable manual reference adjustment before dragging, pinching, wheel-zooming, or rotating it.
6. Optionally use the OFF / 3 / 5 / 10 second timer and capture at any time.
7. Compare the aligned Before image and the captured photo by dragging the divider handle directly on the image.
8. Save the captured JPEG, side-by-side or stacked comparison JPEG, or standalone comparison HTML.
9. Retake or choose another reference image.

## 3. Functional requirements

- Accept JPEG, PNG, and WebP images up to 50 MB.
- Support drag-and-drop on desktop and normal file selection on smartphones.
- Do not request camera access on initial page load or when only choosing a reference image.
- Use `navigator.mediaDevices.getUserMedia` only after the user chooses **Start shooting**.
- Default to the rear/environment camera; provide front/rear switching after camera permission is granted.
- Provide Ghost / Outline / Blink / Split overlay modes. Blink must respect `prefers-reduced-motion`; Split provides a movable boundary.
- Keep opacity control from 20% to 80% for image overlays.
- Support reference translation, scale, and rotation with touch/mouse gestures and explicit sliders.
- Provide a one-tap overlay reset.
- Capture the same visible camera crop shown in the stage.
- Generate an aligned Before image using the current reference transform so the result comparison matches the composition used during shooting.
- Stop all camera tracks when leaving the camera screen, taking a photo, changing reference, or unloading the page.
- Request a screen wake lock while the camera is active when supported, release it when the camera stops or the page is hidden, and reacquire it when appropriate.
- Use short vibration feedback after capture when supported; lack of vibration support must not change the capture flow.
- Estimate horizontal, vertical, scale, and rotation offsets locally in a Worker; hide the score when comparison is unreliable.
- Automatic guidance must never block capture.
- Provide OFF / 3 / 5 / 10 second timer with cancellation.
- Save results only after explicit user action, including captured JPEG, comparison JPEG, and standalone comparison HTML.
- Output JPEG filenames are editable before saving; invalid filename characters are sanitized and `.jpg` is added automatically.
- UI is Japanese / English without reloading.
- No image persistence in LocalStorage / IndexedDB. Only the language preference may be stored.

## 4. States

- `empty`: no reference image; primary action is choosing one.
- `loading-reference`: image is decoding; old camera/result state is invalidated.
- `ready`: reference preview is available; camera permission has not been requested yet.
- `starting-camera`: camera permission / stream startup in progress.
- `camera`: live camera and Ghost overlay are active.
- `capturing`: capture is being encoded; the shutter is temporarily disabled.
- `result`: Before / After comparison and save actions are available; camera tracks are stopped.
- `error`: plain-language recovery guidance is shown without discarding a valid reference image where possible.

## 5. Privacy and network

- Reference photos, camera frames, and captured photos are processed in browser memory only.
- No runtime network request, CDN, analytics, telemetry, login, upload, or server storage.
- CSP retains `connect-src 'none'`.
- Photos are not persisted to browser storage.
- Saved outputs leave the page only because the user explicitly downloads them.
- Comparison HTML embeds both photos and must explain that sharing the HTML also shares the photos.

## 6. Camera security-context limitation

The application HTML itself can open through `file://`, but camera APIs may be unavailable there depending on browser security rules. Camera shooting is supported on HTTPS and `localhost`. When camera access is unavailable, the UI must explain this and keep the selected reference image usable.

## 7. Media geometry

- The camera stage uses `object-fit: cover`.
- Capture uses the live video's intrinsic dimensions and crops the source to the current stage aspect ratio.
- The reference overlay also uses cover-fit, then applies translation / scale / rotation around the stage center.
- Result Before rendering reproduces the same cover-fit and user transform on an offscreen canvas.
- Transform translation is stored as percentages of stage width/height so resize changes are less destructive.

## 8. Accessibility and mobile UX

- Mobile-first from 320 px.
- The live preview remains adjacent to its overlay controls.
- The smartphone action dock respects safe-area insets and keeps a large central shutter target.
- Buttons use SVG icons and visible text where meaning could otherwise be ambiguous.
- Visible keyboard focus, ARIA labels/status, Escape-close dialogs, and reduced-motion support are required.
- The on-image comparison divider works with pointer/touch drag, keyboard arrows, Home, and End.

## 9. Current non-goals

- Person identification or pose matching.
- Match-triggered automatic capture.
- AI models, server AI, or cloud processing.
- OpenCV / external runtime libraries.
- Project / gallery persistence.

## 10. Acceptance criteria

- The happy path from reference selection through JPEG download works on a camera-capable HTTPS / localhost context.
- Camera permission is never requested before the explicit camera-start action.
- Drag and pinch do not scroll the page while adjusting the overlay.
- Retake restores the camera flow without losing the reference transform.
- Choosing a different reference clears stale captures and revokes obsolete Blob URLs.
- Camera tracks are stopped on result, source replacement, and page exit.
- Japanese and English fit at 360 px without horizontal scrolling.
- `dist/index.html` has no external runtime assets and retains `connect-src 'none'`.
- Source retains the template's embedded-asset API including `bytesAsync` / `blobUrlAsync`, editable `outputFilename`, and `window.AppToast` contract.

## 11. Release status

v1.1.4 is the responsive-audit patch candidate. Help locks background page scrolling only while open as a modal; narrow headers wrap the title and version while retaining the language and Help controls. The existing Help scroll shell is preserved. This patch still requires loaded reference/camera/capture/export verification; the following historical verification statement applies to the prior core release, not new device testing. It keeps the v1.0.0 capture and export flow while refreshing the camera surface to match the smartphone-first camera UI used by QR Reader. The core flow has been verified with real-camera testing, smartphone portrait/landscape checks, desktop checks, local-only runtime constraints, and export regression checks. Person pose matching remains a later feature.


## v1.1.0 camera UI refresh

- Smartphone capture uses a full-screen live camera surface patterned after the QR Reader camera UI.
- The normal Browser Kitty header and page introduction are hidden only while capturing on smartphone-sized viewports.
- Back, language, and Help remain reachable from a lightweight top overlay.
- Camera switch, shutter, and timer are grouped in a dark translucent in-camera dock.
- Overlay settings remain available without leaving the camera and expand as a floating control panel.
- On smartphones, the compact overlay-settings bar stays visually separated from the camera dock and closes when the user taps elsewhere.
- Split mode supports direct divider dragging on the camera image.
- Result comparison and exported comparison HTML support Split, Ghost, and Blink; exported HTML can also save Before / After images individually.
- Returning to the camera re-synchronizes shutter availability, and Retake requires confirmation.
- Desktop and result/reference screens keep the established Browser Kitty layout.

## v1.0.0 UX notes

- Normal camera interaction no longer moves the reference image. Manual drag / pinch / wheel adjustment requires the explicit **Adjust reference manually / 元写真を手動調整** switch.
- Automatic composition guidance pauses during manual reference adjustment and resumes after the mode is turned off.
- Direction guidance uses consecutive-result hysteresis, and transient analysis failures are tolerated before showing the manual fallback state.


## v1.1.0 UX notes
- The opening screen summarizes the three-step flow: choose a reference, line up and capture, then compare/save.
- Capture-time Split can move from 0% through 100%.
- Comparison HTML centers its viewer, labels comments, includes a favicon, and allows Before/After image downloads.

## Comparison export layouts and result ownership

- The labeled **Comparison JPEG layout** native select offers **Side by side** (default) and **Stacked (Before above After)** in English and Japanese. It is session-only, resets on reload, and does not change capture geometry, reference transforms, or the interactive comparison viewer/HTML modes.
- Both layouts retain the current per-photo dimensions: scale the captured photo down only when its longer side exceeds 1400 px, round each dimension, and keep a minimum of 1 px. Use those same `w × h` dimensions for both aligned images without new cropping.
- Side by side remains `2w × (h + 44)` with the existing `-compare.jpg` filename. Stacked is `w × (2h + 88)`, Before on top and After below, each with a 44 px label band, and uses `-compare-stacked.jpg`. Both are JPEG at quality 0.9.
- Before the first asynchronous operation, comparison JPEG and HTML exports snapshot both immutable Blobs, source generation, sanitized filename, layout, aspect ratio, date label, comment, language, and localized labels. HTML snapshots begin after the existing privacy confirmation.
- Recheck source generation and both Blob identities after asynchronous reads and before download. A replaced/cleared reference, recapture (even within the same generation), or otherwise obsolete pair must not produce a stale download, success message, or late failure message. Current failures still use the existing error feedback.
- Editing fields or changing language for the same result does not alter an already started export; those edits remain available for the next export and must not be overwritten by completion.
- Offline Node.js tests exercise actual source functions with synthetic FileReader, image decode, and canvas boundaries. The repository check runs them against source, root release, generated readable HTML, and the restored self-extract payload.

## Header normalization (1.1.1)

- The language control shows EN in Japanese and JA in English, with a destination title and accessible name localized to the current UI language. Existing header Help attributes are localized.
- Existing Japanese local-processing badges use 完全ローカル処理, with accurate English wording retained. Layout, processing boundaries, persistence, model/camera behavior, and their existing limitations are unchanged.

## Icon refresh (1.1.3)

- The header and embedded favicon use the supplied artwork from `assets/favicon.svg`, preserving its original `0 0 64 64` viewBox.
- The header keeps its existing responsive icon slot; readable and self-extract releases inherit the same embedded favicon.

## Brand icon consistency

- Brand backgrounds use #16624f with corner radii equal to exactly 25% of each background axis. Preserve foreground artwork, placement, and existing canvas padding across SVG assets, app headers, and embedded favicons.
