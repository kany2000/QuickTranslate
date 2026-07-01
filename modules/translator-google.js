/**
 * QuickTranslate 內置翻譯引擎 - Google Translate
 * 
 * 示範模塊：展示如何按照 MODULE_SPEC.md 規範實現翻譯引擎。
 */

class GoogleTranslatorModule {
  static manifest = {
    id: 'engine-google',
    name: 'Google Translate',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'translator',
    description: 'Google 免費翻譯引擎（默認）',
    minAppVersion: '2.5.4',
    permissions: ['https://clients5.google.com/*'],
    hooks: ['translate:text']
  }

  constructor(core) {
    this.core = core
    this._unsub = null
  }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-google') return
      try {
        const result = await this.translate(req.text, req.from, req.to)
        this.core.eventBus.emit('translate:result', {
          id: req.id,
          result,
          engine: 'google'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id,
          error: err.message,
          engine: 'google'
        })
      }
    })
  }

  async onDeactivate() {
    if (this._unsub) {
      this._unsub()
      this._unsub = null
    }
  }

  /**
   * 調用 Google Translate API（含 429 自動重試）
   */
  async translate(text, sourceLang, targetLang) {
    const RETRY_DELAYS = [1000, 3000, 5000]
    let lastError

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&dt=t&ie=UTF-8&oe=UTF-8&q=${encodeURIComponent(text)}`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (response.status === 429 && attempt < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[attempt]
          console.warn(`Google Translate 429 (attempt ${attempt + 1}), retrying in ${delay}ms...`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }

        if (!response.ok) {
          throw new Error(`Google Translate HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (data && data[0] && Array.isArray(data[0])) {
          let translatedText = ''
          for (const segment of data[0]) {
            if (segment && segment[0]) {
              translatedText += segment[0]
            }
          }
          const result = translatedText.trim()
          if (result && result !== text) {
            return result
          }
        }

        throw new Error('Google translation failed - invalid response format')
      } catch (err) {
        lastError = err
        if (err.message.includes('429') && attempt < RETRY_DELAYS.length) {
          continue
        }
        throw err
      }
    }

    throw lastError || new Error('Google Translate max retries exceeded')
  }
}

// 註冊到全域，供 ModuleLoader 使用
if (typeof globalThis !== 'undefined') {
  globalThis.GoogleTranslatorModule = GoogleTranslatorModule
}
