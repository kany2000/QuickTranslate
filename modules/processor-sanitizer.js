/**
 * QuickTranslate 處理器模塊 - 文本淨化
 *
 * 功能：
 * - 摺疊多餘空格和空行
 * - 移除零寬字符（​、‌、‍、﻿）
 * - 解碼 HTML 實體（&amp; &lt; &gt; &quot; &#39;）
 * - 移除首尾空白
 */

class SanitizerProcessor {
  static manifest = {
    id: 'processor-sanitizer',
    name: '文本淨化',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'processor',
    description: '自動清理選中文字的多餘空格、換行、HTML 實體',
    minAppVersion: '3.0.0',
    permissions: [],
    hooks: ['preprocess:sanitize']
  }

  constructor(core) {
    this.core = core
    this._unsub = null
  }

  async onActivate() {
    this._unsub = this.core.eventBus.on('preprocess:sanitize', async (req) => {
      try {
        const cleaned = this.sanitize(req.text)
        this.core.eventBus.emit('preprocess:sanitized', {
          requestId: req.requestId,
          text: cleaned
        })
      } catch (err) {
        this.core.eventBus.emit('preprocess:sanitized', {
          requestId: req.requestId,
          text: req.text, // 出錯時返回原文
          error: err.message
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
   * 文本淨化核心邏輯
   */
  sanitize(text) {
    if (!text || typeof text !== 'string') return text

    return text
      // 正規化換行
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // 摺疊多餘空行（>=3 行 → 2 行）
      .replace(/\n{3,}/g, '\n\n')
      // 摺疊行內連續空格/Tab
      .replace(/[ \t]{2,}/g, ' ')
      // 移除非斷空格
      .replace(/ /g, ' ')
      // 移除零寬字符
      .replace(/[​-‍﻿]/g, '')
      // 解碼 HTML 實體
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      // 首尾空白
      .trim()
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.SanitizerProcessor = SanitizerProcessor
}
