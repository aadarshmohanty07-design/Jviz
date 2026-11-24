/**
 * array.js - High-performance Interactive Canvas Renderer
 * Supports:
 * - Array mode (1D row with insert slide-apart and delete slide-together animations)
 * - Stack mode (vertical bucket growing upward with TOP indicator and push/pop animations)
 * - Queue mode (horizontal tube with FRONT / REAR indicators and enqueue/dequeue animations)
 * - Draggable named pointers (attach to box, rename, recolor, delete, stays attached on shift)
 * - Pan, zoom, click-to-select, tooltips on hover
 * - High-DPI retina display scaling
 */
class ArrayRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Display mode: 'array' | 'stack' | 'queue'
    this.mode = 'array';

    // Core data state
    this.values = [5, 2, 9, 1, 5, 6];
    this.pointers = {};       // from trace: { "i": 0, "j": 1 }
    this.highlights = {};     // { "0": "active", "1": "sorted" }
    
    // User-managed interactive pointers: [ { id: "p1", name: "i", target: 0, color: "#047857" } ]
    this.userPointers = [
      { id: "p_head", name: "head", target: 0, color: "#047857" }
    ];

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
    this.draggingPointer = null;

    // Active animation state (for insert/delete slide)
    this.animating = false;
    this.animationType = null; // 'insert' | 'delete'
    this.animProgress = 1.0;
    this.animPayload = null;

    // Tooltip DOM
    this.tooltipEl = document.getElementById('canvas-tooltip');

    this.initEvents();
    this.resize();
    this.centerView();
  }

  setMode(newMode) {
    this.mode = newMode;
    this.centerView();
    this.draw();
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

      const newScale = Math.max(0.35, Math.min(3.0, this.scale * zoomFactor));
      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
      this.scale = newScale;
      this.draw();
    }, { passive: false });

    // Mouse down: detect pointer drag, box select, or pan
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      // 1. Check if clicking on a user pointer badge to drag it
      const hitPtr = this.hitTestUserPointer(mouseX, mouseY);
      if (hitPtr) {
        this.draggingPointer = hitPtr;
        return;
      }

      // 2. Check if clicking on an array box
      const hitIdx = this.hitTestBox(mouseX, mouseY);
      if (hitIdx !== -1) {
        this.selectedIndex = hitIdx;
        if (window.onNodeSelected) window.onNodeSelected(hitIdx, this.values[hitIdx]);
      } else {
        // Pan workspace
        this.isPanning = true;
        this.panStartX = mouseX - this.offsetX;
        this.panStartY = mouseY - this.offsetY;
      }
      this.draw();
    });

    // Mouse move
    this.canvas.addEventListener('mousemove', (e) => {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      if (this.draggingPointer) {
        // Dragging a pointer dot
        const hitIdx = this.hitTestBox(mouseX, mouseY);
        if (hitIdx !== -1 && hitIdx !== this.draggingPointer.target) {
          this.draggingPointer.target = hitIdx;
        }
        this.draw();
        return;
      }

      if (this.isPanning) {
        this.offsetX = mouseX - this.panStartX;
        this.offsetY = mouseY - this.panStartY;
        this.draw();
        return;
      }

      const hitIdx = this.hitTestBox(mouseX, mouseY);
      if (hitIdx !== this.hoveredIndex) {
        this.hoveredIndex = hitIdx;
        this.updateTooltip(e.clientX, e.clientY, hitIdx);
        this.draw();
      } else if (hitIdx !== -1 && this.tooltipEl) {
        this.updateTooltip(e.clientX, e.clientY, hitIdx);
      }
    });

    // Mouse up
    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.draggingPointer = null;
    });

    this.canvas.addEventListener('mouseleave', () => {
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

  centerView() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.scale = 1.0;
    this.offsetX = rect.width / 2;
    this.offsetY = rect.height / 2;
    this.draw();
  }

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

  /* ---------------- Interactive Insert & Delete Operations ---------------- */

  insertAt(index, value) {
    const targetIdx = Math.max(0, Math.min(index, this.values.length));
    this.animating = true;
    this.animationType = 'insert';
    this.animProgress = 0;
    this.animPayload = { index: targetIdx, value: value };

    const startTime = performance.now();
    const duration = 350; // ms

    const animate = (now) => {
      const elapsed = now - startTime;
      this.animProgress = Math.min(1.0, elapsed / duration);
      this.draw();

      if (this.animProgress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Finalize insertion
        this.values.splice(targetIdx, 0, value);
        // Shift user pointers at or after targetIdx
        for (const p of this.userPointers) {
          if (p.target >= targetIdx) p.target++;
        }
        this.animating = false;
        this.animPayload = null;
        this.draw();
      }
    };
    requestAnimationFrame(animate);
  }

  deleteAt(index) {
    if (index < 0 || index >= this.values.length) return;
    this.animating = true;
    this.animationType = 'delete';
    this.animProgress = 0;
    this.animPayload = { index: index, value: this.values[index] };

    const startTime = performance.now();
    const duration = 350;

    const animate = (now) => {
      const elapsed = now - startTime;
      this.animProgress = Math.min(1.0, elapsed / duration);
      this.draw();

      if (this.animProgress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Finalize deletion
        this.values.splice(index, 1);
        for (const p of this.userPointers) {
          if (p.target === index) p.target = Math.max(0, index - 1);
          else if (p.target > index) p.target--;
        }
        this.animating = false;
        this.animPayload = null;
        this.draw();
      }
    };
    requestAnimationFrame(animate);
  }

  addUserPointer(name, targetIndex, color = '#047857') {
    const id = 'ptr_' + Date.now();
    this.userPointers.push({ id, name, target: Math.max(0, Math.min(targetIndex, this.values.length - 1)), color });
    this.draw();
  }

  removeUserPointer(id) {
    this.userPointers = this.userPointers.filter(p => p.id !== id);
    this.draw();
  }

  /* ---------------- Drawing & Rendering Routines ---------------- */

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    if (this.mode === 'stack') {
      this.drawStack(ctx);
    } else if (this.mode === 'queue') {
      this.drawQueue(ctx);
    } else {
      this.drawArray(ctx);
    }

    ctx.restore();
  }

  /* ---------------- Array View Mode ---------------- */

  getArrayStartX() {
    const totalCount = this.animating && this.animationType === 'insert' ? this.values.length + 1 : this.values.length;
    const totalWidth = totalCount * this.boxWidth + Math.max(0, totalCount - 1) * this.boxGap;
    return -totalWidth / 2;
  }

  drawArray(ctx) {
    const n = this.values.length;
    const startX = this.getArrayStartX();
    const boxY = 0;

    let displayList = [];
    for (let i = 0; i < n; i++) {
      displayList.push({ val: this.values[i], origIdx: i });
    }

    // Render elements with animation offset
    for (let i = 0; i < n; i++) {
      const item = displayList[i];
      let x = startX + i * (this.boxWidth + this.boxGap);
      let y = boxY;
      let opacity = 1.0;

      // Handle slide animation
      if (this.animating && this.animPayload) {
        const targetIdx = this.animPayload.index;
        if (this.animationType === 'insert' && i >= targetIdx) {
          x += (this.boxWidth + this.boxGap) * this.animProgress;
        } else if (this.animationType === 'delete') {
          if (i === targetIdx) {
            opacity = 1.0 - this.animProgress;
            y -= 20 * this.animProgress;
          } else if (i > targetIdx) {
            x -= (this.boxWidth + this.boxGap) * this.animProgress;
          }
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      this.drawSingleBox(ctx, x, y, item.val, i);
      ctx.restore();
    }

    // Draw sliding incoming inserted element
    if (this.animating && this.animationType === 'insert' && this.animPayload) {
      const insertX = startX + this.animPayload.index * (this.boxWidth + this.boxGap);
      const insertY = boxY - (1.0 - this.animProgress) * 40;
      ctx.save();
      ctx.globalAlpha = this.animProgress;
      this.drawSingleBox(ctx, insertX, insertY, this.animPayload.value, this.animPayload.index);
      ctx.restore();
    }

    // Draw Pointers
    this.drawArrayPointers(ctx, startX, boxY);
  }

  drawSingleBox(ctx, x, y, val, i) {
    const role = this.highlights[String(i)] || 'default';
    const isHovered = (this.hoveredIndex === i);
    const isSelected = (this.selectedIndex === i);

    let fillColor = '#ffffff';
    let strokeColor = '#000000';
    let lineWidth = 2;

    if (role === 'active') {
      fillColor = '#fef3c7';
      strokeColor = '#d97706';
      lineWidth = 2.5;
    } else if (role === 'sorted') {
      fillColor = '#d1fae5';
      strokeColor = '#059669';
      lineWidth = 2.5;
    } else if (role === 'visited') {
      fillColor = '#e0f2fe';
      strokeColor = '#0284c7';
    } else if (role === 'discarded') {
      fillColor = '#f1f5f9';
      strokeColor = '#94a3b8';
    }

    if (isHovered) {
      fillColor = '#eaf2ed';
      lineWidth = 3;
    }
    if (isSelected) {
      strokeColor = '#059669';
      lineWidth = 3.5;
    }

    // Box outline
    ctx.beginPath();
    this.roundRect(ctx, x, y, this.boxWidth, this.boxHeight, 6);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Value text (Emerald Green)
    ctx.fillStyle = (role === 'active') ? '#b45309' : (role === 'sorted') ? '#047857' : (role === 'discarded') ? '#94a3b8' : '#064e3b';
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(val), x + this.boxWidth / 2, y + this.boxHeight / 2);

    // Index tick label
    ctx.fillStyle = '#065f46';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`[${i}]`, x + this.boxWidth / 2, y + this.boxHeight + 8);
  }

  drawArrayPointers(ctx, startX, boxY) {
    const groups = {};

    // 1. Trace pointers
    for (const [name, target] of Object.entries(this.pointers)) {
      const idx = Number(target);
      if (!groups[idx]) groups[idx] = [];
      groups[idx].push({ name, color: '#047857', isUser: false });
    }

    // 2. User interactive pointers
    for (const p of this.userPointers) {
      const idx = p.target;
      if (!groups[idx]) groups[idx] = [];
      groups[idx].push({ name: p.name, color: p.color || '#059669', isUser: true, id: p.id });
    }

    for (const [idxStr, list] of Object.entries(groups)) {
      const idx = Number(idxStr);
      if (idx < 0 || idx >= this.values.length) continue;

      const boxX = startX + idx * (this.boxWidth + this.boxGap);
      const centerX = boxX + this.boxWidth / 2;

      // Pointer Arrow
      const arrowTipY = boxY - 4;
      const arrowBaseY = boxY - 14;

      ctx.beginPath();
      ctx.moveTo(centerX, arrowTipY);
      ctx.lineTo(centerX - 6, arrowBaseY);
      ctx.lineTo(centerX + 6, arrowBaseY);
      ctx.closePath();
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Badges
      let badgeY = arrowBaseY - 18;
      list.forEach((p, k) => {
        const text = p.name;
        ctx.font = '700 12px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const bWidth = textWidth + 12;
        const bHeight = 18;
        const bX = centerX - bWidth / 2;
        const curY = badgeY - (k * 22);

        ctx.beginPath();
        this.roundRect(ctx, bX, curY, bWidth, bHeight, 4);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, centerX, curY + bHeight / 2);
      });
    }
  }

  /* ---------------- Stack View Mode (Vertical Bucket) ---------------- */

  drawStack(ctx) {
    const stackWidth = 120;
    const cellHeight = 44;
    const n = this.values.length;
    const bucketHeight = Math.max(220, (n + 2) * cellHeight);
    const startX = -stackWidth / 2;
    const baseY = bucketHeight / 2;

    // Draw Bucket Walls (Black lines, U-shaped container)
    ctx.beginPath();
    ctx.moveTo(startX, baseY - bucketHeight);
    ctx.lineTo(startX, baseY);
    ctx.lineTo(startX + stackWidth, baseY);
    ctx.lineTo(startX + stackWidth, baseY - bucketHeight);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Stack Elements from bottom to top
    for (let i = 0; i < n; i++) {
      const cellY = baseY - (i + 1) * cellHeight;
      const val = this.values[i];
      const isTop = (i === n - 1);

      ctx.beginPath();
      this.roundRect(ctx, startX + 4, cellY + 4, stackWidth - 8, cellHeight - 8, 4);
      ctx.fillStyle = isTop ? '#d1fae5' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Value
      ctx.fillStyle = '#064e3b';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), 0, cellY + cellHeight / 2);

      // Index label on right side
      ctx.fillStyle = '#065f46';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i}]`, startX + stackWidth + 12, cellY + cellHeight / 2);
    }

    // TOP Indicator Arrow
    if (n > 0) {
      const topY = baseY - n * cellHeight;
      ctx.fillStyle = '#059669';
      ctx.font = '800 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('TOP ➔', startX - 12, topY + cellHeight / 2);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STACK EMPTY', 0, baseY - 50);
    }
  }

  /* ---------------- Queue View Mode (Horizontal Tube) ---------------- */

  drawQueue(ctx) {
    const cellWidth = 56;
    const tubeHeight = 64;
    const n = this.values.length;
    const tubeWidth = Math.max(300, (n + 3) * (cellWidth + 10));
    const startX = -tubeWidth / 2;
    const tubeY = -tubeHeight / 2;

    // Draw Upper & Lower Tube Rails (Black lines)
    ctx.beginPath();
    ctx.moveTo(startX, tubeY);
    ctx.lineTo(startX + tubeWidth, tubeY);
    ctx.moveTo(startX, tubeY + tubeHeight);
    ctx.lineTo(startX + tubeWidth, tubeY + tubeHeight);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // FRONT indicator (Left)
    ctx.fillStyle = '#047857';
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('◄ FRONT (DEQUEUE)', startX - 14, 0);

    // REAR indicator (Right)
    ctx.fillStyle = '#0284c7';
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('(ENQUEUE) ◄ REAR', startX + tubeWidth + 14, 0);

    // Draw Queue Elements
    const elementsStartX = startX + 30;
    for (let i = 0; i < n; i++) {
      const x = elementsStartX + i * (cellWidth + 10);
      const y = tubeY + 6;
      const val = this.values[i];
      const isFront = (i === 0);
      const isRear = (i === n - 1);

      ctx.beginPath();
      this.roundRect(ctx, x, y, cellWidth, tubeHeight - 12, 6);
      ctx.fillStyle = isFront ? '#d1fae5' : isRear ? '#e0f2fe' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Value
      ctx.fillStyle = '#064e3b';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + cellWidth / 2, y + (tubeHeight - 12) / 2);

      // Index below
      ctx.fillStyle = '#065f46';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`[${i}]`, x + cellWidth / 2, tubeY + tubeHeight + 14);
    }

    if (n === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QUEUE EMPTY', 0, 0);
    }
  }

  /* ---------------- Hit Testing & Helpers ---------------- */

  hitTestBox(screenX, screenY) {
    const worldX = (screenX - this.offsetX) / this.scale;
    const worldY = (screenY - this.offsetY) / this.scale;

    if (this.mode === 'array') {
      const startX = this.getArrayStartX();
      for (let i = 0; i < this.values.length; i++) {
        const boxX = startX + i * (this.boxWidth + this.boxGap);
        if (worldX >= boxX && worldX <= boxX + this.boxWidth && worldY >= 0 && worldY <= this.boxHeight) {
          return i;
        }
      }
    }
    return -1;
  }

  hitTestUserPointer(screenX, screenY) {
    if (this.mode !== 'array') return null;
    const worldX = (screenX - this.offsetX) / this.scale;
    const worldY = (screenY - this.offsetY) / this.scale;
    const startX = this.getArrayStartX();

    for (const p of this.userPointers) {
      const boxX = startX + p.target * (this.boxWidth + this.boxGap);
      const centerX = boxX + this.boxWidth / 2;
      if (Math.abs(worldX - centerX) < 20 && worldY < 0 && worldY > -45) {
        return p;
      }
    }
    return null;
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
