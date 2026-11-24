package core;

import java.util.*;

/**
 * Fluent builder for creating structured execution traces.
 */
public class TraceBuilder {
    private final Trace trace = new Trace();
    private int stepCounter = 0;

    public TraceBuilder(String category, String target, String title, String structureType, String timeComplexity, String spaceComplexity) {
        trace.meta.put("category", category);
        trace.meta.put("target", target);
        trace.meta.put("title", title);
        trace.meta.put("structureType", structureType);
        trace.meta.put("timeComplexity", timeComplexity);
        trace.meta.put("spaceComplexity", spaceComplexity);
    }

    public void setSourceCode(String[] lines) {
        trace.sourceCode = Arrays.asList(lines);
    }

    public void setInitialState(String type, Object data) {
        trace.initialState.put("type", type);
        trace.initialState.put("data", data);
    }

    public TraceStep addStep(int line, String message, Map<String, Object> snapshot) {
        TraceStep step = new TraceStep(stepCounter++, line, message, snapshot);
        trace.steps.add(step);
        return step;
    }

    public void setSummary(String key, Object value) {
        trace.summary.put(key, value);
    }

    public Trace build() {
        trace.meta.put("totalSteps", trace.steps.size());
        return trace;
    }
}
