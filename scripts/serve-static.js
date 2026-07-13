const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8080);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(requestUrl.split("?")[0]);
  const cleanPath = pathname === "/" ? "" : pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const directPath = path.resolve(rootDir, cleanPath || "index.html");
  const directoryPath = path.resolve(rootDir, cleanPath, "index.html");
  const candidates = [directPath, directoryPath].filter((candidate) => candidate.startsWith(rootDir));

  for (const candidate of candidates) {
    try {
      const stats = fs.existsSync(candidate) ? fs.statSync(candidate) : null;
      if (stats?.isFile()) return candidate;
      if (stats?.isDirectory()) return path.join(candidate, "index.html");
    } catch {
      // Ignorar y probar la siguiente alternativa.
    }
  }

  return null;
}

http.createServer((request, response) => {
  const filePath = resolveFile(request.url);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    const contentType = types[extension] || "application/octet-stream";
    const isHtml = extension === ".html";
    // SEO/rendimiento: se entregan headers de caché y seguridad para mejorar indexación y estabilidad del sitio estático.
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": isHtml ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    response.end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`VAIR local preview: http://localhost:${port}/`);
});
