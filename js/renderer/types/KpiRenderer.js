/**
 * KpiRenderer.js - KPIダッシュボードスライドレンダラー
 * 大きな数値 + ラベル + 変化率（↑↓）を表示
 * PanHouse Slide Editor
 */

class KpiRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'kpi';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-kpi';

    // ヘッダー（タイトル）
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // KPIカードコンテナ
    const container = document.createElement('div');
    container.className = 'kpi-container';

    const metrics = slide.data.metrics || slide.data.items || [];
    const columns = slide.data.columns || Math.min(metrics.length, 4);
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    metrics.forEach((metric, index) => {
      const card = this.renderKpiCard(metric, index, slide.id);
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
   * KPIカードをレンダリング
   */
  renderKpiCard(metric, index, slideId) {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.dataset.index = index;

    // アイコン（オプション）
    if (metric.icon) {
      const icon = document.createElement('div');
      icon.className = 'kpi-icon';
      icon.textContent = metric.icon;
      card.appendChild(icon);
    }

    // 数値
    const value = document.createElement('div');
    value.className = 'kpi-value';
    value.textContent = this.formatValue(metric.value, metric.format);
    value.dataset.field = `metrics.${index}.value`;
    value.dataset.slideId = slideId;
    value.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableFieldEditing(value, 'metrics', index, 'value', slideId);
    });
    card.appendChild(value);

    // ラベル
    const label = document.createElement('div');
    label.className = 'kpi-label';
    label.textContent = metric.label || metric.title || '';
    label.dataset.field = `metrics.${index}.label`;
    label.dataset.slideId = slideId;
    label.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableFieldEditing(label, 'metrics', index, 'label', slideId);
    });
    card.appendChild(label);

    // 変化率（オプション）
    if (metric.change !== undefined) {
      const change = document.createElement('div');
      const isPositive = metric.change > 0;
      const isNegative = metric.change < 0;
      change.className = `kpi-change ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`;

      const arrow = isPositive ? '↑' : isNegative ? '↓' : '';
      const changeValue = Math.abs(metric.change);
      change.textContent = `${arrow} ${changeValue}%`;

      if (metric.changeLabel) {
        const changeLabel = document.createElement('span');
        changeLabel.className = 'kpi-change-label';
        changeLabel.textContent = ` ${metric.changeLabel}`;
        change.appendChild(changeLabel);
      }

      card.appendChild(change);
    }

    // 補足説明（オプション）
    if (metric.desc || metric.description) {
      const desc = document.createElement('div');
      desc.className = 'kpi-desc';
      desc.textContent = metric.desc || metric.description;
      card.appendChild(desc);
    }

    return card;
  }

  /**
   * 値をフォーマット
   */
  formatValue(value, format) {
    // 文字列の場合、コンマを除去して数値に変換
    let numValue = value;
    if (typeof value === 'string') {
      numValue = parseFloat(value.replace(/,/g, ''));
    }

    if (format === 'currency' || format === 'yen') {
      return `¥${Number(numValue).toLocaleString()}`;
    }
    if (format === 'percent') {
      return `${numValue}%`;
    }
    if (format === 'number') {
      return Number(numValue).toLocaleString();
    }
    // フォーマット指定なしの場合、そのまま返す（文字列のコンマは維持）
    return value;
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
window.KpiRenderer = KpiRenderer;
