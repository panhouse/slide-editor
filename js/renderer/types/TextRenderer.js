/**
 * TextRenderer.js - テキスト要素レンダラー
 * PanHouse Slide Editor
 */

(function() {

class TextElementRenderer {
  constructor() {
    this.currentElementId = null;
    this.toolbar = null;
    this.setupToolbar();
  }

  /**
   * テキストツールバーをセットアップ
   */
  setupToolbar() {
    // DOM読み込み後に初期化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initToolbar());
    } else {
      this.initToolbar();
    }
  }

  initToolbar() {
    this.toolbar = document.getElementById('textToolbar');
    if (!this.toolbar) return;

    const fontSizeSelect = document.getElementById('textFontSize');
    const boldBtn = document.getElementById('textBold');
    const colorInput = document.getElementById('textColor');

    // フォントサイズ変更
    if (fontSizeSelect) {
      fontSizeSelect.addEventListener('change', (e) => {
        const newFontSize = parseInt(e.target.value);
        this.updateElementStyle('fontSize', newFontSize);
        // フォントサイズに応じて高さを自動調整
        this.autoAdjustHeight(newFontSize);
      });
    }

    // 太字トグル
    if (boldBtn) {
      boldBtn.addEventListener('click', () => {
        const element = this.getCurrentElement();
        if (element) {
          const newWeight = element.fontWeight === 'bold' ? 'normal' : 'bold';
          this.updateElementStyle('fontWeight', newWeight);
          boldBtn.classList.toggle('active', newWeight === 'bold');
        }
      });
    }

    // 文字色変更
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        this.updateElementStyle('color', e.target.value);
      });
    }

    // ツールバー外クリックで閉じる
    document.addEventListener('click', (e) => {
      if (this.toolbar &&
          !this.toolbar.contains(e.target) &&
          !e.target.closest('.slide-element-text')) {
        this.hideToolbar();
      }
    });
  }

  /**
   * 現在の要素を取得
   */
  getCurrentElement() {
    if (!this.currentElementId) return null;
    const currentSlide = SlideManager.getCurrentSlide();
    if (!currentSlide || !currentSlide.elements) return null;
    return currentSlide.elements.find(el => el.id === this.currentElementId);
  }

  /**
   * フォントサイズに応じて高さを自動調整
   */
  autoAdjustHeight(fontSize) {
    if (!this.currentElementId) return;

    const currentSlide = SlideManager.getCurrentSlide();
    if (!currentSlide || !currentSlide.elements) return;

    const elementIndex = currentSlide.elements.findIndex(el => el.id === this.currentElementId);
    if (elementIndex < 0) return;

    const element = currentSlide.elements[elementIndex];
    // フォントサイズ × 行高さ + パディング
    const lineHeight = element.lineHeight || 1.5;
    const newHeight = Math.max(50, Math.ceil(fontSize * lineHeight) + 16);

    // 高さが変わる場合のみ更新
    if (element.height < newHeight) {
      const newElements = [...currentSlide.elements];
      newElements[elementIndex] = {
        ...newElements[elementIndex],
        height: newHeight
      };
      SlideManager.updateCurrentSlide({ elements: newElements });
    }
  }

  /**
   * 要素のスタイルを更新
   */
  updateElementStyle(property, value) {
    if (!this.currentElementId) return;

    const currentSlide = SlideManager.getCurrentSlide();
    if (!currentSlide || !currentSlide.elements) return;

    const elementIndex = currentSlide.elements.findIndex(el => el.id === this.currentElementId);
    if (elementIndex < 0) return;

    const newElements = [...currentSlide.elements];
    newElements[elementIndex] = {
      ...newElements[elementIndex],
      [property]: value
    };

    SlideManager.updateCurrentSlide({ elements: newElements });
  }

  /**
   * ツールバーを表示
   */
  showToolbar(element, containerRect) {
    if (!this.toolbar) return;

    this.currentElementId = element.id;

    // ツールバーの値を更新
    const fontSizeSelect = document.getElementById('textFontSize');
    const boldBtn = document.getElementById('textBold');
    const colorInput = document.getElementById('textColor');

    if (fontSizeSelect) fontSizeSelect.value = element.fontSize || 16;
    if (boldBtn) boldBtn.classList.toggle('active', element.fontWeight === 'bold');
    if (colorInput) colorInput.value = element.color || '#333333';

    // 位置を計算（要素の上に表示）
    this.toolbar.style.display = 'flex';
    this.toolbar.style.left = `${containerRect.left}px`;
    this.toolbar.style.top = `${containerRect.top - 50}px`;
  }

  /**
   * ツールバーを非表示
   */
  hideToolbar() {
    if (this.toolbar) {
      this.toolbar.style.display = 'none';
    }
    this.currentElementId = null;
  }

  /**
   * テキスト要素をレンダリング
   * @param {Object} element - 要素データ
   * @returns {HTMLElement}
   */
  render(element) {
    const container = document.createElement('div');
    container.className = 'slide-element slide-element-text';
    container.dataset.elementId = element.id;

    // 位置とサイズを適用
    container.style.cssText = `
      position: absolute;
      left: ${element.x}px;
      top: ${element.y}px;
      width: ${element.width}px;
      height: ${element.height}px;
      transform: rotate(${element.rotation || 0}deg);
      opacity: ${element.opacity || 1};
      pointer-events: ${element.locked ? 'none' : 'auto'};
      min-width: 50px;
      min-height: 20px;
    `;

    // テキストコンテンツ
    const textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.contentEditable = 'true';
    const hasContent = element.content && element.content.trim() !== '';
    textContent.innerHTML = hasContent ? element.content : '';
    textContent.setAttribute('data-placeholder', 'テキストを入力');
    textContent.style.cssText = `
      width: 100%;
      height: 100%;
      font-size: ${element.fontSize || 24}px;
      font-weight: ${element.fontWeight || 'normal'};
      color: ${element.color || '#333333'};
      text-align: ${element.textAlign || 'left'};
      line-height: ${element.lineHeight || 1.5};
      padding: 4px;
      box-sizing: border-box;
      outline: none;
      overflow: visible;
      word-wrap: break-word;
    `;

    // クリックでツールバー表示
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = container.getBoundingClientRect();
      this.showToolbar(element, rect);
    });

    // テキスト編集時のイベント
    textContent.addEventListener('blur', () => {
      this.updateTextContent(element.id, textContent.innerHTML);
    });

    // フォーカス時もツールバー表示
    textContent.addEventListener('focus', () => {
      const rect = container.getBoundingClientRect();
      this.showToolbar(element, rect);
    });

    // ダブルクリックで編集モード
    container.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      textContent.focus();
      // テキスト全選択
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textContent);
      selection.removeAllRanges();
      selection.addRange(range);
    });

    // Enterでblur（編集終了）
    textContent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        textContent.blur();
      }
      e.stopPropagation(); // キーイベントの伝播を防ぐ
    });

    container.appendChild(textContent);

    return container;
  }

  /**
   * テキストコンテンツを更新
   * @param {string} elementId
   * @param {string} content
   */
  updateTextContent(elementId, content) {
    const currentSlide = SlideManager.getCurrentSlide();
    if (currentSlide && currentSlide.elements) {
      const elementIndex = currentSlide.elements.findIndex(el => el.id === elementId);
      if (elementIndex >= 0) {
        const newElements = [...currentSlide.elements];
        newElements[elementIndex] = {
          ...newElements[elementIndex],
          content: content
        };
        SlideManager.updateCurrentSlide({ elements: newElements });
      }
    }
  }

  /**
   * 要素データから更新
   * @param {HTMLElement} container
   * @param {Object} element
   */
  update(container, element) {
    container.style.left = `${element.x}px`;
    container.style.top = `${element.y}px`;
    container.style.width = `${element.width}px`;
    container.style.height = `${element.height}px`;
    container.style.transform = `rotate(${element.rotation || 0}deg`;
    container.style.opacity = element.opacity || 1;

    const textContent = container.querySelector('.text-content');
    if (textContent) {
      textContent.style.fontSize = `${element.fontSize || 16}px`;
      textContent.style.fontWeight = element.fontWeight || 'normal';
      textContent.style.color = element.color || '#333333';
      textContent.style.textAlign = element.textAlign || 'left';
    }
  }

  /**
   * 新規テキスト要素を作成
   * @param {number} x
   * @param {number} y
   * @returns {Object}
   */
  createNewElement(x, y) {
    return {
      id: Utils.generateId(),
      type: 'text',
      x: x,
      y: y,
      width: 300,
      height: 50,
      content: '',
      fontSize: 24,
      fontWeight: 'normal',
      color: '#333333',
      textAlign: 'left',
      lineHeight: 1.5,
      rotation: 0,
      opacity: 1,
      locked: false
    };
  }
}

// グローバルに公開
window.TextElementRenderer = new TextElementRenderer();

})();
