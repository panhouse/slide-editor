/**
 * TableRenderer.js - テーブルスライドレンダラー
 * PanHouse Slide Editor
 */

class TableRenderer extends BaseRenderer {
  constructor() {
    super();
    this.type = 'table';
  }

  /**
   * コンテンツをレンダリング
   * @param {Object} slide
   * @param {Object} settings
   * @returns {HTMLElement}
   */
  renderContent(slide, settings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-table';

    // ヘッダー（タイトル・サブヘッド）- 編集可能
    const header = this.renderEditableHeader(slide);
    wrapper.appendChild(header);

    // テーブル
    const tableContainer = document.createElement('div');
    tableContainer.className = 'slide-content';

    const table = this.renderEditableTable(slide.data, slide.id);
    tableContainer.appendChild(table);

    wrapper.appendChild(tableContainer);
    return wrapper;
  }

  /**
   * 編集可能なヘッダーをレンダリング
   * @param {Object} slide
   * @returns {HTMLElement}
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
   * 編集可能なテーブルをレンダリング
   * @param {Object} data
   * @param {string} slideId
   * @returns {HTMLElement}
   */
  renderEditableTable(data, slideId) {
    const table = document.createElement('table');
    table.dataset.slideId = slideId;

    // ヘッダー行
    if (data.headers && data.headers.length > 0) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      data.headers.forEach((headerText, colIndex) => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.dataset.field = `headers.${colIndex}`;
        th.dataset.slideId = slideId;
        th.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.enableTableCellEditing(th, 'headers', colIndex, null, slideId);
        });
        tr.appendChild(th);
      });

      thead.appendChild(tr);
      table.appendChild(thead);
    }

    // データ行
    if (data.rows && data.rows.length > 0) {
      const tbody = document.createElement('tbody');

      data.rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row';
        tr.dataset.rowIndex = rowIndex;

        row.forEach((cellData, colIndex) => {
          const td = document.createElement('td');

          // 状態列の特別処理
          if (this.isStatusColumn(data.headers, colIndex)) {
            const badge = this.renderStatusBadge(cellData);
            badge.dataset.field = `rows.${rowIndex}.${colIndex}`;
            badge.dataset.slideId = slideId;
            badge.addEventListener('dblclick', (e) => {
              e.stopPropagation();
              this.enableTableCellEditing(badge, 'rows', colIndex, rowIndex, slideId);
            });
            td.appendChild(badge);
          } else {
            td.textContent = cellData;
            td.dataset.field = `rows.${rowIndex}.${colIndex}`;
            td.dataset.slideId = slideId;
            td.addEventListener('dblclick', (e) => {
              e.stopPropagation();
              this.enableTableCellEditing(td, 'rows', colIndex, rowIndex, slideId);
            });
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
    }

    return table;
  }

  /**
   * テーブルセルの編集を有効化
   * @param {HTMLElement} el
   * @param {string} arrayType - 'headers' or 'rows'
   * @param {number} colIndex
   * @param {number|null} rowIndex
   * @param {string} slideId
   */
  enableTableCellEditing(el, arrayType, colIndex, rowIndex, slideId) {
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
        if (arrayType === 'headers') {
          const headers = [...(currentSlide.data.headers || [])];
          headers[colIndex] = el.textContent;
          SlideManager.updateCurrentSlide({ data: { headers } });
        } else if (arrayType === 'rows') {
          const rows = currentSlide.data.rows.map(row => [...row]);
          if (rows[rowIndex]) {
            rows[rowIndex][colIndex] = el.textContent;
            SlideManager.updateCurrentSlide({ data: { rows } });
          }
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

  /**
   * テーブルをレンダリング（後方互換性のため残す）
   * @param {Object} data
   * @returns {HTMLElement}
   */
  renderTable(data) {
    const table = document.createElement('table');

    // ヘッダー行
    if (data.headers && data.headers.length > 0) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      data.headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        tr.appendChild(th);
      });

      thead.appendChild(tr);
      table.appendChild(thead);
    }

    // データ行
    if (data.rows && data.rows.length > 0) {
      const tbody = document.createElement('tbody');

      data.rows.forEach(row => {
        const tr = document.createElement('tr');

        row.forEach((cellData, index) => {
          const td = document.createElement('td');

          // 状態列の特別処理
          if (this.isStatusColumn(data.headers, index)) {
            td.appendChild(this.renderStatusBadge(cellData));
          } else {
            td.textContent = cellData;
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
    }

    return table;
  }

  /**
   * 状態列かどうかを判定
   * @param {Array} headers
   * @param {number} index
   * @returns {boolean}
   */
  isStatusColumn(headers, index) {
    if (!headers || !headers[index]) return false;
    const header = headers[index].toLowerCase();
    return header.includes('状態') || header.includes('ステータス') || header === 'status';
  }

  /**
   * ステータスバッジをレンダリング
   * @param {string} status
   * @returns {HTMLElement}
   */
  renderStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    badge.textContent = status;

    // ステータスに応じたクラスを追加
    const statusLower = status.toLowerCase();
    if (statusLower.includes('完了') || statusLower === 'completed' || statusLower === 'done') {
      badge.classList.add('completed');
    } else if (statusLower.includes('進行') || statusLower === 'in-progress' || statusLower === 'in progress') {
      badge.classList.add('in-progress');
    } else {
      badge.classList.add('pending');
    }

    return badge;
  }
}

// グローバルに公開
window.TableRenderer = TableRenderer;
