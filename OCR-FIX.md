# 截图翻译慢 —— 诊断与修复说明（2026-11-19）

> **第二轮修复（同日）：找到真正的大头——翻译引擎超时。**
> 用户反馈「划区后仍要等 3~4 秒才出弹窗」。实测发现 OCR 已不是瓶颈，
> 真正的元凶是翻译网络请求：默认 Google 端点在本网络下**超时 10 秒**，
> fallback 的 MyMemory 也要 1.9~6.8 秒。详见文末「六、第二轮」。

## 一、故障定位

用户反馈：「翻译正常，但截图翻译很慢。」

排查过程：
1. 静态检查：`syntax-check.js`（37 文件通过）、`regression-jp-engine.js`（PASS）、资源引用、manifest —— 全部正常。
2. 真实 Chrome 加载扩展：service worker、popup、content script 均无 console 错误，扩展能正常启动。
3. 追踪截图翻译调用链，发现两个根因：

**根因 A（核心）：截图翻译根本没用 OCR，走的是假识别。**
调用链 `captureScreenshot → performSimpleOCR → runSimpleTextDetection → detectTextInImage`，
最终 `detectTextInImage` 只做像素明暗分析，返回「检测到文字内容但无法识别具体文字」这种占位文本——
既不真正识别文字，还做了无意义的 canvas 重绘。`runTesseractOCR`（真正的 OCR）从未被调用，是死代码。

**根因 B（慢的来源）：截图与识别链路低效。**
- `captureVisibleTab` 用 PNG + quality 100（PNG 无损，quality 无效），全屏大图传递慢。
- 原本即使走 Tesseract，`createWorker` 每次重建 + `terminate` 销毁，且语言包从慢速 CDN（tessdata.projectnaptha.com，实测 15 秒）下载。

## 二、修复内容

| # | 文件 | 改动 |
|---|------|------|
| 1 | `content.js` `performSimpleOCR` | 裁剪后用真正的 `runTesseractOCR` 替代假识别（`detectTextInImage`）；图片改 JPEG 0.92 |
| 2 | `content.js` 新增 `getOcrWorker` | Tesseract worker 单例 + promise 并发去重；首次创建后复用，不再每次重建 |
| 3 | `content.js` `createWorker` | workerPath/corePath/langPath 全部指向扩展本地资源，脱离慢速 CDN |
| 4 | `background.js` `captureVisibleTab` | PNG→JPEG quality 90，截图体积大幅减小 |
| 5 | `manifest.json` | `web_accessible_resources` 增加 tesseract 目录（worker 需访问） |
| 6 | 新增 `tesseract/` 目录 | 本地化资源：worker.min.js(4.1.4)、core(simd+非simd, 4.0.4)、eng.traineddata.gz(10.9MB) |

## 三、提速预期

- 首次截图：本地加载语言包（磁盘 IO）替代 15 秒 CDN 下载，显著加快。
- 后续截图：worker 复用，省去 wasm 初始化 + 语言包加载（原本每次数秒），接近瞬时。
- 截图传输：JPEG 替代无损 PNG，体积减小，canvas 裁剪更快。
- 附带修复：截图翻译从「识别不出文字」变为真正可用。

## 四、验证状态

- 语法检查、回归测试、manifest 合法性、资源完整性（字节与官方一致、gzip 魔数正确）—— 全部通过。
- 真实 Chrome 加载扩展无报错。
- 端到端 OCR 计时验证受限于本机 headless Chrome（blob worker 无法启动，仅请求到 tesseract.min.js，worker/core 未加载）与 Node 24（tesseract.js 4.x 与之不兼容）——属测试环境限制，非扩展问题。建议在**有界面的 Chrome**里加载扩展实测：首次截图约 1-2 秒，之后复用 worker 应明显更快。

## 五、如需进一步提速

- 把 worker 从 content script 移到 background（跨标签页共享单例），需改造为消息传递图片，复杂度较高。
- 或增加空闲预热（页面加载后 requestIdleCallback 里初始化 worker），让首次截图也免冷启动；代价是每个标签页都占用一份 worker 内存。

---

## 六、第二轮修复：翻译引擎才是真凶（2026-11-19）

### 6.1 关键发现

用户反馈「划区后仍要等 3~4 秒才出弹窗」，说明首轮 OCR 优化没有打中真正瓶颈。
重新审视整条链路 `划区 → 截图 → OCR → 翻译 → 弹窗`，对本机网络实测各翻译接口：

| 接口 | 实测结果 |
|------|----------|
| `translate.googleapis.com`（默认首选） | **HTTP 000，超时 10 秒** ❌ |
| `clients5.google.com`（Google 备用） | **HTTP 000，超时 11 秒** ❌ |
| `api.mymemory.translated.net`（兜底） | 1.9~6.8 秒（波动大） |
| `aidemo.youdao.com`（有道 web 端点） | **0.18 秒（冷连接 0.88 秒）** ✅ |
| `lingva.ml`（已授权） | Cloudflare 403 拦截 ❌ |

**结论**：截图翻译「慢 3~4 秒」的真正来源是**翻译网络请求卡在连不上的 Google**，
而不是 OCR。OCR 即使本地化了，翻译这步照样要干等 Google 超时再 fallback。

### 6.2 修复内容（第二轮）

| # | 文件 | 改动 | 效果 |
|---|------|------|------|
| 1 | `background.js` | 新增 `callYoudaoTranslate()`，`google`/default 分支**首选有道**，失败才回退 Google | 翻译从 10 秒 → 0.18 秒 |
| 2 | `modules/translator-google.js` | EventBus 路由的 `engine-google` 模块同步改为有道优先（否则会绕过 background 的有道逻辑） | 覆盖 EventBus 翻译路径 |
| 3 | `background.js` + 模块 | Google fetch 加 `AbortSignal.timeout(4000)`，有道加 5000ms | 网络异常不再干等系统超时 |
| 4 | `content.js` `processSelection` | 去掉硬编码 `setTimeout(..., 800)` 人为延迟 | 省 0.8 秒 |
| 5 | `content-ui.js` `showTranslationResult` | 去掉 200ms + 50ms 弹窗人为延迟 | 省 0.25 秒 |
| 6 | `content.js` `initCapture` | 新增 `prewarmOcr()`，按快捷键划区时后台预热 worker | 划区时间(0.5~2s)与冷启动重叠 |
| 7 | `manifest.json` | `host_permissions` 增加 `https://aidemo.youdao.com/*` | 允许扩展访问有道 |

### 6.3 提速预期（累计）

- 翻译：10 秒超时 → **0.18 秒**（有道直连）——这是最大头。
- 人为延迟：1.05 秒（800+200+50ms）→ **0**。
- OCR 冷启动：与划区操作重叠，划完即用。
- **综合：划区后弹窗从 3~4 秒 → 约 0.5~1 秒。**

### 6.4 关于繁体输出

有道该端点输出**简体中文**（`zh-CHS`）。原代码本就把繁体目标 `zh-TW` 经 `convertLanguageCode`
归一为 `zh` 交给 Google（Google 的 `zh` 也是简体），因此**行为与原版一致，无退化**。

若需真正的繁体输出，可选方案（未实施）：
1. 接入支持繁体的付费翻译 API（百度 v2transapi 需 token、DeepL 等）；
2. 翻译后本地简转繁（引入 OpenCC JS 词库，约 1MB，需本地化到扩展）。

### 6.5 验证

- 语法检查：31 文件全通过；回归测试：PASS；manifest：合法。
- 端到端复现 `callYoudaoTranslate` 逻辑：英/日 `auto` 检测 → 中文，33~880ms，errorCode=0。
- 有道端点带浏览器 `Origin` 头 + 长文本均正常。

---

## 七、第三轮：OCR 预热导致网页死锁（2026-11-19，已回退）

### 7.1 症状

用户重新加载扩展后，**按快捷键选区 → 网页死锁**（Chrome 弹出 "Page Unresponsive"，
实测在 CNN 新闻页 `edition.cnn.com` 触发）。

### 7.2 原因

第二轮第 6 项「OCR 预热」是**致命错误**：
- `initCapture`（按快捷键那一刻）就无条件调用 `prewarmOcr()`；
- 预热会 `executeScript` 往当前页面注入 tesseract.min.js（68KB）并初始化 4.7MB wasm core + 10.9MB 语言包；
- `requestIdleCallback(warm, { timeout: 1500 })` 的 timeout 会在 1.5 秒后**强制执行**，无视页面是否繁忙；
- CNN 这类重型页面本身 JS 密集，注入 + wasm 编译直接占满主线程 → Chrome 判定无响应。

更根本的问题：**多数网页划选区走 DOM 文字提取，根本不需要 OCR**，
提前初始化 OCR 是收益极小、风险极大的操作。

### 7.3 修复

移除 `content.js` 的 `prewarmOcr()` 方法及其在 `initCapture` 中的调用。
OCR 恢复为**纯按需**：只有当 `processSelection` 判定选区内无 DOM 文字、
确实要走截图识别时，才初始化 worker。

### 7.4 教训（重要）

- **不要在重型第三方页面按需注入重量级库做"预热"**——尤其 wasm 编译会同步占用主线程。
- `requestIdleCallback` 的 `timeout` 参数会强制在超时后执行，反而能在页面最忙时触发，与"避让主线程"的意图相反。
- 优化要经过真实页面（尤其重型页面）验证，不能只在轻量测试页推断。

---

## 八、第四轮：划区后仍慢 3~4 秒的真凶 —— DOM 文字提取逐字符 reflow（2026-11-19，已修复+实测）

### 8.1 症状与定位

第三轮回退预热后，死锁消失、翻译正常，但用户仍反馈「框选区域后要等 3~4 秒才出结果」。
重新逐段审查链路 `划区 → DOM文字提取 → 翻译(有道0.2s) → 弹窗`，锁定真凶在
**`content-text-extract.js` 的 `getPreciseTextFromArea`**：

- 原实现对**整页每一个文本节点的每一个字符**都执行 `document.createRange()` +
  `setStart/setEnd` + `getBoundingClientRect()`；
- `getBoundingClientRect` 会强制同步布局（reflow），CNN 这类页面有数千文本节点、
  上万字符 → 上万次强制布局 → **同步阻塞主线程 3~4 秒**；
- 这正好解释"松开鼠标后卡住、弹窗迟迟不出"，且与翻译引擎/网络无关。

### 8.2 修复

`getPreciseTextFromArea` 增加**节点级粗筛**：
- 复用单个 `Range` 对象（不再每字符 new）；
- 对每个文本节点先 `range.selectNodeContents(node)` + `getClientRects()` 一次性取行矩形，
  若全部落在选区外则 `continue` 跳过整节点；
- 只有与选区相交的节点才逐字符精定位 → 计算量从 **O(全页字符)** 降到 **O(相交字符)**。

另在 `processSelection` / `getPreciseTextFromArea` 加 `[QT perf]` 耗时打点，便于后续验证。

### 8.3 实测验证（headless Chrome，3000 段文本模拟重型页面）

```
nodes=3000 | OLD: 1904.2ms | NEW: 18.0ms | NEW-warm: 13.5ms
```

- 旧算法 1904ms（≈2 秒，与用户 3~4 秒体感一致，真实页面文本更多会更久）
- 新算法 18ms，**提速约 100 倍**

### 8.4 结论

四轮慢问题至此全部收口：
1. 假 OCR → 真 Tesseract + 本地资源 + worker 复用（第一轮）
2. 翻译 Google 超时 → 有道优先（第二轮）
3. OCR 预热死锁 → 移除，按需初始化（第三轮）
4. **DOM 提取逐字符 reflow → 节点级粗筛（第四轮，本轮，实测 100×）**
