// QuickTranslate 调试日志开关（所有上下文共用，须最先加载）
// 默认关闭 console.log，生产环境保持安静；console.warn / console.error 不受影响。
// 需要调试时，在任意扩展上下文执行：chrome.storage.local.set({ qtDebug: true })
// 再刷新页面 / 重开 popup 即生效（亦会实时响应开关变化）。
(function () {
  if (globalThis.__qtLogGuardInstalled) return;
  globalThis.__qtLogGuardInstalled = true;
  globalThis.__qtDebug = false;

  const originalLog = console.log.bind(console);
  console.log = function (...args) {
    if (globalThis.__qtDebug) originalLog(...args);
  };

  try {
    chrome.storage.local.get('qtDebug', (result) => {
      globalThis.__qtDebug = !!(result && result.qtDebug);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.qtDebug) {
        globalThis.__qtDebug = !!changes.qtDebug.newValue;
      }
    });
  } catch (e) {
    // 非扩展上下文（如本地测试）忽略
  }
})();
