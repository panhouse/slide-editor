/**
 * CeoMessageRenderer.js - CEOメッセージスライドレンダラー
 * wills_ph3 準拠: 写真+メッセージの2カラムレイアウト
 * PanHouse Slide Editor - 統合報告書対応
 */

class CeoMessageRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'ceoMessage';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-ceo-message';

    // タイトル
    if (slide.data.title) {
      const title = document.createElement('h2');
      title.className = 'slide-heading ceo-title';
      title.textContent = slide.data.title;
      title.dataset.field = 'data.title';
      title.dataset.slideId = slide.id;
      title.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(title, 'title', slide.id);
      });
      wrapper.appendChild(title);
    }

    // wills_ph3準拠: ir-ceo-layout (400px + 1fr グリッド)
    const layout = document.createElement('div');
    layout.className = 'ir-ceo-layout';

    // 左カラム: CEO写真 + 名前ボックス（オーバーレイ）
    const photoSection = document.createElement('div');
    photoSection.className = 'ir-ceo-photo';

    // 写真
    if (slide.data.ceo?.photo) {
      const photo = document.createElement('img');
      photo.className = 'ir-ceo-photo__img';
      photo.src = slide.data.ceo.photo;
      photo.alt = slide.data.ceo.name || 'CEO';
      photoSection.appendChild(photo);
    } else {
      // プレースホルダー
      const placeholder = document.createElement('div');
      placeholder.className = 'ir-ceo-photo__img';
      placeholder.style.background = '#EEEEEC';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.color = '#888';
      placeholder.style.fontSize = '14px';
      placeholder.textContent = 'CEO写真';
      photoSection.appendChild(placeholder);
    }

    // 名前ボックス（写真上にオーバーレイ）
    if (slide.data.ceo) {
      const nameBox = document.createElement('div');
      nameBox.className = 'ir-ceo-photo__name-box';

      if (slide.data.ceo.title) {
        const position = document.createElement('div');
        position.className = 'ir-ceo-photo__position';
        position.textContent = slide.data.ceo.title;
        nameBox.appendChild(position);
      }

      if (slide.data.ceo.name) {
        const name = document.createElement('div');
        name.className = 'ir-ceo-photo__name';
        name.textContent = slide.data.ceo.name;
        nameBox.appendChild(name);
      }

      photoSection.appendChild(nameBox);
    }

    layout.appendChild(photoSection);

    // 右カラム: メッセージコンテンツ
    const contentSection = document.createElement('div');
    contentSection.className = 'ir-ceo-content';

    // 引用文（大きな引用符付き）
    if (slide.data.quote) {
      const quoteBox = document.createElement('blockquote');
      quoteBox.className = 'ir-ceo-quote';
      quoteBox.textContent = slide.data.quote;
      quoteBox.dataset.field = 'data.quote';
      quoteBox.dataset.slideId = slide.id;
      quoteBox.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(quoteBox, 'quote', slide.id);
      });
      contentSection.appendChild(quoteBox);
    }

    // セクション（2カラムグリッド）
    if (slide.data.sections && slide.data.sections.length > 0) {
      const sectionsGrid = document.createElement('div');
      sectionsGrid.className = 'ir-ceo-columns';

      slide.data.sections.forEach((section, index) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'ir-ceo-section';

        if (section.heading) {
          const heading = document.createElement('h3');
          heading.className = 'ir-ceo-section__title';
          heading.textContent = section.heading;
          sectionEl.appendChild(heading);
        }

        if (section.body) {
          const body = document.createElement('p');
          body.className = 'ir-ceo-section__body';
          body.textContent = section.body;
          sectionEl.appendChild(body);
        }

        sectionsGrid.appendChild(sectionEl);
      });

      contentSection.appendChild(sectionsGrid);
    }

    // 単一の本文（sectionsがない場合）
    if (slide.data.body && (!slide.data.sections || slide.data.sections.length === 0)) {
      const body = document.createElement('p');
      body.className = 'ir-ceo-section__body';
      body.textContent = slide.data.body;
      body.dataset.field = 'data.body';
      body.dataset.slideId = slide.id;
      body.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(body, 'body', slide.id);
      });
      contentSection.appendChild(body);
    }

    layout.appendChild(contentSection);
    wrapper.appendChild(layout);

    return wrapper;
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
      if (e.key === 'Escape') {
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
window.CeoMessageRenderer = CeoMessageRenderer;
