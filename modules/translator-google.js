/**
 * QuickTranslate 內置翻譯引擎 - Google Translate
 * 
 * 示範模塊：展示如何按照 MODULE_SPEC.md 規範實現翻譯引擎。
 */

class GoogleTranslatorModule {
  static manifest = {
    id: 'engine-google',
    name: 'Google Translate',
    version: '1.1.0',
    author: 'QuickTranslate Team',
    type: 'translator',
    description: '免费翻译引擎（国内直连有道优先，Google 兜底）',
    minAppVersion: '2.5.4',
    permissions: ['https://aidemo.youdao.com/*', 'https://translate.googleapis.com/*', 'https://clients5.google.com/*'],
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
   * 翻譯入口：首選有道（國內直連 ~0.2s），失敗才回退 Google
   */
  async translate(text, sourceLang, targetLang) {
    try {
      const youdao = await this.translateViaYoudao(text, sourceLang, targetLang)
      if (youdao) return youdao
    } catch (e) {
      console.warn('[engine-google] Youdao failed, falling back to Google:', e.message)
    }
    return this.translateViaGoogle(text, sourceLang, targetLang)
  }

  /**
   * 有道翻譯（免 key web 端點，速度快）
   */
  async translateViaYoudao(text, sourceLang, targetLang) {
    const LANG = {
      'auto': 'auto',
      'zh': 'zh-CHS', 'zh-cn': 'zh-CHS', 'zh-CN': 'zh-CHS',
      'zh-TW': 'zh-CHT', 'zh-CHT': 'zh-CHT', 'zh-CHS': 'zh-CHS',
      'en': 'en', 'ja': 'ja', 'ko': 'ko',
      'fr': 'fr', 'de': 'de', 'es': 'es', 'ru': 'ru',
      'pt': 'pt', 'it': 'it', 'ar': 'ar', 'th': 'th', 'vi': 'vi'
    }
    const from = LANG[sourceLang] || 'auto'
    const to = (targetLang && targetLang.startsWith('zh')) ? 'zh-CHS' : (LANG[targetLang] || 'auto')
    const body = `q=${encodeURIComponent(text)}&from=${from}&to=${to}`
    const resp = await fetch('https://aidemo.youdao.com/trans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000)
    })
    if (!resp.ok) throw new Error(`Youdao HTTP ${resp.status}`)
    const data = await resp.json()
    const translation = data?.translation?.[0]
    if (data?.errorCode === '0' && translation && translation.trim() && translation !== text) {
      return translation.trim()
    }
    throw new Error(`Youdao failed: errorCode=${data?.errorCode}`)
  }

  /**
   * 調用 Google Translate API（含 429 自動重試 + 短超時）
   */
  async translateViaGoogle(text, sourceLang, targetLang) {
    const RETRY_DELAYS = [1500, 3000, 5000]
    const URLS = [
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&ie=UTF-8&oe=UTF-8&q=${encodeURIComponent(text)}`,
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&dt=t&ie=UTF-8&oe=UTF-8&q=${encodeURIComponent(text)}`
    ]
    let lastError

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      for (const url of URLS) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(4000)
          })

          if (response.status === 429 && attempt < RETRY_DELAYS.length) {
            const delay = RETRY_DELAYS[attempt]
            console.warn(`Google Translate 429 on ${url}, retry ${attempt + 1} in ${delay}ms...`)
            await new Promise(r => setTimeout(r, delay))
            continue
          }

          if (!response.ok) {
            lastError = new Error(`Google Translate HTTP error! status: ${response.status}`)
            continue
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

          lastError = new Error('Google translation failed - invalid response format')
        } catch (err) {
          lastError = err
          if (err.message.includes('429')) {
            await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 3000))
            continue
          }
        }
      }
    }

    throw lastError || new Error('Google Translate max retries exceeded')
  }
}

// 註冊到全域，供 ModuleLoader 使用
if (typeof globalThis !== 'undefined') {
  globalThis.GoogleTranslatorModule = GoogleTranslatorModule
}
