/**
 * player.js - Universal Timeline Controller
 * Coordinates playback, scrubbing, O(1) backward stepping, and source-code line synchronization.
 */
class TimelinePlayer {
  constructor(renderer) {
    this.renderer = renderer;
    this.trace = null;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.timer = null;

    // DOM Elements
    this.btnPlay = document.getElementById('btn-play');
    this.btnStepBack = document.getElementById('btn-step-back');
    this.btnStepFwd = document.getElementById('btn-step-fwd');
    this.btnReset = document.getElementById('btn-reset');
    this.scrubber = document.getElementById('timeline-scrubber');
    this.stepCounter = document.getElementById('step-counter');
    this.stepMessage = document.getElementById('step-message');
    this.speedSelect = document.getElementById('speed-select');

    // Code panel elements
    this.codeContainer = document.getElementById('code-container');
    this.codeTitle = document.getElementById('code-title');

    // Metrics elements
    this.metricComparisons = document.getElementById('metric-comparisons');
    this.metricSwaps = document.getElementById('metric-swaps');
    this.variablesDisplay = document.getElementById('variables-display');

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.togglePlay());
    }
    if (this.btnStepBack) {
      this.btnStepBack.addEventListener('click', () => this.stepBackward());
    }
    if (this.btnStepFwd) {
      this.btnStepFwd.addEventListener('click', () => this.stepForward());
    }
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }
    if (this.scrubber) {
      this.scrubber.addEventListener('input', (e) => {
        this.pause();
        this.seek(parseInt(e.target.value, 10));
      });
    }
    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (e) => {
        this.playbackSpeed = parseFloat(e.target.value);
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.stepBackward();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.reset();
      }
    });
  }

  loadTrace(trace) {
    this.pause();
    this.trace = trace;
    this.currentStepIndex = 0;

    const totalSteps = trace.steps ? trace.steps.length : 0;
    if (this.scrubber) {
      this.scrubber.min = 0;
      this.scrubber.max = Math.max(0, totalSteps - 1);
      this.scrubber.value = 0;
    }

    // Render source code into code container
    this.renderSourceCode(trace.sourceCode, trace.meta ? trace.meta.title : 'Implementation');

    // Update initial view
    if (totalSteps > 0) {
      this.applyStep(0);
    } else if (trace.initialState && trace.initialState.data) {
      this.renderer.setValues(trace.initialState.data);
    }

    this.updateControls();
  }

  renderSourceCode(lines, title) {
    if (this.codeTitle && title) {
      this.codeTitle.textContent = `${title} (Java)`;
    }
    if (!this.codeContainer) return;
    this.codeContainer.innerHTML = '';

    if (!lines || lines.length === 0) {
      this.codeContainer.innerHTML = '<div style="padding: 10px; color: #94a3b8;">No source code available.</div>';
      return;
    }

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1; // 1-based line number
      const row = document.createElement('div');
      row.className = 'code-line';
      row.id = `code-line-${lineNum}`;

      const numEl = document.createElement('span');
      numEl.className = 'code-line-num';
      numEl.textContent = lineNum;

      const codeEl = document.createElement('span');
      codeEl.className = 'code-line-content';
      codeEl.textContent = lineText;

      row.appendChild(numEl);
      row.appendChild(codeEl);
      this.codeContainer.appendChild(row);
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.trace || !this.trace.steps || this.trace.steps.length === 0) return;
    if (this.currentStepIndex >= this.trace.steps.length - 1) {
      this.currentStepIndex = 0;
    }
    this.isPlaying = true;
    if (this.btnPlay) this.btnPlay.innerHTML = '⏸';
    this.scheduleNextTick();
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.btnPlay) this.btnPlay.innerHTML = '▶';
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;
    const baseInterval = 600; // ms
    const interval = Math.max(80, baseInterval / this.playbackSpeed);

    this.timer = setTimeout(() => {
      if (!this.isPlaying) return;
      if (this.currentStepIndex < this.trace.steps.length - 1) {
        this.stepForward();
        this.scheduleNextTick();
      } else {
        this.pause();
      }
    }, interval);
  }

  stepForward() {
    if (!this.trace || !this.trace.steps) return;
    if (this.currentStepIndex < this.trace.steps.length - 1) {
      this.currentStepIndex++;
      this.applyStep(this.currentStepIndex);
      this.updateControls();
    }
  }

  stepBackward() {
    if (!this.trace || !this.trace.steps) return;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.applyStep(this.currentStepIndex);
      this.updateControls();
    }
  }

  seek(stepIndex) {
    if (!this.trace || !this.trace.steps) return;
    const targetIdx = Math.max(0, Math.min(stepIndex, this.trace.steps.length - 1));
    this.currentStepIndex = targetIdx;
    this.applyStep(this.currentStepIndex);
    this.updateControls();
  }

  reset() {
    this.pause();
    this.seek(0);
  }

  applyStep(index) {
    const step = this.trace.steps[index];
    if (!step) return;

    // 1. Apply snapshot to renderer in O(1)
    if (step.stateSnapshot) {
      this.renderer.applySnapshot(step.stateSnapshot);
    }

    // 2. Update narrative message
    if (this.stepMessage) {
      this.stepMessage.textContent = step.message || 'Executing...';
    }

    // 3. Highlight source code line
    this.highlightCodeLine(step.line);

    // 4. Update metrics and variables display
    this.updateVariablesAndMetrics(step);
  }

  highlightCodeLine(lineNumber) {
    if (!this.codeContainer) return;
    // Remove previous active line
    const activeLines = this.codeContainer.querySelectorAll('.code-line.active-line');
    activeLines.forEach(el => el.classList.remove('active-line'));

    if (lineNumber && lineNumber > 0) {
      const lineEl = document.getElementById(`code-line-${lineNumber}`);
      if (lineEl) {
        lineEl.classList.add('active-line');
        // Auto scroll into view
        lineEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  updateVariablesAndMetrics(step) {
    const snap = step.stateSnapshot;
    if (!snap) return;

    // Running metrics up to this step
    let runningComps = 0;
    let runningSwaps = 0;
    for (let i = 0; i <= this.currentStepIndex; i++) {
      const s = this.trace.steps[i];
      if (s && s.events) {
        for (const ev of s.events) {
          if (ev.type === 'compare') runningComps++;
          if (ev.type === 'swap') runningSwaps++;
        }
      }
    }

    if (this.metricComparisons) this.metricComparisons.textContent = runningComps;
    if (this.metricSwaps) this.metricSwaps.textContent = runningSwaps;

    // Variable pointers
    if (this.variablesDisplay && snap.pointers) {
      const ptrEntries = Object.entries(snap.pointers);
      if (ptrEntries.length === 0) {
        this.variablesDisplay.innerHTML = '<span style="color: #94a3b8; font-size: 11px;">No active pointers</span>';
      } else {
        this.variablesDisplay.innerHTML = ptrEntries.map(([k, v]) => {
          return `<span class="kbd" style="margin-right: 6px;">${k} = ${v}</span>`;
        }).join('');
      }
    }
  }

  updateControls() {
    const totalSteps = this.trace && this.trace.steps ? this.trace.steps.length : 0;
    if (this.scrubber) {
      this.scrubber.value = this.currentStepIndex;
    }
    if (this.stepCounter) {
      this.stepCounter.textContent = `${this.currentStepIndex} / ${Math.max(0, totalSteps - 1)}`;
    }
    if (this.btnStepBack) {
      this.btnStepBack.disabled = (this.currentStepIndex <= 0);
    }
    if (this.btnStepFwd) {
      this.btnStepFwd.disabled = (this.currentStepIndex >= totalSteps - 1);
    }
  }
}
