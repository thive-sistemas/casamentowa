#!/usr/bin/env node
/**
 * Servidor local simples — site estático + rotas /api da Stripe.
 * Carrega STRIPE_SECRET_KEY de .env.local (sem precisar do Vercel CLI).
 *
 * Uso: node server.js
 * URL: http://localhost:3001
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const createCheckout = require("./api/create-checkout-session");
const verifyCheckout = require("./api/verify-checkout-session");

const PORT = Number(process.env.PORT) || 3001;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function createResAdapter(res) {
  const adapter = {
    statusCode: 200,
    _headers: {},
    setHeader(k, v) {
      this._headers[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      res.writeHead(this.statusCode, {
        ...this._headers,
        "content-type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(data));
    },
    end(body) {
      res.writeHead(this.statusCode, this._headers);
      res.end(body || "");
    },
  };
  return adapter;
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const filePath = path.join(__dirname, rel);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (url.pathname === "/api/create-checkout-session") {
      req.body = await readBody(req);
      return createCheckout(req, createResAdapter(res));
    }

    if (url.pathname === "/api/verify-checkout-session") {
      req.query = Object.fromEntries(url.searchParams);
      return verifyCheckout(req, createResAdapter(res));
    }

    serveStatic(req, res, url);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(err.message || "Erro interno");
  }
});

server.listen(PORT, () => {
  const hasKey = Boolean(
    process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("COLOQUE")
  );
  const hasConnect = Boolean(
    process.env.STRIPE_CONNECTED_ACCOUNT_ID &&
      !process.env.STRIPE_CONNECTED_ACCOUNT_ID.includes("COLOQUE")
  );
  console.log(`Site de casamento: http://localhost:${PORT}`);
  if (!hasKey) {
    console.log("⚠  STRIPE_SECRET_KEY ausente — crie .env.local (veja .env.example)");
  } else if (hasConnect) {
    console.log("✓  Stripe Connect configurado");
  } else {
    console.log("✓  Stripe configurado — pagamentos na conta principal");
  }
});
