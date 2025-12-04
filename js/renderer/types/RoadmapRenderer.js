/**
 * RoadmapRenderer.js - ロードマップスライドレンダラー
 * フェーズごとの進捗状態を表示（ガントチャート風）
 * PanHouse Slide Editor
 */

class RoadmapRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'roadmap';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-roadmap';

    // ヘッダー（タイトル）
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // ロードマップコンテナ
    const container = document.createElement('div');
    container.className = 'roadmap-container';

    const phases = slide.data.phases || slide.data.items || [];
    const periods = slide.data.periods || this.extractPeriods(phases);

    // 期間ヘッダー
    if (periods.length > 0) {
      const periodHeader = this.renderPeriodHeader(periods);
      container.appendChild(periodHeader);
    }

    // フェーズ行
    phases.forEach((phase, index) => {
      const row = this.renderPhaseRow(phase, index, slide.id, periods);
      container.appendChild(row);
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
   * フェーズから期間を抽出
   */
  extractPeriods(phases) {
    const periods = new Set();
    phases.forEach(phase => {
      if (phase.start) periods.add(phase.start);
      if (phase.end) periods.add(phase.end);
    });
    return Array.from(periods).sort();
  }

  /**
   * 期間ヘッダーをレンダリング
   */
  renderPeriodHeader(periods) {
    const header = document.createElement('div');
    header.className = 'roadmap-header';

    // 左側のラベル用スペース
    const labelSpace = document.createElement('div');
    labelSpace.className = 'roadmap-label-space';
    header.appendChild(labelSpace);

    // 期間ラベル
    const periodsContainer = document.createElement('div');
    periodsContainer.className = 'roadmap-periods';

    periods.forEach(period => {
      const periodEl = document.createElement('div');
      periodEl.className = 'roadmap-period';
      periodEl.textContent = period;
      periodsContainer.appendChild(periodEl);
    });

    header.appendChild(periodsContainer);
    return header;
  }

  /**
   * フェーズ行をレンダリング
   */
  renderPhaseRow(phase, index, slideId, periods) {
    const row = document.createElement('div');
    row.className = 'roadmap-row';
    row.dataset.index = index;

    // フェーズラベル
    const label = document.createElement('div');
    label.className = 'roadmap-phase-label';

    const title = document.createElement('span');
    title.className = 'phase-title';
    title.textContent = phase.title || phase.name || '';
    title.dataset.field = `phases.${index}.title`;
    title.dataset.slideId = slideId;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableFieldEditing(title, 'phases', index, 'title', slideId);
    });
    label.appendChild(title);

    row.appendChild(label);

    // バーエリア
    const barArea = document.createElement('div');
    barArea.className = 'roadmap-bar-area';

    // フェーズバー
    const bar = document.createElement('div');
    bar.className = `roadmap-bar ${this.getStatusClass(phase.status)}`;

    // バーの位置とサイズを計算
    if (periods.length > 0 && phase.start && phase.end) {
      const startIndex = periods.indexOf(phase.start);
      const endIndex = periods.indexOf(phase.end);
      if (startIndex >= 0 && endIndex >= 0) {
        const left = (startIndex / periods.length) * 100;
        const width = ((endIndex - startIndex + 1) / periods.length) * 100;
        bar.style.left = `${left}%`;
        bar.style.width = `${width}%`;
      }
    } else {
      // 期間指定がない場合はデフォルト表示
      bar.style.width = '100%';
    }

    // バー内テキスト
    if (phase.milestone || phase.desc) {
      const barText = document.createElement('span');
      barText.className = 'bar-text';
      barText.textContent = phase.milestone || phase.desc || '';
      bar.appendChild(barText);
    }

    barArea.appendChild(bar);
    row.appendChild(barArea);

    // ステータスバッジ
    if (phase.status) {
      const status = document.createElement('div');
      status.className = `roadmap-status ${this.getStatusClass(phase.status)}`;
      status.textContent = this.getStatusLabel(phase.status);
      row.appendChild(status);
    }

    return row;
  }

  /**
   * ステータスに応じたクラス名を返す
   */
  getStatusClass(status) {
    const statusMap = {
      'completed': 'status-completed',
      'done': 'status-completed',
      '完了': 'status-completed',
      'in-progress': 'status-in-progress',
      'active': 'status-in-progress',
      '進行中': 'status-in-progress',
      'pending': 'status-pending',
      'planned': 'status-pending',
      '予定': 'status-pending',
      'delayed': 'status-delayed',
      '遅延': 'status-delayed'
    };
    return statusMap[status] || 'status-pending';
  }

  /**
   * ステータスラベルを返す
   */
  getStatusLabel(status) {
    const labelMap = {
      'completed': '完了',
      'done': '完了',
      '完了': '完了',
      'in-progress': '進行中',
      'active': '進行中',
      '進行中': '進行中',
      'pending': '予定',
      'planned': '予定',
      '予定': '予定',
      'delayed': '遅延',
      '遅延': '遅延'
    };
    return labelMap[status] || status;
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
window.RoadmapRenderer = RoadmapRenderer;
