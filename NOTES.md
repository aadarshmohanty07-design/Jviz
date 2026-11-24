# JVIZ - Implementation Notes & Design Assumptions

## Architecture & Technology Decisions

1. **Lightweight Built-in Server**:
   - Built on `com.sun.net.httpserver.HttpServer` with zero external web framework dependencies (no Spring, no Tomcat).
   - Serves static assets directly from `src/main/resources/web/` during development and tests, with fallback to classloader resources when packaged.

2. **JSON Serialization**:
   - Vendored single-jar Google Gson (`lib/gson-2.10.1.jar`).
   - Justification: Provides guaranteed spec-compliant JSON parsing for nested trace step trees and snapshots without introducing fragile regex parsing or custom object serialization bugs.

3. **Color Palette Compliance**:
   - **Background**: Smooth whites (`#ffffff`, `#fbfdfc`, `#f4f8f5`) with subtle dot-matrix background grid.
   - **Text**: Emerald green hierarchy (`#064e3b` for high-contrast primary text, `#065f46` for secondary, `#059669` for accents).
   - **Diagrams**: Crisp black strokes and boundaries (`#000000`, 2px linewidth), maintaining clear structural definition.

4. **Event-Trace & Snapshot Protocol**:
   - Each trace step carries both granular forward events (`events[]`) and a full structural snapshot (`stateSnapshot`).
   - Forward playback smoothly reflects operations (`compare`, `swap`, `pointer`, `highlight`).
   - Backward stepping and timeline scrubbing apply the step's snapshot in $O(1)$ time, guaranteeing 100% bug-free bidirectional exploration with zero state drift.

5. **Phase 1 Vertical Slice**:
   - Full end-to-end slice delivered: Java HTTP Server + API handler + Trace builder + Bubble Sort engine + HTML5 Canvas Array renderer + Timeline player with play/pause/step-forward/step-backward/scrub/speed + Live source code panel with line sync.
