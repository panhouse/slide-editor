/**
 * PageList.js - ページ一覧サイドバー
 * PanHouse Slide Editor
 */

class PageList {
  constructor() {
    this.container = document.getElementById('pageList');
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
    // スライド追加ボタン
    const addBtn = document.getElementById('addPageBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addNewSlide());
    }

    // イベントバスからの購読
    EventBus.on(Events.SLIDE_ADDED, () => this.render());
    EventBus.on(Events.SLIDE_REMOVED, () => this.render());
    EventBus.on(Events.SLIDE_UPDATED, () => this.render());
    EventBus.on(Events.SLIDE_SELECTED, (index) => this.updateSelection(index));
    EventBus.on(Events.SLIDE_REORDERED, () => this.render());
    EventBus.on(Events.DATA_LOADED, () => this.render());

    // キーボードイベント（Delete/Backspaceでスライド削除）
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  /**
   * キーボードイベント処理
   * @param {KeyboardEvent} e
   */
  onKeyDown(e) {
    // 入力フィールドにフォーカスがある場合は無視
    const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                           document.activeElement.tagName === 'TEXTAREA' ||
                           document.activeElement.contentEditable === 'true';
    if (isInputFocused) return;

    // キャンバス内の要素が選択されている場合は無視（DragDropEditorが処理）
    const selectedElement = document.querySelector('.element-selected');
    if (selectedElement) return;

    // Delete/Backspaceでのスライド削除は、サムネイルがフォーカスされている場合のみ
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // サムネイルがフォーカスされているか、またはサイドバー内にフォーカスがある場合のみ
      const activeElement = document.activeElement;
      const isPageListFocused = this.container && this.container.contains(activeElement);
      const isPageItemActive = this.container && this.container.querySelector('.page-item.active:focus');
      const isSidebarFocused = activeElement.closest('.sidebar-left');

      // サムネイルが明示的に選択されている場合のみページ削除
      if (isPageListFocused || isPageItemActive || isSidebarFocused) {
        e.preventDefault();
        this.deleteCurrentSlide();
      }
      // それ以外の場合は何もしない（キャンバスエリアでの要素削除はDragDropEditorが処理）
    }
  }

  /**
   * 現在選択中のスライドを削除
   */
  deleteCurrentSlide() {
    const currentIndex = SlideManager.currentIndex;
    const slideCount = SlideManager.getSlideCount();

    // 最後の1枚は削除できない
    if (slideCount <= 1) {
      Utils.log('PageList', '最後のスライドは削除できません', 'warn');
      return;
    }

    // 確認ダイアログ
    if (confirm(`スライド ${currentIndex + 1} を削除しますか？`)) {
      SlideManager.removeSlide(currentIndex);
      Utils.log('PageList', `スライド ${currentIndex + 1} を削除しました`);
    }
  }

  /**
   * ページ一覧をレンダリング
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    const slides = SlideManager.getSlides();
    const settings = SlideManager.getSettings();
    const currentIndex = SlideManager.currentIndex;

    slides.forEach((slide, index) => {
      const item = this.createPageItem(slide, index, settings, index === currentIndex);
      this.container.appendChild(item);
    });
  }

  /**
   * ページアイテムを作成
   * @param {Object} slide
   * @param {number} index
   * @param {Object} settings
   * @param {boolean} isActive
   * @returns {HTMLElement}
   */
  createPageItem(slide, index, settings, isActive) {
    const item = document.createElement('div');
    item.className = `page-item ${isActive ? 'active' : ''}`;
    item.dataset.index = index;
    item.tabIndex = 0; // フォーカス可能にする（Delete キー処理のため）

    // サムネイル
    const thumbnail = document.createElement('div');
    thumbnail.className = 'page-thumbnail';

    // スライドをサムネイルとしてレンダリング
    const preview = SlideRenderer.renderThumbnail(slide, settings, 0.15);
    thumbnail.appendChild(preview);

    item.appendChild(thumbnail);

    // ページ番号
    const pageNumber = document.createElement('span');
    pageNumber.className = 'page-number';
    pageNumber.textContent = index + 1;
    item.appendChild(pageNumber);

    // クリックイベント
    item.addEventListener('click', () => {
      SlideManager.selectSlide(index);
      item.focus(); // クリック時にフォーカスを設定（Deleteキー処理のため）
    });

    // コンテキストメニュー（右クリック）
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, index);
    });

    return item;
  }

  /**
   * 選択状態を更新
   * @param {number} selectedIndex
   */
  updateSelection(selectedIndex) {
    if (!this.container) return;

    const items = this.container.querySelectorAll('.page-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === selectedIndex);
    });

    // 選択されたアイテムをスクロールして表示
    const selectedItem = this.container.querySelector('.page-item.active');
    if (selectedItem) {
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * サムネイルがクリックされたときにフォーカスを設定
   * @param {number} index
   */
  focusThumbnail(index) {
    const item = this.container.querySelector(`.page-item[data-index="${index}"]`);
    if (item) {
      item.focus();
    }
  }

  /**
   * 新しいスライドを追加
   */
  addNewSlide() {
    const newSlide = SlideManager.addSlide({
      type: 'content',
      title: '新しいスライド',
      points: []
    });

    // 追加したスライドを選択
    SlideManager.selectSlide(SlideManager.getSlideCount() - 1);
  }

  /**
   * コンテキストメニューを表示
   * @param {MouseEvent} e
   * @param {number} index
   */
  showContextMenu(e, index) {
    // 既存のメニューを削除
    this.hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${e.clientY}px;
      left: ${e.clientX}px;
      background: var(--bg-sidebar);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 3000;
      padding: 4px;
      min-width: 120px;
    `;

    const actions = [
      { label: '複製', action: () => SlideManager.duplicateSlide(index) },
      { label: '削除', action: () => SlideManager.removeSlide(index) }
    ];

    actions.forEach(({ label, action }) => {
      const btn = document.createElement('button');
      btn.className = 'dropdown-item';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        action();
        this.hideContextMenu();
      });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    // クリックで閉じる
    setTimeout(() => {
      document.addEventListener('click', () => this.hideContextMenu(), { once: true });
    }, 0);
  }

  /**
   * コンテキストメニューを非表示
   */
  hideContextMenu() {
    const existing = document.querySelector('.context-menu');
    if (existing) {
      existing.remove();
    }
  }
}

// グローバルに公開
window.PageList = PageList;
