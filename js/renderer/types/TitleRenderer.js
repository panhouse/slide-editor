/**
 * TitleRenderer.js - タイトルスライドレンダラー
 * PanHouse Slide Editor
 */

class TitleRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'title';
  }

  /**
   * タイトルスライドをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  render(slide, settings = {}) {
    const container = document.createElement('div');
    container.className = 'slide slide-title-page';
    container.dataset.slideId = slide.id;

    const content = this.renderContent(slide, settings);
    container.appendChild(content);

    return container;
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const content = document.createElement('div');
    content.className = 'slide-content';

    // メインタイトル（編集可能）
    const title = this.createEditableText('h1', 'main-title', slide.data.title, 'data.title', slide.id);
    content.appendChild(title);

    // サブタイトル（編集可能）
    const subtitle = this.createEditableText('p', 'main-subtitle', slide.data.subtitle || '', 'data.subtitle', slide.id);
    if (slide.data.subtitle) {
      content.appendChild(subtitle);
    } else {
      // 空でも編集できるようにプレースホルダー付きで追加
      subtitle.dataset.placeholder = 'サブタイトルをダブルクリックで編集';
      subtitle.classList.add('placeholder');
      content.appendChild(subtitle);
    }

    // 日付（編集可能）
    const meta = this.createEditableText('p', 'meta-info', slide.data.date || '', 'data.date', slide.id);
    content.appendChild(meta);

    return content;
  }
}

// グローバルに公開
window.TitleRenderer = TitleRenderer;
