import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const clientDir = join(root, "dist", "client");
const serverEntry = await import(pathToFileURL(join(root, "dist", "server", "server.js")));
const handler = serverEntry.default;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function staticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidate = normalize(join(clientDir, decoded));
  return candidate.startsWith(clientDir) ? candidate : undefined;
}

async function serveStatic(res, pathname) {
  const filePath = staticPath(pathname);
  if (!filePath) return false;

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;

    res.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      "content-length": info.size,
      "cache-control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-store",
    });
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

async function sendFetchResponse(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  if (!response.body) {
    res.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host ?? "localhost"}`;
    const url = new URL(req.url ?? "/", origin);

    if (await serveStatic(res, url.pathname)) return;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    });
    const response = await handler.fetch(request, process.env, {});
    await sendFetchResponse(res, response);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
}).listen(Number(process.env.PORT ?? 8080), process.env.HOST ?? "0.0.0.0");
