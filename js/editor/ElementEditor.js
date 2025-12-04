/**
 * ElementEditor.js - 要素の選択・移動・リサイズ
 * PanHouse Slide Editor
 */

(function() {

class ElementEditor {
  constructor() {
    this.selectedElement = null;
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.dragStart = { x: 0, y: 0 };
    this.elementStart = { x: 0, y: 0, width: 0, height: 0 };
    this.canvas = null;
    this.zoomLevel = 100;

    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // DOMが準備できてから設定
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._setup());
    } else {
      this._setup();
    }
  }

  _setup() {
    this.canvas = document.getElementById('slideCanvas');
    if (!this.canvas) return;

    // マウスダウン
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));

    // マウス移動（ドキュメント全体で監視）
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // マウスアップ（ドキュメント全体で監視）
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // キーボードイベント（削除など）
    document.addEventListener('keydown', (e) => this.onKeyDown(e));

    // ズームレベルの変更を監視
    EventBus.on(Events.CANVAS_ZOOM, (level) => {
      this.zoomLevel = level;
    });

    // スライド変更時に選択解除
    EventBus.on(Events.SLIDE_SELECTED, () => {
      this.deselect();
    });
  }

  /**
   * マウスダウン処理
   */
  onMouseDown(e) {
    const elementEl = e.target.closest('.slide-element');
    const resizeHandle = e.target.closest('.resize-handle');

    if (resizeHandle && this.selectedElement) {
      // リサイズ開始
      this.startResize(e, resizeHandle);
    } else if (elementEl) {
      // 要素を選択・ドラッグ開始
      this.selectElement(elementEl);
      this.startDrag(e);
    } else {
      // 空白クリックで選択解除
      this.deselect();
    }
  }

  /**
   * マウス移動処理
   */
  onMouseMove(e) {
    if (this.isDragging) {
      this.drag(e);
    } else if (this.isResizing) {
      this.resize(e);
    }
  }

  /**
   * マウスアップ処理
   */
  onMouseUp(e) {
    if (this.isDragging) {
      this.endDrag();
    }
    if (this.isResizing) {
      this.endResize();
    }
  }

  /**
   * キーダウン処理
   */
  onKeyDown(e) {
    if (!this.selectedElement) return;

    const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                           document.activeElement.tagName === 'TEXTAREA';
    if (isInputFocused) return;

    // Delete/Backspace: 要素削除
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSelectedElement();
    }

    // 矢印キー: 要素移動
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      this.nudgeElement(e.key, step);
    }

    // Escape: 選択解除
    if (e.key === 'Escape') {
      this.deselect();
    }
  }

  /**
   * 要素を選択
   */
  selectElement(elementEl) {
    this.deselect();
    this.selectedElement = elementEl;
    elementEl.classList.add('selected');
    this.addResizeHandles(elementEl);

    EventBus.emit(Events.ELEMENT_SELECTED, this.getElementData());
  }

  /**
   * 選択解除
   */
  deselect() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected');
      this.removeResizeHandles();
      this.selectedElement = null;
      EventBus.emit(Events.ELEMENT_SELECTED, null);
    }
  }

  /**
   * リサイズハンドルを追加
   */
  addResizeHandles(elementEl) {
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    handles.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${pos}`;
      handle.dataset.handle = pos;
      elementEl.appendChild(handle);
    });
  }

  /**
   * リサイズハンドルを削除
   */
  removeResizeHandles() {
    if (this.selectedElement) {
      const handles = this.selectedElement.querySelectorAll('.resize-handle');
      handles.forEach(h => h.remove());
    }
  }

  /**
   * ドラッグ開始
   */
  startDrag(e) {
    if (!this.selectedElement) return;

    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.zoomLevel / 100;

    this.dragStart = {
      x: e.clientX,
      y: e.clientY
    };

    this.elementStart = {
      x: parseFloat(this.selectedElement.style.left) || 0,
      y: parseFloat(this.selectedElement.style.top) || 0
    };

    document.body.style.cursor = 'move';
    e.preventDefault();
  }

  /**
   * ドラッグ中
   */
  drag(e) {
    if (!this.isDragging || !this.selectedElement) return;

    const scale = this.zoomLevel / 100;
    const deltaX = (e.clientX - this.dragStart.x) / scale;
    const deltaY = (e.clientY - this.dragStart.y) / scale;

    const newX = Math.max(0, Math.min(960 - 50, this.elementStart.x + deltaX));
    const newY = Math.max(0, Math.min(540 - 50, this.elementStart.y + deltaY));

    this.selectedElement.style.left = `${newX}px`;
    this.selectedElement.style.top = `${newY}px`;
  }

  /**
   * ドラッグ終了
   */
  endDrag() {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.body.style.cursor = '';

    // スライドデータを更新
    this.updateElementData();
  }

  /**
   * リサイズ開始
   */
  startResize(e, handle) {
    if (!this.selectedElement) return;

    this.isResizing = true;
    this.resizeHandle = handle.dataset.handle;

    this.dragStart = {
      x: e.clientX,
      y: e.clientY
    };

    this.elementStart = {
      x: parseFloat(this.selectedElement.style.left) || 0,
      y: parseFloat(this.selectedElement.style.top) || 0,
      width: parseFloat(this.selectedElement.style.width) || 100,
      height: parseFloat(this.selectedElement.style.height) || 100
    };

    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * リサイズ中
   */
  resize(e) {
    if (!this.isResizing || !this.selectedElement) return;

    const scale = this.zoomLevel / 100;
    const deltaX = (e.clientX - this.dragStart.x) / scale;
    const deltaY = (e.clientY - this.dragStart.y) / scale;

    let { x, y, width, height } = this.elementStart;
    const minSize = 20;

    switch (this.resizeHandle) {
      case 'se':
        width = Math.max(minSize, width + deltaX);
        height = Math.max(minSize, height + deltaY);
        break;
      case 'sw':
        x = Math.min(x + width - minSize, x + deltaX);
        width = Math.max(minSize, width - deltaX);
        height = Math.max(minSize, height + deltaY);
        break;
      case 'ne':
        y = Math.min(y + height - minSize, y + deltaY);
        width = Math.max(minSize, width + deltaX);
        height = Math.max(minSize, height - deltaY);
        break;
      case 'nw':
        x = Math.min(x + width - minSize, x + deltaX);
        y = Math.min(y + height - minSize, y + deltaY);
        width = Math.max(minSize, width - deltaX);
        height = Math.max(minSize, height - deltaY);
        break;
      case 'n':
        y = Math.min(y + height - minSize, y + deltaY);
        height = Math.max(minSize, height - deltaY);
        break;
      case 's':
        height = Math.max(minSize, height + deltaY);
        break;
      case 'e':
        width = Math.max(minSize, width + deltaX);
        break;
      case 'w':
        x = Math.min(x + width - minSize, x + deltaX);
        width = Math.max(minSize, width - deltaX);
        break;
    }

    this.selectedElement.style.left = `${x}px`;
    this.selectedElement.style.top = `${y}px`;
    this.selectedElement.style.width = `${width}px`;
    this.selectedElement.style.height = `${height}px`;
  }

  /**
   * リサイズ終了
   */
  endResize() {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.resizeHandle = null;

    // スライドデータを更新
    this.updateElementData();
  }

  /**
   * 要素を微調整移動
   */
  nudgeElement(direction, step) {
    if (!this.selectedElement) return;

    let x = parseFloat(this.selectedElement.style.left) || 0;
    let y = parseFloat(this.selectedElement.style.top) || 0;

    switch (direction) {
      case 'ArrowUp': y -= step; break;
      case 'ArrowDown': y += step; break;
      case 'ArrowLeft': x -= step; break;
      case 'ArrowRight': x += step; break;
    }

    x = Math.max(0, Math.min(960 - 50, x));
    y = Math.max(0, Math.min(540 - 50, y));

    this.selectedElement.style.left = `${x}px`;
    this.selectedElement.style.top = `${y}px`;

    this.updateElementData();
  }

  /**
   * 選択中の要素を削除
   */
  deleteSelectedElement() {
    if (!this.selectedElement) return;

    const elementId = this.selectedElement.dataset.elementId;
    const currentSlide = SlideManager.getCurrentSlide();

    if (currentSlide && currentSlide.elements) {
      const newElements = currentSlide.elements.filter(el => el.id !== elementId);
      SlideManager.updateCurrentSlide({ elements: newElements });
    }

    this.deselect();
  }

  /**
   * 要素データを更新
   */
  updateElementData() {
    if (!this.selectedElement) return;

    const elementId = this.selectedElement.dataset.elementId;
    const currentSlide = SlideManager.getCurrentSlide();

    if (currentSlide && currentSlide.elements) {
      const elementIndex = currentSlide.elements.findIndex(el => el.id === elementId);

      if (elementIndex >= 0) {
        const updatedElement = {
          ...currentSlide.elements[elementIndex],
          x: parseFloat(this.selectedElement.style.left) || 0,
          y: parseFloat(this.selectedElement.style.top) || 0,
          width: parseFloat(this.selectedElement.style.width) || 100,
          height: parseFloat(this.selectedElement.style.height) || 100
        };

        const newElements = [...currentSlide.elements];
        newElements[elementIndex] = updatedElement;

        SlideManager.updateCurrentSlide({ elements: newElements });
      }
    }
  }

  /**
   * 現在選択中の要素データを取得
   */
  getElementData() {
    if (!this.selectedElement) return null;

    const elementId = this.selectedElement.dataset.elementId;
    const currentSlide = SlideManager.getCurrentSlide();

    if (currentSlide && currentSlide.elements) {
      return currentSlide.elements.find(el => el.id === elementId);
    }

    return null;
  }
}

// シングルトンインスタンス
const elementEditor = new ElementEditor();

// グローバルに公開
window.ElementEditor = elementEditor;

})();
