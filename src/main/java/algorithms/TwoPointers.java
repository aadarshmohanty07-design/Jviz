package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Two Pointers algorithm implementation (Target Pair Sum in Sorted Array).
 * Uses converging left and right pointers to find a pair adding up to target in O(n) time.
 */
public class TwoPointers {

    public static final String[] SOURCE_CODE = new String[] {
        "public boolean twoSumSorted(int[] a, int target) {", // Line 1
        "    int left = 0, right = a.length - 1;",             // Line 2
        "    while (left < right) {",                          // Line 3
        "        int sum = a[left] + a[right];",               // Line 4
        "        if (sum == target)",                          // Line 5
        "            return true; // Pair found",              // Line 6
        "        if (sum < target)",                           // Line 7
        "            left++; // Need larger sum",              // Line 8
        "        else",                                        // Line 9
        "            right--; // Need smaller sum",            // Line 10
        "    }",                                               // Line 11
        "    return false; // No pair found",                  // Line 12
        "}"                                                    // Line 13
    };

    public static Trace run(int[] input, int target) {
        if (input == null || input.length == 0) input = new int[]{1, 3, 5, 8, 12, 17, 24};
        int[] a = input.clone();
        Arrays.sort(a);
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "twoPointers", "Two Pointers (Target Sum)", "array", "O(n)", "O(1)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        int left = 0;
        int right = n - 1;
        ptrs.put("left", left);
        ptrs.put("right", right);

        TraceStep s0 = tb.addStep(2, "Array sorted. Left pointer at 0, Right pointer at " + right + " (Target = " + target + ")", makeSnapshot(a, ptrs, highlights));
        s0.events.add(TraceEvent.pointer("set", "left", left, "#047857"));
        s0.events.add(TraceEvent.pointer("set", "right", right, "#0284c7"));

        boolean found = false;
        int comparisons = 0;

        while (left < right) {
            comparisons++;
            ptrs.put("left", left);
            ptrs.put("right", right);
            highlights.put(String.valueOf(left), "active");
            highlights.put(String.valueOf(right), "active");

            int sum = a[left] + a[right];
            TraceStep sSum = tb.addStep(4, "Evaluating sum = a[" + left + "] (" + a[left] + ") + a[" + right + "] (" + a[right] + ") = " + sum, makeSnapshot(a, ptrs, highlights));

            if (sum == target) {
                found = true;
                highlights.put(String.valueOf(left), "sorted");
                highlights.put(String.valueOf(right), "sorted");
                TraceStep sFound = tb.addStep(6, "Target sum " + target + " matched! Pair is (" + a[left] + ", " + a[right] + ") at indices [" + left + ", " + right + "]", makeSnapshot(a, ptrs, highlights));
                sFound.events.add(TraceEvent.highlight(new int[]{left, right}, "sorted"));
                break;
            } else if (sum < target) {
                highlights.remove(String.valueOf(left));
                highlights.remove(String.valueOf(right));
                highlights.put(String.valueOf(left), "discarded");
                TraceStep sIncr = tb.addStep(8, "Sum " + sum + " < target " + target + ". Incrementing left pointer to seek larger values.", makeSnapshot(a, ptrs, highlights));
                left++;
            } else {
                highlights.remove(String.valueOf(left));
                highlights.remove(String.valueOf(right));
                highlights.put(String.valueOf(right), "discarded");
                TraceStep sDecr = tb.addStep(10, "Sum " + sum + " > target " + target + ". Decrementing right pointer to seek smaller values.", makeSnapshot(a, ptrs, highlights));
                right--;
            }
        }

        if (!found) {
            tb.addStep(12, "Pointers crossed without finding any pair summing to " + target + ".", makeSnapshot(a, ptrs, highlights));
        }

        tb.setSummary("comparisons", comparisons);
        tb.setSummary("found", found);
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
}
