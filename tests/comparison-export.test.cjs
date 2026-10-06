'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { gunzipSync } = require('node:zlib');
const file = process.env.PHOTO_EXPORT_HTML || path.join(__dirname, '..', 'src', 'index.template.html');
let source = fs.readFileSync(file, 'utf8');
if (file.endsWith('.self-extract.html')) {
  const payload = source.match(/<script[^>]+id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(payload, 'self-extract payload exists');
  source = gunzipSync(Buffer.from(payload[1].trim(), 'base64')).toString('utf8');
}
function chunk(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Production markers: ${start}`);
  return source.slice(a, b);
}
const appCode = [
  chunk('      function defaultFilenameBase()', '      function downloadBlob('),
  chunk('      function canvasToBlob(', '      async function capturePhoto('),
  chunk('      function blobToDataUrl(', '      function openHtmlExportDialog('),
  chunk('      function formatBytes(', '      async function requestScreenWakeLock('),
  chunk('      async function loadReference(', '      function cameraErrorKey('),
].join('\n');
function harness({ layout = 'side-by-side', size = [160, 90], language = 'en' } = {}) {
  const reads = [], images = [], encodes = [], downloads = [], toasts = [], revoked = [], urls = new Map();
  const before = new Blob(['synthetic Before A'], { type: 'image/jpeg' });
  const after = new Blob(['synthetic After A'], { type: 'image/jpeg' });
  const state = { language, sourceGeneration: 1, capturedBlob: after, alignedBeforeBlob: before, captureRatio: size[0] / size[1], capturedAt: new Date('2020-01-02T03:04:05Z'), overlayMode: 'ghost' };
  const node = value => ({ value, removeAttribute() {} });
  const outputFilename = node('capture-A');
  const nodes = { '#comparisonComment': node('Capture A <private>'), '#comparisonLayout': node(layout) };
  const canvas = { width: 0, height: 0, draws: [], fills: [], texts: [], getContext() { return context; }, toBlob(callback, type, quality) { encodes.push({ callback, type, quality, width: this.width, height: this.height, draws: [...this.draws], fills: [...this.fills], texts: [...this.texts] }); } };
  const context = { fillRect(...args) { canvas.fills.push({ color: this.fillStyle, args }); }, fillText(...args) { canvas.texts.push(args); }, drawImage(img, ...args) { canvas.draws.push({ blob: img.blob, args }); } };
  nodes['#comparisonCanvas'] = canvas;
  class Reader { readAsDataURL(blob) { reads.push({ blob, reader: this }); } }
  class Image { set src(url) { this.blob = urls.get(url); images.push(this); } async decode() {} }
  const sandbox = { state, outputFilename, Blob, FileReader: Reader, Image, Date,
    URL: { createObjectURL(blob) { const url = `blob:synthetic-${urls.size}`; urls.set(url, blob); return url; }, revokeObjectURL(url) { revoked.push(url); } },
    $: id => nodes[id] || (nodes[id] = node('')), referencePreview: node(''), ghostOverlay: node(''),
    stopCameraStream() { state.stream = null; }, clearCameraError() {}, showScreen(phase) { state.phase = phase; }, clearOutline() {}, resetOverlay() {},
    showFileError(message) { throw new Error(message); }, translate: key => `${state.language}:${key}`,
    AppToast: { show: value => toasts.push(value) }, downloadBlob: (blob, filename) => downloads.push({ blob, filename }) };
  vm.createContext(sandbox); vm.runInContext(appCode, sandbox);
  async function resolveReads() { for (const { blob, reader } of reads.splice(0)) { reader.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`; reader.onload(); } }
  function resolveImages() { for (const image of images.splice(0)) { [image.naturalWidth, image.naturalHeight] = size; image.onload?.(); } }
  function replace(kind) {
    if (kind === 'generation') state.sourceGeneration++;
    else if (kind === 'clear') { state.capturedBlob = null; state.alignedBeforeBlob = null; }
    else if (kind === 'before') state.alignedBeforeBlob = new Blob(['Before B']);
    else if (kind === 'after') state.capturedBlob = new Blob(['After B']);
    else { state.sourceGeneration++; state.capturedBlob = new Blob(['After B']); state.alignedBeforeBlob = new Blob(['Before B']); }
  }
  return { ...sandbox, before, after, nodes, reads, images, encodes, downloads, toasts, canvas, revoked, resolveReads, resolveImages, replace };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function finishImage(h, work) { h.resolveImages(); await tick(); for (const encode of h.encodes) encode.callback(new Blob(['synthetic JPEG'])); await work; }

test('JPEG layout control is labeled, localized, native, and horizontal by default', () => {
  assert.match(source, /<label[^>]+for="comparisonLayout"/);
  const select = source.match(/<select[^>]+id="comparisonLayout"[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(select, 'JPEG layout select exists');
  assert.match(select[1], /^\s*<option value="side-by-side"/);
  assert.match(select[1], /value="stacked"/);
  assert.match(source, /comparisonLayoutStacked: 'Stacked \(Before above After\)'/);
  assert.match(source, /comparisonLayoutStacked: '上下（上がBefore、下がAfter）'/);
});
for (const layout of ['side-by-side', 'stacked']) for (const size of [[160, 90], [90, 160], [500, 500], [4001, 2251], [1, 1]]) {
  test(`${layout}: exact geometry for ${size.join('x')}`, async () => {
    const h = harness({ layout, size }); await finishImage(h, h.saveComparisonImage());
    const e = h.encodes[0], scale = Math.min(1, 1400 / Math.max(...size));
    const w = Math.max(1, Math.round(size[0] * scale)), height = Math.max(1, Math.round(size[1] * scale));
    const stacked = layout === 'stacked';
    assert.deepEqual([e.width, e.height], stacked ? [w, height * 2 + 88] : [w * 2, height + 44]);
    assert.equal(e.draws[0].blob, h.before); assert.equal(e.draws[1].blob, h.after);
    assert.deepEqual(e.draws.map(x => x.args), [[0, 44, w, height], stacked ? [0, height + 88, w, height] : [w, 44, w, height]]);
    assert.deepEqual(e.texts, [['Before', 14, 22], ['After', stacked ? 14 : w + 14, stacked ? height + 66 : 22]]);
    assert.equal(e.type, 'image/jpeg'); assert.equal(e.quality, .9);
    assert.equal(h.downloads[0].filename, stacked ? 'capture-A-compare-stacked.jpg' : 'capture-A-compare.jpg');
  });
}
for (const format of ['Html', 'Image']) for (const kind of ['generation', 'before', 'after', 'clear', 'replacement']) {
  test(`${format}: discard ${kind} during initial asynchronous reads`, async () => {
    const h = harness(); const work = h[`saveComparison${format}`](); h.replace(kind);
    if (format === 'Html') { await h.resolveReads(); await work; } else await finishImage(h, work);
    assert.equal(h.downloads.length, 0); assert.equal(h.toasts.length, 0);
  });
}
for (const kind of ['generation', 'before', 'after', 'clear', 'replacement']) test(`JPEG: discard ${kind} during encoding`, async () => {
  const h = harness(); const work = h.saveComparisonImage(); h.resolveImages(); await tick(); assert.equal(h.encodes.length, 1);
  h.replace(kind); h.encodes[0].callback(new Blob(['old JPEG'])); await work;
  assert.equal(h.downloads.length, 0); assert.equal(h.toasts.length, 0);
});
for (const format of ['Html', 'Image']) test(`${format}: reference replacement cancels pending export`, async () => {
  const h = harness(); const work = h[`saveComparison${format}`]();
  const file = new Blob(['reference B'], { type: 'image/jpeg' }); file.name = 'reference-B.jpg';
  await h.loadReference(file); assert.equal(h.state.phase, 'ready'); assert.equal(h.state.capturedBlob, null);
  if (format === 'Html') { await h.resolveReads(); await work; } else await finishImage(h, work);
  assert.equal(h.downloads.length, 0); assert.equal(h.toasts.length, 0);
});
for (const format of ['Html', 'Image']) for (const language of ['en', 'ja']) test(`${format}: immutable ${language} click snapshot and later form edits survive`, async () => {
  const h = harness({ language, layout: 'stacked' }); h.outputFilename.value = 'A:/?.jpg';
  const work = h[`saveComparison${format}`]();
  h.outputFilename.value = 'next-file'; h.nodes['#comparisonComment'].value = 'Next comment'; h.nodes['#comparisonLayout'].value = 'side-by-side';
  h.state.language = language === 'en' ? 'ja' : 'en'; h.state.captureRatio = 9 / 16; h.state.capturedAt.setFullYear(2030);
  if (format === 'Html') { await h.resolveReads(); await work; } else await finishImage(h, work);
  assert.equal(h.outputFilename.value, 'next-file'); assert.equal(h.nodes['#comparisonComment'].value, 'Next comment');
  assert.equal(h.downloads.length, 1); assert.equal(h.downloads[0].filename, `A----compare${format === 'Image' ? '-stacked.jpg' : '.html'}`);
  assert.equal(h.toasts[0].message, `${language}:${format === 'Image' ? 'comparisonSaved' : 'htmlSaved'}`);
  if (format === 'Html') {
    const html = await h.downloads[0].blob.text();
    assert.match(html, new RegExp(`<html lang="${language}">`)); assert.match(html, /Capture A &lt;private&gt;/); assert.doesNotMatch(html, /Next comment|2030/);
    assert.match(html, /2020/); assert.match(html, /aspect-ratio:1.7777777777777777;/);
    assert.ok(html.includes(`${language}:downloadBefore`)); assert.ok(html.includes(`${language}:downloadAfter`));
    assert.ok(html.includes(Buffer.from(await h.before.arrayBuffer()).toString('base64'))); assert.ok(html.includes(Buffer.from(await h.after.arrayBuffer()).toString('base64')));
    assert.match(html, /download="A----before.jpg"/);
  } else assert.deepEqual([h.encodes[0].width, h.encodes[0].height], [160, 268]);
});
for (const format of ['Html', 'Image']) for (const field of ['capturedBlob', 'alignedBeforeBlob']) test(`${format}: missing ${field} is a no-op`, async () => {
  const h = harness(); h.state[field] = null; await h[`saveComparison${format}`]();
  assert.equal(h.reads.length + h.images.length + h.encodes.length + h.downloads.length, 0);
});
test('same-result repeated exports keep their own filename and layout', async () => {
  const h = harness(); const first = h.saveComparisonImage(); h.outputFilename.value = 'second'; h.nodes['#comparisonLayout'].value = 'stacked'; const second = h.saveComparisonImage();
  h.resolveImages(); await tick(); assert.equal(h.encodes.length, 2);
  h.encodes[1].callback(new Blob(['second'])); h.encodes[0].callback(new Blob(['first'])); await Promise.all([first, second]);
  assert.deepEqual(h.downloads.map(x => x.filename), ['second-compare-stacked.jpg', 'capture-A-compare.jpg']);
  assert.deepEqual(h.encodes.map(x => [x.width, x.height]), [[320, 134], [160, 268]]);
});
test('current image encoding failure rejects without download', async () => {
  const h = harness(); const work = h.saveComparisonImage(); h.resolveImages(); await tick(); h.encodes[0].callback(null);
  await assert.rejects(work, /Canvas encoding failed/); assert.equal(h.downloads.length, 0);
});
test('current HTML read failure rejects without download', async () => {
  const h = harness(); const work = h.saveComparisonHtml(); h.reads[0].reader.onerror(); await assert.rejects(work, /FileReader failed/); assert.equal(h.downloads.length, 0);
});

test('comparison HTML keeps interactive viewer behavior and privacy boundary', async () => {
  const h = harness({ layout: 'stacked' }); const work = h.saveComparisonHtml(); await h.resolveReads(); await work;
  const html = await h.downloads[0].blob.text();
  for (const mode of ['split', 'ghost', 'blink']) assert.ok(html.includes(`data-mode="${mode}"`));
  assert.match(html, /prefers-reduced-motion/); assert.match(html, /ArrowLeft/); assert.match(html, /default-src 'none'/);
  assert.match(source, /function openHtmlExportDialog\(\).*exportHtmlDialog.showModal\(\)/);
  assert.match(source, /helpExportSnapshot: 'Comparison exports use/);
  assert.match(source, /helpExportSnapshot: '比較保存は操作時点/);
});
test('blank filename falls back to a valid stable export name', async () => {
  const h = harness(); h.outputFilename.value = '...   '; const work = h.saveComparisonImage(); await finishImage(h, work);
  assert.match(h.downloads[0].filename, /^photo-reenact-\d{4}-\d{2}-\d{2}-compare.jpg$/);
});
test('JPEG field edits during encoding remain untouched and apply next time', async () => {
  const h = harness(); const work = h.saveComparisonImage(); h.resolveImages(); await tick();
  h.outputFilename.value = 'edited-during-encoding'; h.nodes['#comparisonLayout'].value = 'stacked';
  h.encodes[0].callback(new Blob(['JPEG'])); await work;
  assert.equal(h.downloads[0].filename, 'capture-A-compare.jpg'); assert.equal(h.outputFilename.value, 'edited-during-encoding');
  assert.equal(h.nodes['#comparisonLayout'].value, 'stacked');
});
for (const boundary of ['html-read', 'image-decode', 'image-encode']) for (const kind of ['generation', 'before', 'after', 'clear']) test(`${boundary}: obsolete ${kind} failure is silently discarded`, async () => {
  const h = harness(); const work = boundary === 'html-read' ? h.saveComparisonHtml() : h.saveComparisonImage();
  if (boundary === 'image-encode') { h.resolveImages(); await tick(); }
  h.replace(kind);
  if (boundary === 'html-read') h.reads[0].reader.onerror();
  else if (boundary === 'image-decode') h.images[0].onerror();
  else h.encodes[0].callback(null);
  await assert.doesNotReject(work);
  assert.equal(h.downloads.length, 0); assert.equal(h.toasts.length, 0);
});
