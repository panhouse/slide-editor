/**
 * Properties.js - プロパティパネル
 * PanHouse Slide Editor
 */

class Properties {
  constructor() {
    this.container = document.getElementById('propertiesPanel');
    this.currentSlide = null;
    this.setupEventListeners();
  }

  /**
   * 初期化
   */
  init() {
    this.render();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    EventBus.on(Events.SLIDE_SELECTED, (index, slide) => {
      this.currentSlide = slide;
      this.render();
    });

    EventBus.on(Events.SLIDE_UPDATED, (slide, index) => {
      if (this.currentSlide && this.currentSlide.id === slide.id) {
        this.currentSlide = slide;
      }
    });
  }

  /**
   * プロパティパネルをレンダリング
   */
  render() {
    if (!this.container) return;

    if (!this.currentSlide) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>スライドを選択してください</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = '';

    // スライドタイプ
    this.container.appendChild(this.createTypeSelector());

    // タイプ別のプロパティ
    const typeProperties = this.createTypeProperties();
    this.container.appendChild(typeProperties);

    // スピーカーノート
    this.container.appendChild(this.createNotesEditor());
  }

  /**
   * タイプセレクターを作成
   * @returns {HTMLElement}
   */
  createTypeSelector() {
    const group = document.createElement('div');
    group.className = 'property-group';

    const label = document.createElement('label');
    label.className = 'property-label';
    label.textContent = 'スライドタイプ';
    group.appendChild(label);

    const select = document.createElement('select');
    select.className = 'property-select';

    const types = [
      { value: 'title', label: 'タイトル' },
      { value: 'section', label: 'セクション' },
      { value: 'content', label: 'コンテンツ' },
      { value: 'agenda', label: 'アジェンダ' },
      { value: 'table', label: 'テーブル' },
      { value: 'compare', label: '比較' },
      { value: 'cards', label: 'カード' },
      { value: 'timeline', label: 'タイムライン' },
      { value: 'closing', label: 'クロージング' }
    ];

    types.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = value === this.currentSlide.type;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      SlideManager.updateCurrentSlide({ type: e.target.value });
      this.render(); // タイプ変更でプロパティを再描画
    });

    group.appendChild(select);
    return group;
  }

  /**
   * タイプ別プロパティを作成
   * @returns {HTMLElement}
   */
  createTypeProperties() {
    const container = document.createElement('div');
    container.className = 'type-properties';

    const slide = this.currentSlide;
    const data = slide.data;

    // タイトル（共通）
    container.appendChild(this.createTextInput('title', 'タイトル', data.title));

    // タイプ別のプロパティ
    switch (slide.type) {
      case 'title':
        container.appendChild(this.createTextInput('subtitle', 'サブタイトル', data.subtitle));
        container.appendChild(this.createTextInput('date', '日付', data.date));
        break;

      case 'content':
        container.appendChild(this.createTextInput('subhead', 'サブヘッド', data.subhead));
        container.appendChild(this.createListEditor('points', '箇条書き', data.points || []));
        break;

      case 'agenda':
        container.appendChild(this.createListEditor('items', 'アジェンダ項目', data.items || []));
        break;

      case 'table':
        container.appendChild(this.createTextInput('headers', 'ヘッダー（カンマ区切り）',
          (data.headers || []).join(', ')));
        break;

      case 'compare':
        container.appendChild(this.createTextInput('leftTitle', '左タイトル', data.leftTitle));
        container.appendChild(this.createListEditor('leftItems', '左側の項目', data.leftItems || []));
        container.appendChild(this.createTextInput('rightTitle', '右タイトル', data.rightTitle));
        container.appendChild(this.createListEditor('rightItems', '右側の項目', data.rightItems || []));
        break;

      case 'closing':
        container.appendChild(this.createTextInput('subtitle', '会社名', data.subtitle));
        break;

      case 'section':
        container.appendChild(this.createTextInput('number', 'セクション番号', data.number));
        break;

      case 'timeline':
        container.appendChild(this.createMilestonesEditor(data.milestones || []));
        break;

      case 'cards':
        container.appendChild(this.createCardsEditor(data.items || []));
        break;
    }

    return container;
  }

  /**
   * テキスト入力を作成
   * @param {string} key
   * @param {string} label
   * @param {string} value
   * @returns {HTMLElement}
   */
  createTextInput(key, label, value) {
    const group = document.createElement('div');
    group.className = 'property-group';

    const labelEl = document.createElement('label');
    labelEl.className = 'property-label';
    labelEl.textContent = label;
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'property-input';
    input.value = value || '';

    // デバウンスして更新
    const updateValue = Utils.debounce((newValue) => {
      const updateData = {};

      if (key === 'headers') {
        // カンマ区切りを配列に変換
        updateData[key] = newValue.split(',').map(s => s.trim()).filter(s => s);
      } else {
        updateData[key] = newValue;
      }

      SlideManager.updateCurrentSlide({ data: updateData });
    }, 300);

    input.addEventListener('input', (e) => updateValue(e.target.value));

    group.appendChild(input);
    return group;
  }

  /**
   * リストエディターを作成
   * @param {string} key
   * @param {string} label
   * @param {Array} items
   * @returns {HTMLElement}
   */
  createListEditor(key, label, items) {
    const group = document.createElement('div');
    group.className = 'property-group';

    const labelEl = document.createElement('label');
    labelEl.className = 'property-label';
    labelEl.textContent = label;
    group.appendChild(labelEl);

    const textarea = document.createElement('textarea');
    textarea.className = 'property-textarea';
    textarea.value = items.join('\n');
    textarea.placeholder = '1行に1項目';

    const updateValue = Utils.debounce((newValue) => {
      const newItems = newValue.split('\n').filter(s => s.trim());
      SlideManager.updateCurrentSlide({ data: { [key]: newItems } });
    }, 300);

    textarea.addEventListener('input', (e) => updateValue(e.target.value));

    group.appendChild(textarea);
    return group;
  }

  /**
   * マイルストーンエディターを作成（タイムライン用）
   * @param {Array} milestones
   * @returns {HTMLElement}
   */
  createMilestonesEditor(milestones) {
    const group = document.createElement('div');
    group.className = 'property-group';

    const label = document.createElement('label');
    label.className = 'property-label';
    label.textContent = 'マイルストーン';
    group.appendChild(label);

    const container = document.createElement('div');
    container.className = 'milestones-editor';

    const renderMilestones = () => {
      container.innerHTML = '';

      milestones.forEach((milestone, index) => {
        const item = document.createElement('div');
        item.className = 'milestone-item';
        item.style.cssText = 'border: 1px solid var(--border-color); padding: 8px; margin-bottom: 8px; border-radius: 4px;';

        // 期間入力
        const periodInput = document.createElement('input');
        periodInput.type = 'text';
        periodInput.className = 'property-input';
        periodInput.value = milestone.period || '';
        periodInput.placeholder = '期間（例: 2025年1月）';
        periodInput.style.marginBottom = '4px';
        periodInput.addEventListener('input', Utils.debounce((e) => {
          milestones[index].period = e.target.value;
          SlideManager.updateCurrentSlide({ data: { milestones: [...milestones] } });
        }, 300));
        item.appendChild(periodInput);

        // タイトル入力
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'property-input';
        titleInput.value = milestone.title || '';
        titleInput.placeholder = 'タイトル';
        titleInput.style.marginBottom = '4px';
        titleInput.addEventListener('input', Utils.debounce((e) => {
          milestones[index].title = e.target.value;
          SlideManager.updateCurrentSlide({ data: { milestones: [...milestones] } });
        }, 300));
        item.appendChild(titleInput);

        // 説明入力
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'property-input';
        descInput.value = milestone.description || '';
        descInput.placeholder = '説明';
        descInput.addEventListener('input', Utils.debounce((e) => {
          milestones[index].description = e.target.value;
          SlideManager.updateCurrentSlide({ data: { milestones: [...milestones] } });
        }, 300));
        item.appendChild(descInput);

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-secondary';
        deleteBtn.textContent = '削除';
        deleteBtn.style.cssText = 'margin-top: 4px; font-size: 12px; padding: 2px 8px;';
        deleteBtn.addEventListener('click', () => {
          milestones.splice(index, 1);
          SlideManager.updateCurrentSlide({ data: { milestones: [...milestones] } });
          renderMilestones();
        });
        item.appendChild(deleteBtn);

        container.appendChild(item);
      });

      // 追加ボタン
      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary';
      addBtn.textContent = '+ マイルストーン追加';
      addBtn.style.cssText = 'width: 100%; font-size: 12px;';
      addBtn.addEventListener('click', () => {
        milestones.push({ period: '', title: '', description: '' });
        SlideManager.updateCurrentSlide({ data: { milestones: [...milestones] } });
        renderMilestones();
      });
      container.appendChild(addBtn);
    };

    renderMilestones();
    group.appendChild(container);
    return group;
  }

  /**
   * カードエディターを作成（カードスライド用）
   * @param {Array} items
   * @returns {HTMLElement}
   */
  createCardsEditor(items) {
    const group = document.createElement('div');
    group.className = 'property-group';

    const label = document.createElement('label');
    label.className = 'property-label';
    label.textContent = 'カード項目';
    group.appendChild(label);

    const container = document.createElement('div');
    container.className = 'cards-editor';

    const renderCards = () => {
      container.innerHTML = '';

      items.forEach((card, index) => {
        const item = document.createElement('div');
        item.className = 'card-item';
        item.style.cssText = 'border: 1px solid var(--border-color); padding: 8px; margin-bottom: 8px; border-radius: 4px;';

        // アイコン入力
        const iconInput = document.createElement('input');
        iconInput.type = 'text';
        iconInput.className = 'property-input';
        iconInput.value = card.icon || '';
        iconInput.placeholder = 'アイコン（絵文字）';
        iconInput.style.marginBottom = '4px';
        iconInput.addEventListener('input', Utils.debounce((e) => {
          items[index].icon = e.target.value;
          SlideManager.updateCurrentSlide({ data: { items: [...items] } });
        }, 300));
        item.appendChild(iconInput);

        // タイトル入力
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'property-input';
        titleInput.value = card.title || '';
        titleInput.placeholder = 'タイトル';
        titleInput.style.marginBottom = '4px';
        titleInput.addEventListener('input', Utils.debounce((e) => {
          items[index].title = e.target.value;
          SlideManager.updateCurrentSlide({ data: { items: [...items] } });
        }, 300));
        item.appendChild(titleInput);

        // 説明入力
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'property-input';
        descInput.value = card.description || '';
        descInput.placeholder = '説明';
        descInput.addEventListener('input', Utils.debounce((e) => {
          items[index].description = e.target.value;
          SlideManager.updateCurrentSlide({ data: { items: [...items] } });
        }, 300));
        item.appendChild(descInput);

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-secondary';
        deleteBtn.textContent = '削除';
        deleteBtn.style.cssText = 'margin-top: 4px; font-size: 12px; padding: 2px 8px;';
        deleteBtn.addEventListener('click', () => {
          items.splice(index, 1);
          SlideManager.updateCurrentSlide({ data: { items: [...items] } });
          renderCards();
        });
        item.appendChild(deleteBtn);

        container.appendChild(item);
      });

      // 追加ボタン
      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary';
      addBtn.textContent = '+ カード追加';
      addBtn.style.cssText = 'width: 100%; font-size: 12px;';
      addBtn.addEventListener('click', () => {
        items.push({ icon: '📌', title: '', description: '' });
        SlideManager.updateCurrentSlide({ data: { items: [...items] } });
        renderCards();
      });
      container.appendChild(addBtn);
    };

    renderCards();
    group.appendChild(container);
    return group;
  }

  /**
   * スピーカーノートエディターを作成
   * @returns {HTMLElement}
   */
  createNotesEditor() {
    const group = document.createElement('div');
    group.className = 'property-group';

    const label = document.createElement('label');
    label.className = 'property-label';
    label.textContent = 'スピーカーノート';
    group.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.className = 'property-textarea';
    textarea.value = this.currentSlide.notes || '';
    textarea.placeholder = 'スピーカーノートを入力...';
    textarea.style.minHeight = '120px';

    const updateNotes = Utils.debounce((newValue) => {
      SlideManager.updateCurrentSlide({ notes: newValue });
    }, 300);

    textarea.addEventListener('input', (e) => updateNotes(e.target.value));

    group.appendChild(textarea);
    return group;
  }
}

// グローバルに公開
window.Properties = Properties;
