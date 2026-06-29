# QuickTranslate 모듈 스토어 가이드

## 모듈을 스토어에 추가하는 방법

### 1. .qt-module 파일 빌드

```bash
# Use the CLI scaffold
node packages/create-qt-module/index.js

# Or write manually, see EXAMPLE.md
```

The generated `.qt-module` file is a standard JS file with a complete manifest and module logic.

### 2. store/ 디렉토리로 복사

```bash
cp your-module.qt-module store/
```

### 3. store/modules.json에 항목 추가

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

### 필드 참조

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

### 4. 제출

1. Fork the repository
2. Add your .qt-module file and update store/modules.json
3. Submit a Pull Request
4. After review and merge, the website updates automatically
