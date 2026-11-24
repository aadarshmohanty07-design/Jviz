/**
 * roadmap.js - Interactive DSA Mindmap with Pan/Zoom & Progress Tracking
 * Reads web/data/roadmaps/dsa_roadmap.json, tracks completion in localStorage,
 * and deep-links directly to concepts and playground presets.
 */
class RoadmapMindmap {
  constructor() {
    this.container = document.getElementById('view-roadmap');
    this.roadmapData = null;
    this.completedNodes = new Set();
    this.selectedNode = null;
    this.svg = null;
    this.g = null;

    // Viewport transform (Pan & Zoom)
    this.scale = 1.0;
    this.offsetX = 50;
    this.offsetY = 40;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('jviz_completed_nodes');
      if (saved) {
        this.completedNodes = new Set(JSON.parse(saved));
      }
    } catch (e) {
      this.completedNodes = new Set();
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('jviz_completed_nodes', JSON.stringify([...this.completedNodes]));
    } catch (e) {}
  }

  async init() {
    try {
      const res = await fetch('data/roadmaps/dsa_roadmap.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.roadmapData = await res.json();
    } catch (err) {
      console.error('Failed to load roadmap JSON:', err);
      return;
    }
    this.render();
  }

  render() {
    if (!this.container || !this.roadmapData) return;

    this.container.innerHTML = `
      <div class="roadmap-layout">
        <!-- Top Toolbar -->
        <div class="roadmap-toolbar">
          <div class="roadmap-title-group">
            <h2>DSA Mastery Mindmap</h2>
            <span class="roadmap-progress-badge" id="roadmap-progress-badge">
              ${this.completedNodes.size} / ${this.getTotalNodesCount()} Completed
            </span>
          </div>
          <div class="roadmap-tools">
            <button id="btn-roadmap-center" class="btn-icon" title="Reset View">⛶</button>
          </div>
        </div>

        <!-- Main SVG Graph Viewport + Inspector Overlay -->
        <div class="roadmap-viewport" id="roadmap-viewport">
          <svg id="roadmap-svg" width="100%" height="100%">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" />
              </marker>
            </defs>
            <g id="roadmap-canvas-group"></g>
          </svg>

          <!-- Floating Node Details Panel -->
          <div class="roadmap-node-card" id="roadmap-node-card" style="display: none;">
            <div class="node-card-header">
              <span class="node-card-topic" id="node-card-topic">Topic</span>
              <button class="node-card-close" id="node-card-close">×</button>
            </div>
            <h3 class="node-card-title" id="node-card-title">Title</h3>
            <div class="node-card-actions">
              <button id="btn-toggle-complete" class="btn-secondary" style="font-size: 11px;">
                <span id="complete-status-icon">○</span> Mark Completed
              </button>
              <button id="btn-node-concept" class="btn-secondary" style="font-size: 11px;">📖 Read Concept</button>
              <button id="btn-node-playground" class="btn-primary" style="font-size: 11px;">🎮 Open Playground</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.svg = document.getElementById('roadmap-svg');
    this.g = document.getElementById('roadmap-canvas-group');

    this.initEvents();
    this.drawGraph();
  }

  getTotalNodesCount() {
    let count = 0;
    if (this.roadmapData && this.roadmapData.topics) {
      for (const t of this.roadmapData.topics) count += t.nodes.length;
    }
    return count;
  }

  initEvents() {
    const vp = document.getElementById('roadmap-viewport');
    if (!vp) return;

    // Pan & Zoom
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale = Math.max(0.4, Math.min(2.5, this.scale * zoomFactor));
      this.updateTransform();
    }, { passive: false });

    vp.addEventListener('mousedown', (e) => {
      if (e.target.closest('.roadmap-node-card') || e.target.closest('button')) return;
      this.isPanning = true;
      this.panStartX = e.clientX - this.offsetX;
      this.panStartY = e.clientY - this.offsetY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.offsetX = e.clientX - this.panStartX;
      this.offsetY = e.clientY - this.panStartY;
      this.updateTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
    });

    const btnCenter = document.getElementById('btn-roadmap-center');
    if (btnCenter) {
      btnCenter.addEventListener('click', () => {
        this.scale = 1.0;
        this.offsetX = 50;
        this.offsetY = 40;
        this.updateTransform();
      });
    }

    const cardClose = document.getElementById('node-card-close');
    if (cardClose) {
      cardClose.addEventListener('click', () => {
        document.getElementById('roadmap-node-card').style.display = 'none';
        this.selectedNode = null;
        this.drawGraph();
      });
    }

    const btnComplete = document.getElementById('btn-toggle-complete');
    if (btnComplete) {
      btnComplete.addEventListener('click', () => {
        if (!this.selectedNode) return;
        if (this.completedNodes.has(this.selectedNode.id)) {
          this.completedNodes.delete(this.selectedNode.id);
        } else {
          this.completedNodes.add(this.selectedNode.id);
        }
        this.saveProgress();
        this.updateNodeCard(this.selectedNode);
        this.drawGraph();
        this.updateBadge();
      });
    }

    const btnConcept = document.getElementById('btn-node-concept');
    if (btnConcept) {
      btnConcept.addEventListener('click', () => {
        if (!this.selectedNode) return;
        if (window.app && window.app.openConcept) {
          window.app.openConcept(this.selectedNode.conceptId);
        }
      });
    }

    const btnPlayground = document.getElementById('btn-node-playground');
    if (btnPlayground) {
      btnPlayground.addEventListener('click', () => {
        if (!this.selectedNode) return;
        if (window.app && window.app.openPreset) {
          window.app.openPreset({
            target: this.selectedNode.preset,
            input: [5, 2, 9, 1, 6],
            mode: 'array'
          });
        }
      });
    }
  }

  updateTransform() {
    if (this.g) {
      this.g.setAttribute('transform', `translate(${this.offsetX}, ${this.offsetY}) scale(${this.scale})`);
    }
  }

  updateBadge() {
    const b = document.getElementById('roadmap-progress-badge');
    if (b) {
      b.textContent = `${this.completedNodes.size} / ${this.getTotalNodesCount()} Completed`;
    }
  }

  drawGraph() {
    if (!this.g || !this.roadmapData) return;
    this.g.innerHTML = '';
    this.updateTransform();

    const nodeMap = new Map();
    for (const topic of this.roadmapData.topics) {
      for (const node of topic.nodes) {
        node.topicName = topic.name;
        nodeMap.set(node.id, node);
      }
    }

    // 1. Draw Edge Connections (Black diagram lines with arrow markers)
    for (const topic of this.roadmapData.topics) {
      for (const node of topic.nodes) {
        if (node.prereqs && node.prereqs.length > 0) {
          for (const parentId of node.prereqs) {
            const parent = nodeMap.get(parentId);
            if (parent) {
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              // Smooth bezier curve
              const x1 = parent.x + 90;
              const y1 = parent.y + 25;
              const x2 = node.x + 10;
              const y2 = node.y + 25;
              const dx = (x2 - x1) / 2;
              const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              line.setAttribute('d', d);
              line.setAttribute('fill', 'none');
              line.setAttribute('stroke', '#000000');
              line.setAttribute('stroke-width', '2');
              line.setAttribute('marker-end', 'url(#arrow)');
              this.g.appendChild(line);
            }
          }
        }
      }
    }

    // 2. Draw Nodes (White background, black border, emerald text)
    for (const topic of this.roadmapData.topics) {
      for (const node of topic.nodes) {
        const isCompleted = this.completedNodes.has(node.id);
        const isSelected = (this.selectedNode && this.selectedNode.id === node.id);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        group.style.cursor = 'pointer';

        // Outer box
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '170');
        rect.setAttribute('height', '50');
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', isSelected ? '#ecfdf5' : isCompleted ? '#d1fae5' : '#ffffff');
        rect.setAttribute('stroke', isSelected ? '#059669' : '#000000');
        rect.setAttribute('stroke-width', isSelected ? '3' : '2');
        group.appendChild(rect);

        // Checkmark badge
        if (isCompleted) {
          const checkCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          checkCircle.setAttribute('cx', '155');
          checkCircle.setAttribute('cy', '15');
          checkCircle.setAttribute('r', '8');
          checkCircle.setAttribute('fill', '#059669');
          group.appendChild(checkCircle);

          const check = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          check.setAttribute('x', '155');
          check.setAttribute('y', '19');
          check.setAttribute('fill', '#ffffff');
          check.setAttribute('font-size', '10');
          check.setAttribute('font-weight', 'bold');
          check.setAttribute('text-anchor', 'middle');
          check.textContent = '✓';
          group.appendChild(check);
        }

        // Title text (Emerald Green)
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '14');
        text.setAttribute('y', '26');
        text.setAttribute('fill', '#064e3b');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '700');
        text.textContent = node.title;
        group.appendChild(text);

        // Topic subtext
        const subtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtext.setAttribute('x', '14');
        subtext.setAttribute('y', '40');
        subtext.setAttribute('fill', '#059669');
        subtext.setAttribute('font-size', '10');
        subtext.setAttribute('font-weight', '600');
        subtext.textContent = node.topicName;
        group.appendChild(subtext);

        // Click handler
        group.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectNode(node);
        });

        this.g.appendChild(group);
      }
    }
  }

  selectNode(node) {
    this.selectedNode = node;
    this.drawGraph();
    this.updateNodeCard(node);
  }

  updateNodeCard(node) {
    const card = document.getElementById('roadmap-node-card');
    if (!card) return;

    card.style.display = 'block';
    document.getElementById('node-card-topic').textContent = node.topicName;
    document.getElementById('node-card-title').textContent = node.title;

    const isCompleted = this.completedNodes.has(node.id);
    const icon = document.getElementById('complete-status-icon');
    const btn = document.getElementById('btn-toggle-complete');
    if (icon && btn) {
      icon.textContent = isCompleted ? '✓' : '○';
      btn.style.borderColor = isCompleted ? '#059669' : '#000000';
      btn.style.color = isCompleted ? '#059669' : '#064e3b';
    }
  }
}
