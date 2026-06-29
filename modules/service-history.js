/**
 * QuickTranslate 服務模塊 - 翻譯歷史記錄
 */

class HistoryService {
  static manifest = {
    id: 'service-history',
    name: '翻譯歷史記錄',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'service',
    required: true,
    description: '管理翻譯歷史記錄的存儲與查詢',
    minAppVersion: '2.5.4',
    permissions: ['storage'],
    hooks: ['history:get', 'history:add', 'history:clear']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
    this.MAX_ITEMS = 500
  }

  async onActivate() {
    this._unsubs.push(
      this.core.eventBus.on('history:get', async (req) => {
        const result = await this.core.storage.get('translationHistory')
        const history = result.translationHistory || []
        this.core.eventBus.emit('history:data', { requestId: req.requestId, data: history })
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('history:add', async (req) => {
        try {
          const result = await this.core.storage.get('translationHistory')
          let history = result.translationHistory || []
          const newItem = {
            id: Date.now(),
            original: req.item.original,
            translation: req.item.translation,
            sourceLang: req.item.sourceLang || 'auto',
            targetLang: req.item.targetLang || 'zh-CN',
            timestamp: Date.now()
          }
          history.unshift(newItem)
          if (history.length > this.MAX_ITEMS) {
            history = history.slice(0, this.MAX_ITEMS)
          }
          await this.core.storage.set({ translationHistory: history })
          this.core.eventBus.emit('history:added', { requestId: req.requestId, success: true, item: newItem })
        } catch (e) {
          this.core.eventBus.emit('history:added', { requestId: req.requestId, success: false, error: e.message })
        }
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('history:clear', async (req) => {
        await this.core.storage.set({ translationHistory: [] })
        this.core.eventBus.emit('history:cleared', { requestId: req.requestId, success: true })
      })
    )
  }

  async onDeactivate() {
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.HistoryService = HistoryService
}
