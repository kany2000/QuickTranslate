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
  <a href="https://github.com/kany2000/QuickTranslate">English</a> ·
  <a href="https://qtrans.737703.xyz/landing-ja.html">日本語</a> ·
  <a href="https://qtrans.737703.xyz/landing-ko.html">한국어</a> ·
  <a href="https://qtrans.737703.xyz/landing-zh-TW.html">繁體中文</a>
</p>

<p align="center">
  <strong>🌐 浏览器划词即时翻译插件 · 支持多引擎 · 模块化可扩展</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-module-system">Module System</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-development">Development</a> ·
  <a href="docs/spec.html">📖 Developer Docs</a>
</p>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| ⚡ | **Selection Translate** | Select any text → instant translation popup |
| 🖱️ | **Hover Translate** | Hold Alt + hover over text, no selection needed |
| 📷 | **Screenshot Translate** | Capture screen area → OCR → translate |
| 🌐 | **Multi-Engine** | Google, Microsoft, GLM, Custom LLM, plus community modules |
| 📚 | **History & Word Book** | Auto-save translation history, save words for review |
| 🧩 | **Modular System** | Extend with plugins: engines, themes, modes — see below |

## 🧩 Module System

QuickTranslate 3.0 introduces a **full module ecosystem**. Built-in modules cover translation engines, interaction modes, and services. Third-party developers can create and distribute their own modules.

### Built-in Modules

| Module | Type | Description |
|---|---|---|
| Google Translate | `translator` | Free Google Translate API |
| Microsoft Translator | `translator` | Microsoft Translator API |
| GLM | `translator` | Zhipu GLM large language model |
| Custom LLM | `translator` | OpenAI-compatible custom LLM |
| Selection Translate | `mode` | Text selection popup |
| Float Panel | `mode` | Ctrl+Shift+Q floating panel |
| History | `service` | Translation history storage |
| Word Book | `service` | Saved words storage |

### For Developers

```
node packages/create-qt-module/index.js
```

Generate a module template in 30 seconds. Import the `.qt-module` file directly into QuickTranslate.

📖 [Developer Documentation](docs/spec.html) · 📝 [Tutorial](docs/example.html) · 📦 [Store Guide](docs/store-guide.html)

## 🚀 Quick Start

### Install from Chrome Web Store

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba)

### Or load unpacked (developer mode)

```bash
git clone https://github.com/kany2000/QuickTranslate.git
```

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the cloned directory

### Default Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+1` | Smart Translate (auto-detect → target language) |
| `Ctrl+Shift+Q` | Open Float Panel |

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│              Popup UI (popup.html)        │
├──────────────────────────────────────────┤
│           Background Service Worker       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ EventBus  │  │ Module   │  │ Storage │ │
│  │ pub/sub   │←→│ Loader   │←→│ Manager │ │
│  └─────┬────┘  └──────────┘  └────────┘ │
│        │                                │
│  ┌─────┴──────┐  ┌──────────────────┐   │
│  │ Translator │  │ Mode / Service   │   │
│  │ Modules    │  │ Modules          │   │
│  └────────────┘  └──────────────────┘   │
├──────────────────────────────────────────┤
│        Content Scripts (injected)        │
│  quick-panel.js · float-panel.js        │
│  content.js · tesseract.min.js          │
└──────────────────────────────────────────┘
```

## 🛠️ Development

### Project Structure

```
QuickTranslate/
├── core/                  # Module system core
│   ├── event-bus.js       # Pub/sub event bus
│   └── module-loader.js   # Module registry & lifecycle
├── modules/               # Built-in modules
│   ├── translator-*.js    # Translation engines
│   ├── mode-*.js          # Interaction modes
│   └── service-*.js       # Background services
├── packages/
│   └── create-qt-module/  # CLI scaffold tool
├── docs/                  # Developer documentation
├── store/                 # Module store
├── popup.html/js/css      # Extension popup
├── background.js          # Service worker
├── content.js / .css      # Screenshot capture
├── quick-panel.js / .css  # Selection/Hover translate
└── float-panel.js / .css  # Floating panel
```

### Build Release

```bash
powershell -File build-release.ps1 -Version "3.0.0"
```

Output in `releases/`:
- `QuickTranslate-v3.0.0-user.zip` — for Chrome Web Store
- `QuickTranslate-v3.0.0-dev.zip` — with dev tools

## 📦 Module Store

Community modules are listed on the [project website](https://qtrans.737703.xyz/) and the `store/` directory.

Want to publish your module? See [STORE_GUIDE.md](STORE_GUIDE.md).

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/kany2000">kany2000</a> · QuickTranslate v3.0.0
  <br>
  <a href="https://github.com/kany2000/QuickTranslate/issues">Report Issue</a> ·
  <a href="https://github.com/kany2000/QuickTranslate/discussions">Discussion</a> ·
  <a href="https://qtrans.737703.xyz/">Website</a>
</p>