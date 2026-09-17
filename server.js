import "dotenv/config";
import express from "express";
import multer from "multer";
import apiHandler, { missingRuntimeEnv } from "./api/[...path].js";

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_SCAN_UPLOAD_BYTES = 5 * 1024 * 1024;
const scanUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SCAN_UPLOAD_BYTES, files: 1 },
});

// Comma-separated allow-list of deployed frontend origins, e.g.
// FRONTEND_URL=https://aegis-orbit.onrender.com
// Never reflect arbitrary origins when cookie credentials are enabled.
// This is the current Render Static Site URL. FRONTEND_URL remains the
// deployment setting to use when a custom domain or replacement Static Site
// is used; it is intentionally a public URL, never a credential.
const defaultRenderFrontendOrigin = "https://aegis-ai-zone-1.onrender.com";
const localDevelopmentOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS, defaultRenderFrontendOrigin,
  ...(process.env.NODE_ENV === "production" ? [] : localDevelopmentOrigins)]
  .filter(Boolean)
  .join(",")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const isAllowedOrigin = (origin) => !!origin && allowedOrigins.includes(origin.replace(/\/$/, ""));

// CORS must execute before both the JSON parser and the preserved Vercel API
// handler. Cookies require an explicit origin; never use a wildcard here.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin.replace(/\/$/, ""));
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    if (!origin || isAllowedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.status(204).end();
    }
    return res.status(403).json({ error: "origin not allowed" });
  }
  next();
});

// Scan and payment endpoints accept base64 images. 16 MB leaves room for the
// JSON envelope; the scan handler and payment handler enforce tighter image
// limits after parsing.
app.use(express.json({ limit: "16mb" }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// Mobile browsers upload the prepared chart as a Blob. Keep this route before
// the catch-all handler while preserving the original handler and its routes.
app.post("/api/scan", scanUpload.single("image"), (req, res, next) => {
  apiHandler(req, res).catch(next);
});

// Do not mount this router at /api: the preserved Vercel handler reads req.url
// and expects the complete /api/... pathname.
app.use((req, res, next) => {
  if (req.path === "/api" || req.path.startsWith("/api/")) return apiHandler(req, res);
  next();
});

app.use((_req, res) => res.status(404).json({ error: "not found" }));
app.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "รูปกราฟใหญ่เกิน 5 MB กรุณาครอปหรือย่อรูปก่อนส่ง" });
  if (error instanceof multer.MulterError) return res.status(400).json({ error: "อัปโหลดรูปกราฟไม่ถูกต้อง" });
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "request body too large" });
  console.error(error);
  return res.status(400).json({ error: "invalid JSON request body" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  const missing = missingRuntimeEnv();
  console.log(`AEGIS ORBIT API running on port ${PORT}`);
  if (missing.length) console.warn(`API endpoints are disabled until these environment variables are set: ${missing.join(", ")}`);
  console.log("Internal Mock AI mode enabled - no external AI API is used");
  console.log(`CORS credentials enabled for: ${allowedOrigins.join(", ") || "no configured origins"}`);
});

server.on("error", (error) => {
  console.error("AEGIS ORBIT API failed to listen:", error);
  process.exitCode = 1;
});

// Render sends SIGTERM when restarting or stopping a Web Service. Keep the
// listener alive normally, then close it cleanly only for that signal.
process.once("SIGTERM", () => server.close(() => process.exit(0)));
process.once("SIGINT", () => server.close(() => process.exit(0)));
