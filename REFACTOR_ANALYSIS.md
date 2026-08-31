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
| B. 拆分 `content.js`（6387 行 god-class，原型挂载式） | 高（已用原型挂载式降至低） | ✅ **Stages 1+2 已完成 + 关键 bug 已修复**（2026-08-31）；**Stage 3 已完成**（2026-08-31，浏览器验证零报错）；**Stage 4 已完成**（2026-08-31）：结果弹窗/overlay 渲染引擎外提到 `content-ui.js`，content.js 2610→2124 行；挂载均用 `getOwnPropertyNames`+`defineProperty`（见下） |
| C. 移除 background switch-case 兜底 | 高 | **不建议**（会破坏多引擎对比） |

## Task B 拆分实施（原型挂载式，Stages 1+2）

**方法**：原型挂载式拆分（prototype augmentation）——把方法组整体移到独立文件的 `class JapaneseMethods`，在 `content.js` 类定义后插入 `Object.assign(ScreenshotCapture.prototype, window.JapaneseMethods.prototype)` 挂载。**所有 `this.*` 调用点零改动、行为零变化**，风险从高降到低。每阶段单独提交，可逐级 `git reset --hard` 回滚。

**Stage 1+2（已完成）**：
- 提取 `content.js` L2720–L5307（日/韩/英语翻译引擎，约 2588 行、51 个方法）到新文件 `content-japanese.js`（`class JapaneseMethods`）。
- `content.js` 类定义后插入挂载点（现 L3764）；manifest `content_scripts.js` 在 `content.js` 之前加载 `content-japanese.js`。
- 结果：`content.js` 6355 → **3773 行**；`content-japanese.js` 2600 行。
- 验证：`node --check` 双文件通过；全量 `scripts/syntax-check.js` → 25 个 JS 无错误；引擎方法定义已从 content.js 移除、完整存在于 content-japanese.js；content.js 内仍有 4 处 `this.translateJapaneseToChinese(...)` 调用（经原型解析，符合预期）。
- 提交：`c8ea4d3`（回滚主锚点：`pre-task-b` tag）。

**待做（后续 Stage，同法可继续）**：
- Stage 3 ✅ **已完成**（2026-08-31，浏览器验证零报错）：DOM 文本抽取引擎（`content.js` 原 L590–L1777，约 1188 行、30 个方法）外提到 `content-text-extract.js`（`class TextExtractMethods`）。`content.js` 从 3783 → **2597 行**；manifest 在 `content.js` 之前加载 `content-text-extract.js`；回归测试已扩展覆盖（30/30 挂载）。提交前回滚锚点 `pre-stage-3` tag。
- Stage 4 ✅ **已完成**（2026-08-31）：结果弹窗/overlay 渲染引擎（`content.js` `showTranslationResult` L2082 至 `destroy` L2568，约 487 行、7 个方法）外提到 `content-ui.js`（`class UIMethods`）。`content.js` 2610 → **2124 行**；manifest 在 `content.js` 之前加载 `content-ui.js`；回归测试已扩展覆盖（JP 50/50 + DOM 30/30 + UI 7/7 挂载 + 端到端日语翻译跑通）。提交前回滚锚点 `pre-stage-4` tag @ `0e26bc4`。
- Task B 全部 Stage（1+2 / 3 / 4）现已完成；`content.js` 从 6387 行降至 **2124 行**。下一步：浏览器回归验证 Stage 4（结果弹窗渲染），并视情况更新 README/CHANGELOG。

## 关键 Bug 修复（2026-08-31，静态+动态冒烟测试发现并修复）

**问题**：原型挂载式用 `Object.assign(ScreenshotCapture.prototype, window.JapaneseMethods.prototype)` 挂载 class 方法 —— **但 `class` 里的方法在原型上是 non-enumerable（不可枚举）的，`Object.assign` 只拷贝可枚举属性，于是 51 个引擎方法一个都没挂上原型**。后果：任何调用日/韩/英本地词典翻译路径都会抛 `is not a function`（在线翻译走 background 通道不受影响，所以浏览器手动试用无感知，属潜伏 bug）。

**另一关联点**：经典脚本里顶层 `class JapaneseMethods` 不会挂到 `window`（只有 `var`/`function` 会），所以 `content.js` 的 `if (typeof window.JapaneseMethods !== 'undefined')` 守卫原本会直接跳过。提取脚本已在 `content-japanese.js` 末尾补 `window.JapaneseMethods = JapaneseMethods;` 使守卫通过——但该行 alone 仍不够，因 `Object.assign` 拷贝不动 non-enumerable 方法。

**修复**：`content.js` 挂载点改为遍历 `getOwnPropertyNames` + `defineProperty` 逐个挂载：
```js
const jpProto = window.JapaneseMethods.prototype;
for (const name of Object.getOwnPropertyNames(jpProto)) {
  if (name === 'constructor') continue;
  Object.defineProperty(ScreenshotCapture.prototype, name, Object.getOwnPropertyDescriptor(jpProto, name));
}
```

**验证（Node vm 模拟经典脚本语义，无浏览器）**：
1. 作用域演示：顶层 `class` 不挂 window（与浏览器一致）。
2. 动态加载：修复后 `ScreenshotCapture.prototype` 上引擎方法 `50/50` 挂载成功（修复前为 `0/50`）。
3. 静态交叉引用：`content-japanese.js` 内全部 `this.X()` 调用均可解析（jp 自带 / content.js / 内置 API），无漏带依赖。
4. 端到端：实例化后真实调用 `translateJapaneseToChinese('日本語を勉強します')` 走通 `getPowerfulJapaneseDictionary → powerfulJapaneseTranslation` 字典替换链路，返回含中文结果、不抛错；`smartTranslateEnglish` 分支同样正常调用。
5. 全量 `scripts/syntax-check.js` → 25 个 JS 无错误。

**结论**：挂载正确性已从"靠静态推断"升级为"动态实测验证"。剩余浏览器回归仅作双保险。

**回归脚本（已入库）**：`scripts/regression-jp-engine.js` —— 在 Node `vm` 沙箱（模拟经典脚本语义）按 manifest 顺序加载 `content-japanese.js` + `content-text-extract.js` + `content.js`，断言 (1) `JapaneseMethods.prototype` 的全部方法（含 non-enumerable 的 class 方法）已挂到 `ScreenshotCapture.prototype`；(2) `TextExtractMethods.prototype` 的全部方法同样已挂载（30/30）；(3) 真实实例可端到端调用 `translateJapaneseToChinese` / `smartTranslateEnglish` 且不抛错。失败则 `exit 1`，可接入 CI。运行：`npm run test:jp-engine`（或 `npm test` 含语法校验）。
> 该脚本专门防「`Object.assign` 静默漏拷 class 方法」这一类回归——未来做 Stage 4 若再动挂载逻辑，一键即可拦截。

## 已完成清单

- [x] 删除死代码 `src/`、`i18n.js.bak`
- [x] 工程基线：package.json / eslint.config.js / .prettierrc.json / scripts/syntax-check.js（24 个 JS 语法全通过）
- [x] A：content.js 截图翻译兜底统一到 background（删除重复的 mymemory 实现）
- [x] B（Stages 1+2）：日/韩/英语翻译引擎外提到 content-japanese.js（content.js 6355→3773 行）
- [x] **关键修复**：挂载改用 `getOwnPropertyNames`+`defineProperty`（class 方法 non-enumerable，`Object.assign` 原会漏拷 → 51 个引擎方法全丢）；Node vm 动态实测 50/50 挂载 + 端到端日语翻译跑通
- [x] 回归脚本：`scripts/regression-jp-engine.js`（vm 沙箱断言 50/50 挂载 + 端到端调用），`npm run test:jp-engine` / `npm test` 可一键验证，防止挂载类回归重演

## 建议的下一步（待用户确认）

- **B 浏览器回归（最后一步）**：重新加载插件，在 DevTools Console 把「执行上下文」切到内容脚本世界后做裸名自检（`typeof ScreenshotCapture.prototype.translateJapaneseToChinese === 'function'`），或直接离线截图跑一次本地日语引擎，彻底闭环 B。在线路径你已测过没问题。
- 后续 Stage 3/4（DOM 文本抽取引擎、结果弹窗 UI 外提）视回归结果再推进，均用同源型挂载式；每步先备份、独立提交、可回滚，并跑 `npm test` 确认挂载回归。
- 不建议做 C（删 background switch-case 会破坏多引擎对比）。

## 测试须知（Chrome 隔离世界 / isolated world）

在页面 DevTools 控制台直接敲 `typeof ScreenshotCapture` 会报 `ReferenceError: ScreenshotCapture is not defined` —— **这不是 bug，是隔离世界导致的可见性问题**：

- Chrome 扩展的 content script 运行在「隔离世界」，其顶层 `class ScreenshotCapture` / `JapaneseMethods` 是隔离世界内的词法绑定，不在页面的主世界全局作用域里，所以页面控制台（默认在主世界求值）看不到 `ScreenshotCapture` 这种**词法绑定**。
- 代码里虽然显式赋值了 `window.ScreenshotCapture = ScreenshotCapture`（content.js:2586）、`window.screenshotCaptureInstance`（:2607）、`window.JapaneseMethods`/`window.TextExtractMethods`（各拆分文件末尾）——但**隔离世界里每个世界各自持有一份 `window` 属性层，内容脚本对 `window` 的赋值对页面主世界不可见**。因此在页面主世界控制台里用 `window.ScreenshotCapture` 依然是 `undefined`（正是你遇到的 `Cannot read properties of undefined (reading 'prototype')`）。**`window.` 前缀救不了跨世界可见性。**

**正确的两种验证方式（二选一即可）**：

**① 真正有用的控制台自检 —— 切换「执行上下文」到内容脚本世界**
页面主世界控制台看不到内容脚本。解决办法是让 DevTools 在内容脚本世界求值：
1. F12 打开 DevTools → 切到 **Console** 面板。
2. 看 Console 面板**左上角**有个下拉（默认显示当前页面地址，如 `https://...` 或 `top`）。点开它。
3. 在下拉里找一个**以 `content.js` / `content-japanese.js` / `content-text-extract.js` 命名、或归属本扩展**的上下文项，选中它（切到内容脚本世界后，词法绑定 `ScreenshotCapture` 才可见）。
4. 现在**不要写 `window.` 前缀**，直接输裸名：
```js
typeof ScreenshotCapture                                            // 期望 "function"
typeof ScreenshotCapture.prototype.extractTextFromArea              // 期望 "function"  (Stage 3 抽取引擎)
typeof ScreenshotCapture.prototype.translateJapaneseToChinese       // 期望 "function"  (日语引擎)
```
> 若下拉里没有内容脚本上下文（少数 Chrome 版本/配置看不到），直接用方法 ②，不必纠结。

**② 真实功能测试（最权威、零控制台技巧，强烈推荐）**
不依赖任何控制台世界，直接触发真实代码路径，挂载一旦失败会当场抛 `is not a function`：
- 验证 `extractTextFromArea`（Stage 3 抽引擎）：在任意网页**选中一段文字**触发划词/选区翻译，或**截图翻译框选文本区域**；能正常出结果、控制台无报错即证明挂载成功。
- 验证 `translateJapaneseToChinese`（日语引擎）：DevTools → **Network** → 节流设为 **Offline**（或 Block 翻译 API 域名）强制走本地兜底；打开含**假名**的日文页面（如日文维基词条）截图翻译框选日文；出现本地词典中文结果、无报错即证明日语引擎挂载成功。

> 代码层已用 Node `vm` 沙箱实测（回归脚本 `scripts/regression-jp-engine.js` PASS：JP 引擎 50/50 + DOM 引擎 30/30 挂载、端到端日语翻译跑通），所以挂载逻辑本身正确；以上浏览器步骤是最终闭环确认。
- 隔离世界可见性不影响功能本身：在线翻译走 background 主路径，本地日语引擎仅在在线失败时经 `fallbackTranslate` 兜底触发。
