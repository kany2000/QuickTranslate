/**
 * QuickTranslate 處理器模塊 - 代碼保護
 *
 * 功能：
 * - 檢測選中文本中的反引號代碼塊和行內代碼
 * - 用佔位符替換，確保翻譯引擎不會破壞代碼
 * - 翻譯完成後恢復原文
 */

class CodeProtectorProcessor {
  static manifest = {
    id: 'processor-code-protector',
    name: '代碼保護',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'processor',
    description: '保護選中文本中的程式碼不被翻譯引擎破壞',
    minAppVersion: '3.0.0',
    permissions: [],
    hooks: ['preprocess:protect', 'postprocess:restore']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
  }

  async onActivate() {
    this._unsubs.push(
      this.core.eventBus.on('preprocess:protect', async (req) => {
        try {
          const { text, placeholders } = this.protect(req.text)
          this.core.eventBus.emit('preprocess:protected', {
            requestId: req.requestId,
            text,
            placeholders
          })
        } catch (err) {
          this.core.eventBus.emit('preprocess:protected', {
            requestId: req.requestId,
            text: req.text,
            placeholders: {},
            error: err.message
          })
        }
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('postprocess:restore', async (req) => {
        try {
          const restored = this.restore(req.text, req.placeholders)
          this.core.eventBus.emit('postprocess:restored', {
            requestId: req.requestId,
            text: restored
          })
        } catch (err) {
          this.core.eventBus.emit('postprocess:restored', {
            requestId: req.requestId,
            text: req.text,
            error: err.message
          })
        }
      })
    )
  }

  async onDeactivate() {
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
  }

  /**
   * 提取代碼，用佔位符替換
   * @param {string} text
   * @returns {{ text: string, placeholders: object }}
   */
  protect(text) {
    if (!text || typeof text !== 'string') {
      return { text, placeholders: {} }
    }

    const placeholders = {}
    let processed = text
    let index = 0

    // 1. 保護多行反引號代碼塊 ```code```
    processed = processed.replace(/```[\s\S]*?```/g, (match) => {
      const key = `\x00QT_CODE_${index++}\x00`
      placeholders[key] = match
      return key
    })

    // 2. 保護行內反引號代碼 `code`
    processed = processed.replace(/`[^`]+`/g, (match) => {
      const key = `\x00QT_CODE_${index++}\x00`
      placeholders[key] = match
      return key
    })

    return { text: processed, placeholders }
  }

  /**
   * 翻譯完成後恢復代碼
   * @param {string} text
   * @param {object} placeholders
   * @returns {string}
   */
  restore(text, placeholders) {
    if (!text || !placeholders || Object.keys(placeholders).length === 0) {
      return text
    }

    let restored = text
    for (const [key, original] of Object.entries(placeholders)) {
      restored = restored.split(key).join(original)
    }
    return restored
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.CodeProtectorProcessor = CodeProtectorProcessor
}
