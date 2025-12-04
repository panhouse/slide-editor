/**
 * Editor.js - エディタコア（統合管理）
 * PanHouse Slide Editor
 */

class Editor {
  constructor() {
    this.canvas = null;
    this.pageList = null;
    this.properties = null;
    this.currentTool = 'select';
    this.isPresenting = false;
    this.presentationOverlay = null;
    // 発表者ツール用
    this.audienceWindow = null;
    this.isPresenterMode = false;
  }

  /**
   * 初期化
   */
  init() {
    // コンポーネントの初期化
    this.canvas = new Canvas();
    this.pageList = new PageList();
    this.properties = new Properties();

    // 各コンポーネントを初期化
    this.canvas.init();
    this.pageList.init();
    this.properties.init();

    // イベントリスナーを設定
    this.setupEventListeners();

    // ツールバーを初期化
    this.setupToolbar();

    // エクスポートメニューを初期化
    this.setupExportMenu();

    // テーマセレクターを初期化
    this.setupThemeSelector();

    // サンプル読み込みを初期化
    this.setupSampleLoader();

    // JSONモーダルを初期化
    this.setupJsonModal();

    // ファイル操作ボタンを初期化
    this.setupFileActions();

    // スピーカーノートを初期化
    this.setupSpeakerNotes();

    // Undo/Redoボタンを初期化
    this.setupUndoRedo();

    Utils.log('Editor', 'Editor initialized');
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S: 保存（JSON）
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveAsJson();
      }

      // Ctrl/Cmd + E: エクスポート
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.exportPdf();
      }

      // Ctrl/Cmd + O: JSONファイルを開く
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        this.openJsonFile();
      }

      // Ctrl/Cmd + Enter: 全画面プレゼンテーション
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl/Cmd + Shift + Enter: 発表者ツール（2画面モード）
          this.startPresenterMode();
        } else {
          // Ctrl/Cmd + Enter: シンプルな全画面
          this.startPresentation();
        }
      }

      // Delete: スライド削除
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
          // 何も選択されていない場合はスライド削除
        }
      }

      // ツール切り替え
      if (!e.ctrlKey && !e.metaKey) {
        const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                               document.activeElement.tagName === 'TEXTAREA';

        if (!isInputFocused) {
          switch (e.key.toLowerCase()) {
            case 'v':
              this.setTool('select');
              break;
            case 't':
              this.setTool('text');
              break;
            case 'i':
              this.setTool('image');
              break;
            case 'r':
              this.setTool('rect');
              break;
          }
        }
      }
    });
  }

  /**
   * ツールバーを設定
   */
  setupToolbar() {
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');

    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.setTool(tool);
      });
    });
  }

  /**
   * ツールを設定
   * @param {string} tool
   */
  setTool(tool) {
    // 画像ツールの場合はファイルダイアログを開く
    if (tool === 'image') {
      if (window.ImageUploader) {
        ImageUploader.openFileDialog();
      }
      // 選択ツールに戻す
      this.setTool('select');
      return;
    }

    this.currentTool = tool;

    // ボタンのアクティブ状態を更新
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
    toolBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    EventBus.emit(Events.TOOL_CHANGED, tool);

    // テキスト・矩形ツールの場合、要素追加後に選択ツールに戻す
    if (tool === 'text' || tool === 'rect') {
      const onElementAdded = () => {
        EventBus.off(Events.SLIDE_UPDATED, onElementAdded);
        // 少し遅延してから選択ツールに戻す（要素追加後）
        setTimeout(() => {
          if (this.currentTool === tool) {
            this.setTool('select');
          }
        }, 100);
      };
      EventBus.on(Events.SLIDE_UPDATED, onElementAdded);
    }
  }

  /**
   * エクスポートメニューを設定
   */
  setupExportMenu() {
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');

    if (exportBtn && exportMenu) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('show');
      });

      // メニュー外クリックで閉じる
      document.addEventListener('click', () => {
        exportMenu.classList.remove('show');
      });

      // エクスポート形式の選択
      const formatBtns = exportMenu.querySelectorAll('[data-format]');
      formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const format = btn.dataset.format;
          this.export(format);
          exportMenu.classList.remove('show');
        });
      });
    }
  }

  /**
   * テーマセレクターを設定
   */
  setupThemeSelector() {
    const themeSelect = document.getElementById('themeSelect');

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        ThemeManager.setTheme(theme);
        SlideManager.updateSettings({ theme });
      });
    }
  }

  /**
   * サンプル読み込みを設定
   */
  setupSampleLoader() {
    const sampleSelect = document.getElementById('sampleSelect');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    if (loadSampleBtn && sampleSelect) {
      loadSampleBtn.addEventListener('click', async () => {
        const sampleFile = sampleSelect.value;
        if (!sampleFile) {
          alert('サンプルを選択してください');
          return;
        }

        try {
          const response = await fetch(`samples/${sampleFile}`);
          if (!response.ok) throw new Error('ファイルが見つかりません');

          const jsonText = await response.text();
          this.loadJson(jsonText);
        } catch (error) {
          alert(`サンプルの読み込みに失敗しました: ${error.message}`);
        }
      });
    }
  }

  /**
   * JSONモーダルを設定
   */
  setupJsonModal() {
    const modal = document.getElementById('jsonModal');
    const closeBtn = document.getElementById('jsonModalClose');
    const cancelBtn = document.getElementById('jsonModalCancel');
    const loadBtn = document.getElementById('jsonModalLoad');
    const textarea = document.getElementById('jsonInput');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideJsonModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideJsonModal());
    }
    if (loadBtn && textarea) {
      loadBtn.addEventListener('click', () => {
        const jsonText = textarea.value;
        if (this.loadJson(jsonText)) {
          this.hideJsonModal();
        }
      });
    }

    // モーダル外クリックで閉じる
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideJsonModal();
        }
      });
    }
  }

  /**
   * JSONモーダルを表示
   */
  showJsonModal() {
    const modal = document.getElementById('jsonModal');
    if (modal) {
      modal.classList.add('show');
    }
  }

  /**
   * JSONモーダルを非表示
   */
  hideJsonModal() {
    const modal = document.getElementById('jsonModal');
    const textarea = document.getElementById('jsonInput');
    if (modal) {
      modal.classList.remove('show');
    }
    if (textarea) {
      textarea.value = '';
    }
  }

  /**
   * JSONを読み込み
   * @param {string} jsonText
   * @returns {boolean}
   */
  loadJson(jsonText) {
    const result = JsonParser.parse(jsonText);

    if (!result.success) {
      alert(`JSONの解析に失敗しました:\n${result.errors.join('\n')}`);
      return false;
    }

    // 警告があれば表示
    if (result.errors.length > 0) {
      console.warn('JSON parsing warnings:', result.errors);
    }

    // データを読み込み
    SlideManager.loadFromJson(result.data);

    // テーマを更新
    const theme = result.data.settings?.theme || 'panhouse';
    ThemeManager.setTheme(theme);

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = theme;
    }

    return true;
  }

  /**
   * エクスポート
   * @param {string} format
   */
  export(format) {
    switch (format) {
      case 'pdf':
        this.exportPdf();
        break;
      case 'json':
        this.saveAsJson();
        break;
      case 'html':
        this.exportHtml();
        break;
      case 'pptx':
        this.exportPptx();
        break;
    }
  }

  /**
   * PDF出力
   */
  async exportPdf() {
    if (typeof PdfExporter !== 'undefined') {
      await PdfExporter.export();
    } else {
      alert('PDFエクスポーターが読み込まれていません');
    }
  }

  /**
   * PPTX出力
   */
  async exportPptx() {
    if (typeof PptxExporter !== 'undefined') {
      await PptxExporter.export();
    } else {
      alert('PPTXエクスポーターが読み込まれていません');
    }
  }

  /**
   * JSONとして保存
   */
  saveAsJson() {
    const data = SlideManager.getData();
    const filename = `${data.settings.title || 'presentation'}_${Utils.formatDate(new Date(), 'YYYYMMDD')}.json`;
    Utils.downloadJson(data, filename);
  }

  /**
   * HTML出力
   */
  async exportHtml() {
    if (typeof HtmlExporter !== 'undefined') {
      await HtmlExporter.export();
    } else {
      alert('HTMLエクスポーターが読み込まれていません');
    }
  }

  /**
   * ファイル操作ボタンをセットアップ
   */
  setupFileActions() {
    const openBtn = document.getElementById('openJsonBtn');
    const saveBtn = document.getElementById('saveJsonBtn');
    const fileInput = document.getElementById('jsonFileInput');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openJsonFile());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAsJson());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    // サンプル選択を変更イベントで読み込み
    const sampleSelect = document.getElementById('sampleSelect');
    if (sampleSelect) {
      sampleSelect.addEventListener('change', async (e) => {
        const sampleFile = e.target.value;
        if (!sampleFile) return;

        try {
          const response = await fetch(`samples/${sampleFile}`);
          if (!response.ok) throw new Error('ファイルが見つかりません');
          const jsonText = await response.text();
          this.loadJson(jsonText);
          sampleSelect.value = ''; // リセット
        } catch (error) {
          alert(`サンプルの読み込みに失敗しました: ${error.message}`);
        }
      });
    }
  }

  /**
   * JSONファイルを開く（ファイルダイアログ）
   */
  openJsonFile() {
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * ファイル選択ハンドラ
   */
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonText = event.target.result;
      if (this.loadJson(jsonText)) {
        Utils.log('Editor', `Loaded file: ${file.name}`);
      }
    };
    reader.onerror = () => {
      alert('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);

    // 同じファイルを再度選択できるようにリセット
    e.target.value = '';
  }

  /**
   * スピーカーノートを設定
   */
  setupSpeakerNotes() {
    const input = document.getElementById('speakerNotesInput');

    if (!input) return;

    // スライド変更時にノートを読み込み
    EventBus.on(Events.SLIDE_SELECTED, (slideIndex) => {
      this.loadSpeakerNotes(slideIndex);
    });

    // ノート入力時に保存
    input.addEventListener('input', Utils.debounce(() => {
      this.saveSpeakerNotes();
    }, 300));

    // 初期ロード
    this.loadSpeakerNotes(SlideManager.currentIndex);
  }

  /**
   * スピーカーノートを読み込み
   * @param {number} slideIndex
   */
  loadSpeakerNotes(slideIndex) {
    const input = document.getElementById('speakerNotesInput');
    if (!input) return;

    const slide = SlideManager.getSlide(slideIndex);
    // speakerNotes または notes を参照（JSONでは speakerNotes を使用）
    input.value = slide?.speakerNotes || slide?.data?.speakerNotes || slide?.notes || '';
  }

  /**
   * スピーカーノートを保存
   */
  saveSpeakerNotes() {
    const input = document.getElementById('speakerNotesInput');
    if (!input) return;

    const currentIndex = SlideManager.currentIndex;
    // SlideManager.updateSlide を使って speakerNotes を更新
    SlideManager.updateSlide(currentIndex, { speakerNotes: input.value }, true);
    Utils.log('Editor', `Speaker notes saved for slide ${currentIndex + 1}`);
  }

  /**
   * Undo/Redoボタンを設定
   */
  setupUndoRedo() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        SlideManager.undo();
      });
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        SlideManager.redo();
      });
    }

    // 履歴変更時にボタンの状態を更新
    EventBus.on('history:changed', ({ canUndo, canRedo }) => {
      if (undoBtn) undoBtn.disabled = !canUndo;
      if (redoBtn) redoBtn.disabled = !canRedo;
    });

    // キーボードショートカット（Ctrl+Z / Ctrl+Y）
    document.addEventListener('keydown', (e) => {
      // 入力中は無視
      const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                             document.activeElement.tagName === 'TEXTAREA' ||
                             document.activeElement.contentEditable === 'true';
      if (isInputFocused) return;

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        SlideManager.undo();
      }

      // Ctrl/Cmd + Y または Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        SlideManager.redo();
      }
    });
  }

  /**
   * プレゼンテーションモードを開始
   */
  startPresentation() {
    if (this.isPresenting) return;
    this.isPresenting = true;

    // オーバーレイを作成
    this.presentationOverlay = document.createElement('div');
    this.presentationOverlay.className = 'presentation-overlay';
    this.presentationOverlay.innerHTML = `
      <div class="presentation-container">
        <div class="presentation-slide"></div>
        <div class="presentation-controls">
          <span class="presentation-page-info"></span>
          <span class="presentation-hint">← → でページ切替 | Esc で終了</span>
        </div>
      </div>
    `;
    document.body.appendChild(this.presentationOverlay);

    // 現在のスライドを表示
    this.renderPresentationSlide();

    // キーボードイベントをリッスン（captureフェーズで最初に処理）
    this._presentationKeyHandler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.stopPresentation();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        SlideManager.nextSlide();
        this.renderPresentationSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        SlideManager.prevSlide();
        this.renderPresentationSlide();
      }
    };
    document.addEventListener('keydown', this._presentationKeyHandler, true);

    // クリックで次へ
    this._presentationClickHandler = (e) => {
      if (e.target.closest('.presentation-controls')) return;
      SlideManager.nextSlide();
      this.renderPresentationSlide();
    };
    this.presentationOverlay.addEventListener('click', this._presentationClickHandler);

    // フルスクリーンを試みる
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    Utils.log('Editor', 'Presentation started');
  }

  /**
   * プレゼンテーション用スライドをレンダリング
   */
  renderPresentationSlide() {
    if (!this.presentationOverlay) return;

    const slideContainer = this.presentationOverlay.querySelector('.presentation-slide');
    const pageInfo = this.presentationOverlay.querySelector('.presentation-page-info');

    const currentSlide = SlideManager.getCurrentSlide();
    const settings = SlideManager.getSettings();

    if (currentSlide && slideContainer) {
      // スライドをレンダリング
      const slideElement = SlideRenderer.render(currentSlide, settings);
      slideContainer.innerHTML = '';
      slideContainer.appendChild(slideElement);

      // ページ情報を更新
      const total = SlideManager.getSlideCount();
      const current = SlideManager.currentIndex + 1;
      pageInfo.textContent = `${current} / ${total}`;
    }
  }

  /**
   * プレゼンテーションモードを終了
   */
  stopPresentation() {
    if (!this.isPresenting) return;
    this.isPresenting = false;

    // イベントリスナーを削除（captureフェーズで登録したので同じくtrue指定）
    if (this._presentationKeyHandler) {
      document.removeEventListener('keydown', this._presentationKeyHandler, true);
    }
    if (this._presentationClickHandler && this.presentationOverlay) {
      this.presentationOverlay.removeEventListener('click', this._presentationClickHandler);
    }

    // オーバーレイを削除
    if (this.presentationOverlay) {
      this.presentationOverlay.remove();
      this.presentationOverlay = null;
    }

    // フルスクリーンを終了
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    Utils.log('Editor', 'Presentation stopped');
  }

  /**
   * 発表者ツールモードを開始（2画面プレゼン）
   */
  startPresenterMode() {
    if (this.isPresenterMode) return;
    this.isPresenterMode = true;

    // 聴衆用ウィンドウを開く
    const width = 1280;
    const height = 720;
    const left = window.screen.width - width;
    const top = 0;

    this.audienceWindow = window.open(
      'presenter.html',
      'audience',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (!this.audienceWindow) {
      alert('ポップアップがブロックされました。\nポップアップを許可してから再度お試しください。');
      this.isPresenterMode = false;
      return;
    }

    // 発表者オーバーレイを作成
    this.presentationOverlay = document.createElement('div');
    this.presentationOverlay.className = 'presenter-overlay';
    this.presentationOverlay.innerHTML = `
      <div class="presenter-container">
        <div class="presenter-body">
          <div class="presenter-main">
            <div class="presenter-current-slide"></div>
            <div class="presenter-info">
              <span class="presenter-page-info"></span>
              <span class="presenter-time"></span>
            </div>
          </div>
          <div class="presenter-sidebar">
            <div class="presenter-next-preview">
              <div class="presenter-next-label">次のスライド</div>
              <div class="presenter-next-slide"></div>
            </div>
            <div class="presenter-notes">
              <div class="presenter-notes-label">スピーカーノート</div>
              <div class="presenter-notes-content"></div>
            </div>
          </div>
        </div>
        <div class="presenter-controls">
          <button class="presenter-btn presenter-prev" title="前へ (←)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button class="presenter-btn presenter-next-btn" title="次へ (→)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button class="presenter-btn presenter-fullscreen" title="聴衆画面をフルスクリーン">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
          <button class="presenter-btn presenter-end" title="終了 (Esc)">
            終了
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.presentationOverlay);

    // ボタンイベント
    this.presentationOverlay.querySelector('.presenter-prev').addEventListener('click', () => {
      this.presenterPrev();
    });
    this.presentationOverlay.querySelector('.presenter-next-btn').addEventListener('click', () => {
      this.presenterNext();
    });
    this.presentationOverlay.querySelector('.presenter-fullscreen').addEventListener('click', () => {
      this.requestAudienceFullscreen();
    });
    this.presentationOverlay.querySelector('.presenter-end').addEventListener('click', () => {
      this.stopPresenterMode();
    });

    // 経過時間タイマー
    this._presenterStartTime = Date.now();
    this._presenterTimer = setInterval(() => {
      this.updatePresenterTime();
    }, 1000);

    // キーボードイベント
    this._presenterKeyHandler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.stopPresenterMode();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.presenterNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        this.presenterPrev();
      }
    };
    document.addEventListener('keydown', this._presenterKeyHandler, true);

    // 聴衆ウィンドウからのメッセージを受信
    this._audienceMessageHandler = (event) => {
      if (event.origin !== window.location.origin) return;
      const { type } = event.data;

      if (type === 'AUDIENCE_READY') {
        // 聴衆ウィンドウ準備完了、最初のスライドを送信
        this.renderPresenterView();
        this.syncAudienceSlide();
      } else if (type === 'AUDIENCE_CLOSED') {
        // 聴衆ウィンドウが閉じられた
        this.stopPresenterMode();
      }
    };
    window.addEventListener('message', this._audienceMessageHandler);

    // 初期表示
    this.renderPresenterView();

    Utils.log('Editor', 'Presenter mode started');
  }

  /**
   * 発表者ビューをレンダリング
   */
  renderPresenterView() {
    if (!this.presentationOverlay) return;

    const currentSlideContainer = this.presentationOverlay.querySelector('.presenter-current-slide');
    const nextSlideContainer = this.presentationOverlay.querySelector('.presenter-next-slide');
    const notesContent = this.presentationOverlay.querySelector('.presenter-notes-content');
    const pageInfo = this.presentationOverlay.querySelector('.presenter-page-info');

    const currentIndex = SlideManager.currentIndex;
    const currentSlide = SlideManager.getCurrentSlide();
    const nextSlide = SlideManager.getSlide(currentIndex + 1);
    const settings = SlideManager.getSettings();
    const total = SlideManager.getSlideCount();

    // 現在のスライド
    if (currentSlide && currentSlideContainer) {
      const slideElement = SlideRenderer.render(currentSlide, settings);
      currentSlideContainer.innerHTML = '';
      currentSlideContainer.appendChild(slideElement);

      // 次フレームでスケールを計算（DOM描画後）
      requestAnimationFrame(() => {
        this.scaleCurrentSlide();
      });
    }

    // 次のスライド（アスペクト比を維持してスケール）
    if (nextSlideContainer) {
      if (nextSlide) {
        const nextElement = SlideRenderer.render(nextSlide, settings);
        nextSlideContainer.innerHTML = '';
        nextSlideContainer.appendChild(nextElement);

        // 次フレームでスケールを計算（DOM描画後）
        requestAnimationFrame(() => {
          this.scaleNextSlidePreview();
        });
      } else {
        nextSlideContainer.innerHTML = '<div class="presenter-no-next">最後のスライドです</div>';
      }
    }

    // スピーカーノート（複数の場所を参照：トップレベル、data内、notes）
    if (notesContent) {
      const notes = currentSlide?.speakerNotes || currentSlide?.data?.speakerNotes || currentSlide?.notes || '';
      notesContent.textContent = notes || '（ノートなし）';
    }

    // ページ情報
    if (pageInfo) {
      pageInfo.textContent = `${currentIndex + 1} / ${total}`;
    }
  }

  /**
   * 現在のスライドをコンテナにフィットするようスケール
   */
  scaleCurrentSlide() {
    const container = this.presentationOverlay?.querySelector('.presenter-current-slide');
    const slideEl = container?.querySelector('.slide');

    if (!container || !slideEl) return;

    const containerRect = container.getBoundingClientRect();
    const slideWidth = 960;
    const slideHeight = 540;

    // コンテナサイズに収まるスケールを計算
    const scaleX = containerRect.width / slideWidth;
    const scaleY = containerRect.height / slideHeight;
    const scale = Math.min(scaleX, scaleY);

    // translate(-50%, -50%)で中央配置 + scaleでサイズ調整
    slideEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  /**
   * 次のスライドプレビューをコンテナにフィットするようスケール
   */
  scaleNextSlidePreview() {
    const container = this.presentationOverlay?.querySelector('.presenter-next-slide');
    const slideEl = container?.querySelector('.slide');

    if (!container || !slideEl) return;

    const containerRect = container.getBoundingClientRect();
    const slideWidth = 960;
    const slideHeight = 540;

    // コンテナサイズに収まるスケールを計算
    const scaleX = containerRect.width / slideWidth;
    const scaleY = containerRect.height / slideHeight;
    const scale = Math.min(scaleX, scaleY);

    // translate(-50%, -50%)で中央配置 + scaleでサイズ調整
    slideEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  /**
   * 聴衆画面にスライドを同期
   */
  syncAudienceSlide() {
    if (!this.audienceWindow || this.audienceWindow.closed) return;

    const currentSlide = SlideManager.getCurrentSlide();
    const settings = SlideManager.getSettings();

    if (currentSlide) {
      const slideElement = SlideRenderer.render(currentSlide, settings);
      const html = slideElement.outerHTML;
      const theme = settings.theme || 'panhouse';

      this.audienceWindow.postMessage({
        type: 'SLIDE_UPDATE',
        data: { html, theme }
      }, window.location.origin);
    }
  }

  /**
   * 発表者モード：次へ
   */
  presenterNext() {
    SlideManager.nextSlide();
    this.renderPresenterView();
    this.syncAudienceSlide();
  }

  /**
   * 発表者モード：前へ
   */
  presenterPrev() {
    SlideManager.prevSlide();
    this.renderPresenterView();
    this.syncAudienceSlide();
  }

  /**
   * 経過時間を更新
   */
  updatePresenterTime() {
    if (!this.presentationOverlay) return;

    const timeElement = this.presentationOverlay.querySelector('.presenter-time');
    if (timeElement) {
      const elapsed = Math.floor((Date.now() - this._presenterStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * 聴衆画面をフルスクリーンにリクエスト
   */
  requestAudienceFullscreen() {
    if (this.audienceWindow && !this.audienceWindow.closed) {
      // 聴衆ウィンドウにフォーカスを移してF11のヒントを表示
      this.audienceWindow.focus();
      alert('聴衆用画面でF11キーを押してフルスクリーンにしてください');
    }
  }

  /**
   * 発表者ツールモードを終了
   */
  stopPresenterMode() {
    if (!this.isPresenterMode) return;
    this.isPresenterMode = false;

    // タイマーを停止
    if (this._presenterTimer) {
      clearInterval(this._presenterTimer);
      this._presenterTimer = null;
    }

    // イベントリスナーを削除
    if (this._presenterKeyHandler) {
      document.removeEventListener('keydown', this._presenterKeyHandler, true);
    }
    if (this._audienceMessageHandler) {
      window.removeEventListener('message', this._audienceMessageHandler);
    }

    // オーバーレイを削除
    if (this.presentationOverlay) {
      this.presentationOverlay.remove();
      this.presentationOverlay = null;
    }

    // 聴衆ウィンドウに終了を通知して閉じる
    if (this.audienceWindow && !this.audienceWindow.closed) {
      this.audienceWindow.postMessage({ type: 'PRESENTATION_END' }, window.location.origin);
      this.audienceWindow.close();
      this.audienceWindow = null;
    }

    Utils.log('Editor', 'Presenter mode stopped');
  }
}

// グローバルに公開
window.Editor = Editor;
