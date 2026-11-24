/**
 * concept.js - Concept Pages Template & Interactive Explorer
 * Renders structured educational content with diagrams, complexity matrices, and playground deep links.
 */
class ConceptExplorer {
  constructor() {
    this.container = document.getElementById('view-concept');
    this.currentConceptId = 'array';
    this.conceptsCatalog = [
      { id: 'array', title: 'Array Fundamentals', topic: 'Arrays' },
      { id: 'stack', title: 'Stack (LIFO)', topic: 'Stacks & Queues' },
      { id: 'queue', title: 'Queue (FIFO)', topic: 'Stacks & Queues' },
      { id: 'bubblesort', title: 'Bubble Sort', topic: 'Sorting' },
      { id: 'selectionsort', title: 'Selection Sort', topic: 'Sorting' },
      { id: 'insertionsort', title: 'Insertion Sort', topic: 'Sorting' },
      { id: 'mergesort', title: 'Merge Sort', topic: 'Sorting' },
      { id: 'quicksort', title: 'Quick Sort', topic: 'Sorting' },
      { id: 'binarysearch', title: 'Binary Search', topic: 'Searching' },
      { id: 'twopointers', title: 'Two Pointers Technique', topic: 'Paradigms' },
      { id: 'slidingwindow', title: 'Sliding Window', topic: 'Paradigms' }
    ];
    this.cache = {};
  }

  async init() {
    this.renderShell();
    await this.loadConcept(this.currentConceptId);
  }

  renderShell() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="concept-layout">
        <!-- Sidebar Navigation -->
        <aside class="concept-sidebar">
          <div class="concept-sidebar-header">
            <h3>Concepts</h3>
            <span class="badge-count">${this.conceptsCatalog.length} Topics</span>
          </div>
          <div class="concept-nav-list" id="concept-nav-list">
            ${this.conceptsCatalog.map(c => `
              <button class="concept-nav-item ${c.id === this.currentConceptId ? 'active' : ''}" data-id="${c.id}">
                <span class="nav-topic-tag">${c.topic}</span>
                <span class="nav-title">${c.title}</span>
              </button>
            `).join('')}
          </div>
        </aside>

        <!-- Main Article Body -->
        <article class="concept-body" id="concept-article">
          <div class="concept-loading">Loading concept...</div>
        </article>
      </div>
    `;

    // Bind sidebar clicks
    const navItems = this.container.querySelectorAll('.concept-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.loadConcept(id);
      });
    });
  }

  async loadConcept(id) {
    this.currentConceptId = id;

    // Update active nav item
    const navItems = this.container.querySelectorAll('.concept-nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.id === id);
    });

    const article = document.getElementById('concept-article');
    if (!article) return;

    let data = this.cache[id];
    if (!data) {
      try {
        const res = await fetch(`data/concepts/${id}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        this.cache[id] = data;
      } catch (err) {
        article.innerHTML = `<div class="error-msg">Failed to load concept data for "${id}": ${err.message}</div>`;
        return;
      }
    }

    this.renderConceptArticle(data);
  }

  renderConceptArticle(c) {
    const article = document.getElementById('concept-article');
    if (!article) return;

    article.innerHTML = `
      <div class="concept-content-wrapper">
        
        <!-- 1. Header: Title + One-line Intuition -->
        <header class="concept-header">
          <div class="concept-meta-badge">Interactive Guide</div>
          <h1 class="concept-title">${c.title}</h1>
          <p class="concept-intuition">${c.intuition}</p>
        </header>

        <!-- 2. "Why this exists" & Analogy -->
        <section class="concept-card card-analogy">
          <div class="card-icon-title">
            <span class="card-badge">Why It Exists</span>
            <h3>The Problem & Real-World Analogy</h3>
          </div>
          <p class="why-text">${c.whyExists}</p>
          <div class="analogy-box">
            <span class="analogy-label">💡 Analogy:</span>
            <span class="analogy-desc">${c.analogy}</span>
          </div>
        </section>

        <!-- 3. Core Idea -->
        <section class="concept-card card-core">
          <div class="card-icon-title">
            <span class="card-badge">Core Idea</span>
            <h3>Algorithmic Mechanics</h3>
          </div>
          <div class="core-prose">${c.coreIdea}</div>
        </section>

        <!-- 4. Interactive Diagram -->
        <section class="concept-card card-diagram">
          <div class="card-icon-title">
            <span class="card-badge">Visual Blueprint</span>
            <h3>Interactive Schema</h3>
          </div>
          <div class="mini-diagram-container" id="mini-diagram">
            ${this.renderMiniDiagram(c.diagramType, c.diagramData)}
          </div>
        </section>

        <!-- 5. Complexity Table -->
        <section class="concept-card card-complexity">
          <div class="card-icon-title">
            <span class="card-badge">Performance</span>
            <h3>Asymptotic Complexity</h3>
          </div>
          <table class="complexity-table">
            <thead>
              <tr>
                <th>Operation / Metric</th>
                <th>Best Case</th>
                <th>Average Case</th>
                <th>Worst Case</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Time Complexity</strong></td>
                <td><span class="comp-val">${c.complexity.time.best}</span></td>
                <td><span class="comp-val">${c.complexity.time.average}</span></td>
                <td><span class="comp-val">${c.complexity.time.worst}</span></td>
              </tr>
              <tr>
                <td><strong>Space Complexity</strong></td>
                <td colspan="3"><span class="comp-val">${c.complexity.space}</span></td>
              </tr>
            </tbody>
          </table>
          <p class="complexity-reason"><em>Rationale:</em> ${c.complexity.reason}</p>
        </section>

        <!-- 6. Common Pitfalls -->
        <section class="concept-card card-pitfalls">
          <div class="card-icon-title">
            <span class="card-badge" style="background: #e11d48; color: #fff;">Warning</span>
            <h3>Common Pitfalls & Bugs</h3>
          </div>
          <ul class="pitfalls-list">
            ${c.pitfalls.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </section>

        <!-- 7. Action Bar: Open in Playground & Navigation -->
        <div class="concept-actions-bar">
          <button id="btn-open-playground" class="btn-primary btn-large">
            <span>🎮 Open in Playground</span>
          </button>
          <div class="nav-prev-next">
            ${c.prev ? `<button class="btn-nav" id="btn-prev-concept" data-target="${c.prev}">← Previous</button>` : ''}
            ${c.next ? `<button class="btn-nav" id="btn-next-concept" data-target="${c.next}">Next →</button>` : ''}
          </div>
        </div>

      </div>
    `;

    // Hook up "Open in Playground" button
    const btnPlayground = document.getElementById('btn-open-playground');
    if (btnPlayground) {
      btnPlayground.addEventListener('click', () => {
        if (window.app && window.app.openPreset) {
          window.app.openPreset(c.playgroundPreset);
        }
      });
    }

    // Hook up Prev / Next buttons
    const btnPrev = document.getElementById('btn-prev-concept');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.loadConcept(btnPrev.dataset.target));
    }
    const btnNext = document.getElementById('btn-next-concept');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.loadConcept(btnNext.dataset.target));
    }
  }

  renderMiniDiagram(type, data) {
    if (!data || data.length === 0) return '';
    if (type === 'stack') {
      return `
        <div class="mini-stack-view">
          <div class="stack-marker">▲ TOP</div>
          <div class="mini-stack-bucket">
            ${data.slice().reverse().map((val, idx) => `
              <div class="mini-stack-cell">
                <span>${val}</span>
                <span class="mini-idx">[${data.length - 1 - idx}]</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (type === 'queue') {
      return `
        <div class="mini-queue-view">
          <span class="queue-marker">FRONT ◄</span>
          <div class="mini-queue-tube">
            ${data.map((val, idx) => `
              <div class="mini-queue-cell">
                <span>${val}</span>
                <span class="mini-idx">[${idx}]</span>
              </div>
            `).join('')}
          </div>
          <span class="queue-marker">◄ REAR</span>
        </div>
      `;
    }

    // Default: 1D array row
    return `
      <div class="mini-array-row">
        ${data.map((val, idx) => `
          <div class="mini-array-box">
            <span class="mini-val">${val}</span>
            <span class="mini-idx">[${idx}]</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}
