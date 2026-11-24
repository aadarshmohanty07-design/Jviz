# JVIZ - Interactive DSA Concept Visualizer

> A high-performance, interactive educational web application for teaching Data Structures & Algorithms, powered by a native Java execution engine and a responsive HTML5 Canvas timeline player.

🌐 **Live Published Demo**: [https://aadarshmohanty07-design.github.io/Jviz/](https://aadarshmohanty07-design.github.io/Jviz/)

---

## Visual Design Palette
- **Background**: Smooth White (`#ffffff`, `#fbfdfc`)
- **Text & Accents**: High-contrast Emerald Green (`#064e3b`, `#059669`)
- **Diagrams**: Crisp Black outlines and structural borders (`#000000`, 2px stroke)

---

## Core Modes

1. **🗺️ Roadmap Mindmap**:
   - Interactive SVG concept mindmap connecting topics (Arrays, Searching, Sorting, Stacks & Queues, Trees, Graphs).
   - Prerequisite relationship edges.
   - Clickable nodes with status inspector, progress checkmarks persisted in `localStorage`.
   - Direct deep-links to **"Read Concept"** and **"Open in Playground"**.

2. **📖 Concept Explorer Pages**:
   - Structured deep-dive articles with 8 standard sections: Title + Intuition, "Why this exists" & analogy, Core idea, Interactive schema blueprint, Asymptotic complexity matrix, Common pitfalls & bugs, "Open in Playground", and Prev/Next sequential navigation.

3. **🎮 Interactive Playground**:
   - Canvas sandbox with Pan, Zoom, and Box Selection.
   - **Interactive Array Modifications**:
     - Insert at any index with neighbor slide-apart animation and visible index renumbering.
     - Delete at any index with slide-together animation.
     - Custom draggable named pointers (e.g. `i`, `j`, `head`, `ptr`) that stay attached on insertions/shifts and can be deleted.
   - **LIFO / FIFO Demo Mode Toggle**:
     - `Array Mode`: Standard 1D horizontal indexed row.
     - `Stack (LIFO) Mode`: Vertical bucket growing upward with animated push/pop and **TOP** indicator.
     - `Queue (FIFO) Mode`: Horizontal tube with animated enqueue/dequeue and **FRONT / REAR** indicators.
   - **State Persistence**: Save & Load playground state to `localStorage`.
   - **Mini Command Console**: Supports `push <val>`, `pop`, `enqueue <val>`, `dequeue`, `insert <idx> <val>`, `delete <idx>`, `run <algo>`, `random <size>`, `reset`, `play`, `pause`.

---

## Implemented Algorithms (11 Available)

| # | Algorithm / Structure | Category | Time (Avg) | Space | Description |
|---|---|---|---|---|---|
| 1 | **Bubble Sort** | Sorting | $O(n^2)$ | $O(1)$ | Pairwise adjacent comparison & swap |
| 2 | **Selection Sort** | Sorting | $O(n^2)$ | $O(1)$ | Scan unsorted suffix for minimum element |
| 3 | **Insertion Sort** | Sorting | $O(n^2)$ | $O(1)$ | Shift elements to insert key into sorted prefix |
| 4 | **Merge Sort** | Sorting | $O(n \log n)$ | $O(n)$ | Divide-and-conquer recursive split & merge |
| 5 | **Quick Sort** | Sorting | $O(n \log n)$ | $O(\log n)$ | In-place partition around chosen pivot |
| 6 | **Linear Search** | Searching | $O(n)$ | $O(1)$ | Sequential scan checking target equality |
| 7 | **Binary Search** | Searching | $O(\log n)$ | $O(1)$ | Halving search interval on sorted dataset |
| 8 | **Two Pointers** | Paradigms | $O(n)$ | $O(1)$ | Converging left/right pointers for target pair sum |
| 9 | **Sliding Window** | Paradigms | $O(n)$ | $O(1)$ | Fixed-window maximal sum subarray of size $k$ |
| 10 | **Stack (LIFO)** | Structure | $O(1)$ | $O(n)$ | Push / Pop simulation with top pointer tracking |
| 11 | **Queue (FIFO)** | Structure | $O(1)$ | $O(n)$ | Enqueue / Dequeue simulation with front/rear tracking |

---

## Quick Start (< 5 commands)

### Prerequisites
- JDK 17 or higher (tested on OpenJDK 21)
- No Node.js, no npm, no build frameworks required.

### Windows:
```cmd
run.bat
```
*(Automatically detects javac/java, compiles to `out/`, and starts the server on port 8080)*

Or manual compilation:
```cmd
javac -cp "lib/*;src/main/java" -d out src/main/java/Main.java src/main/java/core/*.java src/main/java/algorithms/*.java src/main/java/api/*.java
java -cp "lib/*;out" Main
```

### Linux / macOS:
```bash
chmod +x run.sh
./run.sh
```

Open your browser at **http://localhost:8080/**

---

## Keyboard Shortcuts
- `Space`: Play / Pause playback
- `←` (Left Arrow): Step backward ($O(1)$ state snapshot restore)
- `→` (Right Arrow): Step forward
- `R`: Reset timeline to step 0
