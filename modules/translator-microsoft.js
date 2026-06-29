/**
 * QuickTranslate 內置翻譯引擎 - Microsoft Translator
 */

class MicrosoftTranslatorModule {
  static manifest = {
    id: 'engine-microsoft',
    name: 'Microsoft Translator',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'translator',
    description: 'Microsoft Translator API 翻譯引擎',
    minAppVersion: '2.5.4',
    permissions: ['https://api.cognitive.microsofttranslator.com/*'],
    hooks: ['translate:text'],
    options: [
      { key: 'apiKey', type: 'password', label: 'Microsoft API Key', placeholder: '輸入 Microsoft Translator API Key' }
    ]
  }

  constructor(core) {
    this.core = core
    this._unsub = null
    this._langMap = {
      'zh': 'zh-Hans', 'zh-cn': 'zh-Hans', 'zh-CN': 'zh-Hans',
      'zh-TW': 'zh-Hant', 'en': 'en', 'ja': 'ja', 'ko': 'ko',
      'fr': 'fr', 'de': 'de', 'es': 'es'
    }
  }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-microsoft') return
      try {
        // 從 storage 讀取 API key
        const settings = await this.core.storage.get(['apiKeys'])
        const apiKey = settings.apiKeys?.microsoft
        if (!apiKey) throw new Error('Microsoft API Key 未設置')

        const result = await this.translate(req.text, req.from, req.to, apiKey)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: 'microsoft'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: 'microsoft'
        })
      }
    })
  }

  async onDeactivate() { this._unsub?.(); this._unsub = null }

  async translate(text, sourceLang, targetLang, apiKey) {
    const from = this._langMap[sourceLang] || sourceLang
    const to = this._langMap[targetLang] || targetLang
    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${to}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey
      },
      body: JSON.stringify([{ text }])
    })

    if (!response.ok) {
      throw new Error(`Microsoft Translator HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data && data[0] && data[0].translations && data[0].translations[0]) {
      return data[0].translations[0].text
    }
    throw new Error('Microsoft translation failed - invalid response format')
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.MicrosoftTranslatorModule = MicrosoftTranslatorModule
}
