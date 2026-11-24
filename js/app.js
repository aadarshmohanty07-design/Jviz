/**
 * app.js - Main Application Orchestrator & View Switcher
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Views
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = {
    roadmap: document.getElementById('view-roadmap'),
    concept: document.getElementById('view-concept'),
    playground: document.getElementById('view-playground')
  };

  function switchView(viewName) {
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    for (const [name, el] of Object.entries(views)) {
      if (el) el.classList.toggle('active', name === viewName);
    }
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });

  // 2. Initialize Canvas & Renderer
  const canvas = document.getElementById('playground-canvas');
  const arrayRenderer = new ArrayRenderer(canvas);
  const player = new TimelinePlayer(arrayRenderer);

  // Expose globally for console / debugging
  window.app = {
    renderer: arrayRenderer,
    player: player,
    switchView: switchView
  };

  // Center view on canvas toolbar button
  const btnResetView = document.getElementById('btn-reset-view');
  if (btnResetView) {
    btnResetView.addEventListener('click', () => arrayRenderer.centerView());
  }

  // 3. Algorithm Run Handler
  const inputDataEl = document.getElementById('input-data');
  const btnRun = document.getElementById('btn-run');
  const sizeSlider = document.getElementById('size-slider');
  const sizeLabel = document.getElementById('size-label');
  const btnRandomize = document.getElementById('btn-randomize');
  const consoleInput = document.getElementById('console-input');

  function parseInputArray() {
    const raw = inputDataEl ? inputDataEl.value.trim() : '';
    if (!raw) return [5, 2, 9, 1, 5, 6];
    // Remove brackets if typed like [5, 2, 9]
    const cleaned = raw.replace(/[\[\]]/g, '');
    const parts = cleaned.split(/[, ]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    return parts.length > 0 ? parts : [5, 2, 9, 1, 5, 6];
  }

  async function runSelectedAlgorithm() {
    const arr = parseInputArray();
    if (btnRun) {
      btnRun.disabled = true;
      btnRun.textContent = 'Generating...';
    }

    try {
      const trace = await Api.run('algorithm', 'bubbleSort', arr);
      player.loadTrace(trace);
      arrayRenderer.centerView();
    } catch (err) {
      alert('Error running algorithm: ' + err.message);
    } finally {
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = 'Run Algorithm';
      }
    }
  }

  if (btnRun) {
    btnRun.addEventListener('click', runSelectedAlgorithm);
  }

  // Randomize button & slider
  if (sizeSlider && sizeLabel) {
    sizeSlider.addEventListener('input', (e) => {
      sizeLabel.textContent = e.target.value;
    });
  }

  if (btnRandomize) {
    btnRandomize.addEventListener('click', () => {
      const n = sizeSlider ? parseInt(sizeSlider.value, 10) : 8;
      const randArr = [];
      for (let i = 0; i < n; i++) {
        randArr.push(Math.floor(Math.random() * 90) + 10);
      }
      if (inputDataEl) inputDataEl.value = randArr.join(', ');
      runSelectedAlgorithm();
    });
  }

  // Mini command console
  if (consoleInput) {
    consoleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = consoleInput.value.trim().toLowerCase();
        consoleInput.value = '';
        handleConsoleCommand(cmd);
      }
    });
  }

  function handleConsoleCommand(cmd) {
    if (!cmd) return;
    const tokens = cmd.split(/\s+/);
    const action = tokens[0];

    if (action === 'run' || action === 'bubblesort') {
      runSelectedAlgorithm();
    } else if (action === 'reset') {
      player.reset();
    } else if (action === 'play') {
      player.play();
    } else if (action === 'pause') {
      player.pause();
    } else if (action === 'random') {
      if (btnRandomize) btnRandomize.click();
    } else {
      alert(`Command '${action}' not recognized. Try: run, play, pause, reset, random`);
    }
  }

  // 4. Initial Load: Run Bubble Sort slice
  runSelectedAlgorithm();
});
