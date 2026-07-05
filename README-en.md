# 🚀 QuickTranslate

<p align="center">
  <a href="https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"/>
  </a>
  <a href="https://github.com/kany2000/QuickTranslate">
    <img src="https://img.shields.io/github/stars/kany2000/QuickTranslate?style=for-the-badge&logo=github" alt="Stars"/>
  </a>
  <img src="https://img.shields.io/badge/version-3.3.1-667EEA?style=for-the-badge" alt="Version 3.3.1"/>
  <img src="https://img.shields.io/badge/license-MIT-764BA2?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/module%20system-Enabled-10b981?style=for-the-badge" alt="Module System"/>
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
  <strong>🧩 Modular browser translation · All features managed by the module system · Toggle on/off, extend as needed</strong>
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

| | Feature | Module Type | Description |
|---|---|---|---|
| ⚡ | Selection Translate | mode | Select any text, instant translation popup |
| 🖱️ | Hover Translate | mode | Hold Alt + hover, no selection needed |
| 📝 | Select-to-Translate | mode | Auto-translate on selection, result popup |
| 📷 | Screenshot Translate | built-in | Capture area → OCR → translate |
| 🌐 | Multi-Engine | translator | Compare Google / LLM results side by side |
| 🧹 | Text Sanitizer | processor | Auto-clean whitespace, line breaks, HTML entities |
| 🛡️ | Code Protector | processor | Protect code blocks from translation |
| 💾 | Translation Cache | service | LRU cache, faster repeated translations |
| 📚 | History & Word Book | service | Auto-save history, save words |
| 🌙 | Dark Mode | style | Follows system theme automatically |

## 🧩 Module System (Core Architecture)

QuickTranslate 3.0 introduces a complete module ecosystem. **Everything is a module** — selection translate, hover translate, select-to-translate, translation engines, text processors, background services — all managed by the module system. Users can toggle each module on/off freely in 🧩 Module System, no need to switch between multiple settings pages.

### Built-in Modules

| Module | Type | Description |
|---|---|---|
| Google Translate | translator | Free Google Translate API |
| Microsoft Translator | translator | Microsoft Translator API |
| GLM | translator | Zhipu GLM large language model |
| Custom LLM | translator | OpenAI-compatible custom LLM |
| Selection Translate | mode | Text selection popup |
| Float Panel | mode | Ctrl+Shift+Q floating panel |
| Select-to-Translate | mode | Auto-translate on selection |
| Text Sanitizer | processor | Auto-clean text formatting |
| Code Protector | processor | Protect code blocks from translation |
| Translation Cache | service | LRU cache, 200 entries |
| History | service | Translation history storage |
| Word Book | service | Saved words storage |

### For Developers

```
node packages/create-qt-module/index.js
```

Generate a module template in 30 seconds. Import the .qt-module file directly.

📖 [Developer Docs](docs/spec.html) · 📝 [Tutorial](docs/example.html) · 📦 [Store Guide](docs/store-guide.html)

## 🚀 Quick Start

### Install from Chrome Web Store

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba)

### Or load unpacked

```
git clone https://github.com/kany2000/QuickTranslate.git
```

1. Open chrome://extensions
2. Enable Developer mode
3. Click Load unpacked
4. Select the directory

### Default Shortcuts

| Shortcut | Action |
|---|---|
| Alt+1 | Smart Translate |
| Ctrl+Shift+Q | Open Float Panel |

## 📄 License

MIT — see LICENSE.

---

<p align="center">
  Made with ❤️ by kany2000 · QuickTranslate v3.3.1
</p>
