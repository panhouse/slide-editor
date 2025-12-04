/**
 * DragDropEditor.js - Google Slideライクなドラッグ&ドロップ編集
 * PanHouse Slide Editor
 */

(function() {

class DragDropEditor {
  constructor() {
    this.canvas = null;
    this.selectedElement = null;
    this.isDragging = false;
    this.isResizing = false;
    this.hasMoved = false;
    this.resizeDirection = null;
    this.dragStart = { x: 0, y: 0 };
    this.elementStart = { x: 0, y: 0, width: 0, height: 0 };
    this.zoomLevel = 100;
    this.enabled = true;

    this.init();
  }

  /**
   * 初期化
   */
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * セットアップ
   */
  setup() {
    this.canvas = document.getElementById('slideCanvas');
    if (!this.canvas) return;

    // マウスイベント
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // キーボードイベント
    document.addEventListener('keydown', (e) => this.onKeyDown(e));

    // ズームレベル監視
    EventBus.on(Events.CANVAS_ZOOM, (level) => {
      this.zoomLevel = level;
    });

    // スライド変更時に選択解除して、ドラッグ可能要素を再設定し、レイアウトを適用
    EventBus.on(Events.SLIDE_SELECTED, (index, slide) => {
      this.deselect();
      setTimeout(() => {
        // SlideManagerから最新のスライドを取得（確実に最新のlayoutを反映）
        const currentSlide = SlideManager.getSlide(index);
        this.makeDraggable();
        this.applyLayout(currentSlide);
      }, 50);
    });

    // スライド更新後にドラッグ可能要素を再設定
    EventBus.on(Events.SLIDE_UPDATED, () => {
      setTimeout(() => this.makeDraggable(), 50);
    });

    EventBus.on(Events.DATA_LOADED, () => {
      setTimeout(() => this.makeDraggable(), 100);
    });

    // 初期化
    setTimeout(() => this.makeDraggable(), 200);
  }

  /**
   * スライド内の要素をドラッグ可能にする
   */
  makeDraggable() {
    if (!this.canvas) return;

    // ドラッグ可能な要素を探す
    const draggableSelectors = [
      '.slide-header',
      '.slide-content',
      '.main-title',
      '.main-subtitle',
      '.meta-info',
      '.slide-title',
      '.slide-subhead',
      '.section-title',         // セクションスライドタイトル
      '.section-number',        // セクション番号
      '.points-list',
      '.compare-container',
      '.compare-column',
      '.cards-container',
      '.card',
      '.timeline-container',
      '.timeline-item',
      '.agenda-list',
      '.agenda-item',
      '.list-item',             // 箇条書き項目
      'table',
      '.table-row',             // テーブル行
      'th',                     // テーブルヘッダーセル
      '.slide-footer-company',  // 会社名（左下）
      '.slide-footer-page',     // ページ番号（右下）
      // リッチコンポーネント - コンテナ
      '.process-container',     // プロセスフロー全体
      '.matrix-container',      // マトリクス全体
      '.kpi-container',         // KPI全体
      '.roadmap-container',     // ロードマップ全体
      '.quote-container',       // 引用全体
      '.icon-cards-container',  // アイコンカード全体
      // リッチコンポーネント - 個別要素
      '.process-step',          // プロセス各ステップ
      '.process-step-title',    // ステップタイトル
      '.process-step-desc',     // ステップ説明
      '.matrix-quadrant',       // マトリクス各象限
      '.quadrant-title',        // 象限タイトル
      '.kpi-card',              // KPI各カード
      '.kpi-icon',              // KPIアイコン
      '.kpi-value',             // KPI数値
      '.kpi-label',             // KPIラベル
      '.roadmap-row',           // ロードマップ各行
      '.quote-text',            // 引用テキスト
      '.icon-card',             // アイコンカード各カード
      '.icon-card-icon',        // カードアイコン
      '.icon-card-title',       // カードタイトル
      '.icon-card-desc'         // カード説明
    ];

    draggableSelectors.forEach(selector => {
      const elements = this.canvas.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.dataset.draggableInit) {
          el.dataset.draggableInit = 'true';
          el.classList.add('draggable-element');
        }
      });
    });
  }

  /**
   * マウスダウン
   */
  onMouseDown(e) {
    if (!this.enabled) return;

    // 編集中のテキストフィールドは除外
    if (e.target.contentEditable === 'true' || e.target.classList.contains('editing')) {
      return;
    }

    const resizeHandle = e.target.closest('.element-resize-handle');
    if (resizeHandle && this.selectedElement) {
      this.startResize(e, resizeHandle);
      return;
    }

    const draggableEl = e.target.closest('.draggable-element');
    if (draggableEl) {
      e.preventDefault();
      this.selectElement(draggableEl);
      this.startDrag(e, draggableEl);
    } else if (!e.target.closest('.element-resize-handle')) {
      // 空白クリックで選択解除
      this.deselect();
    }
  }

  /**
   * マウス移動
   */
  onMouseMove(e) {
    if (this.isDragging) {
      this.drag(e);
    } else if (this.isResizing) {
      this.resize(e);
    }
  }

  /**
   * マウスアップ
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
   * キーボード処理
   */
  onKeyDown(e) {
    if (!this.selectedElement) return;

    const isEditing = document.activeElement.tagName === 'INPUT' ||
                      document.activeElement.tagName === 'TEXTAREA' ||
                      document.activeElement.contentEditable === 'true';
    if (isEditing) return;

    // 矢印キーで微調整
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      this.nudge(e.key, step);
    }

    // Escapeで選択解除
    if (e.key === 'Escape') {
      this.deselect();
    }

    // DeleteまたはBackspaceで要素を削除
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSelectedElement();
    }
  }

  /**
   * 選択中の要素を削除
   */
  deleteSelectedElement() {
    if (!this.selectedElement) return;

    const elementKey = this.getElementKey(this.selectedElement);
    const elementType = this.getElementType(this.selectedElement);

    // 削除不可の要素をチェック（スライド全体の構造要素）
    // headerやcontentなど、スライドの基本構造に関わる要素は削除不可
    const undeletableTypes = [
      'header', 'content', 'slide-header', 'slide-content',
      'title', 'mainTitle', 'subtitle', 'subhead', 'meta',  // タイトル系
      'points', 'compare', 'cards', 'timeline', 'agenda',   // コンテナ系
      'process', 'matrix', 'kpi', 'roadmap', 'quote', 'iconCards', // リッチコンテナ
      'table'  // テーブル全体
    ];

    if (undeletableTypes.includes(elementType)) {
      Utils.log('DragDropEditor', `この要素は削除できません: ${elementType}`);
      console.warn(`削除不可: ${elementType} (key: ${elementKey})`);
      return;
    }

    // 要素をDOMから削除
    const elementToRemove = this.selectedElement;
    this.deselect();
    elementToRemove.remove();

    // レイアウトデータから削除
    const currentSlide = SlideManager.getCurrentSlide();
    if (currentSlide && currentSlide.layout && currentSlide.layout[elementKey]) {
      const newLayout = { ...currentSlide.layout };
      delete newLayout[elementKey];
      SlideManager.updateCurrentSlide({ layout: newLayout }, true);
    }

    // 削除された要素をスライドデータからも削除（データ同期）
    this.removeElementFromSlideData(elementType, elementKey);

    // サムネイルを更新
    this.updateThumbnail(SlideManager.currentIndex);

    Utils.log('DragDropEditor', `要素を削除しました: ${elementKey}`);
  }

  /**
   * スライドデータから要素を削除
   */
  removeElementFromSlideData(elementType, elementKey) {
    const currentSlide = SlideManager.getCurrentSlide();
    if (!currentSlide) {
      console.warn('removeElementFromSlideData: currentSlide is null');
      return;
    }
    if (!currentSlide.data) {
      console.warn('removeElementFromSlideData: currentSlide.data is null');
      return;
    }

    // インデックス付きキーをパース（例: card_1 -> type: card, index: 1）
    const match = elementKey.match(/^(.+)_(\d+)$/);
    const baseType = match ? match[1] : elementType;
    const index = match ? parseInt(match[2], 10) : null;

    Utils.log('DragDropEditor', `removeElementFromSlideData: type=${elementType}, key=${elementKey}, baseType=${baseType}, index=${index}`);

    // 配列データの対応マップ（親要素タイプ -> フィールド名）
    const arrayFieldMap = {
      'card': 'items',
      'timelineItem': 'milestones',
      'agendaItem': 'items',
      'listItem': 'points',       // 箇条書き項目 -> pointsまたはitems
      'processStep': 'steps',
      'kpiCard': 'metrics',
      'quadrant': 'quadrants',
      'roadmapRow': 'phases',
      'iconCard': 'items',
      'tableRow': 'rows',
      'column': null  // 特殊処理が必要
    };

    // 子要素から親要素へのマッピング（子要素タイプ -> 親要素タイプ）
    const childToParentMap = {
      'kpiValue': 'kpiCard',
      'kpiLabel': 'kpiCard',
      'kpiIcon': 'kpiCard',
      'processStepTitle': 'processStep',
      'processStepDesc': 'processStep',
      'quadrantTitle': 'quadrant',
      'iconCardIcon': 'iconCard',
      'iconCardTitle': 'iconCard',
      'iconCardDesc': 'iconCard'
    };

    // 子要素の場合は、親要素のデータ内のプロパティを削除
    if (childToParentMap[baseType]) {
      // 子要素の削除は、親要素のプロパティをnullにする
      const parentType = childToParentMap[baseType];
      const parentFieldName = arrayFieldMap[parentType];

      if (parentFieldName && currentSlide.data[parentFieldName] && index !== null) {
        const newArray = [...currentSlide.data[parentFieldName]];
        if (newArray[index]) {
          // 子要素のフィールド名を特定
          const childFieldMap = {
            'kpiValue': 'value',
            'kpiLabel': 'label',
            'kpiIcon': 'icon',
            'processStepTitle': 'title',
            'processStepDesc': 'desc',
            'quadrantTitle': 'title',
            'iconCardIcon': 'icon',
            'iconCardTitle': 'title',
            'iconCardDesc': 'desc'
          };
          const childField = childFieldMap[baseType];
          if (childField) {
            newArray[index] = { ...newArray[index] };
            delete newArray[index][childField];
            SlideManager.updateCurrentSlide({
              data: { ...currentSlide.data, [parentFieldName]: newArray }
            });
          }
        }
      }
      return;
    }

    // 親要素（カード全体など）の削除
    let fieldName = arrayFieldMap[baseType];

    // listItem の場合は points または items のどちらかを探す
    if (baseType === 'listItem') {
      if (currentSlide.data.points) {
        fieldName = 'points';
      } else if (currentSlide.data.items) {
        fieldName = 'items';
      }
    }

    if (fieldName && currentSlide.data[fieldName] && index !== null) {
      const newArray = [...currentSlide.data[fieldName]];
      if (index >= 0 && index < newArray.length) {
        newArray.splice(index, 1);

        // 配列が空になった場合は削除しない（最低1つは残す）
        if (newArray.length === 0) {
          Utils.log('DragDropEditor', '配列が空になるため削除をスキップ');
          console.warn('Cannot delete: array would become empty');
          return;
        }

        // データ更新は data のみを変更（slides 全体を触らない）
        const updatedData = { ...currentSlide.data, [fieldName]: newArray };
        SlideManager.updateCurrentSlide({ data: updatedData }, false);
        Utils.log('DragDropEditor', `配列要素を削除: ${fieldName}[${index}]`);
      }
    } else {
      Utils.log('DragDropEditor', `削除対象のフィールドが見つかりません: ${fieldName}`);
    }
  }

  /**
   * 要素を選択
   */
  selectElement(el) {
    this.deselect();
    this.selectedElement = el;
    el.classList.add('element-selected');
    this.addResizeHandles(el);
  }

  /**
   * 選択解除
   */
  deselect() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('element-selected');
      this.removeResizeHandles();
      this.selectedElement = null;
    }
  }

  /**
   * リサイズハンドル追加
   */
  addResizeHandles(el) {
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `element-resize-handle handle-${pos}`;
      handle.dataset.direction = pos;
      el.appendChild(handle);
    });
  }

  /**
   * リサイズハンドル削除
   */
  removeResizeHandles() {
    if (this.selectedElement) {
      const handles = this.selectedElement.querySelectorAll('.element-resize-handle');
      handles.forEach(h => h.remove());
    }
  }

  /**
   * ドラッグ開始
   */
  startDrag(e, el) {
    this.isDragging = true;
    this.hasMoved = false; // ドラッグで実際に移動したかどうか

    const scale = this.zoomLevel / 100;
    this.dragStart = {
      x: e.clientX,
      y: e.clientY
    };

    // 現在の位置を取得（transformまたはposition）
    const style = window.getComputedStyle(el);
    const transform = style.transform;

    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      this.elementStart = {
        x: matrix.e,
        y: matrix.f
      };
    } else {
      // 位置が設定されていない場合は0から開始
      this.elementStart = {
        x: parseFloat(el.dataset.translateX) || 0,
        y: parseFloat(el.dataset.translateY) || 0
      };
    }

    document.body.style.cursor = 'grabbing';
    el.style.cursor = 'grabbing';
    el.classList.add('dragging');
  }

  /**
   * ドラッグ中
   */
  drag(e) {
    if (!this.isDragging || !this.selectedElement) return;

    const scale = this.zoomLevel / 100;
    const deltaX = (e.clientX - this.dragStart.x) / scale;
    const deltaY = (e.clientY - this.dragStart.y) / scale;

    // 移動量が閾値を超えたら移動開始
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.hasMoved = true;
    }

    if (!this.hasMoved) return;

    const newX = this.elementStart.x + deltaX;
    const newY = this.elementStart.y + deltaY;

    // transform で移動
    this.selectedElement.style.transform = `translate(${newX}px, ${newY}px)`;
    this.selectedElement.dataset.translateX = newX;
    this.selectedElement.dataset.translateY = newY;
  }

  /**
   * ドラッグ終了
   */
  endDrag() {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.body.style.cursor = '';

    if (this.selectedElement) {
      this.selectedElement.style.cursor = '';
      this.selectedElement.classList.remove('dragging');
      // 実際に移動した場合のみ保存
      if (this.hasMoved) {
        this.saveElementPosition();
      }
    }
    this.hasMoved = false;
  }

  /**
   * リサイズ開始
   */
  startResize(e, handle) {
    this.isResizing = true;
    this.resizeDirection = handle.dataset.direction;

    const scale = this.zoomLevel / 100;
    this.dragStart = {
      x: e.clientX,
      y: e.clientY
    };

    const rect = this.selectedElement.getBoundingClientRect();
    this.elementStart = {
      x: parseFloat(this.selectedElement.dataset.translateX) || 0,
      y: parseFloat(this.selectedElement.dataset.translateY) || 0,
      width: rect.width / scale,
      height: rect.height / scale
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
    const minSize = 50;

    switch (this.resizeDirection) {
      case 'se':
        width = Math.max(minSize, width + deltaX);
        height = Math.max(minSize, height + deltaY);
        break;
      case 'sw':
        x += deltaX;
        width = Math.max(minSize, width - deltaX);
        height = Math.max(minSize, height + deltaY);
        break;
      case 'ne':
        y += deltaY;
        width = Math.max(minSize, width + deltaX);
        height = Math.max(minSize, height - deltaY);
        break;
      case 'nw':
        x += deltaX;
        y += deltaY;
        width = Math.max(minSize, width - deltaX);
        height = Math.max(minSize, height - deltaY);
        break;
      case 'n':
        y += deltaY;
        height = Math.max(minSize, height - deltaY);
        break;
      case 's':
        height = Math.max(minSize, height + deltaY);
        break;
      case 'e':
        width = Math.max(minSize, width + deltaX);
        break;
      case 'w':
        x += deltaX;
        width = Math.max(minSize, width - deltaX);
        break;
    }

    this.selectedElement.style.transform = `translate(${x}px, ${y}px)`;
    this.selectedElement.style.width = `${width}px`;
    this.selectedElement.style.height = `${height}px`;
    this.selectedElement.dataset.translateX = x;
    this.selectedElement.dataset.translateY = y;
  }

  /**
   * リサイズ終了
   */
  endResize() {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.resizeDirection = null;
    this.saveElementPosition();
  }

  /**
   * 微調整移動
   */
  nudge(direction, step) {
    if (!this.selectedElement) return;

    let x = parseFloat(this.selectedElement.dataset.translateX) || 0;
    let y = parseFloat(this.selectedElement.dataset.translateY) || 0;

    switch (direction) {
      case 'ArrowUp': y -= step; break;
      case 'ArrowDown': y += step; break;
      case 'ArrowLeft': x -= step; break;
      case 'ArrowRight': x += step; break;
    }

    this.selectedElement.style.transform = `translate(${x}px, ${y}px)`;
    this.selectedElement.dataset.translateX = x;
    this.selectedElement.dataset.translateY = y;
    this.saveElementPosition();
  }

  /**
   * 要素の位置を保存
   */
  saveElementPosition() {
    if (!this.selectedElement) return;

    const x = parseFloat(this.selectedElement.dataset.translateX) || 0;
    const y = parseFloat(this.selectedElement.dataset.translateY) || 0;
    const width = parseFloat(this.selectedElement.style.width) || null;
    const height = parseFloat(this.selectedElement.style.height) || null;

    // 要素のキーを取得（同じタイプの要素が複数ある場合はインデックス付き）
    const elementKey = this.getElementKey(this.selectedElement);

    // スライドのlayoutデータに位置を保存
    const currentSlide = SlideManager.getCurrentSlide();
    if (currentSlide) {
      // 既存のlayoutをコピーして新しいオブジェクトを作成
      const newLayout = { ...(currentSlide.layout || {}) };
      newLayout[elementKey] = { x, y, width, height };

      SlideManager.updateCurrentSlide({ layout: newLayout }, true); // true = サイレント更新

      // サムネイルを更新（キャンバス再レンダリングは避ける）
      this.updateThumbnail(SlideManager.currentIndex);
    }
  }

  /**
   * 特定スライドのサムネイルを更新
   * @param {number} index
   */
  updateThumbnail(index) {
    const pageList = document.getElementById('pageList');
    if (!pageList) return;

    const pageItem = pageList.querySelector(`.page-item[data-index="${index}"]`);
    if (!pageItem) return;

    const thumbnail = pageItem.querySelector('.page-thumbnail');
    if (!thumbnail) return;

    const slide = SlideManager.getSlide(index);
    const settings = SlideManager.getSettings();

    // サムネイルを再レンダリング
    thumbnail.innerHTML = '';
    const preview = SlideRenderer.renderThumbnail(slide, settings, 0.15);
    thumbnail.appendChild(preview);
  }

  /**
   * 要素のユニークキーを取得（複数要素対応）
   */
  getElementKey(el) {
    const baseType = this.getElementType(el);

    // 同じタイプの要素が複数あるか確認
    const selector = this.getSelector(baseType);
    const allElements = this.canvas.querySelectorAll(selector);

    if (allElements.length > 1) {
      // インデックスを付与
      const index = Array.from(allElements).indexOf(el);
      return `${baseType}_${index}`;
    }

    return baseType;
  }

  /**
   * 要素タイプを取得
   */
  getElementType(el) {
    // table要素の場合は特別扱い
    if (el.tagName === 'TABLE') {
      return 'table';
    }
    // th要素の場合
    if (el.tagName === 'TH') {
      return 'tableHeader';
    }
    // tr要素（テーブル行）の場合
    if (el.tagName === 'TR' && el.classList.contains('table-row')) {
      return 'tableRow';
    }
    // li要素（リスト項目）の場合
    if (el.tagName === 'LI' && el.classList.contains('list-item')) {
      return 'listItem';
    }

    const classes = el.className.split(' ');
    const typeMap = {
      'slide-header': 'header',
      'table-row': 'tableRow',
      'list-item': 'listItem',
      'slide-content': 'content',
      'main-title': 'mainTitle',
      'main-subtitle': 'subtitle',
      'meta-info': 'meta',
      'slide-title': 'title',
      'slide-subhead': 'subhead',
      'section-title': 'sectionTitle',
      'section-number': 'sectionNumber',
      'points-list': 'points',
      'compare-container': 'compare',
      'compare-column': 'column',
      'cards-container': 'cards',
      'card': 'card',
      'timeline-container': 'timeline',
      'timeline-item': 'timelineItem',
      'agenda-list': 'agenda',
      'agenda-item': 'agendaItem',
      'slide-footer-company': 'footerCompany',
      'slide-footer-page': 'footerPage',
      // リッチコンポーネント - コンテナ
      'process-container': 'process',
      'matrix-container': 'matrix',
      'kpi-container': 'kpi',
      'roadmap-container': 'roadmap',
      'quote-container': 'quote',
      'icon-cards-container': 'iconCards',
      // リッチコンポーネント - 個別要素
      'process-step': 'processStep',
      'process-step-title': 'processStepTitle',
      'process-step-desc': 'processStepDesc',
      'matrix-quadrant': 'quadrant',
      'quadrant-title': 'quadrantTitle',
      'kpi-card': 'kpiCard',
      'kpi-icon': 'kpiIcon',
      'kpi-value': 'kpiValue',
      'kpi-label': 'kpiLabel',
      'roadmap-row': 'roadmapRow',
      'quote-text': 'quoteText',
      'icon-card': 'iconCard',
      'icon-card-icon': 'iconCardIcon',
      'icon-card-title': 'iconCardTitle',
      'icon-card-desc': 'iconCardDesc'
    };

    for (const cls of classes) {
      if (typeMap[cls]) {
        return typeMap[cls];
      }
    }
    return 'unknown';
  }

  /**
   * レイアウトを適用
   */
  applyLayout(slide) {
    if (!slide || !slide.layout) return;

    Object.entries(slide.layout).forEach(([key, pos]) => {
      const el = this.getElementByKey(key);
      if (el && pos) {
        if (pos.x !== undefined || pos.y !== undefined) {
          el.style.transform = `translate(${pos.x || 0}px, ${pos.y || 0}px)`;
          el.dataset.translateX = pos.x || 0;
          el.dataset.translateY = pos.y || 0;
        }
        if (pos.width) el.style.width = `${pos.width}px`;
        if (pos.height) el.style.height = `${pos.height}px`;
      }
    });
  }

  /**
   * キーから要素を取得（インデックス付きキーに対応）
   */
  getElementByKey(key) {
    // インデックス付きキーかチェック（例: column_0, column_1）
    const match = key.match(/^(.+)_(\d+)$/);
    if (match) {
      const baseType = match[1];
      const index = parseInt(match[2], 10);
      const selector = this.getSelector(baseType);
      const elements = this.canvas.querySelectorAll(selector);
      return elements[index] || null;
    }

    // 通常のキー
    const selector = this.getSelector(key);
    return this.canvas.querySelector(selector);
  }

  /**
   * タイプからセレクタを取得
   */
  getSelector(type) {
    const selectorMap = {
      'header': '.slide-header',
      'content': '.slide-content',
      'mainTitle': '.main-title',
      'subtitle': '.main-subtitle',
      'meta': '.meta-info',
      'title': '.slide-title',
      'subhead': '.slide-subhead',
      'sectionTitle': '.section-title',
      'sectionNumber': '.section-number',
      'points': '.points-list',
      'compare': '.compare-container',
      'column': '.compare-column',
      'cards': '.cards-container',
      'card': '.card',
      'timeline': '.timeline-container',
      'timelineItem': '.timeline-item',
      'agenda': '.agenda-list',
      'agendaItem': '.agenda-item',
      'listItem': '.list-item',
      'table': 'table',
      'tableRow': '.table-row',
      'tableHeader': 'th',
      'footerCompany': '.slide-footer-company',
      'footerPage': '.slide-footer-page',
      // リッチコンポーネント - コンテナ
      'process': '.process-container',
      'matrix': '.matrix-container',
      'kpi': '.kpi-container',
      'roadmap': '.roadmap-container',
      'quote': '.quote-container',
      'iconCards': '.icon-cards-container',
      // リッチコンポーネント - 個別要素
      'processStep': '.process-step',
      'processStepTitle': '.process-step-title',
      'processStepDesc': '.process-step-desc',
      'quadrant': '.matrix-quadrant',
      'quadrantTitle': '.quadrant-title',
      'kpiCard': '.kpi-card',
      'kpiIcon': '.kpi-icon',
      'kpiValue': '.kpi-value',
      'kpiLabel': '.kpi-label',
      'roadmapRow': '.roadmap-row',
      'quoteText': '.quote-text',
      'iconCard': '.icon-card',
      'iconCardIcon': '.icon-card-icon',
      'iconCardTitle': '.icon-card-title',
      'iconCardDesc': '.icon-card-desc'
    };
    return selectorMap[type] || `.${type}`;
  }
}

// シングルトンインスタンス
const dragDropEditor = new DragDropEditor();

// グローバルに公開
window.DragDropEditor = dragDropEditor;

})();
