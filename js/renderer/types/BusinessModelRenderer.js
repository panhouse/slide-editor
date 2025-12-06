/**
 * BusinessModelRenderer.js - ビジネスモデルスライドレンダラー
 * wills_ph3 準拠: 320px + 1fr + 320px グリッドレイアウト
 * PanHouse Slide Editor - 統合報告書対応
 */

class BusinessModelRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'businessModel';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-business-model';

    // タイトル
    if (slide.data.title) {
      const title = document.createElement('h2');
      title.className = 'slide-heading business-model-title';
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

    // wills_ph3準拠: ir-bm-layout (320px + 1fr + 320px グリッド)
    const layout = document.createElement('div');
    layout.className = 'ir-bm-layout';

    // 左カラム: インプット（左ボーダーアクセント付きアイテム）
    if (slide.data.inputs && slide.data.inputs.length > 0) {
      const inputsColumn = this.createInputOutputColumn(
        'インプット',
        slide.data.inputs,
        slide.id
      );
      layout.appendChild(inputsColumn);
    }

    // 中央カラム: プロセス（縦並びステップ）
    if (slide.data.processes && slide.data.processes.length > 0) {
      const processColumn = this.createProcessColumn(
        slide.data.processes,
        slide.id
      );
      layout.appendChild(processColumn);
    }

    // 右カラム: アウトプット
    if (slide.data.outputs && slide.data.outputs.length > 0) {
      const outputsColumn = this.createInputOutputColumn(
        'アウトプット',
        slide.data.outputs,
        slide.id
      );
      layout.appendChild(outputsColumn);
    }

    wrapper.appendChild(layout);

    // 補足説明（オプション）
    if (slide.data.description) {
      const desc = document.createElement('p');
      desc.className = 'ir-card__body';
      desc.style.marginTop = '24px';
      desc.textContent = slide.data.description;
      desc.dataset.field = 'data.description';
      desc.dataset.slideId = slide.id;
      desc.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(desc, 'description', slide.id);
      });
      wrapper.appendChild(desc);
    }

    return wrapper;
  }

  /**
   * インプット/アウトプットカラムを作成
   */
  createInputOutputColumn(titleText, items, slideId) {
    const column = document.createElement('div');
    column.className = 'ir-bm-column';

    // カラムタイトル（アクセント色）
    const title = document.createElement('h3');
    title.className = 'ir-bm-column__title';
    title.textContent = titleText;
    column.appendChild(title);

    // アイテム（左ボーダーアクセント付き）
    items.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'ir-bm-item';

      // アイコン
      if (item.icon) {
        const icon = document.createElement('div');
        icon.className = 'ir-bm-item__icon';
        icon.textContent = item.icon;
        itemEl.appendChild(icon);
      }

      // ラベル
      const label = document.createElement('div');
      label.className = 'ir-bm-item__title';
      label.textContent = item.label || '';
      itemEl.appendChild(label);

      // 値（オプション）
      if (item.value) {
        const value = document.createElement('div');
        value.className = 'ir-bm-item__value';
        value.textContent = item.value;
        itemEl.appendChild(value);
      }

      // 説明（オプション）
      if (item.desc) {
        const desc = document.createElement('div');
        desc.className = 'ir-bm-item__desc';
        desc.textContent = item.desc;
        itemEl.appendChild(desc);
      }

      column.appendChild(itemEl);
    });

    return column;
  }

  /**
   * プロセスカラム（中央、縦並び）を作成
   */
  createProcessColumn(processes, slideId) {
    const column = document.createElement('div');
    column.className = 'ir-bm-process';

    processes.forEach((process, index) => {
      // プロセスステップ
      const step = document.createElement('div');
      step.className = 'ir-bm-process-step';

      if (typeof process === 'string') {
        step.textContent = process;
      } else {
        step.textContent = process.label || process.name || '';
      }

      column.appendChild(step);

      // 矢印（最後以外）
      if (index < processes.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'ir-bm-process-arrow';
        arrow.textContent = '↓';
        column.appendChild(arrow);
      }
    });

    return column;
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
window.BusinessModelRenderer = BusinessModelRenderer;
