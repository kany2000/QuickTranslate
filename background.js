// ===== 模塊系統核心 =====
importScripts(
  'core/event-bus.js',
  'core/module-loader.js',
  'modules/translator-google.js',
  'modules/translator-microsoft.js',
  'modules/translator-glm.js',
  'modules/translator-custom.js',
  'modules/mode-quick-panel.js',
  'modules/mode-float-panel.js',
  'modules/service-history.js',
  'modules/service-words.js',
  'modules/processor-sanitizer.js',
  'modules/processor-code-protector.js',
  'modules/service-cache.js',
  'modules/mode-inline-translate.js'
)

// ===== 模塊系統初始化 =====
const eventBus = new EventBus()
const moduleLoader = new ModuleLoader(eventBus, chrome.storage.local)
moduleLoader.register(GoogleTranslatorModule)
moduleLoader.register(MicrosoftTranslatorModule)
moduleLoader.register(GLMTranslatorModule)
moduleLoader.register(CustomLLMModule)
moduleLoader.register(QuickPanelMode)
moduleLoader.register(FloatPanelMode)
moduleLoader.register(HistoryService)
moduleLoader.register(WordsService)
moduleLoader.register(SanitizerProcessor)
moduleLoader.register(CodeProtectorProcessor)
moduleLoader.register(TranslationCacheService)
moduleLoader.register(InlineTranslateMode)

// 截圖翻譯器後台服務
console.log('Background script loading...');

// 立即启动服务（在 class 定义之后）
class ScreenshotTranslator {
  constructor() {
    console.log('ScreenshotTranslator constructor called');
    this.isProcessing = false;
    this.MAX_HISTORY = 500; // 历史记录和生词本最大条数
    this.setupMessageListeners();
    this.setupInstallListener();
    this.setupContextMenuHandler();
    // 检查是否是首次启动（开发者模式下 onInstalled 不会触发）
    this.checkFirstRun();
    console.log('ScreenshotTranslator initialized');
  }

  // 获取通知文本（根据浏览器语言）
  getNotificationText() {
    const lang = navigator.language || 'en';
    const langMap = {
      'zh': { title: 'QuickTranslate 安装完成', msg: 'QuickTranslate已安装！请点击插件图标开始使用。温馨提示：请把插件固定在快捷工具栏方便使用。' },
      'zh-CN': { title: 'QuickTranslate 安装完成', msg: 'QuickTranslate已安装！请点击插件图标开始使用。温馨提示：请把插件固定在快捷工具栏方便使用。' },
      'zh-TW': { title: 'QuickTranslate 安裝完成', msg: 'QuickTranslate已安裝！請點擊插件圖標開始使用。溫馨提示：請把插件固定在快捷工具欄方便使用。' },
      'zh-HK': { title: 'QuickTranslate 安裝完成', msg: 'QuickTranslate已安裝！請點擊插件圖標開始使用。溫馨提示：請把插件固定在快捷工具欄方便使用。' },
      'ja': { title: 'QuickTranslate インストール完了', msg: 'QuickTranslateがインストールされました！アイコンをクリックして開始してください。ヒント：ツールバーに固定すると便利です。' },
      'ko': { title: 'QuickTranslate 설치 완료', msg: 'QuickTranslate이 설치되었습니다! 아이콘을 클릭하여 시작하세요. 팁：도구 모음에 고정하면 편리합니다.' },
      'en':
      { title: 'QuickTranslate Installed', msg: 'QuickTranslate installed! Click the icon to start. Tip: Pin to toolbar for easy access.' }
    };

    // 尝试精确匹配
    if (langMap[lang]) return langMap[lang];

    // 尝试语言前缀匹配
    const prefix = lang.split('-')[0];
    for (const key in langMap) {
      if (key.startsWith(prefix)) return langMap[key];
    }

    // 默认英文
    return langMap['en'];
  }

  // 检查是否是首次运行
  checkFirstRun() {
    chrome.storage.local.get(['hasRunBefore'], (result) => {
      console.log('Storage check - hasRunBefore:', result.hasRunBefore);
      if (!result.hasRunBefore) {
        console.log('First run! Setting up...');
        // 首次运行，设置标记
        chrome.storage.local.set({
          shouldShowWelcome: true,
          hasRunBefore: true
        }, () => {
          console.log('Storage set, now showing notification...');
          // 设置默认 UI 语言
          this.setDefaultUILanguage();

          // 获取对应语言的通知文本
          const notifText = this.getNotificationText();

          // 显示安装通知
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon16.png',
            title: notifText.title,
            message: notifText.msg,
            requireInteraction: false,
            silent: false
          }, (notificationId) => {
            console.log('Notification created, ID:', notificationId);
            if (chrome.runtime.lastError) {
              console.error('Notification error:', chrome.runtime.lastError);
            }
          });

          // 5秒后关闭通知
          setTimeout(() => {
            chrome.notifications.getAll((notifications) => {
              console.log('Current notifications:', notifications);
              Object.keys(notifications).forEach(id => {
                chrome.notifications.clear(id);
              });
            });
          }, 5000);
        });
      } else {
        console.log('Not first run, skipping notification');
      }
    });
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Extension installed or updated:', details);

      // 建立右键菜单
      this.createContextMenu()

      if (details.reason === 'install') {
        // 使用 storage 存储安装标记，popup 打开时会检查
        chrome.storage.local.set({ shouldShowWelcome: true });

        // 根据浏览器语言设置默认的 UI 语言
        this.setDefaultUILanguage();

        // 获取对应语言的通知文本
        const notifText = this.getNotificationText();

        // 安装完成后立即显示欢迎通知，持续5秒
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon16.png',
          title: notifText.title,
          message: notifText.msg,
          requireInteraction: false,
          silent: false
        });

        // 5秒后自动关闭通知
        setTimeout(() => {
          chrome.notifications.getAll((notifications) => {
            Object.keys(notifications).forEach(id => {
              chrome.notifications.clear(id);
            });
          });
        }, 5000);
      } else if (details.reason === 'update') {
        // 更新时重建右键菜单
        chrome.contextMenus.removeAll(() => this.createContextMenu())
      }
    });
  }

  // ===== 右键菜单 =====
  createContextMenu() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'qt-translate-selection',
        title: 'QuickTranslate 翻譯「%s」',
        contexts: ['selection']
      })
      chrome.contextMenus.create({
        id: 'qt-translate-selection-multi',
        title: 'QuickTranslate 多引擎翻譯「%s」',
        contexts: ['selection']
      })
      console.log('Context menu created')
    })
  }

  setupContextMenuHandler() {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (!info.selectionText || !tab?.id) return

      const text = info.selectionText.trim()
      if (!text) return

      if (info.menuItemId === 'qt-translate-selection') {
        this._handleContextTranslate(text, tab.id, false)
      } else if (info.menuItemId === 'qt-translate-selection-multi') {
        this._handleContextTranslate(text, tab.id, true)
      }
    })
  }

  async _handleContextTranslate(text, tabId, multiEngine) {
    try {
      const settings = await this.getUserSettings()
      const targetLang = settings.targetLanguage || 'zh-TW'

      // 先发 loading 状态
      chrome.tabs.sendMessage(tabId, {
        action: 'showContextTranslation',
        status: 'loading',
        text
      }).catch(() => {})

      // 单引擎翻译
      const result = await new Promise((resolve, reject) => {
        this.translateText(text, 'auto', targetLang, (response) => {
          if (response?.success) resolve(response.translatedText)
          else reject(new Error(response?.error || '翻译失败'))
        })
      })

      chrome.tabs.sendMessage(tabId, {
        action: 'showContextTranslation',
        status: 'done',
        text,
        result,
        targetLang
      }).catch(() => {})

    } catch (error) {
      console.error('Context menu translate error:', error)
      chrome.tabs.sendMessage(tabId, {
        action: 'showContextTranslation',
        status: 'error',
        text,
        error: error.message
      }).catch(() => {})
    }
  }

  // 根据浏览器语言设置默认 UI 语言
  async setDefaultUILanguage() {
    // 支持的语言
    const supportedLangs = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'];
    const langMap = {
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'zh-HK': 'zh-TW',
      'zh-SG': 'zh-CN',
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'en-AU': 'en',
      'en-CA': 'en',
      'ja': 'ja',
      'ja-JP': 'ja',
      'ko': 'ko',
      'ko-KR': 'ko'
    };

    // 获取浏览器语言
    const browserLang = chrome.runtime.getManifest().default_locale || 'en';
    console.log('Background: Browser default locale:', browserLang);

    // 尝试匹配
    let uiLang = langMap[browserLang];
    if (!uiLang) {
      const langPrefix = browserLang.split('-')[0].toLowerCase();
      uiLang = langMap[langPrefix];
    }

    // 如果不匹配支持的语言，默认英文
    if (!uiLang || !supportedLangs.includes(uiLang)) {
      uiLang = 'en';
    }

    console.log('Background: Setting default UI language to:', uiLang);

    // 保存到 storage
    await chrome.storage.local.set({ uiLanguage: uiLang });
  }

  // ==================== 历史记录和生词本 ====================

  _routeViaEventBus(requestName, responseName, payload, sendResponse, timeout = 5000) {
    const requestId = 'eb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const timer = setTimeout(() => {
      if (typeof sendResponse === 'function') {
        unsub()
        sendResponse({ success: false, error: 'timeout' })
      }
    }, timeout)
    const unsub = eventBus.on(responseName, (data) => {
      if (data.requestId === requestId) {
        clearTimeout(timer)
        unsub()
        if (typeof sendResponse === 'function') {
          sendResponse({ success: true, ...data })
        }
      }
    })
    eventBus.emit(requestName, { ...payload, requestId })
  }

  async getTranslationHistory(sendResponse) { this._routeViaEventBus('history:get', 'history:data', {}, sendResponse) }
  async addToHistory(item, sendResponse) { this._routeViaEventBus('history:add', 'history:added', { item }, sendResponse) }
  async clearHistory(sendResponse) { this._routeViaEventBus('history:clear', 'history:cleared', {}, sendResponse) }
  async getSavedWords(sendResponse) { this._routeViaEventBus('words:get', 'words:data', {}, sendResponse) }
  async addToSavedWords(item, sendResponse) { this._routeViaEventBus('words:add', 'words:added', { item }, sendResponse) }
  async removeFromSavedWords(id, sendResponse) { this._routeViaEventBus('words:remove', 'words:removed', { id }, sendResponse) }
  async exportData(sendResponse) { this._routeViaEventBus('data:export', 'data:exported', {}, sendResponse) }
  async importData(data, sendResponse) { this._routeViaEventBus('data:import', 'data:imported', { data }, sendResponse) }

  async toggleModule(moduleId, enable, sendResponse) {
    try {
      const result = await moduleLoader.toggleModule(moduleId, enable)
      sendResponse({ success: true, active: result.success })
    } catch (error) {
      sendResponse({ success: false, error: error.message })
    }
  }

  async installModule(moduleId, code, manifest, sendResponse) {
    try {
      await moduleLoader.installModule(moduleId, code, manifest)
      // 嘗試通過沙箱即時激活
      const activationResult = await moduleLoader.activateFromStorage(moduleId)
      sendResponse({ success: true, activated: activationResult.success })
    } catch (error) {
      sendResponse({ success: false, error: error.message })
    }
  }

  async uninstallModule(moduleId, sendResponse) {
    try {
      await moduleLoader.uninstallModule(moduleId)
      sendResponse({ success: true })
    } catch (error) {
      sendResponse({ success: false, error: error.message })
    }
  }

  async getModulesList(sendResponse) {
    try {
      const modules = await moduleLoader.getCombinedModuleList()
      const statsResult = await chrome.storage.local.get('moduleStats')
      sendResponse({ success: true, modules, stats: statsResult.moduleStats || {} })
    } catch (error) {
      sendResponse({ success: false, error: error.message })
    }
  }

  async getModuleStats(sendResponse) {
    try {
      const result = await chrome.storage.local.get('moduleStats')
      sendResponse({ success: true, stats: result.moduleStats || {} })
    } catch (error) {
      sendResponse({ success: false, error: error.message })
    }
  }

  setupMessageListeners() {
    console.log('Setting up message listeners...');
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Message received:', request.action);
      this.handleMessage(request, sender, sendResponse);
      return true;
    });

    // 設置快捷鍵監聽
    chrome.commands.onCommand.addListener((command) => {
      console.log('Command received:', command);
      if (command === 'smart-translate') {
        this.handleSmartTranslate();
      } else if (command === 'open-float-panel') {
        this.handleOpenFloatPanel();
      } else {
        console.log('Unknown command:', command);
      }
    });

    console.log('Message listeners and commands set up successfully');
  }

  async handleSmartTranslate() {
    try {
      console.log('Smart translate triggered');
      // 获取当前活动标签
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      const tab = tabs[0];
      console.log('Active tab for smart translate:', tab.url);

      // 检查是否是受限制的页面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        console.error('Cannot use shortcut on restricted pages');
        // 显示通知提醒用户
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon16.png',
          title: '截图翻译器',
          message: '无法在此页面使用快捷键，请切换到普通网页'
        });
        return;
      }

      // 获取用户设置的目标语言
      const userSettings = await this.getUserSettings();
      console.log('Using user target language:', userSettings.targetLanguage);

      // 注入 content script（如果尚未注入）
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('Content script injected via shortcut');
      } catch (injectError) {
        console.log('Content script may already be injected:', injectError.message);
      }

      // 发送智能翻译初始化消息
      try {
        const message = {
          action: 'initCapture',
          smartMode: true,
          userSettings: userSettings
        };
        await chrome.tabs.sendMessage(tab.id, message);
        console.log('Smart translate initiated successfully');
      } catch (msgError) {
        console.error('Failed to send smart translate message:', msgError);
        // 如果失败，稍等片刻重试一次
        setTimeout(async () => {
          try {
            const retryMessage = {
              action: 'initCapture',
              smartMode: true,
              userSettings: userSettings
            };
            await chrome.tabs.sendMessage(tab.id, retryMessage);
            console.log('Smart translate retry successful');
          } catch (retryError) {
            console.error('Smart translate retry failed:', retryError);
          }
        }, 200);
      }

    } catch (error) {
      console.error('Smart translate failed:', error);
    }
  }

  async handleOpenFloatPanel() {
    try {
      console.log('Opening float panel...');
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        console.error('No active tab found');
        return;
      }

      const tab = tabs[0];

      // 检查是否是受限页面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        console.error('Cannot use on restricted pages');
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon16.png',
          title: 'QuickTranslate',
          message: '无法在此页面使用快捷键，请切换到普通网页'
        });
        return;
      }

      // 先尝试注入 float-panel.js（如果尚未注入）
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['float-panel.js']
        });
        console.log('Float panel script injected');
      } catch (injectError) {
        console.log('Float panel script may already be injected:', injectError.message);
      }

      // 发送消息给 content script
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'openFloatPanel' });
        console.log('Float panel open message sent');
      } catch (msgError) {
        console.error('Failed to open float panel:', msgError);
        // 稍等片刻再重试一次
        setTimeout(async () => {
          try {
            chrome.tabs.sendMessage(tab.id, { action: 'openFloatPanel' });
            console.log('Float panel retry successful');
          } catch (retryError) {
            console.error('Float panel retry failed:', retryError);
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon16.png',
              title: 'QuickTranslate',
              message: '快捷面板打开失败，请刷新页面后重试'
            });
          }
        }, 300);
      }
    } catch (error) {
      console.error('Failed to open float panel:', error);
    }
  }

  async getUserSettings() {
    try {
      const result = await chrome.storage.local.get([
        'targetLanguage',
        'ocrLanguage',
        'apiProvider',
        'autoCopy',
        'apiKeys',
        'llmConfig'
      ]);

      return {
        targetLanguage: result.targetLanguage || 'zh-TW',
        ocrLanguage: result.ocrLanguage || 'auto',
        apiProvider: result.apiProvider || 'google',
        autoCopy: result.autoCopy || false,
        apiKeys: result.apiKeys || {},
        llmConfig: result.llmConfig || { baseUrl: '', model: '' }
      };
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return {
        targetLanguage: 'zh-TW',
        ocrLanguage: 'auto',
        apiProvider: 'google',
        autoCopy: false,
        apiKeys: {},
        llmConfig: { baseUrl: '', model: '' }
      };
    }
  }

  async handleMessage(request, sender, sendResponse) {
    console.log('Handling message:', request.action);

    try {
      switch (request.action) {
        case 'ping':
          console.log('Ping received');
          sendResponse({ success: true, message: 'pong', timestamp: Date.now() });
          break;
        case 'startCapture':
          console.log('Starting capture...');
          this.startCapture(sendResponse);
          break;
        case 'captureVisibleTab':
          console.log('Capturing visible tab...');
          this.captureVisibleTab(request.rect, sendResponse);
          break;
        case 'getSettings':
          console.log('Getting settings...');
          this.getSettings(sendResponse);
          break;
        case 'saveSettings':
          console.log('Saving settings...');
          this.saveSettings(request.settings, sendResponse);
          break;
        case 'translateText':
          console.log('Translating text...');
          this.translateText(request.text, request.sourceLang, request.targetLang, sendResponse);
          break;
        case 'translate':
          console.log('Quick panel translate request...');
          this.handleQuickPanelTranslate(request, sendResponse);
          break;
        case 'translateMultiEngine':
          console.log('Multi-engine translate request...');
          this.translateMultiEngine(request.text, request.sourceLang, request.targetLang, request.includeLLM, sendResponse);
          break;
        case 'getModels':
          console.log('Getting available models...');
          this.getAvailableModels(request.apiKey, request.baseUrl, sendResponse);
          break;
        case 'getTranslationHistory':
          this.getTranslationHistory(sendResponse);
          break;
        case 'addToHistory':
          this.addToHistory(request.item, sendResponse);
          break;
        case 'clearHistory':
          this.clearHistory(sendResponse);
          break;
        case 'getSavedWords':
          this.getSavedWords(sendResponse);
          break;
        case 'addToSavedWords':
          this.addToSavedWords(request.item, sendResponse);
          break;
        case 'removeFromSavedWords':
          this.removeFromSavedWords(request.id, sendResponse);
          break;
        case 'exportData':
          this.exportData(sendResponse);
          break;
        case 'importData':
          this.importData(request.data, sendResponse);
          break;
        case 'toggleModule':
          this.toggleModule(request.moduleId, request.enable, sendResponse);
          break;
        case 'installModule':
          this.installModule(request.moduleId, request.code, request.manifest, sendResponse);
          break;
        case 'uninstallModule':
          this.uninstallModule(request.moduleId, sendResponse);
          break;
        case 'evaluateModule':
          // 此請求由 offscreen document 處理，這裡只做轉發
          sendResponse({ success: false, error: 'not handled by background' });
          break;
        case 'hostReady':
          console.log('Background: Module host ready:', request.hostId);
          sendResponse({ success: true });
          break;
        case 'getModules':
          this.getModulesList(sendResponse);
          break;
        case 'getModuleStats':
          this.getModuleStats(sendResponse);
          break;
        case 'emitEvent':
          eventBus.emit(request.event, request.data);
          sendResponse({ success: true });
          break;
        default:
          console.warn('Unknown action:', request.action);
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async startCapture(sendResponse) {
    try {
      console.log('Starting capture process...');

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      const tab = tabs[0];
      console.log('Active tab:', tab.url);

      // 檢查是否是受限制的頁面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        throw new Error('無法在此頁面使用截圖功能');
      }

      // 注入 content script（如果尚未注入）
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('Content script injected');
      } catch (injectError) {
        console.log('Content script may already be injected:', injectError.message);
      }

      // 等待一下再發送消息
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'initCapture' });
          console.log('Init capture message sent');
        } catch (msgError) {
          console.error('Failed to send init message:', msgError);
          sendResponse({ error: '無法初始化截圖功能: ' + msgError.message });
        }
      }, 100);

      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to start capture:', error);
      sendResponse({ error: error.message });
    }
  }

  async getSettings(sendResponse) {
    try {
      const result = await chrome.storage.local.get([
        'targetLanguage',
        'ocrLanguage',
        'apiProvider',
        'autoCopy',
        'quickPanelEnabled',
        'hoverTranslationEnabled',
        'inlineTranslateEnabled',
        'multiEngineEnabled',
        'minSelectionLength',
        'apiKeys',
        'llmConfig',
        'uiLanguage'
      ]);

      const settings = {
        targetLanguage: result.targetLanguage || 'zh-TW',
        ocrLanguage: result.ocrLanguage || 'eng',
        apiProvider: result.apiProvider || 'google',
        autoCopy: result.autoCopy || false,
        quickPanelEnabled: result.quickPanelEnabled !== false,
        hoverTranslationEnabled: result.hoverTranslationEnabled || false,
        inlineTranslateEnabled: result.inlineTranslateEnabled || false,
        multiEngineEnabled: result.multiEngineEnabled || false,
        minSelectionLength: result.minSelectionLength || 2,
        apiKeys: result.apiKeys || {},
        llmConfig: result.llmConfig || { baseUrl: '', model: '' },
        uiLanguage: result.uiLanguage || 'en'
      };

      sendResponse({ success: true, settings });
    } catch (error) {
      console.error('Failed to get settings:', error);
      sendResponse({ error: error.message });
    }
  }

  async saveSettings(settings, sendResponse) {
    try {
      await chrome.storage.local.set(settings);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to save settings:', error);
      sendResponse({ error: error.message });
    }
  }

  async getAvailableModels(apiKey, baseUrl, sendResponse) {
    try {
      // 构建 API URL
      let url = baseUrl.trim();
      if (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
      // 尝试 OpenAI 兼容的 models 端点
      const modelsUrl = `${url}/models`;

      console.log('Background: Fetching models from:', modelsUrl);

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Background: Failed to fetch models:', errorText);
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();

      // 解析 OpenAI 格式的响应
      let models = [];
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id);
      } else if (Array.isArray(data)) {
        models = data.map(model => typeof model === 'string' ? model : model.id);
      }

      console.log('Background: Found models:', models);
      sendResponse({ success: true, models: models });
    } catch (error) {
      console.error('Background: Error fetching models:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async captureVisibleTab(rect, sendResponse) {
    try {
      console.log('Capturing visible tab with rect:', rect);

      // 獲取當前活動標籤
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      const tab = tabs[0];

      // 檢查權限
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        throw new Error('無法在此頁面進行截圖');
      }

      // 使用 Chrome 的截圖 API
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
        quality: 100
      });

      console.log('Screenshot captured successfully');

      sendResponse({
        success: true,
        dataUrl: dataUrl,
        rect: rect
      });

    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  _providerToModuleId(provider) {
    const map = { google: 'engine-google', microsoft: 'engine-microsoft', glm: 'engine-glm', custom: 'engine-custom' }
    return map[provider] || null
  }

  _translateViaEventBus(text, from, to, moduleId) {
    return new Promise((resolve, reject) => {
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const timeout = setTimeout(() => {
        unsubResult()
        unsubError()
        reject(new Error('Translation timeout'))
      }, 30000)

      const unsubResult = eventBus.on('translate:result', (data) => {
        if (data.id === requestId) {
          clearTimeout(timeout)
          unsubResult()
          unsubError()
          resolve(data.result)
        }
      })
      const unsubError = eventBus.on('translate:error', (data) => {
        if (data.id === requestId) {
          clearTimeout(timeout)
          unsubResult()
          unsubError()
          reject(new Error(data.error))
        }
      })

      eventBus.emit('translate:text', { text, from, to, id: requestId, target: moduleId })
    })
  }

  async _isModuleEnabled(moduleId) {
    const data = await chrome.storage.local.get('moduleToggles')
    const toggles = data.moduleToggles || {}
    // 默認為啟用（如果沒有 toggle 記錄）
    return toggles[moduleId] !== false
  }

  // ===== 文本預處理管道（淨化 → 代碼保護） =====
  async _preprocessText(text) {
    let current = text

    // 1. 淨化
    try {
      const result = await this._emitAndWait('preprocess:sanitize', 'preprocess:sanitized', { text: current })
      if (result && result.text) current = result.text
    } catch { /* 如果模塊未激活或出錯，跳過 */ }

    // 2. 代碼保護
    try {
      const result = await this._emitAndWait('preprocess:protect', 'preprocess:protected', { text: current })
      if (result && result.text) {
        current = result.text
        this._codePlaceholders = result.placeholders || {}
      }
    } catch { /* 沒有代碼保護模塊，跳過 */ }

    return current
  }

  // ===== 文本後處理管道（恢復代碼） =====
  async _postprocessText(text) {
    if (!this._codePlaceholders || Object.keys(this._codePlaceholders).length === 0) {
      return text
    }
    try {
      const result = await this._emitAndWait('postprocess:restore', 'postprocess:restored', {
        text,
        placeholders: this._codePlaceholders
      })
      if (result && result.text) {
        this._codePlaceholders = null
        return result.text
      }
    } catch { /* 跳過 */ }
    this._codePlaceholders = null
    return text
  }

  // ===== 緩存查詢 =====
  async _checkCache(text, from, to, engine) {
    try {
      const result = await this._emitAndWait('cache:get', 'cache:got', { text, from, to, engine })
      if (result && result.hit) return result.result
    } catch { /* 跳過 */ }
    return null
  }

  // ===== 緩存寫入 =====
  async _setCache(text, from, to, result, engine) {
    try {
      await this._emitAndWait('cache:set', 'cache:setted', { text, from, to, result, engine })
    } catch { /* 跳過 */ }
  }

  // ===== EventBus 請求/響應輔助 =====
  async _emitAndWait(requestEvent, responseEvent, payload, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const requestId = 'pp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const timer = setTimeout(() => {
        unsub()
        reject(new Error('timeout'))
      }, timeout)
      const unsub = eventBus.on(responseEvent, (data) => {
        if (data.requestId === requestId) {
          clearTimeout(timer)
          unsub()
          resolve(data)
        }
      })
      eventBus.emit(requestEvent, { ...payload, requestId })
    })
  }

  async translateText(text, sourceLang, targetLang, sendResponse) {
    let processedText = text
    try {
      console.log(`Background: Translating "${text}" from ${sourceLang} to ${targetLang}`);

      // ===== Step 1: 預處理文本（淨化 + 代碼保護） =====
      processedText = await this._preprocessText(text)

      // 获取用户设置的 API Provider（需在緩存檢查之前）
      const settings = await this.getUserSettings();
      let apiProvider = settings.apiProvider || 'google';

      // ===== Step 2: 檢查緩存 =====
      const cached = await this._checkCache(processedText, sourceLang, targetLang, apiProvider)
      if (cached !== null) {
        console.log('Background: Cache hit, returning cached result')
        sendResponse({
          success: true,
          translatedText: cached,
          sourceLang,
          targetLang,
          fromCache: true
        })
        return
      }

      console.log('Background: Using API provider:', apiProvider);

      // 檢查翻譯引擎狀態
      const allToggles = await chrome.storage.local.get('moduleToggles')
      const toggles = allToggles.moduleToggles || {}

      // 如果選中的引擎已關閉，自動切換到第一個可用的
      const modId = this._providerToModuleId(apiProvider)
      if (modId && !(await this._isModuleEnabled(modId))) {
        const fallbackOrder = ['google', 'microsoft', 'glm', 'custom']
        let switched = false
        for (const fb of fallbackOrder) {
          if (toggles['engine-' + fb] !== false) {
            apiProvider = fb
            await chrome.storage.local.set({ apiProvider: fb })
            console.log('Background: Auto-switched to available engine:', apiProvider)
            switched = true
            break
          }
        }
        if (!switched) {
          throw new Error('所有翻譯引擎均已關閉，請在 🧩 模塊系統中至少啟用一個翻譯引擎')
        }
      }

      let result;

      // 優先嘗試通過 EventBus 模塊路由翻譯
      const moduleId = this._providerToModuleId(apiProvider)
      const modEntry = moduleLoader.getModule(moduleId)
      if (modEntry && modEntry.instance) {
        try {
          result = await this._translateViaEventBus(processedText, sourceLang, targetLang, moduleId)
          console.log('Background: Translated via EventBus module:', moduleId)
        } catch (ebError) {
          console.warn('Background: EventBus translation failed, falling back:', ebError.message)
          result = null
        }
      }

      // 如果 EventBus 失敗或沒有對應模塊，回退到 switch-case
      if (result === null || result === undefined) {

        // 回退到舊的 switch-case
        // 根据 API Provider 选择翻译方法
        switch (apiProvider) {
          case 'glm':
            const glmApiKey = settings.apiKeys?.glm;
            if (!glmApiKey) {
              throw new Error('GLM API Key 未设置，请在设置中配置');
            }
            result = await this.callGLMTranslate(processedText, sourceLang, targetLang, glmApiKey);
            break;

          case 'microsoft':
            result = await this.callMicrosoftTranslate(processedText, sourceLang, targetLang);
            break;

          case 'custom':
            let customApiKey = settings.apiKeys?.custom;
            let llmConfig = settings.llmConfig || {};
            // 如果主设置中没有，尝试从模块设置中读取
            if (!customApiKey || !llmConfig.baseUrl || !llmConfig.model) {
              const modCfg = await chrome.storage.local.get('moduleSettings.engine-custom')
              const ms = modCfg['moduleSettings.engine-custom']
              if (ms) {
                customApiKey = customApiKey || ms.apiKey
                llmConfig = {
                  baseUrl: llmConfig.baseUrl || ms.baseUrl,
                  model: llmConfig.model || ms.model
                }
              }
            }
            console.log('Background: Custom LLM config:', {
              hasApiKey: !!customApiKey,
              baseUrl: llmConfig.baseUrl || 'not set',
              model: llmConfig.model || 'not set'
            });
            if (!customApiKey || !llmConfig.baseUrl || !llmConfig.model) {
              throw new Error('LLM 自定义配置不完整，请检查 API Key、Base URL 和模型名称');
            }
            console.log('Background: Calling Custom LLM with model:', llmConfig.model);
            result = await this.callCustomLLMTranslate(processedText, sourceLang, targetLang, customApiKey, llmConfig);
            break;

          case 'google':
          default:
            result = await this.callGoogleTranslate(processedText, sourceLang, targetLang);
            break;
        }
      }

      // 記錄翻譯統計
      trackModuleUsage(apiProvider, result?.length || 0, true);

      // ===== Step 3: 後處理（恢復代碼等） =====
      result = await this._postprocessText(result)

      // ===== Step 4: 寫入緩存 =====
      this._setCache(processedText, sourceLang, targetLang, result, apiProvider).catch(() => {})

      sendResponse({
        success: true,
        translatedText: result,
        sourceLang: sourceLang,
        targetLang: targetLang
      });
    } catch (error) {
      console.error('Background: Translation error:', error);

      // 所有引擎已關閉時，跳過備用服務，直接報錯
      if (error.message.includes('所有翻譯引擎均已關閉')) {
        sendResponse({
          success: false,
          error: error.message
        })
        return
      }

      // 尝试备用翻译服务
      try {
        console.log('Background: Trying backup translation service...');
        const backupResult = await this.callBackupTranslateService(processedText, sourceLang, targetLang);
        if (backupResult && backupResult.text && backupResult.text !== processedText) {
          console.log('Background: Backup translation successful via', backupResult.service, ':', backupResult.text);
          sendResponse({
            success: true,
            translatedText: backupResult.text,
            sourceLang: sourceLang,
            targetLang: targetLang,
            isBackup: true,
            backupService: backupResult.service
          });
        } else {
          throw new Error('Backup translation also failed');
        }
      } catch (backupError) {
        console.error('Background: Backup translation failed:', backupError);
        sendResponse({
          success: false,
          error: `Translation failed: ${error.message}. Backup also failed: ${backupError.message}`
        });
      }
    }
  }

  // 格式化中文翻译结果，在词之间添加空格
  formatChineseResult(text, translatedText, sourceLang) {
    // 检查是否应该添加词间空格
    // 如果原文是英文单词列表（由多个空格分隔的短词组成）且翻译目标是中文
    const isChineseTarget = translatedText.match(/[\u4e00-\u9fff]/) !== null;
    const isEnglishSource = sourceLang === 'en';
    const isWordList = text && text.split(/\s+/).length > 1 && text.split(/\s+/).every(word => word.length <= 15);

    if (isChineseTarget && isEnglishSource && isWordList) {
      // 在每个中文字符之间添加空格（保留标点符号）
      return translatedText.replace(/([\u4e00-\u9fff])([\u4e00-\u9fff])/g, '$1 $2');
    }

    return translatedText;
  }

  // Google 翻译（免费，含 429 自动重试）
  async callGoogleTranslate(text, sourceLang, targetLang) {
    const RETRY_DELAYS = [1500, 3000, 5000]
    const URLS = [
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&ie=UTF-8&oe=UTF-8&q=${encodeURIComponent(text)}`,
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&dt=t&ie=UTF-8&oe=UTF-8&q=${encodeURIComponent(text)}`
    ]
    let lastError

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      for (const url of URLS) {
        try {
          console.log('Background: Google Translate URL:', url);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          console.log('Background: Google Translate response status:', response.status);

          if (response.status === 429 && attempt < RETRY_DELAYS.length) {
            const delay = RETRY_DELAYS[attempt]
            console.warn(`Background: Google Translate 429 on ${url}, retry ${attempt + 1} in ${delay}ms...`)
            await new Promise(r => setTimeout(r, delay))
            continue
          }

          if (!response.ok) {
            lastError = new Error(`Google Translate HTTP error! status: ${response.status}`);
            continue
          }

          const data = await response.json();
          console.log('Background: Google Translate response data:', data);

          if (data && data[0] && Array.isArray(data[0])) {
            let translatedText = '';
            for (const segment of data[0]) {
              if (segment && segment[0]) {
                translatedText += segment[0];
              }
            }
            let result = translatedText.trim();
            result = this.formatChineseResult(text, result, sourceLang);
            console.log('Background: Google Translate result:', result);

            if (result && result !== text) {
              console.log('Background: Google translation successful');
              return result;
            }
          }

          lastError = new Error('Google translation failed - invalid response format');
        } catch (err) {
          console.error('Background: Google Translate attempt failed:', err.message);
          lastError = err
          if (err.message.includes('429')) {
            await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 3000))
            continue
          }
        }
      }
    }

    throw lastError || new Error('Google Translate max retries exceeded')
  }

  // Microsoft Translator（需要 API Key）
  async callMicrosoftTranslate(text, sourceLang, targetLang, apiKey) {
    try {
      console.log(`Background: Calling Microsoft Translator - ${sourceLang} -> ${targetLang}`);

      // Microsoft Translator API 端点
      const endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';

      // 语言代码映射
      const langMap = {
        'zh': 'zh-Hans',
        'zh-cn': 'zh-Hans',
        'zh-CN': 'zh-Hans',
        'zh-TW': 'zh-Hant',
        'en': 'en',
        'ja': 'ja',
        'ko': 'ko',
        'fr': 'fr',
        'de': 'de',
        'es': 'es'
      };

      const fromLang = langMap[sourceLang] || sourceLang;
      const toLang = langMap[targetLang] || targetLang;

      const url = `${endpoint}&from=${fromLang}&to=${toLang}`;
      console.log('Background: Microsoft Translator URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': apiKey
        },
        body: JSON.stringify([{ text: text }])
      });

      console.log('Background: Microsoft Translator response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Background: Microsoft Translator error:', errorText);
        throw new Error(`Microsoft Translator error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Background: Microsoft Translator response:', data);

      if (data && data[0] && data[0].translations && data[0].translations[0]) {
        let result = data[0].translations[0].text;
        // 格式化中文结果，添加词间空格
        result = this.formatChineseResult(text, result, sourceLang);
        console.log('Background: Microsoft translation result:', result);
        return result;
      }

      throw new Error('Microsoft translation failed - invalid response format');
    } catch (error) {
      console.error('Background: Microsoft translation error:', error);
      throw error;
    }
  }

  // GLM 大模型翻译
  async callGLMTranslate(text, sourceLang, targetLang, apiKey) {
    try {
      console.log(`Background: Calling GLM API - ${sourceLang} -> ${targetLang}`);

      // 语言代码映射到 GLM 友好的语言描述
      const langMap = {
        'zh': '中文',
        'zh-cn': '简体中文',
        'zh-TW': '繁体中文',
        'en': '英文',
        'ja': '日文',
        'ko': '韩文',
        'fr': '法文',
        'de': '德文',
        'es': '西班牙文',
        'auto': '自动检测'
      };

      const sourceLangName = langMap[sourceLang] || '源语言';
      const targetLangName = langMap[targetLang] || '目标语言';

      const prompt = `你是一个专业的翻译引擎。请将以下${sourceLangName}文本翻译成${targetLangName}，只返回翻译结果，不要添加任何解释、备注或格式：

${text}`;

      // 设置 60 秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Background: GLM API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Background: GLM API error:', errorData);
        // 尝试解析错误消息
        let errorMessage = `GLM API 错误: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            if (typeof errorJson.error === 'string') {
              errorMessage = errorJson.error;
            } else if (errorJson.error.message) {
              errorMessage = errorJson.error.message;
            }
          }
        } catch (e) {
          // 解析失败，使用默认消息
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Background: GLM API response:', data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
        let result = data.choices[0].message.content.trim();
        // 格式化中文结果，添加词间空格
        result = this.formatChineseResult(text, result, sourceLang);
        console.log('Background: GLM translation result:', result);
        return result;
      }

      throw new Error('Invalid GLM API response format');
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('Background: GLM request timeout');
        throw new Error('GLM 请求超时，请检查网络连接或 API 服务状态');
      }
      console.error('Background: GLM translation error:', error);
      throw error;
    }
  }

  // 通用 LLM 翻译（OpenAI 兼容格式）
  async callCustomLLMTranslate(text, sourceLang, targetLang, apiKey, llmConfig) {
    try {
      console.log(`Background: Calling Custom LLM API - ${sourceLang} -> ${targetLang}`);
      console.log('Background: LLM Config:', llmConfig);

      // 语言代码映射到友好的语言描述
      const langMap = {
        'zh': '中文',
        'zh-cn': '简体中文',
        'zh-CN': '简体中文',
        'zh-TW': '繁体中文',
        'en': '英文',
        'ja': '日文',
        'ko': '韩文',
        'fr': '法文',
        'de': '德文',
        'es': '西班牙文',
        'auto': '源语言'
      };

      const sourceLangName = langMap[sourceLang] || sourceLang;
      const targetLangName = langMap[targetLang] || targetLang;

      const prompt = `你是一个专业的翻译引擎。请将以下${sourceLangName}文本翻译成${targetLangName}，只返回翻译结果，不要添加任何解释、备注或格式：

${text}`;

      // 构建 API URL（处理 baseUrl 末尾的斜杠）
      let baseUrl = llmConfig.baseUrl.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      const chatEndpoint = `${baseUrl}/chat/completions`;

      console.log('Background: Custom LLM endpoint:', chatEndpoint);

      // 首先尝试非流式响应
      try {
        const result = await this.callLLMWithResponse(chatEndpoint, apiKey, llmConfig.model, prompt, false);
        return result;
      } catch (nonStreamError) {
        console.log('Background: Non-streaming failed, trying streaming:', nonStreamError.message);
        // 如果非流式失败（如 "Invalid SSE response"），尝试流式
        if (nonStreamError.message.includes('SSE') ||
            nonStreamError.message.includes('stream') ||
            nonStreamError.message.includes('streaming')) {
          const result = await this.callLLMWithResponse(chatEndpoint, apiKey, llmConfig.model, prompt, true);
          return result;
        }
        throw nonStreamError;
      }
    } catch (error) {
      console.error('Background: Custom LLM translation error:', error);
      throw error;
    }
  }

  // LLM 请求辅助方法，支持流式/非流式
  async callLLMWithResponse(endpoint, apiKey, model, prompt, isStream) {
    return new Promise(async (resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            stream: isStream
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Background: LLM response status:', response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Background: LLM API error:', errorData);
          // 尝试解析错误消息
          let errorMessage = `LLM API 错误: ${response.status}`;
          try {
            const errorJson = JSON.parse(errorData);
            // 处理不同的错误格式
            if (errorJson.error) {
              if (typeof errorJson.error === 'string') {
                errorMessage = errorJson.error;
              } else if (errorJson.error.message) {
                errorMessage = errorJson.error.message;
              } else if (errorJson.error.code) {
                errorMessage = `${errorJson.error.code}: ${errorJson.error.message || errorJson.error.type || 'Unknown error'}`;
              }
            }
          } catch (e) {
            // 解析失败，使用默认消息
            errorMessage = `LLM API 错误: ${response.status} - ${errorData.substring(0, 100)}`;
          }
          reject(new Error(errorMessage));
          return;
        }

        if (isStream) {
          // 处理流式响应
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let result = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    result += content;
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }

          if (result) {
            result = this.formatChineseResult(prompt, result, 'auto');
            resolve(result);
          } else {
            reject(new Error('翻译结果为空'));
          }
        } else {
          // 处理非流式响应
          const data = await response.json();
          console.log('Background: LLM response:', data);

          if (data.choices && data.choices[0] && data.choices[0].message) {
            let result = data.choices[0].message.content.trim();
            if (result) {
              result = this.formatChineseResult(prompt, result, 'auto');
              resolve(result);
              return;
            }
          }
          reject(new Error('Invalid LLM API response format'));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error('LLM 请求超时'));
        } else {
          reject(error);
        }
      }
    });
  }

  async handleQuickPanelTranslate(request, sendResponse) {
    try {
      const { text, sourceLang, targetLang } = request;

      console.log('Quick panel translate:', {
        textLength: text?.length,
        sourceLang,
        targetLang
      });

      // 直接调用 translateText 方法
      await this.translateText(text, sourceLang, targetLang, sendResponse);
    } catch (error) {
      console.error('Quick panel translate error:', error);
      sendResponse({
        success: false,
        error: error.message || '翻译失败'
      });
    }
  }

  // 多引擎翻译 - 同时调用多个翻译服务
  async translateMultiEngine(text, sourceLang, targetLang, includeLLM, sendResponse) {
    const results = {};
    const errors = {};
    const toggles = (await chrome.storage.local.get('moduleToggles')).moduleToggles || {};

    // 0. 获取用户设置
    const settings = await this.getUserSettings();

    // 1. Google 翻译（检查開關）
    if (toggles['engine-google'] !== false) {
      try {
        const googleResult = await this.callGoogleTranslate(text, sourceLang, targetLang);
        results.google = googleResult;
      } catch (e) {
        results.google = null;
      }
    }

    // 2. Microsoft 翻译（檢查開關 + API Key）
    const microsoftApiKey = settings.apiKeys?.microsoft;
    if (microsoftApiKey && toggles['engine-microsoft'] !== false) {
      try {
        const microsoftResult = await this.callMicrosoftTranslate(text, sourceLang, targetLang, microsoftApiKey);
        results.microsoft = microsoftResult;
      } catch (e) {
        results.microsoft = null;
      }
    }

    // 3. EventBus 引擎（檢查開關）
    if (includeLLM) {
      // Custom LLM
      if (toggles['engine-custom'] !== false) {
        const customMod = moduleLoader.getModule('engine-custom');
        if (customMod) {
        try {
          const llmResult = await this._translateViaEventBus(text, sourceLang, targetLang, 'engine-custom');
          if (llmResult) results.llm = llmResult;
        } catch (e) {
          // EventBus 失敗，嘗試直接調用（從標準設定或 moduleSettings 讀取）
          try {
            const modSettings = await chrome.storage.local.get(['apiKeys', 'llmConfig', 'moduleSettings.engine-custom']);
            const apiKey = modSettings.apiKeys?.custom || modSettings['moduleSettings.engine-custom']?.apiKey;
            const config = modSettings.llmConfig || {};
            const baseUrl = config.baseUrl || modSettings['moduleSettings.engine-custom']?.baseUrl;
            const model = config.model || modSettings['moduleSettings.engine-custom']?.model;
            if (apiKey && baseUrl && model) {
              results.llm = await this.callCustomLLMTranslate(text, sourceLang, targetLang, apiKey, { baseUrl, model });
            }
          } catch (e2) { /* 都不行就算了 */ }
        }
      }
      // 直接调用（绕过 EventBus / 模块加载状态）
      try {
        const ms = await chrome.storage.local.get(['apiKeys', 'llmConfig', 'moduleSettings.engine-custom']);
        const ak = ms.apiKeys?.custom || ms['moduleSettings.engine-custom']?.apiKey;
        const c = ms.llmConfig || {};
        const bu = c.baseUrl || ms['moduleSettings.engine-custom']?.baseUrl;
        const m = c.model || ms['moduleSettings.engine-custom']?.model;
        if (ak && bu && m) {
          results.llm = await this.callCustomLLMTranslate(text, sourceLang, targetLang, ak, { baseUrl: bu, model: m });
        }
      } catch (e) { errors.llm = e.message; }
      }

      // GLM
      if (toggles['engine-glm'] !== false) {
        const glmMod = moduleLoader.getModule('engine-glm');
        if (glmMod) {
        try {
          const glmResult = await this._translateViaEventBus(text, sourceLang, targetLang, 'engine-glm');
          if (glmResult) results.glm = glmResult;
        } catch (e) {
          // GLM 回退
          try {
            const modSettings = await chrome.storage.local.get(['apiKeys', 'moduleSettings.engine-glm']);
            const apiKey = modSettings.apiKeys?.glm || modSettings['moduleSettings.engine-glm']?.apiKey;
            if (apiKey) results.glm = await this.callGLMTranslate(text, sourceLang, targetLang, apiKey);
          } catch (e2) {}
        }
      }
    }
    }

    // 多引擎統計
    for (const [engine, text] of Object.entries(results)) {
      if (text) trackModuleUsage(engine, text.length || 0, true)
    }

    // 返回所有结果
    sendResponse({
      success: Object.keys(results).length > 0,
      results: results,
      errors: errors,
      sourceLang: sourceLang,
      targetLang: targetLang
    });
  }

  async callBackupTranslateService(text, sourceLang, targetLang) {
    const errors = [];

    // 备用服务1: MyMemory
    try {
      console.log(`Background: Trying MyMemory - ${sourceLang} -> ${targetLang}`);
      // MyMemory 不支持 'auto'，默认使用英文
      const src = sourceLang === 'auto' ? 'en' : sourceLang;
      const tgt = targetLang === 'zh-TW' ? 'zh-TW' : (targetLang === 'zh-CN' ? 'zh-CN' : targetLang);
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
      console.log('Background: MyMemory URL:', url);

      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await response.json();
      console.log('Background: MyMemory response:', data);

      if (data && data.responseData && data.responseData.translatedText) {
        const result = data.responseData.translatedText;
        if (result && result !== text && !result.includes('MYMEMORY WARNING')) {
          console.log('Background: MyMemory success:', result);
          return { text: result, service: 'MyMemory' };
        }
      }
      errors.push('MyMemory: invalid result');
    } catch (e) {
      console.error('Background: MyMemory failed:', e.message);
      errors.push(`MyMemory: ${e.message}`);
    }

    // 备用服务2: Lingva Translate (Google Translate 代理，非 Google 域名)
    try {
      console.log(`Background: Trying Lingva Translate - ${sourceLang} -> ${targetLang}`);
      const src = sourceLang === 'auto' ? 'auto' : sourceLang;
      // Lingva 使用 zh 而不是 zh-CN/zh-TW
      const tgt = (targetLang === 'zh-CN' || targetLang === 'zh-TW' || targetLang === 'zh') ? 'zh' : targetLang;
      const lingvaUrl = `https://lingva.ml/api/v1/${src}/${tgt}/${encodeURIComponent(text)}`;
      console.log('Background: Lingva URL:', lingvaUrl);

      const response = await fetch(lingvaUrl, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('Background: Lingva response:', data);

      if (data && data.translation) {
        const result = data.translation.trim();
        if (result && result !== text) {
          console.log('Background: Lingva success:', result);
          return { text: result, service: 'Lingva' };
        }
      }
      errors.push('Lingva: invalid result');
    } catch (e) {
      console.error('Background: Lingva failed:', e.message);
      errors.push(`Lingva: ${e.message}`);
    }

    throw new Error(`所有备用翻译服务均失败: ${errors.join('; ')}`);
  }
}

// 在 class 定义后立即启动服务
const translator = new ScreenshotTranslator();

// 加載模塊系統
moduleLoader.loadAll().then(results => {
  const ok = results.filter(r => r.success).length
  const fail = results.filter(r => !r.success).length
  console.log(`Module system initialized: ${ok} active, ${fail} failed`)
  if (fail > 0) {
    results.filter(r => !r.success).forEach(r =>
      console.warn(`  ${r.id}: ${r.error || r.errors?.join(', ')}`)
    )
  }

  // 啟動 offscreen document（用於沙箱評估第三方模塊）
  initModuleHost()
})

// 初始化 offscreen document（模塊沙箱橋接器）
async function initModuleHost() {
  try {
    // 檢查是否已存在
    const existing = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    }).catch(() => [])
    if (existing && existing.length > 0) {
      console.log('ModuleHost: already exists')
      return
    }

    await chrome.offscreen.createDocument({
      url: 'module-host.html',
      reasons: ['DOM_OPERATION'],
      justification: 'Evaluate third-party module code in sandbox'
    })
    console.log('ModuleHost: offscreen document created')
  } catch (e) {
    console.warn('ModuleHost: init failed:', e.message)
  }

  // 啟動心跳（每 25 秒 ping 一次，防止 Chrome 銷毀）
  startModuleHeartbeat()
}

// 心跳機制：防止 offscreen document 被 Chrome 自動銷毀
function startModuleHeartbeat() {
  setInterval(async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'ping', to: 'moduleHost' })
    } catch {
      // offscreen 已被銷毀，重建
      try {
        await chrome.offscreen.createDocument({
          url: 'module-host.html',
          reasons: ['DOM_OPERATION'],
          justification: 'Keep module sandbox alive'
        })
        console.log('ModuleHost: recreated after heartbeat failure')
      } catch (e) {
        console.warn('ModuleHost: recreate failed:', e.message)
      }
    }
  }, 25000)
}

// ===== 模塊用量統計 =====
// 追蹤每個引擎的翻譯次數、字數、成功率
eventBus.on('translate:result', (data) => {
  trackModuleUsage(data.engine, data.result?.length || 0, true)
})
eventBus.on('translate:error', (data) => {
  trackModuleUsage(data.engine, 0, false)
})

async function trackModuleUsage(engine, charCount, success) {
  try {
    const result = await chrome.storage.local.get('moduleStats')
    const stats = result.moduleStats || {}
    if (!stats[engine]) {
      stats[engine] = { calls: 0, chars: 0, successes: 0, failures: 0 }
    }
    stats[engine].calls++
    stats[engine].chars += charCount
    if (success) stats[engine].successes++
    else stats[engine].failures++
    await chrome.storage.local.set({ moduleStats: stats })
  } catch (e) { /* ignore */ }
}
