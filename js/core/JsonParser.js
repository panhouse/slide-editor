/**
 * JsonParser.js - JSON解析・検証
 * PanHouse Slide Editor
 */

(function() {

class JsonParser {
  constructor() {
    // 有効なスライドタイプ
    this.validTypes = [
      'title', 'section', 'content', 'agenda', 'closing',
      'table', 'compare', 'cards', 'timeline', 'process',
      'quote', 'faq', 'progress', 'cycle', 'diagram', 'imageText',
      // リッチコンポーネント
      'matrix', 'kpi', 'roadmap', 'icon-cards',
      // 統合報告書コンポーネント
      'philosophy', 'ceoMessage', 'businessModel'
    ];

    // 各タイプの必須フィールド
    this.requiredFields = {
      title: ['title'],
      section: ['title'],
      content: ['title'],
      agenda: ['title', 'items'],
      closing: ['title'],
      table: ['title', 'headers', 'rows'],
      compare: ['title'],
      cards: ['title', 'items'],
      timeline: ['title', 'milestones'],
      process: ['title', 'steps'],
      quote: ['text'],
      faq: ['title', 'items'],
      progress: ['title', 'items'],
      cycle: ['title', 'items'],
      diagram: ['title', 'lanes'],
      imageText: ['title', 'imageUrl'],
      // リッチコンポーネント
      matrix: ['title', 'quadrants'],
      kpi: ['title', 'metrics'],
      roadmap: ['title', 'phases'],
      'icon-cards': ['title', 'items'],
      // 統合報告書コンポーネント
      philosophy: ['title'],
      ceoMessage: ['title'],
      businessModel: ['title']
    };

    // フィールド名のエイリアス（よくある間違いを自動変換）
    // 形式: { スライドタイプ: { 間違った名前: 正しい名前 } }
    this.fieldAliases = {
      'kpi': {
        'kpis': 'metrics',
        'values': 'metrics',
        'indicators': 'metrics'
      },
      'icon-cards': {
        'cards': 'items',
        'iconCards': 'items'
      },
      'cards': {
        'cardItems': 'items'
      },
      'process': {
        'processes': 'steps',
        'stages': 'steps'
      },
      'timeline': {
        'items': 'milestones',
        'events': 'milestones'
      },
      'roadmap': {
        'items': 'phases',
        'milestones': 'phases'
      },
      // compareスライドはnormalizeSlide()で特別処理するためエイリアス不要
      'content': {
        'points': 'items',
        'bullets': 'items'
      }
    };
  }

  /**
   * JSONテキストをパース
   * @param {string} jsonText
   * @returns {Object} - { success: boolean, data: Object|null, errors: string[] }
   */
  parse(jsonText) {
    const errors = [];
    let data = null;

    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      return {
        success: false,
        data: null,
        errors: [`JSON構文エラー: ${e.message}`]
      };
    }

    // 基本構造の検証
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        data: null,
        errors: ['無効なJSON構造です']
      };
    }

    // slides配列の検証
    if (!data.slides || !Array.isArray(data.slides)) {
      return {
        success: false,
        data: null,
        errors: ['slides配列が必要です']
      };
    }

    if (data.slides.length === 0) {
      return {
        success: false,
        data: null,
        errors: ['少なくとも1つのスライドが必要です']
      };
    }

    // 各スライドの検証
    data.slides.forEach((slide, index) => {
      const slideErrors = this.validateSlide(slide, index);
      errors.push(...slideErrors);
    });

    // 警告レベルのエラーは無視して続行
    const criticalErrors = errors.filter(e => !e.startsWith('警告:'));

    return {
      success: criticalErrors.length === 0,
      data: this.normalize(data),
      errors
    };
  }

  /**
   * スライドを検証
   * @param {Object} slide
   * @param {number} index
   * @returns {string[]}
   */
  validateSlide(slide, index) {
    const errors = [];
    const slideRef = `スライド ${index + 1}`;

    if (!slide || typeof slide !== 'object') {
      errors.push(`${slideRef}: 無効なスライドデータ`);
      return errors;
    }

    // タイプの検証
    if (!slide.type) {
      errors.push(`警告: ${slideRef}: typeが未指定のため'content'として扱います`);
    } else if (!this.validTypes.includes(slide.type)) {
      errors.push(`警告: ${slideRef}: 未知のtype "${slide.type}"。contentとして扱います`);
    }

    // 必須フィールドの検証（エイリアスも考慮）
    const type = slide.type || 'content';
    const required = this.requiredFields[type] || ['title'];
    const aliases = this.fieldAliases[type] || {};

    // エイリアスの逆引きマップを作成（正しい名前 → 間違った名前のリスト）
    const reverseAliases = {};
    for (const [wrongName, correctName] of Object.entries(aliases)) {
      if (!reverseAliases[correctName]) {
        reverseAliases[correctName] = [];
      }
      reverseAliases[correctName].push(wrongName);
    }

    required.forEach(field => {
      // 正しいフィールド名がある、またはエイリアスがあればOK
      const hasField = slide[field] !== undefined;
      const aliasNames = reverseAliases[field] || [];
      const hasAlias = aliasNames.some(alias => slide[alias] !== undefined);

      if (!hasField && !hasAlias) {
        errors.push(`警告: ${slideRef}: ${field}が未指定です`);
      }
    });

    return errors;
  }

  /**
   * データを正規化
   * @param {Object} data
   * @returns {Object}
   */
  normalize(data) {
    // トップレベルのtitle/subtitleをsettingsにマージ
    const settingsWithTitle = {
      ...data.settings,
      title: data.title || data.settings?.title,
      subtitle: data.subtitle || data.settings?.subtitle
    };

    const normalized = {
      settings: this.normalizeSettings(settingsWithTitle),
      slides: data.slides.map(slide => this.normalizeSlide(slide))
    };

    return normalized;
  }

  /**
   * 設定を正規化
   * @param {Object} settings
   * @returns {Object}
   */
  normalizeSettings(settings = {}) {
    return {
      title: settings.title || '無題のプレゼンテーション',
      theme: settings.theme || 'panhouse',
      aspectRatio: settings.aspectRatio || '16:9',
      companyName: settings.companyName || '',
      footerText: settings.footerText || ''
    };
  }

  /**
   * スライドを正規化
   * @param {Object} slide
   * @returns {Object}
   */
  normalizeSlide(slide) {
    const type = this.validTypes.includes(slide.type) ? slide.type : 'content';

    // compareスライドの特殊処理: ネスト形式 { left: { title, items } } → フラット形式 { leftTitle, leftItems }
    if (type === 'compare') {
      if (slide.left && typeof slide.left === 'object') {
        if (slide.left.title && !slide.leftTitle) {
          slide.leftTitle = slide.left.title;
        }
        if (slide.left.items && !slide.leftItems) {
          slide.leftItems = slide.left.items;
        }
        delete slide.left;
        console.log('[JsonParser] compareスライドのleftをフラット形式に変換');
      }
      if (slide.right && typeof slide.right === 'object') {
        if (slide.right.title && !slide.rightTitle) {
          slide.rightTitle = slide.right.title;
        }
        if (slide.right.items && !slide.rightItems) {
          slide.rightItems = slide.right.items;
        }
        delete slide.right;
        console.log('[JsonParser] compareスライドのrightをフラット形式に変換');
      }
    }

    // フィールド名のエイリアス変換（よくある間違いを自動修正）
    const aliases = this.fieldAliases[type] || {};
    for (const [wrongName, correctName] of Object.entries(aliases)) {
      if (slide[wrongName] !== undefined && slide[correctName] === undefined) {
        slide[correctName] = slide[wrongName];
        delete slide[wrongName];
        console.log(`[JsonParser] フィールド名を自動変換: ${wrongName} → ${correctName} (${type}スライド)`);
      }
    }

    const normalized = {
      type,
      ...this.getDefaultData(type),
      ...slide
    };

    return normalized;
  }

  /**
   * タイプ別のデフォルトデータを取得
   * @param {string} type
   * @returns {Object}
   */
  getDefaultData(type) {
    const defaults = {
      title: {
        title: '',
        subtitle: '',
        date: Utils.formatDate()
      },
      section: {
        title: ''
      },
      content: {
        title: '',
        subhead: '',
        points: []
      },
      agenda: {
        title: 'アジェンダ',
        items: []
      },
      closing: {
        title: 'ご清聴ありがとうございました',
        subtitle: ''
      },
      table: {
        title: '',
        headers: [],
        rows: []
      },
      compare: {
        title: '',
        leftTitle: '',
        rightTitle: '',
        leftItems: [],
        rightItems: []
      },
      cards: {
        title: '',
        items: []
      },
      timeline: {
        title: '',
        milestones: []
      },
      process: {
        title: '',
        steps: []
      },
      quote: {
        title: '',
        text: '',
        author: ''
      },
      faq: {
        title: '',
        items: []
      },
      progress: {
        title: '',
        items: []
      },
      cycle: {
        title: '',
        items: []
      },
      diagram: {
        title: '',
        lanes: []
      },
      imageText: {
        title: '',
        imageUrl: '',
        points: []
      },
      // リッチコンポーネント
      matrix: {
        title: '',
        quadrants: []
      },
      kpi: {
        title: '',
        metrics: []
      },
      roadmap: {
        title: '',
        phases: []
      },
      'icon-cards': {
        title: '',
        items: []
      },
      // 統合報告書コンポーネント
      philosophy: {
        title: '',
        subhead: '',
        purpose: { title: 'パーパス', text: '' },
        mission: { title: 'ミッション', text: '' },
        vision: { title: 'ビジョン', text: '' },
        kpis: []
      },
      ceoMessage: {
        title: '',
        ceo: { name: '', title: '', photo: '' },
        quote: '',
        sections: [],
        body: ''
      },
      businessModel: {
        title: '',
        subhead: '',
        inputs: [],
        processes: [],
        outputs: [],
        description: ''
      }
    };

    return defaults[type] || defaults.content;
  }

  /**
   * サンプルJSONを生成
   * @returns {Object}
   */
  generateSample() {
    return {
      settings: {
        title: 'サンプルプレゼンテーション',
        theme: 'panhouse',
        aspectRatio: '16:9',
        companyName: '株式会社パンハウス'
      },
      slides: [
        {
          type: 'title',
          title: 'プレゼンテーションタイトル',
          subtitle: '株式会社パンハウス',
          date: Utils.formatDate()
        },
        {
          type: 'agenda',
          title: 'アジェンダ',
          items: ['はじめに', '現状分析', '提案内容', 'まとめ']
        },
        {
          type: 'content',
          title: '本日お伝えしたいこと',
          points: [
            '重要なポイント1',
            '重要なポイント2',
            '重要なポイント3'
          ]
        },
        {
          type: 'closing',
          title: 'ご清聴ありがとうございました',
          subtitle: '株式会社パンハウス'
        }
      ]
    };
  }
}

// シングルトンインスタンス
const jsonParser = new JsonParser();

// グローバルに公開
window.JsonParser = jsonParser;

})();
