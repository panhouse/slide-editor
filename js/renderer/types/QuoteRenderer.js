/**
 * QuoteRenderer.js - 引用/ハイライトスライドレンダラー
 * 重要メッセージを強調表示
 * PanHouse Slide Editor
 */

class QuoteRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'quote';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-quote';

    const style = slide.data.style || 'default'; // default, highlight, callout, stat
    wrapper.classList.add(`quote-style-${style}`);

    // メインの引用/メッセージ
    const quoteContainer = document.createElement('div');
    quoteContainer.className = 'quote-container';

    // 引用マーク（オプション）
    if (style === 'default' || style === 'callout') {
      const quoteMark = document.createElement('div');
      quoteMark.className = 'quote-mark';
      quoteMark.textContent = '"';
      quoteContainer.appendChild(quoteMark);
    }

    // アイコン（ハイライトスタイル用）
    if (slide.data.icon) {
      const icon = document.createElement('div');
      icon.className = 'quote-icon';
      icon.textContent = slide.data.icon;
      quoteContainer.appendChild(icon);
    }

    // メインテキスト
    const text = document.createElement('blockquote');
    text.className = 'quote-text';
    text.textContent = slide.data.text || slide.data.quote || slide.data.message || '';
    text.dataset.field = 'data.text';
    text.dataset.slideId = slide.id;
    text.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableTextEditing(text, 'text', slide.id);
    });
    quoteContainer.appendChild(text);

    // 引用元（オプション）
    if (slide.data.author || slide.data.source) {
      const source = document.createElement('cite');
      source.className = 'quote-source';
      source.textContent = `— ${slide.data.author || slide.data.source}`;
      source.dataset.field = 'data.author';
      source.dataset.slideId = slide.id;
      source.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(source, 'author', slide.id);
      });
      quoteContainer.appendChild(source);
    }

    wrapper.appendChild(quoteContainer);

    // 補足説明（オプション）
    if (slide.data.desc || slide.data.description) {
      const desc = document.createElement('p');
      desc.className = 'quote-desc';
      desc.textContent = slide.data.desc || slide.data.description;
      desc.dataset.field = 'data.desc';
      desc.dataset.slideId = slide.id;
      desc.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableTextEditing(desc, 'desc', slide.id);
      });
      wrapper.appendChild(desc);
    }

    // ポイント/箇条書き（オプション）
    if (slide.data.points && slide.data.points.length > 0) {
      const pointsWrapper = document.createElement('div');
      pointsWrapper.className = 'quote-points';

      const list = this.renderEditableList(slide.data.points, 'points', slide.id);
      pointsWrapper.appendChild(list);
      wrapper.appendChild(pointsWrapper);
    }

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
        let value = el.textContent;
        // 引用元の場合、先頭の「— 」を除去
        if (field === 'author' && value.startsWith('— ')) {
          value = value.substring(2);
        }
        SlideManager.updateCurrentSlide({ data: { [field]: value } });
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
window.QuoteRenderer = QuoteRenderer;
