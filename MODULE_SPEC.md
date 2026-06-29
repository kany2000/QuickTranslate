# QuickTranslate Module System Specification v1.0

## 📖 Quick Start (5 minutes)

```bash
# 1. Generate a template with CLI
node packages/create-qt-module/index.js

# 2. Edit the generated .qt-module file, implement translate()

# 3. Open QuickTranslate → 🧩 Modules → 📥 Import → select file
```

See [`EXAMPLE.md`](EXAMPLE.md) for a step-by-step tutorial.

---

## 1. Module Format

Each module is a **standard ES6 class** with a static `manifest` and lifecycle methods. Distributed as `.qt-module` file (UTF-8 encoded JS).

```js
class MyModule {
  static manifest = {
    id: 'engine-myengine',           // <type>-<name>, lowercase alphanumeric with hyphens
    name: 'My Engine',               // Display name (use English)
    version: '1.0.0',                // Semver
    author: 'your-github-username',  // Author
    type: 'translator',              // Module type
    description: 'What this module does',  // Short description (<=80 chars)
    minAppVersion: '2.5.4',          // Minimum core version
    permissions: [],                 // Required Chrome permissions
    hooks: ['translate:text']        // Events to listen to
  }

  constructor(core) {
    this.core = core  // { eventBus, storage, settings }
  }

  async onActivate()    {}
  async onDeactivate()  {}
  async onSettingsChanged(settings) {}
}

// Must call this to register the module
window.qtDefineModule(MyModule)
```

---

## 2. Module Types

| Type | Identifier | Purpose | Example |
|---|---|---|---|
| Translation Engine | `translator` | Call translation APIs | Google, DeepL, Claude |
| Interaction Mode | `mode` | Define how translation triggers | Selection, Hover, Screenshot |
| UI Renderer | `renderer` | Display translation results | Bubble, Panel, Sidebar |
| Processor | `processor` | Text pre/post processing | Format conversion, Term replacement |
| Service | `service` | Background data service | History, Cloud sync |
| Theme | `theme` | UI visual theme | Dark, Glassmorphism |

**Naming convention:** `id` must start with a type prefix:

| Type | id prefix | Example |
|---|---|---|
| translator | `engine-` | `engine-deepl` |
| mode | `mode-` | `mode-my-feature` |
| renderer | `renderer-` | `renderer-bubble` |
| processor | `processor-` | `processor-format` |
| service | `service-` | `service-sync` |
| theme | `theme-` | `theme-dark` |

---

## 3. Manifest Fields

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID: `<prefix>-<name>`, lowercase alphanumeric |
| `name` | string | Display name, use English |
| `version` | string | Semver `x.y.z` |
| `author` | string | Author (GitHub username recommended) |
| `type` | string | Module type |
| `description` | string | Short description (<=80 chars) |
| `minAppVersion` | string | Minimum core version |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `permissions` | string[] | Chrome permissions (`storage`, `https://...`, etc.) |
| `hooks` | string[] | Events to listen to |
| `options` | Array | Configuration fields (see below) |
| `homepage` | string | Project URL |
| `icon` | string | Icon (Base64 or URL) |

### options Format

If the module needs user configuration, define in `options`:

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

Supported types: `text`, `password`, `number`, `select`.

---

## 4. Lifecycle

```js
class MyModule {
  /** Called when module is activated. Subscribe to events, initialize connections. */
  async onActivate() {}

  /** Called when module is disabled or uninstalled. Unsubscribe, clean up. */
  async onDeactivate() {}

  /** Called when user changes configuration in settings page. */
  async onSettingsChanged(settings) {}
}
```

**Important:** `onActivate` and `onDeactivate` must be paired. Events subscribed in `onActivate` must be unsubscribed in `onDeactivate`.

---

## 5. EventBus

### Core Events

| Event | Direction | Payload | When |
|---|---|---|---|
| `translate:text` | Core→Module | `{text, from, to, id, target}` | Translation request (`target` = module ID) |
| `translate:result` | Module→Core | `{id, result, engine}` | Translation success |
| `translate:error` | Module→Core | `{id, error, engine}` | Translation failure |
| `settings:changed` | Core→Module | `{key, value}` | Settings changed |

### API

```js
// Emit event
this.core.eventBus.emit('translate:text', { text:'Hello', from:'en', to:'zh-TW', id:'req-001' })

// Listen (returns unsubscribe function)
const unsub = this.core.eventBus.on('translate:text', (data) => {})

// Unsubscribe
unsub()

// One-time listen
this.core.eventBus.once('translate:result', (data) => {})
```

### ⚠️ target Filter

Translator modules MUST check `req.target` in event callbacks:

```js
this.core.eventBus.on('translate:text', async (req) => {
  if (req.target && req.target !== 'engine-myengine') return  // ← REQUIRED
  // ... handle translation
})
```

---

## 6. Translator Module Template (Complete)

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
    // ← Implement your translation logic here
    // const resp = await fetch('https://api.deepl.com/v2/translate', { ... })
    // const data = await resp.json()
    // return data.translations[0].text
    throw new Error('translate() not implemented')
  }
}

window.qtDefineModule(MyEngine)
```

---

## 7. Module Configuration Access

Config saved by user in ⚙️ settings is accessed via `this.core.storage`:

```js
const key = 'moduleSettings.' + this.constructor.manifest.id
const config = await this.core.storage.get(key)
// config: { apiKey: 'xxx', model: 'gpt-4', ... }
```

---

## 8. Interaction Mode Module Template

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

## 9. Development Tools

### CLI Scaffold

```bash
node packages/create-qt-module/index.js
```

Interactive prompt generates templates for all 6 module types.

### Quick Test

After importing, open 🧩 Modules → toggle ON → ⚙️ configure (if needed) → return to main UI.

---

## 10. Technical Limitations

1. **No remote code** — Modules must be installed via import, cannot be loaded from network
2. **Must use `window.qtDefineModule`** — Otherwise the module won't be recognized
3. **`target` filter required** — Otherwise the module intercepts all translation requests
4. **Config isolation** — Each module's config is stored separately
5. **Sandbox execution** — Third-party modules run in sandbox iframe, cannot access `chrome.*` APIs directly

---

## Related Documents

- [`EXAMPLE.md`](EXAMPLE.md) — Complete walkthrough from zero to imported module
- [`STORE_GUIDE.md`](STORE_GUIDE.md) — How to publish to the Module Store
- [`echo-translator.qt-module`](echo-translator.qt-module) — A real importable module for testing

---

*Spec version v1.0 - 2026-06-26*
