# QuickTranslate v3.3.0

---

## 🌐 模塊名稱多語言 / Module Name i18n

**中文**：所有內置模塊的名稱現在支援 5 種界面語言。切換語言時，模塊列表中的名稱會自動跟隨變化。

**English**: All built-in module names now support 5 interface languages. Module names in the module list update automatically when you switch the UI language.

---

## ⚡ Service Worker 穩定性 / SW Stability

**中文**：修復了「Extension context invalidated」導致 Service Worker 反覆崩潰的問題。新增全局錯誤捕獲，未處理的 Promise rejection 不再會讓 SW 停止工作。

**English**: Fixed the "Extension context invalidated" error that caused the Service Worker to crash repeatedly. Added global error handlers — unhandled Promise rejections no longer terminate the SW.

---

## 🖼️ 截圖翻譯支援多引擎 / Screenshot Multi-Engine

**中文**：截圖翻譯現在也會檢查多引擎對比開關。開啟後，截圖翻譯結果會取多引擎中第一個成功的結果。

**English**: Screenshot translate now respects the multi-engine comparison setting. When enabled, it uses the first successful result from all available engines.

---

## 🧹 UI 清理 / UI Cleanup

**中文**：移除了彈窗主界面的划詞/懸浮/選詞即譯開關，所有模式統一由 🧩 模塊系統管理。界面更簡潔。

**English**: Removed mode toggles (selection/hover/select-to-translate) from the main popup. All modes are now managed exclusively through the 🧩 Module System for a cleaner interface.

---

## 🔧 其他修復 / Other Fixes

- 高級設置按鈕在 UI 清理後無法點擊 / Settings button not clickable after cleanup
- 多引擎對比下 LLM 結果不顯示 / LLM results missing in multi-engine mode
- 模塊系統中「內聯翻譯」更名為「選詞即譯」 / Renamed "Inline Translate" to "Select-to-Translate"

---

完整更新日志見 `CHANGELOG.md` / Full changelog at `CHANGELOG.md`