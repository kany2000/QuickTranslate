'use strict';
/*
 * regression-jp-engine.js
 * ------------------------
 * Headless regression test for the Task-B split of QuickTranslate.
 *
 * It loads content-japanese.js + content.js in a Node `vm` sandbox that mimics
 * Chrome's classic-script (isolated-world) semantics, then asserts:
 *   1. The Japanese/Korean/English engine class mounted onto
 *      ScreenshotCapture.prototype (every method, including the non-enumerable
 *      class methods that a naive Object.assign would silently DROP).
 *   2. The engine is actually callable end-to-end (real dictionary translation,
 *      not just present on the prototype).
 *
 * Why this matters: the original split used Object.assign(), which copies only
 * enumerable properties. ES class methods are NON-enumerable, so Object.assign
 * copied ZERO of the ~50 engine methods -> any local JP/KR/EN translation would
 * throw "is not a function". This script guards against that class of regression.
 *
 * Run: `node scripts/regression-jp-engine.js`  (exit 0 = pass, 1 = fail)
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const jpSrc = fs.readFileSync(path.join(ROOT, 'content-japanese.js'), 'utf8');
const ctSrc = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');

// ---- minimal browser-ish mocks (classic script globals + Chrome API stubs) ----
function makeMock() {
  const t = function () { return m; };
  const m = new Proxy(t, {
    get(_t, p) {
      if (p === 'length') return 0;
      if (p === 'then') return undefined;
      if (p === Symbol.toPrimitive) return () => '';
      if (p === Symbol.iterator) return undefined;
      if (p === 'nodeType') return 1;
      return m;
    },
    set() { return true; },
    apply() { return m; },
    construct() { return m; },
  });
  return m;
}

const sb = {};
sb.window = sb; sb.globalThis = sb; sb.self = sb;
sb.console = console;
sb.setTimeout = setTimeout; sb.clearTimeout = clearTimeout;
sb.setInterval = setInterval; sb.clearInterval = clearInterval;
sb.fetch = () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve('') });
sb.encodeURIComponent = encodeURIComponent; sb.decodeURIComponent = decodeURIComponent;
sb.JSON = JSON; sb.Object = Object; sb.Array = Array; sb.Math = Math;
sb.Date = Date; sb.RegExp = RegExp; sb.Promise = Promise; sb.String = String;
sb.Number = Number; sb.Boolean = Boolean; sb.Error = Error; sb.Symbol = Symbol;
sb.location = makeMock(); sb.navigator = makeMock(); sb.document = makeMock();
sb.MutationObserver = function () { return makeMock(); };
sb.ResizeObserver = function () { return makeMock(); };
sb.chrome = {
  runtime: {
    sendMessage: () => Promise.resolve(),
    lastError: null,
    onMessage: { addListener() {}, removeListener() {} },
    getURL: () => '',
  },
  storage: { local: { get: () => Promise.resolve({}), set: () => Promise.resolve({}) } },
};
sb.addEventListener = () => {};
sb.removeEventListener = () => {};
sb.requestAnimationFrame = (fn) => setTimeout(fn, 0);
vm.createContext(sb);

function fail(msg) { console.error('FAIL: ' + msg); process.exitCode = 1; }

// ---- load order must match manifest: jp engine first, then content.js --------
try {
  vm.runInContext(jpSrc, sb, { filename: 'content-japanese.js' });
  vm.runInContext(ctSrc, sb, { filename: 'content.js' });
} catch (e) {
  fail('failed to load scripts: ' + e.message);
  process.exit(1);
}

// 1) engine class exposed + mounted onto ScreenshotCapture.prototype
if (typeof sb.JapaneseMethods !== 'function') {
  fail('window.JapaneseMethods not defined after loading content-japanese.js');
}
if (typeof sb.ScreenshotCapture !== 'function') {
  fail('window.ScreenshotCapture not defined after loading content.js');
  process.exit(1);
}

const jpProto = sb.JapaneseMethods.prototype;
const jpMethods = Object.getOwnPropertyNames(jpProto).filter((n) => n !== 'constructor');
const scProto = sb.ScreenshotCapture.prototype;

let mounted = 0;
const missing = [];
for (const name of jpMethods) {
  if (typeof scProto[name] === 'function') mounted++;
  else missing.push(name);
}

console.log(`engine methods on JapaneseMethods.prototype : ${jpMethods.length}`);
console.log(`mounted on ScreenshotCapture.prototype       : ${mounted}/${jpMethods.length}`);
if (missing.length) {
  fail('engine methods NOT mounted: ' + missing.join(', '));
}

// 2) end-to-end: real dictionary translation must run without throwing
const inst = sb.screenshotCaptureInstance;
if (!inst || typeof inst.translateJapaneseToChinese !== 'function') {
  fail('screenshotCaptureInstance missing or engine not callable');
  process.exit(process.exitCode || 1);
}

let jaErr = null, jaResult = null;
try { jaResult = inst.translateJapaneseToChinese('日本語を勉強します'); }
catch (e) { jaErr = e; }

if (jaErr) fail('translateJapaneseToChinese threw: ' + jaErr.message);
else {
  console.log('translateJapaneseToChinese("日本語を勉強します") => ' + JSON.stringify(jaResult));
  const hasChinese = /[一-鿿]/.test(jaResult || '');
  if (!hasChinese) fail('JP->ZH result has no Chinese characters (dictionary not applied)');
}

// dictionary data object + a second engine branch must be reachable
let dictOk = false;
try {
  const d = inst.getPowerfulJapaneseDictionary();
  dictOk = d && typeof d === 'object' && Object.keys(d).length > 0;
} catch (e) { fail('getPowerfulJapaneseDictionary threw: ' + e.message); }
if (!dictOk) fail('getPowerfulJapaneseDictionary returned empty/undefined');

let enErr = null;
try { inst.smartTranslateEnglish('Hello world'); }
catch (e) { enErr = e; }
if (enErr) fail('smartTranslateEnglish threw: ' + enErr.message);

// ---- verdict ----
if (process.exitCode) {
  console.error('\n=== REGRESSION TEST: FAIL ===');
  process.exit(1);
}
console.log('\n=== REGRESSION TEST: PASS (engine mounted + callable end-to-end) ===');
process.exit(0);
