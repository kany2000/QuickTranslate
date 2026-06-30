# 🚀 QuickTranslate - 快译

<p align="center">
  <a href="https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"/>
  </a>
  <a href="https://github.com/kany2000/QuickTranslate">
    <img src="https://img.shields.io/github/stars/kany2000/QuickTranslate?style=for-the-badge&logo=github" alt="Stars"/>
  </a>
  <img src="https://img.shields.io/badge/version-3.0.0-667EEA?style=for-the-badge" alt="Version 3.0.0"/>
  <img src="https://img.shields.io/badge/license-MIT-764BA2?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/模块系统-Enabled-10b981?style=for-the-badge" alt="Module System"/>
</p>

<p align="center">
  🌐
  <a href="README.md">简体中文</a> ·
  <a href="README-en.md">English</a> ·
  <a href="README-ja.md">日本語</a> ·
  <a href="README-ko.md">한국어</a> ·
  <a href="README-zh-TW.md">繁體中文</a>
</p>

<p align="center">
  <strong>🌐 浏览器划词即时翻译插件 · 支持多引擎 · 模块化可扩展</strong>
</p>

<p align="center">
  <a href="#-功能">功能</a> ·
  <a href="#-模块系统">模块系统</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-开发">开发</a> ·
  <a href="docs/spec-zh-CN.html">📖 开发文档</a>
</p>

---

## ✨ 功能

| | 功能 | 说明 |
|---|---|---|
| ⚡ | **划词翻译** | 选中文字 → 即时翻译弹出 |
| 🖱️ | **悬浮翻译** | 按住 Alt 悬停文字，无需选中 |
| 📷 | **截图翻译** | 截取屏幕区域 → OCR → 翻译 |
| 🌐 | **多引擎** | Google、Microsoft、GLM、自定义 LLM 及社区模块 |
| 📚 | **历史与生词本** | 自动保存翻译历史，收藏生词 |
| 🧩 | **模块系统** | 通过插件扩展引擎、主题、模式 |

## 🧩 模块系统

QuickTranslate 3.0 引入完整的模块生态。内置模块覆盖翻译引擎、交互模式、服务。第三方开发者可创建和分发自己的模块。

### 内置模块

| 模块 | 类型 | 说明 |
|---|---|---|
| Google Translate | translator | 免费 Google 翻译 API |
| Microsoft Translator | translator | Microsoft Translator API |
| GLM 大模型 | translator | 智谱 GLM 大语言模型 |
| 自定义 LLM | translator | OpenAI 兼容的自定义 LLM |
| 划词翻译 | mode | 文字选择弹出面板 |
| 浮动翻译面板 | mode | Ctrl+Shift+Q 浮动面板 |
| 翻译历史 | service | 翻译历史存储 |
| 生词本 | service | 生词收藏管理 |

### 开发者

```
node packages/create-qt-module/index.js
```

30 秒生成模块模板。导入 `.qt-module` 文件即可使用。

📖 [开发文档](docs/spec-zh-CN.html) · 📝 [教程](docs/example-zh-CN.html) · 📦 [发布指南](docs/store-guide-zh-CN.html)

## 🚀 快速开始

### 从 Chrome 商店安装

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba)

### 或开发者模式加载

```bash
git clone https://github.com/kany2000/QuickTranslate.git
```

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择克隆的目录

### 默认快捷键

| 快捷键 | 操作 |
|---|---|
| `Alt+1` | 智能翻译（自动检测→目标语言）|
| `Ctrl+Shift+Q` | 打开浮动面板 |

## 🛠️ 开发

### 项目结构

```
QuickTranslate/
├── core/                  # 模块系统核心
│   ├── event-bus.js       # 事件总线
│   └── module-loader.js   # 模块注册与生命周期
├── modules/               # 内置模块
│   ├── translator-*.js    # 翻译引擎
│   ├── mode-*.js          # 交互模式
│   └── service-*.js       # 后台服务
├── packages/
│   └── create-qt-module/  # CLI 脚手架
├── docs/                  # 开发者文档
├── store/                 # 模块商店
├── popup.html/js/css      # 弹出窗口
├── background.js          # 服务工作线程
├── content.js             # 截图捕捉
├── quick-panel.js         # 划词/悬浮翻译
└── float-panel.js         # 浮动面板
```

### 构建发布

```bash
powershell -File build-release.ps1 -Version "3.0.0"
```

## 📄 许可证

MIT — 详见 [LICENSE](LICENSE)。

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/kany2000">kany2000</a> · QuickTranslate v3.0.0
</p>