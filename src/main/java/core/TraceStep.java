package core;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * A discrete step in the trace timeline.
 * Carries source code line mapping, human-readable narration, micro-events for forward tweening,
 * and a full state snapshot for O(1) instant scrubbing and backward stepping.
 */
public class TraceStep {
    public int stepIndex;
    public int line;
    public String message;
    public List<TraceEvent> events = new ArrayList<>();
    public Map<String, Object> stateSnapshot;

    public TraceStep(int stepIndex, int line, String message, Map<String, Object> snapshot) {
        this.stepIndex = stepIndex;
        this.line = line;
        this.message = message;
        this.stateSnapshot = snapshot;
    }
}
