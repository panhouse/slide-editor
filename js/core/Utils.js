/**
 * Utils.js - ユーティリティ関数
 * PanHouse Slide Editor
 */

const Utils = {
  /**
   * ユニークIDを生成
   * @param {string} prefix - プレフィックス
   * @returns {string}
   */
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * オブジェクトのディープコピー
   * @param {Object} obj
   * @returns {Object}
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * オブジェクトのディープマージ
   * @param {Object} target
   * @param {Object} source
   * @returns {Object}
   */
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },

  /**
   * デバウンス
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * スロットル
   * @param {Function} func
   * @param {number} limit
   * @returns {Function}
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * HTMLエスケープ
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * HTMLテンプレートをパース
   * @param {string} template
   * @param {Object} data
   * @returns {string}
   */
  parseTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? this.escapeHtml(String(data[key])) : match;
    });
  },

  /**
   * DOM要素を作成
   * @param {string} tag
   * @param {Object} attrs
   * @param {string|Element|Element[]} children
   * @returns {HTMLElement}
   */
  createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(el.dataset, value);
      } else {
        el.setAttribute(key, value);
      }
    }

    if (children) {
      if (typeof children === 'string') {
        el.textContent = children;
      } else if (children instanceof Element) {
        el.appendChild(children);
      } else if (Array.isArray(children)) {
        children.forEach(child => {
          if (child instanceof Element) {
            el.appendChild(child);
          } else if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          }
        });
      }
    }

    return el;
  },

  /**
   * 要素をクエリ
   * @param {string} selector
   * @param {Element} context
   * @returns {Element|null}
   */
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * 要素を複数クエリ
   * @param {string} selector
   * @param {Element} context
   * @returns {Element[]}
   */
  $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  /**
   * ファイルを読み込み
   * @param {File} file
   * @returns {Promise<string>}
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  /**
   * 画像ファイルをBase64に変換
   * @param {File} file
   * @returns {Promise<string>}
   */
  readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  /**
   * JSONをダウンロード
   * @param {Object} data
   * @param {string} filename
   */
  downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * 日付をフォーマット
   * @param {Date} date
   * @param {string} format
   * @returns {string}
   */
  formatDate(date = new Date(), format = 'YYYY年MM月DD日') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  /**
   * 色をRGBAに変換
   * @param {string} hex
   * @param {number} alpha
   * @returns {string}
   */
  hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * ログ出力（開発用）
   * @param {string} category
   * @param  {...any} args
   */
  log(category, ...args) {
    if (window.DEBUG) {
      console.log(`[${category}]`, ...args);
    }
  }
};

// グローバルに公開
window.Utils = Utils;
