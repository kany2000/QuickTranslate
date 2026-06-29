/**
 * QuickTranslate 內置模式模塊 - 浮動翻譯面板
 *
 * Ctrl+Shift+Q 打開浮動翻譯面板，支持翻譯、歷史、生詞本三頁籤。
 */

class FloatPanelMode {
  static manifest = {
    id: 'mode-float-panel',
    name: '浮動翻譯面板',
    version: '1.0.0',
    author: 'QuickTranslate Team',
    type: 'mode',
    description: 'Ctrl+Shift+Q 打開浮動翻譯面板（三頁籤）',
    minAppVersion: '2.5.4',
    permissions: [],
    hooks: ['shortcut:trigger']
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
  }

  async onActivate() {
    console.log('FloatPanelMode: activated')
  }

  async onDeactivate() {
    console.log('FloatPanelMode: deactivated')
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.FloatPanelMode = FloatPanelMode
}
