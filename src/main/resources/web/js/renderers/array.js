/**
 * array.js - High-performance Canvas Renderer for 1D Arrays
 * Color Palette: White background, Emerald text, Black borders and diagrams
 */
class ArrayRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Display state
    this.values = [];
    this.pointers = {};       // e.g. { "i": 0, "j": 1 }
    this.highlights = {};     // e.g. { "0": "active", "1": "active", "5": "sorted" }
    this.customPointers = []; // user dragged pointers e.g. [{ name: "p1", index: 2, color: "#047857" }]

    // Geometry config
    this.boxWidth = 56;
    this.boxHeight = 56;
    this.boxGap = 12;

    // Viewport transform (Pan & Zoom)
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    // Hover & Selection state
    this.hoveredIndex = -1;
    this.selectedIndex = -1;
    this.draggedPointer = null;

    // Tooltip DOM element
    this.tooltipEl = document.getElementById('canvas-tooltip');

    this.initEvents();
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    // Wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const newScale = Math.max(0.4, Math.min(3.0, this.scale * zoomFactor));
      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
      this.scale = newScale;
      this.draw();
    }, { passive: false });

    // Mouse down for pan / drag
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // left button
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        const hitIdx = this.hitTest(mouseX, mouseY);

        if (hitIdx !== -1) {
          this.selectedIndex = hitIdx;
          if (window.onNodeSelected) window.onNodeSelected(hitIdx, this.values[hitIdx]);
        } else {
          this.isPanning = true;
          this.panStartX = mouseX - this.offsetX;
          this.panStartY = mouseY - this.offsetY;
        }
        this.draw();
      }
    });

    // Mouse move
    this.canvas.addEventListener('mousemove', (e) => {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      if (this.isPanning) {
        this.offsetX = mouseX - this.panStartX;
        this.offsetY = mouseY - this.panStartY;
        this.draw();
        return;
      }

      const hitIdx = this.hitTest(mouseX, mouseY);
      if (hitIdx !== this.hoveredIndex) {
        this.hoveredIndex = hitIdx;
        this.updateTooltip(e.clientX, e.clientY, hitIdx);
        this.draw();
      } else if (hitIdx !== -1 && this.tooltipEl) {
        this.updateTooltip(e.clientX, e.clientY, hitIdx);
      }
    });

    // Mouse up / leave
    this.canvas.addEventListener('mouseup', () => {
      this.isPanning = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isPanning = false;
      this.hoveredIndex = -1;
      if (this.tooltipEl) this.tooltipEl.style.display = 'none';
      this.draw();
    });
  }

  updateTooltip(clientX, clientY, index) {
    if (!this.tooltipEl) return;
    if (index === -1 || index >= this.values.length) {
      this.tooltipEl.style.display = 'none';
      return;
    }
    const val = this.values[index];
    this.tooltipEl.innerHTML = `Index: <b>${index}</b> &nbsp;|&nbsp; Value: <b>${val}</b>`;
    this.tooltipEl.style.display = 'block';
    this.tooltipEl.style.left = `${clientX + 14}px`;
    this.tooltipEl.style.top = `${clientY + 14}px`;
  }

  hitTest(screenX, screenY) {
    // Transform screen coords to world coords
    const worldX = (screenX - this.offsetX) / this.scale;
    const worldY = (screenY - this.offsetY) / this.scale;

    const startX = this.getArrayStartX();
    const boxY = 0;

    for (let i = 0; i < this.values.length; i++) {
      const boxX = startX + i * (this.boxWidth + this.boxGap);
      if (
        worldX >= boxX &&
        worldX <= boxX + this.boxWidth &&
        worldY >= boxY &&
        worldY <= boxY + this.boxHeight
      ) {
        return i;
      }
    }
    return -1;
  }

  getArrayStartX() {
    const totalWidth = this.values.length * this.boxWidth + Math.max(0, this.values.length - 1) * this.boxGap;
    return -totalWidth / 2;
  }

  centerView() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.scale = 1.0;
    this.offsetX = rect.width / 2;
    this.offsetY = rect.height / 2;
    this.draw();
  }

  /**
   * Apply state snapshot from a trace step directly (for O(1) stepping / scrubbing)
   */
  applySnapshot(snapshot) {
    if (!snapshot) return;
    if (snapshot.values) {
      this.values = [...snapshot.values];
    }
    this.pointers = snapshot.pointers ? { ...snapshot.pointers } : {};
    this.highlights = snapshot.highlights ? { ...snapshot.highlights } : {};
    this.draw();
  }

  setValues(arr) {
    this.values = [...arr];
    this.pointers = {};
    this.highlights = {};
    this.centerView();
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply pan & zoom
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    const n = this.values.length;
    if (n === 0) {
      ctx.restore();
      return;
    }

    const startX = this.getArrayStartX();
    const boxY = 0;

    // Draw Array Boxes
    for (let i = 0; i < n; i++) {
      const x = startX + i * (this.boxWidth + this.boxGap);
      const val = this.values[i];
      const role = this.highlights[String(i)] || 'default';
      const isHovered = (this.hoveredIndex === i);
      const isSelected = (this.selectedIndex === i);

      // Determine fill and outline based on role
      let fillColor = '#ffffff';
      let strokeColor = '#000000';
      let lineWidth = 2;

      if (role === 'active') {
        fillColor = '#fef3c7'; // soft amber
        strokeColor = '#d97706';
        lineWidth = 2.5;
      } else if (role === 'sorted') {
        fillColor = '#d1fae5'; // soft emerald
        strokeColor = '#059669';
        lineWidth = 2.5;
      } else if (role === 'visited') {
        fillColor = '#e0f2fe';
        strokeColor = '#0284c7';
      }

      if (isHovered) {
        fillColor = '#eaf2ed';
        lineWidth = 3;
      }
      if (isSelected) {
        strokeColor = '#059669';
        lineWidth = 3.5;
      }

      // 1. Box Body (Rounded rectangle with black/accent border)
      ctx.beginPath();
      this.roundRect(ctx, x, boxY, this.boxWidth, this.boxHeight, 6);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 2. Element Value (Emerald Green text)
      ctx.fillStyle = (role === 'active') ? '#b45309' : (role === 'sorted') ? '#047857' : '#064e3b';
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + this.boxWidth / 2, boxY + this.boxHeight / 2);

      // 3. Index Tick & Label (Below box, emerald text)
      ctx.fillStyle = '#065f46';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`[${i}]`, x + this.boxWidth / 2, boxY + this.boxHeight + 8);
    }

    // Draw Pointers above boxes (e.g. i, j, left, right)
    this.drawPointers(ctx, startX, boxY);

    ctx.restore();
  }

  drawPointers(ctx, startX, boxY) {
    // Group pointers by target index
    const pointerGroups = {};
    for (const [name, target] of Object.entries(this.pointers)) {
      const idx = Number(target);
      if (!pointerGroups[idx]) pointerGroups[idx] = [];
      pointerGroups[idx].push(name);
    }

    for (const [idxStr, names] of Object.entries(pointerGroups)) {
      const idx = Number(idxStr);
      if (idx < 0 || idx >= this.values.length) continue;

      const boxX = startX + idx * (this.boxWidth + this.boxGap);
      const centerX = boxX + this.boxWidth / 2;

      // Draw downward pointer arrow
      const arrowTipY = boxY - 4;
      const arrowBaseY = boxY - 14;

      ctx.beginPath();
      ctx.moveTo(centerX, arrowTipY);
      ctx.lineTo(centerX - 6, arrowBaseY);
      ctx.lineTo(centerX + 6, arrowBaseY);
      ctx.closePath();
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Draw stacked or joint badge for pointer names
      let badgeY = arrowBaseY - 18;
      names.forEach((name, i) => {
        const text = name;
        ctx.font = '700 12px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const padX = 6;
        const padY = 3;
        const bWidth = textWidth + padX * 2;
        const bHeight = 18;
        const bX = centerX - bWidth / 2;
        const curY = badgeY - (i * 22);

        // Badge pill
        ctx.beginPath();
        this.roundRect(ctx, bX, curY, bWidth, bHeight, 4);
        ctx.fillStyle = (name === 'i') ? '#047857' : (name === 'j') ? '#059669' : '#000000';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pointer text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, centerX, curY + bHeight / 2);
      });
    }
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
}
