# 🚀 QuickTranslate

<p align="center">
  <a href="https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"/>
  </a>
  <a href="https://github.com/kany2000/QuickTranslate">
    <img src="https://img.shields.io/github/stars/kany2000/QuickTranslate?style=for-the-badge&logo=github" alt="Stars"/>
  </a>
  <img src="https://img.shields.io/badge/version-3.3.3-667EEA?style=for-the-badge" alt="Version 3.3.3"/>
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
  <strong>🧩 モジュール式翻訳プラグイン · 全機能をモジュールシステムで管理 · 自由にON/OFF、拡張可能</strong>
</p>

<p align="center">
  <a href="#-機能">機能</a> ·
  <a href="#-モジュールシステム">モジュールシステム</a> ·
  <a href="#-クイックスタート">クイックスタート</a> ·
  <a href="docs/spec-ja.html">📖 開発者ドキュメント</a>
</p>

---

## ✨ 機能

| | 機能 | モジュールタイプ | 説明 |
|---|---|---|---|
| ⚡ | 選択翻訳 | mode | テキストを選択するだけで翻訳 |
| 🖱️ | ホバー翻訳 | mode | Altキーを押しながらホバー |
| 📝 | 選択即翻訳 | mode | テキスト選択後に自動翻訳、結果を表示 |
| 📷 | スクリーンショット翻訳 | 内蔵 | 画面領域をキャプチャ → OCR → 翻訳 |
| 🌐 | マルチエンジン比較 | translator | Google/LLMなど同時表示 |
| 🧹 | テキスト整形 | processor | 余分な空白・改行・HTML実体を自動除去 |
| 🛡️ | コード保護 | processor | コードブロックを翻訳から保護 |
| 💾 | 翻訳キャッシュ | service | LRUキャッシュ、同じ文章を高速化 |
| 📚 | 履歴と単語帳 | service | 翻訳履歴の保存、単語の保存 |
| 🌙 | ダークモード | style | システム設定に自動追従 |

## 🧩 モジュールシステム（中核アーキテクチャ）

QuickTranslate 3.0 は完全なモジュールエコシステムを導入します。**すべての機能はモジュールです**——選択翻訳、ホバー翻訳、選択即翻訳、翻訳エンジン、テキスト処理、バックグラウンドサービス——すべてモジュールシステムで一元管理。ユーザーは 🧩 モジュールシステムで各モジュールを自由にON/OFFできます。

### 内蔵モジュール

| モジュール | タイプ | 説明 |
|---|---|---|
| Google 翻訳 | translator | 無料 Google 翻訳 API |
| Microsoft 翻訳 | translator | Microsoft Translator API |
| GLM | translator | 智譜 GLM 大規模言語モデル |
| カスタム LLM | translator | OpenAI 互換カスタム LLM |
| 選択翻訳 | mode | テキスト選択ポップアップ |
| フロートパネル | mode | Ctrl+Shift+Q フロートパネル |
| 選択即翻訳 | mode | テキスト選択後に自動翻訳 |
| テキスト整形 | processor | 選択テキストのフォーマットを自動クリーン |
| コード保護 | processor | コードブロックを翻訳から保護 |
| 翻訳キャッシュ | service | LRU キャッシュ、200 エントリ |
| 履歴 | service | 翻訳履歴ストレージ |
| 単語帳 | service | 保存された単語管理 |

### 開発者向け

```
node packages/create-qt-module/index.js
```

30秒でモジュールテンプレートを生成。.qt-module ファイルを直接インポート。

📖 [開発者ドキュメント](docs/spec-ja.html) · 📝 [チュートリアル](docs/example-ja.html) · 📦 [公開ガイド](docs/store-guide-ja.html)

## 🚀 クイックスタート

### Chrome Web Store からインストール

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba)

### デベロッパーモードで読み込み

```
git clone https://github.com/kany2000/QuickTranslate.git
```

1. chrome://extensions を開く
2. デベロッパーモードを有効にする
3. パッケージ化されていない拡張機能を読み込む
4. クローンしたディレクトリを選択

## 📄 ライセンス

MIT — LICENSE をご覧ください。

---

<p align="center">
  Made with ❤️ by kany2000 · QuickTranslate v3.3.3
</p>
