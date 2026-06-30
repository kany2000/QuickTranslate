# 🚀 QuickTranslate - 快譯

<p align="center">
  <a href="https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"/>
  </a>
  <a href="https://github.com/kany2000/QuickTranslate">
    <img src="https://img.shields.io/github/stars/kany2000/QuickTranslate?style=for-the-badge&logo=github" alt="Stars"/>
  </a>
  <img src="https://img.shields.io/badge/version-3.0.0-667EEA?style=for-the-badge" alt="Version 3.0.0"/>
  <img src="https://img.shields.io/badge/license-MIT-764BA2?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/模組系統-Enabled-10b981?style=for-the-badge" alt="Module System"/>
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
  <strong>🌐 瀏覽器划詞即時翻譯 · 支援多引擎 · 模組化可擴展</strong>
</p>

<p align="center">
  <a href="#-功能">功能</a> ·
  <a href="#-模組系統">模組系統</a> ·
  <a href="#-快速開始">快速開始</a> ·
  <a href="docs/spec-zh-TW.html">📖 開發文件</a>
</p>

---

## ✨ 功能

| | 功能 | 說明 |
|---|---|---|
| ⚡ | **划詞翻譯** | 選中文字 → 即時翻譯彈出 |
| 🖱️ | **懸浮翻譯** | 按住 Alt 懸停文字，無需選中 |
| 📷 | **截圖翻譯** | 擷取螢幕區域 → OCR → 翻譯 |
| 🌐 | **多引擎** | Google、Microsoft、GLM、自訂 LLM 及社群模組 |
| 📚 | **歷史與生詞本** | 自動儲存翻譯歷史，收藏生詞 |
| 🧩 | **模組系統** | 透過外掛擴充引擎、主題、模式 |

## 🧩 模組系統

QuickTranslate 3.0 引入完整的模組生態。內建模組涵蓋翻譯引擎、互動模式、服務。第三方開發者可建立和發佈自己的模組。

### 內建模組

| 模組 | 類型 | 說明 |
|---|---|---|
| Google 翻譯 | translator | 免費 Google 翻譯 API |
| Microsoft 翻譯 | translator | Microsoft Translator API |
| GLM 大模型 | translator | 智譜 GLM 大語言模型 |
| 自訂 LLM | translator | OpenAI 相容的自訂 LLM |
| 划詞翻譯 | mode | 文字選擇彈出面板 |
| 浮動翻譯面板 | mode | Ctrl+Shift+Q 浮動面板 |
| 翻譯歷史 | service | 翻譯歷史儲存 |
| 生詞本 | service | 生詞收藏管理 |

### 開發者

```
node packages/create-qt-module/index.js
```

30 秒產生模組範本。匯入 .qt-module 檔案即可使用。

📖 [開發文件](docs/spec-zh-TW.html) · 📝 [教學](docs/example-zh-TW.html) · 📦 [發佈指南](docs/store-guide-zh-TW.html)

## 🚀 快速開始

### 從 Chrome 商店安裝

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba)

### 或開發者模式載入

```
git clone https://github.com/kany2000/QuickTranslate.git
```

1. 打開 chrome://extensions
2. 開啟開發者模式
3. 點擊載入未封裝項目
4. 選擇克隆的目錄

## 📄 授權

MIT — 詳見 LICENSE。

---

<p align="center">
  Made with ❤️ by kany2000 · QuickTranslate v3.0.0
</p>
