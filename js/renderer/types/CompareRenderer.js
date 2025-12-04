/**
 * CompareRenderer.js - 比較スライドレンダラー
 * PanHouse Slide Editor
 */

class CompareRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'compare';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-compare';

    // ヘッダー（タイトル）- 編集可能
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // 比較コンテナ
    const container = document.createElement('div');
    container.className = 'compare-container';

    // 左列 - 編集可能
    const leftColumn = this.renderEditableColumn(
      slide.data.leftTitle,
      slide.data.leftItems || slide.data.leftPoints || [],
      'leftTitle',
      'leftItems',
      slide.id
    );
    container.appendChild(leftColumn);

    // 右列 - 編集可能
    const rightColumn = this.renderEditableColumn(
      slide.data.rightTitle,
      slide.data.rightItems || slide.data.rightPoints || [],
      'rightTitle',
      'rightItems',
      slide.id
    );
    container.appendChild(rightColumn);

    wrapper.appendChild(container);
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

    const title = this.createEditableText('h2', 'slide-title', slide.data.title, 'data.title', slide.id);
    header.appendChild(title);

    return header;
  }

  /**
   * 編集可能な比較列をレンダリング
   * @param {string} title
   * @param {Array} items
   * @param {string} titleField
   * @param {string} itemsField
   * @param {string} slideId
   * @returns {HTMLElement}
   */
  renderEditableColumn(title, items, titleField, itemsField, slideId) {
    const column = document.createElement('div');
    column.className = 'compare-column';

    // タイトル（編集可能）
    const titleEl = this.createEditableText('h3', 'compare-title', title || '', `data.${titleField}`, slideId);
    column.appendChild(titleEl);

    // アイテムリスト（編集可能）
    const list = this.renderEditableList(items, itemsField, slideId);
    list.classList.remove('points-list');
    list.classList.add('compare-list');
    column.appendChild(list);

    return column;
  }
}

// グローバルに公開
window.CompareRenderer = CompareRenderer;
