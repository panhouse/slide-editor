/**
 * Canvas.js - キャンバス描画・操作
 * PanHouse Slide Editor
 */

class Canvas {
  constructor() {
    this.container = document.getElementById('canvasContainer');
    this.canvas = document.getElementById('slideCanvas');
    this.zoomLevel = 100;
    this.currentSlide = null;
    this.currentTool = 'select';

    this.setupEventListeners();
  }

  /**
   * 初期化
   */
  init() {
    this.render();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // ズームコントロール
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.zoomIn());
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.zoomOut());
    }

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Plus/Minus でズーム
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          this.zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          this.zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          this.resetZoom();
        }
      }

      // 矢印キーでスライド移動
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          if (document.activeElement.tagName !== 'INPUT' &&
              document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            SlideManager.nextSlide();
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          if (document.activeElement.tagName !== 'INPUT' &&
              document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            SlideManager.prevSlide();
          }
        }
      }
    });

    // イベントバスからの購読
    EventBus.on(Events.SLIDE_SELECTED, (index, slide) => {
      this.currentSlide = slide;
      this.render();
    });

    EventBus.on(Events.SLIDE_UPDATED, (slide) => {
      if (this.currentSlide && this.currentSlide.id === slide.id) {
        this.currentSlide = slide;
        this.render();
      }
    });

    EventBus.on(Events.THEME_CHANGED, () => {
      this.render();
    });

    EventBus.on(Events.DATA_LOADED, () => {
      this.currentSlide = SlideManager.getCurrentSlide();
      this.render();
    });

    // ツール変更を監視
    EventBus.on(Events.TOOL_CHANGED, (tool) => {
      this.currentTool = tool;
      this.updateCanvasCursor();
    });

    // キャンバスクリックでの要素追加
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    }
  }

  /**
   * キャンバスクリック処理
   */
  onCanvasClick(e) {
    // 選択ツール以外の場合に要素を追加
    if (this.currentTool === 'select') return;

    // 要素上のクリックは無視
    if (e.target.closest('.slide-element')) return;

    // クリック位置を取得（スライド座標系に変換）
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.zoomLevel / 100;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    switch (this.currentTool) {
      case 'text':
        this.addTextElement(x, y);
        break;
      case 'rect':
        this.addRectElement(x, y);
        break;
    }
  }

  /**
   * テキスト要素を追加
   */
  addTextElement(x, y) {
    if (!window.TextElementRenderer) return;

    const textElement = TextElementRenderer.createNewElement(x, y);
    const currentSlide = SlideManager.getCurrentSlide();

    if (currentSlide) {
      const elements = currentSlide.elements || [];
      SlideManager.updateCurrentSlide({
        elements: [...elements, textElement]
      });

      // 挿入後に自動でフォーカス（編集モード）
      setTimeout(() => {
        const newTextEl = this.canvas.querySelector(`[data-element-id="${textElement.id}"] .text-content`);
        if (newTextEl) {
          newTextEl.focus();
          // テキスト全選択
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(newTextEl);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 50);
    }
  }

  /**
   * 矩形要素を追加
   */
  addRectElement(x, y) {
    const rectElement = {
      id: Utils.generateId(),
      type: 'rect',
      x: x,
      y: y,
      width: 150,
      height: 100,
      fill: '#e0e0e0',
      stroke: '#999999',
      strokeWidth: 1,
      rotation: 0,
      opacity: 1,
      locked: false
    };

    const currentSlide = SlideManager.getCurrentSlide();
    if (currentSlide) {
      const elements = currentSlide.elements || [];
      SlideManager.updateCurrentSlide({
        elements: [...elements, rectElement]
      });
    }
  }

  /**
   * カーソルを更新
   */
  updateCanvasCursor() {
    if (!this.canvas) return;

    switch (this.currentTool) {
      case 'text':
        this.canvas.style.cursor = 'text';
        break;
      case 'rect':
        this.canvas.style.cursor = 'crosshair';
        break;
      default:
        this.canvas.style.cursor = 'default';
    }
  }

  /**
   * キャンバスをレンダリング
   */
  render() {
    if (!this.canvas) return;

    // キャンバスをクリア
    this.canvas.innerHTML = '';

    // 常にSlideManagerから最新のスライドデータを取得
    const currentSlide = SlideManager.getCurrentSlide();
    this.currentSlide = currentSlide;

    if (!currentSlide) {
      this.canvas.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">
          スライドがありません
        </div>
      `;
      return;
    }

    // スライドをレンダリング
    const settings = SlideManager.getSettings();
    const slides = SlideManager.getSlides();
    const currentIndex = SlideManager.currentIndex;

    const element = SlideRenderer.render(currentSlide, settings, {
      pageNumber: currentIndex + 1,
      totalPages: slides.length
    });

    // テーマを適用
    element.setAttribute('data-theme', settings.theme || 'panhouse');

    this.canvas.appendChild(element);

    // レイアウトを即座に適用（一瞬の初期位置表示を防ぐ）
    if (currentSlide.layout && Object.keys(currentSlide.layout).length > 0) {
      SlideRenderer.applyLayoutToElement(element, currentSlide.layout);
    }

    // 追加要素（画像など）をレンダリング
    this.renderElements();

    // フッターのスライド情報を更新
    this.updateSlideInfo();
  }

  /**
   * 追加要素をレンダリング
   */
  renderElements() {
    if (!this.currentSlide || !this.currentSlide.elements) return;

    // 要素レイヤーを作成
    let elementsLayer = this.canvas.querySelector('.elements-layer');
    if (!elementsLayer) {
      elementsLayer = document.createElement('div');
      elementsLayer.className = 'elements-layer';
      elementsLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      `;
      this.canvas.appendChild(elementsLayer);
    }

    elementsLayer.innerHTML = '';

    // 各要素をレンダリング
    this.currentSlide.elements.forEach(element => {
      let elementEl;

      switch (element.type) {
        case 'image':
          if (window.ImageElementRenderer) {
            elementEl = ImageElementRenderer.render(element);
          }
          break;
        case 'text':
          if (window.TextElementRenderer) {
            elementEl = TextElementRenderer.render(element);
          }
          break;
        case 'rect':
          elementEl = this.renderRectElement(element);
          break;
        default:
          break;
      }

      if (elementEl) {
        elementEl.style.pointerEvents = 'auto';
        elementsLayer.appendChild(elementEl);
      }
    });
  }

  /**
   * 矩形要素をレンダリング
   */
  renderRectElement(element) {
    const container = document.createElement('div');
    container.className = 'slide-element slide-element-rect';
    container.dataset.elementId = element.id;

    container.style.cssText = `
      position: absolute;
      left: ${element.x}px;
      top: ${element.y}px;
      width: ${element.width}px;
      height: ${element.height}px;
      background-color: ${element.fill || '#e0e0e0'};
      border: ${element.strokeWidth || 1}px solid ${element.stroke || '#999999'};
      transform: rotate(${element.rotation || 0}deg);
      opacity: ${element.opacity || 1};
      pointer-events: ${element.locked ? 'none' : 'auto'};
      border-radius: ${element.borderRadius || 0}px;
    `;

    return container;
  }

  /**
   * スライド情報を更新
   */
  updateSlideInfo() {
    const slideInfoEl = document.getElementById('slideInfo');
    if (slideInfoEl) {
      const currentIndex = SlideManager.currentIndex;
      const totalSlides = SlideManager.getSlideCount();
      slideInfoEl.textContent = `ページ ${currentIndex + 1} / ${totalSlides}`;
    }
  }

  /**
   * ズームイン
   */
  zoomIn() {
    if (this.zoomLevel < 200) {
      this.zoomLevel += 25;
      this.applyZoom();
    }
  }

  /**
   * ズームアウト
   */
  zoomOut() {
    if (this.zoomLevel > 25) {
      this.zoomLevel -= 25;
      this.applyZoom();
    }
  }

  /**
   * ズームをリセット
   */
  resetZoom() {
    this.zoomLevel = 100;
    this.applyZoom();
  }

  /**
   * ズームを適用
   */
  applyZoom() {
    if (this.canvas) {
      this.canvas.style.transform = `scale(${this.zoomLevel / 100})`;
    }

    const zoomLevelEl = document.getElementById('zoomLevel');
    if (zoomLevelEl) {
      zoomLevelEl.textContent = `${this.zoomLevel}%`;
    }

    EventBus.emit(Events.CANVAS_ZOOM, this.zoomLevel);
  }

  /**
   * 現在のズームレベルを取得
   * @returns {number}
   */
  getZoomLevel() {
    return this.zoomLevel;
  }
}

// グローバルに公開
window.Canvas = Canvas;
