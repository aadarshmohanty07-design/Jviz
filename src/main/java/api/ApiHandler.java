package api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import core.Trace;
import algorithms.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles API calls to /api/run with support for all algorithms and data structure operations.
 */
public class ApiHandler implements HttpHandler {

    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            sendCorsHeaders(exchange);
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"POST".equalsIgnoreCase(method)) {
            sendError(exchange, 405, "Method Not Allowed. Use POST.");
            return;
        }

        try {
            InputStream is = exchange.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            JsonObject json;
            try {
                json = JsonParser.parseString(body).getAsJsonObject();
            } catch (Exception e) {
                sendError(exchange, 400, "Invalid JSON body: " + e.getMessage());
                return;
            }

            String category = json.has("category") ? json.get("category").getAsString() : "algorithm";
            String target = json.has("target") ? json.get("target").getAsString() : "bubbleSort";

            int[] arrayInput = null;
            if (json.has("input") && json.get("input").isJsonArray()) {
                var arr = json.getAsJsonArray("input");
                arrayInput = new int[arr.size()];
                for (int i = 0; i < arr.size(); i++) {
                    arrayInput[i] = arr.get(i).getAsInt();
                }
            }

            JsonObject args = json.has("args") && json.get("args").isJsonObject() ? json.getAsJsonObject("args") : new JsonObject();
            int targetValue = args.has("targetValue") ? args.get("targetValue").getAsInt() : 14;
            int k = args.has("k") ? args.get("k").getAsInt() : 3;

            Trace trace = null;

            switch (target.toLowerCase()) {
                case "bubblesort":
                    trace = BubbleSort.run(arrayInput);
                    break;
                case "selectionsort":
                    trace = SelectionSort.run(arrayInput);
                    break;
                case "insertionsort":
                    trace = InsertionSort.run(arrayInput);
                    break;
                case "mergesort":
                    trace = MergeSort.run(arrayInput);
                    break;
                case "quicksort":
                    trace = QuickSort.run(arrayInput);
                    break;
                case "linearsearch":
                    trace = LinearSearch.run(arrayInput, targetValue);
                    break;
                case "binarysearch":
                    trace = BinarySearch.run(arrayInput, targetValue);
                    break;
                case "twopointers":
                    trace = TwoPointers.run(arrayInput, targetValue);
                    break;
                case "slidingwindow":
                    trace = SlidingWindow.run(arrayInput, k);
                    break;
                case "stack":
                case "stackops":
                    trace = StackOps.runDemo(arrayInput);
                    break;
                case "queue":
                case "queueops":
                    trace = QueueOps.runDemo(arrayInput);
                    break;
                default:
                    sendError(exchange, 404, "Target '" + target + "' not recognized. Available: bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, linearSearch, binarySearch, twoPointers, slidingWindow, stack, queue.");
                    return;
            }

            String responseJson = gson.toJson(trace);
            byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);

            sendCorsHeaders(exchange);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }

        } catch (Exception ex) {
            ex.printStackTrace();
            sendError(exchange, 500, "Internal Server Error: " + ex.getMessage());
        }
    }

    private void sendCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        sendCorsHeaders(exchange);
        Map<String, Object> err = new HashMap<>();
        err.put("status", "error");
        err.put("statusCode", statusCode);
        err.put("message", message);
        byte[] bytes = gson.toJson(err).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
