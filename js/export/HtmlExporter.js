/**
 * HtmlExporter.js - HTML出力
 * PanHouse Slide Editor
 */

(function() {

class HtmlExporter {
  constructor() {
    this.slideWidth = 960;
    this.slideHeight = 540;
  }

  /**
   * HTMLとしてエクスポート
   */
  async export() {
    const slides = SlideManager.getSlides();
    const settings = SlideManager.getSettings();

    if (slides.length === 0) {
      alert('エクスポートするスライドがありません');
      return;
    }

    // CSSを取得
    const css = await this.collectStyles();

    // HTML生成
    const html = this.generateHtml(slides, settings, css);

    // ダウンロード
    const filename = `${settings.title || 'presentation'}_${Utils.formatDate(new Date(), 'YYYYMMDD')}.html`;
    this.downloadHtml(html, filename);

    EventBus.emit(Events.DATA_EXPORTED, { format: 'html', filename });
  }

  /**
   * スタイルを収集
   */
  async collectStyles() {
    const stylesheets = [
      'css/slide.css',
      'css/themes/panhouse.css'
    ];

    let css = '';

    for (const href of stylesheets) {
      try {
        const response = await fetch(href);
        if (response.ok) {
          css += await response.text() + '\n';
        }
      } catch (e) {
        console.warn(`Failed to fetch ${href}:`, e);
      }
    }

    // 追加のインラインスタイル
    css += `
      body {
        margin: 0;
        padding: 20px;
        background: #1e1e1e;
        font-family: 'Noto Sans JP', sans-serif;
      }
      .slides-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      .slide-wrapper {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      .slide {
        width: ${this.slideWidth}px;
        height: ${this.slideHeight}px;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .slides-container {
          gap: 0;
        }
        .slide-wrapper {
          box-shadow: none;
          page-break-after: always;
        }
      }
    `;

    return css;
  }

  /**
   * HTML全体を生成
   */
  generateHtml(slides, settings, css) {
    const slidesHtml = slides.map((slide, index) => {
      const element = SlideRenderer.render(slide, settings, {
        pageNumber: index + 1,
        totalPages: slides.length
      });
      element.setAttribute('data-theme', settings.theme || 'panhouse');

      // レイアウトを適用
      if (slide.layout) {
        SlideRenderer.applyLayoutToElement(element, slide.layout);
      }

      return `<div class="slide-wrapper">${element.outerHTML}</div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${Utils.escapeHtml(settings.title || 'Presentation')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
  <div class="slides-container">
${slidesHtml}
  </div>
</body>
</html>`;
  }

  /**
   * HTMLファイルをダウンロード
   */
  downloadHtml(html, filename) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// グローバルに公開（インスタンス）
window.HtmlExporter = new HtmlExporter();

})();
