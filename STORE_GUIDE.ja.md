# QuickTranslate モジュールストアガイド

## モジュールをストアに追加する方法

### 1. .qt-module ファイルを構築

```bash
# Use the CLI scaffold
node packages/create-qt-module/index.js

# Or write manually, see EXAMPLE.md
```

The generated `.qt-module` file is a standard JS file 完全なマニフェストとモジュールロジックを含みます。

### 2. store/ ディレクトリにコピー

```bash
cp your-module.qt-module store/
```

### 3. store/modules.json にエントリを追加

Open `store/modules.json` and add to the `modules` array:

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

### フィールドリファレンス

| Field | Description | Example |
|---|---|---|
| id | Unique ID, matches manifest.id | engine-deepl |
| name | Module name | DeepL Translator |
| version | Version number | 1.0.0 |
| author | Author (GitHub username) | yourname |
| type | Module type | translator / mode / renderer / ... |
| description | Short description (<=80 chars) | DeepL API translation engine |
| download | .qt-module file path | store/deepl.qt-module |
| size | File size | 2.5 KB |

### 4. 提出

1. Fork the repository
2. Add your .qt-module file and update store/modules.json
3. Submit a Pull Request
4. After review and merge, the website updates automatically
