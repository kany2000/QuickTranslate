# QuickTranslate 模块商店指南

## 如何添加一個模块到商店

### 1. 構建 .qt-module 文件

```bash
# 使用腳手架工具生成模板
node packages/create-qt-module/index.js

# 或手动編寫，參考 EXAMPLE.md
```

生成的 `.qt-module` 文件是一個标準的 JS 文件，包含完整的 manifest 和模块邏輯。

### 2. 將 .qt-module 放入 store/ 目錄

```bash
cp your-module.qt-module store/
```

### 3. 在 store/modules.json 中添加條目

打开 `store/modules.json`，在 `modules` 数组中添加：

```json
{
  "id": "engine-your-engine",
  "name": "Your Module Name",
  "version": "1.0.0",
  "author": "Your Name",
  "type": "translator",
  "description": "What this module does",
  "download": "store/your-module.qt-module",
  "size": "2.5 KB"
}
```

### 字段说明

| 字段 | 说明 | 示例 |
|---|---|---|
| id | 唯一标識，與 manifest.id 一致 | engine-deepl |
| name | 模块名稱 | DeepL Translator |
| version | 版本号 | 1.0.0 |
| author | 作者（GitHub 用戶名推薦） | yourname |
| type | 模块类型 | translator / mode / renderer / processor / service / theme |
| description | 簡短描述（<=80字） | DeepL API translation engine |
| download | .qt-module 文件路徑 | store/deepl.qt-module |
| size | 文件大小 | 2.5 KB |

### 4. 提交流程

1. Fork 倉庫
2. 添加你的 .qt-module 文件和更新 store/modules.json
3. 提交 Pull Request
4. 審核通過後合併，網站自动更新
