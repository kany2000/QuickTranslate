# QuickTranslate v3.1.0

---

## 🌙 暗色模式 / Dark Mode

**中文**：自动跟随系统主题切换，弹窗、快捷面板、浮动面板、截图界面全部适配深色背景。

**English**: Automatically follows your system theme. Popup, quick panel, float panel, and screenshot UI all support dark backgrounds seamlessly.

---

## 🧹 文本净化 / Text Sanitizer

**中文**：选中网页文字时常带有多余空格、换行和 HTML 实体残留。新的文本净化处理器在翻译前自动清理这些杂质，输入更干净、翻译更准确。

**English**: When selecting text from web pages, extra whitespace, line breaks, and HTML entities often come along. The new sanitizer processor automatically cleans all of that before translation for better results.

---

## 🛡️ 代码保护 / Code Protection

**中文**：翻译技术内容时，反引号包裹的代码块会被自动识别并保护——翻译引擎只处理周围文字，代码完整保留。

**English**: Code blocks wrapped in backticks are now automatically detected and protected — the translation engine works on the surrounding text while your code stays intact.

---

## 💾 翻译缓存 / Translation Cache

**中文**：相同文字不再重复请求翻译 API。LRU 缓存 200 条，二次翻译瞬间出结果。

**English**: Repeated translations skip the API entirely. LRU cache with 200 entries makes subsequent translations of the same text instant.

---

## 🖱️ 右键翻译 / Context Menu Translation

**中文**：选中文字右键选择「QuickTranslate 翻译」，弹出可拖拽的翻译气泡，支持复制和收藏。

**English**: Right-click any selected text and choose "QuickTranslate 翻译" for a draggable translation bubble with copy and save buttons.

---

## 🔧 Google 翻译 429 修复 / Google Translate 429 Fix

**中文**：Google 免费 API 频繁遇到限流（429）。切换为 `clients5.google.com` + `dict-chrome-ex` 参数，并加入 3 次自动重试（1s → 3s → 5s）。

**English**: Fixed Google's free API rate limiting (HTTP 429). Switched to `clients5.google.com` with `client=dict-chrome-ex` parameters and added automatic retry logic (1s → 3s → 5s backoff).

---

## 📦 内置模块更新 / Built-in Modules Update

| 模块 / Module | 类型 / Type | 说明 / Description |
|---------------|-------------|-------------------|
| 文本净化 Text Sanitizer | processor | 自动清理空白和 HTML 实体 |
| 代码保护 Code Protector | processor | 保护代码不被翻译破坏 |
| 翻译缓存 Translation Cache | service | LRU 缓存 200 条加速 |

---

完整更新日志见 `CHANGELOG.md` / Full changelog at `CHANGELOG.md`.