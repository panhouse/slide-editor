/**
 * IconCardsRenderer.js - アイコン付きカードスライドレンダラー
 * アイコン + タイトル + 説明のカードグリッド
 * PanHouse Slide Editor
 */

class IconCardsRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'icon-cards';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-icon-cards';

    // ヘッダー（タイトル）
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // カードコンテナ
    const container = document.createElement('div');
    container.className = 'icon-cards-container';

    const items = slide.data.items || [];
    const columns = slide.data.columns || Math.min(items.length, 4);
    const layout = slide.data.layout || 'grid'; // grid, horizontal, vertical

    container.classList.add(`layout-${layout}`);
    if (layout === 'grid') {
      container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }

    items.forEach((item, index) => {
      const card = this.renderIconCard(item, index, slide.id);
      container.appendChild(card);
    });

    wrapper.appendChild(container);
    return wrapper;
  }

  /**
   * 編集可能なヘッダーをレンダリング
   */
  renderEditableHeader(slide) {
    const header = document.createElement('div');
    header.className = 'slide-header';

    const title = this.createEditableText('h2', 'slide-title', slide.data.title, 'data.title', slide.id);
    header.appendChild(title);

    if (slide.data.subhead) {
      const subhead = this.createEditableText('p', 'slide-subhead', slide.data.subhead, 'data.subhead', slide.id);
      header.appendChild(subhead);
    }

    return header;
  }

  /**
   * アイコンカードをレンダリング
   */
  renderIconCard(item, index, slideId) {
    const card = document.createElement('div');
    card.className = 'icon-card';
    card.dataset.index = index;

    // カラー（オプション）
    if (item.color) {
      card.style.setProperty('--card-accent', item.color);
    }

    // アイコン
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-card-icon';

    if (item.icon) {
      // 絵文字またはテキストアイコン
      if (this.isEmoji(item.icon) || item.icon.length <= 2) {
        iconWrapper.textContent = item.icon;
      } else {
        // SVGパスまたはアイコン名
        iconWrapper.innerHTML = this.getIconSvg(item.icon);
      }
    } else {
      // デフォルトアイコン（番号）
      iconWrapper.textContent = index + 1;
      iconWrapper.classList.add('icon-number');
    }

    card.appendChild(iconWrapper);

    // コンテンツ
    const content = document.createElement('div');
    content.className = 'icon-card-content';

    // タイトル
    const title = document.createElement('h4');
    title.className = 'icon-card-title';
    title.textContent = item.title || '';
    title.dataset.field = `items.${index}.title`;
    title.dataset.slideId = slideId;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableFieldEditing(title, 'items', index, 'title', slideId);
    });
    content.appendChild(title);

    // 説明
    if (item.desc || item.description) {
      const desc = document.createElement('p');
      desc.className = 'icon-card-desc';
      desc.textContent = item.desc || item.description || '';
      desc.dataset.field = `items.${index}.desc`;
      desc.dataset.slideId = slideId;
      desc.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableFieldEditing(desc, 'items', index, 'desc', slideId);
      });
      content.appendChild(desc);
    }

    // サブ項目（オプション）
    if (item.points && item.points.length > 0) {
      const points = document.createElement('ul');
      points.className = 'icon-card-points';
      item.points.forEach(point => {
        const li = document.createElement('li');
        li.textContent = typeof point === 'string' ? point : point.text || '';
        points.appendChild(li);
      });
      content.appendChild(points);
    }

    card.appendChild(content);
    return card;
  }

  /**
   * 絵文字かどうか判定
   */
  isEmoji(str) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(str);
  }

  /**
   * アイコン名からSVGを取得
   */
  getIconSvg(iconName) {
    const icons = {
      'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      'star': '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      'arrow': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
      'target': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
      'chart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
      'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      'lightbulb': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>',
      'rocket': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>',
      'shield': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      'zap': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
    };
    return icons[iconName] || `<span>${iconName}</span>`;
  }

  /**
   * フィールド編集を有効化
   */
  enableFieldEditing(el, arrayName, index, field, slideId) {
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

      const currentSlide = SlideManager.getCurrentSlide();
      if (currentSlide && currentSlide.id === slideId) {
        const items = [...(currentSlide.data[arrayName] || [])];
        if (items[index]) {
          items[index] = { ...items[index], [field]: el.textContent };
          SlideManager.updateCurrentSlide({ data: { [arrayName]: items } });
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
window.IconCardsRenderer = IconCardsRenderer;
