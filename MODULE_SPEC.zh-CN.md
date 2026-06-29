# QuickTranslate 模块系统規范 v1.0

## 📖 快速开始（5 分鐘上手）

```bash
# 1. 用 CLI 生成模板
node packages/create-qt-module/index.js

# 2. 编輯生成的 .qt-module 文件，实现 translate() 方法

# 3. 打开 QuickTranslate → 🧩 模块 → 📥 导入 → 選擇文件
```

詳細步驟见 [`EXAMPLE.md`](EXAMPLE.md)。

---

## 一、模块格式

每个模块是一个**标准 ES6 类**，包含静态 `manifest` 和生命周期方法。分发时打包为 `.qt-module` 文件（UTF-8 编码的 JS 文件）。

```js
class MyModule {
  static manifest = {
    id: 'engine-myengine',           // <type>-<name>，全小写字母数字连字号
    name: 'My Engine',               // 顯示名称（用英文）
    version: '1.0.0',                // 语義化版本
    author: 'your-github-username',  // 作者
    type: 'translator',              // 模块类型（见第二章）
    description: 'What this module does',  // 简短描述（<=80 字）
    minAppVersion: '2.5.3',          // 最低核心版本
    permissions: [],                 // 需要的 Chrome 权限
    hooks: ['translate:text']        // 监听的事件
  }

  constructor(core) {
    this.core = core  // { eventBus, storage, settings }
  }

  async onActivate()    {}
  async onDeactivate()  {}
  async onSettingsChanged(settings) {}
}

// 必須呼叫此函数注册模块
window.qtDefineModule(MyModule)
```

---

## 二、模块类型

| 类型 | 标识 | 做什么 | 范例 |
|---|---|---|---|
| 翻译引擎 | `translator` | 调用翻译 API | Google、DeepL、Claude |
| 交互模式 | `mode` | 定義翻译觸发方式 | 划詞、懸浮、截图 |
| UI 渲染 | `renderer` | 翻译结果展示 | 气泡、面板、側邊欄 |
| 处理器 | `processor` | 文本前/后处理 | 繁简轉換、術语替換 |
| 服务 | `service` | 背景资料服务 | 歷史记录、云端同步 |
| 主题 | `theme` | UI 视觉主题 | 暗色、毛玻璃 |

**命名規則：** `id` 必須以类型前綴开頭：

| 类型 | id 前綴 | 范例 |
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

| 欄位 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一标识：`<前綴>-<名称>`，全小写字母数字连字号 |
| `name` | string | 顯示名称，建議用英文 |
| `version` | string | 语義化版本号 `x.y.z` |
| `author` | string | 作者（GitHub 用户名） |
| `type` | string | 模块类型 |
| `description` | string | 简短描述（<=80 字） |
| `minAppVersion` | string | 最低核心版本 |

### 可選欄位

| 欄位 | 类型 | 说明 |
|---|---|---|
| `permissions` | string[] | Chrome 权限（`storage`、`https://...`、`clipboardWrite` 等） |
| `hooks` | string[] | 监听的事件列表 |
| `options` | Array | 配置项定義（见下方） |
| `homepage` | string | 项目首頁 URL |
| `icon` | string | 图标（Base64 或 URL） |

### options 格式

如果模块需要用户配置（API Key、模型選擇 等），在 `options` 中定義：

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
  /** 模块被启用时。在这裡訂閱事件、初始化连接。 */
  async onActivate() {}

  /** 模块被禁用或卸載时。取消訂閱、清理资源。 */
  async onDeactivate() {}

  /** 用户在设置頁修改了配置时。 */
  async onSettingsChanged(settings) {}
}
```

**重要：** `onActivate` 和 `onDeactivate` 必須成对。在 `onActivate` 中訂閱的事件，必須在 `onDeactivate` 中取消訂閱。

---

## 五、事件汇流排（EventBus）

模块之间**全部通过事件通讯**，不直接调用对方的方法。

### 核心事件

| 事件 | 方向 | 載荷 | 时机 |
|---|---|---|---|
| `translate:text` | 核心→模块 | `{text, from, to, id, target}` | 翻译请求（target 为模块 ID） |
| `translate:result` | 模块→核心 | `{id, result, engine}` | 翻译成功 |
| `translate:error` | 模块→核心 | `{id, error, engine}` | 翻译失敗 |
| `settings:changed` | 核心→模块 | `{key, value}` | 设置变更 |

### API

```js
// 发送事件
this.core.eventBus.emit('translate:text', { text: 'Hello', from: 'en', to: 'zh-TW', id: 'req-001' })

// 监听事件（返回取消函数）
const unsub = this.core.eventBus.on('translate:text', (data) => { /* data: {text, from, to, id, target} */ })

// 取消訂閱
unsub()

// 一次性监听
this.core.eventBus.once('translate:result', (data) => {})
```

### ⚠️ target 过濾

翻译引擎模块必須在事件回调中檢查 `req.target`，只回应发給自己的请求：

```js
this.core.eventBus.on('translate:text', async (req) => {
  if (req.target && req.target !== 'engine-myengine') return  // ← 必須
  // ... 处理翻译
})
```

---

## 六、翻译引擎模块模板（完整）

```js
class MyEngine {
  static manifest = {
    id: 'engine-deepl',
    name: 'DeepL Translator',
    version: '1.0.0',
    author: 'yourname',
    type: 'translator',
    description: 'DeepL API translation engine',
    minAppVersion: '2.5.3',
    permissions: ['https://api.deepl.com/*'],
    hooks: ['translate:text'],
    options: [
      { key: 'apiKey', type: 'password', label: 'API Key', placeholder: 'Enter DeepL API key' }
    ]
  }

  constructor(core) { this.core = core }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-deepl') return  // target 过濾
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
    // ← 在这裡实现你的翻译邏輯
    // const resp = await fetch('https://api.deepl.com/v2/translate', { ... })
    // const data = await resp.json()
    // return data.translations[0].text
    throw new Error('translate() not implemented')
  }
}

window.qtDefineModule(MyEngine)
```

---

## 七、模块配置存取

用户在 ⚙️ 设置頁保存的配置，通过 `this.core.storage` 读取：

```js
const key = 'moduleSettings.' + this.constructor.manifest.id
const config = await this.core.storage.get(key)
// config: { apiKey: 'xxx', model: 'gpt-4', ... }
```

---

## 八、自定義選项的交互模式模块

不需要处理翻译，只需在启用/停用时做一些操作：

```js
class MyMode {
  static manifest = {
    id: 'mode-my-feature',
    name: 'My Feature',
    version: '1.0.0',
    author: 'yourname',
    type: 'mode',
    description: 'Does something cool',
    minAppVersion: '2.5.3',
    permissions: [],
    hooks: []
  }

  constructor(core) { this.core = core; this._unsubs = [] }

  async onActivate() {
    // 訂閱事件、注册快捷键、插入 UI 元素
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

## 九、开发工具

### CLI 腳手架

```bash
node packages/create-qt-module/index.js
```

互动式问答生成模板，支持 6 种模块类型。生成的文件直接导入 QuickTranslate 即可。

### 快速測试

导入模块后，打开 🧩 模块系统 → 开关打开 → ⚙️ 配置（如有）→ 返回主界面使用。

---

## 十、技術限制

1. **无遠程代码** — 模块必須通过导入安裝，不能从网络加載执行
2. **必須使用 `window.qtDefineModule`** — 否則模块无法被识别
3. **`target` 过濾必須加** — 否則模块会攔截所有翻译请求
4. **配置隔離** — 每个模块的配置獨立存储，无法读取其他模块的配置
5. **沙箱执行** — 第三方模块在 sandbox iframe 中执行，不能直接訪问 `chrome.*` API

---

## 相关文档

- [`EXAMPLE.md`](EXAMPLE.md) — 从零到导入的完整示例
- [`STORE_GUIDE.md`](STORE_GUIDE.md) — 如何发布到模块商店
- [`echo-translator.qt-module`](echo-translator.qt-module) — 可直接导入的真实模块（測试用）

---

*規范版本 v1.0 - 2026-06-26*
