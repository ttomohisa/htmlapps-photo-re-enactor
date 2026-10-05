# Changelog

All notable changes to Photo Re-Enactor are documented here.

## Unreleased

- Fix dependency maintenance reports for empty or null dependency lists under PowerShell strict mode.
- Run offline report regressions (empty, disabled, current, and update-policy cases) from the normal repository check.

## 1.1.0 - 2026-09-02
- Allow the capture-time Split divider to move fully from 0% to 100%.
- Center the comparison HTML viewer and comparison preset controls.
- Label comparison HTML comments, add its favicon, and remove the ambiguous arrow hint.
- Improve the first screen with a compact three-step overview of the full workflow.
- Move the three-step overview above the file drop area and add a smartphone fixed action bar for the current workflow step.
- Refine comparison HTML labels so Ghost hides Before/After labels and Blink shows only the currently visible side.
- Add a speech-bubble icon to comparison HTML comments.
- Add a subtle STEP 1 label to the first screen, move the image icon to the “Choose another photo” action, and rename the main save action to “Save captured photo”.

### Changed

- Split mode now lets you drag the divider directly on the camera image.
- Moved Reset position directly below the display-mode selector.
- Refined the smartphone overlay-settings placement and made camera overlays more transparent.
- Unified the manual-adjust and composition-guide row backgrounds.
- Result comparison now supports Split, Ghost, and Blink.
- Standalone comparison HTML now supports Split, Ghost, Blink, and direct Before/After photo downloads.
- Fixed a stale disabled shutter state that could remain after returning to the camera.
- Retake now asks for confirmation before leaving the result screen.
- Refreshed the camera UI to follow the smartphone-first full-screen layout used by QR Reader.
- Camera controls now sit on a dark translucent dock over the live view, with the shutter kept prominent in the center.
- Smartphone capture hides the normal page chrome and uses an in-camera top bar for Back, language, and Help.
- Overlay controls float above the camera dock and expand over the live view instead of pushing camera content down the page.
- Smartphone landscape keeps the camera full-screen while moving the main controls into compact overlays that avoid covering the composition guide.
- Desktop capture also uses the in-camera translucent dock while retaining the existing page layout and overlay settings panel.

## 1.0.0 - 2026-09-01

### Release

- First stable Photo Re-Enactor release for recreating a previous photo composition from the browser.
- Finalized the smartphone-first flow from reference selection through camera guidance, capture, Before / After comparison, and local export.
- Confirmed Ghost / Outline / Blink / Split overlays, explicit manual reference adjustment, local composition guidance, timers, retake flow, and three export formats as the v1.0 scope.
- Finalized Japanese / English documentation, favicon consistency, release screenshots, CSP/network constraints, and GitHub Pages workflows.

## 0.6.0 - 2026-09-01

### Changed

- Manual reference dragging/pinching is now an explicit mode inside overlay settings, so normal camera touches do not accidentally move the reference.
- Composition guidance pauses while manual reference adjustment is active and resumes automatically when the mode is turned off.
- Composition instructions now require consecutive results before switching direction, reducing left/right or distance/tilt flicker.
- Temporary analysis failures must persist across three checks before the UI falls back to the manual-guidance message.
- Camera copy now emphasizes moving the camera to follow the guide, keeping manual reference adjustment as a fallback.
- Mobile overlay settings now leave enough clearance above the fixed capture dock so the final controls remain reachable.

## 0.5.0 - 2026-09-01

### Added

- Best-effort screen wake lock while the camera is active on supported browsers.
- Light vibration feedback after capture on supported devices.

### Changed

- Before / After comparison now uses the divider handle directly on the image instead of a separate range slider.
- Standalone comparison HTML uses the same on-image drag interaction while keeping quick-view buttons and keyboard controls.

## 0.4.0 - 2026-09-01

### Added

- Ghost / Outline / Blink / Split overlay modes.
- Local edge-based Outline generation with no runtime dependency.
- Adjustable Split boundary.
- Reduced-motion-safe Blink behavior.

### Changed

- Overlay gestures now work across all display modes, including Outline.
- Composition guidance is smoothed and keeps the manual overlay fallback when the scene is unreliable.
- Release-candidate checks now cover smartphone landscape, camera permission denial, invalid-image recovery, overlay modes, timers, exports, and overflow.

## 0.3.0 - 2026-09-01

### Added

- Fully local lightweight composition guidance for horizontal, vertical, scale, and rotation offsets.
- Composition match estimate with a single plain-language instruction at a time.
- Guide ON / OFF control and manual fallback when automatic comparison is unreliable.
- Worker-based intermittent analysis so capture remains responsive.

### Changed

- Restored and integrated the v0.2 timer and comparison export flow into the current source template.
- Result view now opens directly on the comparison instead of repeating the page introduction.
- Help and privacy copy now explain the guide limitations and that the match score is only an estimate.

## 0.2.0 - 2026-09-01

### Added

- OFF / 3 / 5 / 10 second shooting timer with an in-camera countdown and cancel action.
- Side-by-side Before / After JPEG export.
- Standalone comparison HTML export with embedded photos, slider, quick views, fullscreen, keyboard navigation, capture date, and optional comment.
- Privacy confirmation before exporting a comparison HTML that embeds both photos.

### Changed

- Simplified the camera dock to camera switch, shutter, and timer; alignment reset remains in the overlay settings panel.
- Expanded the result step from a single-photo save screen into explicit result export choices.

## 0.1.0 - 2026-09-01

### Added

- Initial reference-photo selection flow for JPEG / PNG / WebP.
- Explicit camera-start permission step with local-processing explanation.
- Rear/front camera switching.
- Ghost overlay with opacity, drag, pinch/zoom, wheel zoom, and rotation.
- Overlay reset and explicit scale/rotation controls.
- Visible-crop JPEG capture.
- Before / After comparison slider using the aligned reference composition.
- Editable JPEG filename and local download.
- Japanese / English UI, responsive smartphone shooting dock, help dialog, and local-only CSP.
