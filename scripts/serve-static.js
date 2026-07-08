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
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(requestUrl.split("?")[0]);
  const normalized = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const filePath = path.resolve(rootDir, normalized.replace(/^\/+/, ""));
  return filePath.startsWith(rootDir) ? filePath : null;
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

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`VAIR local preview: http://localhost:${port}/`);
});
