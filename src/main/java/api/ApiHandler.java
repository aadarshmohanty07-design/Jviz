package api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import core.Trace;
import algorithms.BubbleSort;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles API calls to /api/run
 */
public class ApiHandler implements HttpHandler {

    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        // Handle CORS preflight
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

            Trace trace = null;

            if ("algorithm".equalsIgnoreCase(category)) {
                switch (target.toLowerCase()) {
                    case "bubblesort":
                        trace = BubbleSort.run(arrayInput);
                        break;
                    default:
                        // Fallback or early error
                        sendError(exchange, 404, "Algorithm '" + target + "' not yet wired. (Available: bubbleSort)");
                        return;
                }
            } else {
                sendError(exchange, 404, "Structure operation '" + target + "' not yet wired.");
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
