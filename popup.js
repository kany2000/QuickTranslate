// Popup 界面控制器
class PopupController {
  constructor() {
    this.elements = {};
    this.settings = {};
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadSettings();
    // 初始化 i18n 并更新 UI
    this.initI18n();
    // 显示欢迎 toast 5 秒
    this.showWelcomeToast();
  }

  initI18n() {
    // i18n 已在 i18n.js 中初始化
    // 如果有保存的 UI 语言设置，使用它
    if (this.settings.uiLanguage && supportedLanguages.includes(this.settings.uiLanguage)) {
      i18n.setLanguage(this.settings.uiLanguage);
    }
    // 更新 UI 文字
    i18n.updateUI();
    // 设置语言选择器的值
    if (this.elements.uiLanguage) {
      this.elements.uiLanguage.value = i18n.getCurrentLanguage();
    }

    // 监听语言变更事件
    window.addEventListener('qtLanguageChanged', (e) => {
      console.log('Language changed to:', e.detail.language);
    });
  }

  async changeUILanguage() {
    const newLang = this.elements.uiLanguage.value;
    console.log('Changing UI language to:', newLang);

    // 更新 i18n 语言
    i18n.setLanguage(newLang);

    // 保存到 storage
    try {
      await chrome.storage.local.set({ uiLanguage: newLang });

      // 通知所有 content script 语言已变更
      this.notifyContentScriptsLanguageChange(newLang);

      this.showStatus(i18n.t('status.saved'), 'success');
    } catch (error) {
      console.error('Failed to save UI language:', error);
    }
  }

  // 通知所有 content script 语言已变更
  notifyContentScriptsLanguageChange(lang) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'languageChanged',
            language: lang
          }, (response) => {
            // 忽略无法发送消息的 tab（可能没有注入 content script）
            if (chrome.runtime.lastError) {
              // console.log('Tab', tab.id, 'not responding');
            }
          });
        }
      });
    });
  }

  showWelcomeToast() {
    // 检查是否是首次安装或需要显示欢迎提示
    // 注意：在开发者模式下 onInstalled 不会触发，所以我们也检查是否有任何已保存的设置
    chrome.storage.local.get(['shouldShowWelcome', 'targetLanguage'], (result) => {
      // 如果 shouldShowWelcome 为 true，或者没有任何已保存的设置（首次安装）
      const isFirstInstall = !result.shouldShowWelcome && !result.targetLanguage;

      if (result.shouldShowWelcome === false && !isFirstInstall) {
        return; // 不是首次安装，且不需要显示
      }

      const welcomeToast = document.getElementById('welcome-toast');
      if (welcomeToast) {
        // 添加 visible 类，显示 toast（使用 transition 动画）
        welcomeToast.classList.add('visible');

        // 5 秒后隐藏
        setTimeout(() => {
          welcomeToast.classList.remove('visible');
        }, 5000);

        // 点击关闭按钮手动关闭
        const closeBtn = welcomeToast.querySelector('.toast-close');
        if (closeBtn) {
          closeBtn.onclick = () => {
            welcomeToast.classList.remove('visible');
          };
        }
      }

      // 显示后清除标记，避免下次打开 popup 时重复显示
      chrome.storage.local.set({ shouldShowWelcome: false });
    });
  }

  bindElements() {
    this.elements = {
      startCapture: document.getElementById('start-capture'),
      targetLanguage: document.getElementById('target-language'),
      ocrLanguage: document.getElementById('ocr-language'),
      uiLanguage: document.getElementById('ui-language'),
      quickSave: document.getElementById('quick-save'),
      settingsBtn: document.getElementById('settings-btn'),
      settingsModal: document.getElementById('settings-modal'),
      historyList: document.getElementById('history-list'),
      historyCount: document.getElementById('history-count'),
      historySectionToggle: document.getElementById('history-section-toggle'),
      historySectionBody: document.getElementById('history-section-body'),
      wordsList: document.getElementById('words-list'),
      wordsCount: document.getElementById('words-count'),
      wordsSectionToggle: document.getElementById('words-section-toggle'),
      wordsSectionBody: document.getElementById('words-section-body'),
      modulesBtn: document.getElementById('modules-btn'),
      modulesModal: document.getElementById('modules-modal'),
      closeModulesBtn: document.getElementById('close-modules-btn'),
      modulesListFull: document.getElementById('modules-list-full'),
      importModuleBtnFull: document.getElementById('import-module-btn-full'),
      closeSettings: document.getElementById('close-settings'),
      apiProvider: document.getElementById('api-provider'),
      microsoftApiKey: document.getElementById('microsoft-api-key'),
      microsoftApiKeyGroup: document.getElementById('microsoft-api-key-group'),
      glmApiKey: document.getElementById('glm-api-key'),
      glmApiKeyGroup: document.getElementById('glm-api-key-group'),
      customApiKey: document.getElementById('custom-api-key'),
      customApiKeyGroup: document.getElementById('custom-api-key-group'),
      llmCustomConfig: document.getElementById('llm-custom-config'),
      llmBaseUrl: document.getElementById('llm-base-url'),
      llmModel: document.getElementById('llm-model'),
      llmModelCustom: document.getElementById('llm-model-custom'),
      llmModelHelp: document.getElementById('llm-model-help'),
      fetchModels: document.getElementById('fetch-models'),
      quickPanelEnabled: document.getElementById('quick-panel-enabled'),
      hoverTranslationEnabled: document.getElementById('hover-translation-enabled'),
      multiEngineEnabled: document.getElementById('multi-engine-enabled'),
      minSelectionLength: document.getElementById('min-selection-length'),
      autoCopy: document.getElementById('auto-copy'),
      saveSettings: document.getElementById('save-settings'),
      resetSettings: document.getElementById('reset-settings'),
      statusMessage: document.getElementById('status-message'),
      shortcutKey: document.getElementById('shortcut-key'),
      changeShortcut: document.getElementById('change-shortcut')
    };
  }

  bindEvents() {
    // 開始截圖
    this.elements.startCapture.addEventListener('click', () => {
      this.startCapture();
    });

    // 快速保存基本設置
    this.elements.quickSave.addEventListener('click', () => {
      this.quickSaveBasicSettings();
    });

    // 設置按鈕
    this.elements.settingsBtn.addEventListener('click', () => {
      this.showSettingsModal();
    });

    // 高級設置內歷史記錄折疊/展開
    this.elements.historySectionToggle.addEventListener('click', () => {
      this.toggleInlineSection(this.elements.historySectionBody);
    });

    // 高級設置內生詞本折疊/展開
    this.elements.wordsSectionToggle.addEventListener('click', () => {
      this.toggleInlineSection(this.elements.wordsSectionBody);
    });

    // 模塊按鈕
    this.elements.modulesBtn.addEventListener('click', () => {
      this.showModulesModal();
    });

    // 模塊列表事件委託（卸載 + 設置，只綁一次）
    this.elements.modulesListFull.addEventListener('click', (e) => {
      const uninstallBtn = e.target.closest('.uninstall-btn');
      if (uninstallBtn) {
        const moduleId = uninstallBtn.dataset.id;
        if (!confirm('確定卸載此模塊？')) return;
        chrome.runtime.sendMessage({ action: 'uninstallModule', moduleId }, () => {
          this.loadModulesSection();
        });
        return;
      }
      const settingsBtn = e.target.closest('.module-settings-btn');
      if (settingsBtn) {
        const moduleId = settingsBtn.dataset.module;
        this.showModuleSettings(moduleId);
      }
    });

    // 模塊開關切換事件委託
    this.elements.modulesListFull.addEventListener('change', (e) => {
      const checkbox = e.target.closest('.module-toggle-input');
      if (!checkbox) return;
      const moduleId = checkbox.dataset.id;
      const enable = checkbox.checked;

      // 先同步更新本地設置，保證 UI 即時響應
      if (moduleId === 'mode-quick-panel') {
        this.settings.quickPanelEnabled = enable;
        this.elements.quickPanelEnabled.checked = enable;
      }
      if (moduleId === 'mode-float-panel') {
        this.settings.floatPanelEnabled = enable;
      }

      chrome.runtime.sendMessage({ action: 'toggleModule', moduleId, enable }, (resp) => {
        if (!resp || !resp.success) {
          this.showStatus(`切換失敗: ${resp?.error || '未知錯誤'}`, 'error');
          checkbox.checked = !enable; // 恢復
          // 恢復本地設置
          if (moduleId === 'mode-quick-panel') {
            this.settings.quickPanelEnabled = !enable;
            this.elements.quickPanelEnabled.checked = !enable;
          }
        }
      });
    });

    // 關閉模塊模態框
    document.getElementById('close-modules-btn').onclick = () => {
      document.getElementById('modules-modal').classList.add('hidden');
    };
    this.elements.modulesModal.addEventListener('click', (e) => {
      if (e.target === this.elements.modulesModal) {
        document.getElementById('modules-modal').classList.add('hidden');
      }
    });

    // 導入模塊按鈕
    this.elements.importModuleBtnFull.addEventListener('click', () => {
      this.importModule();
    });

    // 高級設置內生詞本匯出
    document.getElementById('words-export-btn').addEventListener('click', () => {
      this.exportData();
    });

    // 高級設置內生詞本匯入
    document.getElementById('words-import-btn').addEventListener('click', () => {
      this.importData();
    });

    // 生詞本刪除按鈕事件委託（一次綁定）
    this.elements.wordsList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.inline-delete-btn');
      if (delBtn) {
        const id = parseInt(delBtn.dataset.id);
        chrome.runtime.sendMessage({ action: 'removeFromSavedWords', id }, () => {
          this.loadWordsSection();
        });
      }
    });

    // 關閉設置
    this.elements.closeSettings.addEventListener('click', () => {
      this.hideSettingsModal();
    });

    // 點擊背景關閉模態框
    this.elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.settingsModal) {
        this.hideSettingsModal();
      }
    });

    // API 提供商變更
    this.elements.apiProvider.addEventListener('change', () => {
      this.toggleApiKeyInput();
    });

    // 保存設置
    this.elements.saveSettings.addEventListener('click', () => {
      this.saveSettings();
    });

    // 重置設置
    this.elements.resetSettings.addEventListener('click', () => {
      this.resetSettings();
    });

    // 語言設置變更時顯示提示
    this.elements.targetLanguage.addEventListener('change', () => {
      this.showUnsavedChanges();
    });

    this.elements.ocrLanguage.addEventListener('change', () => {
      this.showUnsavedChanges();
    });

    // UI 語言設置變更時即時切換
    this.elements.uiLanguage.addEventListener('change', () => {
      this.changeUILanguage();
    });

    // ESC 鍵關閉模態框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.elements.settingsModal.classList.contains('hidden')) {
          this.hideSettingsModal();
        } else if (!this.elements.modulesModal.classList.contains('hidden')) {
          this.hideModulesModal();
        }
      }
    });

    // 快捷鍵設置
    this.elements.changeShortcut.addEventListener('click', () => {
      this.startShortcutRecording();
    });

    this.elements.shortcutKey.addEventListener('click', () => {
      this.openShortcutSettings();
    });

    // 獲取模型列表
    this.elements.fetchModels.addEventListener('click', () => {
      this.fetchAvailableModels();
    });

    // 模型選擇變更時切換自定義輸入
    this.elements.llmModel.addEventListener('change', () => {
      const selectedValue = this.elements.llmModel.value;
      if (selectedValue === '__custom__') {
        this.elements.llmModel.classList.add('hidden');
        this.elements.llmModelCustom.classList.remove('hidden');
        this.elements.llmModelCustom.focus();
        this.elements.llmModelHelp.textContent = '請輸入模型名稱，或清空後點擊下方重新選擇';
      } else if (selectedValue) {
        this.elements.llmModel.classList.remove('hidden');
        this.elements.llmModelCustom.classList.add('hidden');
        this.elements.llmModelHelp.textContent = `已選擇: ${selectedValue}`;
      }
      this.showUnsavedChanges();
    });

    // 自定義模型輸入框變更時標記未保存
    this.elements.llmModelCustom.addEventListener('input', () => this.showUnsavedChanges());

    // 自定義模型輸入框失去焦點時，如果為空則顯示下拉框
    this.elements.llmModelCustom.addEventListener('blur', () => {
      const customValue = this.elements.llmModelCustom.value.trim();
      if (!customValue) {
        this.elements.llmModel.classList.remove('hidden');
        this.elements.llmModelCustom.classList.add('hidden');
        this.elements.llmModel.value = '';
        this.elements.llmModelHelp.textContent = '選擇可用模型，或直接輸入模型名稱';
      }
    });

    // LLM 配置變更時標記未保存
    this.elements.customApiKey?.addEventListener('input', () => this.showUnsavedChanges());
    this.elements.llmBaseUrl.addEventListener('input', () => this.showUnsavedChanges());
  }

  async fetchAvailableModels() {
    const apiKey = this.elements.customApiKey?.value.trim() || this.elements.apiKey?.value.trim() || '';
    const baseUrl = this.elements.llmBaseUrl.value.trim();

    if (!apiKey || !baseUrl) {
      this.showStatus('請先填寫 API Key 和 Base URL', 'error');
      return;
    }

    this.showStatus('正在獲取模型列表...', 'info');
    this.elements.fetchModels.disabled = true;
    this.elements.fetchModels.textContent = '載入中...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getModels',
        apiKey: apiKey,
        baseUrl: baseUrl
      });

      if (response && response.success && response.models) {
        const models = response.models;
        this.elements.llmModel.innerHTML = '';

        if (models.length === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = '-- 未找到模型 --';
          this.elements.llmModel.appendChild(option);
          this.showStatus('未找到可用模型', 'error');
        } else {
          // 添加常用模型選項
          const popularModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
          const sortedModels = models.sort((a, b) => {
            const aPopular = popularModels.indexOf(a);
            const bPopular = popularModels.indexOf(b);
            if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
            if (aPopular !== -1) return -1;
            if (bPopular !== -1) return 1;
            return a.localeCompare(b);
          });

          sortedModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            this.elements.llmModel.appendChild(option);
          });

          // 添加自定義選項
          const customOption = document.createElement('option');
          customOption.value = '__custom__';
          customOption.textContent = '-- 或輸入自定義模型 --';
          this.elements.llmModel.appendChild(customOption);

          this.showStatus(`已載入 ${models.length} 個模型`, 'success');
        }
      } else {
        this.showStatus(response?.error || '獲取模型列表失敗', 'error');
        // 添加錯誤提示選項
        this.elements.llmModel.innerHTML = '';
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '-- 獲取失敗，請手動輸入 --';
        this.elements.llmModel.appendChild(option);

        const customOption = document.createElement('option');
        customOption.value = '__custom__';
        customOption.textContent = '-- 或輸入自定義模型 --';
        this.elements.llmModel.appendChild(customOption);
      }
    } catch (error) {
      console.error('Popup: Error fetching models:', error);
      this.showStatus('獲取模型列表失敗: ' + error.message, 'error');
    } finally {
      this.elements.fetchModels.disabled = false;
      this.elements.fetchModels.textContent = '🔄 獲取可用模型';
    }
  }

  async startCapture() {
    try {
      console.log('Popup: Starting capture...');

      // 顯示處理狀態
      this.showStatus('正在啟動截圖...', 'info');

      // 檢查 Chrome runtime 是否可用
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome 對象不存在');
      }

      if (!chrome.runtime) {
        throw new Error('chrome.runtime 不可用');
      }

      if (!chrome.runtime.sendMessage) {
        throw new Error('chrome.runtime.sendMessage 不可用');
      }

      console.log('Popup: Chrome runtime available, sending message...');

      // 使用 Promise 包裝消息發送，添加超時處理
      const sendMessageWithTimeout = (message, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('消息發送超時'));
          }, timeout);

          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timer);

            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      try {
        // 發送開始截圖消息
        const response = await sendMessageWithTimeout({ action: 'startCapture' });

        console.log('Popup: Received response from background:', response);

        if (response && response.error) {
          console.error('Popup: Background returned error:', response.error);
          this.showStatus('啟動失敗: ' + response.error, 'error');
        } else if (response && response.success) {
          console.log('Popup: Capture started successfully');
          this.showStatus('截圖已啟動', 'success');
          // 延遲關閉讓用戶看到成功消息
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          console.log('Popup: Unexpected response, assuming success');
          this.showStatus('截圖已啟動', 'success');
          setTimeout(() => {
            window.close();
          }, 500);
        }
      } catch (messageError) {
        console.error('Popup: Message sending failed:', messageError);

        // 如果是連接錯誤，提供重試選項
        if (messageError.message.includes('Receiving end does not exist') ||
            messageError.message.includes('消息發送超時')) {
          this.showStatus('Service Worker 未啟動，正在重試...', 'warning');

          // 等待一下再重試
          setTimeout(async () => {
            try {
              const retryResponse = await sendMessageWithTimeout({ action: 'ping' }, 3000);
              if (retryResponse && retryResponse.success) {
                this.showStatus('連接已恢復，請重新點擊開始截圖', 'success');
              } else {
                this.showStatus('連接失敗，請重新載入擴展', 'error');
              }
            } catch (retryError) {
              this.showStatus('連接失敗，請重新載入擴展', 'error');
            }
          }, 1000);
        } else {
          this.showStatus('啟動失敗: ' + messageError.message, 'error');
        }
      }
    } catch (error) {
      console.error('Failed to start capture:', error);
      this.showStatus('啟動失敗: ' + error.message, 'error');
    }
  }

  async loadSettings() {
    try {
      // 首先檢查 Chrome runtime 是否可用
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.warn('Chrome runtime not available, using default settings');
        this.useDefaultSettings();
        return;
      }

      // 嘗試發送消息獲取設置
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to connect to background script:', chrome.runtime.lastError.message);
          this.showStatus('啟動失敗: ' + chrome.runtime.lastError.message, 'error');
          this.useDefaultSettings();
          return;
        }

        if (response && response.success) {
          this.settings = response.settings;
          this.updateUI();
          this.clearStatus(); // 清除錯誤狀態
        } else {
          console.warn('No valid response from background script, using defaults');
          this.useDefaultSettings();
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showStatus('載入設置失敗: ' + error.message, 'error');
      this.useDefaultSettings();
    }
  }

  useDefaultSettings() {
    // 使用默認設置 - 默認使用Google翻譯
    this.settings = {
      targetLanguage: 'zh-TW',
      ocrLanguage: 'eng',
      apiProvider: 'google',
      autoCopy: false,
      quickPanelEnabled: true,
      hoverTranslationEnabled: false,
      multiEngineEnabled: false,
      minSelectionLength: 2,
      apiKeys: {},
      llmConfig: {
        baseUrl: '',
        model: ''
      },
      uiLanguage: 'en'
    };
    this.updateUI();
  }

  clearStatus() {
    const statusEl = this.elements.statusMessage;
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  }

  updateUI() {
    // 更新基本設置
    this.elements.targetLanguage.value = this.settings.targetLanguage || 'zh-TW';
    this.elements.ocrLanguage.value = this.settings.ocrLanguage || 'eng';

    // 更新 UI 語言設置
    if (this.elements.uiLanguage) {
      const savedLang = this.settings.uiLanguage || 'en';
      if (supportedLanguages.includes(savedLang)) {
        this.elements.uiLanguage.value = savedLang;
      }
    }

    // 更新高級設置
    this.elements.apiProvider.value = this.settings.apiProvider || 'google';
    this.elements.autoCopy.checked = this.settings.autoCopy || false;

    // 更新快捷面板設置
    this.elements.quickPanelEnabled.checked = this.settings.quickPanelEnabled !== false;
    this.elements.hoverTranslationEnabled.checked = this.settings.hoverTranslationEnabled || false;
    this.elements.multiEngineEnabled.checked = this.settings.multiEngineEnabled || false;
    this.elements.minSelectionLength.value = this.settings.minSelectionLength || 2;

    // 更新 API Key（根据 provider 显示对应的输入框）
    this.elements.microsoftApiKey.value = this.settings.apiKeys?.microsoft || '';
    this.elements.glmApiKey.value = this.settings.apiKeys?.glm || '';
    this.elements.customApiKey.value = this.settings.apiKeys?.custom || '';

    // 更新 LLM 自定義配置
    if (this.settings.llmConfig) {
      this.elements.llmBaseUrl.value = this.settings.llmConfig.baseUrl || '';
      const savedModel = this.settings.llmConfig.model || '';

      if (savedModel) {
        // 檢查模型是否已在下拉列表中
        const options = this.elements.llmModel.options;
        let found = false;

        for (let i = 0; i < options.length; i++) {
          if (options[i].value === savedModel) {
            this.elements.llmModel.value = savedModel;
            this.elements.llmModel.classList.remove('hidden');
            this.elements.llmModelCustom.classList.add('hidden');
            this.elements.llmModelHelp.textContent = `已選擇: ${savedModel}`;
            found = true;
            break;
          }
        }

        if (!found) {
          // 模型不在列表中，使用自定義輸入框顯示
          this.elements.llmModel.classList.add('hidden');
          this.elements.llmModelCustom.classList.remove('hidden');
          this.elements.llmModelCustom.value = savedModel;
          this.elements.llmModelHelp.textContent = `當前模型: ${savedModel}`;
        }
      } else {
        // 沒有保存的模型，確保下拉框可見
        this.elements.llmModel.classList.remove('hidden');
        this.elements.llmModelCustom.classList.add('hidden');
        this.elements.llmModel.value = '';
      }
    }

    // 載入快捷鍵設置
    this.loadShortcutSetting();

    // 切換 API Key 輸入框顯示
    this.toggleApiKeyInput();
  }

  toggleApiKeyInput() {
    const provider = this.elements.apiProvider.value;

    // 隐藏所有 API Key 输入框
    this.elements.microsoftApiKeyGroup?.classList.add('hidden');
    this.elements.glmApiKeyGroup?.classList.add('hidden');
    this.elements.customApiKeyGroup?.classList.add('hidden');

    // LLM 自定義配置顯示/隱藏（custom 和 offline 需要）
    if (provider === 'custom' || provider === 'offline') {
      this.elements.llmCustomConfig.classList.remove('hidden');
      // 启用 LLM 相关输入框
      this.elements.llmBaseUrl?.removeAttribute('disabled');
      this.elements.llmModel?.removeAttribute('disabled');
      this.elements.llmModelCustom?.removeAttribute('disabled');
      this.elements.fetchModels?.removeAttribute('disabled');
    } else {
      this.elements.llmCustomConfig.classList.add('hidden');
      // 禁用 LLM 相关输入框
      this.elements.llmBaseUrl?.setAttribute('disabled', 'true');
      this.elements.llmModel?.setAttribute('disabled', 'true');
      this.elements.llmModelCustom?.setAttribute('disabled', 'true');
      this.elements.fetchModels?.setAttribute('disabled', 'true');
    }

    // 根据 provider 显示对应的 API Key 输入框
    switch (provider) {
      case 'microsoft':
        this.elements.microsoftApiKeyGroup?.classList.remove('hidden');
        break;
      case 'glm':
        this.elements.glmApiKeyGroup?.classList.remove('hidden');
        break;
      case 'custom':
      case 'offline':
        this.elements.customApiKeyGroup?.classList.remove('hidden');
        break;
    }
  }

  async quickSaveBasicSettings() {
    try {
      const basicSettings = {
        targetLanguage: this.elements.targetLanguage.value,
        ocrLanguage: this.elements.ocrLanguage.value,
        quickPanelEnabled: this.elements.quickPanelEnabled.checked,
        hoverTranslationEnabled: this.elements.hoverTranslationEnabled.checked
      };

      // 顯示保存中狀態
      const saveBtn = this.elements.quickSave;
      const originalText = saveBtn.querySelector('.btn-text').textContent;
      saveBtn.querySelector('.btn-text').textContent = '保存中...';
      saveBtn.disabled = true;

      chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: basicSettings
      }, (response) => {
        if (response && response.success) {
          // 更新本地設置
          this.settings = { ...this.settings, ...basicSettings };

          // 顯示成功狀態
          saveBtn.classList.add('saved');
          saveBtn.querySelector('.btn-text').textContent = '已保存';
          this.showStatus('基本設置已保存', 'success');

          // 恢復按鈕狀態
          setTimeout(() => {
            saveBtn.classList.remove('saved');
            saveBtn.querySelector('.btn-text').textContent = originalText;
            saveBtn.disabled = false;
            this.hideUnsavedChanges();
          }, 1500);
        } else {
          this.showStatus('保存失敗', 'error');
          saveBtn.querySelector('.btn-text').textContent = originalText;
          saveBtn.disabled = false;
        }
      });
    } catch (error) {
      console.error('Failed to save basic settings:', error);
      this.showStatus('保存失敗: ' + error.message, 'error');
    }
  }

  showUnsavedChanges() {
    const saveBtn = this.elements.quickSave;
    if (!saveBtn.classList.contains('saved')) {
      saveBtn.style.animation = 'pulse 1s ease-in-out';
      setTimeout(() => {
        saveBtn.style.animation = '';
      }, 1000);
    }
  }

  hideUnsavedChanges() {
    const saveBtn = this.elements.quickSave;
    saveBtn.style.animation = '';
  }

  async saveSettings() {
    try {
      const provider = this.elements.apiProvider.value;

      // 驗證 LLM 自定義配置（如果選擇了 custom）
      if (provider === 'custom') {
        const baseUrl = this.elements.llmBaseUrl.value.trim();
        const isCustomInputVisible = !this.elements.llmModelCustom.classList.contains('hidden');
        const modelFromDropdown = this.elements.llmModel.value;
        const modelFromCustomInput = this.elements.llmModelCustom.value.trim();
        const finalModel = isCustomInputVisible ? modelFromCustomInput : modelFromDropdown;

        if (!baseUrl) {
          this.showStatus('請填寫 Base URL', 'error');
          return;
        }
        if (!finalModel || finalModel === '__custom__') {
          this.showStatus('請選擇或輸入模型名稱', 'error');
          return;
        }
      }

      // 顯示保存中狀態
      const saveBtn = this.elements.saveSettings;
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '保存中...';
      saveBtn.disabled = true;

      // 收集各 provider 的 API Key
      const apiKeys = {
        ...this.settings.apiKeys,
        microsoft: this.elements.microsoftApiKey?.value.trim() || '',
        glm: this.elements.glmApiKey?.value.trim() || '',
        custom: this.elements.customApiKey?.value.trim() || ''
      };

      const settings = {
        targetLanguage: this.elements.targetLanguage.value,
        ocrLanguage: this.elements.ocrLanguage.value,
        apiProvider: provider,
        autoCopy: this.elements.autoCopy.checked,
        quickPanelEnabled: this.elements.quickPanelEnabled.checked,
        hoverTranslationEnabled: this.elements.hoverTranslationEnabled.checked,
        multiEngineEnabled: this.elements.multiEngineEnabled.checked,
        minSelectionLength: parseInt(this.elements.minSelectionLength.value) || 2,
        apiKeys: apiKeys,
        llmConfig: provider === 'custom' ? {
          baseUrl: this.elements.llmBaseUrl.value.trim(),
          model: (() => {
            const isCustomInputVisible = !this.elements.llmModelCustom.classList.contains('hidden');
            const dropdownValue = this.elements.llmModel.value;
            const customValue = this.elements.llmModelCustom.value.trim();

            // 如果自定義輸入框可見，使用自定義輸入的值
            // 否則使用下拉框的值（但排除 __custom__ 選項）
            let finalModel = isCustomInputVisible ? customValue : dropdownValue;

            // 確保不會保存 __custom__ 這個佔位符
            if (finalModel === '__custom__') {
              finalModel = customValue || '';
            }

            console.log('Popup: Saving LLM model config:', {
              isCustomInputVisible,
              dropdownValue,
              customValue,
              finalModel
            });

            return finalModel;
          })()
        } : this.settings.llmConfig
      };

      chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: settings
      }, (response) => {
        if (response && response.success) {
          this.settings = { ...this.settings, ...settings };

          // 顯示成功狀態
          saveBtn.textContent = '已保存';
          saveBtn.style.background = 'linear-gradient(135deg, #34a853, #34a853)';
          this.showStatus('高級設置已保存', 'success');

          // 更新主界面的設置顯示
          this.updateUI();

          setTimeout(() => {
            this.hideSettingsModal();
            // 恢復按鈕狀態
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
            saveBtn.disabled = false;
          }, 1000);
        } else {
          this.showStatus('保存失敗', 'error');
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
        }
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('保存失敗: ' + error.message, 'error');

      // 恢復按鈕狀態
      const saveBtn = this.elements.saveSettings;
      saveBtn.textContent = '保存設置';
      saveBtn.disabled = false;
    }
  }

  resetSettings() {
    if (confirm(i18n.t('status.resetConfirm'))) {
      const defaultSettings = {
        targetLanguage: 'zh-TW',
        ocrLanguage: 'eng',
        apiProvider: 'google',
        autoCopy: false,
        quickPanelEnabled: true,
        hoverTranslationEnabled: false,
        multiEngineEnabled: false,
        minSelectionLength: 2,
        apiKeys: {},
        llmConfig: {
          baseUrl: '',
          model: ''
        }
      };

      chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: defaultSettings
      }, (response) => {
        if (response && response.success) {
          this.settings = defaultSettings;
          this.updateUI();
          this.showStatus(i18n.t('status.reset'), 'success');
        } else {
          this.showStatus('重置失敗', 'error');
        }
      });
    }
  }

  showSettingsModal() {
    this.elements.settingsModal.classList.remove('hidden');
    this.loadHistorySection();
    this.loadWordsSection();
  }

  showModulesModal() {
    this.elements.modulesModal.classList.remove('hidden');
    this.loadModulesSection();
  }

  hideModulesModal() {
    this.elements.modulesModal.classList.add('hidden');
    this.loadSettings(); // 重新加載設置，同步開關狀態
  }

  loadHistorySection() {
    chrome.runtime.sendMessage({ action: 'getTranslationHistory' }, (response) => {
      if (response && response.success) {
        const history = response.data || [];
        this.elements.historyCount.textContent = `${history.length}/500`;

        if (history.length === 0) {
          this.elements.historyList.innerHTML = `<div class="inline-list-empty">${i18n.t('float.history.empty')}</div>`;
        } else {
          this.elements.historyList.innerHTML = history.map(item =>
            `<div class="inline-list-item">
              <div class="inline-item-text">
                <div class="inline-item-original">${this.escapeHtml(item.original)}</div>
                <div class="inline-item-translation">${this.escapeHtml(item.translation)}</div>
              </div>
              <div class="inline-item-time">${new Date(item.timestamp).toLocaleString()}</div>
            </div>`
          ).join('');
        }
      }
    });
  }

  loadWordsSection() {
    chrome.runtime.sendMessage({ action: 'getSavedWords' }, (response) => {
      if (response && response.success) {
        const words = response.data || [];
        this.elements.wordsCount.textContent = `${words.length}/500`;

        if (words.length === 0) {
          this.elements.wordsList.innerHTML = `<div class="inline-list-empty">${i18n.t('float.words.empty')}</div>`;
        } else {
          this.elements.wordsList.innerHTML = words.map(item =>
            `<div class="inline-list-item">
              <div class="inline-item-text">
                <div class="inline-item-original">${this.escapeHtml(item.original)}</div>
                <div class="inline-item-translation">${this.escapeHtml(item.translation)}</div>
              </div>
              <button class="inline-delete-btn" data-id="${item.id}">${i18n.t('float.btn.delete')}</button>
            </div>`
          ).join('');
        }
      }
    });
  }

  toggleInlineSection(bodyEl) {
    bodyEl.classList.toggle('expanded');
  }

  loadModulesSection() {
    chrome.runtime.sendMessage({ action: 'getModules' }, (response) => {
      if (response && response.success) {
        const modules = response.modules || [];
        const activeCount = modules.filter(m => m.active).length;
        if (modules.length === 0) {
          this.elements.modulesListFull.innerHTML = `<div class="inline-list-empty">${i18n.t('module.empty')}</div>`;
        } else {
          // 按類型分組
          const typeOrder = ['translator', 'mode', 'renderer', 'processor', 'service', 'theme'];
          const typeNames = {
            translator: i18n.t('module.type.translator'),
            mode: i18n.t('module.type.mode'),
            renderer: i18n.t('module.type.renderer'),
            processor: i18n.t('module.type.processor'),
            service: i18n.t('module.type.service'),
            theme: i18n.t('module.type.theme')
          };
          const groups = {};
          for (const m of modules) {
            const t = m.manifest.type || 'other';
            if (!groups[t]) groups[t] = [];
            groups[t].push(m);
          }

          let html = '';
          for (const type of typeOrder) {
            const list = groups[type];
            if (!list || list.length === 0) continue;
            html += `<div class="module-group-label">${typeNames[type] || type} (${list.length})</div>`;
            html += list.map(m => {
              return `<div class="inline-list-item">
                <label class="module-toggle-label">
                  <input type="checkbox" class="module-toggle-input" data-id="${m.id}" ${m.active ? 'checked' : ''}>
                  <span class="module-toggle-slider"></span>
                </label>
                <div class="inline-item-text">
                  <div class="inline-item-original">${this.escapeHtml(this._moduleDisplayName(m))}</div>
                  <div class="inline-item-translation module-meta">v${m.manifest.version}</div>
                </div>
                <button class="module-settings-btn" data-module="${m.id}" title="設置">⚙️</button>
              </div>`;
            }).join('');
          }

          this.elements.modulesListFull.innerHTML = html;
        }
      }
    });
  }

  showModuleSettings(moduleId) {
    chrome.runtime.sendMessage({ action: 'getModules' }, (response) => {
      if (!response?.success) return;
      const allModules = response.modules || [];
      const mod = allModules.find(m => m.id === moduleId);
      if (!mod) return;

      const options = mod.manifest.options;
      if (!options || options.length === 0) {
        this.showStatus('此模塊無需配置', 'info');
        return;
      }

      const settingsKey = 'moduleSettings.' + moduleId;
      const settingsView = document.getElementById('module-settings-view');

      chrome.storage.local.get([settingsKey], (result) => {
        const currentSettings = result[settingsKey] || {};

        const fields = options.map(opt => {
          const val = currentSettings[opt.key] ?? opt.default ?? '';
          let input = '';
          switch (opt.type) {
            case 'password':
              input = `<input type="password" class="setting-input" data-key="${opt.key}" value="${this.escapeHtml(String(val))}" placeholder="${opt.placeholder || ''}">`;
              break;
            case 'number':
              input = `<input type="number" class="setting-input" data-key="${opt.key}" value="${val}">`;
              break;
            case 'select':
              input = `<select class="setting-select" data-key="${opt.key}">` +
                (opt.options || []).map(o =>
                  `<option value="${o.value}" ${o.value === val ? 'selected' : ''}>${o.label}</option>`
                ).join('') + `</select>`;
              break;
            default:
              input = `<input type="text" class="setting-input" data-key="${opt.key}" value="${this.escapeHtml(String(val))}" placeholder="${opt.placeholder || ''}">`;
          }
          return `<div class="setting-group">
            <label>${opt.label}</label>
            ${input}
          </div>`;
        }).join('');

        // Custom LLM 特殊處理：在 model 欄位後加「獲取可用模型」按鈕
        let extraHtml = '';
        if (moduleId === 'engine-custom') {
          extraHtml = `<div style="margin-bottom:12px">
            <button id="settings-fetch-models" style="width:100%;padding:8px;border:2px solid #e9ecef;border-radius:8px;background:white;color:#667eea;font-weight:700;cursor:pointer;font-size:11px">🔄 獲取可用模型</button>
          </div>`;
        }

        // 從 getModules 響應中提取統計資料
        const engineName = moduleId.replace('engine-', '');
        const statsData = response.stats || {};
        const myStats = statsData[engineName] || statsData[moduleId];
        const statsHtml = (myStats && myStats.calls > 0)
          ? `<div class="module-stats-display" style="margin:8px 14px 0;padding:8px 14px;background:#f8f9fa;border-radius:8px;display:flex;gap:16px;font-size:10px;color:#6c757d">
              <span>📊 ${myStats.calls} 次</span>
              <span>✅ ${myStats.calls > 0 ? Math.round(myStats.successes/myStats.calls*100) : 0}%</span>
              <span>📝 ${myStats.chars} 字</span>
            </div>`
          : '';

        const deleteHtml = mod.builtin ? '' : `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e9ecef">
            <button class="module-delete-btn" data-id="${moduleId}" style="width:100%;padding:8px 0;border:1px solid #fecaca;border-radius:8px;background:#fff;color:#dc2626;font-weight:700;cursor:pointer;font-size:11px">刪除此模塊</button>
          </div>`;

        settingsView.innerHTML = `
          <div style="border-bottom:1px solid #e9ecef;">
            <button class="settings-back-btn" style="background:none;border:none;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:700;color:#495057;width:100%;text-align:left">← ${this._moduleDisplayName(mod)} 設置</button>
          </div>
          <div style="padding:14px">
            <form class="module-settings-form">${extraHtml}${fields}</form>
            <button class="module-settings-save" style="width:100%;padding:10px 0;border:none;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:700;cursor:pointer;font-size:12px;margin-top:8px">保存</button>
            ${statsHtml}
            ${deleteHtml}
          </div>`;

        // 切換視圖
        this.elements.modulesListFull.classList.add('hidden');
        settingsView.classList.remove('hidden');

        // 綁定：頭部返回按鈕
        const backBtn = settingsView.querySelector('.settings-back-btn');
        backBtn.onclick = () => {
          settingsView.classList.add('hidden');
          this.elements.modulesListFull.classList.remove('hidden');
          this.loadModulesSection();
        };

        // 綁定：保存按鈕（含反饋動畫）
        const saveBtn = settingsView.querySelector('.module-settings-save');
        saveBtn.onclick = () => {
          const inputs = settingsView.querySelectorAll('[data-key]');
          const settings = {};
          inputs.forEach(inp => { settings[inp.dataset.key] = inp.value; });
          // 同步到舊的 apiKeys/llmConfig 路徑（模塊實際讀取這些）
          const extraSave = {};
          if (moduleId === 'engine-custom') {
            extraSave.apiKeys = extraSave.apiKeys || {};
            extraSave.apiKeys.custom = settings.apiKey || '';
            extraSave.llmConfig = {
              baseUrl: settings.baseUrl || '',
              model: settings.model || settings['model-custom'] || ''
            };
          }
          if (moduleId === 'engine-microsoft') {
            extraSave.apiKeys = extraSave.apiKeys || {};
            extraSave.apiKeys.microsoft = settings.apiKey || '';
          }
          if (moduleId === 'engine-glm') {
            extraSave.apiKeys = extraSave.apiKeys || {};
            extraSave.apiKeys.glm = settings.apiKey || '';
          }
          // 按鈕反饋：綠色閃爍後返回
          const origBg = saveBtn.style.background;
          saveBtn.textContent = '✓ 已保存';
          saveBtn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
          saveBtn.disabled = true;
          chrome.storage.local.set({ [settingsKey]: settings, ...extraSave }, () => {
            setTimeout(() => { backBtn.click(); }, 600);
          });
        };

        // 綁定：刪除模塊按鈕（僅第三方模塊）
        const delBtn = settingsView.querySelector('.module-delete-btn');
        if (delBtn) {
          delBtn.onclick = () => {
            if (!confirm('確定卸載此模塊？')) return;
            settingsView.classList.add('hidden');
            settingsView.innerHTML = '';
            this.elements.modulesListFull.classList.remove('hidden');
            this.elements.modulesListFull.innerHTML = '';
            chrome.runtime.sendMessage({ action: 'uninstallModule', moduleId }, () => {
              this.loadModulesSection();
            });
          };
        }

        // 綁定：Custom LLM 獲取模型按鈕
        const fetchBtn = document.getElementById('settings-fetch-models');
        if (fetchBtn) {
          fetchBtn.onclick = async () => {
            const apiKey = settingsView.querySelector('[data-key="apiKey"]')?.value?.trim();
            const baseUrl = settingsView.querySelector('[data-key="baseUrl"]')?.value?.trim();
            if (!apiKey || !baseUrl) {
              this.showStatus('請先填寫 API Key 和 Base URL', 'error');
              return;
            }
            fetchBtn.textContent = '載入中...';
            fetchBtn.disabled = true;
            try {
              const resp = await chrome.runtime.sendMessage({
                action: 'getModels', apiKey, baseUrl
              });
              if (resp?.success && resp.models?.length > 0) {
                // 把 model 文字輸入框替換為下拉選單
                const modelGroup = settingsView.querySelector('[data-key="model"]')?.closest('.setting-group');
                if (modelGroup) {
                  const currentVal = settingsView.querySelector('[data-key="model"]')?.value || '';
                  const opts = resp.models.map(m =>
                    `<option value="${m}" ${m === currentVal ? 'selected' : ''}>${m}</option>`
                  ).join('');
                  modelGroup.innerHTML = `<label>模型名稱</label>
                    <select class="setting-select" data-key="model">${opts}
                      <option value="__custom__" ${!resp.models.includes(currentVal) && currentVal ? 'selected' : ''}>-- 或輸入自定義模型 --</option>
                    </select>
                    <input type="text" class="setting-input" data-key="model-custom" placeholder="輸入自定義模型名稱" style="display:none;margin-top:6px">`;

                  // 切換自定義/下拉
                  const select = modelGroup.querySelector('[data-key="model"]');
                  const customInput = modelGroup.querySelector('[data-key="model-custom"]');
                  select.onchange = () => {
                    if (select.value === '__custom__') {
                      select.style.display = 'none';
                      customInput.style.display = 'block';
                      customInput.focus();
                    }
                  };
                  // 如果當前值是自定義的，自動顯示輸入框
                  if (select.value === '__custom__' && currentVal) {
                    select.style.display = 'none';
                    customInput.style.display = 'block';
                    customInput.value = currentVal;
                  }
                }
                // 保存時合併自定義模型值 + 同步到舊路徑
                saveBtn.onclick = () => {
                  const inputs = settingsView.querySelectorAll('[data-key]');
                  const settings = {};
                  inputs.forEach(inp => {
                    const key = inp.dataset.key;
                    if (key === 'model-custom') return;
                    if (key === 'model' && inp.tagName === 'SELECT') {
                      settings.model = inp.value === '__custom__'
                        ? (settingsView.querySelector('[data-key="model-custom"]')?.value || '')
                        : inp.value;
                      return;
                    }
                    settings[key] = inp.value;
                  });
                  const extraSave = {
                    apiKeys: { custom: settings.apiKey || '' },
                    llmConfig: { baseUrl: settings.baseUrl || '', model: settings.model || '' }
                  };
                  saveBtn.textContent = '✓ 已保存';
                  saveBtn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
                  saveBtn.disabled = true;
                  chrome.storage.local.set({ [settingsKey]: settings, ...extraSave }, () => {
                    setTimeout(() => { backBtn.click(); }, 600);
                  });
                };
                this.showStatus(`已載入 ${resp.models.length} 個模型`, 'success');
              } else {
                this.showStatus(resp?.error || '未找到可用模型', 'error');
              }
            } catch (err) {
              this.showStatus('獲取失敗: ' + err.message, 'error');
            }
            fetchBtn.textContent = '🔄 獲取可用模型';
            fetchBtn.disabled = false;
          };
        }
      });
    });
  }

  importModule() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.qt-module,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const code = event.target.result;

          // 提取 manifest（括號計數法，支援巢狀物件）
          const manifestRaw = this._extractManifest(code);
          if (!manifestRaw) {
            this.showStatus('無效的模塊文件：找不到 manifest', 'error');
            return;
          }

          // 轉為 JSON
          let manifestStr = manifestRaw
            .replace(/\/\/.*/g, ' ')
            .replace(/'/g, '"')
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
            .replace(/,\s*}/g, '}')
            .replace(/: undefined|: null/g, ': ""')
            .replace(/undefined|null/g, '""');

          // 驗證
          const manifest = JSON.parse(manifestStr);
          const required = ['id', 'name', 'version', 'author', 'type', 'description', 'minAppVersion'];
          const missing = required.filter(f => !manifest[f]);
          if (missing.length > 0) {
            this.showStatus(`manifest 缺少欄位: ${missing.join(', ')}`, 'error');
            return;
          }

          if (!confirm(`安裝模塊「${manifest.name}」v${manifest.version}？\n作者: ${manifest.author}\n類型: ${manifest.type}`)) return;

          chrome.runtime.sendMessage({
            action: 'installModule',
            moduleId: manifest.id,
            code,
            manifest
          }, (resp) => {
            if (resp && resp.success) {
              this.showStatus(`模塊「${manifest.name}」已安裝`, 'success');
              this.loadModulesSection();
            } else {
              this.showStatus('安裝失敗: ' + (resp?.error || '未知錯誤'), 'error');
            }
          });
        } catch (err) {
          this.showStatus('文件解析失敗: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  exportData() {
    chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
      if (response && response.success) {
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quicktranslate-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showStatus('導出成功', 'success');
      } else {
        this.showStatus('導出失敗', 'error');
      }
    });
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          chrome.runtime.sendMessage({ action: 'importData', data }, (response) => {
            if (response && response.success) {
              this.showStatus('導入成功', 'success');
            } else {
              this.showStatus('導入失敗: ' + (response?.error || '未知錯誤'), 'error');
            }
          });
        } catch (err) {
          this.showStatus('文件格式錯誤', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  showModal(title, content) {
    // 移除已存在的模态框
    const existing = document.querySelector('.float-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'float-modal';
    modal.innerHTML = `
      <div class="float-modal-content">
        <div class="float-modal-header">
          <span>${title}</span>
          <button class="float-modal-close">×</button>
        </div>
        <div class="float-modal-body">${content}</div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.float-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 模塊顯示名稱：優先 i18n，否則用 manifest.name
  _moduleDisplayName(module) {
    const i18nKey = 'module.name.' + module.id
    const translated = i18n.t(i18nKey)
    if (translated !== i18nKey) return translated
    return module.manifest.name
  }

  // 從模塊源碼中提取 manifest 物件（括號計數，支援巢狀）
  _extractManifest(code) {
    const match = code.match(/static\s+manifest\s*=\s*/)
    if (!match) return null
    const start = match.index + match[0].length
    let depth = 0, started = false, end = start
    for (let i = start; i < code.length; i++) {
      const ch = code[i]
      if (ch === '{') { depth++; started = true }
      else if (ch === '}') { depth-- }
      if (started && depth === 0) { end = i + 1; break }
    }
    if (!started) return null
    return code.substring(start, end)
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  hideSettingsModal() {
    this.elements.settingsModal.classList.add('hidden');
  }

  showStatus(message, type = 'info') {
    const statusEl = this.elements.statusMessage;
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    // 自動隱藏
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  async startShortcutRecording() {
    const input = this.elements.shortcutKey;
    const button = this.elements.changeShortcut;

    // 設置錄製狀態
    input.value = '按下新的快捷鍵...';
    input.focus();
    button.classList.add('shortcut-recording');
    button.textContent = '錄製中';

    // 監聽按鍵
    const handleKeyDown = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Cmd');

      // 添加主鍵
      if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        keys.push(e.key.toUpperCase());
      }

      if (keys.length >= 2) {
        const shortcut = keys.join('+');
        await this.saveShortcut(shortcut);
        this.endShortcutRecording();
      }

      // 移除監聽器
      document.removeEventListener('keydown', handleKeyDown, true);
    };

    // 添加監聽器
    document.addEventListener('keydown', handleKeyDown, true);

    // 10秒後自動取消
    setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown, true);
      this.endShortcutRecording();
    }, 10000);
  }

  endShortcutRecording() {
    const input = this.elements.shortcutKey;
    const button = this.elements.changeShortcut;

    button.classList.remove('shortcut-recording');
    button.textContent = '修改';

    // 恢復原來的快捷鍵顯示
    this.loadShortcutSetting();
  }

  async saveShortcut(shortcut) {
    try {
      // 保存到本地存儲
      await chrome.storage.local.set({ shortcutKey: shortcut });

      this.elements.shortcutKey.value = shortcut;
      this.showStatus(`快捷鍵已設置為: ${shortcut}`, 'success');

      // 注意：Chrome擴展的快捷鍵需要用戶在chrome://extensions/shortcuts手動設置
      this.showStatus('請在 chrome://extensions/shortcuts 中確認快捷鍵設置', 'info');

    } catch (error) {
      console.error('Failed to save shortcut:', error);
      this.showStatus('快捷鍵保存失敗', 'error');
    }
  }

  async loadShortcutSetting() {
    try {
      // 從 chrome.commands 讀取實際快捷鍵（用户在 chrome://extensions/shortcuts 設的）
      const commands = await chrome.commands.getAll();
      const smartTranslate = commands.find(cmd => cmd.name === 'smart-translate');
      const shortcut = smartTranslate?.shortcut || 'Alt+1';
      this.elements.shortcutKey.value = shortcut;

      // 同步保存到 storage，方便其他邏輯讀取
      await chrome.storage.local.set({ shortcutKey: shortcut });
    } catch (error) {
      console.error('Failed to load shortcut setting:', error);
      this.elements.shortcutKey.value = 'Alt+1';
    }
  }

  openShortcutSettings() {
    // 打開Chrome擴展快捷鍵設置頁面
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts'
    });
  }
}

// 初始化 Popup 控制器
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});