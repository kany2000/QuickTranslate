# create-qt-module

QuickTranslate 模塊腳手架工具。一行命令生成模塊模板文件。

## 用法

```bash
# 使用 npm
npx create-qt-module

# 或本地運行
node packages/create-qt-module/index.js
```

## 生成內容

選擇模塊類型後，會生成一個 `.qt-module` 文件，包含完整的 manifest 和生命周期鉤子模板。

### 翻譯引擎模板

已包含 `translate:text` 事件訂閱和 `target` 過濾，只需實現 `translate()` 方法。

### 交互模式模板

已包含 `onActivate` / `onDeactivate` 生命周期，適合實現划詞、懸浮、快捷操作等模式。

## 開發

```bash
npm link
create-qt-module
```
