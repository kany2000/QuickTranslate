/**
 * {{NAME}} - QuickTranslate 翻譯引擎模塊
 * 生成於 {{DATE}}
 */

class {{CLASSNAME}} {
  static manifest = {
    id: 'engine-{{ID}}',
    name: '{{NAME}}',
    version: '1.0.0',
    author: '{{AUTHOR}}',
    type: 'translator',
    description: '{{DESCRIPTION}}',
    minAppVersion: '2.5.4',
    permissions: [],
    hooks: ['translate:text'],
    options: []
  }

  constructor(core) {
    this.core = core
    this._unsub = null
  }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-{{ID}}') return
      try {
        const result = await this.translate(req.text, req.from, req.to)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: '{{ID}}'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: '{{ID}}'
        })
      }
    })
  }

  async onDeactivate() {
    if (this._unsub) this._unsub()
    this._unsub = null
  }

  async translate(text, from, to) {
    // TODO: 實現你的翻譯 API 調用
    // 示例: const resp = await fetch('https://api.example.com/translate', { ... })
    // const data = await resp.json()
    // return data.translatedText
    throw new Error('translate() 尚未實現')
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.{{CLASSNAME}} = {{CLASSNAME}}
}
