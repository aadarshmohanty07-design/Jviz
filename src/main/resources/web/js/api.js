/**
 * api.js - Communication layer with Java backend with static GitHub Pages fallback
 */
const Api = {
  baseUrl: '',

  async run(category, target, input, args = {}) {
    // 1. Try local server endpoint
    try {
      const response = await fetch(`${this.baseUrl}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          target,
          input,
          args
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.updateEngineStatus(true);
        return data;
      }
    } catch (err) {
      // If hosted statically (e.g. GitHub Pages), also check if local Java server is running on :8080
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        try {
          const respLocal = await fetch('http://localhost:8080/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, target, input, args })
          });
          if (respLocal.ok) {
            const data = await respLocal.json();
            this.updateEngineStatus(true);
            return data;
          }
        } catch (ignored) {}
      }
    }

    // 2. Client-side fallback engine for static web deployment (e.g. GitHub Pages)
    this.updateEngineStatus(false);
    return this.runClientFallback(category, target, input, args);
  },

  updateEngineStatus(isJava) {
    const statusText = document.getElementById('engine-status-text');
    if (statusText) {
      statusText.textContent = isJava ? 'Java Engine Online' : 'Client Engine (Web Demo)';
    }
  },

  runClientFallback(category, target, input, args) {
    const a = (input && input.length > 0) ? [...input] : [5, 2, 9, 1, 5, 6];
    if (target.toLowerCase() === 'bubblesort') {
      return this.generateBubbleSortTrace(a);
    }
    throw new Error(`Target '${target}' not supported in static preview mode.`);
  },

  generateBubbleSortTrace(initial) {
    const sourceCode = [
      "public void bubbleSort(int[] a) {",
      "    int n = a.length;",
      "    for (int i = 0; i < n - 1; i++) {",
      "        for (int j = 0; j < n - i - 1; j++) {",
      "            if (a[j] > a[j + 1]) {",
      "                int temp = a[j];",
      "                a[j] = a[j + 1];",
      "                a[j + 1] = temp;",
      "            }",
      "        }",
      "    }",
      "}"
    ];

    const a = [...initial];
    const n = a.length;
    const steps = [];
    let comparisons = 0;
    let swaps = 0;

    const makeSnap = (arr, ptrs, hls) => ({
      values: [...arr],
      pointers: { ...ptrs },
      highlights: { ...hls }
    });

    const range = (start, end) => {
      const res = [];
      for (let k = start; k <= end; k++) res.push(k);
      return res;
    };

    // Step 0: init
    steps.push({
      stepIndex: 0,
      line: 2,
      message: `Array initialized with ${n} elements.`,
      events: [{ type: 'highlight', indices: range(0, n - 1), role: 'default' }],
      stateSnapshot: makeSnap(a, {}, {})
    });

    const highlights = {};
    for (let i = 0; i < n - 1; i++) {
      const ptrs = { i };
      steps.push({
        stepIndex: steps.length,
        line: 3,
        message: `Outer loop: pass ${i + 1} (i = ${i})`,
        events: [{ type: 'pointer', action: 'set', name: 'i', target: i, color: '#047857' }],
        stateSnapshot: makeSnap(a, ptrs, highlights)
      });

      for (let j = 0; j < n - i - 1; j++) {
        ptrs.j = j;
        highlights[String(j)] = 'active';
        highlights[String(j + 1)] = 'active';

        comparisons++;
        const needSwap = a[j] > a[j + 1];

        steps.push({
          stepIndex: steps.length,
          line: 5,
          message: `Comparing a[${j}] (${a[j]}) and a[${j + 1}] (${a[j + 1]})`,
          events: [
            { type: 'pointer', action: 'set', name: 'j', target: j, color: '#059669' },
            { type: 'compare', indices: [j, j + 1], result: needSwap, note: `${a[j]} ${needSwap ? '>' : '<='} ${a[j + 1]}` },
            { type: 'highlight', indices: [j, j + 1], role: 'active' }
          ],
          stateSnapshot: makeSnap(a, ptrs, highlights)
        });

        if (needSwap) {
          swaps++;
          const temp = a[j];
          a[j] = a[j + 1];
          a[j + 1] = temp;

          steps.push({
            stepIndex: steps.length,
            line: 7,
            message: `Swapped a[${j}] and a[${j + 1}]: ${a[j + 1]} <-> ${a[j]}`,
            events: [{ type: 'swap', indices: [j, j + 1], values: [a[j], a[j + 1]], note: 'Swap' }],
            stateSnapshot: makeSnap(a, ptrs, highlights)
          });
        }

        delete highlights[String(j)];
        delete highlights[String(j + 1)];
      }

      highlights[String(n - i - 1)] = 'sorted';
      steps.push({
        stepIndex: steps.length,
        line: 10,
        message: `Pass ${i + 1} complete: element at index ${n - i - 1} (${a[n - i - 1]}) is sorted.`,
        events: [{ type: 'highlight', indices: [n - i - 1], role: 'sorted' }],
        stateSnapshot: makeSnap(a, ptrs, highlights)
      });
    }

    const finalHighlights = {};
    for (let k = 0; k < n; k++) finalHighlights[String(k)] = 'sorted';
    steps.push({
      stepIndex: steps.length,
      line: 12,
      message: 'Bubble sort finished. Array is fully sorted!',
      events: [{ type: 'highlight', indices: range(0, n - 1), role: 'sorted' }],
      stateSnapshot: makeSnap(a, {}, finalHighlights)
    });

    return {
      status: 'success',
      meta: {
        category: 'algorithm',
        target: 'bubbleSort',
        title: 'Bubble Sort',
        structureType: 'array',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        totalSteps: steps.length
      },
      sourceCode: sourceCode,
      initialState: {
        type: 'array',
        data: [...initial]
      },
      steps: steps,
      summary: {
        comparisons: comparisons,
        swaps: swaps,
        completed: true
      }
    };
  }
};
