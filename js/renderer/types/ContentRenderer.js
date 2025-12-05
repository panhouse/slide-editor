/**
 * ContentRenderer.js - 箇条書きコンテンツスライドレンダラー
 * PanHouse Slide Editor
 */

class ContentRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'content';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-content-page';

    // ヘッダー（タイトル・サブヘッド）- 編集可能
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // コンテンツ
    const content = document.createElement('div');
    content.className = 'slide-content';

    // ポイント（箇条書き）- 編集可能
    // points/bullets/items のいずれかを使用
    const hasPoints = slide.data.points && slide.data.points.length > 0;
    const hasBullets = slide.data.bullets && slide.data.bullets.length > 0;
    const points = hasPoints ? slide.data.points : (hasBullets ? slide.data.bullets : (slide.data.items || []));
    const fieldName = hasPoints ? 'points' : (hasBullets ? 'bullets' : 'items');
    const list = this.renderEditableList(points, fieldName, slide.id);
    content.appendChild(list);

    wrapper.appendChild(content);
    return wrapper;
  }

  /**
   * 編集可能なヘッダーをレンダリング
   * @param {Object} slide
   * @returns {HTMLElement}
   */
  renderEditableHeader(slide) {
    const header = document.createElement('div');
    header.className = 'slide-header';

    // タイトル（編集可能）
    const title = this.createEditableText('h2', 'slide-title', slide.data.title, 'data.title', slide.id);
    header.appendChild(title);

    // サブヘッド（編集可能）
    const subhead = this.createEditableText('p', 'slide-subhead', slide.data.subhead || '', 'data.subhead', slide.id);
    header.appendChild(subhead);

    return header;
  }
}

// グローバルに公開
window.ContentRenderer = ContentRenderer;
