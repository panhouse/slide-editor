/**
 * PdfExporter.js - PDF出力（html2canvas + jsPDF）
 * PanHouse Slide Editor
 */

(function() {

class PdfExporter {
  constructor() {
    this.slideWidth = 960;
    this.slideHeight = 540;
    // 16:9のカスタムサイズ（A4幅基準）
    // 幅297mmに合わせると高さは 297 / (16/9) ≈ 167mm
    this.pdfWidth = 297;
    this.pdfHeight = 297 / (16 / 9); // ≈ 167.0625mm
  }

  /**
   * PDF出力を実行
   */
  async export() {
    const slides = SlideManager.getSlides();
    const settings = SlideManager.getSettings();

    if (slides.length === 0) {
      alert('エクスポートするスライドがありません');
      return;
    }

    // プログレス表示
    const progress = this.showProgress();

    try {
      // jsPDFインスタンス作成（16:9カスタムサイズ）
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [this.pdfWidth, this.pdfHeight]  // カスタムサイズ: 297×167mm (16:9)
      });

      // 一時的なコンテナを作成
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${this.slideWidth}px;
        height: ${this.slideHeight}px;
        background: white;
      `;
      document.body.appendChild(tempContainer);

      // 各スライドを処理
      for (let i = 0; i < slides.length; i++) {
        progress.update(i + 1, slides.length);

        const slide = slides[i];

        // スライドをレンダリング
        const element = SlideRenderer.render(slide, settings, {
          pageNumber: i + 1,
          totalPages: slides.length
        });
        element.setAttribute('data-theme', settings.theme || 'panhouse');
        element.style.width = `${this.slideWidth}px`;
        element.style.height = `${this.slideHeight}px`;

        // レイアウトを適用
        if (slide.layout) {
          SlideRenderer.applyLayoutToElement(element, slide.layout);
        }

        tempContainer.innerHTML = '';
        tempContainer.appendChild(element);

        // html2canvasでキャプチャ
        const canvas = await html2canvas(tempContainer, {
          width: this.slideWidth,
          height: this.slideHeight,
          scale: 2, // 高解像度
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // PDFに追加
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        // ページ全体に配置（余白なし）
        pdf.addImage(imgData, 'JPEG', 0, 0, this.pdfWidth, this.pdfHeight);
      }

      // クリーンアップ
      document.body.removeChild(tempContainer);

      // PDFを保存
      const filename = `${settings.title || 'presentation'}_${Utils.formatDate(new Date(), 'YYYYMMDD')}.pdf`;
      pdf.save(filename);

      progress.hide();
      EventBus.emit(Events.DATA_EXPORTED, { format: 'pdf', filename });

    } catch (error) {
      progress.hide();
      console.error('PDF export error:', error);
      alert(`PDFの出力に失敗しました: ${error.message}`);
    }
  }

  /**
   * プログレス表示を作成
   * @returns {Object}
   */
  showProgress() {
    const overlay = document.createElement('div');
    overlay.id = 'export-progress';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--bg-sidebar, #252526);
      padding: 32px 48px;
      border-radius: 12px;
      text-align: center;
      color: white;
    `;

    const title = document.createElement('h3');
    title.textContent = 'PDFを作成中...';
    title.style.marginBottom = '16px';
    content.appendChild(title);

    const progressText = document.createElement('p');
    progressText.id = 'progress-text';
    progressText.textContent = '準備中...';
    progressText.style.color = '#999';
    content.appendChild(progressText);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    return {
      update: (current, total) => {
        progressText.textContent = `${current} / ${total} ページを処理中...`;
      },
      hide: () => {
        overlay.remove();
      }
    };
  }
}

// グローバルに公開（インスタンス）
window.PdfExporter = new PdfExporter();

})();
