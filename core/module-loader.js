/**
 * QuickTranslate ModuleLoader - 模塊載入器
 * 
 * 管理模塊的註冊、激活、停用、查詢。
 * 所有內置模塊在插件啟動時註冊並激活。
 */

class ModuleLoader {
  constructor(eventBus, storage) {
    /** @type {EventBus} */
    this.eventBus = eventBus
    /** @type {chrome.storage} */
    this.storage = storage
    /** @type {Map<string, {instance: object, manifest: object}>} */
    this._modules = new Map()
    /** @type {Array<Function>} 等待註冊的模塊類 */
    this._registry = []
  }

  /**
   * 註冊一個模塊類（在 loadAll 之前調用）
   * @param {Function} ModuleClass 模塊建構函數（需有靜態 manifest）
   */
  register(ModuleClass) {
    this._registry.push(ModuleClass)
  }

  /**
   * 載入並激活所有已註冊的模塊
   */
  async loadAll() {
    const results = []
    for (const ModuleClass of this._registry) {
      const result = await this._activateModule(ModuleClass)
      results.push(result)
    }
    return results
  }

  /**
   * 激活單個模塊
   */
  async _activateModule(ModuleClass) {
    const manifest = ModuleClass.manifest
    const validation = this._validateManifest(manifest)
    if (!validation.valid) {
      console.error(`ModuleLoader: ${manifest.id} validation failed - ${validation.errors.join(', ')}`)
      return { id: manifest.id, success: false, errors: validation.errors }
    }

    if (this._modules.has(manifest.id)) {
      return { id: manifest.id, success: false, error: 'already loaded' }
    }

    // 構建 core 引用
    const core = {
      eventBus: this.eventBus,
      storage: this.storage,
      settings: {}
    }

    try {
      const instance = new ModuleClass(core)
      this._modules.set(manifest.id, { instance, manifest })
      await instance.onActivate()
      this.eventBus.emit('module:activated', { moduleId: manifest.id })
      console.log(`ModuleLoader: activated ${manifest.id} v${manifest.version}`)
      return { id: manifest.id, success: true }
    } catch (e) {
      console.error(`ModuleLoader: activation failed for ${manifest.id}:`, e)
      this._modules.delete(manifest.id)
      return { id: manifest.id, success: false, error: e.message }
    }
  }

  /**
   * 停用模塊
   * @param {string} moduleId
   */
  async unregister(moduleId) {
    const entry = this._modules.get(moduleId)
    if (!entry) return
    try {
      await entry.instance.onDeactivate()
    } catch (e) {
      console.error(`ModuleLoader: deactivation error for ${moduleId}:`, e)
    }
    this._modules.delete(moduleId)
    this.eventBus.emit('module:deactivated', { moduleId })
  }

  /**
   * 按 ID 獲取模塊
   * @param {string} moduleId
   * @returns {{instance: object, manifest: object}|undefined}
   */
  getModule(moduleId) {
    return this._modules.get(moduleId)
  }

  /**
   * 按類型獲取模塊列表
   * @param {string} type
   * @returns {Array<{instance: object, manifest: object}>}
   */
  getModulesByType(type) {
    return Array.from(this._modules.values()).filter(m => m.manifest.type === type)
  }

  /**
   * 獲取所有活躍模塊的摘要
   * @returns {Array<{id: string, manifest: object}>}
   */
  get activeModules() {
    return Array.from(this._modules.entries()).map(([id, entry]) => ({
      id,
      manifest: entry.manifest
    }))
  }

  /**
   * 安裝第三方模塊（存儲到 chrome.storage.local）
   * @param {string} moduleId
   * @param {string} code - 模塊 JS 源碼
   * @param {object} manifest - 模塊清單
   */
  async installModule(moduleId, code, manifest) {
    const key = `installedModule:${moduleId}`
    await this.storage.set({ [key]: { code, manifest, installedAt: Date.now() } })
    console.log(`ModuleLoader: installed ${moduleId} v${manifest.version}`)
    this.eventBus.emit('module:installed', { moduleId, manifest })
  }

  /**
   * 卸載第三方模塊
   * @param {string} moduleId
   */
  async uninstallModule(moduleId) {
    // 如果是活躍模塊，先停用
    if (this._modules.has(moduleId)) {
      await this.unregister(moduleId)
    }
    const key = `installedModule:${moduleId}`
    await this.storage.remove(key)
    console.log(`ModuleLoader: uninstalled ${moduleId}`)
    this.eventBus.emit('module:uninstalled', { moduleId })
  }

  /**
   * 讀取所有已安裝的第三方模塊清單
   * @returns {Promise<Array<{id: string, manifest: object, installedAt: number}>>}
   */
  async getInstalledModules() {
    const all = await this.storage.get(null)
    const modules = []
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith('installedModule:') && value.manifest) {
        modules.push({
          id: value.manifest.id,
          manifest: value.manifest,
          installedAt: value.installedAt,
          active: this._modules.has(value.manifest.id)
        })
      }
    }
    return modules
  }

  /**
   * 獲取活躍模塊 + 已安裝模塊的合併列表
   * @returns {Promise<Array<{id: string, manifest: object, active: boolean}>>}
   */
  async getCombinedModuleList() {
    const active = Array.from(this._modules.entries()).map(([id, entry]) => ({
      id,
      manifest: entry.manifest,
      active: true
    }))

    const installed = await this.getInstalledModules()
    const installedIds = new Set(installed.map(m => m.id))

    // 只添加不在活躍列表中的已安裝模塊
    for (const mod of installed) {
      if (!this._modules.has(mod.id)) {
        active.push({ id: mod.id, manifest: mod.manifest, active: false })
      }
    }

    return active
  }

  _validateManifest(m) {
    const errors = []
    const required = ['id', 'name', 'version', 'author', 'type', 'description', 'minAppVersion']
    for (const field of required) {
      if (!m[field]) errors.push(`missing '${field}'`)
    }

    const validTypes = ['translator', 'mode', 'renderer', 'processor', 'service', 'theme']
    if (m.type && !validTypes.includes(m.type)) {
      errors.push(`invalid type '${m.type}'`)
    }

    return { valid: errors.length === 0, errors }
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.ModuleLoader = ModuleLoader
}
