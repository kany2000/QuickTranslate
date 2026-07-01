# 🚀 QuickTranslate

<p align="center">
  <a href="https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store"/>
  </a>
  <a href="https://github.com/kany2000/QuickTranslate">
    <img src="https://img.shields.io/github/stars/kany2000/QuickTranslate?style=for-the-badge&logo=github" alt="Stars"/>
  </a>
  <img src="https://img.shields.io/badge/version-3.1.0-667EEA?style=for-the-badge" alt="Version 3.1.0"/>
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
  <strong>🌐 브라우저 텍스트 선택 번역 · 멀티 엔진 · 모듈 확장 가능</strong>
</p>

<p align="center">
  <a href="docs/spec-ko.html">📖 개발자 문서</a>
</p>

---

## ✨ 기능

| | 기능 | 설명 |
|---|---|---|
| ⚡ | 선택 번역 | 텍스트 선택 → 즉시 번역 |
| 🖱️ | 호버 번역 | Alt 키를 누르고 호버 |
| 📷 | 스크린샷 번역 | 영역 캡처 → OCR → 번역 |
| 🌐 | 멀티 엔진 | Google, Microsoft, GLM, Custom LLM |
| 📚 | 기록 및 단어장 | 번역 기록 저장, 단어 저장 |
| 🌙 | 다크 모드 | 시스템 설정 자동 연동, 모든 패널 지원 |
| 🧹 | 텍스트 정리 | 불필요한 공백·줄바꿈·HTML 개체 자동 제거 |
| 💾 | 번역 캐시 | 동일한 문장 API 재호출 없이 빠르게 |
| 🖱️ | 우클릭 번역 | 텍스트 선택 → 우클릭 → 번역 |
| 🧩 | 모듈 시스템 | 플러그인으로 확장 가능 |

## 🧩 모듈 시스템

QuickTranslate 3.0은 완전한 모듈 생태계를 도입합니다. 내장 모듈은 번역 엔진, 상호 작용 모드, 서비스를 포함합니다.

### 내장 모듈

| 모듈 | 타입 | 설명 |
|---|---|---|
| Google 번역 | translator | 무료 Google 번역 API |
| Microsoft 번역 | translator | Microsoft Translator API |
| GLM | translator | Zhipu GLM 대규모 언어 모델 |
| Custom LLM | translator | OpenAI 호환 사용자 정의 LLM |
| 선택 번역 | mode | 텍스트 선택 팝업 |
| 플로트 패널 | mode | Ctrl+Shift+Q 플로팅 패널 |
| 기록 | service | 번역 기록 저장 |
| 단어장 | service | 저장된 단어 관리 |

### 개발자용

```
node packages/create-qt-module/index.js
```

30초 만에 모듈 템플릿 생성. .qt-module 파일을 직접 가져오기.

📖 [개발자 문서](docs/spec-ko.html) · 📝 [튜토리얼](docs/example-ko.html) · 📦 [게시 가이드](docs/store-guide-ko.html)

## 🚀 빠른 시작

### Chrome Web Store에서 설치

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/quicktranslate-%E5%BF%AB%E8%AF%91/dacnbehjlfoahneibfabeoipbkfgegba)

### 개발자 모드로 로드

```
git clone https://github.com/kany2000/QuickTranslate.git
```

1. chrome://extensions 열기
2. 개발자 모드 활성화
3. 압축해제된 확장 프로그램 로드
4. 클론한 디렉토리 선택

## 📄 라이선스

MIT — LICENSE 참조.

---

<p align="center">
  Made with ❤️ by kany2000 · QuickTranslate v3.1.0
</p>
