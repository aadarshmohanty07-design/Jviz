# JVIZ - Interactive DSA Concept Visualizer

> A high-performance, interactive educational web application for teaching Data Structures & Algorithms, powered by a native Java execution engine and a responsive HTML5 Canvas timeline player.

🌐 **Live Published Demo**: [https://aadarshmohanty07-design.github.io/Jviz/](https://aadarshmohanty07-design.github.io/Jviz/)

---

## Visual Design Palette
- **Background**: Smooth White (`#ffffff`, `#fbfdfc`)
- **Text & Accents**: High-contrast Emerald Green (`#064e3b`, `#059669`)
- **Diagrams**: Crisp Black outlines and structural borders (`#000000`, 2px stroke)

---

## Architecture

JVIZ follows an **Event-Trace Architecture**. Algorithms and data structure operations do not manipulate UI elements directly. Instead, the Java engine executes the operations and emits an ordered sequence of deterministic **Trace Events** and **State Snapshots**. The frontend acts as a timeline player that renders micro-events forward and provides **$O(1)$ glitch-free backwards stepping** and timeline scrubbing.

```
+-------------------------------------------------------------------------+
|                        Browser Frontend (Vanilla JS)                     |
|  - HTML5 Canvas Renderer (Pan, Zoom, Retina DPI, Drag, Tooltips)        |
|  - Universal Timeline Controller (Play, Pause, Step Back, Scrub, Speed) |
|  - Java Code Synchronization Panel (Active Line Highlighting)           |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ JSON Trace Protocol
                                    ▼
+-------------------------------------------------------------------------+
|                          Java Engine (JDK 17+)                          |
|  - Built-in com.sun.net.httpserver.HttpServer (Zero frameworks)         |
|  - Vendored Gson 2.10.1 (lib/gson-2.10.1.jar)                           |
|  - Event-Trace Protocol Engine (core.Trace, core.TraceStep)             |
|  - Educational DSA Implementations (algorithms/, structures/)           |
+-------------------------------------------------------------------------+
```

---

## Quick Start (< 5 commands)

### Prerequisites
- JDK 17 or higher (tested on OpenJDK 21)
- No build tools, No Node.js, No npm required.

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
Or manual compilation:
```bash
javac -cp "lib/*:src/main/java" -d out src/main/java/Main.java src/main/java/core/*.java src/main/java/algorithms/*.java src/main/java/api/*.java
java -cp "lib/*:out" Main
```

Open your browser at **http://localhost:8080/**

---

## Interactive Controls & Keyboard Shortcuts

| Shortcut / Control | Action | Description |
| :--- | :--- | :--- |
| `Space` | Play / Pause | Toggle animation playback |
| `←` (Left Arrow) | Step Backward | Restores previous step snapshot in $O(1)$ |
| `→` (Right Arrow) | Step Forward | Advances to next step and synchronizes code line |
| `R` | Reset | Rewinds to step 0 |
| `Scrubber Bar` | Timeline Scrub | Scrub to any arbitrary step with instant preview |
| `Speed Selector` | Playback Speed | 0.25×, 0.5×, 1.0×, 2.0×, 4.0× |
| `Mouse Drag` | Canvas Pan | Drag canvas workspace |
| `Scroll Wheel` | Canvas Zoom | Smooth zoom in / zoom out |
| `⛶ Button` | Center View | Re-centers diagram at 1.0× scale |

---

## Project Structure

```
/
├── .github/workflows/deploy.yml   (Automated GitHub Pages deployment)
├── README.md                      (Build & run instructions, architecture)
├── NOTES.md                       (Implementation assumptions & protocol details)
├── run.bat                        (One-click Windows runner)
├── run.sh                         (One-click Unix runner)
├── lib/
│   └── gson-2.10.1.jar            (Vendored JSON library)
├── src/main/java/
│   ├── Main.java                  (Built-in HTTP server & static file routing)
│   ├── api/
│   │   └── ApiHandler.java        (CORS-enabled /api/run endpoint)
│   ├── core/
│   │   ├── Trace.java             (Response envelope)
│   │   ├── TraceStep.java         (Discrete step with snapshot)
│   │   ├── TraceEvent.java        (Micro-event definition)
│   │   └── TraceBuilder.java      (Fluent trace builder API)
│   └── algorithms/
│       └── BubbleSort.java        (Trace-emitting Bubble Sort)
└── src/main/resources/web/
    ├── index.html                 (Main application shell)
    ├── css/
    │   ├── theme.css              (Smooth white, emerald text, black diagrams)
    │   ├── layout.css             (Header, view switching, responsive layout)
    │   └── playground.css         (Canvas toolbar, player bar, code sync)
    └── js/
        ├── api.js                 (API client with static web fallback)
        ├── player.js              (Timeline controller & line sync)
        ├── app.js                 (App orchestrator & command handler)
        └── renderers/
            └── array.js           (Retina canvas array renderer)
```

---

## Development Roadmap
- [x] **Phase 1 — Skeleton & Protocol**: Java HTTP server, Trace schema, Bubble Sort slice, Canvas array player, code line synchronization, and smooth white / emerald / black theme.
- [ ] **Phase 2 — Array + Stack/Queue Playground**: Interactivity, pointer dot dragging, LIFO/FIFO mode toggle.
- [ ] **Phase 3 — Remaining Structures**: Linked List, BST, Heap, Hash Table, Graph, Trie.
- [ ] **Phase 4 — 15 Algorithms**: Full algorithm suite wired to trace engine.
- [ ] **Phase 5 — Roadmap & Concept Pages**: Concept mindmap & interactive educational pages.
- [ ] **Phase 6 — Polish**: Polish, persistence, accessibility.
