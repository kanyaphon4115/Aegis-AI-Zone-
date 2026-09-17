import "dotenv/config";
import express from "express";
import apiHandler, { missingRuntimeEnv } from "./api/[...path].js";

const app = express();
const port = Number(process.env.PORT) || 3000;

// Comma-separated allow-list of deployed frontend origins, e.g.
// FRONTEND_URL=https://aegis-orbit.onrender.com
// Never reflect arbitrary origins when cookie credentials are enabled.
const allowedOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, "");
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS" && req.path.startsWith("/api/")) {
    if (!origin || allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(204).end();
    }
    return res.status(403).json({ error: "origin not allowed" });
  }
  next();
});

// Scan and payment endpoints accept base64 images. 12 MB allows their JSON
// envelope while the payment handler continues to enforce its 2.5 MB file cap.
app.use(express.json({ limit: "12mb" }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// Do not mount this router at /api: the preserved Vercel handler reads req.url
// and expects the complete /api/... pathname.
app.use((req, res, next) => {
  if (req.path === "/api" || req.path.startsWith("/api/")) return apiHandler(req, res);
  next();
});

app.use((_req, res) => res.status(404).json({ error: "not found" }));
app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "request body too large" });
  console.error(error);
  return res.status(400).json({ error: "invalid JSON request body" });
});

app.listen(port, "0.0.0.0", () => {
  const missing = missingRuntimeEnv();
  console.log(`AEGIS ORBIT API running on port ${port}`);
  if (missing.length) console.warn(`API endpoints are disabled until these environment variables are set: ${missing.join(", ")}`);
});
