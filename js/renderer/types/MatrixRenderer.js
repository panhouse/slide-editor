/**
 * MatrixRenderer.js - 2x2マトリクススライドレンダラー
 * SWOT分析、緊急度×重要度 などの4象限マトリクス
 * PanHouse Slide Editor
 */

class MatrixRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'matrix';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-matrix';

    // ヘッダー（タイトル）
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // マトリクスコンテナ
    const container = document.createElement('div');
    container.className = 'matrix-container';

    // 軸ラベル（オプション）
    if (slide.data.xAxis || slide.data.yAxis) {
      const axes = this.renderAxes(slide);
      container.appendChild(axes);
    }

    // 4つの象限
    const grid = document.createElement('div');
    grid.className = 'matrix-grid';

    const quadrants = slide.data.quadrants || slide.data.items || [
      { title: '象限1', items: [] },
      { title: '象限2', items: [] },
      { title: '象限3', items: [] },
      { title: '象限4', items: [] }
    ];

    const colors = ['primary', 'secondary', 'tertiary', 'quaternary'];

    quadrants.forEach((quadrant, index) => {
      const quadrantEl = this.renderQuadrant(quadrant, index, slide.id, colors[index]);
      grid.appendChild(quadrantEl);
    });

    container.appendChild(grid);
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

    return header;
  }

  /**
   * 軸ラベルをレンダリング
   */
  renderAxes(slide) {
    const axes = document.createElement('div');
    axes.className = 'matrix-axes';

    if (slide.data.xAxis) {
      const xAxis = document.createElement('div');
      xAxis.className = 'matrix-axis matrix-axis-x';

      const xLow = document.createElement('span');
      xLow.className = 'axis-label axis-low';
      xLow.textContent = slide.data.xAxis.low || '';

      const xHigh = document.createElement('span');
      xHigh.className = 'axis-label axis-high';
      xHigh.textContent = slide.data.xAxis.high || '';

      const xLabel = document.createElement('span');
      xLabel.className = 'axis-title';
      xLabel.textContent = slide.data.xAxis.label || '';

      xAxis.appendChild(xLow);
      xAxis.appendChild(xLabel);
      xAxis.appendChild(xHigh);
      axes.appendChild(xAxis);
    }

    if (slide.data.yAxis) {
      const yAxis = document.createElement('div');
      yAxis.className = 'matrix-axis matrix-axis-y';

      const yHigh = document.createElement('span');
      yHigh.className = 'axis-label axis-high';
      yHigh.textContent = slide.data.yAxis.high || '';

      const yLabel = document.createElement('span');
      yLabel.className = 'axis-title';
      yLabel.textContent = slide.data.yAxis.label || '';

      const yLow = document.createElement('span');
      yLow.className = 'axis-label axis-low';
      yLow.textContent = slide.data.yAxis.low || '';

      yAxis.appendChild(yHigh);
      yAxis.appendChild(yLabel);
      yAxis.appendChild(yLow);
      axes.appendChild(yAxis);
    }

    return axes;
  }

  /**
   * 象限をレンダリング
   */
  renderQuadrant(quadrant, index, slideId, colorClass) {
    const quadrantEl = document.createElement('div');
    quadrantEl.className = `matrix-quadrant matrix-quadrant-${colorClass}`;
    quadrantEl.dataset.index = index;

    // 象限タイトル
    const title = document.createElement('h4');
    title.className = 'quadrant-title';
    title.textContent = quadrant.title || '';
    title.dataset.field = `quadrants.${index}.title`;
    title.dataset.slideId = slideId;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableFieldEditing(title, 'quadrants', index, 'title', slideId);
    });
    quadrantEl.appendChild(title);

    // 象限内のアイテム
    if (quadrant.items && quadrant.items.length > 0) {
      const list = document.createElement('ul');
      list.className = 'quadrant-items';

      quadrant.items.forEach((item, itemIndex) => {
        const li = document.createElement('li');
        li.textContent = typeof item === 'string' ? item : item.text || item.title || '';
        list.appendChild(li);
      });

      quadrantEl.appendChild(list);
    }

    // 説明文（オプション）
    if (quadrant.desc || quadrant.description) {
      const desc = document.createElement('p');
      desc.className = 'quadrant-desc';
      desc.textContent = quadrant.desc || quadrant.description;
      quadrantEl.appendChild(desc);
    }

    return quadrantEl;
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
window.MatrixRenderer = MatrixRenderer;
