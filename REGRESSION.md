# Comparison export regressions

Run the full check with Node.js 20+ and PowerShell:

```powershell
./scripts/check-repository.ps1
```

The check runs `node --test tests/comparison-export.test.cjs` against source, the checked-in root release, generated readable HTML, and the gzip-restored self-extract payload. To inspect one variant separately, set `PHOTO_EXPORT_HTML` to its path.

The tests execute the actual export and reference-replacement functions with synthetic Blob, FileReader, Image, and Canvas boundaries. They cover:

- Existing horizontal geometry, labels, JPEG type/quality, editable/sanitized filename, and default/fallback names.
- Stacked Before-above-After geometry at landscape, portrait, square, odd large dimensions, and 1×1 input sizes, without changing per-photo scale or crop.
- Reference replacement, clear, generation changes, and replacement of either captured Blob during reads or JPEG encoding: no obsolete download or success toast.
- Click-time filename, comment, language, capture date, aspect ratio, and layout; edits during decode/encoding remain available for the next save.
- Repeated exports with different filenames/layouts, missing photo pairs, FileReader/image-decode failures, and failed JPEG encoding. Current errors remain visible; obsolete errors are discarded without a late failure toast.
- HTML escaping, embedded synthetic photo data, individual download filenames, the privacy confirmation, and existing Split/Ghost/Blink controls.

These are deterministic offline behavioral checks, not real-browser rendering, JPEG pixel encoding, camera, touch, or permission tests. Before release, manually check both layouts at desktop and narrow smartphone widths, keyboard selection/focus, real saved JPEG appearance, HTML confirmation/cancel, and both languages. Existing camera, crop, timer, and reference-transform behavior should remain unchanged.
