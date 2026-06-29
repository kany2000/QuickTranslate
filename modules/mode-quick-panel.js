/**
 * QuickTranslate 內置模式模塊 - 划詞翻譯
 *
 * 選中網頁文字後自動顯示翻譯按鈕，點擊按鈕展示翻譯結果面板。
 * 啟用/停用此模塊等同於切換划詞翻譯開關。
 */

class QuickPanelMode {
  static manifest = {
    id: 'mode-quick-panel',
    name: '划詞翻譯',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'mode',
    description: '選中網頁文字後自動顯示翻譯按鈕',
    minAppVersion: '2.5.4',
    permissions: [],
    hooks: ['text:selected', 'settings:changed']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
  }

  async onActivate() {
    // 模塊激活時確保快捷面板設置為啟用
    await this._setPanelEnabled(true)
    console.log('QuickPanelMode: activated')
  }

  async onDeactivate() {
    // 模塊停用時關閉快捷面板
    await this._setPanelEnabled(false)
    console.log('QuickPanelMode: deactivated')
  }

  async onSettingsChanged(settings) {
    // 當用戶通過 UI 切換快捷面板開關時，同步模塊狀態
  }

  async _setPanelEnabled(enabled) {
    // 讀取當前設置
    const result = await this.core.storage.get(['quickPanelEnabled', 'hoverTranslationEnabled'])
    const settings = {
      quickPanelEnabled: enabled,
      hoverTranslationEnabled: result.hoverTranslationEnabled !== false
    }
    await this.core.storage.set(settings)
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.QuickPanelMode = QuickPanelMode
}
