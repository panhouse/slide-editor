/**
 * ImageUploader.js - 画像アップロード機能
 * PanHouse Slide Editor
 */

(function() {

class ImageUploader {
  constructor() {
    this.uploadedImages = new Map(); // id -> { dataUrl, name, size }
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    this.setupGlobalDropZone();
  }

  /**
   * グローバルドロップゾーンを設定（キャンバスエリア）
   */
  setupGlobalDropZone() {
    const canvasArea = document.querySelector('.canvas-area');
    if (!canvasArea) {
      // DOMが準備できていない場合は遅延実行
      document.addEventListener('DOMContentLoaded', () => this.setupGlobalDropZone());
      return;
    }

    // ドラッグオーバー時のスタイル
    canvasArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasArea.classList.add('drag-over');
    });

    canvasArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 子要素への移動では除去しない
      if (!canvasArea.contains(e.relatedTarget)) {
        canvasArea.classList.remove('drag-over');
      }
    });

    canvasArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasArea.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFiles(files);
      }
    });
  }

  /**
   * ファイルを処理
   * @param {FileList} files
   */
  async handleFiles(files) {
    const imageFiles = Array.from(files).filter(file =>
      this.acceptedTypes.includes(file.type)
    );

    if (imageFiles.length === 0) {
      EventBus.emit(Events.ERROR, '対応している画像形式はJPEG, PNG, GIF, WebPです');
      return;
    }

    for (const file of imageFiles) {
      if (file.size > this.maxFileSize) {
        EventBus.emit(Events.ERROR, `${file.name}は5MBを超えています`);
        continue;
      }

      try {
        const imageData = await this.processImage(file);
        this.insertImageToCurrentSlide(imageData);
      } catch (error) {
        console.error('Image processing error:', error);
        EventBus.emit(Events.ERROR, `${file.name}の処理中にエラーが発生しました`);
      }
    }
  }

  /**
   * 画像を処理してデータURLに変換
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const id = Utils.generateId('img');
          const imageData = {
            id,
            dataUrl: e.target.result,
            name: file.name,
            size: file.size,
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height
          };

          this.uploadedImages.set(id, imageData);
          resolve(imageData);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 現在のスライドに画像を挿入
   * @param {Object} imageData
   */
  insertImageToCurrentSlide(imageData) {
    const currentSlide = SlideManager.getCurrentSlide();
    if (!currentSlide) {
      EventBus.emit(Events.ERROR, 'スライドを選択してください');
      return;
    }

    // デフォルトサイズを計算（スライドの40%程度）
    const slideWidth = 960;
    const slideHeight = 540;
    const maxWidth = slideWidth * 0.4;
    const maxHeight = slideHeight * 0.4;

    let width, height;
    if (imageData.aspectRatio > maxWidth / maxHeight) {
      width = maxWidth;
      height = width / imageData.aspectRatio;
    } else {
      height = maxHeight;
      width = height * imageData.aspectRatio;
    }

    // 要素として追加
    const element = {
      id: Utils.generateId('element'),
      type: 'image',
      imageId: imageData.id,
      dataUrl: imageData.dataUrl,
      x: (slideWidth - width) / 2,
      y: (slideHeight - height) / 2,
      width: Math.round(width),
      height: Math.round(height),
      rotation: 0,
      opacity: 1,
      locked: false
    };

    // 現在のスライドの要素に追加
    const elements = [...(currentSlide.elements || []), element];
    SlideManager.updateCurrentSlide({ elements });

    // 要素追加イベントを発行
    EventBus.emit(Events.ELEMENT_ADDED, element, currentSlide);
  }

  /**
   * 画像選択ダイアログを開く
   * @returns {Promise<Object|null>}
   */
  openFileDialog() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = this.acceptedTypes.join(',');
      input.multiple = true;

      input.onchange = async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
          await this.handleFiles(files);
          resolve(true);
        } else {
          resolve(false);
        }
      };

      input.click();
    });
  }

  /**
   * 画像データを取得
   * @param {string} id
   * @returns {Object|null}
   */
  getImage(id) {
    return this.uploadedImages.get(id) || null;
  }

  /**
   * すべての画像を取得
   * @returns {Map}
   */
  getAllImages() {
    return this.uploadedImages;
  }

  /**
   * 画像を削除
   * @param {string} id
   */
  removeImage(id) {
    this.uploadedImages.delete(id);
  }

  /**
   * URLから画像を読み込み
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async loadFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // URLをBase64に変換（可能な場合）
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const id = Utils.generateId('img');
          const imageData = {
            id,
            dataUrl: canvas.toDataURL('image/png'),
            name: url.split('/').pop() || 'image',
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
            sourceUrl: url
          };

          this.uploadedImages.set(id, imageData);
          resolve(imageData);
        } catch (error) {
          // CORS制限などでBase64変換できない場合
          const id = Utils.generateId('img');
          const imageData = {
            id,
            dataUrl: url, // URLをそのまま使用
            name: url.split('/').pop() || 'image',
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
            sourceUrl: url
          };

          this.uploadedImages.set(id, imageData);
          resolve(imageData);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image from URL'));
      };

      img.src = url;
    });
  }
}

// シングルトンインスタンス
const imageUploader = new ImageUploader();

// グローバルに公開
window.ImageUploader = imageUploader;

})();
