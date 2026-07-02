/**
 * QuickTranslate 內置模式模塊 - 內聯翻譯
 *
 * 選中網頁文字後自動翻譯並在選區附近顯示結果浮窗。
 * 可拖拽、可關閉、點擊外部自動收起。
 */

class InlineTranslateMode {
  static manifest = {
    id: 'mode-inline-translate',
    name: '內聯翻譯',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'mode',
    description: '選中文字自動翻譯，結果浮窗顯示在選區附近',
    minAppVersion: '3.1.0',
    permissions: [],
    hooks: ['inline:translate', 'settings:changed']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
  }

  async onActivate() {
    await this.core.storage.set({ inlineTranslateEnabled: true })
    console.log('InlineTranslateMode: activated')
  }

  async onDeactivate() {
    await this.core.storage.set({ inlineTranslateEnabled: false })
    console.log('InlineTranslateMode: deactivated')
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.InlineTranslateMode = InlineTranslateMode
}