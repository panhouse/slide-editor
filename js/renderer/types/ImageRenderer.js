/**
 * ImageRenderer.js - 画像要素レンダラー
 * PanHouse Slide Editor
 */

(function() {

class ImageElementRenderer {
  /**
   * 画像要素をレンダリング
   * @param {Object} element - 要素データ
   * @returns {HTMLElement}
   */
  render(element) {
    const container = document.createElement('div');
    container.className = 'slide-element slide-element-image';
    container.dataset.elementId = element.id;

    // 位置とサイズを適用
    container.style.cssText = `
      position: absolute;
      left: ${element.x}px;
      top: ${element.y}px;
      width: ${element.width}px;
      height: ${element.height}px;
      transform: rotate(${element.rotation || 0}deg);
      opacity: ${element.opacity || 1};
      pointer-events: ${element.locked ? 'none' : 'auto'};
    `;

    // 画像を作成
    const img = document.createElement('img');
    img.src = element.dataUrl;
    img.alt = element.name || 'Image';
    img.draggable = false;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    `;

    container.appendChild(img);

    return container;
  }

  /**
   * 要素データから更新
   * @param {HTMLElement} container
   * @param {Object} element
   */
  update(container, element) {
    container.style.left = `${element.x}px`;
    container.style.top = `${element.y}px`;
    container.style.width = `${element.width}px`;
    container.style.height = `${element.height}px`;
    container.style.transform = `rotate(${element.rotation || 0}deg)`;
    container.style.opacity = element.opacity || 1;

    const img = container.querySelector('img');
    if (img && element.dataUrl) {
      img.src = element.dataUrl;
    }
  }
}

// グローバルに公開
window.ImageElementRenderer = new ImageElementRenderer();

})();
