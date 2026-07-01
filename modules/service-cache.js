/**
 * QuickTranslate 服務模塊 - 翻譯緩存
 *
 * 功能：
 * - KV 緩存：原文+源語言+目標語言 → 譯文
 * - 最大 200 條，超出自動淘汰最舊的
 * - 翻譯前先查緩存，命中直接返回
 * - 內存緩存 + storage 持久化
 */

class TranslationCacheService {
  static manifest = {
    id: 'service-translation-cache',
    name: '翻譯緩存',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'service',
    description: '快取翻譯結果，相同文字不重複請求 API',
    minAppVersion: '3.0.0',
    permissions: ['storage'],
    hooks: ['cache:get', 'cache:set', 'cache:clear']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
    this._cache = null // lazy load
    this.MAX_ENTRIES = 200
  }

  async onActivate() {
    await this._loadCache()

    this._unsubs.push(
      this.core.eventBus.on('cache:get', async (req) => {
        try {
          const key = this._makeKey(req.text, req.from, req.to)
          const entry = this._cache.get(key)
          if (entry) {
            this._cache.delete(key)
            this._cache.set(key, entry) // bump to end (most recent)
            this.core.eventBus.emit('cache:got', {
              requestId: req.requestId,
              hit: true,
              result: entry.result
            })
          } else {
            this.core.eventBus.emit('cache:got', {
              requestId: req.requestId,
              hit: false,
              result: null
            })
          }
        } catch (err) {
          this.core.eventBus.emit('cache:got', {
            requestId: req.requestId,
            hit: false,
            result: null,
            error: err.message
          })
        }
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('cache:set', async (req) => {
        try {
          const key = this._makeKey(req.text, req.from, req.to)
          this._cache.set(key, { result: req.result, ts: Date.now() })

          if (this._cache.size > this.MAX_ENTRIES) {
            // 淘汰最舊的（Map 按插入順序，刪掉最早的）
            const oldest = this._cache.keys().next().value
            if (oldest) this._cache.delete(oldest)
          }

          await this._persist()
          this.core.eventBus.emit('cache:setted', {
            requestId: req.requestId,
            success: true
          })
        } catch (err) {
          this.core.eventBus.emit('cache:setted', {
            requestId: req.requestId,
            success: false,
            error: err.message
          })
        }
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('cache:clear', async (req) => {
        this._cache.clear()
        await this._persist()
        this.core.eventBus.emit('cache:cleared', {
          requestId: req.requestId,
          success: true
        })
      })
    )
  }

  async onDeactivate() {
    await this._persist()
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
  }

  _makeKey(text, from, to) {
    return `${from}|${to}|${text.slice(0, 500)}`
  }

  async _loadCache() {
    try {
      const data = await this.core.storage.get('translationCache')
      const arr = data.translationCache || []
      this._cache = new Map(arr)
    } catch {
      this._cache = new Map()
    }
  }

  async _persist() {
    try {
      const arr = Array.from(this._cache.entries())
      await this.core.storage.set({ translationCache: arr })
    } catch { /* ignore storage quota errors */ }
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.TranslationCacheService = TranslationCacheService
}
