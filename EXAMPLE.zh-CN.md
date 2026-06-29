# 模块制作完整示例

从零开始写一个模块并导入到 QuickTranslate，共 3 步。

---

## 第 1 步：用 CLI 生成模板

```bash
node packages/create-qt-module/index.js
```

終端对话：

```
🧩  QuickTranslate Module Scaffold

Select module type:
  1. Translation Engine — 翻译引擎
  2. Interaction Mode — 交互模式
  ...

Number (1-6): 1
Module name: Echo Translator
Author: myname
Short description: 測试用示范模块
```

生成文件：`translator-echo-translator.qt-module`

---

## 第 2 步：改程式码

打开生成的 `.qt-module` 文件，找到 `translate()` 方法，改成你的邏輯：

```js
// 改之前
async translate(text, from, to) {
  throw new Error('translate() not implemented')
}

// 改之后 — 调用 DeepL API 为例
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

## 第 3 步：导入 QuickTranslate

1. 打开 QuickTranslate → 点底部 **🧩 模块**
2. 点 **📥 导入模块**
3. 選擇你的 `.qt-module` 文件
4. 確认安裝 → 模块出现在列表，开关打开

---

## 快速測试

不想从頭写？直接用已有的示范模块：

```
echo-translator.qt-module
```

导入后，它会把翻译文字加上前綴返回。你可以在 ⚙️ 设置中修改前綴文字。

---

## 调试技巧

### 模块导入失敗

檢查 `manifest` 是否完整：

| 欄位 | 類型 | 说明 |
|---|---|---|
| `id` | string | 全小写字母数字连字号：`engine-mymod` |
| `name` | string | 建議用英文名称 |
| `version` | string | `x.y.z` 格式 |
| `type` | string | `translator` / `mode` / `renderer` / `processor` / `service` / `theme` |

### 翻译不生效

- 確保模块开关是 **ON** 状态
- 檢查 `onActivate` 中有訂閱 `translate:text` 事件
- 檢查事件回调中有 `target` 过濾：`if (req.target && req.target !== 'engine-xxx') return`
- 檢查 API 端点是否可訪问、API Key 是否正確

### 设置不保存

- `options` 的 `key` 必須与 `translate()` 中读取的 key 一致
- 配置存储在 `moduleSettings.{moduleId}` 路徑下

---

## 完整示例參考

- [`echo-translator.qt-module`](echo-translator.qt-module) — 最简翻译引擎（含配置项）
- [`modules/translator-google.js`](modules/translator-google.js) — 内置 Google 翻译模块
- [`modules/translator-custom.js`](modules/translator-custom.js) — 自定義 LLM 模块
- [`modules/mode-quick-panel.js`](modules/mode-quick-panel.js) — 交互模式模块示例

---

## 发布到商店

完成后，按 [`STORE_GUIDE.md`](STORE_GUIDE.md) 提交你的模块到 QuickTranslate 模块商店。
