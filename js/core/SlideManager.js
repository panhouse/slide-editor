/**
 * SlideManager.js - スライドデータ管理
 * PanHouse Slide Editor
 */

(function() {

class SlideManager {
  constructor() {
    this.settings = {
      title: '無題のプレゼンテーション',
      theme: 'panhouse',
      aspectRatio: '16:9',
      companyName: '株式会社パンハウス',
      footerText: ''
    };
    this.slides = [];
    this.currentIndex = 0;
    this.storageKey = 'panhouse_slide_editor_data';
    this.autoSaveDelay = 500; // ms
    this.autoSaveTimer = null;

    // Undo/Redo 履歴管理
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    this.isUndoRedo = false; // Undo/Redo操作中フラグ
  }

  /**
   * 初期化（新規プレゼンテーション or LocalStorageから復元）
   * @returns {boolean} LocalStorageから復元できたか
   */
  init() {
    // LocalStorageから復元を試みる
    if (this.loadFromStorage()) {
      Utils.log('SlideManager', 'Restored from LocalStorage');
      return true;
    }

    // 復元できない場合は新規作成
    this.slides = [];
    this.currentIndex = 0;
    this.addSlide({
      type: 'title',
      title: 'プレゼンテーションタイトル',
      subtitle: 'サブタイトル',
      date: Utils.formatDate()
    });

    // 履歴を初期化
    this.clearHistory();

    return false;
  }

  /**
   * LocalStorageから復元
   * @returns {boolean} 復元成功したか
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return false;

      const data = JSON.parse(saved);
      if (!data || !data.slides || data.slides.length === 0) return false;

      this.loadFromJson(data);
      return true;
    } catch (e) {
      console.warn('Failed to load from LocalStorage:', e);
      return false;
    }
  }

  /**
   * LocalStorageに保存
   */
  saveToStorage() {
    try {
      const data = this.getFullData();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      Utils.log('SlideManager', 'Auto-saved to LocalStorage');
    } catch (e) {
      console.warn('Failed to save to LocalStorage:', e);
    }
  }

  /**
   * 自動保存をスケジュール（デバウンス）
   */
  scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.saveToStorage();
    }, this.autoSaveDelay);

    // Undo/Redo操作中でなければ履歴に追加
    if (!this.isUndoRedo) {
      this.saveToHistory();
    }
  }

  /**
   * 現在の状態を履歴に保存
   */
  saveToHistory() {
    const state = JSON.stringify(this.getFullData());

    // 現在位置より先の履歴を削除（新しい操作をした場合）
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 同じ状態なら追加しない
    if (this.history.length > 0 && this.history[this.history.length - 1] === state) {
      return;
    }

    this.history.push(state);

    // 最大サイズを超えたら古いものを削除
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    // Undo/Redo可能状態を通知
    EventBus.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  /**
   * Undoが可能か
   * @returns {boolean}
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Redoが可能か
   * @returns {boolean}
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Undo（元に戻す）
   */
  undo() {
    if (!this.canUndo()) return;

    this.isUndoRedo = true;
    this.historyIndex--;

    const state = JSON.parse(this.history[this.historyIndex]);
    const preservedIndex = this.currentIndex; // 現在のページ位置を保持
    this.restoreState(state, preservedIndex);

    this.isUndoRedo = false;

    EventBus.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });

    Utils.log('SlideManager', `Undo (${this.historyIndex + 1}/${this.history.length})`);
  }

  /**
   * Redo（やり直し）
   */
  redo() {
    if (!this.canRedo()) return;

    this.isUndoRedo = true;
    this.historyIndex++;

    const state = JSON.parse(this.history[this.historyIndex]);
    const preservedIndex = this.currentIndex; // 現在のページ位置を保持
    this.restoreState(state, preservedIndex);

    this.isUndoRedo = false;

    EventBus.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });

    Utils.log('SlideManager', `Redo (${this.historyIndex + 1}/${this.history.length})`);
  }

  /**
   * 状態を復元
   * @param {Object} state
   * @param {number|null} preservedIndex - 保持したいページ位置（nullの場合はstateのcurrentIndexを使用）
   */
  restoreState(state, preservedIndex = null) {
    // 設定を復元
    if (state.settings) {
      this.settings = state.settings;
    }

    // スライドを復元
    this.slides = [];
    if (state.slides && Array.isArray(state.slides)) {
      state.slides.forEach(slideData => {
        this.addSlide(slideData, false);
      });
    }

    // 現在のインデックスを決定（preservedIndexが指定されていればそれを優先）
    if (preservedIndex !== null) {
      this.currentIndex = preservedIndex;
    } else {
      this.currentIndex = state.currentIndex || 0;
    }

    // スライド数を超えないように調整
    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = Math.max(0, this.slides.length - 1);
    }

    // UIを更新
    EventBus.emit(Events.DATA_LOADED, this.getData());
    EventBus.emit(Events.SLIDE_SELECTED, this.currentIndex, this.getCurrentSlide());

    // LocalStorageも更新
    this.saveToStorage();
  }

  /**
   * 履歴をクリア
   */
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    // 初期状態を保存
    this.saveToHistory();
  }

  /**
   * LocalStorageをクリア（新規作成時など）
   */
  clearStorage() {
    try {
      localStorage.removeItem(this.storageKey);
      Utils.log('SlideManager', 'Cleared LocalStorage');
    } catch (e) {
      console.warn('Failed to clear LocalStorage:', e);
    }
  }

  /**
   * JSONデータを読み込み
   * @param {Object} data
   */
  loadFromJson(data) {
    // トップレベルのtitle/subtitleをsettingsにマージ
    // metadata.title, data.title, data.settings.title の順で優先
    const settingsWithTitle = {
      ...data.settings,
      title: data.metadata?.title || data.title || data.settings?.title,
      subtitle: data.metadata?.subtitle || data.subtitle || data.settings?.subtitle
    };

    // 設定を読み込み
    if (settingsWithTitle.title || settingsWithTitle.subtitle || data.settings) {
      this.settings = Utils.deepMerge(this.settings, settingsWithTitle);
    }

    // スライドを読み込み
    this.slides = [];
    if (data.slides && Array.isArray(data.slides)) {
      data.slides.forEach(slideData => {
        this.addSlide(slideData, false); // イベント発火なし
      });
    }

    this.currentIndex = 0;

    // 履歴をクリアして初期状態を保存
    this.clearHistory();

    EventBus.emit(Events.DATA_LOADED, this.getData());
    EventBus.emit(Events.SLIDE_SELECTED, this.currentIndex, this.getCurrentSlide());
  }

  /**
   * スライドを追加
   * @param {Object} data - スライドデータ
   * @param {boolean} emitEvent - イベントを発火するか
   * @returns {Object} - 追加されたスライド
   */
  addSlide(data, emitEvent = true) {
    const slide = {
      id: Utils.generateId('slide'),
      type: data.type || 'content',
      data: this._extractSlideData(data),
      elements: data.elements || [],
      notes: data.notes || '',
      layout: data.layout || {}  // レイアウト情報を保存
    };

    this.slides.push(slide);

    if (emitEvent) {
      EventBus.emit(Events.SLIDE_ADDED, slide, this.slides.length - 1);
      this.scheduleAutoSave();
    }

    return slide;
  }

  /**
   * スライドデータを抽出（typeとnotesを除く）
   * @param {Object} data
   * @returns {Object}
   */
  _extractSlideData(data) {
    const { type, notes, elements, ...rest } = data;
    return rest;
  }

  /**
   * スライドを更新
   * @param {number} index
   * @param {Object} updates
   * @param {boolean} silent - trueの場合イベントを発火しない（再レンダリングなし）
   */
  updateSlide(index, updates, silent = false) {
    if (index < 0 || index >= this.slides.length) return;

    const slide = this.slides[index];

    if (updates.type !== undefined) {
      slide.type = updates.type;
    }
    if (updates.data !== undefined) {
      slide.data = Utils.deepMerge(slide.data || {}, updates.data);
    }
    if (updates.notes !== undefined) {
      slide.notes = updates.notes;
    }
    if (updates.speakerNotes !== undefined) {
      slide.speakerNotes = updates.speakerNotes;
    }
    if (updates.elements !== undefined) {
      slide.elements = updates.elements;
    }
    if (updates.layout !== undefined) {
      // layoutの削除に対応：新しいlayoutで完全に置き換える
      slide.layout = updates.layout;
    }

    // 自動保存（silentでも保存する）
    this.scheduleAutoSave();

    if (!silent) {
      EventBus.emit(Events.SLIDE_UPDATED, slide, index);
    }
  }

  /**
   * 現在のスライドを更新
   * @param {Object} updates
   * @param {boolean} silent - trueの場合イベントを発火しない
   */
  updateCurrentSlide(updates, silent = false) {
    this.updateSlide(this.currentIndex, updates, silent);
  }

  /**
   * スライドを削除
   * @param {number} index
   */
  removeSlide(index) {
    if (index < 0 || index >= this.slides.length) return;
    if (this.slides.length <= 1) return; // 最低1枚は残す

    const removed = this.slides.splice(index, 1)[0];

    // 現在のインデックスを調整
    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = this.slides.length - 1;
    }

    EventBus.emit(Events.SLIDE_REMOVED, removed, index);
    EventBus.emit(Events.SLIDE_SELECTED, this.currentIndex, this.getCurrentSlide());
    this.scheduleAutoSave();
  }

  /**
   * スライドを複製
   * @param {number} index
   * @returns {Object}
   */
  duplicateSlide(index) {
    if (index < 0 || index >= this.slides.length) return null;

    const original = this.slides[index];
    const duplicate = Utils.deepClone(original);
    duplicate.id = Utils.generateId('slide');

    this.slides.splice(index + 1, 0, duplicate);
    EventBus.emit(Events.SLIDE_ADDED, duplicate, index + 1);
    this.scheduleAutoSave();

    return duplicate;
  }

  /**
   * スライドを移動
   * @param {number} fromIndex
   * @param {number} toIndex
   */
  moveSlide(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.slides.length) return;
    if (toIndex < 0 || toIndex >= this.slides.length) return;
    if (fromIndex === toIndex) return;

    const [slide] = this.slides.splice(fromIndex, 1);
    this.slides.splice(toIndex, 0, slide);

    // 現在のインデックスを調整
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    EventBus.emit(Events.SLIDE_REORDERED, this.slides);
    this.scheduleAutoSave();
  }

  /**
   * スライドを選択
   * @param {number} index
   */
  selectSlide(index) {
    if (index < 0 || index >= this.slides.length) return;

    this.currentIndex = index;
    EventBus.emit(Events.SLIDE_SELECTED, index, this.getCurrentSlide());
  }

  /**
   * 次のスライドへ
   */
  nextSlide() {
    if (this.currentIndex < this.slides.length - 1) {
      this.selectSlide(this.currentIndex + 1);
    }
  }

  /**
   * 前のスライドへ
   */
  prevSlide() {
    if (this.currentIndex > 0) {
      this.selectSlide(this.currentIndex - 1);
    }
  }

  /**
   * 現在のスライドを取得
   * @returns {Object|null}
   */
  getCurrentSlide() {
    return this.slides[this.currentIndex] || null;
  }

  /**
   * スライドを取得
   * @param {number} index
   * @returns {Object|null}
   */
  getSlide(index) {
    return this.slides[index] || null;
  }

  /**
   * 全スライドを取得
   * @returns {Object[]}
   */
  getSlides() {
    return this.slides;
  }

  /**
   * スライド数を取得
   * @returns {number}
   */
  getSlideCount() {
    return this.slides.length;
  }

  /**
   * 設定を更新
   * @param {Object} updates
   */
  updateSettings(updates) {
    this.settings = Utils.deepMerge(this.settings, updates);
    EventBus.emit(Events.SETTINGS_UPDATED, this.settings);

    if (updates.theme) {
      EventBus.emit(Events.THEME_CHANGED, updates.theme);
    }

    this.scheduleAutoSave();
  }

  /**
   * 設定を取得
   * @returns {Object}
   */
  getSettings() {
    return this.settings;
  }

  /**
   * エクスポート用のデータを取得（外部配布用、layoutは含まない）
   * @returns {Object}
   */
  getData() {
    return {
      settings: Utils.deepClone(this.settings),
      slides: this.slides.map(slide => ({
        type: slide.type,
        ...slide.data,
        notes: slide.notes || undefined,
        elements: slide.elements.length > 0 ? slide.elements : undefined
      }))
    };
  }

  /**
   * 内部保存用のフルデータを取得（layout含む）
   * @returns {Object}
   */
  getFullData() {
    return {
      settings: Utils.deepClone(this.settings),
      slides: this.slides.map(slide => ({
        type: slide.type,
        ...slide.data,
        notes: slide.notes || undefined,
        elements: slide.elements.length > 0 ? slide.elements : undefined,
        layout: Object.keys(slide.layout || {}).length > 0 ? slide.layout : undefined
      })),
      currentIndex: this.currentIndex,
      savedAt: new Date().toISOString()
    };
  }

  /**
   * JSON形式で出力
   * @returns {string}
   */
  toJson() {
    return JSON.stringify(this.getData(), null, 2);
  }
}

// シングルトンインスタンス
const slideManager = new SlideManager();

// グローバルに公開
window.SlideManager = slideManager;

})();
