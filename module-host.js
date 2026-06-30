/**
 * QuickTranslate Module Host - 沙箱橋接器
 *
 * 作為 offscreen document 運行，建立 sandbox iframe 並橋接
 * Service Worker 與沙箱之間的通訊。
 */

// 建立隱藏 sandbox iframe
var sandboxFrame = document.createElement('iframe')
sandboxFrame.src = 'sandbox.html'
sandboxFrame.style.display = 'none'
sandboxFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
document.body.appendChild(sandboxFrame)

var sandboxReady = false
var pendingRequests = {}
var requestCounter = 0

// 監聽 sandbox 回應
window.addEventListener('message', function(event) {
  if (event.source !== sandboxFrame.contentWindow) return
  var msg = event.data

  if (msg.type === 'ready') {
    sandboxReady = true
    // 通知 Service Worker 已就緒
    chrome.runtime.sendMessage({
      action: 'hostReady',
      hostId: 'module-host'
    }).catch(function() {})
    return
  }

  if (msg.type === 'evaluated') {
    var pending = pendingRequests[msg.requestId]
    if (pending) {
      delete pendingRequests[msg.requestId]
      pending.resolve(msg)
    }
  }
})

// 監聽 Service Worker 的評估請求
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 心跳 ping
  if (request.action === 'ping' && request.to === 'moduleHost') {
    sendResponse({ success: true, alive: true })
    return true
  }

  if (request.action === 'evaluateModule') {
    if (!sandboxReady) {
      sendResponse({ success: false, error: 'Sandbox not ready' })
      return true
    }

    var requestId = 'eval_' + (++requestCounter)
    var promise = new Promise(function(resolve) {
      pendingRequests[requestId] = { resolve: resolve }

      sandboxFrame.contentWindow.postMessage({
        type: 'evaluate',
        code: request.code,
        requestId: requestId
      }, '*')
    })

    promise.then(function(result) {
      sendResponse({
        success: !result.error,
        modules: result.modules || [],
        error: result.error
      })
    })

    return true // 保持 sendResponse 可用
  }

  return true
})

// 通知已啟動
console.log('ModuleHost: loaded')
