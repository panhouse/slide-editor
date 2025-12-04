/**
 * ProcessRenderer.js - プロセスフロースライドレンダラー
 * ステップ1 → ステップ2 → ステップ3 のような流れ図
 * PanHouse Slide Editor
 */

class ProcessRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'process';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-process';

    // ヘッダー（タイトル）
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // プロセスコンテナ
    const container = document.createElement('div');
    container.className = 'process-container';

    const steps = slide.data.steps || slide.data.items || [];
    const isVertical = slide.data.direction === 'vertical';

    if (isVertical) {
      container.classList.add('process-vertical');
    }

    steps.forEach((step, index) => {
      // ステップカード
      const stepEl = this.renderStep(step, index, slide.id, steps.length);
      container.appendChild(stepEl);

      // 矢印（最後のステップ以外）
      if (index < steps.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'process-arrow';
        arrow.innerHTML = isVertical ? '↓' : '→';
        container.appendChild(arrow);
      }
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
   * ステップをレンダリング
   */
  renderStep(step, index, slideId, totalSteps) {
    const stepEl = document.createElement('div');
    stepEl.className = 'process-step';
    stepEl.dataset.index = index;

    // ステップ番号
    const number = document.createElement('div');
    number.className = 'process-step-number';
    number.textContent = step.number || (index + 1);
    stepEl.appendChild(number);

    // タイトル
    const title = document.createElement('h4');
    title.className = 'process-step-title';
    title.textContent = step.title || '';
    title.dataset.field = `steps.${index}.title`;
    title.dataset.slideId = slideId;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableFieldEditing(title, 'steps', index, 'title', slideId);
    });
    stepEl.appendChild(title);

    // 説明
    if (step.desc || step.description) {
      const desc = document.createElement('p');
      desc.className = 'process-step-desc';
      desc.textContent = step.desc || step.description || '';
      desc.dataset.field = `steps.${index}.desc`;
      desc.dataset.slideId = slideId;
      desc.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableFieldEditing(desc, 'steps', index, 'desc', slideId);
      });
      stepEl.appendChild(desc);
    }

    return stepEl;
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
window.ProcessRenderer = ProcessRenderer;
