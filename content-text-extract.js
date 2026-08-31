// ============================================================================
// content-text-extract.js  (Task B, Stage 3)
// DOM text-extraction engine extracted from ScreenshotCapture.content.js.
// Original god-class kept as orchestrator; these methods are mounted onto
// ScreenshotCapture.prototype by content.js via Object.getOwnPropertyNames()
// (class methods are non-enumerable, so Object.assign would silently drop them).
// All `this.*` semantics preserved (same prototype, same instance).
// ============================================================================
class TextExtractMethods {
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
}

window.TextExtractMethods = TextExtractMethods;
