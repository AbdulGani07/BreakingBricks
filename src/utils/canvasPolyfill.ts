// Polyfill for CanvasRenderingContext2D.prototype.roundRect
// Ensures reliable rendering across all browsers, webviews, and test runners

if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined') {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      x: number,
      y: number,
      w: number,
      h: number,
      radii?: number | number[]
    ) {
      if (w < 0) {
        x += w;
        w = -w;
      }
      if (h < 0) {
        y += h;
        h = -h;
      }

      let r = 0;
      if (typeof radii === 'number') {
        r = Math.min(radii, w / 2, h / 2);
      } else if (Array.isArray(radii) && radii.length > 0) {
        r = Math.min(radii[0] || 0, w / 2, h / 2);
      }

      if (r <= 0) {
        this.rect(x, y, w, h);
        return this;
      }

      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }
}

export {};
