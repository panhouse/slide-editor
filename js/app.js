/**
 * app.js - メインアプリケーション起動
 * PanHouse Slide Editor
 */

// デバッグモード
window.DEBUG = true;

/**
 * アプリケーション初期化
 */
function initApp() {
  Utils.log('App', 'Initializing PanHouse Slide Editor...');

  // デフォルトテーマを設定
  ThemeManager.setTheme('panhouse');

  // SlideManagerを初期化（LocalStorageから復元を試みる）
  const restored = SlideManager.init();

  // エディタを初期化
  const editor = new Editor();
  editor.init();

  // グローバルにエディタを公開（デバッグ用）
  window.editor = editor;

  Utils.log('App', 'Editor initialized successfully');

  // LocalStorageから復元できなかった場合のみデモデータを読み込む
  if (!restored) {
    loadDemoData();
  } else {
    Utils.log('App', 'Restored from LocalStorage');
    // テーマを復元
    const settings = SlideManager.getSettings();
    if (settings.theme) {
      ThemeManager.setTheme(settings.theme);
      const themeSelect = document.getElementById('themeSelect');
      if (themeSelect) {
        themeSelect.value = settings.theme;
      }
    }
  }
}

/**
 * デモ用のサンプルデータを読み込む
 */
function loadDemoData() {
  const sampleData = {
    settings: {
      title: 'PanHouse Slide Editor デモ',
      theme: 'panhouse',
      aspectRatio: '16:9',
      companyName: '株式会社パンハウス'
    },
    slides: [
      {
        type: 'title',
        title: 'PanHouse Slide Editor',
        subtitle: 'JSONからスライドを生成するWebエディタ',
        date: Utils.formatDate()
      },
      {
        type: 'agenda',
        title: 'できること',
        items: [
          'JSONからスライドを自動生成',
          'ブラウザ上でリアルタイム編集',
          'PDF形式でエクスポート',
          'テーマの切り替え'
        ]
      },
      {
        type: 'content',
        title: 'スライドタイプ',
        subhead: 'JSONで指定できるスライドタイプ',
        points: [
          'title: タイトルスライド',
          'agenda: アジェンダ・目次',
          'content: 箇条書きコンテンツ',
          'table: テーブル表示',
          'compare: 左右比較',
          'cards: カードグリッド',
          'timeline: タイムライン'
        ]
      },
      {
        type: 'table',
        title: 'スライドタイプ一覧',
        headers: ['タイプ', '用途', '必須フィールド'],
        rows: [
          ['title', 'タイトルスライド', 'title'],
          ['content', '箇条書き', 'title, points'],
          ['table', 'テーブル', 'headers, rows'],
          ['timeline', 'タイムライン', 'milestones']
        ]
      },
      {
        type: 'compare',
        title: 'GAS版との比較',
        leftTitle: 'GAS版',
        rightTitle: '本エディタ',
        leftItems: [
          'Google Slides出力',
          '画像はURL必須',
          '編集はGoogleで',
          '固定レイアウト'
        ],
        rightItems: [
          'PDF/PPTX/HTML出力',
          'ローカル画像対応',
          'ブラウザで編集',
          '自由配置可能'
        ]
      },
      {
        type: 'cards',
        title: '今後の予定',
        items: [
          { title: 'PPTX出力', desc: 'PowerPoint形式でのエクスポート' },
          { title: '画像アップロード', desc: 'ローカル画像のドラッグ&ドロップ' },
          { title: 'ドラッグ&ドロップ', desc: '要素の自由配置' }
        ]
      },
      {
        type: 'timeline',
        title: '開発ロードマップ',
        milestones: [
          { date: 'Phase 1', label: 'MVP（現在）' },
          { date: 'Phase 2', label: '編集機能拡張' },
          { date: 'Phase 3', label: '全タイプ実装' }
        ]
      },
      {
        type: 'closing',
        title: 'ご利用ありがとうございます',
        subtitle: '株式会社パンハウス'
      }
    ]
  };

  SlideManager.loadFromJson(sampleData);
  Utils.log('App', 'Demo data loaded');
}

/**
 * URLクエリパラメータからJSONファイルを読み込む
 * 例: ?load=samples/proposal.json
 * 例: ?load=/path/to/file.json (HTTPサーバー経由の場合)
 */
async function loadFromQueryParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const loadPath = urlParams.get('load');

  if (!loadPath) {
    return false;
  }

  Utils.log('App', `Loading from query param: ${loadPath}`);

  try {
    const response = await fetch(loadPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    SlideManager.loadFromJson(data);

    // テーマを適用
    if (data.settings?.theme) {
      ThemeManager.setTheme(data.settings.theme);
      const themeSelect = document.getElementById('themeSelect');
      if (themeSelect) {
        themeSelect.value = data.settings.theme;
      }
    }

    Utils.log('App', `Loaded successfully: ${loadPath}`);
    return true;
  } catch (error) {
    Utils.log('App', `Failed to load: ${error.message}`, 'error');
    console.error('Load error:', error);

    // file://プロトコルの場合はヒントを表示
    if (window.location.protocol === 'file:') {
      alert(`ファイルの読み込みに失敗しました。\n\nfile://プロトコルではローカルファイルを直接読み込めません。\nHTTPサーバー経由でアクセスしてください。\n\n例: python -m http.server 8080\nhttp://localhost:8080/?load=${loadPath}`);
    }
    return false;
  }
}

// DOMContentLoaded で初期化
document.addEventListener('DOMContentLoaded', async () => {
  // まずURLクエリパラメータからの読み込みを試みる
  const loadedFromQuery = await loadFromQueryParam();

  if (loadedFromQuery) {
    // クエリパラメータから読み込めた場合は、エディタを初期化して終了
    Utils.log('App', 'Initializing PanHouse Slide Editor (from query param)...');
    ThemeManager.setTheme(SlideManager.getSettings().theme || 'panhouse');
    const editor = new Editor();
    editor.init();
    window.editor = editor;
    Utils.log('App', 'Editor initialized successfully');
  } else {
    // 通常の初期化フロー
    initApp();
  }
});
