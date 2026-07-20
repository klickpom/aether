const http = require("http");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent((reqPath || "/").split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  let urlPath = (req.url || "/").split("?")[0];
  // Support both / and /aether prefix
  if (urlPath === "/aether" || urlPath === "/aether/") urlPath = "/index.html";
  else if (urlPath.startsWith("/aether/")) urlPath = urlPath.slice("/aether".length);

  let filePath = safeJoin(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (!filePath) {
    res.writeHead(400);
    return res.end("Bad request");
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      // SPA-ish fallback to index for clean URLs
      const indexPath = path.join(ROOT, "index.html");
      return fs.createReadStream(indexPath).on("error", () => {
        res.writeHead(404);
        res.end("Not found");
      }).pipe(res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      }) || res);
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = TYPES[ext] || "application/octet-stream";
    const isHtml = ext === ".html";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": isHtml || ext === ".css" || ext === ".js"
        ? "no-cache, no-store, must-revalidate"
        : "public, max-age=86400",
    });
    pipeline(fs.createReadStream(filePath), res, () => {});
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AETHER listening on ${PORT}`);
});
