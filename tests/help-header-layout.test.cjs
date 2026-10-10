'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');
const file = process.env.PHOTO_EXPORT_HTML || path.join(__dirname, '..', 'src', 'index.template.html');
let html = fs.readFileSync(file, 'utf8');
if (file.endsWith('.self-extract.html')) {
  const payload = html.match(/<script[^>]+id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(payload, 'self-extract payload exists');
  html = gunzipSync(Buffer.from(payload[1].trim(), 'base64')).toString('utf8');
}
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const rule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'))?.[1] || '';
};

// CSS contracts complement native viewport, wheel and keyboard checks. They do
// not emulate browser layout or establish camera / capture / export coverage.
test('only modal Help locks both background scroll roots', () => {
  const lock = rule('html:has(#helpDialog:modal), body:has(#helpDialog:modal)');
  assert.match(lock, /overflow:\s*hidden\s*;/);
  assert.doesNotMatch(css, /(?:html|body):has\(dialog/);
});
test('narrow header wraps the title and version while reserving its actions', () => {
  const narrow = css.match(/@media\s*\(max-width:\s*420px\)\s*\{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(narrow, /\.brand-name\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap[^}]*white-space:\s*normal[^}]*overflow:\s*visible/);
  assert.match(narrow, /#headerAppName\s*\{[^}]*min-width:\s*0[^}]*overflow-wrap:\s*anywhere/);
  assert.match(narrow, /\.version-badge\s*\{[^}]*flex:\s*0 0 auto[^}]*margin-left:\s*0/);
  assert.match(narrow, /\.header-actions\s*\{[^}]*flex:\s*0 0 auto/);
});
test('the tested Help scroll shell and camera-screen rules remain available', () => {
  assert.match(rule('.dialog-body'), /max-height:\s*min\(76vh, 680px\);\s*overflow:\s*auto/);
  assert.match(rule('.dialog-head'), /position:\s*sticky[^}]*top:\s*-20px/);
  assert.match(css, /body\.camera-mode \.mobile-flow-bar\s*\{\s*display:\s*none !important/);
  assert.match(html, /data-i18n="helpOffline"/);
});
test('the new Help explanation is present in Japanese and English', () => {
  assert.match(html, /data-i18n="helpLayout"/);
  assert.match(html, /helpLayout: '使い方を開いている間は背景のスクロールを止めます。狭い画面でもアプリ名とバージョンを確認できます。'/);
  assert.match(html, /helpLayout: 'Opening Help pauses background scrolling\. The app name and version remain visible on narrow screens\.'/);
});
