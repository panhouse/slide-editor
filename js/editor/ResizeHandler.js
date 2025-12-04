/**
 * ResizeHandler.js - サイドバー・スピーカーノートのリサイズ機能
 * PanHouse Slide Editor
 */

(function() {

class ResizeHandler {
  constructor() {
    this.sidebar = null;
    this.sidebarHandle = null;
    this.speakerNotes = null;
    this.speakerNotesHandle = null;

    this.isResizingSidebar = false;
    this.isResizingNotes = false;
    this.startX = 0;
    this.startY = 0;
    this.startWidth = 0;
    this.startHeight = 0;

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // サイドバー
    this.sidebar = document.getElementById('sidebarLeft');
    this.sidebarHandle = document.getElementById('sidebarResizeHandle');

    // スピーカーノート
    this.speakerNotes = document.getElementById('speakerNotesPanel');
    this.speakerNotesHandle = document.getElementById('speakerNotesResizeHandle');

    if (this.sidebarHandle) {
      this.sidebarHandle.addEventListener('mousedown', (e) => this.startSidebarResize(e));
    }

    if (this.speakerNotesHandle) {
      this.speakerNotesHandle.addEventListener('mousedown', (e) => this.startNotesResize(e));
    }

    // グローバルイベント
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());

    // LocalStorageから復元
    this.restoreFromStorage();
  }

  /**
   * サイドバーのリサイズ開始
   */
  startSidebarResize(e) {
    e.preventDefault();
    this.isResizingSidebar = true;
    this.startX = e.clientX;
    this.startWidth = this.sidebar.offsetWidth;
    this.sidebarHandle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  /**
   * スピーカーノートのリサイズ開始
   */
  startNotesResize(e) {
    e.preventDefault();
    this.isResizingNotes = true;
    this.startY = e.clientY;
    this.startHeight = this.speakerNotes.offsetHeight;
    this.speakerNotesHandle.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    // collapsed状態を解除
    this.speakerNotes.classList.remove('collapsed');
  }

  /**
   * マウス移動
   */
  onMouseMove(e) {
    if (this.isResizingSidebar) {
      const deltaX = e.clientX - this.startX;
      const newWidth = Math.max(120, Math.min(300, this.startWidth + deltaX));
      this.sidebar.style.width = `${newWidth}px`;

      // サムネイルのスケールを再計算
      this.updateThumbnailScale(newWidth);
    }

    if (this.isResizingNotes) {
      const deltaY = this.startY - e.clientY; // 上にドラッグで大きくなる
      const newHeight = Math.max(40, Math.min(400, this.startHeight + deltaY));
      this.speakerNotes.style.height = `${newHeight}px`;
    }
  }

  /**
   * マウスアップ
   */
  onMouseUp() {
    if (this.isResizingSidebar) {
      this.isResizingSidebar = false;
      this.sidebarHandle.classList.remove('dragging');
      this.saveToStorage();
    }

    if (this.isResizingNotes) {
      this.isResizingNotes = false;
      this.speakerNotesHandle.classList.remove('dragging');
      this.saveToStorage();
    }

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  /**
   * サムネイルのスケールを更新
   * CSS変数を使って全サムネイルに適用
   */
  updateThumbnailScale(sidebarWidth) {
    // サイドバー幅 - padding(16px) - border(4px) = 利用可能幅
    const availableWidth = sidebarWidth - 20;
    const scale = availableWidth / 960;

    // CSS変数でスケールを設定（全サムネイルに自動適用）
    document.documentElement.style.setProperty('--thumbnail-scale', scale);
  }

  /**
   * LocalStorageに保存
   */
  saveToStorage() {
    try {
      const data = {
        sidebarWidth: this.sidebar ? this.sidebar.offsetWidth : 180,
        notesHeight: this.speakerNotes ? this.speakerNotes.offsetHeight : 120
      };
      localStorage.setItem('panhouse_editor_layout', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save layout:', e);
    }
  }

  /**
   * LocalStorageから復元
   */
  restoreFromStorage() {
    try {
      const saved = localStorage.getItem('panhouse_editor_layout');
      if (saved) {
        const data = JSON.parse(saved);

        if (data.sidebarWidth && this.sidebar) {
          this.sidebar.style.width = `${data.sidebarWidth}px`;
          this.updateThumbnailScale(data.sidebarWidth);
        }

        if (data.notesHeight && this.speakerNotes) {
          this.speakerNotes.style.height = `${data.notesHeight}px`;
        }
      }
    } catch (e) {
      console.warn('Failed to restore layout:', e);
    }
  }
}

// シングルトンインスタンス
const resizeHandler = new ResizeHandler();

// グローバルに公開
window.ResizeHandler = resizeHandler;

})();
