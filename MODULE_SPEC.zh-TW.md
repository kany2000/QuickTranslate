# QuickTranslate 模塊系統規範 v1.0

## 📖 快速開始（5 分鐘上手）

```bash
# 1. 用 CLI 生成模板
node packages/create-qt-module/index.js

# 2. 編輯生成的 .qt-module 文件，實現 translate() 方法

# 3. 打開 QuickTranslate → 🧩 模塊 → 📥 導入 → 選擇文件
```

詳細步驟見 [`EXAMPLE.md`](EXAMPLE.md)。

---

## 一、模塊格式

每個模塊是一個**標準 ES6 類**，包含靜態 `manifest` 和生命周期方法。分發時打包為 `.qt-module` 文件（UTF-8 編碼的 JS 文件）。

```js
class MyModule {
  static manifest = {
    id: 'engine-myengine',           // <type>-<name>，全小寫字母數字連字號
    name: 'My Engine',               // 顯示名稱（用英文）
    version: '1.0.0',                // 語義化版本
    author: 'your-github-username',  // 作者
    type: 'translator',              // 模塊類型（見第二章）
    description: 'What this module does',  // 簡短描述（<=80 字）
    minAppVersion: '2.5.4',          // 最低核心版本
    permissions: [],                 // 需要的 Chrome 權限
    hooks: ['translate:text']        // 監聽的事件
  }

  constructor(core) {
    this.core = core  // { eventBus, storage, settings }
  }

  async onActivate()    {}
  async onDeactivate()  {}
  async onSettingsChanged(settings) {}
}

// 必須呼叫此函數註冊模塊
window.qtDefineModule(MyModule)
```

---

## 二、模塊類型

| 類型 | 標識 | 做什麼 | 範例 |
|---|---|---|---|
| 翻譯引擎 | `translator` | 調用翻譯 API | Google、DeepL、Claude |
| 交互模式 | `mode` | 定義翻譯觸發方式 | 划詞、懸浮、截圖 |
| UI 渲染 | `renderer` | 翻譯結果展示 | 氣泡、面板、側邊欄 |
| 處理器 | `processor` | 文本前/後處理 | 繁簡轉換、術語替換 |
| 服務 | `service` | 背景資料服務 | 歷史記錄、雲端同步 |
| 主題 | `theme` | UI 視覺主題 | 暗色、毛玻璃 |

**命名規則：** `id` 必須以類型前綴開頭：

| 類型 | id 前綴 | 範例 |
|---|---|---|
| translator | `engine-` | `engine-deepl` |
| mode | `mode-` | `mode-my-feature` |
| renderer | `renderer-` | `renderer-bubble` |
| processor | `processor-` | `processor-format` |
| service | `service-` | `service-sync` |
| theme | `theme-` | `theme-dark` |

---

## 三、manifest 完整欄位

### 基本欄位（必填）

| 欄位 | 類型 | 說明 |
|---|---|---|
| `id` | string | 唯一標識：`<前綴>-<名稱>`，全小寫字母數字連字號 |
| `name` | string | 顯示名稱，建議用英文 |
| `version` | string | 語義化版本號 `x.y.z` |
| `author` | string | 作者（GitHub 用戶名） |
| `type` | string | 模塊類型 |
| `description` | string | 簡短描述（<=80 字） |
| `minAppVersion` | string | 最低核心版本 |

### 可選欄位

| 欄位 | 類型 | 說明 |
|---|---|---|
| `permissions` | string[] | Chrome 權限（`storage`、`https://...`、`clipboardWrite` 等） |
| `hooks` | string[] | 監聽的事件列表 |
| `options` | Array | 配置項定義（見下方） |
| `homepage` | string | 項目首頁 URL |
| `icon` | string | 圖標（Base64 或 URL） |

### options 格式

如果模塊需要用戶配置（API Key、模型選擇 等），在 `options` 中定義：

```js
options: [
  { key: 'apiKey', type: 'password', label: 'API Key', placeholder: 'Enter your key' },
  { key: 'model', type: 'select', label: 'Model', options: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5', label: 'GPT-3.5' }
  ]},
  { key: 'temperature', type: 'number', label: 'Temperature', default: 0.1 }
]
```

支持的 type：`text`、`password`、`number`、`select`。

---

## 四、生命周期

```js
class MyModule {
  /** 模塊被啟用時。在這裡訂閱事件、初始化連接。 */
  async onActivate() {}

  /** 模塊被禁用或卸載時。取消訂閱、清理資源。 */
  async onDeactivate() {}

  /** 用戶在設置頁修改了配置時。 */
  async onSettingsChanged(settings) {}
}
```

**重要：** `onActivate` 和 `onDeactivate` 必須成對。在 `onActivate` 中訂閱的事件，必須在 `onDeactivate` 中取消訂閱。

---

## 五、事件匯流排（EventBus）

模塊之間**全部通過事件通訊**，不直接調用對方的方法。

### 核心事件

| 事件 | 方向 | 載荷 | 時機 |
|---|---|---|---|
| `translate:text` | 核心→模塊 | `{text, from, to, id, target}` | 翻譯請求（target 為模塊 ID） |
| `translate:result` | 模塊→核心 | `{id, result, engine}` | 翻譯成功 |
| `translate:error` | 模塊→核心 | `{id, error, engine}` | 翻譯失敗 |
| `settings:changed` | 核心→模塊 | `{key, value}` | 設置變更 |

### API

```js
// 發送事件
this.core.eventBus.emit('translate:text', { text: 'Hello', from: 'en', to: 'zh-TW', id: 'req-001' })

// 監聽事件（返回取消函數）
const unsub = this.core.eventBus.on('translate:text', (data) => { /* data: {text, from, to, id, target} */ })

// 取消訂閱
unsub()

// 一次性監聽
this.core.eventBus.once('translate:result', (data) => {})
```

### ⚠️ target 過濾

翻譯引擎模塊必須在事件回調中檢查 `req.target`，只回應發給自己的請求：

```js
this.core.eventBus.on('translate:text', async (req) => {
  if (req.target && req.target !== 'engine-myengine') return  // ← 必須
  // ... 處理翻譯
})
```

---

## 六、翻譯引擎模塊模板（完整）

```js
class MyEngine {
  static manifest = {
    id: 'engine-deepl',
    name: 'DeepL Translator',
    version: '1.0.0',
    author: 'yourname',
    type: 'translator',
    description: 'DeepL API translation engine',
    minAppVersion: '2.5.4',
    permissions: ['https://api.deepl.com/*'],
    hooks: ['translate:text'],
    options: [
      { key: 'apiKey', type: 'password', label: 'API Key', placeholder: 'Enter DeepL API key' }
    ]
  }

  constructor(core) { this.core = core }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-deepl') return  // target 過濾
      try {
        const result = await this.translate(req.text, req.from, req.to)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: 'deepl'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: 'deepl'
        })
      }
    })
  }

  async onDeactivate() { if (this._unsub) this._unsub() }

  async translate(text, from, to) {
    // ← 在這裡實現你的翻譯邏輯
    // const resp = await fetch('https://api.deepl.com/v2/translate', { ... })
    // const data = await resp.json()
    // return data.translations[0].text
    throw new Error('translate() not implemented')
  }
}

window.qtDefineModule(MyEngine)
```

---

## 七、模塊配置存取

用戶在 ⚙️ 設置頁保存的配置，通過 `this.core.storage` 讀取：

```js
const key = 'moduleSettings.' + this.constructor.manifest.id
const config = await this.core.storage.get(key)
// config: { apiKey: 'xxx', model: 'gpt-4', ... }
```

---

## 八、自定義選項的交互模式模塊

不需要處理翻譯，只需在啟用/停用時做一些操作：

```js
class MyMode {
  static manifest = {
    id: 'mode-my-feature',
    name: 'My Feature',
    version: '1.0.0',
    author: 'yourname',
    type: 'mode',
    description: 'Does something cool',
    minAppVersion: '2.5.4',
    permissions: [],
    hooks: []
  }

  constructor(core) { this.core = core; this._unsubs = [] }

  async onActivate() {
    // 訂閱事件、註冊快捷鍵、插入 UI 元素
    console.log('MyMode activated')
  }

  async onDeactivate() {
    // 清理
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
  }
}

window.qtDefineModule(MyMode)
```

---

## 九、開發工具

### CLI 腳手架

```bash
node packages/create-qt-module/index.js
```

互動式問答生成模板，支持 6 種模塊類型。生成的文件直接導入 QuickTranslate 即可。

### 快速測試

導入模塊後，打開 🧩 模塊系統 → 開關打開 → ⚙️ 配置（如有）→ 返回主界面使用。

---

## 十、技術限制

1. **無遠程代碼** — 模塊必須通過導入安裝，不能從網絡加載執行
2. **必須使用 `window.qtDefineModule`** — 否則模塊無法被識別
3. **`target` 過濾必須加** — 否則模塊會攔截所有翻譯請求
4. **配置隔離** — 每個模塊的配置獨立存儲，無法讀取其他模塊的配置
5. **沙箱執行** — 第三方模塊在 sandbox iframe 中執行，不能直接訪問 `chrome.*` API

---

## 相關文檔

- [`EXAMPLE.md`](EXAMPLE.md) — 從零到導入的完整示例
- [`STORE_GUIDE.md`](STORE_GUIDE.md) — 如何發布到模塊商店
- [`echo-translator.qt-module`](echo-translator.qt-module) — 可直接導入的真實模塊（測試用）

---

*規範版本 v1.0 - 2026-06-26*
