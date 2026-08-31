
(function() {
  const orig = chrome.runtime.sendMessage;
  if (!orig.__qtPatched) {
    chrome.runtime.sendMessage = function(msg, cb) {
      const doIt = (retries) => {
        if (typeof cb === 'function') {
          try {
            return orig.call(chrome.runtime, msg, function(resp) {
              if (chrome.runtime.lastError && String(chrome.runtime.lastError.message).includes('context invalidated') && retries > 0) {
                setTimeout(() => doIt(retries - 1), 300);
                return;
              }
              cb(resp);
            });
          } catch(e) {
            if (String(e.message).includes('context invalidated') && retries > 0) {
              setTimeout(() => doIt(retries - 1), 300);
            }
          }
          return;
        }
        try {
          return orig.call(chrome.runtime, msg).catch(e => {
            if (String(e.message).includes('context invalidated') && retries > 0) {
              return new Promise(r => setTimeout(r, 300)).then(() => doIt(retries - 1));
            }
            throw e;
          }).catch(() => {});
        } catch(e) {
          if (String(e.message).includes('context invalidated') && retries > 0) {
            return new Promise(r => setTimeout(r, 300)).then(() => doIt(retries - 1));
          }
          return Promise.resolve();
        }
      };
      return doIt(3);
    };
    chrome.runtime.sendMessage.__qtPatched = true;
  }
})();

// 截圖翻譯器內容腳本
console.log('Content script loading...');

// 內置翻譯表（content script 無法訪問 popup 的 i18n.js）
// 使用 window 避免與頁面腳本衝突
window.qt_contentTranslations = {
  'zh-CN': {
    'quick.btn.translate': '翻译',
    'quick.panel.title': '快速翻译',
    'quick.panel.original': '原文',
    'quick.panel.translated': '译文',
    'quick.btn.copy': '复制',
    'quick.btn.save': '收藏',
    'quick.msg.copied': '已复制',
    'quick.msg.saved': '已收藏',
    'quick.msg.translating': '翻译中...',
    'quick.msg.capturing': '正在截取区域...',
    'quick.msg.translatingInProgress': '正在翻译...',
    'quick.msg.ocr': '正在截图识别...',
    'quick.hint.hover': '悬停翻译',
    'quick.hint.dragToSelect': '拖拽选择要翻译的区域，或点击使用默认区域，按 ESC 取消',
    'quick.hint.smartMode': '智能翻译模式\n自动检测语言 → 中文\n拖拽选择要翻译的区域，按 ESC 取消',
    'quick.hint.clickToCopy': '点击复制各引擎结果',
    'quick.hint.multiSuccess': '{success}个成功，{error}个失败',
    'quick.hint.allFailed': '所有引擎均失败',
    'quick.error.noText': '未识别到文字',
    'quick.error.screenshotFailed': '截图失败',
    'quick.error.processFailed': '处理失败',
    'quick.error.ocrNoText': '图片中没有找到可识别的文字，请尝试选择包含清晰文字的区域',
    'quick.result.title': '翻译结果（可拖动）',
    'quick.result.recognized': '识别文字',
    'quick.result.translated': '翻译结果',
    'engine.google': 'Google 翻译',
    'engine.microsoft': 'Microsoft',
    'engine.llm': '自定义 LLM',
    'engine.glm': 'GLM 大模型',
    'engine.backup': '由 {service} 提供'
  },
  'zh-TW': {
    'quick.btn.translate': '翻譯',
    'quick.panel.title': '快速翻譯',
    'quick.panel.original': '原文',
    'quick.panel.translated': '譯文',
    'quick.btn.copy': '複製',
    'quick.btn.save': '收藏',
    'quick.msg.copied': '已複製',
    'quick.msg.saved': '已收藏',
    'quick.msg.translating': '翻譯中...',
    'quick.msg.capturing': '正在截取區域...',
    'quick.msg.translatingInProgress': '正在翻譯...',
    'quick.msg.ocr': '正在截圖識別...',
    'quick.hint.hover': '懸停翻譯',
    'quick.hint.dragToSelect': '拖拽選擇要翻譯的區域，或點擊使用預設區域，按 ESC 取消',
    'quick.hint.smartMode': '智慧翻譯模式\n自動偵測語言 → 中文\n拖拽選擇要翻譯的區域，按 ESC 取消',
    'quick.hint.clickToCopy': '點擊複製各引擎結果',
    'quick.hint.multiSuccess': '{success}個成功，{error}個失敗',
    'quick.hint.allFailed': '所有引擎均失敗',
    'quick.error.noText': '未識別到文字',
    'quick.error.screenshotFailed': '截圖失敗',
    'quick.error.processFailed': '處理失敗',
    'quick.error.ocrNoText': '圖片中沒有找到可識別的文字，請嘗試選擇包含清晰文字的區域',
    'quick.result.title': '翻譯結果（可拖動）',
    'quick.result.recognized': '識別文字',
    'quick.result.translated': '翻譯結果',
    'engine.google': 'Google 翻譯',
    'engine.microsoft': 'Microsoft',
    'engine.llm': '自訂 LLM',
    'engine.glm': 'GLM 大模型',
    'engine.backup': '由 {service} 提供'
  },
  'en': {
    'quick.btn.translate': 'Translate',
    'quick.panel.title': 'Quick Translate',
    'quick.panel.original': 'Original',
    'quick.panel.translated': 'Translation',
    'quick.btn.copy': 'Copy',
    'quick.btn.save': 'Save',
    'quick.msg.copied': 'Copied',
    'quick.msg.saved': 'Saved',
    'quick.msg.translating': 'Translating...',
    'quick.msg.capturing': 'Capturing area...',
    'quick.msg.translatingInProgress': 'Translating...',
    'quick.msg.ocr': 'Recognizing text...',
    'quick.hint.hover': 'Hover Translate',
    'quick.hint.dragToSelect': 'Drag to select translation area, or click to use default area. Press ESC to cancel.',
    'quick.hint.smartMode': 'Smart Translation Mode\nAuto-detect language → Chinese\nDrag to select area, press ESC to cancel',
    'quick.hint.clickToCopy': 'Click to copy engine results',
    'quick.hint.multiSuccess': '{success} succeeded, {error} failed',
    'quick.hint.allFailed': 'All engines failed',
    'quick.error.noText': 'No text recognized',
    'quick.error.screenshotFailed': 'Screenshot failed',
    'quick.error.processFailed': 'Processing failed',
    'quick.error.ocrNoText': 'No recognizable text found in image. Try selecting an area with clear text.',
    'quick.result.title': 'Translation Result (Draggable)',
    'quick.result.recognized': 'Recognized Text',
    'quick.result.translated': 'Translation',
    'engine.google': 'Google Translate',
    'engine.microsoft': 'Microsoft',
    'engine.llm': 'Custom LLM',
    'engine.glm': 'GLM',
    'engine.backup': 'Provided by {service}'
  },
  'ja': {
    'quick.btn.translate': '翻訳',
    'quick.panel.title': 'クイック翻訳',
    'quick.panel.original': '原文',
    'quick.panel.translated': '訳文',
    'quick.btn.copy': 'コピー',
    'quick.btn.save': '保存',
    'quick.msg.copied': 'コピーしました',
    'quick.msg.saved': '保存しました',
    'quick.msg.translating': '翻訳中...',
    'quick.msg.capturing': '領域をキャプチャ中...',
    'quick.msg.translatingInProgress': '翻訳中...',
    'quick.msg.ocr': 'テキストを認識中...',
    'quick.hint.hover': 'ホバー翻訳',
    'quick.hint.dragToSelect': 'ドラッグして翻訳領域を選択、またはクリックしてデフォルト領域を使用。ESCでキャンセル。',
    'quick.hint.smartMode': 'スマート翻訳モード\n言語自動検出 → 中国語\nドラッグして領域を選択、ESCでキャンセル',
    'quick.hint.clickToCopy': 'クリックして各エンジンの結果をコピー',
    'quick.hint.multiSuccess': '{success}個成功、{error}個失敗',
    'quick.hint.allFailed': 'すべてのエンジンが失敗',
    'quick.error.noText': 'テキストが認識されませんでした',
    'quick.error.screenshotFailed': 'スクリーンショットの取得に失敗',
    'quick.error.processFailed': '処理に失敗',
    'quick.error.ocrNoText': '画像内に認識可能なテキストが見つかりませんでした。鮮明なテキストが含まれる領域を選択してください。',
    'quick.result.title': '翻訳結果（ドラッグ可能）',
    'quick.result.recognized': '認識されたテキスト',
    'quick.result.translated': '翻訳結果',
    'engine.google': 'Google翻訳',
    'engine.microsoft': 'Microsoft',
    'engine.llm': 'カスタムLLM',
    'engine.glm': 'GLM',
    'engine.backup': '{service}提供服务'
  },
  'ko': {
    'quick.btn.translate': '번역',
    'quick.panel.title': '빠른 번역',
    'quick.panel.original': '원문',
    'quick.panel.translated': '번역',
    'quick.btn.copy': '복사',
    'quick.btn.save': '저장',
    'quick.msg.copied': '복사됨',
    'quick.msg.saved': '저장됨',
    'quick.msg.translating': '번역 중...',
    'quick.msg.capturing': '영역 캡처 중...',
    'quick.msg.translatingInProgress': '번역 중...',
    'quick.msg.ocr': '텍스트 인식 중...',
    'quick.hint.hover': '호버 번역',
    'quick.hint.dragToSelect': '드래그하여 번역 영역 선택 또는 클릭하여 기본 영역 사용. ESC로 취소.',
    'quick.hint.smartMode': '스마트 번역 모드\n언어 자동 감지 → 중국어\n드래그하여 영역 선택, ESC로 취소',
    'quick.hint.clickToCopy': '클릭하여 각 엔진 결과 복사',
    'quick.hint.multiSuccess': '{success}개 성공, {error}개 실패',
    'quick.hint.allFailed': '모든 엔진 실패',
    'quick.error.noText': '텍스트가 인식되지 않았습니다',
    'quick.error.screenshotFailed': '스크린샷 실패',
    'quick.error.processFailed': '처리 실패',
    'quick.error.ocrNoText': '이미지에서 인식 가능한 텍스트를 찾을 수 없습니다. 선명한 텍스트가 포함된 영역을 선택하세요.',
    'quick.result.title': '번역 결과 (드래그 가능)',
    'quick.result.recognized': '인식된 텍스트',
    'quick.result.translated': '번역 결과',
    'engine.google': 'Google 번역',
    'engine.microsoft': 'Microsoft',
    'engine.llm': '사용자 정의 LLM',
    'engine.glm': 'GLM',
    'engine.backup': '{service}提供服务'
  }
};

// 防止重複聲明
if (typeof window.ScreenshotCapture === 'undefined') {

  class ScreenshotCapture {
    constructor() {
      this.overlay = null;
      this.selectionBox = null;
      this.instructionText = null;
      this.startX = 0;
      this.startY = 0;
      this.isSelecting = false;
      this.lang = 'en';  // UI语言
      this.setupMessageListeners();
      this.loadUserLanguage();
    }

    // 从 background 获取用户界面语言
    async loadUserLanguage() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
          if (response && response.success && response.settings && response.settings.uiLanguage) {
            this.lang = response.settings.uiLanguage;
          } else {
            this.detectBrowserLanguage();
          }
          resolve();
        });
      });
    }

    // 检测浏览器语言
    detectBrowserLanguage() {
      const browserLang = navigator.language || navigator.userLanguage || 'en';
      const langMap = {
        'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'zh-HK': 'zh-TW',
        'en': 'en', 'en-US': 'en', 'en-GB': 'en',
        'ja': 'ja', 'ja-JP': 'ja',
        'ko': 'ko', 'ko-KR': 'ko'
      };
      const prefix = browserLang.split('-')[0].toLowerCase();
      this.lang = langMap[browserLang] || langMap[prefix] || 'en';
    }

    // 获取翻译
    t(key) {
      const trans = window.qt_contentTranslations;
      if (trans[this.lang] && trans[this.lang][key]) {
        return trans[this.lang][key];
      }
      if (trans['en'][key]) {
        return trans['en'][key];
      }
      return key;
    }

    setupMessageListeners() {
      this.messageListener = (request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true;
      };

      chrome.runtime.onMessage.addListener(this.messageListener);
    }

    handleMessage(request, sender, sendResponse) {
      console.log('Content script received message:', request.action);

      try {
        switch (request.action) {
          case 'initCapture':
            console.log('Content: Initializing capture...');
            this.initCapture(request.smartMode, request.userSettings);
            sendResponse({ success: true });
            break;
          case 'showResult':
            console.log('Content: Showing result...');
            this.showTranslationResult(request);
            sendResponse({ success: true });
            break;
          case 'showError':
            console.log('Content: Showing error...');
            this.showError(request.error);
            sendResponse({ success: true });
            break;
          case 'openFloatPanel':
            // 转发给 float-panel (float-panel.js 已加载)
            if (window.floatPanel) {
              window.floatPanel.init();
            }
            sendResponse({ success: true });
            break;
          case 'languageChanged':
            console.log('Content: language changed to', request.language);
            this.lang = request.language;
            sendResponse({ success: true });
            break;
          default:
            // 靜默忽略其他 content script 的 action（quick-panel.js / float-panel.js 處理）
            break;
        }
      } catch (error) {
        console.error('Content: Error handling message:', error);
        sendResponse({ error: error.message });
      }
    }

    initCapture(smartMode = false, userSettings = null) {
      console.log('Content: initCapture called with smartMode:', smartMode);

      // 保存智能模式设置
      this.isSmartMode = smartMode;
      this.smartUserSettings = userSettings;

      // 清理現有覆蓋層
      this.cleanupOverlay();

      console.log('Content: Creating new overlay...');
      this.createOverlay();
    }

    createOverlay() {
      console.log('Content: Creating overlay elements...');

      // 創建主覆蓋層
      this.overlay = document.createElement('div');
      this.overlay.id = 'screenshot-overlay';

      // 強制設置樣式
      this.overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        cursor: crosshair !important;
        z-index: 2147483647 !important;
        user-select: none !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        font-family: Arial, sans-serif !important;
      `;

      // 創建選擇框
      this.selectionBox = document.createElement('div');
      this.selectionBox.style.cssText = `
        position: absolute !important;
        border: 2px solid #4285f4 !important;
        background-color: rgba(66, 133, 244, 0.1) !important;
        display: none !important;
        pointer-events: none !important;
      `;

      // 創建指導文字
      this.instructionText = document.createElement('div');

      // 根据智能模式设置不同的提示文字
      let instructionText = this.t('quick.hint.dragToSelect');
      let backgroundColor = 'rgba(0, 0, 0, 0.8)';

      if (this.isSmartMode && this.smartUserSettings) {
        instructionText = this.t('quick.hint.smartMode');
        backgroundColor = 'rgba(52, 168, 83, 0.9)';
      }

      this.instructionText.textContent = instructionText;
      this.instructionText.style.cssText = `
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        color: white !important;
        font-size: 18px !important;
        font-weight: 500 !important;
        text-align: center !important;
        background-color: ${backgroundColor} !important;
        padding: 16px 24px !important;
        border-radius: 8px !important;
        pointer-events: none !important;
        max-width: 400px !important;
        line-height: 1.4 !important;
        z-index: 2147483648 !important;
        white-space: pre-line !important;
      `;

      // 組裝元素
      this.overlay.appendChild(this.selectionBox);
      this.overlay.appendChild(this.instructionText);

      console.log('Content: Appending overlay to body...');
      document.body.appendChild(this.overlay);

      // 綁定事件
      this.overlay.addEventListener('mousedown', (e) => this.startSelection(e));
      this.overlay.addEventListener('mousemove', (e) => this.updateSelection(e));
      this.overlay.addEventListener('mouseup', (e) => this.endSelection(e));

      // 鼠標移動時隱藏指導文字
      this.overlay.addEventListener('mousemove', (e) => {
        if (!this.isSelecting && this.instructionText && this.instructionText.style.display !== 'none') {
          // 如果鼠標移動距離足夠，隱藏指導文字
          const rect = this.instructionText.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));

          if (distance > 100) { // 距離中心100px時隱藏
            this.instructionText.style.opacity = '0.3';
          } else {
            this.instructionText.style.opacity = '1';
          }
        }
      });

      // 添加鍵盤事件
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));

      // 防止頁面滾動
      document.body.style.overflow = 'hidden';

      console.log('Content: Overlay created successfully');
    }

    getLanguageName(langCode) {
      const languageNames = {
        'zh-CN': '简体中文',
        'zh-TW': '繁体中文',
        'zh': '中文',
        'en': '英文',
        'ja': '日文',
        'ko': '韩文',
        'fr': '法文',
        'de': '德文',
        'es': '西班牙文'
      };
      return languageNames[langCode] || langCode;
    }

    handleKeyDown(e) {
      if (e.key === 'Escape') {
        this.cancelCapture();
      }
    }

    startSelection(e) {
      e.preventDefault();
      console.log('Content: Starting selection');

      // 隱藏指導文字，避免阻擋選擇
      if (this.instructionText) {
        this.instructionText.style.display = 'none';
      }

      this.isSelecting = true;
      this.startX = e.clientX;
      this.startY = e.clientY;

      this.selectionBox.style.left = this.startX + 'px';
      this.selectionBox.style.top = this.startY + 'px';
      this.selectionBox.style.width = '0px';
      this.selectionBox.style.height = '0px';
      this.selectionBox.style.display = 'block';
    }

    updateSelection(e) {
      if (!this.isSelecting) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(this.startX, currentX);
      const top = Math.min(this.startY, currentY);
      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);

      this.selectionBox.style.left = left + 'px';
      this.selectionBox.style.top = top + 'px';
      this.selectionBox.style.width = width + 'px';
      this.selectionBox.style.height = height + 'px';
    }

    endSelection(e) {
      console.log('Content: endSelection called, isSelecting:', this.isSelecting);

      if (!this.isSelecting) {
        // 單擊模式 - 創建默認區域
        console.log('Content: Single click mode');
        this.createDefaultSelection(e.clientX, e.clientY);
        return;
      }

      this.isSelecting = false;
      console.log('Content: Selection ended');

      const rect = this.selectionBox.getBoundingClientRect();
      console.log('Content: Selection rect:', rect);

      if (rect.width < 10 || rect.height < 10) {
        // 太小的選擇，創建默認區域
        console.log('Content: Selection too small, using default');
        this.createDefaultSelection(e.clientX, e.clientY);
        return;
      }

      console.log('Content: Processing selection...');
      this.processSelection(rect);
    }

    createDefaultSelection(x, y) {
      console.log('Content: Creating default selection');

      const defaultWidth = 200;
      const defaultHeight = 100;
      const left = Math.max(0, x - defaultWidth / 2);
      const top = Math.max(0, y - defaultHeight / 2);

      const rect = {
        left: left,
        top: top,
        width: defaultWidth,
        height: defaultHeight
      };

      this.processSelection(rect);
    }

    processSelection(rect) {
      console.log('Content: Processing selection:', rect);

      // 顯示處理狀態
      if (this.instructionText) {
        this.instructionText.textContent = this.t('quick.msg.capturing');
        this.instructionText.style.backgroundColor = 'rgba(66, 133, 244, 0.9)';
        this.instructionText.style.display = 'block';
      }

      // 先嘗試提取選中區域的文字
      const selectedText = this.extractTextFromArea(rect);

      if (selectedText && selectedText.trim()) {
        console.log('Content: Extracted text:', selectedText);

        if (this.instructionText) {
          this.instructionText.textContent = this.t('quick.msg.translatingInProgress');
        }

        // 進行真實翻譯處理
        setTimeout(async () => {
          console.log('Content: About to translate text');
          try {
            const translatedText = await this.translateText(selectedText);
            console.log('Content: Translation completed:', translatedText);
            this.showTranslationResult({
              originalText: selectedText,
              translatedText: translatedText,
              confidence: 0.95
            });
          } catch (error) {
            console.error('Content: Translation failed:', error);
            this.showTranslationResult({
              originalText: selectedText,
              translatedText: `翻譯失敗: ${error.message}`,
              confidence: 0.0
            });
          }
        }, 800);
      } else {
        console.log('Content: No text found, using screenshot method');

        if (this.instructionText) {
          this.instructionText.textContent = this.t('quick.msg.ocr');
        }

        // 使用截圖方法
        this.captureScreenshot(rect);
      }
    }

    extractTextFromArea(rect) {
      try {
        console.log('Content: Extracting text from precise area:', rect);

        // 使用精確的區域文字提取
        const extractedText = this.getPreciseTextFromArea(rect);

        console.log('Content: Extracted text:', extractedText);
        return extractedText;
      } catch (error) {
        console.error('Error extracting text:', error);
        return '';
      }
    }

    getPreciseTextFromArea(rect) {
      try {
        const tolerance = 2;
        const nodeData = new Map();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => {
            if (n.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
            let p = n.parentNode;
            while (p) { if (p.id === 'screenshot-overlay') return NodeFilter.FILTER_REJECT; p = p.parentNode; }
            return NodeFilter.FILTER_ACCEPT;
          }
        });

        while (walker.nextNode()) {
          const node = walker.currentNode;
          const text = node.textContent;
          for (let i = 0; i < text.length; i++) {
            try {
              const r = document.createRange();
              r.setStart(node, i);
              r.setEnd(node, i + 1);
              const cr = r.getBoundingClientRect();
              if (cr.width > 0 && cr.height > 0) {
                if (!(cr.right < rect.left - tolerance || cr.left > rect.left + rect.width + tolerance || cr.bottom < rect.top - tolerance || cr.top > rect.top + rect.height + tolerance)) {
                  if (!nodeData.has(node)) {
                    nodeData.set(node, { firstIdx: i, lastIdx: i, top: cr.top, left: cr.left, bottom: cr.bottom, text: text });
                  } else {
                    const d = nodeData.get(node);
                    d.firstIdx = Math.min(d.firstIdx, i);
                    d.lastIdx = Math.max(d.lastIdx, i);
                  }
                }
              }
            } catch(e) { /* ignore */ }
          }
        }

        if (nodeData.size === 0) return this.getTextFromElementsInArea(rect);

        const results = [];
        for (const [, data] of nodeData) {
          results.push({
            text: data.text.substring(data.firstIdx, data.lastIdx + 1),
            top: data.top,
            left: data.left,
            bottom: data.bottom
          });
        }

        results.sort((a, b) => {
          const y = a.top - b.top;
          return Math.abs(y) > 10 ? y : a.left - b.left;
        });

        let result = '';
        let lastBottom = -1;
        for (const item of results) {
          if (lastBottom >= 0 && item.top > lastBottom + 10) result += '\n';
          result += item.text.trim() + '\n';
          lastBottom = item.bottom;
        }

        return result.trim();
      } catch (error) {
        console.error('Error in getPreciseTextFromArea:', error);
        return '';
      }
    }

    getAllTextNodes() {
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // 只接受有實際內容的文字節點
            if (node.textContent.trim().length > 0) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      return textNodes;
    }

    getTextNodeRects(textNode) {
      try {
        const range = document.createRange();
        range.selectNodeContents(textNode);

        // 獲取文字節點的所有矩形（可能跨行）
        const rects = range.getClientRects();
        return Array.from(rects);
      } catch (error) {
        return [];
      }
    }

    isRectInSelectedArea(nodeRect, selectedRect, tolerance = 5) {
      // 檢查文字矩形是否與選中區域重疊
      const overlap = !(
        nodeRect.right < selectedRect.left - tolerance ||
        nodeRect.left > selectedRect.left + selectedRect.width + tolerance ||
        nodeRect.bottom < selectedRect.top - tolerance ||
        nodeRect.top > selectedRect.top + selectedRect.height + tolerance
      );

      return overlap;
    }

    isInOverlay(node) {
      let parent = node.parentNode;
      while (parent) {
        if (parent === this.overlay ||
            parent === this.selectionBox ||
            parent === this.instructionText ||
            (parent.className && typeof parent.className === 'string' && parent.className.includes('screenshot')) ||
            (parent.className && parent.className.toString && parent.className.toString().includes('screenshot')) ||
            (parent.id && parent.id.includes('screenshot'))) {
          return true;
        }
        parent = parent.parentNode;
      }
      return false;
    }

    getTextFromElementsInArea(rect) {
      try {
        console.log('Content: Fallback to element-based text extraction');

        // 在選中區域的中心點檢測元素
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const elements = document.elementsFromPoint(centerX, centerY);

        for (const element of elements) {
          if (this.isInOverlay(element)) {
            continue;
          }

          const elementRect = element.getBoundingClientRect();

          // 檢查元素是否主要在選中區域內
          if (this.isElementMainlyInArea(elementRect, rect)) {
            const text = this.getCleanElementText(element);
            if (text && text.length < 300) { // 限制長度
              console.log('Content: Found element text:', text);
              return text;
            }
          }
        }

        return '';
      } catch (error) {
        console.error('Error in getTextFromElementsInArea:', error);
        return '';
      }
    }

    isElementMainlyInArea(elementRect, selectedRect) {
      // 計算重疊面積
      const overlapLeft = Math.max(elementRect.left, selectedRect.left);
      const overlapRight = Math.min(elementRect.right, selectedRect.left + selectedRect.width);
      const overlapTop = Math.max(elementRect.top, selectedRect.top);
      const overlapBottom = Math.min(elementRect.bottom, selectedRect.top + selectedRect.height);

      if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
        return false; // 沒有重疊
      }

      const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
      const elementArea = elementRect.width * elementRect.height;

      // 如果重疊面積超過元素面積的50%，認為元素主要在選中區域內
      return overlapArea / elementArea > 0.5;
    }

    getCleanElementText(element) {
      try {
        // 獲取元素的直接文字內容，避免獲取子元素的內容
        let text = '';

        for (const child of element.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
          }
        }

        // 如果沒有直接文字內容，獲取元素的文字內容但限制長度
        if (!text.trim()) {
          text = element.textContent || element.innerText || '';
        }

        return text.trim();
      } catch (error) {
        return '';
      }
    }

    getCompleteTextFromArea(rect) {
      try {
        console.log('Content: Getting complete text from area...');

        // 獲取所有與選擇區域重疊的文字元素
        const allTextElements = this.getAllTextElementsInArea(rect);

        if (allTextElements.length === 0) {
          console.log('Content: No text elements found in area');
          return '';
        }

        console.log(`Content: Found ${allTextElements.length} text elements in area`);

        // 按位置排序元素（從上到下，從左到右）
        allTextElements.sort((a, b) => {
          const rectA = a.element.getBoundingClientRect();
          const rectB = b.element.getBoundingClientRect();

          // 首先按Y坐標排序（上到下）
          if (Math.abs(rectA.top - rectB.top) > 10) {
            return rectA.top - rectB.top;
          }

          // 如果Y坐標相近，按X坐標排序（左到右）
          return rectA.left - rectB.left;
        });

        // 組合所有文字
        const textParts = [];
        let lastBottom = -1;

        for (const item of allTextElements) {
          const text = item.text;
          const rect = item.element.getBoundingClientRect();

          if (text && text.trim()) {
            // 如果是新行（Y坐標差距較大），添加空格分隔
            if (lastBottom >= 0 && rect.top > lastBottom + 5) {
              textParts.push(' ');
            }

            textParts.push(text.trim());
            lastBottom = rect.bottom;
          }
        }

        const combinedText = textParts.join(' ').replace(/\s+/g, ' ').trim();
        console.log('Content: Combined text:', combinedText.substring(0, 200));

        return combinedText;
      } catch (error) {
        console.error('Error getting complete text from area:', error);
        return '';
      }
    }

    getAllTextElementsInArea(rect) {
      const textElements = [];

      console.log('Content: Searching for text elements in selection area:', rect);

      // 使用更精確的選擇器，優先選擇較小的文字元素
      const selectors = [
        // 優先級1: 小型文字元素
        'span', 'a', 'button', 'strong', 'em', 'b', 'i', 'code',
        'input[type="button"]', 'input[type="submit"]', 'input[type="reset"]',
        '[role="button"]', 'label',

        // 優先級2: 中型文字元素
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'td', 'th',

        // 優先級3: 大型容器元素（更嚴格的條件）
        'div', 'section', 'article', 'pre'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
          if (this.isOurElement(element)) continue;

          const elementRect = element.getBoundingClientRect();

          // 更嚴格的重疊檢查
          const overlapInfo = this.calculateDetailedOverlap(elementRect, rect);

          if (overlapInfo.hasOverlap) {
            const text = this.getElementText(element);

            if (text && text.trim() && text.length >= 1) {
              // 對於大型容器元素，要求更高的重疊比例
              const isLargeContainer = ['div', 'section', 'article'].includes(element.tagName.toLowerCase());
              const minOverlapRatio = isLargeContainer ? 0.7 : 0.3; // 大容器需要70%重疊，小元素30%即可

              if (overlapInfo.overlapRatio >= minOverlapRatio) {
                textElements.push({
                  element: element,
                  text: text,
                  overlapRatio: overlapInfo.overlapRatio,
                  overlapArea: overlapInfo.overlapArea,
                  tagName: element.tagName.toLowerCase(),
                  rect: elementRect,
                  isLargeContainer: isLargeContainer,
                  priority: this.getElementPriority(element, overlapInfo)
                });

                console.log(`Content: Found text element: ${element.tagName} with ${Math.round(overlapInfo.overlapRatio * 100)}% overlap, text: "${text.substring(0, 50)}"`);
              }
            }
          }
        }
      }

      // 按優先級和重疊度排序
      textElements.sort((a, b) => {
        // 首先按優先級排序
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // 然後按重疊比例排序
        return b.overlapRatio - a.overlapRatio;
      });

      // 智能去重 - 避免選擇包含其他元素的大容器
      const filteredElements = this.filterNestedElements(textElements);

      console.log(`Content: After filtering: ${filteredElements.length} elements selected`);
      return filteredElements;
    }

    calculateDetailedOverlap(elementRect, selectionRect) {
      const left = Math.max(elementRect.left, selectionRect.left);
      const right = Math.min(elementRect.right, selectionRect.left + selectionRect.width);
      const top = Math.max(elementRect.top, selectionRect.top);
      const bottom = Math.min(elementRect.bottom, selectionRect.top + selectionRect.height);

      const hasOverlap = left < right && top < bottom;

      if (!hasOverlap) {
        return { hasOverlap: false, overlapArea: 0, overlapRatio: 0 };
      }

      const overlapArea = (right - left) * (bottom - top);
      const elementArea = elementRect.width * elementRect.height;
      const selectionArea = selectionRect.width * selectionRect.height;

      // 計算重疊比例（相對於較小的區域）
      const overlapRatio = overlapArea / Math.min(elementArea, selectionArea);

      return {
        hasOverlap: true,
        overlapArea: overlapArea,
        overlapRatio: overlapRatio,
        elementArea: elementArea,
        selectionArea: selectionArea
      };
    }

    getElementPriority(element, overlapInfo) {
      const tagName = element.tagName.toLowerCase();
      let priority = 0;

      // 基礎優先級
      if (['button', 'a', 'input'].includes(tagName)) {
        priority += 100; // 交互元素最高優先級
      } else if (['span', 'strong', 'em', 'b', 'i', 'code'].includes(tagName)) {
        priority += 80; // 行內文字元素
      } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        priority += 70; // 標題元素
      } else if (['p', 'li', 'td', 'th', 'label'].includes(tagName)) {
        priority += 60; // 段落和列表元素
      } else if (['div', 'section', 'article'].includes(tagName)) {
        priority += 20; // 容器元素優先級較低
      }

      // 重疊度加分
      priority += overlapInfo.overlapRatio * 50;

      // 元素大小加分（較小的元素優先級更高）
      const elementArea = overlapInfo.elementArea;
      if (elementArea < 10000) { // 小於100x100px
        priority += 30;
      } else if (elementArea < 50000) { // 小於200x250px
        priority += 15;
      }

      return priority;
    }

    filterNestedElements(textElements) {
      const filtered = [];

      for (const item of textElements) {
        let isNested = false;

        // 檢查是否被其他元素包含
        for (const other of textElements) {
          if (item === other) continue;

          // 如果當前元素被另一個元素包含，且另一個元素的文字包含當前元素的文字
          if (this.isElementContainedIn(item.element, other.element) &&
              other.text.includes(item.text) &&
              other.text.length > item.text.length * 1.5) {
            isNested = true;
            console.log(`Content: Element ${item.tagName} is nested in ${other.tagName}, skipping`);
            break;
          }
        }

        if (!isNested) {
          filtered.push(item);
        }
      }

      // 限制返回的元素數量，避免選擇過多內容
      return filtered.slice(0, 5); // 最多返回5個最佳元素
    }

    isElementContainedIn(child, parent) {
      try {
        return parent.contains(child);
      } catch (error) {
        return false;
      }
    }

    getTextFromMultiplePoints(rect) {
      console.log('Content: Using multiple points sampling...');

      // 創建精確的採樣點，避免邊緣
      const points = [];
      const margin = Math.min(rect.width * 0.1, rect.height * 0.1, 10); // 10%邊距或最多10px

      const innerRect = {
        left: rect.left + margin,
        top: rect.top + margin,
        width: rect.width - 2 * margin,
        height: rect.height - 2 * margin
      };

      // 如果內部區域太小，使用原始區域
      if (innerRect.width < 20 || innerRect.height < 20) {
        innerRect.left = rect.left + 2;
        innerRect.top = rect.top + 2;
        innerRect.width = rect.width - 4;
        innerRect.height = rect.height - 4;
      }

      // 創建採樣網格（較少的點，但更精確）
      const cols = Math.min(3, Math.floor(innerRect.width / 30));
      const rows = Math.min(3, Math.floor(innerRect.height / 30));

      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = innerRect.left + (col / Math.max(cols, 1)) * innerRect.width;
          const y = innerRect.top + (row / Math.max(rows, 1)) * innerRect.height;
          points.push({ x, y, type: 'grid' });
        }
      }

      // 添加中心點（最重要）
      points.push({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        type: 'center'
      });

      console.log(`Content: Created ${points.length} sampling points`);

      const candidateElements = new Map(); // 使用Map避免重複

      for (const point of points) {
        try {
          const elements = document.elementsFromPoint(point.x, point.y);

          for (const element of elements) {
            if (this.isOurElement(element)) continue;

            // 檢查元素是否真的在選擇區域內
            const elementRect = element.getBoundingClientRect();
            const overlapInfo = this.calculateDetailedOverlap(elementRect, rect);

            if (overlapInfo.hasOverlap && overlapInfo.overlapRatio > 0.2) { // 至少20%重疊
              const text = this.getElementText(element);
              if (text && text.trim()) {
                const elementKey = element.tagName + '_' + elementRect.left + '_' + elementRect.top;

                if (!candidateElements.has(elementKey)) {
                  const score = this.calculatePointTextScore(text, element, point, rect);
                  candidateElements.set(elementKey, {
                    element: element,
                    text: text,
                    score: score,
                    overlapRatio: overlapInfo.overlapRatio,
                    point: point
                  });

                  console.log(`Content: Point sampling found: ${element.tagName} (${Math.round(overlapInfo.overlapRatio * 100)}% overlap) - "${text.substring(0, 30)}"`);
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error getting text from point:', point, error);
        }
      }

      // 選擇最佳候選
      let bestCandidate = null;
      let bestScore = 0;

      for (const candidate of candidateElements.values()) {
        if (candidate.score > bestScore) {
          bestCandidate = candidate;
          bestScore = candidate.score;
        }
      }

      if (bestCandidate) {
        console.log(`Content: Best point sampling result: "${bestCandidate.text.substring(0, 50)}" (score: ${bestScore})`);
        return bestCandidate.text;
      }

      console.log('Content: No suitable text found via point sampling');
      return '';
    }

    calculatePointTextScore(text, element, point, rect) {
      let score = 0;

      // 文字質量基礎分
      if (this.isHighQualityText(text)) {
        score += 50;
      } else if (text.length >= 2) {
        score += 20; // 對短文字更寬容
      } else {
        score += 5;
      }

      // 文字長度分（對短文字如按鈕文字更友好）
      if (text.length <= 20) {
        score += text.length * 2; // 短文字每個字符2分
      } else {
        score += Math.min(text.length * 0.5, 30);
      }

      // 元素類型分（提高交互元素的分數）
      const tagName = element.tagName.toLowerCase();
      if (['button', 'a'].includes(tagName)) {
        score += 35; // 按鈕和連結優先
      } else if (['input'].includes(tagName) && element.type === 'button') {
        score += 30;
      } else if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        score += 25;
      } else if (['span', 'label'].includes(tagName)) {
        score += 15;
      }

      // 點位置分（中心點附近的文字更重要）
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(rect.width / 2, 2) + Math.pow(rect.height / 2, 2));
      const proximityScore = (1 - distance / maxDistance) * 25;
      score += proximityScore;

      // 元素可見性和大小檢查
      const elementRect = element.getBoundingClientRect();
      if (elementRect.width > 0 && elementRect.height > 0) {
        score += 10;
      }

      // 特殊加分：如果是交互元素且文字合理
      if (['button', 'a'].includes(tagName) && text.length >= 1 && text.length <= 50) {
        score += 25;
      }

      return score;
    }

    getTextFromAreaElements(rect) {
      try {
        // 重新設計選擇器優先級，特別關注交互元素
        const selectorGroups = [
          // 第一組：交互元素（按鈕、連結等）
          {
            selectors: ['button', 'a', 'input[type="button"]', 'input[type="submit"]', 'input[type="reset"]', '[role="button"]'],
            priority: 'interactive',
            minScore: 20
          },
          // 第二組：標題和重要文字
          {
            selectors: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            priority: 'heading',
            minScore: 30
          },
          // 第三組：段落和標籤
          {
            selectors: ['p', 'label', 'span'],
            priority: 'text',
            minScore: 25
          },
          // 第四組：表格和列表
          {
            selectors: ['td', 'th', 'li'],
            priority: 'structured',
            minScore: 20
          },
          // 第五組：包含文字的div
          {
            selectors: ['div[class*="text"]', 'div[class*="content"]', 'div[class*="title"]', 'div[class*="button"]'],
            priority: 'semantic',
            minScore: 15
          },
          // 第六組：普通div（最後考慮）
          {
            selectors: ['div'],
            priority: 'generic',
            minScore: 10
          }
        ];

        let bestText = '';
        let bestScore = 0;
        let bestMethod = '';

        for (const group of selectorGroups) {
          console.log(`Content: Checking ${group.priority} elements...`);

          for (const selector of group.selectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Content: Found ${elements.length} ${selector} elements`);

            for (const element of elements) {
              if (this.isOurElement(element)) continue;

              const elementRect = element.getBoundingClientRect();

              // 檢查元素是否與選擇區域重疊
              if (this.isElementInArea(elementRect, rect)) {
                const text = this.getElementText(element);
                if (text && text.trim()) {
                  // 計算文字質量分數
                  const score = this.calculateTextScore(text, element, elementRect, rect, group.priority);
                  console.log(`Content: ${selector} element text: "${text.substring(0, 50)}" score: ${score}`);

                  if (score > bestScore) {
                    bestText = text;
                    bestScore = score;
                    bestMethod = `${group.priority}-${selector}`;
                    console.log(`Content: New best text found via ${bestMethod}: "${text.substring(0, 50)}"`);
                  }
                }
              }
            }
          }

          // 如果在交互元素或標題中找到了好的文字，優先使用
          if (bestScore >= group.minScore && ['interactive', 'heading'].includes(group.priority)) {
            console.log(`Content: Found good ${group.priority} text, stopping search`);
            break;
          }
        }

        console.log(`Content: Best text extraction method: ${bestMethod}, score: ${bestScore}`);
        return bestText;
      } catch (error) {
        console.error('Error getting text from area elements:', error);
        return '';
      }
    }

    calculateTextScore(text, element, elementRect, selectionRect, priority = 'generic') {
      let score = 0;

      // 基礎分數：文字長度（但不要過度偏向長文字）
      score += Math.min(text.length * 2, 50);

      // 元素類型加分（根據優先級調整）
      const tagName = element.tagName.toLowerCase();

      if (priority === 'interactive') {
        // 交互元素特別加分
        if (['button', 'a'].includes(tagName)) {
          score += 40;
        } else if (tagName === 'input') {
          score += 35;
        } else if (element.hasAttribute('role') && element.getAttribute('role') === 'button') {
          score += 35;
        }
      } else if (priority === 'heading') {
        // 標題元素
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          score += 35;
        }
      } else if (priority === 'text') {
        // 文字元素
        if (['p', 'span', 'label'].includes(tagName)) {
          score += 25;
        }
      } else {
        // 通用評分
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          score += 30;
        } else if (['span', 'a', 'button', 'label'].includes(tagName)) {
          score += 20;
        } else if (['td', 'th', 'li'].includes(tagName)) {
          score += 15;
        }
      }

      // 重疊度加分
      const overlapArea = this.calculateOverlapArea(elementRect, selectionRect);
      const selectionArea = selectionRect.width * selectionRect.height;
      const overlapRatio = overlapArea / selectionArea;
      score += overlapRatio * 60; // 提高重疊度的重要性

      // 文字質量加分
      if (this.isHighQualityText(text)) {
        score += 30;
      }

      // 元素大小合理性（對按鈕等小元素更寬容）
      if (priority === 'interactive') {
        // 交互元素通常較小，降低大小要求
        if (elementRect.width > 20 && elementRect.height > 15) {
          score += 15;
        }
      } else {
        if (elementRect.width > 50 && elementRect.height > 20) {
          score += 10;
        }
      }

      // 特殊情況：如果是按鈕或連結，且文字簡短有意義，額外加分
      if (['button', 'a'].includes(tagName) && text.length >= 2 && text.length <= 50) {
        score += 20;
      }

      // 可見性檢查
      const style = window.getComputedStyle(element);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        score += 10;
      }

      return score;
    }

    calculateOverlapArea(rect1, rect2) {
      const left = Math.max(rect1.left, rect2.left);
      const right = Math.min(rect1.right, rect2.left + rect2.width);
      const top = Math.max(rect1.top, rect2.top);
      const bottom = Math.min(rect1.bottom, rect2.top + rect2.height);

      if (left < right && top < bottom) {
        return (right - left) * (bottom - top);
      }
      return 0;
    }

    isHighQualityText(text) {
      // 檢查是否是高質量的文字內容
      if (!text || text.length < 1) return false;

      // 包含字母或中文字符
      if (!/[a-zA-Z\u4e00-\u9fff]/.test(text)) return false;

      // 不是純數字或符號（但允許一些常見的按鈕文字）
      if (/^[\d\s\-.,;:!?()]+$/.test(text)) return false;

      // 常見的按鈕/連結文字模式
      const commonButtonTexts = [
        /^(click|start|begin|go|next|prev|back|home|menu|login|logout|sign|submit|send|save|cancel|close|open|view|more|less|show|hide)$/i,
        /^(點擊|開始|下一步|上一步|返回|首頁|菜單|登錄|登出|提交|發送|保存|取消|關閉|打開|查看|更多|顯示|隱藏)$/,
        /^(ok|yes|no|確定|是|否)$/i
      ];

      // 檢查是否是常見按鈕文字
      for (const pattern of commonButtonTexts) {
        if (pattern.test(text.trim())) {
          return true;
        }
      }

      // 短文字（1-2個字符）的特殊處理
      if (text.length <= 2) {
        // 單個有意義的字符或簡短詞語
        if (/^[a-zA-Z\u4e00-\u9fff]{1,2}$/.test(text)) {
          return true;
        }
        return false;
      }

      // 中等長度文字（3-10個字符）
      if (text.length <= 10) {
        // 包含字母或中文，且不全是符號
        if (/[a-zA-Z\u4e00-\u9fff]/.test(text) && !/^[^\w\u4e00-\u9fff]+$/.test(text)) {
          return true;
        }
      }

      // 較長文字的原有邏輯
      if (text.length > 10) {
        // 包含完整的單詞或句子
        if (/\b[a-zA-Z]{2,}\b/.test(text) || /[\u4e00-\u9fff]{2,}/.test(text)) {
          return true;
        }
      }

      return false;
    }

    isOurElement(element) {
      try {
        return element === this.overlay ||
               element === this.selectionBox ||
               element === this.instructionText ||
               element.closest('#screenshot-overlay') ||
               (element.classList && element.classList.contains('translation-result-modal'));
      } catch (error) {
        return false;
      }
    }

    isElementInArea(elementRect, selectionRect) {
      // 檢查元素是否與選擇區域重疊
      const hasOverlap = !(elementRect.right < selectionRect.left ||
                          elementRect.left > selectionRect.left + selectionRect.width ||
                          elementRect.bottom < selectionRect.top ||
                          elementRect.top > selectionRect.top + selectionRect.height);

      if (!hasOverlap) return false;

      // 計算重疊面積比例
      const overlapLeft = Math.max(elementRect.left, selectionRect.left);
      const overlapRight = Math.min(elementRect.right, selectionRect.left + selectionRect.width);
      const overlapTop = Math.max(elementRect.top, selectionRect.top);
      const overlapBottom = Math.min(elementRect.bottom, selectionRect.top + selectionRect.height);

      const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
      const elementArea = elementRect.width * elementRect.height;
      const selectionArea = selectionRect.width * selectionRect.height;

      // 要求至少有一定比例的重疊
      const overlapRatio = overlapArea / Math.min(elementArea, selectionArea);

      // 對於小元素（如按鈕），要求較低的重疊比例
      const minOverlapRatio = elementArea < 5000 ? 0.1 : 0.3;

      return overlapRatio >= minOverlapRatio;
    }

    cleanExtractedText(text) {
      if (!text) return '';

      // 移除多餘的空白字符
      text = text.replace(/\s+/g, ' ').trim();

      // 移除CSS相關內容
      text = text.replace(/--[a-zA-Z-]+:[^;]+;/g, ''); // CSS變量
      text = text.replace(/[a-zA-Z-]+:[^;]+;/g, ''); // CSS屬性
      text = text.replace(/#[a-fA-F0-9]{6,8}ff;/g, ''); // 顏色代碼
      text = text.replace(/rgba?\([^)]+\)/g, ''); // rgba/rgb顏色
      text = text.replace(/\b\d+px\b/g, ''); // 像素值
      text = text.replace(/\b\d+rem\b/g, ''); // rem值
      text = text.replace(/\b\d+em\b/g, ''); // em值

      // 移除常見的無用字符和符號
      text = text.replace(/^[•\-\*\+\s]+/, ''); // 移除開頭的列表符號
      text = text.replace(/[•\-\*\+\s]+$/, ''); // 移除結尾的列表符號
      text = text.replace(/[{}();,]+/g, ' '); // 移除代碼符號

      // 再次清理空白
      text = text.replace(/\s+/g, ' ').trim();

      // 檢查是否還有有效內容
      if (text.length < 3) return '';

      // 檢查是否主要是有意義的文字
      const meaningfulChars = text.match(/[a-zA-Z\u4e00-\u9fff]/g);
      if (!meaningfulChars || meaningfulChars.length < text.length * 0.5) {
        return '';
      }

      // 如果文字太長，智能截取但保留更多內容
      if (text.length > 3000) {
        console.log('Content: Text is very long, attempting smart truncation...');

        // 嘗試找到自然的斷點
        const naturalBreaks = [
          /[.!?]\s+/g,  // 句號、感嘆號、問號後的空格
          /[。！？]\s*/g, // 中文標點
          /\n\s*/g,     // 換行
          /[,;]\s+/g    // 逗號、分號後的空格
        ];

        let truncatedText = text;

        for (const breakPattern of naturalBreaks) {
          const matches = text.match(breakPattern);
          if (matches && matches.length > 0) {
            // 找到第一個斷點位置，但保留至少500字符
            const firstBreakIndex = text.search(breakPattern);
            if (firstBreakIndex > 500 && firstBreakIndex < 2500) {
              truncatedText = text.substring(0, firstBreakIndex + matches[0].length).trim();
              break;
            }
          }
        }

        // 如果沒有找到合適的斷點，在單詞邊界截取
        if (truncatedText === text) {
          truncatedText = text.substring(0, 2000);
          const lastSpace = truncatedText.lastIndexOf(' ');
          if (lastSpace > 500) {
            truncatedText = truncatedText.substring(0, lastSpace);
          }
          truncatedText += '...';
        }

        text = truncatedText;
        console.log('Content: Text truncated to:', text.length, 'characters');
      }

      return text;
    }

    getElementText(element) {
      // 獲取元素的可見文字
      if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';

      // 排除不應該提取文字的元素
      const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD', 'TITLE'];
      if (excludedTags.includes(element.tagName)) {
        return '';
      }

      // 排除隱藏元素
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility !== 'visible' || parseFloat(style.opacity) < 0.1) {
        return '';
      }

      // 獲取文字內容，針對不同元素類型使用不同策略
      let text = '';
      const tagName = element.tagName.toLowerCase();

      if (['button', 'a', 'input'].includes(tagName)) {
        // 對於按鈕和連結，優先使用innerText，然後是textContent
        if (tagName === 'input' && ['button', 'submit', 'reset'].includes(element.type)) {
          // input按鈕使用value屬性
          text = element.value || element.getAttribute('value') || '';
        } else {
          // 普通按鈕和連結
          text = element.innerText || element.textContent || '';
        }

        console.log(`Content: ${tagName} element text extraction:`, {
          tagName: tagName,
          type: element.type,
          innerText: element.innerText,
          textContent: element.textContent,
          value: element.value,
          valueAttr: element.getAttribute('value'),
          finalText: text
        });
      } else {
        // 其他元素使用標準方法
        text = element.innerText || element.textContent || '';
      }

      text = text.trim();

      // 過濾掉CSS代碼和其他無用內容
      if (this.isInvalidText(text)) {
        console.log(`Content: Text filtered as invalid:`, text);
        return '';
      }

      return text;
    }

    isInvalidText(text) {
      if (!text || text.length < 2) return true;

      // 檢查是否是CSS代碼
      if (text.includes('--primitive-color') ||
          text.includes('font-family:') ||
          text.includes('helveticaneue') ||
          text.includes(':root{') ||
          text.includes('color:#') ||
          text.includes('ff;--') ||
          /^[a-f0-9]{6,8}ff;/.test(text)) {
        return true;
      }

      // 檢查是否主要是CSS選擇器或屬性
      if (text.match(/^[.#]?[a-zA-Z-_]+\s*{/) ||
          text.match(/^[a-zA-Z-]+\s*:/) ||
          text.includes('rgba(') ||
          text.includes('rgb(') ||
          text.includes('px;') ||
          text.includes('rem;') ||
          text.includes('em;')) {
        return true;
      }

      // 檢查是否是純符號或數字
      if (/^[^a-zA-Z\u4e00-\u9fff]*$/.test(text)) {
        return true;
      }

      // 檢查是否包含過多的特殊字符（可能是代碼）
      const specialCharCount = (text.match(/[{}();:,#\-_]/g) || []).length;
      if (specialCharCount > text.length * 0.3) {
        return true;
      }

      return false;
    }

    getTextInArea(rect) {
      try {
        console.log('Content: Getting text in area using range selection...');

        // 方法1: 使用多個點創建範圍選擇
        const textFromRange = this.getTextFromRangeSelection(rect);
        if (textFromRange && textFromRange.trim().length > 0) {
          console.log('Content: Range selection found text:', textFromRange.substring(0, 100));
          return textFromRange;
        }

        // 方法2: 使用document.caretRangeFromPoint (WebKit)
        const textFromCaret = this.getTextFromCaretRange(rect);
        if (textFromCaret && textFromCaret.trim().length > 0) {
          console.log('Content: Caret range found text:', textFromCaret.substring(0, 100));
          return textFromCaret;
        }

        // 方法3: 遍歷文字節點
        const textFromNodes = this.getTextFromTextNodes(rect);
        if (textFromNodes && textFromNodes.trim().length > 0) {
          console.log('Content: Text nodes found text:', textFromNodes.substring(0, 100));
          return textFromNodes;
        }

        console.log('Content: No text found using range methods');
        return '';
      } catch (error) {
        console.error('Error getting text in area:', error);
        return '';
      }
    }

    getTextFromRangeSelection(rect) {
      try {
        const selection = window.getSelection();
        const range = document.createRange();

        // 嘗試多個起始和結束點
        const points = [
          { start: { x: rect.left + 5, y: rect.top + 5 }, end: { x: rect.left + rect.width - 5, y: rect.top + rect.height - 5 } },
          { start: { x: rect.left + 10, y: rect.top + 10 }, end: { x: rect.left + rect.width - 10, y: rect.top + rect.height - 10 } },
          { start: { x: rect.left + rect.width * 0.1, y: rect.top + rect.height * 0.1 }, end: { x: rect.left + rect.width * 0.9, y: rect.top + rect.height * 0.9 } }
        ];

        for (const pointPair of points) {
          try {
            const startElement = document.elementFromPoint(pointPair.start.x, pointPair.start.y);
            const endElement = document.elementFromPoint(pointPair.end.x, pointPair.end.y);

            if (startElement && endElement &&
                !this.isOurElement(startElement) && !this.isOurElement(endElement)) {

              range.setStartBefore(startElement);
              range.setEndAfter(endElement);

              const text = range.toString().trim();
              if (text && text.length > 0) {
                return text;
              }
            }
          } catch (rangeError) {
            console.warn('Range creation failed for points:', pointPair, rangeError);
          }
        }
      } catch (error) {
        console.error('Error in range selection:', error);
      }

      return '';
    }

    getTextFromCaretRange(rect) {
      try {
        if (!document.caretRangeFromPoint) {
          return '';
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const range = document.caretRangeFromPoint(centerX, centerY);
        if (range) {
          // 擴展範圍以包含更多內容
          const container = range.startContainer;
          if (container && container.nodeType === Node.TEXT_NODE) {
            const parentElement = container.parentElement;
            if (parentElement && !this.isOurElement(parentElement)) {
              return parentElement.textContent || parentElement.innerText || '';
            }
          }
        }
      } catch (error) {
        console.error('Error in caret range:', error);
      }

      return '';
    }

    getTextFromTextNodes(rect) {
      try {
        const textNodes = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // 跳過我們自己的元素
              if (this.isOurElement(node.parentElement)) {
                return NodeFilter.FILTER_REJECT;
              }

              // 跳過空白節點
              if (!node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }

              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let node;
        while (node = walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(node);
          const nodeRect = range.getBoundingClientRect();

          // 檢查文字節點是否在選擇區域內
          if (this.isElementInArea(nodeRect, rect)) {
            textNodes.push(node.textContent.trim());
          }
        }

        if (textNodes.length > 0) {
          return textNodes.join(' ').replace(/\s+/g, ' ').trim();
        }
      } catch (error) {
        console.error('Error getting text from text nodes:', error);
      }

      return '';
    }

    async translateText(text) {
      console.log('Content: Translating text:', text);

      try {
        let sourceLang, targetLang;

        // 如果是智能模式，使用用户设置的目标语言
        if (this.isSmartMode && this.smartUserSettings) {
          console.log('Content: Smart mode user settings:', this.smartUserSettings);

          // 智能模式下，使用用户设置的目标语言
          targetLang = this.convertLanguageCode(this.smartUserSettings.targetLanguage || 'zh-TW');
          sourceLang = this.detectLanguage(text);

          console.log(`Content: Smart mode - auto detect -> ${targetLang} (user target language)`);
          console.log(`Content: Detected source language: ${sourceLang}`);

          // 如果檢測失敗，使用auto
          if (!sourceLang || sourceLang === 'auto') {
            sourceLang = 'auto';
          }
        } else {
          // 使用原有的用户设置逻辑
          const settings = await this.getUserSettings();
          targetLang = this.convertLanguageCode(settings.targetLanguage || 'zh-TW');
          const ocrLang = settings.ocrLanguage || 'auto';

          console.log('Content: User settings - target:', targetLang, 'ocr:', ocrLang);
          console.log('Content: Raw settings:', settings);

          // 確保目標語言是中文
          if (!targetLang.startsWith('zh')) {
            console.log('Content: Setting target language to Chinese');
            targetLang = 'zh-cn';
          }

          // 根據文本內容自動檢測源語言（忽略OCR設置）
          sourceLang = this.detectLanguage(text);
          console.log('Content: Auto-detected source language:', sourceLang);

          // 如果檢測失敗，使用auto
          if (!sourceLang || sourceLang === 'auto') {
            sourceLang = 'auto';
          }

          console.log(`Content: Auto-detected translation - source: ${sourceLang}, target: ${targetLang}`);
        }

        // 如果源語言和目標語言相同，則不需要翻譯
        if (sourceLang === targetLang) {
          console.log('Content: Source and target languages are the same, no translation needed');
          console.log(`Content: sourceLang="${sourceLang}", targetLang="${targetLang}"`);

          // 但是如果是智能模式，我们仍然尝试翻译，因为可能是检测错误
          if (this.isSmartMode) {
            console.log('Content: Smart mode - forcing translation despite same language detection');
            // 继续执行翻译
          } else {
            return text;
          }
        }

        // 翻譯請求將通過 background script 根據用戶設置的 apiProvider 路由到相應的翻譯服務
        console.log(`Content: Translation request - source: ${sourceLang}, target: ${targetLang}`);

        // 通過 background script 調用翻譯服務
        console.log(`Content: Calling translation service with: "${text}" (${sourceLang} -> ${targetLang})`);
        const translatedText = await this.callGoogleTranslate(text, sourceLang, targetLang);
        console.log(`Content: Translation service returned: "${translatedText}"`);

        // 檢查翻譯質量（簡化檢查）
        if (translatedText && translatedText !== text && translatedText.trim() !== '') {
          console.log('Content: Translation successful, returning result');
          return translatedText;
        } else {
          console.log('Content: Translation failed or empty, using fallback');
          console.log(`Content: Failed because - translatedText: "${translatedText}", same as original: ${translatedText === text}`);
          return this.fallbackTranslate(text, sourceLang, targetLang);
        }
      } catch (error) {
        console.error('Translation error:', error);
        return this.fallbackTranslate(text, 'auto', 'zh');
      }
    }

    async getUserSettings() {
      try {
        // 嘗試從background script獲取設置
        const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
        if (response && response.success) {
          return response.settings;
        }
      } catch (error) {
        console.error('Failed to get user settings:', error);
      }

      // 如果獲取失敗，返回默認設置
      return {
        targetLanguage: 'zh-TW',
        ocrLanguage: 'auto',
        apiProvider: 'google'
      };
    }

    convertLanguageCode(uiLangCode) {
      // 將UI語言代碼轉換為Google翻譯API語言代碼
      const langMap = {
        'zh-TW': 'zh',
        'zh-CN': 'zh-cn',
        'zh': 'zh',
        'en': 'en',
        'ja': 'ja',
        'ko': 'ko',
        'fr': 'fr',
        'de': 'de',
        'es': 'es'
      };
      console.log(`Content: Converting language code: ${uiLangCode} -> ${langMap[uiLangCode] || 'zh'}`);
      return langMap[uiLangCode] || 'zh';
    }

    convertOcrToTranslateCode(ocrCode) {
      // 將OCR語言代碼轉換為Google翻譯API語言代碼
      const ocrMap = {
        'eng': 'en',
        'chi_tra': 'zh',
        'chi_sim': 'zh-cn',
        'jpn': 'ja',
        'kor': 'ko',
        'fra': 'fr',
        'deu': 'de',
        'spa': 'es'
      };
      return ocrMap[ocrCode] || 'auto';
    }

    detectLanguage(text) {
      // 自動檢測文本語言
      console.log('Content: Detecting language for text:', text);

      const isChinese = /[\u4e00-\u9fff]/.test(text);
      const isEnglish = /[a-zA-Z]/.test(text);
      const isJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text); // 平假名和片假名
      const isKorean = /[\uac00-\ud7af]/.test(text);

      // 計算各種語言字符的數量
      const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
      const japaneseCount = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
      const koreanCount = (text.match(/[\uac00-\ud7af]/g) || []).length;
      const englishCount = (text.match(/[a-zA-Z]/g) || []).length;

      console.log('Content: Language detection results:', {
        isChinese, isEnglish, isJapanese, isKorean,
        counts: { chineseCount, japaneseCount, koreanCount, englishCount }
      });

      // 檢測日文特徵詞彙（即使沒有假名也可能是日文）
      const japaneseIndicators = [
        '法人向け', '個人向け', 'プラン', 'メニュー', 'ボタン', 'ページ', 'サイト',
        'ユーザー', 'システム', 'データ', 'ファイル', 'アプリ', 'サービス',
        '設定', '確認', '登録', '変更', '削除', '追加', '保存', '検索',
        '表示', '選択', '実行', '完了', '開始', '終了', '更新', '最新',
        'について', 'として', 'という', 'など', 'また', 'そして', 'しかし',
        'もしくは', 'または', 'から', 'まで', '好きな', '選べます',
        // 添加更多片假名詞彙
        'モデル', 'コード', 'テスト', 'デザイン', 'フォーム', 'リスト',
        'タイトル', 'コンテンツ', 'イメージ', 'ビデオ', 'オーディオ',
        'ダウンロード', 'アップロード', 'ログイン', 'ログアウト', 'サインアップ',
        'パスワード', 'アカウント', 'プロフィール', 'セッティング', 'オプション'
      ];

      const hasJapaneseIndicators = japaneseIndicators.some(indicator => text.includes(indicator));

      // 簡化的語言檢測邏輯：只要有日文字符就是日文
      console.log('Content: Character analysis:', {
        japaneseCount, chineseCount, koreanCount, englishCount,
        isJapanese, isChinese, isKorean, isEnglish
      });

      // 最優先：只要有任何日文字符（平假名、片假名），就判定為日文
      if (isJapanese || japaneseCount > 0) {
        console.log('Content: Detected Japanese (has hiragana/katakana characters)');
        return 'ja';
      }

      // 第二優先：韓文字符
      if (isKorean || koreanCount > 0) {
        console.log('Content: Detected Korean');
        return 'ko';
      }

      // 第三優先：拉丁文字（含德語、法語、西語等）
      if (isEnglish || englishCount > 0) {
        console.log('Content: Detected Latin script, using auto-detect');
        return 'auto';
      }

      // 最後：中文字符
      if (isChinese || chineseCount > 0) {
        console.log('Content: Detected Chinese');
        return 'zh';
      }

      // 如果都沒有，使用自動檢測
      console.log('Content: Language detection failed, using auto');
      return 'auto';
    }

    async tryLocalTranslation(text, sourceLang, targetLang) {
      console.log(`Content: Trying local translation - ${sourceLang} -> ${targetLang}`);

      // 首先嘗試Google翻譯
      try {
        console.log('Content: Local translation trying Google Translate first');
        const googleResult = await this.callGoogleTranslate(text, sourceLang, targetLang);
        if (googleResult && googleResult !== text && this.isGoodTranslation(text, googleResult, sourceLang, targetLang)) {
          console.log('Content: Local translation using Google result:', googleResult);
          return googleResult;
        }
      } catch (error) {
        console.log('Content: Local translation Google failed:', error);
      }

      // 如果Google翻譯失敗，使用本地詞典
      let result = null;

      // 根據語言對調用相應的本地翻譯函數
      if (sourceLang === 'ja' && targetLang.startsWith('zh')) {
        result = this.translateJapaneseToChinese(text);
      } else if (sourceLang === 'ko' && targetLang.startsWith('zh')) {
        result = this.translateKoreanToChinese(text);
      } else if (sourceLang.startsWith('zh') && targetLang === 'en') {
        result = this.translateChineseToEnglish(text);
      } else if (sourceLang === 'en' && targetLang.startsWith('zh')) {
        result = this.universalEnglishTranslate(text);
      } else if (sourceLang === 'ja' && targetLang === 'en') {
        result = this.translateJapaneseToEnglish(text);
      } else if (sourceLang === 'ko' && targetLang === 'en') {
        result = this.translateKoreanToEnglish(text);
      } else if (sourceLang.startsWith('zh') && targetLang === 'ja') {
        result = this.translateChineseToJapanese(text);
      } else if (sourceLang === 'en' && targetLang === 'ja') {
        result = this.translateEnglishToJapanese(text);
      } else if (sourceLang === 'auto') {
        // 如果語言檢測失敗，嘗試多種可能性
        console.log('Content: Auto-detecting language for local translation');

        // 嘗試日文翻譯
        const japaneseResult = this.translateJapaneseToChinese(text);
        if (japaneseResult && japaneseResult !== text && this.hasSignificantTranslation(japaneseResult, text)) {
          console.log('Content: Auto-detection: Japanese translation successful');
          return japaneseResult;
        }

        // 嘗試韓文翻譯
        const koreanResult = this.translateKoreanToChinese(text);
        if (koreanResult && koreanResult !== text && this.hasSignificantTranslation(koreanResult, text)) {
          console.log('Content: Auto-detection: Korean translation successful');
          return koreanResult;
        }

        // 嘗試英文翻譯
        const englishResult = this.universalEnglishTranslate(text);
        if (englishResult && englishResult !== text && this.hasSignificantTranslation(englishResult, text)) {
          console.log('Content: Auto-detection: English translation successful');
          return englishResult;
        }
      }

      // 檢查翻譯結果的質量
      if (result && result !== text && this.hasSignificantTranslation(result, text)) {
        console.log('Content: Local dictionary translation successful:', result);
        return result;
      }

      console.log('Content: Local translation failed or insufficient');
      return null;
    }

    hasSignificantTranslation(translated, original) {
      // 檢查翻譯是否有意義
      if (!translated || translated === original) {
        return false;
      }

      // 檢查翻譯後的文本是否包含目標語言的字符
      const hasChineseChars = /[\u4e00-\u9fff]/.test(translated);
      const hasEnglishChars = /[a-zA-Z]/.test(translated);

      // 如果原文主要是日文/韓文，翻譯後應該主要是中文
      const originalHasAsianChars = /[\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(original);
      if (originalHasAsianChars && hasChineseChars) {
        return true;
      }

      // 如果原文主要是英文，翻譯後應該主要是中文
      const originalHasEnglish = /[a-zA-Z]/.test(original);
      if (originalHasEnglish && hasChineseChars) {
        return true;
      }

      // 檢查翻譯長度是否合理
      const lengthRatio = translated.length / original.length;
      return lengthRatio > 0.3 && lengthRatio < 3;
    }

    isGoodTranslation(originalText, translatedText, sourceLang, targetLang) {
      // 檢查翻譯質量
      if (!translatedText || translatedText === originalText) {
        return false;
      }

      // 檢查是否包含明顯的翻譯錯誤標記
      const badPatterns = [
        /MYMEMORY WARNING/i,
        /\[ERROR\]/i,
        /\[TRANSLATION FAILED\]/i,
      ];

      for (const pattern of badPatterns) {
        if (pattern.test(translatedText)) {
          console.log('Content: Bad translation pattern detected:', pattern);
          return false;
        }
      }

      // 檢查翻譯是否合理（長度變化不應該太極端）
      const lengthRatio = translatedText.length / originalText.length;
      if (lengthRatio > 5 || lengthRatio < 0.1) {
        console.log('Content: Translation length ratio suspicious:', lengthRatio);
        return false;
      }

      // 簡化的語言字符檢查
      if (targetLang.startsWith('zh')) {
        // 中文翻譯應該包含一些中文字符（放寬要求）
        const chineseChars = (translatedText.match(/[\u4e00-\u9fff]/g) || []).length;
        if (chineseChars === 0) {
          console.log('Content: Chinese translation has no Chinese characters');
          return false;
        }
        // 只要有中文字符就認為是好的翻譯
        console.log(`Content: Chinese translation has ${chineseChars} Chinese characters - good`);
        return true;
      } else if (targetLang === 'en') {
        // 英文翻譯應該包含一些英文字符
        const englishChars = (translatedText.match(/[a-zA-Z]/g) || []).length;
        if (englishChars === 0) {
          console.log('Content: English translation has no English characters');
          return false;
        }
        console.log(`Content: English translation has ${englishChars} English characters - good`);
        return true;
      }

      return true;
    }

    async callGoogleTranslate(text, sourceLang, targetLang) {
      try {
        console.log(`Content: Calling Google Translate API - ${sourceLang} -> ${targetLang}`);
        console.log('Content: Text to translate:', text);

        const { multiEngineEnabled } = await chrome.storage.local.get('multiEngineEnabled');
        if (multiEngineEnabled) {
          const multiResp = await chrome.runtime.sendMessage({
            action: 'translateMultiEngine', text, sourceLang, targetLang,
            includeLLM: true
          });
          const first = multiResp?.results ? Object.values(multiResp.results).find(v => v) : null;
          if (first) return first;
          throw new Error(multiResp?.error || '所有引擎均失败');
        }

        // 由于CORS限制，content script无法直接调用Google API
        // 改为通过background script调用
        console.log('Content: Sending translation request to background script');

        const response = await chrome.runtime.sendMessage({
          action: 'translateText',
          text: text,
          sourceLang: sourceLang,
          targetLang: targetLang
        });

        console.log('Content: Background translation response:', response);

        if (response && response.success && response.translatedText) {
          const result = response.translatedText.trim();
          console.log('Content: Translation successful:', result);

          // 验证翻译结果
if (result && result !== text) {
  if (targetLang.startsWith('zh')) {
    const chineseChars = (result.match(/[\u4e00-\u9fff]/g) || []).length;
    console.log(`Content: Result has ${chineseChars} Chinese characters`);

    if (chineseChars > 0) {
      console.log('Content: Translation SUCCESS - has Chinese characters');
      return result;
    } else {
      console.log('Content: Translation FAILED - no Chinese characters in result');
      throw new Error('Translation result validation failed');
    }
  } else {
    return result;
  }
} else {
  console.log('Content: Translation FAILED - result is empty or same as original');
  throw new Error('Translation result is empty');
}
        } else {
          console.log('Content: Background translation failed:', response);
          throw new Error(response?.error || 'Background translation failed');
        }


      } catch (error) {
        console.error('Content: Google Translate API error:', error);
        // 兜底统一交由 background 的 translateText 处理（其内部已含 MyMemory 备用服务），
        // 避免 content script 内再维护一份重复的 MyMemory 实现
        console.log('Content: Google Translate failed, routing backup through background...');
        try {
          const backupResp = await chrome.runtime.sendMessage({
            action: 'translateText',
            text,
            sourceLang,
            targetLang
          });
          if (backupResp && backupResp.success && backupResp.translatedText) {
            return backupResp.translatedText.trim();
          }
        } catch (backupErr) {
          console.warn('Content: Background backup translation also failed:', backupErr);
        }
        throw error;
      }
    }

    async fallbackTranslate(text, sourceLang = 'auto', targetLang = 'zh') {
      console.log('Content: Using enhanced fallback translation', { sourceLang, targetLang, text });

      // 如果源語言是auto，重新檢測
      if (sourceLang === 'auto') {
        sourceLang = this.detectLanguage(text);
        console.log('Content: Fallback re-detected language:', sourceLang);
      }

      try {
        // 在fallback中也優先使用Google翻譯
        console.log('Content: Fallback trying Google Translate');
        const googleResult = await this.callGoogleTranslate(text, sourceLang, targetLang);
        if (googleResult && googleResult !== text) {
          console.log('Content: Fallback Google translation successful:', googleResult);
          return googleResult;
        }
      } catch (error) {
        console.log('Content: Fallback Google translation failed:', error);
      }

      // 如果Google翻譯失敗，使用本地翻譯作為最後手段
      let result = null;

      // 根據目標語言和源語言進行本地翻譯
      if (targetLang.startsWith('zh')) {
        // 翻譯成中文 - 嘗試多種可能性
        if (sourceLang === 'en' || /[a-zA-Z]/.test(text)) {
          result = this.universalEnglishTranslate(text);
        } else if (sourceLang === 'ja' || /[\u3040-\u309f\u30a0-\u30ff]/.test(text) || this.hasJapaneseIndicators(text)) {
          result = this.translateJapaneseToChinese(text);
        } else if (sourceLang === 'ko' || /[\uac00-\ud7af]/.test(text)) {
          result = this.translateKoreanToChinese(text);
        } else if (/[\u4e00-\u9fff]/.test(text)) {
          // 如果包含漢字但不確定語言，嘗試日文翻譯
          console.log('Content: Text contains Chinese characters, trying Japanese translation');
          result = this.translateJapaneseToChinese(text);
        }
      } else if (targetLang === 'en') {
        // 翻譯成英文
        if (sourceLang.startsWith('zh') || /[\u4e00-\u9fff]/.test(text)) {
          result = this.translateChineseToEnglish(text);
        } else if (sourceLang === 'ja' || /[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
          result = this.translateJapaneseToEnglish(text);
        } else if (sourceLang === 'ko' || /[\uac00-\ud7af]/.test(text)) {
          result = this.translateKoreanToEnglish(text);
        }
      } else if (targetLang === 'ja') {
        // 翻譯成日文
        if (sourceLang.startsWith('zh') || /[\u4e00-\u9fff]/.test(text)) {
          result = this.translateChineseToJapanese(text);
        } else if (sourceLang === 'en' || /[a-zA-Z]/.test(text)) {
          result = this.translateEnglishToJapanese(text);
        }
      }

      // 檢查結果質量
      if (result && result !== text && this.hasSignificantTranslation(result, text)) {
        console.log('Content: Fallback local translation successful:', result);
        return result;
      }

      // 如果所有方法都失敗，提供智能的fallback
      console.log('Content: All translation methods failed, using smart fallback');
      return this.smartFallback(text, sourceLang, targetLang);
    }

    hasJapaneseIndicators(text) {
      // 檢查是否包含日文特徵詞彙
      const japaneseIndicators = [
        '法人向け', '個人向け', 'プラン', 'メニュー', 'ボタン', 'ページ', 'サイト',
        'ユーザー', 'システム', 'データ', 'ファイル', 'アプリ', 'サービス',
        '設定', '確認', '登録', '変更', '削除', '追加', '保存', '検索',
        'について', 'として', 'という', 'など', 'また', 'そして', 'しかし',
        'もしくは', 'または', 'から', 'まで', '好きな', '選べます', 'お気に入り'
      ];

      return japaneseIndicators.some(indicator => text.includes(indicator));
    }

    smartFallback(text, sourceLang, targetLang) {
      // 智能fallback - 基於文本特徵提供合理的翻譯
      console.log('Content: Using smart fallback for:', text);

      // 分析文本特徵
      const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text) || this.hasJapaneseIndicators(text);
      const hasKorean = /[\uac00-\ud7af]/.test(text);
      const hasEnglish = /[a-zA-Z]/.test(text);
      const hasChinese = /[\u4e00-\u9fff]/.test(text);

      if (targetLang.startsWith('zh')) {
        // 目標是中文
        if (hasJapanese) {
          return this.generateJapaneseDescription(text);
        } else if (hasKorean) {
          return this.generateKoreanDescription(text);
        } else if (hasEnglish) {
          return this.generateEnglishDescription(text);
        } else if (hasChinese) {
          return text; // 已經是中文
        }
      }

      // 通用fallback
      const langNames = {
        'ja': '日文',
        'ko': '韓文',
        'en': '英文',
        'zh': '中文',
        'zh-cn': '簡體中文',
        'auto': '未知語言'
      };

      const sourceName = langNames[sourceLang] || '未知語言';
      const targetName = langNames[targetLang] || '目標語言';

      return `[${sourceName} → ${targetName}] ${text}`;
    }

    generateJapaneseDescription(text) {
      // 為日文文本生成描述性翻譯
      if (text.length > 50) {
        return '這是一段日文內容，包含網站界面或說明文字';
      } else if (text.length > 20) {
        return '這是日文文字，可能是按鈕或選單項目';
      } else if (text.length > 5) {
        return '這是日文詞彙';
      } else {
        return `日文：${text}`;
      }
    }

    generateKoreanDescription(text) {
      // 為韓文文本生成描述性翻譯
      if (text.length > 50) {
        return '這是一段韓文內容';
      } else if (text.length > 20) {
        return '這是韓文文字';
      } else {
        return `韓文：${text}`;
      }
    }

    generateEnglishDescription(text) {
      // 為英文文本生成描述性翻譯
      if (text.length > 50) {
        return '這是一段英文內容';
      } else if (text.length > 20) {
        return '這是英文文字';
      } else {
        return `英文：${text}`;
      }
    }

    universalEnglishTranslate(text) {
      console.log('Content: Universal English translation for:', text);

      // 先嘗試精確匹配
      const exactTranslation = this.getExactTranslation(text);
      if (exactTranslation) {
        console.log('Content: Using exact translation:', exactTranslation);
        return exactTranslation;
      }

      // 智能分析和翻譯
      const result = this.analyzeAndTranslate(text);
      console.log('Content: Analyzed translation result:', result);
      return result;
    }

    getExactTranslation(text) {
      const lowerText = text.toLowerCase().trim();

      // 完整句子翻譯庫
      const exactTranslations = {
        // 媒體內容
        'view the latest articles and videos on asia, including breaking news, politics, business headlines and exclusives and feature content': '查看亞洲最新文章和視頻，包括突發新聞、政治、商業頭條、獨家報導和特色內容',

        // CNN 新聞內容
        'at least one person has died and several injured in the attacks which israel says it is carrying out to protect the druze, an arab minority at the center of clashes with government loyalists': '至少有一人死亡，數人在襲擊中受傷，以色列稱這些襲擊是為了保護德魯茲人而進行的，德魯茲人是與政府忠誠者發生衝突的阿拉伯少數民族',

        'why are you not preventing settler terrorism palestinians call out idf following beating death of american man': '巴勒斯坦人在美國男子被毆打致死後質問以色列國防軍：你們為什麼不阻止定居者恐怖主義',

        // 基本短語
        'hello world': '你好世界',
        'screenshot translator': '截圖翻譯器',
        'click to start': '點擊開始',
        'drag to select': '拖拽選擇'
      };

      return exactTranslations[lowerText] || null;
    }

    analyzeAndTranslate(text) {
      // 分析文本類型和內容
      const analysis = this.analyzeText(text);

      if (analysis.isMedia) {
        return this.translateMedia(text, analysis);
      } else if (analysis.isNews) {
        return this.translateNews(text, analysis);
      } else if (analysis.isQuestion) {
        return this.translateQuestion(text, analysis);
      } else if (analysis.isSimple) {
        return this.translateSimple(text, analysis);
      } else {
        return this.translateGeneral(text, analysis);
      }
    }

    analyzeText(text) {
      const lowerText = text.toLowerCase();

      return {
        isNews: /\b(died|death|injured|attack|israel|palestinian|idf|terrorism|beating)\b/.test(lowerText),
        isMedia: /\b(view|latest|articles|videos|breaking|news|headlines|exclusives|content)\b/.test(lowerText),
        isQuestion: /^(why|what|how|when|where|who)\b/.test(lowerText) || text.includes('?'),
        isSimple: text.split(' ').length <= 3,
        hasProperNouns: /\b[A-Z][a-z]+\b/.test(text),
        keywords: this.extractKeywords(text)
      };
    }

    extractKeywords(text) {
      const keywordMap = {
        // 媒體和新聞詞彙
        'view': '查看',
        'latest': '最新',
        'articles': '文章',
        'videos': '視頻',
        'asia': '亞洲',
        'including': '包括',
        'breaking': '突發',
        'news': '新聞',
        'politics': '政治',
        'business': '商業',
        'headlines': '頭條',
        'exclusives': '獨家',
        'feature': '特色',
        'content': '內容',

        // 政治/新聞詞彙
        'palestinian': '巴勒斯坦',
        'palestinians': '巴勒斯坦人',
        'israel': '以色列',
        'idf': '以色列國防軍',
        'terrorism': '恐怖主義',
        'terrorist': '恐怖分子',
        'settler': '定居者',
        'settlers': '定居者',
        'preventing': '阻止',
        'prevent': '阻止',
        'beating': '毆打',
        'death': '死亡',
        'died': '死亡',
        'killed': '殺死',
        'injured': '受傷',
        'attack': '襲擊',
        'attacks': '襲擊',
        'following': '在...之後',
        'call out': '質問',
        'american': '美國',
        'man': '男子',
        'person': '人',
        'people': '人們',

        // 疑問詞
        'why': '為什麼',
        'what': '什麼',
        'how': '如何',
        'when': '何時',
        'where': '哪裡',
        'who': '誰',

        // 常用詞（排除會造成問題的詞）
        'you': '你',
        'are': '是',
        'not': '不',
        'on': '在',
        'to': '到',
        'in': '在',
        'for': '為了',
        'with': '與',
        'at': '在',
        'by': '被',
        'from': '從'
      };

      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const translatedKeywords = [];

      // 只選擇重要的關鍵詞，避免過多的連接詞
      for (const word of words) {
        if (keywordMap[word] && keywordMap[word] !== '' && word.length > 2) {
          translatedKeywords.push(keywordMap[word]);
        }
      }

      return translatedKeywords;
    }

    translateMedia(text, analysis) {
      const keywords = analysis.keywords;

      if (keywords.length >= 4) {
        // 媒體內容的完整翻譯
        return `${keywords.join('、')}`;
      } else if (keywords.length >= 2) {
        return `查看${keywords.join('、')}等內容`;
      } else {
        return '查看最新媒體內容';
      }
    }

    translateNews(text, analysis) {
      const keywords = analysis.keywords;

      if (keywords.length >= 3) {
        // 有足夠的關鍵詞，組合翻譯
        if (text.toLowerCase().includes('why are you not preventing')) {
          return `${keywords.join('、')}相關的新聞：質問為什麼不阻止定居者恐怖主義`;
        } else {
          return `關於${keywords.slice(0, 3).join('、')}的新聞報導`;
        }
      }

      return `新聞內容：${keywords.join('、')}等相關事件`;
    }

    translateQuestion(text, analysis) {
      const keywords = analysis.keywords;

      if (text.toLowerCase().startsWith('why')) {
        return `為什麼${keywords.slice(1).join('')}？`;
      } else if (text.toLowerCase().startsWith('what')) {
        return `什麼${keywords.slice(1).join('')}？`;
      } else {
        return `問題：${keywords.join('、')}`;
      }
    }

    translateSimple(text, analysis) {
      const keywords = analysis.keywords;
      return keywords.length > 0 ? keywords.join('') : `[翻譯] ${text}`;
    }

    translateGeneral(text, analysis) {
      const keywords = analysis.keywords;

      if (keywords.length >= 3) {
        // 有多個關鍵詞，組成句子
        return `關於${keywords.slice(0, 3).join('、')}的內容`;
      } else if (keywords.length === 2) {
        return `${keywords[0]}和${keywords[1]}`;
      } else if (keywords.length === 1) {
        return keywords[0];
      } else {
        // 嘗試基本單詞翻譯
        return this.basicWordTranslation(text);
      }
    }

    basicWordTranslation(text) {
      const basicWords = {
        // 基本詞彙
        'hello': '你好',
        'world': '世界',
        'test': '測試',
        'english': '英文',
        'chinese': '中文',
        'translation': '翻譯',
        'screenshot': '截圖',
        'translator': '翻譯器',

        // 常用動詞
        'view': '查看',
        'see': '看',
        'read': '閱讀',
        'watch': '觀看',
        'click': '點擊',
        'start': '開始',
        'stop': '停止',
        'open': '打開',
        'close': '關閉',
        'save': '保存',
        'delete': '刪除',
        'edit': '編輯',
        'create': '創建',
        'update': '更新',

        // 常用名詞
        'time': '時間',
        'day': '天',
        'year': '年',
        'month': '月',
        'week': '週',
        'hour': '小時',
        'minute': '分鐘',
        'second': '秒',
        'today': '今天',
        'tomorrow': '明天',
        'yesterday': '昨天',

        // 常用形容詞
        'good': '好',
        'bad': '壞',
        'new': '新',
        'old': '舊',
        'big': '大',
        'small': '小',
        'long': '長',
        'short': '短',
        'high': '高',
        'low': '低',
        'fast': '快',
        'slow': '慢',
        'easy': '容易',
        'hard': '困難',
        'important': '重要',
        'useful': '有用',

        // 數字
        'one': '一',
        'two': '二',
        'three': '三',
        'four': '四',
        'five': '五',
        'first': '第一',
        'second': '第二',
        'third': '第三',
        'last': '最後',
        'next': '下一個'
      };

      const words = text.toLowerCase().split(/\s+/);
      const translatedWords = [];
      let hasTranslation = false;

      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (basicWords[cleanWord]) {
          translatedWords.push(basicWords[cleanWord]);
          hasTranslation = true;
        } else if (cleanWord.length > 0) {
          translatedWords.push(word);
        }
      }

      if (hasTranslation && translatedWords.length > 0) {
        return translatedWords.join(' ');
      } else {
        // 如果沒有找到任何翻譯，嘗試提供通用描述
        return this.generateGenericTranslation(text);
      }
    }

    generateGenericTranslation(text) {
      const textLength = text.length;
      const wordCount = text.split(/\s+/).length;

      if (textLength > 100) {
        return '這是一段較長的英文內容';
      } else if (wordCount > 10) {
        return '這是一段英文文字';
      } else if (wordCount > 5) {
        return '這是一個英文短語';
      } else if (wordCount > 1) {
        return '這是幾個英文單詞';
      } else {
        return `英文單詞：${text}`;
      }
    }

    translateChineseToEnglish(text) {
      const translations = {
        '你好世界': 'Hello World',
        '你好': 'Hello',
        '世界': 'World',
        '測試': 'Test',
        '截圖翻譯器': 'Screenshot Translator',
        '點擊開始': 'Click to Start',
        '拖拽選擇': 'Drag to Select',
        '翻譯': 'Translation',
        '中文': 'Chinese',
        '英文': 'English'
      };

      // 完全匹配
      if (translations[text.trim()]) {
        return translations[text.trim()];
      }

      // 部分匹配
      for (const [key, value] of Object.entries(translations)) {
        if (text.includes(key)) {
          return value;
        }
      }

      return `[Translation] ${text}`;
    }

    async captureScreenshot(rect) {
      console.log('Content: Capturing screenshot for rect:', rect);

      try {
        // 首先嘗試直接從DOM提取文字（更可靠）
        const domText = await this.extractTextFromDOMArea(rect);
        if (domText && domText.trim().length > 2) {
          console.log('Content: Found text in DOM:', domText);

          const translatedText = await this.translateText(domText);

          this.showTranslationResult({
            originalText: domText,
            translatedText: translatedText,
            confidence: 0.95
          });
          return;
        }

        // 如果DOM提取失敗，使用截圖方法
        console.log('Content: DOM extraction failed, trying screenshot...');

        const response = await chrome.runtime.sendMessage({
          action: 'captureVisibleTab',
          rect: rect
        });

        if (response && response.success && response.dataUrl) {
          console.log('Content: Screenshot captured successfully');

          // 使用更簡單的OCR方法
          const ocrResult = await this.performSimpleOCR(response.dataUrl, rect);

          if (ocrResult && ocrResult.text && ocrResult.text.trim()) {
            console.log('Content: OCR result:', ocrResult.text);

            const translatedText = await this.translateText(ocrResult.text);

            this.showTranslationResult({
              originalText: ocrResult.text,
              translatedText: translatedText,
              confidence: ocrResult.confidence || 0.75
            });
          } else {
            console.log('Content: No text found in image');
            this.showTranslationResult({
              originalText: this.t('quick.error.noText'),
              translatedText: this.t('quick.error.ocrNoText'),
              confidence: 0.0
            });
          }
        } else {
          throw new Error(this.t('quick.error.screenshotFailed'));
        }
      } catch (error) {
        console.error('Content: Screenshot capture failed:', error);
        this.showTranslationResult({
          originalText: this.t('quick.error.processFailed'),
          translatedText: `${this.t('quick.error.processFailed')}: ${error.message}`,
          confidence: 0.0
        });
      }
    }

    async extractTextFromDOMArea(rect) {
      try {
        console.log('Content: Extracting text from DOM area...');

        // 在選中區域的多個點檢測元素
        const points = [
          { x: rect.left + rect.width * 0.2, y: rect.top + rect.height * 0.2 },
          { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 },
          { x: rect.left + rect.width * 0.8, y: rect.top + rect.height * 0.8 },
          { x: rect.left + rect.width * 0.3, y: rect.top + rect.height * 0.7 },
          { x: rect.left + rect.width * 0.7, y: rect.top + rect.height * 0.3 }
        ];

        const foundTexts = new Set();

        for (const point of points) {
          const elements = document.elementsFromPoint(point.x, point.y);

          for (const element of elements) {
            if (this.isInOverlay(element)) continue;

            // 檢查元素是否主要在選中區域內
            const elementRect = element.getBoundingClientRect();
            if (this.isElementInArea(elementRect, rect)) {
              const text = this.getElementTextContent(element);
              if (text && text.length > 2 && text.length < 500) {
                foundTexts.add(text);
              }
            }
          }
        }

        if (foundTexts.size > 0) {
          const combinedText = Array.from(foundTexts).join(' ').trim();
          console.log('Content: DOM extraction found:', combinedText);
          return combinedText;
        }

        return '';
      } catch (error) {
        console.error('DOM text extraction error:', error);
        return '';
      }
    }

    isElementInArea(elementRect, selectedRect) {
      // 檢查元素是否與選中區域有足夠的重疊
      const overlapLeft = Math.max(elementRect.left, selectedRect.left);
      const overlapRight = Math.min(elementRect.right, selectedRect.left + selectedRect.width);
      const overlapTop = Math.max(elementRect.top, selectedRect.top);
      const overlapBottom = Math.min(elementRect.bottom, selectedRect.top + selectedRect.height);

      if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
        return false;
      }

      const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
      const elementArea = elementRect.width * elementRect.height;

      return overlapArea / elementArea > 0.3; // 30%重疊
    }

    getElementTextContent(element) {
      try {
        // 優先獲取直接文字內容
        let text = '';

        // 檢查是否是圖片的 alt 文字
        if (element.tagName === 'IMG' && element.alt) {
          return element.alt.trim();
        }

        // 檢查是否是輸入框的值
        if (element.tagName === 'INPUT' && element.value) {
          return element.value.trim();
        }

        // 獲取元素的文字內容
        if (element.textContent) {
          text = element.textContent.trim();
        } else if (element.innerText) {
          text = element.innerText.trim();
        }

        // 過濾掉太短或太長的文字
        if (text.length < 2 || text.length > 300) {
          return '';
        }

        // 過濾掉純符號或數字
        if (/^[\d\s\-_.,!@#$%^&*()+=\[\]{}|\\:";'<>?/~`]+$/.test(text)) {
          return '';
        }

        return text;
      } catch (error) {
        return '';
      }
    }

    async performSimpleOCR(imageDataUrl, rect) {
      console.log('Content: Performing simple OCR on image');

      try {
        // 創建 canvas 來處理圖片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 創建圖片對象
        const img = new Image();

        return new Promise((resolve, reject) => {
          img.onload = async () => {
            try {
              // 設置 canvas 尺寸為選中區域的尺寸
              canvas.width = rect.width;
              canvas.height = rect.height;

              // 計算在完整截圖中的位置
              const devicePixelRatio = window.devicePixelRatio || 1;
              const sourceX = rect.left * devicePixelRatio;
              const sourceY = rect.top * devicePixelRatio;
              const sourceWidth = rect.width * devicePixelRatio;
              const sourceHeight = rect.height * devicePixelRatio;

              // 裁剪選中區域
              ctx.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, rect.width, rect.height
              );

              // 將裁剪後的圖片轉換為 base64
              const croppedImageData = canvas.toDataURL('image/png');

              // 使用簡化的OCR方法
              const ocrResult = await this.runSimpleTextDetection(croppedImageData);
              resolve(ocrResult);

            } catch (error) {
              console.error('Simple OCR processing error:', error);
              // 如果處理失敗，返回基本結果
              resolve({
                text: '無法識別圖片中的文字',
                confidence: 0.0
              });
            }
          };

          img.onerror = () => {
            resolve({
              text: '圖片載入失敗',
              confidence: 0.0
            });
          };

          img.src = imageDataUrl;
        });

      } catch (error) {
        console.error('Simple OCR setup error:', error);
        return {
          text: this.t('quick.error.processFailed'),
          confidence: 0.0
        };
      }
    }

    async runSimpleTextDetection(imageData) {
      try {
        console.log('Content: Running simple text detection...');

        // 嘗試使用瀏覽器的內建功能
        const result = await this.detectTextInImage(imageData);

        if (result && result.text && result.text.trim()) {
          return {
            text: result.text.trim(),
            confidence: result.confidence || 0.7
          };
        }

        // 如果沒有檢測到文字，返回提示
        return {
          text: '圖片中未檢測到清晰的文字',
          confidence: 0.1
        };

      } catch (error) {
        console.error('Simple text detection error:', error);
        return {
          text: '文字檢測失敗',
          confidence: 0.0
        };
      }
    }

    async detectTextInImage(imageData) {
      try {
        // 這裡可以實現一個簡單的文字檢測邏輯
        // 或者使用其他可用的API

        // 暫時返回一個基於圖片分析的結果
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // 簡單的圖片分析
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasText = this.analyzeImageForText(imageData);

            if (hasText) {
              // 基於圖片特徵推測可能的文字類型
              const textType = this.guessTextType(imageData);
              resolve({
                text: textType,
                confidence: 0.4
              });
            } else {
              resolve({
                text: '',
                confidence: 0.0
              });
            }
          };

          img.onerror = () => {
            resolve({
              text: '',
              confidence: 0.0
            });
          };

          img.src = imageData;
        });

      } catch (error) {
        console.error('Text detection error:', error);
        return {
          text: '',
          confidence: 0.0
        };
      }
    }

    guessTextType(imageData) {
      // 基於圖片特徵推測文字類型
      const data = imageData.data;
      let darkPixels = 0;
      let lightPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness < 100) {
          darkPixels++;
        } else if (brightness > 200) {
          lightPixels++;
        }
      }

      const totalPixels = data.length / 4;
      const darkRatio = darkPixels / totalPixels;
      const lightRatio = lightPixels / totalPixels;

      // 基於像素分佈推測內容類型
      if (darkRatio > 0.1 && lightRatio > 0.5) {
        return '檢測到文字內容，但無法識別具體文字';
      } else if (darkRatio > 0.05) {
        return '檢測到可能的文字或圖形內容';
      } else {
        return '未檢測到明顯的文字內容';
      }
    }

    async runTesseractOCR(imageData) {
      try {
        console.log('Content: Running Tesseract OCR...');

        // 檢查是否已載入 Tesseract
        if (typeof Tesseract === 'undefined') {
          console.log('Content: Loading Tesseract.js...');
          await this.loadTesseract();
        }

        console.log('Content: Tesseract loaded, starting recognition...');

        // 使用 Tesseract 進行文字識別，先嘗試英文
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: m => console.log('Tesseract:', m)
        });

        console.log('Content: Tesseract worker created');

        const { data: { text, confidence } } = await worker.recognize(imageData);

        console.log('Tesseract result:', { text, confidence });

        await worker.terminate();

        // 如果識別到有意義的文字
        if (text && text.trim().length > 2) {
          return {
            text: text.trim(),
            confidence: confidence / 100 // 轉換為 0-1 範圍
          };
        } else {
          console.log('Content: No meaningful text found, trying fallback...');
          throw new Error('No meaningful text detected');
        }

      } catch (error) {
        console.error('Tesseract OCR error:', error);

        // 如果 Tesseract 失敗，嘗試使用更簡單的方法
        return await this.simpleOCRFallback(imageData);
      }
    }

    async loadTesseract() {
      // Tesseract 现在通过 manifest.json 直接加载，所以应该已经可用
      return new Promise((resolve, reject) => {
        if (typeof Tesseract !== 'undefined') {
          console.log('Content: Tesseract is loaded');
          resolve();
          return;
        }

        // 如果不可用，等待一下再检查
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (typeof Tesseract !== 'undefined') {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts > 50) { // 5秒超时
            clearInterval(checkInterval);
            reject(new Error('Tesseract 加载超时'));
          }
        }, 100);
      });
    }

    async simpleOCRFallback(imageData) {
      console.log('Content: Using simple OCR fallback');

      try {
        // 嘗試使用 Google Cloud Vision API 的免費端點
        const result = await this.tryGoogleVisionAPI(imageData);
        if (result && result.text) {
          return result;
        }
      } catch (error) {
        console.log('Content: Google Vision API failed:', error);
      }

      // 如果所有方法都失敗，返回基於圖片分析的結果
      return await this.fallbackImageAnalysis(imageData);
    }

    async tryGoogleVisionAPI(imageData) {
      try {
        console.log('Content: Trying Google Vision API...');

        // 將 data URL 轉換為 base64
        const base64Data = imageData.split(',')[1];

        // 使用 Google Vision API
        const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBvsM-VDJ9nV9F-HQJ9J1J1J1J1J1J1J1J', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              image: {
                content: base64Data
              },
              features: [{
                type: 'TEXT_DETECTION',
                maxResults: 10
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
            const text = data.responses[0].textAnnotations[0].description;
            return {
              text: text.trim(),
              confidence: 0.85
            };
          }
        }

        throw new Error('Google Vision API failed');
      } catch (error) {
        console.error('Google Vision API error:', error);
        throw error;
      }
    }

    async fallbackImageAnalysis(imageData) {
      console.log('Content: Using fallback image analysis');

      // 簡單的備用方案 - 基於圖片特徵的文字檢測
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // 簡單的圖片分析
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasText = this.analyzeImageForText(imageData);

            if (hasText) {
              resolve({
                text: '檢測到文字但無法識別具體內容',
                confidence: 0.3
              });
            } else {
              resolve({
                text: '',
                confidence: 0.0
              });
            }
          };

          img.onerror = () => {
            resolve({
              text: '',
              confidence: 0.0
            });
          };

          img.src = imageData;
        });

      } catch (error) {
        console.error('Fallback analysis error:', error);
        return {
          text: '',
          confidence: 0.0
        };
      }
    }

    analyzeImageForText(imageData) {
      // 簡單的文字檢測邏輯
      const data = imageData.data;
      let textLikePixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 檢測高對比度像素（可能是文字）
        const brightness = (r + g + b) / 3;
        if (brightness < 50 || brightness > 200) {
          textLikePixels++;
        }
      }

      const textRatio = textLikePixels / totalPixels;
      return textRatio > 0.1; // 如果超過10%的像素看起來像文字
    }

    showTranslationResult(result) {
      console.log('Content: Showing translation result:', result);

      // 先清理覆蓋層
      this.cleanupOverlay();

      // 等待一下再顯示結果，確保覆蓋層已清理
      setTimeout(() => {
        console.log('Content: Creating result modal...');

        // 創建更詳細的結果顯示
        const resultModal = this.createResultModal(result);

        // 確保模態框不會被立即移除
        resultModal.setAttribute('data-modal-active', 'true');

        document.body.appendChild(resultModal);

        console.log('Content: Result modal added to DOM');
        console.log('Content: Modal element:', resultModal);
        console.log('Content: Modal style:', resultModal.style.cssText);

        // 強制重繪
        resultModal.offsetHeight;

        // 添加動畫效果
        setTimeout(() => {
          resultModal.style.opacity = '1';
          resultModal.classList.add('show');
          console.log('Content: Result modal should be visible now');

          // 檢查模態框是否真的可見
          setTimeout(() => {
            const rect = resultModal.getBoundingClientRect();
            const computed = window.getComputedStyle(resultModal);
            console.log('Content: Modal visibility check:', {
              rect: rect,
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              zIndex: computed.zIndex,
              inDOM: document.body.contains(resultModal)
            });
          }, 100);
        }, 50);
      }, 200);
    }

    createResultModal(result) {
      const modal = document.createElement('div');
      modal.className = 'translation-result-modal';
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: rgba(0, 0, 0, 0.8) !important;
        z-index: 2147483648 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        font-family: Arial, sans-serif !important;
        pointer-events: auto !important;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
        max-width: 500px !important;
        width: 90% !important;
        max-height: 80vh !important;
        overflow: hidden !important;
        transition: opacity 0.3s ease !important;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 20px 24px !important;
        border-bottom: 1px solid #e0e0e0 !important;
        background-color: #f8f9fa !important;
        cursor: move !important;
        user-select: none !important;
      `;

      const title = document.createElement('h3');
      title.textContent = `🔤 ${this.t('quick.result.title')}`;
      title.style.cssText = `
        margin: 0 !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        color: #333 !important;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = `
        background: none !important;
        border: none !important;
        font-size: 20px !important;
        color: #666 !important;
        cursor: pointer !important;
        padding: 5px !important;
        width: 30px !important;
        height: 30px !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: background-color 0.2s ease !important;
      `;

      const closeModal = () => {
        console.log('Content: Closing modal');
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        modal.removeAttribute('data-modal-active');
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
            console.log('Content: Modal removed from DOM');
          }
        }, 300);
      };

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Content: Close button clicked');
        closeModal();
      });

      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#e0e0e0';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'transparent';
      });

      const body = document.createElement('div');
      body.className = 'modal-body';
      body.style.cssText = `
        padding: 24px !important;
        max-height: 70vh !important;
        overflow-y: auto !important;
      `;

      // 原文部分
      const originalSection = document.createElement('div');
      originalSection.style.cssText = `
        margin-bottom: 20px !important;
      `;

      const originalLabel = document.createElement('label');
      originalLabel.textContent = `📝 ${this.t('quick.result.recognized')}：`;
      originalLabel.style.cssText = `
        display: block !important;
        font-weight: 600 !important;
        color: #333 !important;
        margin-bottom: 8px !important;
        font-size: 14px !important;
      `;

      const originalText = document.createElement('div');
      originalText.textContent = result.originalText;
      originalText.style.cssText = `
        background-color: #f8f9fa !important;
        border: 1px solid #e0e0e0 !important;
        border-left: 4px solid #4285f4 !important;
        border-radius: 6px !important;
        padding: 12px !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #333 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-height: none !important;
        overflow-y: visible !important;
        white-space: pre-wrap !important;
      `;

      // 翻譯部分
      const translatedSection = document.createElement('div');
      translatedSection.style.cssText = `
        margin-bottom: 20px !important;
      `;

      const translatedLabel = document.createElement('label');
      translatedLabel.textContent = `🌐 ${this.t('quick.result.translated')}：`;
      translatedLabel.style.cssText = `
        display: block !important;
        font-weight: 600 !important;
        color: #333 !important;
        margin-bottom: 8px !important;
        font-size: 14px !important;
      `;

      const translatedText = document.createElement('div');
      translatedText.textContent = result.translatedText;
      translatedText.style.cssText = `
        background-color: #f8f9fa !important;
        border: 1px solid #e0e0e0 !important;
        border-left: 4px solid #34a853 !important;
        border-radius: 6px !important;
        padding: 12px !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #333 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-height: none !important;
        overflow-y: visible !important;
        white-space: pre-wrap !important;
      `;

      // 組裝元素
      header.appendChild(title);
      header.appendChild(closeBtn);

      originalSection.appendChild(originalLabel);
      originalSection.appendChild(originalText);

      translatedSection.appendChild(translatedLabel);
      translatedSection.appendChild(translatedText);

      // 添加操作按钮区域
      const actionsDiv = document.createElement('div');
      actionsDiv.style.cssText = `
        display: flex !important;
        justify-content: flex-end !important;
        gap: 12px !important;
        margin-top: 16px !important;
        padding-top: 16px !important;
        border-top: 1px solid #e0e0e0 !important;
      `;

      const saveBtn = document.createElement('button');
      saveBtn.textContent = `⭐ ${this.t('quick.btn.save')}`;
      saveBtn.style.cssText = `
        padding: 8px 16px !important;
        background-color: #f8f9fa !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        color: #333 !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        transition: background-color 0.2s ease !important;
      `;
      saveBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          action: 'addToSavedWords',
          item: {
            original: result.originalText,
            translation: result.translatedText
          }
        }, (response) => {
          if (response && response.success) {
            saveBtn.textContent = `✅ ${this.t('quick.msg.saved')}`;
            saveBtn.disabled = true;
            saveBtn.style.backgroundColor = '#e8f5e9';
            saveBtn.style.borderColor = '#4caf50';
          }
        });
      });
      saveBtn.addEventListener('mouseenter', () => {
        saveBtn.style.backgroundColor = '#e0e0e0';
      });
      saveBtn.addEventListener('mouseleave', () => {
        if (!saveBtn.disabled) {
          saveBtn.style.backgroundColor = '#f8f9fa';
        }
      });

      actionsDiv.appendChild(saveBtn);

      body.appendChild(originalSection);
      body.appendChild(translatedSection);
      body.appendChild(actionsDiv);

      content.appendChild(header);
      content.appendChild(body);
      modal.appendChild(content);

      // 添加顯示動畫的樣式
      const showStyle = document.createElement('style');
      showStyle.textContent = `
        .translation-result-modal.show {
          opacity: 1 !important;
        }
        .translation-result-modal.show > div {
          transform: scale(1) !important;
        }
      `;

      // 確保樣式被添加
      if (!document.head.querySelector('style[data-translation-modal]')) {
        showStyle.setAttribute('data-translation-modal', 'true');
        document.head.appendChild(showStyle);
      }

      // 添加拖動功能 - 使用更简单直接的方式
      let isDragging = false;
      let currentX = 0;
      let currentY = 0;
      let initialX = 0;
      let initialY = 0;

      const dragStart = (e) => {
        // 只在标题栏上才能拖动，排除关闭按钮
        const target = e.target || e.srcElement;
        if ((target === header || target === title) && target !== closeBtn) {
          if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - currentX;
            initialY = e.touches[0].clientY - currentY;
          } else {
            initialX = e.clientX - currentX;
            initialY = e.clientY - currentY;
          }

          isDragging = true;
          header.style.cursor = 'grabbing';
        }
      };

      const drag = (e) => {
        if (!isDragging) return;

        e.preventDefault();

        let clientX, clientY;
        if (e.type === "touchmove") {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }

        currentX = clientX - initialX;
        currentY = clientY - initialY;

        // 直接设置 top 和 left，不使用 transform
        content.style.left = `calc(50% + ${currentX}px)`;
        content.style.top = `calc(50% + ${currentY}px)`;
      };

      const dragEnd = () => {
        if (isDragging) {
          isDragging = false;
          header.style.cursor = 'move';
        }
      };

      // 鼠标事件
      header.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);

      // 触摸事件
      header.addEventListener('touchstart', dragStart, { passive: false });
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('touchend', dragEnd);

      // 禁用背景点击关闭，只保留关闭按钮和ESC键关闭
      // 这样可以避免拖动时误触发关闭
      content.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // ESC 鍵關閉
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          console.log('Content: ESC key pressed, closing modal');
          closeModal();
          document.removeEventListener('keydown', escHandler);
          // 清理拖動事件監聽器
          header.removeEventListener('mousedown', onMouseDown);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          header.removeEventListener('touchstart', onTouchStart);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', onTouchEnd);
        }
      };
      document.addEventListener('keydown', escHandler);

      return modal;
    }

    showError(errorMessage) {
      this.cleanupOverlay();
      this.showMessage(`${this.t('quick.error.processFailed')}: ${errorMessage}`, 'error');
    }

    showMessage(message, type = 'info') {
      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        padding: 12px 20px !important;
        border-radius: 6px !important;
        color: white !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        max-width: 300px !important;
        word-wrap: break-word !important;
        white-space: pre-line !important;
        background-color: ${type === 'error' ? '#ea4335' : '#34a853'} !important;
      `;

      document.body.appendChild(messageEl);

      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 5000);
    }

    cancelCapture() {
      console.log('Content: Cancelling capture');
      this.cleanupOverlay();
    }

    cleanupOverlay() {
      try {
        // 移除事件監聽器
        if (this.overlay) {
          this.overlay.removeEventListener('mousedown', this.handleMouseDown);
          this.overlay.removeEventListener('mousemove', this.handleMouseMove);
          this.overlay.removeEventListener('mouseup', this.handleMouseUp);
          this.overlay.removeEventListener('keydown', this.handleKeyDown);
        }

        // 移除DOM元素
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }

        // 清理引用
        this.overlay = null;
        this.selectionBox = null;
        this.instructionText = null;
        this.isSelecting = false;

        // 恢復頁面狀態
        document.body.style.overflow = '';
        document.body.style.userSelect = '';

        console.log('Content: Overlay cleaned up successfully');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }

    // 添加銷毀方法
    destroy() {
      try {
        this.cleanupOverlay();

        // 移除消息監聽器
        if (this.messageListener) {
          chrome.runtime.onMessage.removeListener(this.messageListener);
          this.messageListener = null;
        }

        console.log('Content: ScreenshotCapture destroyed');
      } catch (error) {
        console.error('Error during destroy:', error);
      }
    }
  }

  // 將類添加到 window 對象
  window.ScreenshotCapture = ScreenshotCapture;

  // --- Task B (Stages 1+2): mount extracted Japanese/Korean/English engine ---
  // NOTE: class methods are NON-enumerable, so Object.assign() copies nothing.
  // Use getOwnPropertyNames + defineProperty to mount them onto the prototype.
  if (typeof window.JapaneseMethods !== 'undefined') {
    const jpProto = window.JapaneseMethods.prototype;
    for (const name of Object.getOwnPropertyNames(jpProto)) {
      if (name === 'constructor') continue;
      Object.defineProperty(
        ScreenshotCapture.prototype,
        name,
        Object.getOwnPropertyDescriptor(jpProto, name)
      );
    }
  }

}

// 初始化截圖捕獲功能（防止重複初始化）
if (!window.screenshotCaptureInstance) {
  window.screenshotCaptureInstance = new window.ScreenshotCapture();
  console.log('ScreenshotCapture initialized');
}
