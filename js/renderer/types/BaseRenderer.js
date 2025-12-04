/**
 * BaseRenderer.js - レンダラー基底クラス
 * PanHouse Slide Editor
 */

class BaseRenderer {
  constructor() {
    this.type = 'base';
  }

  /**
   * スライドをレンダリング
   * @param {Object} slide - スライドデータ
   * @param {Object} settings - プレゼンテーション設定
   * @returns {HTMLElement}
   */
  render(slide, settings = {}) {
    const container = document.createElement('div');
    container.className = `slide slide-${slide.type}`;
    container.dataset.slideId = slide.id;

    // コンテンツをレンダリング
    const content = this.renderContent(slide, settings);
    container.appendChild(content);

    // フッターを追加（オプション）
    if (settings.showFooter !== false) {
      const footer = this.renderFooter(slide, settings);
      if (footer) {
        container.appendChild(footer);
      }
    }

    return container;
  }

  /**
   * コンテンツをレンダリング（サブクラスでオーバーライド）
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const content = document.createElement('div');
    content.className = 'slide-content';
    content.textContent = 'BaseRenderer: renderContentをオーバーライドしてください';
    return content;
  }

  /**
   * ヘッダー（タイトル部分）をレンダリング
   * @param {Object} slide
   * @returns {HTMLElement}
   */
  renderHeader(slide) {
    const header = document.createElement('div');
    header.className = 'slide-header';

    if (slide.data.title) {
      const title = document.createElement('h2');
      title.className = 'slide-title';
      title.textContent = slide.data.title;
      header.appendChild(title);
    }

    if (slide.data.subhead) {
      const subhead = document.createElement('p');
      subhead.className = 'slide-subhead';
      subhead.textContent = slide.data.subhead;
      header.appendChild(subhead);
    }

    return header;
  }

  /**
   * フッターをレンダリング（会社名:左下、ページ番号:右下 - 両方ドラッグ可能）
   * @param {Object} slide
   * @param {Object} settings
   * @returns {DocumentFragment|null}
   */
  renderFooter(slide, settings) {
    // タイトル・セクション・クロージングはフッターなし
    if (['title', 'section', 'closing'].includes(slide.type)) {
      return null;
    }

    const fragment = document.createDocumentFragment();

    // 会社名（左下）
    const companyName = document.createElement('div');
    companyName.className = 'slide-footer-company';
    companyName.textContent = settings.companyName || '';
    fragment.appendChild(companyName);

    // ページ番号（右下）- 独立した要素としてドラッグ可能
    const pageNumber = document.createElement('div');
    pageNumber.className = 'slide-footer-page';
    // ページ番号は後でSlideRendererで設定
    fragment.appendChild(pageNumber);

    return fragment;
  }

  /**
   * 箇条書きリストをレンダリング
   * @param {Array} items
   * @param {Object} options
   * @returns {HTMLElement}
   */
  renderList(items, options = {}) {
    const list = document.createElement('ul');
    list.className = `points-list ${options.numbered ? 'numbered' : ''}`;

    items.forEach(item => {
      const li = document.createElement('li');
      if (typeof item === 'string') {
        li.textContent = item;
      } else if (item && item.text) {
        li.textContent = item.text;
      }
      list.appendChild(li);
    });

    return list;
  }

  /**
   * HTMLを安全にエスケープ
   * @param {string} str
   * @returns {string}
   */
  escape(str) {
    return Utils.escapeHtml(str);
  }

  /**
   * 編集可能なテキスト要素を作成
   * @param {string} tagName - HTMLタグ名
   * @param {string} className - CSSクラス
   * @param {string} text - テキスト内容
   * @param {string} dataField - データフィールド名
   * @param {string} slideId - スライドID
   * @returns {HTMLElement}
   */
  createEditableText(tagName, className, text, dataField, slideId) {
    const el = document.createElement(tagName);
    el.className = className;
    el.textContent = text || '';
    el.dataset.field = dataField;
    el.dataset.slideId = slideId;

    // ダブルクリックで編集モードに
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableEditing(el, dataField);
    });

    return el;
  }

  /**
   * 編集モードを有効化
   * @param {HTMLElement} el
   * @param {string} dataField
   */
  enableEditing(el, dataField) {
    // すでに編集中なら何もしない
    if (el.contentEditable === 'true') return;

    el.contentEditable = 'true';
    el.classList.add('editing');
    el.focus();

    // テキストを選択
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);

    // blur時に保存
    const saveAndExit = () => {
      el.contentEditable = 'false';
      el.classList.remove('editing');
      this.saveFieldValue(el.dataset.slideId, dataField, el.textContent);
      el.removeEventListener('blur', saveAndExit);
      el.removeEventListener('keydown', handleKeydown);
    };

    // Enterで確定、Escでキャンセル
    const handleKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Escape') {
        el.contentEditable = 'false';
        el.classList.remove('editing');
        // 変更を破棄して再レンダリング
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
   * フィールドの値を保存
   * @param {string} slideId
   * @param {string} field
   * @param {string} value
   */
  saveFieldValue(slideId, field, value) {
    const currentSlide = SlideManager.getCurrentSlide();
    if (!currentSlide || currentSlide.id !== slideId) return;

    // ネストされたフィールドに対応（例: data.title）
    if (field.startsWith('data.')) {
      const dataField = field.replace('data.', '');
      SlideManager.updateCurrentSlide({ data: { [dataField]: value } });
    } else {
      SlideManager.updateCurrentSlide({ [field]: value });
    }
  }

  /**
   * 編集可能な箇条書きリストをレンダリング
   * @param {Array} items
   * @param {string} dataField
   * @param {string} slideId
   * @param {Object} options
   * @returns {HTMLElement}
   */
  renderEditableList(items, dataField, slideId, options = {}) {
    const list = document.createElement('ul');
    list.className = `points-list ${options.numbered ? 'numbered' : ''}`;
    list.dataset.field = dataField;
    list.dataset.slideId = slideId;

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'list-item';

      // アイテムがオブジェクト（インデント情報あり）か文字列かで処理分岐
      if (typeof item === 'string') {
        li.textContent = item;
        li.dataset.indent = '0';
      } else if (item && typeof item === 'object') {
        li.textContent = item.text || '';
        const indent = item.indent || 0;
        li.dataset.indent = indent;
        if (indent > 0) {
          li.style.marginLeft = `${indent * 24}px`;
          li.classList.add(`indent-${indent}`);
        }
      }

      li.dataset.index = index;
      li.dataset.itemIndex = index;

      // ダブルクリックで編集
      li.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableListItemEditing(li, list, dataField, slideId, index);
      });

      list.appendChild(li);
    });

    return list;
  }

  /**
   * リストアイテムの編集を有効化
   */
  enableListItemEditing(li, list, dataField, slideId, index) {
    if (li.contentEditable === 'true') return;

    li.contentEditable = 'true';
    li.classList.add('editing');

    const self = this;

    const saveList = () => {
      // リスト全体を更新（ネスト構造を保持）
      const items = self.extractListItems(list);
      const currentSlide = SlideManager.getCurrentSlide();
      if (currentSlide && currentSlide.id === slideId) {
        SlideManager.updateCurrentSlide({ data: { [dataField]: items } });
      }
    };

    const saveAndExit = (e) => {
      // 新しいリストアイテムへの移動時はスキップ（relatedTargetで判定）
      if (e && e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('ul') === list) {
        // 同じリスト内の別の要素にフォーカスが移る場合は保存のみ
        li.contentEditable = 'false';
        li.classList.remove('editing');
        li.removeEventListener('blur', saveAndExit);
        li.removeEventListener('keydown', handleKeydown);
        return;
      }
      li.contentEditable = 'false';
      li.classList.remove('editing');
      saveList();
      li.removeEventListener('blur', saveAndExit);
      li.removeEventListener('keydown', handleKeydown);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // 先にイベントリスナーを解除してから新しいアイテムを追加
        li.removeEventListener('blur', saveAndExit);
        li.removeEventListener('keydown', handleKeydown);
        li.contentEditable = 'false';
        li.classList.remove('editing');
        // 新しいリストアイテムを追加
        self.addNewListItem(li, list, dataField, slideId);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: インデント解除
          self.unindentListItem(li, list);
        } else {
          // Tab: インデント
          self.indentListItem(li, list);
        }
        saveList();
      } else if (e.key === 'Backspace' && li.textContent === '') {
        e.preventDefault();
        // 先にイベントリスナーを解除
        li.removeEventListener('blur', saveAndExit);
        li.removeEventListener('keydown', handleKeydown);
        // 空の項目でBackspace: 項目削除して前の項目にフォーカス
        self.removeListItem(li, list, dataField, slideId);
      } else if (e.key === 'Escape') {
        li.contentEditable = 'false';
        li.classList.remove('editing');
        EventBus.emit(Events.SLIDE_UPDATED, SlideManager.getCurrentSlide());
        li.removeEventListener('blur', saveAndExit);
        li.removeEventListener('keydown', handleKeydown);
      }
      e.stopPropagation();
    };

    li.addEventListener('blur', saveAndExit);
    li.addEventListener('keydown', handleKeydown);

    // フォーカスを当てる（DOMが安定してから）
    requestAnimationFrame(() => {
      li.focus();
      // テキストがある場合は末尾にカーソルを置く
      const selection = window.getSelection();
      const range = document.createRange();
      if (li.childNodes.length > 0) {
        range.selectNodeContents(li);
        range.collapse(false); // 末尾に
      } else {
        range.setStart(li, 0);
        range.collapse(true);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  /**
   * 新しいリストアイテムを追加
   */
  addNewListItem(currentLi, list, dataField, slideId) {
    const newLi = document.createElement('li');
    newLi.className = 'list-item';
    newLi.textContent = '';

    // 現在のアイテムのインデントレベルを継承
    const currentIndent = parseInt(currentLi.dataset.indent || '0', 10);
    newLi.dataset.indent = currentIndent;
    newLi.dataset.itemIndex = '-1';
    if (currentIndent > 0) {
      newLi.style.marginLeft = `${currentIndent * 24}px`;
      newLi.classList.add(`indent-${currentIndent}`);
    }

    // 現在のアイテムの後に挿入
    if (currentLi.nextSibling) {
      list.insertBefore(newLi, currentLi.nextSibling);
    } else {
      list.appendChild(newLi);
    }

    // 新しいアイテムの編集を開始（currentLiの編集終了は呼び出し元で実施済み）
    this.enableListItemEditing(newLi, list, dataField, slideId, -1);
  }

  /**
   * リストアイテムをインデント
   */
  indentListItem(li, list) {
    const currentIndent = parseInt(li.dataset.indent || '0', 10);
    const maxIndent = 3; // 最大インデントレベル

    if (currentIndent < maxIndent) {
      const newIndent = currentIndent + 1;
      li.dataset.indent = newIndent;
      li.style.marginLeft = `${newIndent * 24}px`;
      li.classList.add(`indent-${newIndent}`);
      if (currentIndent > 0) {
        li.classList.remove(`indent-${currentIndent}`);
      }
    }
  }

  /**
   * リストアイテムのインデントを解除
   */
  unindentListItem(li, list) {
    const currentIndent = parseInt(li.dataset.indent || '0', 10);

    if (currentIndent > 0) {
      const newIndent = currentIndent - 1;
      li.dataset.indent = newIndent;
      li.style.marginLeft = `${newIndent * 24}px`;
      li.classList.remove(`indent-${currentIndent}`);
      if (newIndent > 0) {
        li.classList.add(`indent-${newIndent}`);
      }
    }
  }

  /**
   * リストアイテムを削除
   */
  removeListItem(li, list, dataField, slideId) {
    const prevLi = li.previousElementSibling;
    const nextLi = li.nextElementSibling;

    // 最後の1つは削除しない
    if (list.querySelectorAll('li').length <= 1) {
      return;
    }

    li.remove();

    // 前のアイテムがあればそこにフォーカス
    if (prevLi) {
      this.enableListItemEditing(prevLi, list, dataField, slideId, -1);
      // カーソルを末尾に
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(prevLi);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (nextLi) {
      this.enableListItemEditing(nextLi, list, dataField, slideId, -1);
    }

    // リストを保存
    const items = this.extractListItems(list);
    const currentSlide = SlideManager.getCurrentSlide();
    if (currentSlide && currentSlide.id === slideId) {
      SlideManager.updateCurrentSlide({ data: { [dataField]: items } });
    }
  }

  /**
   * リストからアイテムを抽出（インデント情報を保持）
   */
  extractListItems(list) {
    return Array.from(list.querySelectorAll('li')).map(item => {
      const indent = parseInt(item.dataset.indent || '0', 10);
      if (indent > 0) {
        return { text: item.textContent, indent: indent };
      }
      return item.textContent;
    });
  }
}

// グローバルに公開
window.BaseRenderer = BaseRenderer;
