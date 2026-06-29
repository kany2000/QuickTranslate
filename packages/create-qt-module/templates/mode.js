/**
 * {{NAME}} - QuickTranslate 交互模式模塊
 * 生成於 {{DATE}}
 */

class {{CLASSNAME}} {
  static manifest = {
    id: 'mode-{{ID}}',
    name: '{{NAME}}',
    version: '1.0.0',
    author: '{{AUTHOR}}',
    type: 'mode',
    description: '{{DESCRIPTION}}',
    minAppVersion: '2.5.3',
    permissions: [],
    hooks: [],
    options: []
  }

  constructor(core) {
    this.core = core
    this._unsubs = []
  }

  async onActivate() {
    console.log('{{CLASSNAME}}: activated')
    // TODO: 訂閱事件、註冊快捷鍵、初始化 UI
  }

  async onDeactivate() {
    this._unsubs.forEach(fn => fn())
    this._unsubs = []
    console.log('{{CLASSNAME}}: deactivated')
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.{{CLASSNAME}} = {{CLASSNAME}}
}
