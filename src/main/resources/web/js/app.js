/**
 * app.js - Main Application Orchestrator
 * Coordinates Roadmap mindmap, Concept explorer, Playground sandbox,
 * 10+ algorithms, interactive array modifications, and state persistence.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Views
  const navBtns = document.querySelectorAll('.nav-links .nav-btn');
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

  // 2. Initialize Canvas & Player
  const canvas = document.getElementById('playground-canvas');
  const arrayRenderer = new ArrayRenderer(canvas);
  const player = new TimelinePlayer(arrayRenderer);

  // 3. Initialize Roadmap & Concept Explorers
  const roadmap = new RoadmapMindmap();
  const concept = new ConceptExplorer();
  await roadmap.init();
  await concept.init();

  // Expose global app methods for deep-linking
  window.app = {
    renderer: arrayRenderer,
    player: player,
    switchView: switchView,
    openConcept: (conceptId) => {
      switchView('concept');
      concept.loadConcept(conceptId);
    },
    openPreset: (preset) => {
      switchView('playground');
      if (!preset) return;
      if (preset.mode) {
        setPlaygroundMode(preset.mode);
      }
      if (preset.input) {
        const inputDataEl = document.getElementById('input-data');
        if (inputDataEl) inputDataEl.value = preset.input.join(', ');
      }
      if (preset.target) {
        const selAlgo = document.getElementById('select-algorithm');
        if (selAlgo) selAlgo.value = preset.target;
      }
      if (preset.args && preset.args.targetValue !== undefined) {
        const argInput = document.getElementById('input-arg-val');
        if (argInput) argInput.value = preset.args.targetValue;
      }
      runSelectedAlgorithm();
    }
  };

  // Center view on canvas toolbar button
  const btnResetView = document.getElementById('btn-reset-view');
  if (btnResetView) {
    btnResetView.addEventListener('click', () => arrayRenderer.centerView());
  }

  // 4. Mode Switcher (Array, Stack, Queue)
  const modeBtns = document.querySelectorAll('.mode-btn');
  function setPlaygroundMode(mode) {
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    arrayRenderer.setMode(mode);
  }
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setPlaygroundMode(btn.dataset.mode));
  });

  // 5. Algorithm Run Handler
  const selectAlgo = document.getElementById('select-algorithm');
  const inputDataEl = document.getElementById('input-data');
  const argValEl = document.getElementById('input-arg-val');
  const btnRun = document.getElementById('btn-run');
  const canvasAlgoTitle = document.getElementById('canvas-algo-title');
  const sizeSlider = document.getElementById('size-slider');
  const sizeLabel = document.getElementById('size-label');
  const btnRandomize = document.getElementById('btn-randomize');

  function parseInputArray() {
    const raw = inputDataEl ? inputDataEl.value.trim() : '';
    if (!raw) return [5, 2, 9, 1, 5, 6];
    const cleaned = raw.replace(/[\[\]]/g, '');
    const parts = cleaned.split(/[, ]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    return parts.length > 0 ? parts : [5, 2, 9, 1, 5, 6];
  }

  async function runSelectedAlgorithm() {
    const target = selectAlgo ? selectAlgo.value : 'bubbleSort';
    const arr = parseInputArray();
    const argVal = argValEl ? parseInt(argValEl.value, 10) || 9 : 9;

    // Update title
    if (canvasAlgoTitle && selectAlgo) {
      canvasAlgoTitle.textContent = selectAlgo.options[selectAlgo.selectedIndex].text;
    }

    if (btnRun) {
      btnRun.disabled = true;
      btnRun.textContent = 'Running...';
    }

    try {
      const trace = await Api.run('algorithm', target, arr, {
        targetValue: argVal,
        k: argVal
      });
      player.loadTrace(trace);
      arrayRenderer.centerView();
    } catch (err) {
      alert('Error running algorithm: ' + err.message);
    } finally {
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = 'Run';
      }
    }
  }

  if (btnRun) btnRun.addEventListener('click', runSelectedAlgorithm);
  if (selectAlgo) {
    selectAlgo.addEventListener('change', () => {
      // If stack or queue selected, auto-switch mode
      if (selectAlgo.value === 'stack') setPlaygroundMode('stack');
      else if (selectAlgo.value === 'queue') setPlaygroundMode('queue');
      runSelectedAlgorithm();
    });
  }

  // Randomizer
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

  // 6. Interactive Insert & Delete Operations
  const insertValEl = document.getElementById('insert-val');
  const insertIdxEl = document.getElementById('insert-idx');
  const btnDoInsert = document.getElementById('btn-do-insert');
  if (btnDoInsert) {
    btnDoInsert.addEventListener('click', () => {
      const val = parseInt(insertValEl.value, 10) || 0;
      const idx = parseInt(insertIdxEl.value, 10) || 0;
      arrayRenderer.insertAt(idx, val);
      if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
    });
  }

  const deleteIdxEl = document.getElementById('delete-idx');
  const btnDoDelete = document.getElementById('btn-do-delete');
  if (btnDoDelete) {
    btnDoDelete.addEventListener('click', () => {
      const idx = parseInt(deleteIdxEl.value, 10) || 0;
      arrayRenderer.deleteAt(idx);
      if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
    });
  }

  // 7. Custom Draggable Pointers Management
  const newPtrNameEl = document.getElementById('new-ptr-name');
  const newPtrIdxEl = document.getElementById('new-ptr-idx');
  const btnAddPointer = document.getElementById('btn-add-pointer');
  const userPtrsList = document.getElementById('user-pointers-list');

  function renderUserPointersList() {
    if (!userPtrsList) return;
    userPtrsList.innerHTML = '';
    arrayRenderer.userPointers.forEach(p => {
      const pill = document.createElement('span');
      pill.className = 'pointer-pill';
      pill.innerHTML = `
        <span>${p.name} → [${p.target}]</span>
        <button class="btn-del-pointer" title="Delete pointer">×</button>
      `;
      pill.querySelector('.btn-del-pointer').addEventListener('click', () => {
        arrayRenderer.removeUserPointer(p.id);
        renderUserPointersList();
      });
      userPtrsList.appendChild(pill);
    });
  }

  if (btnAddPointer) {
    btnAddPointer.addEventListener('click', () => {
      const name = newPtrNameEl ? newPtrNameEl.value.trim() : 'p';
      const target = newPtrIdxEl ? parseInt(newPtrIdxEl.value, 10) || 0 : 0;
      if (name) {
        arrayRenderer.addUserPointer(name, target);
        renderUserPointersList();
      }
    });
  }
  renderUserPointersList();

  // 8. Save & Load Playground State to LocalStorage
  const btnSaveState = document.getElementById('btn-save-state');
  const btnLoadState = document.getElementById('btn-load-state');

  if (btnSaveState) {
    btnSaveState.addEventListener('click', () => {
      const state = {
        values: arrayRenderer.values,
        mode: arrayRenderer.mode,
        userPointers: arrayRenderer.userPointers,
        algorithm: selectAlgo ? selectAlgo.value : 'bubbleSort'
      };
      localStorage.setItem('jviz_playground_state', JSON.stringify(state));
      alert('Playground state saved successfully to localStorage!');
    });
  }

  if (btnLoadState) {
    btnLoadState.addEventListener('click', () => {
      const saved = localStorage.getItem('jviz_playground_state');
      if (!saved) {
        alert('No saved state found in localStorage.');
        return;
      }
      try {
        const state = JSON.parse(saved);
        if (state.values) {
          arrayRenderer.setValues(state.values);
          if (inputDataEl) inputDataEl.value = state.values.join(', ');
        }
        if (state.mode) setPlaygroundMode(state.mode);
        if (state.userPointers) {
          arrayRenderer.userPointers = state.userPointers;
          renderUserPointersList();
        }
        if (state.algorithm && selectAlgo) selectAlgo.value = state.algorithm;
        alert('Playground state restored!');
      } catch (e) {
        alert('Failed to parse saved state: ' + e.message);
      }
    });
  }

  // 9. Mini Command Console
  const consoleInput = document.getElementById('console-input');
  if (consoleInput) {
    consoleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = consoleInput.value.trim();
        consoleInput.value = '';
        executeConsoleCommand(raw);
      }
    });
  }

  function executeConsoleCommand(raw) {
    if (!raw) return;
    const tokens = raw.split(/\s+/);
    const action = tokens[0].toLowerCase();

    if (action === 'push') {
      const val = parseInt(tokens[1], 10) || Math.floor(Math.random() * 50);
      if (arrayRenderer.mode !== 'stack') setPlaygroundMode('stack');
      arrayRenderer.values.push(val);
      arrayRenderer.draw();
      if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
    } else if (action === 'pop') {
      if (arrayRenderer.mode !== 'stack') setPlaygroundMode('stack');
      if (arrayRenderer.values.length > 0) {
        arrayRenderer.values.pop();
        arrayRenderer.draw();
        if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
      }
    } else if (action === 'enqueue') {
      const val = parseInt(tokens[1], 10) || Math.floor(Math.random() * 50);
      if (arrayRenderer.mode !== 'queue') setPlaygroundMode('queue');
      arrayRenderer.values.push(val);
      arrayRenderer.draw();
      if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
    } else if (action === 'dequeue') {
      if (arrayRenderer.mode !== 'queue') setPlaygroundMode('queue');
      if (arrayRenderer.values.length > 0) {
        arrayRenderer.values.shift();
        arrayRenderer.draw();
        if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
      }
    } else if (action === 'insert') {
      const idx = parseInt(tokens[1], 10) || 0;
      const val = parseInt(tokens[2], 10) || 42;
      arrayRenderer.insertAt(idx, val);
      if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
    } else if (action === 'delete') {
      const idx = parseInt(tokens[1], 10) || 0;
      arrayRenderer.deleteAt(idx);
      if (inputDataEl) inputDataEl.value = arrayRenderer.values.join(', ');
    } else if (action === 'run') {
      if (tokens[1] && selectAlgo) {
        selectAlgo.value = tokens[1];
      }
      runSelectedAlgorithm();
    } else if (action === 'play') {
      player.play();
    } else if (action === 'pause') {
      player.pause();
    } else if (action === 'reset') {
      player.reset();
    } else if (action === 'random') {
      if (btnRandomize) btnRandomize.click();
    } else {
      alert(`Unknown command '${action}'. Available: push <val>, pop, enqueue <val>, dequeue, insert <idx> <val>, delete <idx>, run <algo>, random, play, pause, reset`);
    }
  }

  // 10. Initial Run on Load
  runSelectedAlgorithm();
});
