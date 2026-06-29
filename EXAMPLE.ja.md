# モジュール作成チュートリアル

ゼロから動作するモジュールまで3ステップ。

---

## ステップ 1: CLIで生成

```bash
node packages/create-qt-module/index.js
```

対話型プロンプト:

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

出力: `translator-echo-translator.qt-module`

---

## ステップ 2: コードを編集

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

## ステップ 3: QuickTranslateにインポート

1. Open QuickTranslate → click **🧩 Modules**
2. Click **📥 Import Module**
3. Select your `.qt-module` file
4. Confirm → Module appears in the list, toggle ON

---

## クイックテスト

既存のデモモジュールを使用:

```
echo-translator.qt-module
```

インポート後、翻訳テキストにプレフィックスを追加します。 ⚙️ 設定でプレフィックスを変更できます。

---

## デバッグ

### インポート失敗

確認 `manifest` is complete:

| Field | Type | Description |
|---|---|---|
| `id` | string | Lowercase alphanumeric with hyphens: `engine-mymod` |
| `name` | string | Use English name |
| `version` | string | `x.y.z` format |
| `type` | string | `translator` / `mode` / `renderer` / `processor` / `service` / `theme` |

### 翻訳が動作しない

- 確認 module toggle is **ON**
- Check `onActivate` subscribes to `translate:text`
- Check `target` filter: `if (req.target && req.target !== 'engine-xxx') return`
- Check API endpoint accessibility and API Key

### 設定が保存されない

- `options` field `key` must match the key used in `translate()`
- Config is stored at `moduleSettings.{moduleId}`

---

## 参考例

- [`echo-translator.qt-module`](echo-translator.qt-module) — Minimal translator with options
- [`modules/translator-google.js`](modules/translator-google.js) — Built-in Google Translate module
- [`modules/translator-custom.js`](modules/translator-custom.js) — Custom LLM module
- [`modules/mode-quick-panel.js`](modules/mode-quick-panel.js) — Interaction mode example

---

## 公開

参照 [`STORE_GUIDE.md`](STORE_GUIDE.md) to submit your module to the QuickTranslate Module Store.
