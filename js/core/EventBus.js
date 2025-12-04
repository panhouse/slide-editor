/**
 * EventBus.js - イベント管理（Pub/Sub パターン）
 * PanHouse Slide Editor
 */

(function() {

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * イベントを購読
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   * @returns {Function} - 購読解除関数
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // 購読解除関数を返す
    return () => this.off(event, callback);
  }

  /**
   * イベントを一度だけ購読
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * イベントの購読を解除
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(cb => cb !== callback);

    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  /**
   * イベントを発行
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    if (!this.events[event]) return;

    Utils.log('EventBus', `emit: ${event}`, args);

    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * すべてのイベントをクリア
   */
  clear() {
    this.events = {};
  }

  /**
   * 登録されているイベント一覧を取得
   * @returns {string[]}
   */
  getEvents() {
    return Object.keys(this.events);
  }
}

// シングルトンインスタンス
const eventBus = new EventBus();

// イベント名の定数
const Events = {
  // スライド関連
  SLIDE_ADDED: 'slide:added',
  SLIDE_REMOVED: 'slide:removed',
  SLIDE_UPDATED: 'slide:updated',
  SLIDE_SELECTED: 'slide:selected',
  SLIDE_REORDERED: 'slide:reordered',

  // 要素関連
  ELEMENT_ADDED: 'element:added',
  ELEMENT_REMOVED: 'element:removed',
  ELEMENT_UPDATED: 'element:updated',
  ELEMENT_SELECTED: 'element:selected',

  // 設定関連
  THEME_CHANGED: 'theme:changed',
  SETTINGS_UPDATED: 'settings:updated',

  // UI関連
  CANVAS_ZOOM: 'canvas:zoom',
  CANVAS_RENDER: 'canvas:render',
  TOOL_CHANGED: 'tool:changed',
  PROPERTIES_RENDER: 'properties:render',

  // データ関連
  DATA_LOADED: 'data:loaded',
  DATA_SAVED: 'data:saved',
  DATA_EXPORTED: 'data:exported',

  // エラー
  ERROR: 'error',
};

// グローバルに公開
window.EventBus = eventBus;
window.Events = Events;

})();
