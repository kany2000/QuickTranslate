# 모듈 생성 튜토리얼

3단계로 모듈 개발하기

---

## 1단계: CLI로 생성

```bash
node packages/create-qt-module/index.js
```

대화형 프롬프트:

```
🧩  QuickTranslate Module Scaffold

Select module type:
  1. Translation Engine
  2. Interaction Mode
  ...

Number (1-6): 1
Module name: Echo Translator
Author: myname
Short description: Demo module for testing
```

출력: `translator-echo-translator.qt-module`

---

## 2단계: 코드 편집

Open the generated `.qt-module` file, find `translate()` and implement your logic:

```js
// Before
async translate(text, from, to) {
  throw new Error('translate() not implemented')
}

// After — DeepL API example
async translate(text, from, to) {
  const resp = await fetch('https://api.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'DeepL-Auth-Key ' + apiKey
    },
    body: JSON.stringify({
      text: [text],
      source_lang: from.toUpperCase(),
      target_lang: to.toUpperCase()
    })
  })
  const data = await resp.json()
  return data.translations[0].text
}
```

---

## 3단계: QuickTranslate에 가져오기

1. Open QuickTranslate → click **🧩 Modules**
2. Click **📥 Import Module**
3. Select your `.qt-module` file
4. Confirm → Module appears in the list, toggle ON

---

## 빠른 테스트

기존 데모 모듈 사용:

```
echo-translator.qt-module
```

After importing, it prepends a prefix to translated text. You can change the prefix in ⚙️ settings.

---

## 디버깅

### 가져오기 실패

Check `manifest` is complete:

| Field | Type | Description |
|---|---|---|
| `id` | string | Lowercase alphanumeric with hyphens: `engine-mymod` |
| `name` | string | Use English name |
| `version` | string | `x.y.z` format |
| `type` | string | `translator` / `mode` / `renderer` / `processor` / `service` / `theme` |

### 번역이 작동하지 않음

- Ensure module toggle is **ON**
- Check `onActivate` subscribes to `translate:text`
- Check `target` filter: `if (req.target && req.target !== 'engine-xxx') return`
- Check API endpoint accessibility and API Key

### 설정이 저장되지 않음

- `options` field `key` must match the key used in `translate()`
- Config is stored at `moduleSettings.{moduleId}`

---

## 참고 예제

- [`echo-translator.qt-module`](echo-translator.qt-module) — Minimal translator with options
- [`modules/translator-google.js`](modules/translator-google.js) — Built-in Google Translate module
- [`modules/translator-custom.js`](modules/translator-custom.js) — Custom LLM module
- [`modules/mode-quick-panel.js`](modules/mode-quick-panel.js) — Interaction mode example

---

## 게시

Follow [`STORE_GUIDE.md`](STORE_GUIDE.md) to submit your module to the QuickTranslate Module Store.
