/**
 * QuickTranslate 內置翻譯引擎 - GLM 大模型（智譜）
 */

class GLMTranslatorModule {
  static manifest = {
    id: 'engine-glm',
    name: 'GLM 大模型',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'translator',
    description: '智譜 GLM 大模型翻譯引擎',
    minAppVersion: '2.5.3',
    permissions: ['https://open.bigmodel.cn/*'],
    hooks: ['translate:text'],
    options: [
      { key: 'apiKey', type: 'password', label: 'GLM API Key', placeholder: '輸入智譜 GLM API Key' }
    ]
  }

  constructor(core) {
    this.core = core
    this._unsub = null
    this._langMap = {
      'zh': '中文', 'zh-cn': '简体中文', 'zh-CN': '简体中文',
      'zh-TW': '繁体中文', 'en': '英文', 'ja': '日文', 'ko': '韩文',
      'fr': '法文', 'de': '德文', 'es': '西班牙文', 'auto': '自动检测'
    }
  }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      if (req.target && req.target !== 'engine-glm') return
      try {
        const settings = await this.core.storage.get(['apiKeys'])
        const apiKey = settings.apiKeys?.glm
        if (!apiKey) throw new Error('GLM API Key 未設置')

        const result = await this.translate(req.text, req.from, req.to, apiKey)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: 'glm'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: 'glm'
        })
      }
    })
  }

  async onDeactivate() { this._unsub?.(); this._unsub = null }

  async translate(text, sourceLang, targetLang, apiKey) {
    const srcName = this._langMap[sourceLang] || sourceLang
    const tgtName = this._langMap[targetLang] || targetLang
    const prompt = `你是一个专业的翻译引擎。请将以下${srcName}文本翻译成${tgtName}，只返回翻译结果，不要添加任何解释、备注或格式：\n\n${text}`

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) {
      const errText = await response.text()
      let msg = `GLM API 错误: ${response.status}`
      try { const e = JSON.parse(errText); msg = e.error?.message || msg } catch {}
      throw new Error(msg)
    }

    const data = await response.json()
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim()
    }
    throw new Error('Invalid GLM API response format')
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.GLMTranslatorModule = GLMTranslatorModule
}
