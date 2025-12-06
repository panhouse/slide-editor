/**
 * PhilosophyRenderer.js - 企業理念スライドレンダラー
 * wills_ph3 準拠: アクセントボーダー付き3カラムカード
 * PanHouse Slide Editor - 統合報告書対応
 */

class PhilosophyRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'philosophy';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-philosophy';

    // タイトル
    if (slide.data.title) {
      const title = document.createElement('h2');
      title.className = 'slide-heading philosophy-title';
      title.textContent = slide.data.title;
      title.dataset.field = 'data.title';
      title.dataset.slideId = slide.id;
      title.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(title, 'title', slide.id);
      });
      wrapper.appendChild(title);
    }

    // サブヘッド
    if (slide.data.subhead) {
      const subhead = document.createElement('p');
      subhead.className = 'subhead';
      subhead.textContent = slide.data.subhead;
      subhead.dataset.field = 'data.subhead';
      subhead.dataset.slideId = slide.id;
      subhead.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(subhead, 'subhead', slide.id);
      });
      wrapper.appendChild(subhead);
    }

    // wills_ph3準拠: 3カラムグリッド
    const grid = document.createElement('div');
    grid.className = 'ir-philosophy-grid';

    // パーパス（アクセントボーダー付きカード）
    if (slide.data.purpose) {
      const purposeCard = this.createPhilosophyCard(
        slide.data.purpose,
        'purpose',
        slide.id,
        '🎯'
      );
      grid.appendChild(purposeCard);
    }

    // ミッション
    if (slide.data.mission) {
      const missionCard = this.createPhilosophyCard(
        slide.data.mission,
        'mission',
        slide.id,
        '🚀'
      );
      grid.appendChild(missionCard);
    }

    // ビジョン
    if (slide.data.vision) {
      const visionCard = this.createPhilosophyCard(
        slide.data.vision,
        'vision',
        slide.id,
        '🌟'
      );
      grid.appendChild(visionCard);
    }

    wrapper.appendChild(grid);

    // KPIセクション（下部に配置）
    if (slide.data.kpis && slide.data.kpis.length > 0) {
      const kpiSection = this.createKpiSection(slide.data.kpis, slide.id);
      wrapper.appendChild(kpiSection);
    }

    return wrapper;
  }

  /**
   * 理念カード（アクセントボーダー付き）を作成
   */
  createPhilosophyCard(data, field, slideId, defaultIcon) {
    const card = document.createElement('div');
    card.className = 'ir-card accent-border';

    // アイコン
    const icon = document.createElement('div');
    icon.className = 'ir-card__icon';
    icon.textContent = data.icon || defaultIcon;
    card.appendChild(icon);

    // タイトル（ボーダー付き）
    const title = document.createElement('h3');
    title.className = 'ir-card__title';
    title.textContent = data.title || '';
    title.dataset.field = `data.${field}.title`;
    title.dataset.slideId = slideId;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableNestedTextEditing(title, field, 'title', slideId);
    });
    card.appendChild(title);

    // 本文（justify）
    const body = document.createElement('p');
    body.className = 'ir-card__body';
    body.textContent = data.text || '';
    body.dataset.field = `data.${field}.text`;
    body.dataset.slideId = slideId;
    body.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableNestedTextEditing(body, field, 'text', slideId);
    });
    card.appendChild(body);

    return card;
  }

  /**
   * KPIセクション（上部ボーダーアクセント付きカード）を作成
   */
  createKpiSection(kpis, slideId) {
    const section = document.createElement('div');
    section.className = 'ir-stat-grid';
    section.style.marginTop = '32px';

    kpis.forEach((kpi, index) => {
      const card = document.createElement('div');
      card.className = 'ir-stat-card';

      // ラベル
      const label = document.createElement('div');
      label.className = 'ir-stat-card__label';
      label.textContent = kpi.label || '';
      card.appendChild(label);

      // 値
      const value = document.createElement('div');
      value.className = 'ir-stat-card__value';
      value.textContent = kpi.value || '';
      card.appendChild(value);

      // 変化率
      if (kpi.change) {
        const change = document.createElement('div');
        change.className = `ir-stat-card__change ${kpi.change.startsWith('+') ? 'positive' : ''}`;
        change.textContent = kpi.change;
        card.appendChild(change);
      }

      section.appendChild(card);
    });

    return section;
  }

  /**
   * ネストされたフィールドのテキスト編集
   */
  enableNestedTextEditing(el, parentField, childField, slideId) {
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
        const parentData = { ...currentSlide.data[parentField] };
        parentData[childField] = el.textContent;
        SlideManager.updateCurrentSlide({
          data: { [parentField]: parentData }
        });
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

  /**
   * テキスト編集を有効化
   */
  enableTextEditing(el, field, slideId) {
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
        SlideManager.updateCurrentSlide({ data: { [field]: el.textContent } });
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
window.PhilosophyRenderer = PhilosophyRenderer;
