# QuickTranslate モジュールシステム仕様 v1.0

## 📖 クイックスタート（5分）

```bash
# 1. CLIでテンプレートを生成
node packages/create-qt-module/index.js

# 2. 生成された .qt-module ファイルを編集し、translate() を実装

# 3. QuickTranslateを開く → 🧩 モジュール → 📥 インポート → ファイルを選択
```

詳細は [`EXAMPLE.md`](EXAMPLE.md) をご覧ください。

---

## 1. モジュール形式

各モジュールは **標準 ES6 クラス** で、静的 `manifest` とライフサイクルメソッドを持ちます。`.qt-module` ファイル（UTF-8 エンコードの JS）として配布します。

```js
class MyModule {
  static manifest = {
    id: 'engine-myengine',           // <type>-<name>、小文字の英数字とハイフン
    name: 'My Engine',               // 表示名（英語推奨）
    version: '1.0.0',                // セマンティックバージョン
    author: 'your-github-username',  // 作者
    type: 'translator',              // モジュールタイプ
    description: 'What this module does',  // 短い説明（80字以内）
    minAppVersion: '2.5.4',          // 最小コアバージョン
    permissions: [],                 // 必要なChrome権限
    hooks: ['translate:text']        // リッスンするイベント
  }

  constructor(core) {
    this.core = core  // { eventBus, storage, settings }
  }

  async onActivate()    {}
  async onDeactivate()  {}
  async onSettingsChanged(settings) {}
}

// モジュールを登録するためにこの関数を呼び出す
window.qtDefineModule(MyModule)
```

---

## 2. モジュールタイプ

| タイプ | 識別子 | 目的 | 例 |
|---|---|---|---|
| 翻訳エンジン | `translator` | 翻訳APIの呼び出し | Google、DeepL、Claude |
| インタラクションモード | `mode` | 翻訳トリガーの定義 | 選択、ホバー、スクリーンショット |
| UI レンダラー | `renderer` | 翻訳結果の表示 | バブル、パネル、サイドバー |
| プロセッサー | `processor` | テキストの前/後処理 | 書式変換、用語置換 |
| サービス | `service` | バックグラウンドデータサービス | 履歴、クラウド同期 |
| テーマ | `theme` | UI ビジュアルテーマ | ダーク、グラスモーフィズム |

**命名規則：** `id` はタイププレフィックスで始める必要があります：

| タイプ | id プレフィックス | 例 |
|---|---|---|
| translator | `engine-` | `engine-deepl` |
| mode | `mode-` | `mode-my-feature` |
| renderer | `renderer-` | `renderer-bubble` |
| processor | `processor-` | `processor-format` |
| service | `service-` | `service-sync` |
| theme | `theme-` | `theme-dark` |

---

## 3. マニフェストフィールド

### 必須フィールド

| フィールド | タイプ | 説明 |
|---|---|---|
| `id` | string | 一意のID: `<prefix>-<name>`、小文字英数字 |
| `name` | string | 表示名（英語推奨） |
| `version` | string | セマンティックバージョン `x.y.z` |
| `author` | string | 作者（GitHubユーザー名推奨） |
| `type` | string | モジュールタイプ |
| `description` | string | 短い説明（80字以内） |
| `minAppVersion` | string | 最小コアバージョン |

### オプションフィールド

| フィールド | タイプ | 説明 |
|---|---|---|
| `permissions` | string[] | Chrome権限（`storage`、`https://...` 等） |
| `hooks` | string[] | リッスンするイベント |
| `options` | Array | 設定項目の定義 |
| `homepage` | string | プロジェクトURL |
| `icon` | string | アイコン（Base64またはURL） |

### options の書式

```js
options: [
  { key: 'apiKey', type: 'password', label: 'API Key', placeholder: 'Enter your key' },
  { key: 'model', type: 'select', label: 'Model', options: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5', label: 'GPT-3.5' }
  ]},
  { key: 'temperature', type: 'number', label: 'Temperature', default: 0.1 }
]
```

対応タイプ: `text`、`password`、`number`、`select`。

---

## 4. ライフサイクル

```js
class MyModule {
  /** モジュールが有効化されたときに呼ばれます。イベントの購読、接続の初期化を行います。 */
  async onActivate() {}

  /** モジュールが無効化またはアンインストールされたときに呼ばれます。購読解除、クリーンアップを行います。 */
  async onDeactivate() {}

  /** ユーザーが設定を変更したときに呼ばれます。 */
  async onSettingsChanged(settings) {}
}
```

**重要：** `onActivate` と `onDeactivate` は対にして使用してください。`onActivate` で購読したイベントは `onDeactivate` で解除する必要があります。

---

## 5. イベントバス（EventBus）

### コアイベント

| イベント | 方向 | ペイロード | タイミング |
|---|---|---|---|
| `translate:text` | Core→Module | `{text, from, to, id, target}` | 翻訳リクエスト |
| `translate:result` | Module→Core | `{id, result, engine}` | 翻訳成功 |
| `translate:error` | Module→Core | `{id, error, engine}` | 翻訳失敗 |
| `settings:changed` | Core→Module | `{key, value}` | 設定変更 |

### API

```js
// イベントを発行
this.core.eventBus.emit('translate:text', { text:'Hello', from:'en', to:'zh-TW', id:'req-001' })

// リッスン（購読解除関数を返す）
const unsub = this.core.eventBus.on('translate:text', (data) => {})

// 購読解除
unsub()

// 1回だけリッスン
this.core.eventBus.once('translate:result', (data) => {})
```

### ⚠️ target フィルター

翻訳エンジンモジュールはイベントコールバックで `req.target` をチェックする必要があります：

```js
this.core.eventBus.on('translate:text', async (req) => {
  if (req.target && req.target !== 'engine-myengine') return  // ← 必須
  // ... 翻訳を処理
})
```

---

## 6. 翻訳エンジンモジュールテンプレート（完全版）

```js
class MyEngine {
  static manifest = {
    id: 'engine-deepl',
    name: 'DeepL Translator',
    version: '1.0.0',
    author: 'yourname',
    type: 'translator',
    description: 'DeepL API translation engine',
    minAppVersion: '2.5.4',
    permissions: ['https://api.deepl.com/*'],
    hooks: ['translate:text'],
    options: [
      { key: 'apiKey', type: 'password', label: 'API Key', placeholder: 'Enter DeepL API key' }
    ]
  }

  constructor(core) { this.core = core }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-deepl') return  // target filter
      try {
        const result = await this.translate(req.text, req.from, req.to)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: 'deepl'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: 'deepl'
        })
      }
    })
  }

  async onDeactivate() { if (this._unsub) this._unsub() }

  async translate(text, from, to) {
    // ← ここに翻訳ロジックを実装
    throw new Error('translate() not implemented')
  }
}

window.qtDefineModule(MyEngine)
```

---

## 7. モジュール設定へのアクセス

⚙️ 設定で保存された設定は `this.core.storage` からアクセスします：

```js
const key = 'moduleSettings.' + this.constructor.manifest.id
const config = await this.core.storage.get(key)
// config: { apiKey: 'xxx', model: 'gpt-4', ... }
```

---

## 8. インタラクションモードモジュールテンプレート

```js
class MyMode {
  static manifest = {
    id: 'mode-my-feature',
    name: 'My Feature',
    version: '1.0.0',
    author: 'yourname',
    type: 'mode',
    description: 'Does something cool',
    minAppVersion: '2.5.4',
    permissions: [],
    hooks: []
  }

  constructor(core) { this.core = core; this._unsubs = [] }

  async onActivate() {
    console.log('MyMode activated')
  }

  async onDeactivate() {
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
  }
}

window.qtDefineModule(MyMode)
```

---

## 9. 開発ツール

### CLI スキャフォールド

```bash
node packages/create-qt-module/index.js
```

6種類のモジュールタイプに対応したテンプレートを生成します。

### クイックテスト

インポート後、🧩 モジュール → オン → ⚙️ 設定（必要な場合）→ メインUIに戻る

---

## 10. 技術的制限

1. **リモートコード不可** — モジュールはインポートでインストールする必要があり、ネットワークからロード不可
2. **`window.qtDefineModule` 必須** — これがないとモジュールは認識されません
3. **`target` フィルター必須** — ないと全翻訳リクエストを横取りします
4. **設定の分離** — 各モジュールの設定は個別に保存されます
5. **サンドボックス実行** — サードパーティモジュールは sandbox iframe で実行され、`chrome.*` API に直接アクセス不可

---

## 関連ドキュメント

- [`EXAMPLE.md`](EXAMPLE.md) — ゼロからモジュールをインポートするまでの完全チュートリアル
- [`STORE_GUIDE.md`](STORE_GUIDE.md) — モジュールストアへの公開方法
- [`echo-translator.qt-module`](echo-translator.qt-module) — テスト用の実際のインポート可能モジュール

---

*仕様 v1.0 - 2026-06-26*
