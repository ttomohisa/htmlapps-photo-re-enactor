# Photo Re-Enactor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-photo-re-enactor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-photo-re-enactor/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-photo-re-enactor/)

[日本語版 README](README.ja.md)

Photo Re-Enactor is a Browser Kitty app for retaking a scene from nearly the same composition by placing a previous or Before photo over the live camera. Reference photos and camera frames are processed locally and are not uploaded by the app.

## 🚀 Live demo

### [Open Photo Re-Enactor on GitHub Pages](https://ttomohisa.github.io/htmlapps-photo-re-enactor/)

GitHub Pages delivers the initial HTML. After it loads, reference-photo decoding, camera frames, composition guidance, capture, comparison, and export are processed inside the browser. The app does not upload the selected photo or camera feed.

[![Photo Re-Enactor screenshot](assets/screenshot-en.png)](https://ttomohisa.github.io/htmlapps-photo-re-enactor/)

## Features

- **Recreate a previous composition** — Load a JPEG / PNG / WebP reference and place it over the live camera while shooting.
- **Four overlay views** — Switch among Ghost, Outline, Blink, and Split depending on the scene.
- **One plain-language instruction at a time** — Local analysis estimates the largest horizontal, vertical, distance, or tilt offset and tells you what to adjust next.
- **A complete manual fallback** — If automatic guidance is unsuitable, explicitly enable **Adjust reference manually** and move, zoom, or rotate the reference yourself.
- **Shooting timer** — OFF / 3 / 5 / 10 seconds with cancellation.
- **Direct Before / After comparison** — Drag the divider handle directly on the result image.
- **Three export options** — Save the new JPEG, a side-by-side comparison JPEG, or a standalone comparison HTML with both photos embedded.
- **Smartphone-first capture UI** — Portrait and landscape layouts keep camera switching, shutter, and timer controls accessible while shooting.
- **Fully local processing** — No runtime external connections, analytics, telemetry, login, or automatic upload.

## Quick start

### Use the web demo

Just [open the demo](https://ttomohisa.github.io/htmlapps-photo-re-enactor/). No installation or account is required.

Because camera APIs require a secure context in current browsers, the **HTTPS GitHub Pages version is recommended for shooting**.

### Use the single HTML

Release artifacts are `dist/index.html` and `dist/index.self-extract.html`. Both package the application into a single file.

Some browsers do not allow camera access from an HTML file opened through `file://`. Use HTTPS or localhost when testing or using the camera.

## Usage

1. Choose the JPEG / PNG / WebP photo whose composition you want to recreate. Camera permission is not requested yet.
2. Review the reference and press **Start camera**.
3. Choose Ghost / Outline / Blink / Split as needed, then move the camera according to the composition guide when it is available.
4. If the reference itself needs adjustment, enable **Adjust reference manually**, then drag, pinch/zoom, or rotate it. Turning the mode off resumes composition guidance.
5. Optionally choose a 3 / 5 / 10 second timer and press the shutter. A low match score never blocks capture.
6. After capture, drag the divider handle directly on the image to compare Before and After.
7. Save the new photo, comparison image, and/or standalone comparison HTML. **Retake** keeps the same reference and alignment for another shot.

## Composition guide

The guide compares the reference with downscaled camera frames locally and estimates horizontal offset, vertical offset, scale, and rotation.

- The match score estimates **composition similarity, not photo quality**.
- Guidance never becomes a capture requirement.
- Low-detail scenes, darkness, blur, or scenes that changed substantially can make automatic guidance unavailable.
- Manual overlay shooting remains available when automatic comparison is unreliable.
- Analysis runs intermittently in a Worker so camera display and capture remain responsive.

## Publish with GitHub Pages

The repository includes a workflow that runs the template's standard Repository Check and single-HTML build on a Windows runner, then deploys the result to GitHub Pages.

1. Push the repository as `ttomohisa/htmlapps-photo-re-enactor`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or manually run **Deploy standalone app to GitHub Pages** from Actions.
4. After a successful deployment, the app is available at `https://ttomohisa.github.io/htmlapps-photo-re-enactor/`.

Every push to `main` runs `scripts/check-repository.ps1` on Windows, rebuilds and verifies the readable and self-extracting single HTML files, and then publishes `dist`.

## Development and build

Use the template-standard Windows build:

```powershell
.\build-standalone.bat
```

To run the full repository validation and build:

```powershell
.\scripts\check-repository.ps1
```

Use HTTPS or localhost when testing the camera.

## Privacy and runtime network protection

- Reference photos, camera frames, and captured images stay inside the browser.
- Photos are not automatically persisted to LocalStorage / IndexedDB.
- Output is produced only after an explicit save action.
- The comparison HTML embeds both photos. Sharing that file also shares the embedded photos; the app explains this before export.
- Runtime CSP keeps `connect-src 'none'`.
- There are no runtime CDN dependencies, external APIs, analytics, or telemetry.

The GitHub Pages version still requires the initial HTML request, but the app does not transmit the selected photo or camera feed afterward.

## Limitations

- Automatic composition guidance is an aid and can become unavailable with large viewpoint changes or low-detail scenes.
- Person-pose matching, person identification, and match-triggered automatic capture are not part of v1.0.0.
- Camera availability, resolution, Wake Lock, and vibration feedback vary by browser and device.
- Camera access from a single HTML opened through `file://` is subject to browser security restrictions.

## Contributing

Bug reports and feature proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).
