import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import api.ApiHandler;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Main application entrypoint.
 * Starts built-in JDK HttpServer, serves static frontend files, and exposes JSON API.
 */
public class Main {

    private static final int DEFAULT_PORT = 8080;
    private static final String WEB_ROOT = "src/main/resources/web";

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // API Endpoint
        server.createContext("/api/run", new ApiHandler());

        // Static files handler
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // default executor
        server.start();

        System.out.println("=================================================");
        System.out.println(" Interactive DSA Visualizer Server Running");
        System.out.println(" URL: http://localhost:" + port + "/");
        System.out.println(" Static files served from: " + WEB_ROOT);
        System.out.println(" Press Ctrl+C to stop.");
        System.out.println("=================================================");
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            // Clean path
            if (path.startsWith("/")) {
                path = path.substring(1);
            }

            // Security check against directory traversal
            if (path.contains("..")) {
                send404(exchange, "Invalid path.");
                return;
            }

            Path filePath = Paths.get(WEB_ROOT, path);

            if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                String mime = getMimeType(path);
                byte[] bytes = Files.readAllBytes(filePath);
                exchange.getResponseHeaders().set("Content-Type", mime);
                exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
                return;
            }

            // Try loading from classpath resources as fallback
            InputStream is = getClass().getResourceAsStream("/web/" + path);
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                is.close();
                String mime = getMimeType(path);
                exchange.getResponseHeaders().set("Content-Type", mime);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
                return;
            }

            send404(exchange, "File not found: " + path);
        }

        private void send404(HttpExchange exchange, String message) throws IOException {
            byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
            exchange.sendResponseHeaders(404, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String getMimeType(String path) {
            String lower = path.toLowerCase();
            if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
            if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
            if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".ico")) return "image/x-icon";
            return "application/octet-stream";
        }
    }
}
