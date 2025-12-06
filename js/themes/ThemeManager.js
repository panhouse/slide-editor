/**
 * ThemeManager.js - テーマ切り替え管理
 * PanHouse Slide Editor
 */

(function() {

class ThemeManager {
  constructor() {
    this.currentTheme = 'panhouse';
    this.themes = {
      panhouse: {
        name: 'PanHouse',
        primary: '#FF6600',
        secondary: '#1E3A5F'
      },
      consulting: {
        name: 'Consulting',
        primary: '#003366',
        secondary: '#0052A3'
      },
      'integrated-report': {
        name: '統合報告書',
        primary: '#7B7B73',
        secondary: '#C84B31'
      }
    };
  }

  /**
   * テーマを設定
   * @param {string} themeId
   */
  setTheme(themeId) {
    if (!this.themes[themeId]) {
      Utils.log('ThemeManager', `Unknown theme: ${themeId}`);
      return;
    }

    this.currentTheme = themeId;

    // body にテーマ属性を設定
    document.body.setAttribute('data-theme', themeId);

    // スライドキャンバスにもテーマを適用
    const canvas = document.getElementById('slideCanvas');
    if (canvas) {
      canvas.setAttribute('data-theme', themeId);
    }

    EventBus.emit(Events.THEME_CHANGED, themeId);
    Utils.log('ThemeManager', `Theme changed to: ${themeId}`);
  }

  /**
   * 現在のテーマを取得
   * @returns {string}
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * 利用可能なテーマ一覧を取得
   * @returns {Object}
   */
  getThemes() {
    return this.themes;
  }

  /**
   * テーマ情報を取得
   * @param {string} themeId
   * @returns {Object|null}
   */
  getThemeInfo(themeId) {
    return this.themes[themeId] || null;
  }

  /**
   * CSSファイルを動的に読み込み
   * @param {string} themeId
   */
  loadThemeCSS(themeId) {
    const existingLink = document.getElementById('theme-css');
    if (existingLink) {
      existingLink.href = `css/themes/${themeId}.css`;
    } else {
      const link = document.createElement('link');
      link.id = 'theme-css';
      link.rel = 'stylesheet';
      link.href = `css/themes/${themeId}.css`;
      document.head.appendChild(link);
    }
  }
}

// シングルトンインスタンス
const themeManager = new ThemeManager();

// グローバルに公開
window.ThemeManager = themeManager;

})();
