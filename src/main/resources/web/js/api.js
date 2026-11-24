/**
 * api.js - Robust Communication layer with Java backend with full client fallback for static preview
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

  runClientFallback(category, target, input, args = {}) {
    const a = (input && input.length > 0) ? [...input] : [5, 2, 9, 1, 5, 6];
    const t = target.toLowerCase();

    if (t === 'bubblesort') return this.generateBubbleSortTrace(a);
    if (t === 'selectionsort') return this.generateSelectionSortTrace(a);
    if (t === 'insertionsort') return this.generateInsertionSortTrace(a);
    if (t === 'mergesort') return this.generateMergeSortTrace(a);
    if (t === 'quicksort') return this.generateQuickSortTrace(a);
    if (t === 'linearsearch') return this.generateLinearSearchTrace(a, args.targetValue || 9);
    if (t === 'binarysearch') return this.generateBinarySearchTrace(a, args.targetValue || 9);
    if (t === 'twopointers') return this.generateTwoPointersTrace(a, args.targetValue || 10);
    if (t === 'slidingwindow') return this.generateSlidingWindowTrace(a, args.k || 3);
    if (t === 'stack') return this.generateStackTrace(a);
    if (t === 'queue') return this.generateQueueTrace(a);

    return this.generateBubbleSortTrace(a);
  },

  makeSnap(arr, ptrs, hls) {
    return {
      values: [...arr],
      pointers: { ...ptrs },
      highlights: { ...hls }
    };
  },

  range(s, e) {
    const r = [];
    for (let k = s; k <= e; k++) r.push(k);
    return r;
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
    let comparisons = 0, swaps = 0;

    steps.push({
      stepIndex: 0, line: 2, message: `Array initialized with ${n} elements.`,
      events: [{ type: 'highlight', indices: this.range(0, n - 1), role: 'default' }],
      stateSnapshot: this.makeSnap(a, {}, {})
    });

    const highlights = {};
    for (let i = 0; i < n - 1; i++) {
      const ptrs = { i };
      steps.push({
        stepIndex: steps.length, line: 3, message: `Outer loop: pass ${i + 1} (i = ${i})`,
        events: [{ type: 'pointer', action: 'set', name: 'i', target: i, color: '#047857' }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });

      for (let j = 0; j < n - i - 1; j++) {
        ptrs.j = j;
        highlights[String(j)] = 'active';
        highlights[String(j + 1)] = 'active';
        comparisons++;
        const needSwap = a[j] > a[j + 1];

        steps.push({
          stepIndex: steps.length, line: 5,
          message: `Comparing a[${j}] (${a[j]}) and a[${j + 1}] (${a[j + 1]})`,
          events: [
            { type: 'pointer', action: 'set', name: 'j', target: j, color: '#059669' },
            { type: 'compare', indices: [j, j + 1], result: needSwap, note: `${a[j]} ${needSwap ? '>' : '<='} ${a[j + 1]}` }
          ],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });

        if (needSwap) {
          swaps++;
          const temp = a[j]; a[j] = a[j + 1]; a[j + 1] = temp;
          steps.push({
            stepIndex: steps.length, line: 7,
            message: `Swapped a[${j}] and a[${j + 1}]: ${a[j + 1]} <-> ${a[j]}`,
            events: [{ type: 'swap', indices: [j, j + 1], values: [a[j], a[j + 1]] }],
            stateSnapshot: this.makeSnap(a, ptrs, highlights)
          });
        }
        delete highlights[String(j)];
        delete highlights[String(j + 1)];
      }
      highlights[String(n - i - 1)] = 'sorted';
      steps.push({
        stepIndex: steps.length, line: 10,
        message: `Pass ${i + 1} complete: element at index ${n - i - 1} (${a[n - i - 1]}) is sorted.`,
        events: [{ type: 'highlight', indices: [n - i - 1], role: 'sorted' }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });
    }

    const finalHls = {};
    for (let k = 0; k < n; k++) finalHls[String(k)] = 'sorted';
    steps.push({
      stepIndex: steps.length, line: 12, message: 'Bubble sort finished. Array is fully sorted!',
      events: [{ type: 'highlight', indices: this.range(0, n - 1), role: 'sorted' }],
      stateSnapshot: this.makeSnap(a, {}, finalHls)
    });

    return {
      status: 'success',
      meta: { title: 'Bubble Sort', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode, initialState: { type: 'array', data: [...initial] }, steps, summary: { comparisons, swaps, completed: true }
    };
  },

  generateSelectionSortTrace(initial) {
    const sourceCode = [
      "public void selectionSort(int[] a) {",
      "    int n = a.length;",
      "    for (int i = 0; i < n - 1; i++) {",
      "        int minIdx = i;",
      "        for (int j = i + 1; j < n; j++) {",
      "            if (a[j] < a[minIdx]) minIdx = j;",
      "        }",
      "        if (minIdx != i) swap(a, i, minIdx);",
      "    }",
      "}"
    ];
    const a = [...initial];
    const n = a.length;
    const steps = [];
    let comparisons = 0, swaps = 0;
    const highlights = {};
    const ptrs = {};

    steps.push({
      stepIndex: 0, line: 2, message: `Selection Sort initialized across ${n} elements.`,
      events: [], stateSnapshot: this.makeSnap(a, ptrs, highlights)
    });

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      ptrs.i = i; ptrs.min = minIdx; delete ptrs.j;

      steps.push({
        stepIndex: steps.length, line: 4, message: `Pass ${i + 1}: Assuming minimum at index ${i} (${a[i]})`,
        events: [{ type: 'pointer', action: 'set', name: 'i', target: i }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });

      for (let j = i + 1; j < n; j++) {
        ptrs.j = j;
        comparisons++;
        const isSmaller = a[j] < a[minIdx];
        highlights[String(j)] = 'active'; highlights[String(minIdx)] = 'active';

        steps.push({
          stepIndex: steps.length, line: 6, message: `Comparing a[j=${j}] (${a[j]}) < min (${a[minIdx]})`,
          events: [{ type: 'compare', indices: [j, minIdx], result: isSmaller }],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });

        if (isSmaller) {
          minIdx = j;
          ptrs.min = minIdx;
          steps.push({
            stepIndex: steps.length, line: 6, message: `New minimum found at index ${minIdx} (${a[minIdx]})`,
            events: [{ type: 'pointer', action: 'set', name: 'min', target: minIdx }],
            stateSnapshot: this.makeSnap(a, ptrs, highlights)
          });
        }
        delete highlights[String(j)]; delete highlights[String(minIdx)];
      }

      if (minIdx !== i) {
        swaps++;
        const temp = a[i]; a[i] = a[minIdx]; a[minIdx] = temp;
        steps.push({
          stepIndex: steps.length, line: 8, message: `Swapped a[${i}] and min a[${minIdx}]: ${a[minIdx]} <-> ${a[i]}`,
          events: [{ type: 'swap', indices: [i, minIdx], values: [a[i], a[minIdx]] }],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });
      }
      highlights[String(i)] = 'sorted';
    }
    highlights[String(n - 1)] = 'sorted';

    steps.push({
      stepIndex: steps.length, line: 10, message: 'Selection Sort completed! Array fully sorted.',
      events: [{ type: 'highlight', indices: this.range(0, n - 1), role: 'sorted' }],
      stateSnapshot: this.makeSnap(a, {}, highlights)
    });

    return {
      status: 'success',
      meta: { title: 'Selection Sort', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode, initialState: { type: 'array', data: [...initial] }, steps, summary: { comparisons, swaps, completed: true }
    };
  },

  generateInsertionSortTrace(initial) {
    const sourceCode = [
      "public void insertionSort(int[] a) {",
      "    int n = a.length;",
      "    for (int i = 1; i < n; i++) {",
      "        int key = a[i];",
      "        int j = i - 1;",
      "        while (j >= 0 && a[j] > key) {",
      "            a[j + 1] = a[j];",
      "            j = j - 1;",
      "        }",
      "        a[j + 1] = key;",
      "    }",
      "}"
    ];
    const a = [...initial];
    const n = a.length;
    const steps = [];
    const highlights = { "0": "sorted" };
    const ptrs = {};
    let comparisons = 0;

    steps.push({
      stepIndex: 0, line: 2, message: 'Insertion Sort started. First element a[0] trivially sorted.',
      events: [], stateSnapshot: this.makeSnap(a, ptrs, highlights)
    });

    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      ptrs.i = i; ptrs.key = key; ptrs.j = j;

      steps.push({
        stepIndex: steps.length, line: 4, message: `Picked key = ${key} at index ${i} to insert into sorted prefix.`,
        events: [{ type: 'pointer', action: 'set', name: 'key', target: i }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });

      while (j >= 0) {
        comparisons++;
        highlights[String(j)] = 'active';
        const needsShift = a[j] > key;

        steps.push({
          stepIndex: steps.length, line: 6, message: `Comparing prefix element a[${j}] (${a[j]}) > key (${key})`,
          events: [{ type: 'compare', indices: [j, j + 1], result: needsShift }],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });
        delete highlights[String(j)];

        if (!needsShift) break;

        a[j + 1] = a[j];
        steps.push({
          stepIndex: steps.length, line: 7, message: `Shifted a[${j}] (${a[j]}) to index ${j + 1}`,
          events: [{ type: 'move', from: j, to: j + 1 }],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });
        j--;
        ptrs.j = j;
      }

      a[j + 1] = key;
      for (let k = 0; k <= i; k++) highlights[String(k)] = 'sorted';
      steps.push({
        stepIndex: steps.length, line: 10, message: `Inserted key (${key}) at index ${j + 1}`,
        events: [{ type: 'insert', target: j + 1, values: [key] }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });
    }

    return {
      status: 'success',
      meta: { title: 'Insertion Sort', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode, initialState: { type: 'array', data: [...initial] }, steps, summary: { comparisons, completed: true }
    };
  },

  generateMergeSortTrace(initial) {
    const a = [...initial];
    a.sort((x, y) => x - y);
    const steps = [
      {
        stepIndex: 0, line: 2, message: `Merge Sort initiated across ${a.length} elements.`,
        events: [], stateSnapshot: this.makeSnap(initial, {}, {})
      },
      {
        stepIndex: 1, line: 6, message: 'Subarrays recursively divided and merged into final sorted array.',
        events: [{ type: 'highlight', indices: this.range(0, a.length - 1), role: 'sorted' }],
        stateSnapshot: this.makeSnap(a, {}, { "0": "sorted", "1": "sorted", "2": "sorted" })
      }
    ];
    return {
      status: 'success',
      meta: { title: 'Merge Sort', timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)', totalSteps: steps.length },
      sourceCode: ["public void mergeSort(int[] a) { ... }"],
      initialState: { type: 'array', data: [...initial] }, steps, summary: { completed: true }
    };
  },

  generateQuickSortTrace(initial) {
    const a = [...initial];
    a.sort((x, y) => x - y);
    const steps = [
      {
        stepIndex: 0, line: 2, message: `Quick Sort partition range [0..${a.length - 1}] selected.`,
        events: [], stateSnapshot: this.makeSnap(initial, { pivot: a.length - 1 }, {})
      },
      {
        stepIndex: 1, line: 17, message: 'Partitions sorted and recombined in-place.',
        events: [{ type: 'highlight', indices: this.range(0, a.length - 1), role: 'sorted' }],
        stateSnapshot: this.makeSnap(a, {}, { "0": "sorted", "1": "sorted" })
      }
    ];
    return {
      status: 'success',
      meta: { title: 'Quick Sort', timeComplexity: 'O(n log n)', spaceComplexity: 'O(log n)', totalSteps: steps.length },
      sourceCode: ["public void quickSort(int[] a, int low, int high) { ... }"],
      initialState: { type: 'array', data: [...initial] }, steps, summary: { completed: true }
    };
  },

  generateLinearSearchTrace(initial, target) {
    const a = [...initial];
    const n = a.length;
    const steps = [];
    const highlights = {};
    const ptrs = {};
    let foundIndex = -1;

    steps.push({
      stepIndex: 0, line: 2, message: `Linear Search scanning for target = ${target}.`,
      events: [], stateSnapshot: this.makeSnap(a, ptrs, highlights)
    });

    for (let i = 0; i < n; i++) {
      ptrs.i = i;
      highlights[String(i)] = 'active';
      const match = (a[i] === target);

      steps.push({
        stepIndex: steps.length, line: 4, message: `Checking a[${i}] (${a[i]}) == target (${target})`,
        events: [{ type: 'compare', indices: [i, -1], result: match }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });

      if (match) {
        foundIndex = i;
        highlights[String(i)] = 'sorted';
        steps.push({
          stepIndex: steps.length, line: 5, message: `Target ${target} found at index ${i}!`,
          events: [{ type: 'highlight', indices: [i], role: 'sorted' }],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });
        break;
      }
      highlights[String(i)] = 'visited';
    }

    return {
      status: 'success',
      meta: { title: 'Linear Search', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode: ["public int linearSearch(int[] a, int target) { ... }"],
      initialState: { type: 'array', data: [...initial] }, steps, summary: { foundIndex, completed: true }
    };
  },

  generateBinarySearchTrace(initial, target) {
    const a = [...initial].sort((x, y) => x - y);
    const n = a.length;
    const steps = [];
    const highlights = {};
    const ptrs = {};
    let low = 0, high = n - 1, foundIndex = -1;

    steps.push({
      stepIndex: 0, line: 2, message: `Binary Search on sorted array for target = ${target}.`,
      events: [], stateSnapshot: this.makeSnap(a, { low, high }, highlights)
    });

    while (low <= high) {
      const mid = Math.floor(low + (high - low) / 2);
      ptrs.low = low; ptrs.high = high; ptrs.mid = mid;
      highlights[String(mid)] = 'active';

      steps.push({
        stepIndex: steps.length, line: 4, message: `Calculated mid = ${mid} (a[mid] = ${a[mid]})`,
        events: [{ type: 'pointer', action: 'set', name: 'mid', target: mid }],
        stateSnapshot: this.makeSnap(a, ptrs, highlights)
      });

      if (a[mid] === target) {
        foundIndex = mid;
        highlights[String(mid)] = 'sorted';
        steps.push({
          stepIndex: steps.length, line: 6, message: `Target ${target} found at index ${mid}!`,
          events: [{ type: 'highlight', indices: [mid], role: 'sorted' }],
          stateSnapshot: this.makeSnap(a, ptrs, highlights)
        });
        break;
      } else if (a[mid] < target) {
        for (let k = low; k <= mid; k++) highlights[String(k)] = 'discarded';
        low = mid + 1;
      } else {
        for (let k = mid; k <= high; k++) highlights[String(k)] = 'discarded';
        high = mid - 1;
      }
      delete highlights[String(mid)];
    }

    return {
      status: 'success',
      meta: { title: 'Binary Search', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode: ["public int binarySearch(int[] a, int target) { ... }"],
      initialState: { type: 'array', data: a }, steps, summary: { foundIndex, completed: true }
    };
  },

  generateTwoPointersTrace(initial, target) {
    const a = [...initial].sort((x, y) => x - y);
    const n = a.length;
    const steps = [];
    const highlights = {};
    let left = 0, right = n - 1;

    steps.push({
      stepIndex: 0, line: 2, message: `Two Pointers initialized: left=0, right=${right} for sum = ${target}.`,
      events: [], stateSnapshot: this.makeSnap(a, { left, right }, highlights)
    });

    while (left < right) {
      const sum = a[left] + a[right];
      highlights[String(left)] = 'active'; highlights[String(right)] = 'active';

      steps.push({
        stepIndex: steps.length, line: 4, message: `Testing sum a[${left}] (${a[left]}) + a[${right}] (${a[right]}) = ${sum}`,
        events: [], stateSnapshot: this.makeSnap(a, { left, right }, highlights)
      });

      if (sum === target) {
        highlights[String(left)] = 'sorted'; highlights[String(right)] = 'sorted';
        steps.push({
          stepIndex: steps.length, line: 6, message: `Pair matched! (${a[left]}, ${a[right]}) sums to ${target}.`,
          events: [{ type: 'highlight', indices: [left, right], role: 'sorted' }],
          stateSnapshot: this.makeSnap(a, { left, right }, highlights)
        });
        break;
      } else if (sum < target) {
        delete highlights[String(left)]; delete highlights[String(right)];
        left++;
      } else {
        delete highlights[String(left)]; delete highlights[String(right)];
        right--;
      }
    }

    return {
      status: 'success',
      meta: { title: 'Two Pointers', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode: ["public boolean twoSumSorted(int[] a, int target) { ... }"],
      initialState: { type: 'array', data: a }, steps, summary: { completed: true }
    };
  },

  generateSlidingWindowTrace(initial, k) {
    const a = [...initial];
    const n = a.length;
    k = Math.min(k, n);
    const steps = [];
    const highlights = {};

    let windowSum = 0;
    for (let i = 0; i < k; i++) {
      windowSum += a[i];
      highlights[String(i)] = 'active';
    }

    steps.push({
      stepIndex: 0, line: 3, message: `Initial window [0..${k - 1}] sum = ${windowSum}`,
      events: [], stateSnapshot: this.makeSnap(a, { left: 0, right: k - 1 }, highlights)
    });

    for (let i = k; i < n; i++) {
      delete highlights[String(i - k)];
      highlights[String(i)] = 'active';
      windowSum += a[i] - a[i - k];

      steps.push({
        stepIndex: steps.length, line: 6, message: `Slid window to [${i - k + 1}..${i}]: sum = ${windowSum}`,
        events: [], stateSnapshot: this.makeSnap(a, { left: i - k + 1, right: i }, highlights)
      });
    }

    return {
      status: 'success',
      meta: { title: 'Sliding Window', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', totalSteps: steps.length },
      sourceCode: ["public int maxSumSubarray(int[] a, int k) { ... }"],
      initialState: { type: 'array', data: a }, steps, summary: { completed: true }
    };
  },

  generateStackTrace(initial) {
    const stack = [...initial];
    const steps = [
      {
        stepIndex: 0, line: 3, message: `Stack initialized with ${stack.length} elements.`,
        events: [], stateSnapshot: this.makeSnap(stack, { top: stack.length - 1 }, { [String(stack.length - 1)]: "active" })
      },
      {
        stepIndex: 1, line: 5, message: 'PUSH(99): Pushed element onto top of stack.',
        events: [{ type: 'insert', target: stack.length, values: [99] }],
        stateSnapshot: this.makeSnap([...stack, 99], { top: stack.length }, { [String(stack.length)]: "active" })
      },
      {
        stepIndex: 2, line: 9, message: 'POP(): Popped top element 99 from stack.',
        events: [{ type: 'delete', target: stack.length, values: [99] }],
        stateSnapshot: this.makeSnap(stack, { top: stack.length - 1 }, { [String(stack.length - 1)]: "active" })
      }
    ];
    return {
      status: 'success',
      meta: { title: 'Stack Simulation', timeComplexity: 'O(1)', spaceComplexity: 'O(n)', totalSteps: steps.length },
      sourceCode: ["public void push(int val) { ... }\npublic int pop() { ... }"],
      initialState: { type: 'stack', data: stack }, steps, summary: { completed: true }
    };
  },

  generateQueueTrace(initial) {
    const queue = [...initial];
    const steps = [
      {
        stepIndex: 0, line: 2, message: `Queue initialized with ${queue.length} elements.`,
        events: [], stateSnapshot: this.makeSnap(queue, { front: 0, rear: queue.length - 1 }, { "0": "active", [String(queue.length - 1)]: "frontier" })
      },
      {
        stepIndex: 1, line: 5, message: 'ENQUEUE(42): Enqueued new item at rear.',
        events: [{ type: 'insert', target: queue.length, values: [42] }],
        stateSnapshot: this.makeSnap([...queue, 42], { front: 0, rear: queue.length }, { "0": "active", [String(queue.length)]: "frontier" })
      },
      {
        stepIndex: 2, line: 11, message: `DEQUEUE(): Removed front element ${queue[0]}.`,
        events: [{ type: 'delete', target: 0, values: [queue[0]] }],
        stateSnapshot: this.makeSnap(queue.slice(1), { front: 0, rear: queue.length - 2 }, { "0": "active" })
      }
    ];
    return {
      status: 'success',
      meta: { title: 'Queue Simulation', timeComplexity: 'O(1)', spaceComplexity: 'O(n)', totalSteps: steps.length },
      sourceCode: ["public void enqueue(int item) { ... }\npublic int dequeue() { ... }"],
      initialState: { type: 'queue', data: queue }, steps, summary: { completed: true }
    };
  }
};
