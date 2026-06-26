/**
 * QuickTranslate EventBus - 模塊間事件匯流排
 * 
 * 核心通訊機制，所有模塊之間、模塊與核心之間通過 EventBus 交換訊息。
 * 支持標準 pub/sub、一次性監聽、全域監聽（*）。
 */

class EventBus {
  constructor() {
    this._listeners = {}
  }

  /**
   * 監聽事件
   * @param {string} event 事件名稱
   * @param {Function} fn 回調函數
   * @returns {Function} 取消訂閱的函數
   */
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = new Set()
    const entry = { fn, once: false }
    this._listeners[event].add(entry)
    return () => { this._listeners[event]?.delete(entry) }
  }

  /**
   * 一次性監聽事件
   * @param {string} event 事件名稱
   * @param {Function} fn 回調函數（執行一次後自動取消）
   * @returns {Function} 取消訂閱的函數
   */
  once(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = new Set()
    const entry = { fn, once: true }
    this._listeners[event].add(entry)
    return () => { this._listeners[event]?.delete(entry) }
  }

  /**
   * 發射事件
   * @param {string} event 事件名稱
   * @param {any} data 載荷數據
   */
  emit(event, data) {
    // 先調用全域監聽器（*）
    this._emitTo('*', event, data)
    // 再調用特定事件的監聽器
    this._emitTo(event, data)
  }

  _emitTo(event, ...args) {
    const listeners = this._listeners[event]
    if (!listeners) return

    // 遍歷時可能刪除 once 條目，用拷貝避免迭代器失效
    const toRemove = []
    for (const entry of listeners) {
      entry.fn(...args)
      if (entry.once) toRemove.push(entry)
    }
    toRemove.forEach(e => listeners.delete(e))
  }

  /**
   * 清除所有監聽器
   */
  removeAllListeners() {
    this._listeners = {}
  }
}

// 全域導出（供 importScripts 使用）
if (typeof globalThis !== 'undefined') {
  globalThis.EventBus = EventBus
}
