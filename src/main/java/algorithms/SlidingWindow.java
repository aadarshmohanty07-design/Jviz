package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Sliding Window algorithm implementation (Maximum Sum Subarray of size K).
 * Reuses overlapping window calculations in O(n) instead of recomputing from scratch.
 */
public class SlidingWindow {

    public static final String[] SOURCE_CODE = new String[] {
        "public int maxSumSubarray(int[] a, int k) {",         // Line 1
        "    int n = a.length, windowSum = 0;",                // Line 2
        "    for (int i = 0; i < k; i++) windowSum += a[i];",  // Line 3
        "    int maxSum = windowSum;",                         // Line 4
        "    for (int i = k; i < n; i++) {",                   // Line 5
        "        windowSum += a[i] - a[i - k];",               // Line 6
        "        maxSum = Math.max(maxSum, windowSum);",       // Line 7
        "    }",                                               // Line 8
        "    return maxSum;",                                  // Line 9
        "}"                                                    // Line 10
    };

    public static Trace run(int[] input, int k) {
        if (input == null || input.length == 0) input = new int[]{2, 1, 5, 1, 3, 2};
        if (k <= 0 || k > input.length) k = Math.min(3, input.length);
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "slidingWindow", "Sliding Window (Size " + k + ")", "array", "O(n)", "O(1)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        // Compute initial window
        int windowSum = 0;
        for (int i = 0; i < k; i++) {
            windowSum += a[i];
            highlights.put(String.valueOf(i), "active");
        }
        int maxSum = windowSum;
        int maxStartIdx = 0;

        ptrs.put("left", 0);
        ptrs.put("right", k - 1);

        TraceStep sInit = tb.addStep(3, "Initial window [0.." + (k - 1) + "] sum = " + windowSum, makeSnapshot(a, ptrs, highlights));
        sInit.events.add(TraceEvent.pointer("set", "left", 0, "#047857"));
        sInit.events.add(TraceEvent.pointer("set", "right", k - 1, "#0284c7"));

        for (int i = k; i < n; i++) {
            int leftIdx = i - k;
            highlights.remove(String.valueOf(leftIdx));
            highlights.put(String.valueOf(i), "active");

            int oldVal = a[leftIdx];
            int newVal = a[i];
            windowSum += newVal - oldVal;

            ptrs.put("left", i - k + 1);
            ptrs.put("right", i);

            boolean isNewMax = windowSum > maxSum;
            if (isNewMax) {
                maxSum = windowSum;
                maxStartIdx = i - k + 1;
            }

            TraceStep sSlide = tb.addStep(6, "Slid window to [" + (i - k + 1) + ".." + i + "]: subtract " + oldVal + ", add " + newVal + " => sum = " + windowSum + (isNewMax ? " (NEW MAX!)" : ""), makeSnapshot(a, ptrs, highlights));
            sSlide.events.add(TraceEvent.pointer("set", "left", i - k + 1, "#047857"));
            sSlide.events.add(TraceEvent.pointer("set", "right", i, "#0284c7"));
        }

        highlights.clear();
        for (int p = maxStartIdx; p < maxStartIdx + k; p++) highlights.put(String.valueOf(p), "sorted");
        ptrs.put("maxStart", maxStartIdx);
        ptrs.put("maxEnd", maxStartIdx + k - 1);

        TraceStep sEnd = tb.addStep(9, "Sliding Window complete! Max sum of size " + k + " is " + maxSum + " spanning [" + maxStartIdx + ".." + (maxStartIdx + k - 1) + "].", makeSnapshot(a, ptrs, highlights));
        sEnd.events.add(TraceEvent.highlight(range(maxStartIdx, maxStartIdx + k - 1), "sorted"));

        tb.setSummary("maxSum", maxSum);
        tb.setSummary("k", k);
        tb.setSummary("completed", true);

        return tb.build();
    }

    private static Map<String, Object> makeSnapshot(int[] a, Map<String, Object> ptrs, Map<String, String> highlights) {
        Map<String, Object> map = new HashMap<>();
        map.put("values", toList(a));
        map.put("pointers", new HashMap<>(ptrs));
        map.put("highlights", new HashMap<>(highlights));
        return map;
    }

    private static List<Integer> toList(int[] a) {
        List<Integer> list = new ArrayList<>(a.length);
        for (int v : a) list.add(v);
        return list;
    }

    private static int[] range(int s, int e) {
        if (e < s) return new int[0];
        int[] r = new int[e - s + 1];
        for (int i = 0; i < r.length; i++) r[i] = s + i;
        return r;
    }
}
