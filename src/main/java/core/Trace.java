package core;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The top-level response envelope returned by the Java execution engine.
 */
public class Trace {
    public String status = "success";
    public Map<String, Object> meta = new HashMap<>();
    public List<String> sourceCode = new ArrayList<>();
    public Map<String, Object> initialState = new HashMap<>();
    public List<TraceStep> steps = new ArrayList<>();
    public Map<String, Object> summary = new HashMap<>();
}
