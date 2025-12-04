/**
 * TimelineRenderer.js - タイムラインスライドレンダラー
 * PanHouse Slide Editor
 */

class TimelineRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'timeline';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-timeline';

    // ヘッダー（タイトル）- 編集可能
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // タイムラインコンテナ
    const container = document.createElement('div');
    container.className = 'timeline-container';

    // ライン
    const line = document.createElement('div');
    line.className = 'timeline-line';
    container.appendChild(line);

    // アイテム
    const items = document.createElement('div');
    items.className = 'timeline-items';

    const milestones = slide.data.milestones || [];
    milestones.forEach((milestone, index) => {
      const item = this.renderEditableMilestone(milestone, index, slide.id);
      items.appendChild(item);
    });

    container.appendChild(items);
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
   * 編集可能なマイルストーンをレンダリング
   * @param {Object} milestone
   * @param {number} index
   * @param {string} slideId
   * @returns {HTMLElement}
   */
  renderEditableMilestone(milestone, index, slideId) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.dataset.index = index;

    // ドット
    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    item.appendChild(dot);

    // 日付（編集可能）
    const date = document.createElement('span');
    date.className = 'timeline-date';
    date.textContent = milestone.date || '';
    date.dataset.field = `milestones.${index}.date`;
    date.dataset.slideId = slideId;
    date.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableMilestoneFieldEditing(date, 'date', index, slideId);
    });
    item.appendChild(date);

    // ラベル（編集可能）
    const label = document.createElement('span');
    label.className = 'timeline-label';
    label.textContent = milestone.label || milestone.title || '';
    label.dataset.field = `milestones.${index}.label`;
    label.dataset.slideId = slideId;
    label.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableMilestoneFieldEditing(label, 'label', index, slideId);
    });
    item.appendChild(label);

    return item;
  }

  /**
   * マイルストーンフィールドの編集を有効化
   * @param {HTMLElement} el
   * @param {string} field
   * @param {number} index
   * @param {string} slideId
   */
  enableMilestoneFieldEditing(el, field, index, slideId) {
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

      // マイルストーン配列を更新
      const currentSlide = SlideManager.getCurrentSlide();
      if (currentSlide && currentSlide.id === slideId) {
        const milestones = [...(currentSlide.data.milestones || [])];
        if (milestones[index]) {
          milestones[index] = { ...milestones[index], [field]: el.textContent };
          SlideManager.updateCurrentSlide({ data: { milestones } });
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
window.TimelineRenderer = TimelineRenderer;
