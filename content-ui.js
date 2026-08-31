// content-ui.js
// Task B (Stage 4): result-modal / overlay rendering engine extracted from content.js
// (ScreenshotCapture god-class prototype-augmentation split).
// Mounted onto ScreenshotCapture.prototype by content.js after the class definition.
// All methods are class methods (NON-enumerable); content.js mounts them via
// Object.getOwnPropertyNames + defineProperty (NOT Object.assign, which silently drops them).

class UIMethods {
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

// Expose for content.js mount guard (top-level class decls do NOT auto-attach to window).
window.UIMethods = UIMethods;