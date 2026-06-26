# QuickTranslate 模塊系統規範 v1.0

## 概述

QuickTranslate 模塊系統允許第三方開發者為插件開發獨立功能模塊。核心插件只提供事件匯流排和運行時，所有功能均可由模塊實現。

核心 (Core) 包含：EventBus (事件匯流)、ModuleLoader (模塊載入器)、StorageManager (存儲管理器)。模塊運行在 ModuleLoader 管理的上下文中，通過 EventBus 與核心及其他模塊通訊。

---

## 一、模塊格式

每個模塊是一個標準 ES6 類，包含靜態 manifest 屬性和生命周期方法。分發時打包為 .qt-module 文件（UTF-8 編碼的 JS 文件）。

### 最小模板

```js
class MyModule {
  // 模塊清單（必填）
  static manifest = {
    id: 'engine-myengine',           // 唯一標識
    name: '我的翻譯引擎',              // 顯示名稱
    version: '1.0.0',                // 語義化版本
    author: 'developer',             // 作者
    type: 'translator',              // 模塊類型
    description: '自定義翻譯引擎',     // 簡短描述
    minAppVersion: '2.5.3',          // 最低核心版本
    permissions: [],                 // 需要的權限
    hooks: ['translate:text']        // 監聽的事件
  }

  // 核心引用（由 Loader 注入）
  constructor(core) {
    this.core = core  // { eventBus, storage, settings }
  }

  // 生命周期
  async onActivate()    {}
  async onDeactivate()  {}
  async onSettingsChanged(settings) {}
}

// 導出
window.qtDefineModule(MyModule)
```

---

## 二、模塊類型

| 類型 | 標識 | 作用 | 示例 |
|---|---|---|---|
| 翻譯引擎 | translator | 實現翻譯 API 調用 | Google、DeepL、Claude |
| 交互模式 | mode | 定義翻譯觸發方式 | 選詞翻譯、懸浮翻譯、截圖 |
| UI 渲染 | renderer | 自定義翻譯結果展示 | 彈窗、側邊欄、氣泡 |
| 處理器 | processor | 文本預處理/後處理 | 繁簡轉換、術語替換 |
| 服務 | service | 背景持久化服務 | 歷史記錄、Anki 同步 |
| 主題 | theme | UI 視覺主題 | 暗色模式、毛玻璃 |

---

## 三、模塊清單（manifest）完整欄位

```typescript
interface ModuleManifest {
  id: string          // <type>-<name>，全小寫字母數字連字號
  name: string        // 顯示名稱
  version: string     // 語義化版本
  author: string      // 作者（推薦 GitHub 用戶名）
  type: 'translator' | 'mode' | 'renderer' | 'processor' | 'service' | 'theme'
  description: string // 簡短描述（<=80 字）
  minAppVersion: string // 最低兼容的核心版本
  permissions: string[] // Chrome 權限
  hooks: string[]     // 監聽的事件列表
  optionsPage?: string | null // 配置頁 URL
  icon?: string | null        // 圖標（Base64）
  homepage?: string | null    // 首頁 URL
}
```

### permissions 示例

```js
permissions: [
  'storage',
  'https://api.deepl.com/*',
  'clipboardWrite'
]
```

---

## 四、生命周期鉤子

```js
class MyModule {
  /** 模塊被啟用時調用。訂閱事件、初始化 UI、建立連接。 */
  async onActivate() {}

  /** 模塊被禁用或卸載時調用。取消訂閱、清理 UI、關閉連接。 */
  async onDeactivate() {}

  /** 用戶修改了模塊設置時調用。 */
  async onSettingsChanged(settings) {}
}
```

---

## 五、事件匯流排（EventBus）

### 核心預定義事件

| 事件名 | 方向 | 載荷 | 說明 |
|---|---|---|---|
| translate:text | 核心->模塊 | {text, from, to, id} | 翻譯請求 |
| translate:result | 模塊->核心 | {id, result, engine} | 翻譯結果 |
| translate:error | 模塊->核心 | {id, error, engine} | 翻譯錯誤 |
| settings:changed | 核心->模塊 | {key, value, full} | 設置變更 |
| ui:show-result | 核心->模塊 | {text, result, engine} | 展示結果 |
| ui:show-panel | 模塊->核心 | {panel, data} | 顯示面板 |
| shortcut:trigger | 核心->模塊 | {shortcut} | 快捷鍵觸發 |
| module:installed | 核心->模塊 | {moduleId} | 模塊安裝 |
| module:uninstalled | 核心->模塊 | {moduleId} | 模塊卸載 |
| text:selected | 核心->模塊 | {text, x, y} | 用戶選中文字 |
| text:hovered | 核心->模塊 | {text, x, y} | 用戶懸停文字 |

### API

```js
// 發送事件
this.core.eventBus.emit('translate:text', { text, from, to, id })

// 監聽事件 - 返回取消訂閱函數
const unsub = this.core.eventBus.on('translate:text', (data) => {})

// 一次性監聽
this.core.eventBus.once('translate:result', (data) => {})

// 取消訂閱
unsub()

// 監聽所有事件
this.core.eventBus.on('*', (eventName, data) => {})
```

---

## 六、翻譯引擎模塊約定

type: translator 的模塊需要遵循以下模式：

```js
class MyEngine {
  static manifest = {
    id: 'engine-deepl',
    name: 'DeepL 翻譯',
    version: '1.0.0',
    author: 'developer',
    type: 'translator',
    description: 'DeepL API 翻譯引擎',
    minAppVersion: '2.5.3',
    permissions: ['https://api.deepl.com/*'],
    hooks: ['translate:text']
  }

  constructor(core) { this.core = core }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      try {
        const result = await this.translate(req.text, req.from, req.to)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: this.constructor.manifest.id
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: this.constructor.manifest.id
        })
      }
    })
  }

  async onDeactivate() { if (this._unsub) this._unsub() }

  async translate(text, from, to) {
    // 實現具體翻譯邏輯，返回字串
  }
}
```

---

## 七、模塊配置

模塊配置存儲在 chrome.storage.local 的 moduleSettings.{moduleId} 路徑下。

```js
// 讀取
const cfg = await this.core.storage.get('moduleSettings.' + this.constructor.manifest.id)

// 寫入（自動觸發 onSettingsChanged）
await this.core.storage.set('moduleSettings.' + this.constructor.manifest.id, { apiKey: 'xxx' })
```

---

## 八、安裝與卸載

### 安裝流程
1. 用戶下載 .qt-module 文件
2. 在模塊管理頁面導入
3. ModuleLoader 驗證 manifest -> 存儲 -> 激活

### 卸載流程
1. 用戶點擊卸載
2. ModuleLoader 調用 onDeactivate()
3. 刪除模塊代碼和配置

---

## 九、安全限制

1. **無遠程代碼** — 必須本地安裝（MV3 合規）
2. **權限聲明** — host_permissions 必須在 manifest 中列出
3. **無 DOM 操作**（v1）— 只能通過 EventBus 交互
4. **配置隔離** — 模塊間配置獨立

---

## 附錄：開發環境

```bash
1. 寫 MyModule.js
2. 複製到插件目錄
3. 重啟插件
4. 模塊管理 -> 開發模式 -> 從文件載入
```

---

*規範版本 v1.0 - 2026-06-26*
