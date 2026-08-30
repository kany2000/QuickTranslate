# QuickTranslate 架构清理重构 — 分析与实施记录

> 生成时间：2026-08-30
> 方向：架构清理重构（用户选择）

## 已完成（零风险、已验证）

| 项 | 操作 | 验证 |
|---|---|---|
| 删除死代码 `src/` | `git rm -r src/`（3 文件：dom-extractor / language-detector / performance-monitor，全仓库零引用，保留 git 历史可恢复） | grep 确认无引用 |
| 删除死代码 `i18n.js.bak` | 直接删除（未受 git 追踪，仅 `.gitignore` 的 `*.bak` 匹配） | grep 确认无引用 |
| 工程基线 | 新增 `package.json`、`eslint.config.js`(flat)、`.prettierrc.json`、`.gitignore` 补充；新增 `scripts/syntax-check.js` | `node scripts/syntax-check.js` → ✅ 24 个 JS 文件语法通过（模板占位文件已排除） |

## 翻译引擎统一性分析（关键发现，修正了初步判断）

初步调研认为存在"三套翻译实现"，深入代码后修正：

1. **单条翻译（划词/悬浮/选词即译）**：`background.js` `translateText` 优先走 EventBus → `modules/translator-*.js`（Google/Microsoft/GLM/自定义 LLM），失败才回退 switch-case。模块已是主实现。
2. **多引擎对比**：`background.js` `translateMultiEngine` 直接调用旧 `callGoogleTranslate/callMicrosoftTranslate/callGLMTranslate/callCustomLLMTranslate`。**这些旧方法被多引擎功能复用，不能删除**。
3. **截图翻译**：`content.js` `translateText` → `callGoogleTranslate`（content）实际通过 `chrome.runtime.sendMessage` **委托给 background**（非自带实现）；仅多引擎开关时走 `translateMultiEngine`。

**结论**：翻译引擎层已基本统一在 background（模块 + 多引擎）。真实重复仅一处：
- `content.js` 的 `callBackupTranslateService`（mymemory，L2205）与 `background.js` 的 `callBackupTranslateService`（L1641）重复。background 的 `translateText` 已自带 mymemory 兜底，content 这一层兜底为冗余。

## 待决策的风险项（需 checkpoint）

| 项 | 风险 | 状态 |
|---|---|---|
| A. 删除 `content.js` 冗余 mymemory 兜底，统一依赖 background 兜底 | 中 | ✅ **已完成 + 浏览器验证通过**（2026-08-30）：`callGoogleTranslate` 的 catch 改为统一走 background `translateText`，并删除 content 内 `callBackupTranslateService` 方法 |
| B. 拆分 `content.js`（6387 行：ScreenshotCapture / OCR 管线 / 翻译封装各自成文件） | 高 | 待定（需浏览器回归） |
| C. 移除 background switch-case 兜底 | 高 | **不建议**（会破坏多引擎对比） |

## 已完成清单

- [x] 删除死代码 `src/`、`i18n.js.bak`
- [x] 工程基线：package.json / eslint.config.js / .prettierrc.json / scripts/syntax-check.js（24 个 JS 语法全通过）
- [x] A：content.js 截图翻译兜底统一到 background（删除重复的 mymemory 实现）

## 建议的下一步（待用户确认）

- 中期：做 B 的文件级拆分（不改行为，仅移动代码），每拆一个文件跑语法校验 + 人工加载验证。
- 不建议做 C。
