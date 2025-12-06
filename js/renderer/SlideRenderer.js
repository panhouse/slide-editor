/**
 * SlideRenderer.js - メインレンダラー（タイプ振り分け）
 * PanHouse Slide Editor
 */

(function() {

class SlideRenderer {
  constructor() {
    this.renderers = null;
    this.defaultRenderer = null;
  }

  /**
   * レンダラーを初期化（遅延初期化）
   */
  _initRenderers() {
    if (this.renderers) return;

    // レンダラーの登録
    this.renderers = {
      title: new TitleRenderer(),
      section: new SectionRenderer(),
      content: new ContentRenderer(),
      agenda: new AgendaRenderer(),
      closing: new ClosingRenderer(),
      table: new TableRenderer(),
      compare: new CompareRenderer(),
      cards: new CardsRenderer(),
      timeline: new TimelineRenderer(),
      // リッチコンポーネント
      process: new ProcessRenderer(),
      matrix: new MatrixRenderer(),
      kpi: new KpiRenderer(),
      roadmap: new RoadmapRenderer(),
      quote: new QuoteRenderer(),
      'icon-cards': new IconCardsRenderer(),
      // 統合報告書コンポーネント
      philosophy: new PhilosophyRenderer(),
      ceoMessage: new CeoMessageRenderer(),
      businessModel: new BusinessModelRenderer()
    };

    // デフォルトレンダラー
    this.defaultRenderer = new ContentRenderer();
  }

  /**
   * スライドをレンダリング
   * @param {Object} slide - スライドデータ
   * @param {Object} settings - プレゼンテーション設定
   * @param {Object} options - 追加オプション
   * @returns {HTMLElement}
   */
  render(slide, settings = {}, options = {}) {
    this._initRenderers();
    const renderer = this.getRenderer(slide.type);
    const element = renderer.render(slide, settings);

    // ページ番号を設定（新しいクラス名に対応）
    if (options.pageNumber !== undefined) {
      const pageNumberEl = element.querySelector('.slide-footer-page');
      if (pageNumberEl) {
        pageNumberEl.textContent = `${options.pageNumber} / ${options.totalPages || options.pageNumber}`;
      }
    }

    return element;
  }

  /**
   * スライドタイプに対応するレンダラーを取得
   * @param {string} type
   * @returns {BaseRenderer}
   */
  getRenderer(type) {
    return this.renderers[type] || this.defaultRenderer;
  }

  /**
   * カスタムレンダラーを登録
   * @param {string} type
   * @param {BaseRenderer} renderer
   */
  registerRenderer(type, renderer) {
    this.renderers[type] = renderer;
  }

  /**
   * サムネイル用にスライドをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @param {number} scale
   * @returns {HTMLElement}
   */
  renderThumbnail(slide, settings, scale = 0.15) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-preview';
    // スケールはCSS変数（--thumbnail-scale）で制御
    // ResizeHandlerがサイドバー幅に応じて動的に更新する
    wrapper.style.width = '960px';
    wrapper.style.height = '540px';

    const element = this.render(slide, settings);
    wrapper.appendChild(element);

    // サムネイルにもlayoutを適用
    if (slide.layout) {
      this.applyLayoutToElement(element, slide.layout);
    }

    return wrapper;
  }

  /**
   * レイアウトを要素に適用
   * @param {HTMLElement} container
   * @param {Object} layout
   */
  applyLayoutToElement(container, layout) {
    const selectorMap = {
      'header': '.slide-header',
      'content': '.slide-content',
      'mainTitle': '.main-title',
      'subtitle': '.main-subtitle',
      'meta': '.meta-info',
      'title': '.slide-title',
      'subhead': '.slide-subhead',
      'sectionTitle': '.section-title',
      'sectionNumber': '.section-number',
      'points': '.points-list',
      'compare': '.compare-container',
      'column': '.compare-column',
      'cards': '.cards-container',
      'card': '.card',
      'timeline': '.timeline-container',
      'timelineItem': '.timeline-item',
      'agenda': '.agenda-list',
      'agendaItem': '.agenda-item',
      'listItem': '.list-item',
      'table': 'table',
      'tableRow': '.table-row',
      'tableHeader': 'th',
      'footerCompany': '.slide-footer-company',
      'footerPage': '.slide-footer-page',
      // リッチコンポーネント - コンテナ
      'process': '.process-container',
      'matrix': '.matrix-container',
      'kpi': '.kpi-container',
      'roadmap': '.roadmap-container',
      'quote': '.quote-container',
      'iconCards': '.icon-cards-container',
      // リッチコンポーネント - 個別要素
      'processStep': '.process-step',
      'processStepTitle': '.process-step-title',
      'processStepDesc': '.process-step-desc',
      'quadrant': '.matrix-quadrant',
      'quadrantTitle': '.quadrant-title',
      'kpiCard': '.kpi-card',
      'kpiIcon': '.kpi-icon',
      'kpiValue': '.kpi-value',
      'kpiLabel': '.kpi-label',
      'roadmapRow': '.roadmap-row',
      'quoteText': '.quote-text',
      'iconCard': '.icon-card',
      'iconCardIcon': '.icon-card-icon',
      'iconCardTitle': '.icon-card-title',
      'iconCardDesc': '.icon-card-desc',
      // 統合報告書コンポーネント - wills_ph3 準拠クラス名
      'philosophy': '.slide-philosophy',
      'philosophyGrid': '.ir-philosophy-grid',
      'irCard': '.ir-card',
      'irCardIcon': '.ir-card__icon',
      'irCardTitle': '.ir-card__title',
      'irCardBody': '.ir-card__body',
      'ceoMessage': '.slide-ceo-message',
      'irCeoLayout': '.ir-ceo-layout',
      'irCeoPhoto': '.ir-ceo-photo',
      'irCeoQuote': '.ir-ceo-quote',
      'irCeoColumns': '.ir-ceo-columns',
      'irCeoSection': '.ir-ceo-section',
      'businessModel': '.slide-business-model',
      'irBmLayout': '.ir-bm-layout',
      'irBmColumn': '.ir-bm-column',
      'irBmItem': '.ir-bm-item',
      'irBmProcess': '.ir-bm-process',
      'irBmProcessStep': '.ir-bm-process-step',
      'irStatGrid': '.ir-stat-grid',
      'irStatCard': '.ir-stat-card'
    };

    Object.entries(layout).forEach(([key, pos]) => {
      if (!pos) return;

      // 数字のみのキーや特殊なキーはスキップ
      if (/^\d+$/.test(key) || key === 'savedAt' || key === 'currentIndex') return;

      // インデックス付きキーをパース（例: column_0）
      const match = key.match(/^(.+)_(\d+)$/);
      let el;

      if (match) {
        const baseType = match[1];
        const index = parseInt(match[2], 10);
        const selector = selectorMap[baseType] || `.${baseType}`;
        try {
          const elements = container.querySelectorAll(selector);
          el = elements[index];
        } catch (e) {
          return; // 無効なセレクタの場合はスキップ
        }
      } else {
        const selector = selectorMap[key] || `.${key}`;
        try {
          el = container.querySelector(selector);
        } catch (e) {
          return; // 無効なセレクタの場合はスキップ
        }
      }

      if (el) {
        if (pos.x !== undefined || pos.y !== undefined) {
          el.style.transform = `translate(${pos.x || 0}px, ${pos.y || 0}px)`;
        }
        if (pos.width) el.style.width = `${pos.width}px`;
        if (pos.height) el.style.height = `${pos.height}px`;
      }
    });
  }

  /**
   * 全スライドをレンダリング（エクスポート用）
   * @param {Array} slides
   * @param {Object} settings
   * @returns {HTMLElement[]}
   */
  renderAll(slides, settings) {
    return slides.map((slide, index) => {
      return this.render(slide, settings, {
        pageNumber: index + 1,
        totalPages: slides.length
      });
    });
  }
}

/**
 * SectionRenderer - セクション区切りスライド
 */
class SectionRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'section';
  }

  render(slide, settings = {}) {
    const container = document.createElement('div');
    container.className = 'slide slide-section';
    container.dataset.slideId = slide.id;

    // セクション番号（背景用）- 編集可能
    if (slide.data.number !== undefined) {
      const number = this.createEditableText(
        'span',
        'section-number',
        slide.data.number,
        'data.number',
        slide.id
      );
      container.appendChild(number);
    }

    // セクションタイトル - 編集可能
    const title = this.createEditableText(
      'h2',
      'section-title',
      slide.data.title || '',
      'data.title',
      slide.id
    );
    container.appendChild(title);

    return container;
  }
}

/**
 * AgendaRenderer - アジェンダスライド
 */
class AgendaRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'agenda';
  }

  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-agenda';

    // ヘッダー
    const header = this.renderHeader(slide);
    wrapper.appendChild(header);

    // アジェンダリスト
    const list = document.createElement('div');
    list.className = 'agenda-list';

    const items = slide.data.items || [];
    items.forEach((item, index) => {
      const agendaItem = document.createElement('div');
      agendaItem.className = 'agenda-item';

      const number = document.createElement('span');
      number.className = 'agenda-number';
      number.textContent = index + 1;
      agendaItem.appendChild(number);

      const text = document.createElement('span');
      text.className = 'agenda-text';
      text.textContent = typeof item === 'string' ? item : item.text || '';
      agendaItem.appendChild(text);

      list.appendChild(agendaItem);
    });

    wrapper.appendChild(list);
    return wrapper;
  }
}

/**
 * ClosingRenderer - クロージングスライド
 */
class ClosingRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'closing';
  }

  render(slide, settings = {}) {
    const container = document.createElement('div');
    container.className = 'slide slide-closing';
    container.dataset.slideId = slide.id;

    // クロージングタイトル
    const title = document.createElement('h2');
    title.className = 'closing-title';
    title.textContent = slide.data.title || 'ご清聴ありがとうございました';
    container.appendChild(title);

    // サブタイトル（会社名など）
    if (slide.data.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'closing-subtitle';
      subtitle.textContent = slide.data.subtitle;
      container.appendChild(subtitle);
    }

    return container;
  }
}

// グローバルに公開
window.SlideRenderer = new SlideRenderer();

})();
