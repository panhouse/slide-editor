/**
 * CardsRenderer.js - カードグリッドスライドレンダラー
 * PanHouse Slide Editor
 */

class CardsRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'cards';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-cards';

    // ヘッダー（タイトル）- 編集可能
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // カードコンテナ
    const container = document.createElement('div');
    container.className = 'cards-container';

    const items = slide.data.items || [];
    items.forEach((item, index) => {
      const card = this.renderEditableCard(item, index, slide.id);
      container.appendChild(card);
    });

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
   * 編集可能なカードをレンダリング
   * @param {Object} item
   * @param {number} index
   * @param {string} slideId
   * @returns {HTMLElement}
   */
  renderEditableCard(item, index, slideId) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;

    // タイトル（編集可能）
    const title = document.createElement('h4');
    title.className = 'card-title';
    title.textContent = item.title || '';
    title.dataset.field = `items.${index}.title`;
    title.dataset.slideId = slideId;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableCardFieldEditing(title, 'title', index, slideId);
    });
    card.appendChild(title);

    // 説明（編集可能）
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = item.desc || item.description || '';
    desc.dataset.field = `items.${index}.desc`;
    desc.dataset.slideId = slideId;
    desc.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableCardFieldEditing(desc, 'desc', index, slideId);
    });
    card.appendChild(desc);

    return card;
  }

  /**
   * カードフィールドの編集を有効化
   * @param {HTMLElement} el
   * @param {string} field
   * @param {number} index
   * @param {string} slideId
   */
  enableCardFieldEditing(el, field, index, slideId) {
    if (el.contentEditable === 'true') return;

    el.contentEditable = 'true';
    el.classList.add('editing');
    el.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);

    const saveAndExit = () => {
      el.contentEditable = 'false';
      el.classList.remove('editing');

      // カード配列を更新
      const currentSlide = SlideManager.getCurrentSlide();
      if (currentSlide && currentSlide.id === slideId) {
        const items = [...(currentSlide.data.items || [])];
        if (items[index]) {
          items[index] = { ...items[index], [field]: el.textContent };
          SlideManager.updateCurrentSlide({ data: { items } });
        }
      }

      el.removeEventListener('blur', saveAndExit);
      el.removeEventListener('keydown', handleKeydown);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Escape') {
        el.contentEditable = 'false';
        el.classList.remove('editing');
        EventBus.emit(Events.SLIDE_UPDATED, SlideManager.getCurrentSlide());
        el.removeEventListener('blur', saveAndExit);
        el.removeEventListener('keydown', handleKeydown);
      }
      e.stopPropagation();
    };

    el.addEventListener('blur', saveAndExit);
    el.addEventListener('keydown', handleKeydown);
  }
}

// グローバルに公開
window.CardsRenderer = CardsRenderer;
