/**
 * QuickTranslate 服務模塊 - 生詞本
 */

class WordsService {
  static manifest = {
    id: 'service-words',
    name: '生詞本',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'service',
    required: true,
    description: '管理生詞本的存儲與查詢',
    minAppVersion: '2.5.4',
    permissions: ['storage'],
    hooks: ['words:get', 'words:add', 'words:remove', 'data:export', 'data:import']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
    this.MAX_ITEMS = 500
  }

  async onActivate() {
    this._unsubs.push(
      this.core.eventBus.on('words:get', async (req) => {
        const result = await this.core.storage.get('savedWords')
        const words = result.savedWords || []
        this.core.eventBus.emit('words:data', { requestId: req.requestId, data: words })
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('words:add', async (req) => {
        try {
          const result = await this.core.storage.get('savedWords')
          let words = result.savedWords || []
          const exists = words.some(w => w.original === req.item.original && w.translation === req.item.translation)
          if (exists) {
            this.core.eventBus.emit('words:added', { requestId: req.requestId, success: false, error: '已存在' })
            return
          }
          const newItem = {
            id: Date.now(),
            original: req.item.original,
            translation: req.item.translation,
            sourceLang: req.item.sourceLang || 'auto',
            targetLang: req.item.targetLang || 'zh-CN',
            timestamp: Date.now()
          }
          words.unshift(newItem)
          if (words.length > this.MAX_ITEMS) words = words.slice(0, this.MAX_ITEMS)
          await this.core.storage.set({ savedWords: words })
          this.core.eventBus.emit('words:added', { requestId: req.requestId, success: true })
        } catch (e) {
          this.core.eventBus.emit('words:added', { requestId: req.requestId, success: false, error: e.message })
        }
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('words:remove', async (req) => {
        try {
          const result = await this.core.storage.get('savedWords')
          let words = result.savedWords || []
          words = words.filter(w => w.id !== req.id)
          await this.core.storage.set({ savedWords: words })
          this.core.eventBus.emit('words:removed', { requestId: req.requestId, success: true })
        } catch (e) {
          this.core.eventBus.emit('words:removed', { requestId: req.requestId, success: false, error: e.message })
        }
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('data:export', async (req) => {
        const result = await this.core.storage.get(['translationHistory', 'savedWords'])
        const data = {
          translationHistory: result.translationHistory || [],
          savedWords: result.savedWords || [],
          exportTime: new Date().toISOString(),
          version: '2.5.4'
        }
        this.core.eventBus.emit('data:exported', { requestId: req.requestId, data })
      })
    )

    this._unsubs.push(
      this.core.eventBus.on('data:import', async (req) => {
        try {
          if (!req.data || !req.data.version) {
            this.core.eventBus.emit('data:imported', { requestId: req.requestId, success: false, error: 'Invalid data' })
            return
          }
          if (req.data.translationHistory) {
            await this.core.storage.set({ translationHistory: req.data.translationHistory })
          }
          if (req.data.savedWords) {
            await this.core.storage.set({ savedWords: req.data.savedWords })
          }
          this.core.eventBus.emit('data:imported', { requestId: req.requestId, success: true })
        } catch (e) {
          this.core.eventBus.emit('data:imported', { requestId: req.requestId, success: false, error: e.message })
        }
      })
    )
  }

  async onDeactivate() {
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.WordsService = WordsService
}
