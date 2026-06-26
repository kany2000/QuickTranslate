/**
 * QuickTranslate 內置翻譯引擎 - Custom LLM（OpenAI 兼容）
 */

class CustomLLMModule {
  static manifest = {
    id: 'engine-custom',
    name: '自定義 LLM',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'translator',
    description: 'OpenAI 兼容的自定義 LLM 翻譯引擎',
    minAppVersion: '2.5.3',
    permissions: ['<all_urls>'],
    hooks: ['translate:text']
  }

  constructor(core) {
    this.core = core
    this._unsub = null
    this._langMap = {
      'zh': '中文', 'zh-cn': '简体中文', 'zh-CN': '简体中文',
      'zh-TW': '繁体中文', 'en': '英文', 'ja': '日文', 'ko': '韩文',
      'fr': '法文', 'de': '德文', 'es': '西班牙文', 'auto': '源语言'
    }
  }

  async onActivate() {
    this._unsub = this.core.eventBus.on('translate:text', async (req) => {
      try {
        const s = await this.core.storage.get(['apiKeys', 'llmConfig'])
        const apiKey = s.apiKeys?.custom
        const llmConfig = s.llmConfig || {}
        if (!apiKey || !llmConfig.baseUrl || !llmConfig.model) {
          throw new Error('LLM 自定義配置不完整，請在設置中配置 API Key、Base URL 和模型名稱')
        }

        const result = await this.translate(req.text, req.from, req.to, apiKey, llmConfig)
        this.core.eventBus.emit('translate:result', {
          id: req.id, result, engine: 'custom-llm'
        })
      } catch (err) {
        this.core.eventBus.emit('translate:error', {
          id: req.id, error: err.message, engine: 'custom-llm'
        })
      }
    })
  }

  async onDeactivate() { this._unsub?.(); this._unsub = null }

  async translate(text, sourceLang, targetLang, apiKey, llmConfig) {
    const srcName = this._langMap[sourceLang] || sourceLang
    const tgtName = this._langMap[targetLang] || targetLang
    const prompt = `你是一个专业的翻译引擎。请将以下${srcName}文本翻译成${tgtName}，只返回翻译结果，不要添加任何解释、备注或格式：\n\n${text}`

    let baseUrl = llmConfig.baseUrl.trim()
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    const endpoint = `${baseUrl}/chat/completions`

    try {
      return await this._callLLM(endpoint, apiKey, llmConfig.model, prompt, false)
    } catch (e) {
      if (e.message.includes('SSE') || e.message.includes('stream')) {
        return await this._callLLM(endpoint, apiKey, llmConfig.model, prompt, true)
      }
      throw e
    }
  }

  async _callLLM(endpoint, apiKey, model, prompt, isStream) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        stream: isStream
      }),
      signal: AbortSignal.timeout(120000)
    })

    if (!response.ok) {
      const errText = await response.text()
      let msg = `LLM API error: ${response.status}`
      try { const e = JSON.parse(errText); msg = e.error?.message || e.error || msg } catch {}
      throw new Error(msg)
    }

    if (isStream) {
      return await this._parseStreamResponse(response)
    }

    const data = await response.json()
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim()
    }
    throw new Error('Invalid LLM API response format')
  }

  async _parseStreamResponse(response) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr || jsonStr === '[DONE]') continue
        try {
          const data = JSON.parse(jsonStr)
          if (data.choices?.[0]?.delta?.content) {
            result += data.choices[0].delta.content
          }
        } catch {}
      }
    }

    return result.trim()
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.CustomLLMModule = CustomLLMModule
}
