/**
 * PptxExporter.js - PowerPointエクスポート
 * PanHouse Slide Editor
 */

(function() {

class PptxExporter {
  constructor() {
    this.slideWidth = 10; // インチ
    this.slideHeight = 5.625; // 16:9比率
  }

  /**
   * PPTXとしてエクスポート
   */
  async export() {
    if (typeof PptxGenJS === 'undefined') {
      alert('PptxGenJSライブラリが読み込まれていません');
      return;
    }

    const slides = SlideManager.getSlides();
    const settings = SlideManager.getSettings();

    if (slides.length === 0) {
      alert('エクスポートするスライドがありません');
      return;
    }

    // 進捗表示
    const progressEl = this.showProgress('PPTX生成中...', 0);

    try {
      const pptx = new PptxGenJS();

      // プレゼンテーション設定
      pptx.title = settings.title || 'Presentation';
      pptx.author = settings.author || '';
      pptx.subject = settings.subtitle || '';

      // テーマカラーを取得
      const themeColors = this.getThemeColors(settings.theme);

      // 各スライドを生成
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await this.addSlide(pptx, slide, themeColors, i + 1, slides.length);
        this.updateProgress(progressEl, Math.round(((i + 1) / slides.length) * 100));
      }

      // ファイル名を生成
      const filename = `${settings.title || 'presentation'}_${this.formatDate(new Date())}.pptx`;

      // ダウンロード
      await pptx.writeFile({ fileName: filename });

      this.hideProgress(progressEl);
      Utils.log('PptxExporter', `PPTX exported: ${filename}`);

    } catch (error) {
      this.hideProgress(progressEl);
      console.error('PPTX export error:', error);
      alert(`PPTXエクスポートに失敗しました: ${error.message}`);
    }
  }

  /**
   * スライドを追加
   */
  async addSlide(pptx, slideData, themeColors, pageNum, totalPages) {
    const pptSlide = pptx.addSlide();

    // 背景色
    pptSlide.background = { color: themeColors.background };

    // スライドタイプに応じたレンダリング
    switch (slideData.type) {
      case 'title':
        this.renderTitleSlide(pptSlide, slideData, themeColors);
        break;
      case 'section':
        this.renderSectionSlide(pptSlide, slideData, themeColors);
        break;
      case 'content':
        this.renderContentSlide(pptSlide, slideData, themeColors);
        break;
      case 'agenda':
        this.renderAgendaSlide(pptSlide, slideData, themeColors);
        break;
      case 'table':
        this.renderTableSlide(pptSlide, slideData, themeColors);
        break;
      case 'compare':
        this.renderCompareSlide(pptSlide, slideData, themeColors);
        break;
      case 'cards':
        this.renderCardsSlide(pptSlide, slideData, themeColors);
        break;
      case 'timeline':
        this.renderTimelineSlide(pptSlide, slideData, themeColors);
        break;
      case 'closing':
        this.renderClosingSlide(pptSlide, slideData, themeColors);
        break;
      default:
        this.renderDefaultSlide(pptSlide, slideData, themeColors);
    }

    // ページ番号
    pptSlide.addText(`${pageNum} / ${totalPages}`, {
      x: 9,
      y: 5.2,
      w: 0.8,
      h: 0.3,
      fontSize: 10,
      color: themeColors.textLight,
      align: 'right'
    });

    // スピーカーノート
    if (slideData.notes) {
      pptSlide.addNotes(slideData.notes);
    }

    // 追加要素（画像・テキスト・矩形）
    if (slideData.elements && slideData.elements.length > 0) {
      await this.renderElements(pptSlide, slideData.elements);
    }
  }

  /**
   * タイトルスライド
   */
  renderTitleSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // メインタイトル
    pptSlide.addText(d.title || 'タイトル', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.2,
      fontSize: 44,
      bold: true,
      color: colors.primary,
      align: 'center'
    });

    // サブタイトル
    if (d.subtitle) {
      pptSlide.addText(d.subtitle, {
        x: 0.5,
        y: 3.2,
        w: 9,
        h: 0.6,
        fontSize: 20,
        color: colors.text,
        align: 'center'
      });
    }

    // 日付
    if (d.date) {
      pptSlide.addText(d.date, {
        x: 0.5,
        y: 4,
        w: 9,
        h: 0.4,
        fontSize: 14,
        color: colors.textLight,
        align: 'center'
      });
    }
  }

  /**
   * セクションスライド
   */
  renderSectionSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // 背景をプライマリカラーに
    pptSlide.background = { color: colors.primary };

    // セクション番号
    if (d.number) {
      pptSlide.addText(d.number, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 0.8,
        fontSize: 48,
        bold: true,
        color: 'FFFFFF',
        align: 'center'
      });
    }

    // タイトル
    pptSlide.addText(d.title || 'セクション', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      align: 'center'
    });
  }

  /**
   * コンテンツスライド
   */
  renderContentSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // タイトル
    pptSlide.addText(d.title || '', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });

    // サブヘッド
    if (d.subhead) {
      pptSlide.addText(d.subhead, {
        x: 0.5,
        y: 0.9,
        w: 9,
        h: 0.4,
        fontSize: 16,
        color: colors.textLight
      });
    }

    // 箇条書き
    if (d.points && d.points.length > 0) {
      const bulletPoints = d.points.map(point => ({
        text: point,
        options: { bullet: true, color: colors.text }
      }));

      pptSlide.addText(bulletPoints, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 3.5,
        fontSize: 18,
        valign: 'top'
      });
    }
  }

  /**
   * アジェンダスライド
   */
  renderAgendaSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // タイトル
    pptSlide.addText(d.title || 'アジェンダ', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });

    // アジェンダ項目
    if (d.items && d.items.length > 0) {
      const agendaItems = d.items.map((item, idx) => ({
        text: `${idx + 1}. ${item}`,
        options: { color: colors.text }
      }));

      pptSlide.addText(agendaItems, {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 4,
        fontSize: 20,
        lineSpacing: 36,
        valign: 'top'
      });
    }
  }

  /**
   * テーブルスライド
   */
  renderTableSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // タイトル
    pptSlide.addText(d.title || '', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });

    // テーブル
    const headers = d.headers || [];
    const rows = d.rows || [];

    if (headers.length > 0) {
      const tableData = [
        headers.map(h => ({ text: h, options: { bold: true, fill: colors.primary, color: 'FFFFFF' } })),
        ...rows.map(row => row.map(cell => ({ text: cell, options: { fill: 'FFFFFF', color: colors.text } })))
      ];

      pptSlide.addTable(tableData, {
        x: 0.5,
        y: 1.2,
        w: 9,
        colW: Array(headers.length).fill(9 / headers.length),
        border: { pt: 1, color: colors.border }
      });
    }
  }

  /**
   * 比較スライド
   */
  renderCompareSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // タイトル
    pptSlide.addText(d.title || '', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });

    // 左側
    pptSlide.addText(d.leftTitle || '', {
      x: 0.5,
      y: 1.1,
      w: 4.2,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: colors.primary
    });

    if (d.leftItems && d.leftItems.length > 0) {
      const leftPoints = d.leftItems.map(item => ({
        text: item,
        options: { bullet: true, color: colors.text }
      }));
      pptSlide.addText(leftPoints, {
        x: 0.5,
        y: 1.7,
        w: 4.2,
        h: 3.3,
        fontSize: 16,
        valign: 'top'
      });
    }

    // 右側
    pptSlide.addText(d.rightTitle || '', {
      x: 5.3,
      y: 1.1,
      w: 4.2,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: colors.primary
    });

    if (d.rightItems && d.rightItems.length > 0) {
      const rightPoints = d.rightItems.map(item => ({
        text: item,
        options: { bullet: true, color: colors.text }
      }));
      pptSlide.addText(rightPoints, {
        x: 5.3,
        y: 1.7,
        w: 4.2,
        h: 3.3,
        fontSize: 16,
        valign: 'top'
      });
    }
  }

  /**
   * カードスライド
   */
  renderCardsSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // タイトル
    pptSlide.addText(d.title || '', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });

    // カード
    const items = d.items || [];
    const cardWidth = 2.8;
    const startX = 0.5;

    items.slice(0, 3).forEach((item, idx) => {
      const x = startX + (cardWidth + 0.2) * idx;

      // カード背景
      pptSlide.addShape('rect', {
        x: x,
        y: 1.2,
        w: cardWidth,
        h: 3.8,
        fill: { color: 'F5F5F5' },
        line: { color: colors.border, pt: 1 }
      });

      // アイコン
      pptSlide.addText(item.icon || '', {
        x: x,
        y: 1.4,
        w: cardWidth,
        h: 0.8,
        fontSize: 36,
        align: 'center'
      });

      // タイトル
      pptSlide.addText(item.title || '', {
        x: x + 0.1,
        y: 2.3,
        w: cardWidth - 0.2,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: colors.primary,
        align: 'center'
      });

      // 説明
      pptSlide.addText(item.description || '', {
        x: x + 0.1,
        y: 2.9,
        w: cardWidth - 0.2,
        h: 2,
        fontSize: 12,
        color: colors.text,
        align: 'center',
        valign: 'top'
      });
    });
  }

  /**
   * タイムラインスライド
   */
  renderTimelineSlide(pptSlide, data, colors) {
    const d = data.data || {};

    // タイトル
    pptSlide.addText(d.title || '', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });

    // タイムラインの線
    pptSlide.addShape('line', {
      x: 0.5,
      y: 2.8,
      w: 9,
      h: 0,
      line: { color: colors.primary, pt: 2 }
    });

    // マイルストーン
    const milestones = d.milestones || [];
    const spacing = 9 / Math.max(milestones.length, 1);

    milestones.forEach((ms, idx) => {
      const x = 0.5 + spacing * idx + spacing / 2 - 1;

      // ポイント
      pptSlide.addShape('ellipse', {
        x: x + 0.9,
        y: 2.65,
        w: 0.3,
        h: 0.3,
        fill: { color: colors.primary }
      });

      // 期間
      pptSlide.addText(ms.period || '', {
        x: x,
        y: 1.8,
        w: 2,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: colors.primary,
        align: 'center'
      });

      // タイトル
      pptSlide.addText(ms.title || '', {
        x: x,
        y: 3.1,
        w: 2,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: colors.text,
        align: 'center'
      });

      // 説明
      pptSlide.addText(ms.description || '', {
        x: x,
        y: 3.5,
        w: 2,
        h: 1,
        fontSize: 10,
        color: colors.textLight,
        align: 'center',
        valign: 'top'
      });
    });
  }

  /**
   * クロージングスライド
   */
  renderClosingSlide(pptSlide, data, colors) {
    const d = data.data || {};

    pptSlide.background = { color: colors.primary };

    pptSlide.addText(d.title || 'ご清聴ありがとうございました', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      align: 'center'
    });

    if (d.subtitle) {
      pptSlide.addText(d.subtitle, {
        x: 0.5,
        y: 3.2,
        w: 9,
        h: 0.6,
        fontSize: 18,
        color: 'FFFFFF',
        align: 'center'
      });
    }
  }

  /**
   * デフォルトスライド
   */
  renderDefaultSlide(pptSlide, data, colors) {
    const d = data.data || {};

    pptSlide.addText(d.title || '', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: colors.primary
    });
  }

  /**
   * 追加要素をレンダリング
   */
  async renderElements(pptSlide, elements) {
    for (const element of elements) {
      // スライド座標（960x540px）をインチに変換
      const x = (element.x / 960) * this.slideWidth;
      const y = (element.y / 540) * this.slideHeight;
      const w = (element.width / 960) * this.slideWidth;
      const h = (element.height / 540) * this.slideHeight;

      switch (element.type) {
        case 'image':
          if (element.dataUrl) {
            try {
              pptSlide.addImage({
                data: element.dataUrl,
                x: x,
                y: y,
                w: w,
                h: h
              });
            } catch (e) {
              console.warn('Failed to add image:', e);
            }
          }
          break;

        case 'text':
          pptSlide.addText(element.content || '', {
            x: x,
            y: y,
            w: w,
            h: h,
            fontSize: Math.round((element.fontSize || 16) * 0.75),
            color: (element.color || '#333333').replace('#', ''),
            align: element.textAlign || 'left',
            valign: 'top'
          });
          break;

        case 'rect':
          pptSlide.addShape('rect', {
            x: x,
            y: y,
            w: w,
            h: h,
            fill: { color: (element.fill || '#e0e0e0').replace('#', '') },
            line: {
              color: (element.stroke || '#999999').replace('#', ''),
              pt: element.strokeWidth || 1
            }
          });
          break;
      }
    }
  }

  /**
   * テーマカラーを取得
   */
  getThemeColors(theme) {
    const themes = {
      panhouse: {
        primary: 'F56B23',
        secondary: '1E3A5F',
        background: 'FFFFFF',
        text: '333333',
        textLight: '666666',
        border: 'E0E0E0'
      },
      blue: {
        primary: '2563EB',
        secondary: '1E40AF',
        background: 'FFFFFF',
        text: '1F2937',
        textLight: '6B7280',
        border: 'E5E7EB'
      },
      green: {
        primary: '059669',
        secondary: '047857',
        background: 'FFFFFF',
        text: '1F2937',
        textLight: '6B7280',
        border: 'E5E7EB'
      },
      minimal: {
        primary: '374151',
        secondary: '1F2937',
        background: 'FFFFFF',
        text: '1F2937',
        textLight: '6B7280',
        border: 'E5E7EB'
      }
    };

    return themes[theme] || themes.panhouse;
  }

  /**
   * 日付フォーマット
   */
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  /**
   * 進捗表示
   */
  showProgress(message, percent) {
    const el = document.createElement('div');
    el.className = 'export-progress';
    el.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px 48px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      text-align: center;
    `;
    el.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: 500;">${message}</div>
      <div style="width: 200px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
        <div class="progress-bar" style="width: ${percent}%; height: 100%; background: var(--accent-color); transition: width 0.3s;"></div>
      </div>
      <div class="progress-percent" style="margin-top: 8px; font-size: 14px; color: #666;">${percent}%</div>
    `;
    document.body.appendChild(el);
    return el;
  }

  /**
   * 進捗更新
   */
  updateProgress(el, percent) {
    if (!el) return;
    const bar = el.querySelector('.progress-bar');
    const text = el.querySelector('.progress-percent');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  }

  /**
   * 進捗非表示
   */
  hideProgress(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

// グローバルに公開
window.PptxExporter = new PptxExporter();

})();
