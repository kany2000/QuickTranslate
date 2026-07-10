# QuickTranslate — Product Hunt 发布计划

## Tagline
**Modular browser translation — toggle on/off every feature, extend with plugins.**

## 描述（第一段）
QuickTranslate is a free, open-source Chrome extension that reimagines browser translation with a modular architecture. Every feature — selection translate, hover translate, auto-translate, screenshot translate, translation engines, text processors, background services — is a module. You toggle them on/off in one place, no digging through settings pages.

## 功能亮点（3-5 个）
1. **Modular System** — 12 built-in modules (4 translators, 3 modes, 2 processors, 3 services). Enable only what you need.
2. **Multi-Engine** — Google, Microsoft, GLM, custom LLM (OpenAI-compatible). Compare results side by side.
3. **5 Translation Modes** — Selection translate, hover translate (Alt+hover), select-to-translate (auto), screenshot translate (OCR), and context menu (right-click).
4. **Processor Pipeline** — Text sanitizer auto-cleans whitespace/HTML. Code protector keeps code blocks intact. Translation cache (200-entry LRU) skips API for repeated text.
5. **Dark Mode + 5-Language UI** — Automatic dark mode follows your system theme. UI available in English, 中文, 日本語, 한국어.

## Maker Comment 草稿
> Hey everyone! 👋 I built QuickTranslate because I was tired of switching between multiple translation extensions — one for selection, one for hover, one for screenshots. So I built one that does everything, with a module system so you only load what you need.
>
> What started as a simple "select to translate" tool evolved into a full modular platform with 12 built-in modules, 4 translation engines, and even a processor pipeline that sanitizes text and protects code blocks.
>
> It's fully open-source (MIT), and developers can create their own .qt-module files to extend it.
>
> Would love your feedback! 🧩

## 配图方案

| 图 | 内容 |
|----|------|
| **截图1（封面）** | 划词翻译 + 多引擎对比结果，显示 Google/LLM 两个结果卡片 |
| **截图2** | 模块管理界面，展示 12 个模块的开关列表 |
| **截图3** | 暗色模式下的内联翻译（选词即译）浮窗 |
| **GIF** | 选词 → 自动翻译 → 拖拽浮窗 → 点击关闭 的操作流程 |
| **截图4** | 设置页面，展示多引擎配置 |

## 推荐标签
- Chrome Extensions
- Productivity
- Developer Tools
- Translation
- Open Source

## 发布时间建议
- **最佳时间**：周二至周四，太平洋时间 00:01（北京时间下午 3 点左右）
- 发布后前 2 小时最关键，争取在这段时间内获得最多的 upvote

## 发布后推广
1. 发 Twitter/X 帖，@ProductHunt 并带链接
2. 发 Reddit：r/chrome_extensions, r/SideProject, r/opensource
3. 发 Hacker News (Show HN)
4. 更新 GitHub 仓库的 README 顶部加 Product Hunt badge