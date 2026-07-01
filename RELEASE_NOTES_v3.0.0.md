# QuickTranslate v3.0.0 — Module System Launch

## 🎉 Milestone: A Modular Translation Platform

This is the largest update in QuickTranslate's history. We've re-architected the entire extension with a **modular system**, transforming QuickTranslate from a translation tool into an extensible translation platform.

## 🧩 Module System

### Core Architecture
- **EventBus** — Event-driven communication layer for all modules
- **ModuleLoader** — Lifecycle management (registration, activation, deactivation)
- **Offscreen Sandbox** — Secured execution environment for third-party code

### Built-in Modules (8)

| Module | Type | Description |
|---|---|---|
| Google Translate | translator | Free Google Translate API |
| Microsoft Translator | translator | Microsoft Translator API |
| GLM | translator | Zhipu GLM large language model |
| Custom LLM | translator | OpenAI-compatible custom LLM |
| Selection Translate | mode | Popup on text selection |
| Float Panel | mode | Ctrl+Shift+Q floating panel |
| History | service | Translation history storage |
| Word Book | service | Saved words management |

### Developer Ecosystem
- **CLI Scaffold** — `node packages/create-qt-module/index.js` generates module templates
- **Module Store** — Embedded in the project website with download & import flow
- **Developer Docs** — Multi-language documentation (CN/EN/JA/KO)
- **Localized Content** — Docs auto-switch language to match your preference

## ✨ New Features

- **Individual Module Toggle** — Enable/disable each module independently
- **Module Settings UI** — Configure modules (API keys, model selection, etc.)
- **Usage Statistics** — Track calls, characters, and success rate per engine
- **Shortcut Sync** — Read actual shortcuts from chrome://extensions/shortcuts
- **Settings Auto-Switch** — Switching off a translator auto-selects an available one

## 🔧 Technical Improvements

- EventBus-driven architecture decouples all modules
- Third-party modules execute in a sandboxed iframe
- Offscreen document heartbeat keeps modules alive
- History & Word Book refactored into independent service modules

## 📦 Downloads

- [QuickTranslate-v3.0.0-user.zip](https://github.com/kany2000/QuickTranslate/releases/download/v3.0.0/QuickTranslate-v3.0.0-user.zip) — Chrome Web Store
- [QuickTranslate-v3.0.0-dev.zip](https://github.com/kany2000/QuickTranslate/releases/download/v3.0.0/QuickTranslate-v3.0.0-dev.zip) — with dev tools

## 📖 Documentation

- [Module Specification](https://qtrans.737703.xyz/docs/spec.html)
- [Developer Tutorial](https://qtrans.737703.xyz/docs/example.html)
- [Store Publishing Guide](https://qtrans.737703.xyz/docs/store-guide.html)

---

*QuickTranslate v3.0.0 — 2026-06-29*