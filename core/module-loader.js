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
    /** @type {Map<string, Function>} 模塊 ID → 原始 Class */
    this._moduleClasses = new Map()
  }

  /**
   * 註冊一個模塊類（在 loadAll 之前調用）
   * @param {Function} ModuleClass 模塊建構函數（需有靜態 manifest）
   */
  register(ModuleClass) {
    this._registry.push(ModuleClass)
    this._moduleClasses.set(ModuleClass.manifest.id, ModuleClass)
  }

  /**
   * 載入並激活所有已註冊的模塊（跳過已關閉的）
   */
  async loadAll() {
    const toggleData = await this.storage.get('moduleToggles') || {}
    const toggles = toggleData.moduleToggles || {}
    const results = []
    for (const ModuleClass of this._registry) {
      const id = ModuleClass.manifest.id
      // 核心模塊必須加載，不讀取開關狀態
      if (ModuleClass.manifest.required) {
        const result = await this._activateModule(ModuleClass)
        results.push(result)
        continue
      }
      // 如果用戶手動關閉了此模塊，跳過
      if (toggles[id] === false) {
        console.log(`ModuleLoader: skipping ${id} (disabled by user)`)
        results.push({ id, success: false, error: 'disabled by user' })
        continue
      }
      const result = await this._activateModule(ModuleClass)
      results.push(result)
    }
    return results
  }

  /**
   * 激活/停用模塊（用戶開關）
   */
  async toggleModule(moduleId, enable) {
    // 核心模塊禁止開關
    const modClass = this._moduleClasses.get(moduleId)
    if (modClass && modClass.manifest.required) {
      return { id: moduleId, success: false, error: 'required module cannot be toggled' }
    }

    // 保存開關狀態
    const toggleData = await this.storage.get('moduleToggles') || {}
    const toggles = toggleData.moduleToggles || {}
    toggles[moduleId] = enable
    await this.storage.set({ moduleToggles: toggles })

    // 同步模式模塊到對應的設置項
    const settingMap = {
      'mode-quick-panel': 'quickPanelEnabled',
      'mode-float-panel': 'floatPanelEnabled'
    }
    const settingKey = settingMap[moduleId]
    if (settingKey) {
      await this.storage.set({ [settingKey]: enable })
    }

    if (enable) {
      // 激活
      const ModuleClass = this._moduleClasses.get(moduleId)
      if (ModuleClass) {
        const result = await this._activateModule(ModuleClass)
        return result
      }
      // 嘗試從 storage 激活（第三方模塊）
      return await this.activateFromStorage(moduleId)
    } else {
      // 停用
      await this.unregister(moduleId)
      // 清理可能殘留的已安裝模塊（第三方）
      const key = `installedModule:${moduleId}`
      await this.storage.remove(key)
      return { id: moduleId, success: true }
    }
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
   * 通過沙箱評估並激活第三方模塊
   * @param {string} moduleId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async activateFromStorage(moduleId) {
    const key = `installedModule:${moduleId}`
    const result = await this.storage.get(key)
    const entry = result[key]
    if (!entry || !entry.code) {
      return { success: false, error: 'Module not found in storage' }
    }

    // 透過 offscreen document 中的 sandbox 評估代碼
    try {
      const evalResult = await this._evaluateInSandbox(entry.code)
      if (!evalResult.success) {
        return { success: false, error: evalResult.error }
      }

      const manifest = entry.manifest
      // 構建 core 引用
      const core = {
        eventBus: this.eventBus,
        storage: this.storage,
        settings: {}
      }

      // 注意：第三方模塊的實例在 sandbox 中運行
      // 這裡只做元數據註冊，讓它顯示為活躍
      this._modules.set(manifest.id, {
        instance: { manifest, _sandbox: true },
        manifest
      })
      this.eventBus.emit('module:activated', { moduleId: manifest.id })
      console.log(`ModuleLoader: activated ${manifest.id} v${manifest.version} (sandboxed)`)
      return { success: true }
    } catch (e) {
      console.error(`ModuleLoader: sandbox activation failed for ${moduleId}:`, e)
      return { success: false, error: e.message }
    }
  }

  /**
   * 發送代碼到 offscreen document 的 sandbox 進行評估
   */
  async _evaluateInSandbox(code) {
    // 向 offscreen document 發送評估請求
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'evaluateModule',
        code: code
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message })
          return
        }
        resolve(response)
      })
    })
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
    const result = []
    const inActive = new Set()

    // 1. 活躍模塊（跳過 required 核心模塊）
    for (const [id, entry] of this._modules) {
      if (entry.manifest.required) continue
      result.push({ id, manifest: entry.manifest, active: true, builtin: this._moduleClasses.has(id) })
      inActive.add(id)
    }

    // 2. 已註冊但未激活的內置模塊（被用戶關閉的，跳過 required）
    for (const [id, ModuleClass] of this._moduleClasses) {
      if (ModuleClass.manifest.required) continue
      if (!inActive.has(id)) {
        result.push({ id, manifest: ModuleClass.manifest, active: false, builtin: true })
        inActive.add(id)
      }
    }

    // 3. 已安裝但未激活的第三方模塊
    const installed = await this.getInstalledModules()
    for (const mod of installed) {
      if (!inActive.has(mod.id)) {
        result.push({ id: mod.id, manifest: mod.manifest, active: false, builtin: false })
      }
    }

    return result
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
