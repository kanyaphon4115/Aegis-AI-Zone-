import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ============================================================
   AEGIS ORBIT v6
   ภาษาออกแบบใหม่: หอสังเกตการณ์ + เทอร์มินัลการเงิน
   ทองเหลืองด้าน + หมึกน้ำเงินเข้ม, เส้นบาง, ตัวเลขเซริฟ
   เลิกใช้ปุ่มไล่สีนีออนและฟอนต์โค้ดกับราคา
   ============================================================ */

const BANK = { name: "ธนาคารกสิกรไทย", short: "กสิกรไทย", accRaw: "0833211587", accPretty: "083-3-21158-7", holder: "นาย ธนาวิล ไกกาจ", holderShort: "ธนาวิล ไกกาจ", promptpayRef: "004999052667036" };
const QR_VIEWBOX = "0 0 37 37";
const QR_PATH = "M2 2.5h7m2 0h1m6 0h1m1 0h1m1 0h1m1 0h2m2 0h7m-33 1h1m5 0h1m1 0h1m3 0h2m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m2 0h1m5 0h1m-33 1h1m1 0h3m1 0h1m4 0h1m4 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1m-33 1h1m1 0h3m1 0h1m4 0h3m1 0h1m1 0h1m5 0h1m2 0h1m1 0h3m1 0h1m-33 1h1m1 0h3m1 0h1m1 0h1m1 0h2m6 0h3m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1m-33 1h1m5 0h1m2 0h4m1 0h1m2 0h1m4 0h1m3 0h1m5 0h1m-33 1h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7m-23 1h3m1 0h1m1 0h1m2 0h1m1 0h1m1 0h2m-25 1h1m1 0h1m1 0h1m1 0h1m3 0h1m2 0h4m1 0h4m2 0h1m3 0h1m2 0h1m-32 1h1m1 0h1m1 0h2m3 0h1m5 0h1m3 0h1m2 0h2m1 0h1m1 0h1m1 0h1m1 0h1m-30 1h1m3 0h2m2 0h2m1 0h1m2 0h2m3 0h2m1 0h1m5 0h1m-31 1h1m2 0h1m3 0h2m2 0h1m3 0h1m3 0h3m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m-33 1h5m1 0h1m2 0h1m10 0h1m6 0h2m1 0h1m1 0h1m-31 1h1m6 0h4m2 0h1m1 0h1m3 0h2m1 0h2m1 0h2m2 0h1m-32 1h1m4 0h3m1 0h1m1 0h1m6 0h1m3 0h1m1 0h3m1 0h1m3 0h1m-31 1h3m3 0h1m4 0h3m1 0h1m5 0h1m3 0h3m1 0h1m-32 1h1m2 0h2m1 0h3m1 0h1m2 0h1m4 0h1m1 0h1m1 0h4m2 0h1m1 0h1m1 0h1m-33 1h1m1 0h1m1 0h1m3 0h1m2 0h1m3 0h1m1 0h5m1 0h1m1 0h1m1 0h1m3 0h1m-32 1h1m2 0h2m1 0h1m1 0h2m3 0h3m2 0h3m3 0h3m1 0h1m1 0h1m1 0h1m-30 1h1m6 0h2m1 0h1m1 0h1m1 0h3m1 0h1m1 0h1m2 0h4m1 0h1m-31 1h1m3 0h3m1 0h1m1 0h2m3 0h1m1 0h1m4 0h2m1 0h1m1 0h1m1 0h1m-30 1h1m1 0h2m5 0h1m4 0h4m2 0h1m1 0h2m3 0h2m1 0h1m-32 1h1m1 0h3m1 0h2m1 0h1m1 0h3m1 0h2m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m3 0h1m-32 1h1m2 0h2m2 0h1m3 0h1m3 0h2m1 0h1m1 0h1m1 0h2m2 0h1m1 0h1m1 0h2m-33 1h1m2 0h1m1 0h3m2 0h2m2 0h3m3 0h1m1 0h1m1 0h5m2 0h2m-25 1h1m3 0h1m2 0h2m1 0h2m1 0h1m1 0h2m3 0h2m2 0h1m-33 1h7m2 0h9m2 0h1m3 0h1m1 0h1m1 0h1m1 0h3m-33 1h1m5 0h1m2 0h1m1 0h1m1 0h3m3 0h1m1 0h1m2 0h1m3 0h1m2 0h2m-33 1h1m1 0h3m1 0h1m1 0h2m1 0h1m8 0h1m3 0h5m1 0h3m-33 1h1m1 0h3m1 0h1m2 0h1m4 0h2m5 0h1m1 0h1m1 0h3m1 0h4m-33 1h1m1 0h3m1 0h1m1 0h1m1 0h1m2 0h2m5 0h1m1 0h2m2 0h1m1 0h1m3 0h1m-33 1h1m5 0h1m2 0h2m3 0h2m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m-33 1h7m1 0h1m5 0h1m1 0h1m1 0h1m1 0h1m1 0h2m1 0h2m1 0h1m1 0h1m1 0h1";
const PRO_PLANS = ["month", "five", "year"];

/* ---------- API client (cookie session) ---------- */
// Vite replaces VITE_API_URL at build time. Production must never fall back
// to /api on the Static Site, because that host has no API routes.
const RENDER_API_URL = "https://aegis-ai-zone.onrender.com";
const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? RENDER_API_URL : "")).replace(/\/$/, "");
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) console.warn("VITE_API_URL is not configured; using the Render API default.");
async function api(path, body, method, { timeoutMs = 60000 } = {}) {
  const controller = typeof AbortController === "undefined" ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    const r = await fetch(`${API_URL}${path}`, { method: method || (body ? "POST" : "GET"), credentials: "include",
      // Do not set multipart Content-Type: the browser must add its boundary.
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: !body ? undefined : isFormData ? body : JSON.stringify(body), signal: controller?.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      // Keep error diagnostics useful without ever logging request payloads
      // (which may contain the customer's chart image or credentials).
      console.error("[api] response error", { path, status: r.status, body: j });
      const e = new Error(j.error || "ผิดพลาด ลองใหม่อีกครั้ง"); e.status = r.status; e.responseBody = j; throw e;
    }
    return j;
  } catch (error) {
    if (error?.name === "AbortError") { const e = new Error("ส่งภาพใช้เวลานานเกินไป กรุณาลองใหม่ด้วยภาพที่เล็กลง"); e.code = "timeout"; throw e; }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
const isThaiMobile = (p) => /^0[689]\d{8}$/.test(p);
const pwStrength = (pw) => (pw.length >= 8 && /\d/.test(pw) && /[a-zA-Z]/.test(pw) ? "ok" : pw.length >= 6 ? "weak" : "short");
const planActive = (u) => !!(u && u.plan && u.expires && new Date(u.expires).getTime() > Date.now());
const newOrderId = () => "AO" + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 5).toUpperCase();

/* ย่อรูปก่อนเก็บ/ส่ง เพื่อไม่ให้ภาพจากกล้องมือถือเกิน body limit */
async function compressImage(file, max = 900, quality = 0.72) {
  // Chrome and recent Safari honour the image's EXIF orientation here. This
  // prevents portrait camera charts from reaching the analysis sideways.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bitmap.width * scale)); c.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("ไม่สามารถเตรียมภาพได้");
      ctx.drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close?.();
      return c.toDataURL("image/jpeg", quality);
    } catch {
      // iPhone Safari versions without createImageBitmap (or HEIC decoding)
      // use the Image fallback below.
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("ไม่สามารถเตรียมภาพได้");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("เบราว์เซอร์อ่านไฟล์ภาพนี้ไม่ได้")); };
    img.src = url;
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

const SCAN_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const MAX_SCAN_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_SCAN_UPLOAD_BYTES = 5 * 1024 * 1024;
const scanMimeFromFile = (file) => {
  const type = (file.type || "").toLowerCase();
  if (type) return type === "image/jpg" ? "image/jpeg" : type;
  const ext = (file.name || "").split(".").pop()?.toLowerCase();
  return ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" })[ext] || "";
};
async function prepareScanImage(file) {
  const sourceMime = scanMimeFromFile(file);
  if (!file || !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(sourceMime))
    throw new Error("รองรับ JPG, PNG, WEBP และ HEIC/HEIF จาก iPhone");
  if (file.size > MAX_SCAN_SOURCE_BYTES) throw new Error("รูปต้นฉบับใหญ่เกิน 15 MB กรุณาเลือกรูปที่เล็กลง");

  // Canvas converts a supported HEIC/HEIF image to JPEG before it reaches the
  // API. If a browser cannot decode HEIC, it fails here with a useful message
  // instead of sending an unsupported MIME type to the backend.
  let url;
  try { url = await compressImage(file, 1600, 0.82); }
  catch {
    throw new Error(sourceMime === "image/heic" || sourceMime === "image/heif"
      ? "เครื่องนี้ยังอ่าน HEIC/HEIF ไม่ได้ กรุณาเลือก ‘Most Compatible/JPEG’ หรือแปลงเป็น JPG ก่อน"
      : "ไม่สามารถอ่านไฟล์รูปนี้ได้ กรุณาลองรูป JPG, PNG หรือ WEBP");
  }
  let blob = await dataUrlToBlob(url);
  if (blob.size > MAX_SCAN_UPLOAD_BYTES) {
    url = await compressImage(file, 1200, 0.72);
    blob = await dataUrlToBlob(url);
  }
  if (!blob.size || blob.size > MAX_SCAN_UPLOAD_BYTES)
    throw new Error("รูปยังใหญ่เกินไปหลังย่อ กรุณาครอปเฉพาะกราฟแล้วลองใหม่");
  return { url, blob, mime: "image/jpeg" };
}


const PLANS = [
  { id: "day",   tier: "starter", label: "Starter", name: "รายวัน",  price: 500,   days: 1,   quota: 30,   unit: "30 ครั้ง",  note: "เฉลี่ยครั้งละ 16.60 ฿", perMonth: null },
  { id: "month", tier: "pro",     label: "Pro",     name: "รายเดือน", price: 2490,  days: 30,  quota: null, unit: "ไม่จำกัด", note: "เฉลี่ยวันละ 83 ฿",      perMonth: 2490 },
  { id: "five",  tier: "pro",     label: "Pro",     name: "5 เดือน",  price: 9900,  days: 150, quota: null, unit: "ไม่จำกัด", note: "เฉลี่ยเดือนละ 1,980 ฿", perMonth: 1980, save: "ประหยัด 20%" },
  { id: "year",  tier: "pro",     label: "Pro",     name: "รายปี",    price: 14900, days: 365, quota: null, unit: "ไม่จำกัด", note: "เฉลี่ยเดือนละ 1,242 ฿", perMonth: 1242, save: "ประหยัด 50%", best: true },
];
const planTitle = (p) => p ? `${p.label} · ${p.name}` : "-";
const FREE_SCANS = 3;
/* ---------- เวลาโซนจริง (ข่าวสหรัฐอิงเวลานิวยอร์ก ปรับ DST เอง) ---------- */
const TZ_TH = "Asia/Bangkok", TZ_ET = "America/New_York";
function zoneOffsetMin(date, tz) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - date.getTime()) / 60000;
}
function etWall(y, m, d, hh, mm) {
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return new Date(guess.getTime() - zoneOffsetMin(guess, TZ_ET) * 60000);
}
function etParts(date) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ_ET, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
    .formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  return { y: +p.year, m: +p.month, d: +p.day, wd: p.weekday };
}
const bkkKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ_TH, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
const bkkTime = (d) => new Date(d).toLocaleTimeString("th-TH", { timeZone: TZ_TH, hour: "2-digit", minute: "2-digit", hour12: false });
const bkkWhen = (d) => new Date(d).toLocaleString("th-TH", { timeZone: TZ_TH, weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const baht = (n) => n.toLocaleString("th-TH");
const clock = () => new Date().toLocaleTimeString("th-TH", { hour12: false });
const pad = (n) => String(n).padStart(2, "0");

function useTick(ms = 1000) { const [, s] = useState(0); useEffect(() => { const i = setInterval(() => s((x) => x + 1), ms); return () => clearInterval(i); }, [ms]); }

function useCountUp(target, run, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return; let raf, st = null;
    const step = (t) => { if (!st) st = t; const p = Math.min((t - st) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

/* ---------- ตารางสำรองเมื่อดึงข้อมูลสดไม่ได้ ---------- */
function buildFallback() {
  const out = [], base = new Date();
  const mk = (add, h, m, title, impact, effect) => {
    const d = new Date(base); d.setDate(d.getDate() + add); d.setHours(h, m, 0, 0);
    out.push({ at: d.toISOString(), title, impact, ccy: "USD", forecast: "-", previous: "-", effect });
  };
  mk(0, 19, 30, "ยอดขอรับสวัสดิการว่างงานรายสัปดาห์", "medium", "ตัวเลขแย่กว่าคาดมักกดดันดอลลาร์และหนุนทอง");
  mk(1, 19, 30, "ดัชนีราคาผู้บริโภค CPI", "high", "เงินเฟ้อสูงกว่าคาดหนุนคาดการณ์ดอกเบี้ยและกดทอง");
  mk(2, 21, 0, "ถ้อยแถลงประธานเฟด", "high", "โทนสายเหยี่ยวกดทอง โทนผ่อนคลายหนุนทอง");
  mk(3, 19, 30, "ยอดค้าปลีก", "medium", "สะท้อนกำลังซื้อและทิศทางดอลลาร์");
  mk(4, 19, 30, "การจ้างงานนอกภาคเกษตร", "high", "แรงงานแข็งแกร่งหนุนดอลลาร์และกดดันทอง");
  return out;
}

/* ============================ CSS ============================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Anuphan:wght@300;400;500;600;700&display=swap');

.ao * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
.ao {
  --bg:#050608; --s1:#141519; --s2:#1D1E24; --s3:#26272E;
  --sep:rgba(255,255,255,.08); --sep2:rgba(255,255,255,.05);
  --label:#F5F5F7; --sec:rgba(235,235,245,.62); --ter:rgba(235,235,245,.36);
  --gold:#E0B96B; --gold2:#F2D6A0; --goldDim:rgba(224,185,107,.6); --goldBg:rgba(224,185,107,.12);
  --green:#30D158; --red:#FF453A;
  /* aliases used by inline styles */
  --brass:var(--gold); --brass2:var(--gold2); --brassDim:var(--goldDim);
  --up:var(--green); --down:var(--red); --muted:var(--sec); --text:var(--label);
  --edge:var(--sep); --edgeB:rgba(224,185,107,.38); --ice:#A6A8B3; --surf:var(--s1);
  font-family:'Inter','Anuphan',-apple-system,system-ui,sans-serif; color:var(--label);
  background:#000; min-height:100vh; width:100%; display:flex; justify-content:center;
  -webkit-font-smoothing:antialiased; font-size:15px; letter-spacing:-.005em;
}
.ao .mono { font-family:'Inter','Anuphan',sans-serif; font-size:11px; font-weight:500; letter-spacing:.02em; font-variant-numeric:tabular-nums; }
.ao .num  { font-family:'Inter','Anuphan',sans-serif; font-weight:700; letter-spacing:-.03em; font-variant-numeric:tabular-nums; }

.ao .shell { width:100%; max-width:430px; min-height:100vh; position:relative; overflow:hidden; display:flex; flex-direction:column;
  background:radial-gradient(120% 45% at 50% -10%, rgba(224,185,107,.13), transparent 60%), var(--bg); }
.ao .sky { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
.ao .layer { position:absolute; inset:0; }
.ao .l1 { background:radial-gradient(60% 40% at 85% 0%, rgba(120,140,255,.08), transparent 70%); }
.ao .l2 { display:none; }
@keyframes drift { from{transform:none} to{transform:none} }

.ao .body { position:relative; z-index:2; flex:1; padding:0 18px 116px; }
.ao .pad { padding:0 18px; }

.ao .rule { height:1px; background:var(--sep2); }
.ao .strip { display:flex; align-items:center; gap:10px; padding:14px 18px 10px; position:relative; z-index:4; }
.ao .eyebrow { display:flex; align-items:center; gap:9px; color:var(--ter); font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
.ao .eyebrow:after { content:none; }

.ao h1 { font-size:30px; font-weight:700; line-height:1.2; margin:0 0 8px; letter-spacing:-.025em; }
.ao h2 { font-size:17px; font-weight:600; margin:0 0 12px; letter-spacing:-.012em; }
.ao p  { margin:0; color:var(--sec); line-height:1.6; font-size:14.5px; font-weight:400; }
.ao .dim { color:var(--ter); font-size:12.5px; line-height:1.55; }

/* cards: borderless, tonal, continuous corners */
.ao .card { background:var(--s1); border:0; border-radius:20px; padding:18px; box-shadow:inset 0 1px 0 rgba(255,255,255,.03); }
.ao .card.tight { padding:15px 16px; }
.ao .card.brass { background:linear-gradient(180deg, rgba(224,185,107,.14), rgba(224,185,107,.05)), var(--s1); box-shadow:inset 0 0 0 1px rgba(224,185,107,.28); }

/* buttons */
.ao button { font-family:inherit; cursor:pointer; border:none; color:inherit; }
.ao .btn { width:100%; padding:0 18px; height:50px; border-radius:14px; font-size:16px; font-weight:600; letter-spacing:-.01em;
  background:var(--gold); color:#1A1206; transition:transform .12s ease, filter .18s ease; display:inline-flex; align-items:center; justify-content:center; }
.ao .btn:active { transform:scale(.985); filter:brightness(.95); }
.ao .btn:disabled { background:var(--s2); color:var(--ter); cursor:not-allowed; }
.ao .btn.ghost { background:var(--s2); color:var(--label); font-weight:600; }
.ao .btn.ghost:disabled { color:var(--ter); }
.ao .btn.sm { height:36px; padding:0 14px; font-size:13.5px; border-radius:11px; width:auto; }

/* inputs */
.ao .field { margin-bottom:12px; }
.ao .label { font-size:12.5px; color:var(--ter); margin-bottom:7px; display:block; font-weight:500; }
.ao .inwrap { display:flex; align-items:center; gap:10px; padding:0 14px; border-radius:14px; background:var(--s1); border:1px solid transparent; transition:border-color .2s, background .2s; min-height:50px; }
.ao .inwrap:focus-within { border-color:var(--goldDim); background:var(--s2); }
.ao .inwrap .pre { color:var(--ter); font-size:15px; }
.ao input, .ao textarea { width:100%; padding:13px 0; border:0; background:none; color:var(--label); outline:none; font-family:inherit; font-size:16px; font-weight:400; }
.ao input.solo { padding:13px 14px; border-radius:14px; background:var(--s1); border:1px solid transparent; min-height:50px; }
.ao input.solo:focus { border-color:var(--goldDim); background:var(--s2); }
.ao input::placeholder { color:var(--ter); }
.ao select { font-family:inherit; font-size:14px; outline:none; background:var(--s1) !important; border:0 !important; border-radius:12px !important; }

/* tabs (underline) + segmented control */
.ao .tabs { display:flex; gap:22px; border-bottom:1px solid var(--sep2); margin-bottom:22px; }
.ao .tabs button { padding:0 0 12px; background:none; color:var(--ter); font-size:15px; font-weight:600; position:relative; }
.ao .tabs button.on { color:var(--label); }
.ao .tabs button.on:after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px; border-radius:2px; background:var(--label); }
.ao .pill { display:flex; gap:2px; padding:3px; border-radius:12px; background:var(--s1); margin-bottom:16px; }
.ao .pill button { flex:1; padding:9px 6px; border-radius:10px; background:none; color:var(--sec); font-size:13.5px; font-weight:500; transition:background .18s, color .18s; }
.ao .pill button.on { background:var(--s3); color:var(--label); font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,.45); }

/* tab bar: frosted */
.ao .nav { position:absolute; left:0; right:0; bottom:0; z-index:6; display:grid; grid-template-columns:repeat(5,1fr);
  padding:8px 6px calc(10px + env(safe-area-inset-bottom)); background:rgba(10,11,14,.72);
  backdrop-filter:saturate(180%) blur(28px); -webkit-backdrop-filter:saturate(180%) blur(28px); border-top:1px solid var(--sep2); }
.ao .navb { background:none; color:var(--ter); font-size:10px; font-weight:500; display:flex; flex-direction:column; align-items:center; gap:4px; padding:6px 0 2px; position:relative; letter-spacing:.01em; }
.ao .navb.on { color:var(--gold); }
.ao .navb.on:before { content:none; }
.ao .navi { width:23px; height:23px; }
.ao .dot { position:absolute; top:4px; right:50%; margin-right:-18px; width:6px; height:6px; border-radius:50%; background:var(--red); box-shadow:0 0 0 2px #0a0b0e; }
.ao .fab { position:absolute; right:16px; bottom:88px; z-index:7; width:50px; height:50px; border-radius:50%; background:var(--s2); color:var(--gold); display:grid; place-items:center;
  box-shadow:0 10px 30px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06); }

/* scan stage */
.ao .stage { position:relative; border-radius:20px; overflow:hidden; background:var(--s1); aspect-ratio:4/3; display:flex; align-items:center; justify-content:center; }
.ao .stage img { width:100%; height:100%; object-fit:contain; }
.ao .gridov { position:absolute; inset:0; opacity:.4; pointer-events:none; background-image:linear-gradient(rgba(224,185,107,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(224,185,107,.12) 1px, transparent 1px); background-size:30px 30px; }
.ao .sweep { position:absolute; left:0; right:0; height:2px; background:var(--gold); box-shadow:0 0 24px 4px rgba(224,185,107,.5), 0 -40px 50px 8px rgba(224,185,107,.1); animation:sweep 1.9s cubic-bezier(.45,0,.55,1) infinite; }
@keyframes sweep { 0%{top:-4px} 100%{top:100%} }
.ao .tick { position:absolute; width:16px; height:16px; border:2px solid var(--gold); opacity:.9; border-radius:2px; }
.ao .tick.tl{top:12px;left:12px;border-right:0;border-bottom:0} .ao .tick.tr{top:12px;right:12px;border-left:0;border-bottom:0}
.ao .tick.bl{bottom:12px;left:12px;border-right:0;border-top:0} .ao .tick.br{bottom:12px;right:12px;border-left:0;border-top:0}

.ao .log { border-top:0; background:var(--s1); border-radius:16px; padding:4px 14px; }
.ao .logrow { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--sep2); }
.ao .logrow:last-child { border-bottom:0; }
.ao .logrow span:last-child { margin-left:auto; }
.ao .prog { height:3px; border-radius:3px; background:var(--s2); overflow:hidden; }
.ao .prog i { display:block; height:100%; border-radius:3px; background:var(--gold); transition:width .35s ease; }

/* grouped rows */
.ao .row { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:12px 0; border-bottom:1px solid var(--sep2); min-height:44px; }
.ao .row:last-child { border-bottom:0; }
.ao .row .k { color:var(--sec); font-size:14px; }
.ao .row .v { font-size:15px; text-align:right; font-weight:500; }

.ao .badge { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; padding:4px 9px; border-radius:999px; border:0; background:var(--s2); color:var(--sec); letter-spacing:.01em; }
.ao .badge.up { background:rgba(48,209,88,.14); color:var(--green); }
.ao .badge.dn { background:rgba(255,69,58,.14); color:var(--red); }
.ao .badge.br { background:var(--goldBg); color:var(--gold2); }

/* outlook meter (legacy) */
.ao .meter { position:relative; height:4px; border-radius:2px; margin:16px 0 8px; background:linear-gradient(90deg, rgba(255,69,58,.55), rgba(255,255,255,.1) 50%, rgba(48,209,88,.55)); }
.ao .meter i { position:absolute; top:-5px; width:3px; height:14px; border-radius:2px; background:#fff; }
.ao .meter b { position:absolute; top:-14px; left:50%; width:1px; height:8px; background:rgba(255,255,255,.2); }

/* events + day picker */
.ao .evt { display:flex; gap:13px; padding:14px 0; border-bottom:1px solid var(--sep2); }
.ao .evt:last-child { border-bottom:0; }
.ao .imp { width:3px; border-radius:3px; flex:none; }
.ao .days { display:flex; gap:6px; overflow-x:auto; padding-bottom:14px; }
.ao .days::-webkit-scrollbar { display:none; }
.ao .day { flex:none; min-width:50px; padding:9px 8px 8px; border-radius:14px; background:var(--s1); text-align:center; color:var(--sec); border:1px solid transparent; }
.ao .day.on { background:var(--s3); color:var(--label); }
.ao .day em { display:block; width:5px; height:5px; border-radius:50%; background:var(--red); margin:5px auto 0; }

/* chat */
.ao .msgs { display:flex; flex-direction:column; gap:8px; }
.ao .msg { max-width:84%; padding:11px 15px; border-radius:20px; font-size:15px; line-height:1.5; }
.ao .msg.bot { background:var(--s2); color:var(--label); border-bottom-left-radius:6px; align-self:flex-start; }
.ao .msg.me { background:var(--gold); color:#1A1206; border-bottom-right-radius:6px; align-self:flex-end; }
.ao .quick { display:flex; gap:7px; flex-wrap:wrap; margin-top:12px; }
.ao .quick button { font-size:13px; font-weight:500; padding:9px 13px; border-radius:999px; background:var(--s1); color:var(--label); }

.ao .toast { position:fixed; left:50%; bottom:100px; transform:translateX(-50%); z-index:60; background:rgba(38,39,46,.96); backdrop-filter:blur(20px); color:var(--label); padding:11px 18px; border-radius:999px; font-size:13.5px; font-weight:500; white-space:nowrap; box-shadow:0 10px 30px rgba(0,0,0,.5); }
.ao .sheet { position:absolute; inset:0; z-index:40; background:rgba(0,0,0,.6); backdrop-filter:blur(8px); display:flex; align-items:flex-end; }
.ao .sheet .inner { width:100%; background:var(--s1); border-radius:26px 26px 0 0; padding:14px 20px calc(24px + env(safe-area-inset-bottom)); animation:up .32s cubic-bezier(.2,.8,.2,1); }
.ao .sheet .inner:before { content:''; display:block; width:36px; height:5px; border-radius:3px; background:var(--s3); margin:0 auto 18px; }
@keyframes up { from{transform:translateY(40px);opacity:0} to{transform:none;opacity:1} }
.ao .hist { display:flex; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid var(--sep2); }
.ao .hist:last-child { border-bottom:0; }
.ao .hist img { width:48px; height:48px; object-fit:cover; border-radius:10px; flex:none; }

.ao .skel { border-radius:8px; background:linear-gradient(90deg, var(--s2), var(--s3), var(--s2)); background-size:200% 100%; animation:shimmer 1.4s linear infinite; }
@keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
.ao .fadein { animation:fade .5s ease both; }
@keyframes fade { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
.ao .draw { stroke-dasharray:600; stroke-dashoffset:600; animation:draw 2.2s cubic-bezier(.4,0,.2,1) .3s forwards; }
@keyframes draw { to { stroke-dashoffset:0 } }

/* pricing */
.ao .tier { background:var(--s1); border-radius:22px; padding:20px; margin-bottom:12px; position:relative; }
.ao .tier.pro { background:linear-gradient(160deg, rgba(224,185,107,.18), rgba(224,185,107,.04) 60%), var(--s1); box-shadow:inset 0 0 0 1px rgba(224,185,107,.32); }
.ao .tier .tname { font-size:22px; font-weight:700; letter-spacing:-.02em; }
.ao .tier .tag { font-size:13.5px; color:var(--sec); margin-top:4px; }
.ao .bill { display:flex; gap:2px; padding:3px; border-radius:12px; background:rgba(0,0,0,.35); margin:16px 0 14px; }
.ao .bill button { flex:1; padding:8px 4px; border-radius:10px; background:none; color:var(--sec); font-size:12.5px; font-weight:500; line-height:1.3; }
.ao .bill button.on { background:var(--s3); color:var(--label); font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,.45); }
.ao .cmp { display:grid; grid-template-columns:1fr 64px 64px; align-items:center; padding:12px 0; border-bottom:1px solid var(--sep2); font-size:14px; }
.ao .cmp:last-child { border-bottom:0; }
.ao .cmp span:nth-child(2), .ao .cmp span:nth-child(3) { text-align:center; color:var(--sec); font-size:13px; }

@media (prefers-reduced-motion: reduce) { .ao *, .ao *:before, .ao *:after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

/* ---------- icons (hairline, 1.4 stroke) ---------- */
const Ico = {
  scan: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 8V5.5A2.5 2.5 0 015.5 3H8M21 8V5.5A2.5 2.5 0 0018.5 3H16M3 16v2.5A2.5 2.5 0 005.5 21H8M21 16v2.5a2.5 2.5 0 01-2.5 2.5H16M3.5 12h17"/></svg>),
  chart:(p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 20h18M6 16V9M11 16V5M16 16v-4M21 16v-7"/></svg>),
  hist: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/></svg>),
  crown:(p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3.4 8.2l4.1 3 4.5-5.6 4.5 5.6 4.1-3-2 11.4H5.4L3.4 8.2z"/></svg>),
  chat: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M20.6 12a8.6 8.6 0 01-12.4 7.7L4 20.6l1-4.1A8.6 8.6 0 1120.6 12z"/></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0114 0"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M15 5l-7 7 7 7"/></svg>),
  copy: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/></svg>),
  phone:(p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 18.6h3"/></svg>),
  lock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="4.8" y="10.2" width="14.4" height="10" rx="2.2"/><path d="M8.2 10.2V7.6a3.8 3.8 0 017.6 0v2.6"/></svg>),
  key:  (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="8" cy="12" r="3.4"/><path d="M11.4 12H21M18.2 12v3M15.2 12v2.2"/></svg>),
  check:(p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}><path d="M4.5 12.5l5 5L20 6.5"/></svg>),
};

/* ---------- เครื่องมือดาราศาสตร์ (แทนดาวเคราะห์การ์ตูน) ---------- */
function Instrument({ size = 250, live = true }) {
  const R = 130, cx = 140, cy = 140;
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const r1 = R - (major ? 9 : 4), r2 = R;
    ticks.push(
      <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
        stroke={major ? "rgba(216,185,120,.5)" : "rgba(255,255,255,.13)"} strokeWidth={major ? 1 : .8} />
    );
  }
  const G = 62;
  const meridians = [14, 30, 46].map((rx, i) => (
    <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={G} fill="none" stroke="rgba(216,185,120,.26)" strokeWidth=".8" />
  ));
  const parallels = [-42, -22, 0, 22, 42].map((y, i) => {
    const w = Math.sqrt(G * G - y * y);
    return <ellipse key={i} cx={cx} cy={cy + y} rx={w} ry={w * 0.16} fill="none" stroke="rgba(216,185,120,.2)" strokeWidth=".8" />;
  });

  return (
    <svg viewBox="0 0 280 280" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="core" cx="42%" cy="36%">
          <stop offset="0%" stopColor="rgba(242,226,187,.30)" />
          <stop offset="60%" stopColor="rgba(216,185,120,.06)" />
          <stop offset="100%" stopColor="rgba(216,185,120,0)" />
        </radialGradient>
        <linearGradient id="arc" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(216,185,120,0)" />
          <stop offset="60%" stopColor="rgba(216,185,120,.75)" />
          <stop offset="100%" stopColor="rgba(242,226,187,.95)" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,.07)" />
      <circle cx={cx} cy={cy} r={R - 22} fill="none" stroke="rgba(255,255,255,.05)" strokeDasharray="1 6" />
      {ticks}

      <circle cx={cx} cy={cy} r={G + 26} fill="url(#core)" />

      {/* โลกลวดตาข่าย */}
      <circle cx={cx} cy={cy} r={G} fill="rgba(10,14,24,.55)" stroke="rgba(216,185,120,.45)" strokeWidth="1" />
      {meridians}
      <line x1={cx} y1={cy - G} x2={cx} y2={cy + G} stroke="rgba(216,185,120,.26)" strokeWidth=".8" />
      {parallels}

      {/* ส่วนโค้งกวาด */}
      {live && (
        <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "spin 9s linear infinite" }}>
          <path d={`M ${cx} ${cy - G - 12} A ${G + 12} ${G + 12} 0 0 1 ${cx + G + 12} ${cy}`}
            fill="none" stroke="url(#arc)" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* วงโคจรเอียงพร้อมวัตถุ */}
      <g transform={`rotate(-18 ${cx} ${cy})`}>
        <ellipse cx={cx} cy={cy} rx={R - 16} ry={40} fill="none" stroke="rgba(148,167,198,.22)" strokeWidth=".8" />
      </g>
      <g style={live ? { transformOrigin: `${cx}px ${cy}px`, animation: "spin 26s linear infinite" } : undefined}>
        <circle cx={cx + R - 16} cy={cy} r="2.4" fill="#F2E2BB" />
      </g>
    </svg>
  );
}

function Wordmark({ size = 30, gap = 12 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="12" fill="none" stroke="rgba(216,185,120,.75)" strokeWidth="1.2" />
        <ellipse cx="20" cy="20" rx="4.5" ry="12" fill="none" stroke="rgba(216,185,120,.45)" strokeWidth="1" />
        <line x1="8" y1="20" x2="32" y2="20" stroke="rgba(216,185,120,.45)" strokeWidth="1" />
        <g transform="rotate(-20 20 20)"><ellipse cx="20" cy="20" rx="18.5" ry="6.5" fill="none" stroke="rgba(242,226,187,.6)" strokeWidth="1.1" /></g>
      </svg>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1 }}>Aegis Orbit</div>
        <div className="dim" style={{ marginTop: 3, fontSize: 11 }}>Gold intelligence</div>
      </div>
    </div>
  );
}

/* ---------- market data (ผ่าน backend, มี cache ฝั่งเซิร์ฟเวอร์) ---------- */
function useFetch(path, eager = true) {
  const [data, setData] = useState(null);
  const [state, setState] = useState(eager ? "loading" : "idle");
  const load = useCallback(async () => {
    setState("loading");
    try { setData(await api(path)); setState("live"); } catch { setData(null); setState("offline"); }
  }, [path]);
  useEffect(() => { if (eager) load(); }, [load, eager]);
  return { data, state, reload: load, load };
}
const useOutlook = (eager) => useFetch("/api/market/outlook", eager);
const useCalendar = (eager) => useFetch("/api/market/calendar", eager);
const useNews = () => useFetch("/api/market/news", false);

/* ============================ APP ============================ */
export default function AegisOrbit() {
  const [screen, setScreen] = useState("boot");
  const [tab, setTab] = useState("scan");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [paywall, setPaywall] = useState(false);
  const [selPlan, setSelPlan] = useState("year");
  const [marketView, setMarketView] = useState("outlook");
  const [pendingPay, setPendingPay] = useState(null);
  const gate = useAdminGate();
  // Market endpoints intentionally require an authenticated session. Do not
  // issue them while the login screen is mounted, which avoids expected 401s
  // being reported as failed resources in the browser console.
  const canLoadMarket = screen === "app" && !!user?.phone;
  const outlook = useOutlook(canLoadMarket);
  const calendar = useCalendar(canLoadMarket);
  const newsFeed = useNews();

  const say = useCallback((t) => { setToast(t); setTimeout(() => setToast(null), 2400); }, []);
  const isAdmin = role === "admin";
  const active = planActive(user);
  const plan = active ? PLANS.find((p) => p.id === user.plan) || null : null;
  const marketLocked = !!outlook.data?.locked;
  const unlimited = isAdmin || (!!plan && plan.quota === null);
  const isPro = isAdmin || (!!plan && PRO_PLANS.includes(plan.id));
  const left = user?.left ?? 0;

  /* โควตาถูกตัดที่เซิร์ฟเวอร์ /api/scan — ฝั่งนี้แค่รับผลกลับมาอัปเดตหน้าจอ */
  const onScanResult = (r) => { if (!isAdmin) setUser((u) => ({ ...u, left: r.left, scans: (u?.scans || 0) + 1 })); };
  const onQuotaExhausted = () => setPaywall(true);

  /* รีเฟรชบัญชีจากฐานข้อมูล ใช้หลังแอดมินอนุมัติสลิป */
  const syncUser = useCallback(async () => {
    if (!user || isAdmin) return;
    try {
      const r = await api("/api/auth/me");
      if (!r?.user?.phone) throw new Error("invalid auth response");
      setUser(r.user); setPendingPay(r.pending || null);
      return { rec: r.user, last: r.last || null };
    } catch (e) { if (e.status === 401) logout(); }
  }, [user, isAdmin]); // eslint-disable-line

  useEffect(() => { if (screen === "app" && (tab === "me" || tab === "scan")) syncUser(); }, [tab, screen]); // eslint-disable-line

  /* กู้เซสชันจากคุกกี้ตอนเปิดเว็บ */
  const restoreSession = useCallback(async () => {
    try {
      const r = await api("/api/auth/me");
      if (!r?.user?.phone || !r?.role) throw new Error("invalid auth response");
      setUser(r.user); setRole(r.role); setPendingPay(r.pending || null); setScreen("app");
    } catch { setUser(null); setRole("user"); setScreen("auth"); }
  }, []);

  // A malformed or interrupted auth response must return to login instead of
  // rendering account/payment components with an undefined user object.
  useEffect(() => {
    if ((screen === "app" || screen === "pay") && !user?.phone) setScreen("auth");
  }, [screen, user]);

  /* ระหว่างมีสลิปรอตรวจ ให้เช็คสถานะเองทุก 15 วินาที พออนุมัติปุ๊บแพ็กเกจเปิดทันทีโดยลูกค้าไม่ต้องกดอะไร */
  useEffect(() => {
    if (!pendingPay || isAdmin || screen !== "app") return;
    const iv = setInterval(async () => {
      try {
        const r = await api("/api/auth/me");
        if (!r?.user?.phone) throw new Error("invalid auth response");
        setUser(r.user); setPendingPay(r.pending || null);
        if (!r.pending && r.user?.plan) say("ยืนยันสลิปแล้ว แพ็กเกจเปิดใช้งานทันที");
        else if (!r.pending && r.last?.status === "rejected") say("สลิปถูกปฏิเสธ ติดต่อทีมงาน");
      } catch { /* เงียบไว้ ไม่รบกวนผู้ใช้ */ }
    }, 15000);
    return () => clearInterval(iv);
  }, [pendingPay, isAdmin, screen, say]);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return (calendar.data?.events || []).filter((e) => new Date(e.at).getTime() > now).sort((a, b) => new Date(a.at) - new Date(b.at))[0] || null;
  }, [calendar.data]);

  const logout = () => { api("/api/auth/logout", {}).catch(() => {}); setUser(null); setRole("user"); setHistory([]); setPendingPay(null); setTab("scan"); setScreen("auth"); };

  return (
    <div className="ao">
      <style>{CSS}</style>
      <div className="shell">
        <div className="sky"><div className="layer l1" /><div className="layer l2" /></div>

        {screen === "boot" && <Boot onDone={restoreSession} />}
        {screen === "auth" && <Auth say={say} gate={gate} onDone={(rec, r) => {
          if (!rec?.phone) return say("ข้อมูลบัญชีไม่สมบูรณ์ กรุณาลองเข้าสู่ระบบใหม่");
          setUser(rec); setRole(r); setScreen("app"); setTab("scan");
        }} />}

        {screen === "app" && user?.phone && (
          <>
            <Header user={user} plan={plan} left={left} unlimited={unlimited} isAdmin={isAdmin} onPro={() => setTab(isAdmin ? "admin" : "plans")} />
            <div className="body">
              {tab === "scan" && <ScanTab plan={plan} left={left} unlimited={unlimited} onResult={onScanResult} onQuota={onQuotaExhausted} isPro={isPro} spot={outlook.data?.spot}
                say={say} nextEvent={nextEvent} onNews={() => { setMarketView("cal"); setTab("market"); }}
                onSaved={(h) => setHistory((x) => [h, ...x])} onUpgrade={() => setTab("plans")} />}
              {tab === "market" && <MarketTab outlook={outlook} calendar={calendar} newsFeed={newsFeed} view={marketView} setView={setMarketView} isPro={isPro && !marketLocked} onUpgrade={() => setTab("plans")} />}
              {tab === "hist" && <HistoryTab items={history} onScan={() => setTab("scan")} />}
              {tab === "plans" && <PlansTab sel={selPlan} setSel={setSelPlan} plan={plan} user={user} pendingPay={pendingPay} onPay={() => setScreen("pay")} />}
              {tab === "admin" && isAdmin && <AdminTab say={say} />}
              {tab === "me" && <AccountTab user={user} plan={plan} left={left} unlimited={unlimited} isAdmin={isAdmin} isPro={isPro} scans={history.length} pendingPay={pendingPay}
                onSync={async () => { const r = await syncUser(); say(r?.rec && r.rec.plan ? "แพ็กเกจเปิดใช้งานแล้ว" : r?.last?.status === "rejected" ? "สลิปล่าสุดถูกปฏิเสธ ติดต่อทีมงาน" : "ยังไม่มีการเปลี่ยนแปลง"); }}
                onPro={() => setTab("plans")} onChat={() => setTab("chat")} say={say} onOut={logout} />}
              {tab === "chat" && <ChatTab />}
            </div>
            {tab !== "chat" && (
              <button className="fab" onClick={() => setTab("chat")} aria-label="ติดต่อทีมงาน"><Ico.chat style={{ width: 20, height: 20 }} /></button>
            )}
            <Nav tab={tab} setTab={setTab} hot={nextEvent?.impact === "high"} isAdmin={isAdmin} />
          </>
        )}

        {screen === "pay" && user?.phone && (
          <PayScreen plan={PLANS.find((p) => p.id === selPlan)} user={user} say={say} onBack={() => { setScreen("app"); setTab("me"); }}
            onSubmitted={(rec) => setPendingPay(rec)} />
        )}

        {paywall && (
          <div className="sheet" onClick={() => setPaywall(false)}>
            <div className="inner" onClick={(e) => e.stopPropagation()}>
              <div className="eyebrow mono" style={{ marginBottom: 14 }}>โควตาหมด</div>
              <h1 style={{ fontSize: 22 }}>{plan ? `${planTitle(plan)} ใช้ครบ ${plan.quota} ครั้งแล้ว` : "ใช้สิทธิ์ทดลองครบแล้ว"}</h1>
              <p style={{ marginBottom: 20 }}>{plan?.id === "day" ? "ต่ออายุ Starter อีกครั้ง หรืออัปเกรดเป็น Pro เพื่อสแกนไม่จำกัดพร้อมบทวิเคราะห์ข่าว" : "เลือกแพ็กเกจเพื่อใช้งานต่อ Pro สแกนได้ไม่จำกัด"}</p>
              <button className="btn" onClick={() => { setPaywall(false); setTab("plans"); }}>ดูแพ็กเกจ</button>
              <button className="btn ghost" style={{ marginTop: 10, width: "100%" }} onClick={() => setPaywall(false)}>ไว้ก่อน</button>
            </div>
          </div>
        )}

        {gate.open && !isAdmin && (
          <AdminGate say={say} onClose={() => gate.setOpen(false)}
            onDone={(rec, r) => {
              if (!rec?.phone) return say("ข้อมูลบัญชีผู้ดูแลไม่สมบูรณ์");
              gate.setOpen(false); setUser(rec); setRole(r); setScreen("app"); setTab("admin");
            }} />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
/* ---------- BOOT ---------- */
const BOOT = [
  ["เชื่อมต่อฟีดราคา XAU/USD", "OK"],
  ["ซิงก์ปฏิทินเศรษฐกิจสหรัฐ", "OK"],
  ["โหลดโมเดลโครงสร้างราคา", "v3.0"],
  ["ตรวจสอบการเข้ารหัส", "AES-256"],
];

function Boot({ onDone }) {
  const [n, setN] = useState(0);
  const [prog, setProg] = useState(0);
  useTick(1000);
  useEffect(() => {
    const ts = [];
    BOOT.forEach((_, i) => ts.push(setTimeout(() => { setN(i + 1); setProg(Math.round(((i + 1) / BOOT.length) * 100)); }, 520 * i + 900)));
    ts.push(setTimeout(onDone, 520 * BOOT.length + 1500));
    return () => ts.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", padding: "20px 22px 24px" }}>
      <div className="mono" style={{ display: "flex", color: "var(--muted)" }}>
        <span>BANGKOK · GMT+7</span><span style={{ marginLeft: "auto" }}>{clock()}</span>
      </div>
      <div className="rule" style={{ marginTop: 10 }} />

      <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", width: "100%" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 4 }}>
            <Instrument size={252} />
          </div>

          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.1 }}>Aegis Orbit</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px auto 0", maxWidth: 260 }}>
            <span style={{ flex: 1, height: 1, background: "rgba(216,185,120,.3)" }} />
            <span className="eyebrow">Chart intelligence</span>
            <span style={{ flex: 1, height: 1, background: "rgba(216,185,120,.3)" }} />
          </div>

          <p style={{ maxWidth: 280, margin: "16px auto 0", textAlign: "center" }}>
            อ่านโครงสร้างราคาจากภาพกราฟ ประเมินแนวรับแนวต้าน และเฝ้าปฏิทินข่าวที่กระทบทองคำ
          </p>

          {/* เส้นราคาประกอบ */}
          <svg viewBox="0 0 300 46" width="100%" height="46" style={{ marginTop: 22, opacity: .9 }}>
            <path className="draw" d="M0 34 L26 30 L48 36 L72 22 L96 27 L120 14 L146 19 L170 9 L196 16 L222 6 L250 12 L276 3 L300 8"
              fill="none" stroke="rgba(216,185,120,.7)" strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="0" y1="44" x2="300" y2="44" stroke="rgba(255,255,255,.07)" />
          </svg>
        </div>
      </div>

      <div className="log">
        {BOOT.map(([label, val], i) => (
          <div className="logrow" key={i} style={{ opacity: i < n ? 1 : .25, transition: "opacity .4s" }}>
            <Ico.check style={{ width: 13, height: 13, color: i < n ? "var(--brass)" : "transparent", flex: "none" }} />
            <span style={{ fontSize: 12.5, color: "var(--ice)" }}>{label}</span>
            <span className="mono" style={{ color: "var(--muted)" }}>{i < n ? val : "···"}</span>
          </div>
        ))}
      </div>

      <div className="prog" style={{ marginTop: 14 }}><i style={{ width: prog + "%" }} /></div>
      <div className="mono" style={{ display: "flex", color: "var(--muted)", marginTop: 10 }}>
        <span>เวอร์ชัน 3.0</span><span style={{ marginLeft: "auto" }}>{prog}%</span>
      </div>
    </div>
  );
}

/* ---------- ประตูหลังบ้าน: F7 บนคอม / แตะโลโก้ 5 ครั้งบนมือถือ ---------- */
function useAdminGate() {
  const [open, setOpen] = useState(false);
  const taps = useRef({ n: 0, t: 0 });
  useEffect(() => {
    const onKey = (e) => { if (e.key === "F7") { e.preventDefault(); setOpen(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tap = () => {
    const now = Date.now();
    taps.current = now - taps.current.t > 900 ? { n: 1, t: now } : { n: taps.current.n + 1, t: now };
    if (taps.current.n >= 5) { taps.current = { n: 0, t: 0 }; setOpen(true); }
  };
  return { open, setOpen, tap };
}

function AdminGate({ onDone, onClose, say }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const t = setTimeout(() => ref.current?.focus(), 120); return () => clearTimeout(t); }, []);
  const submit = async () => {
    if (!pw) return setErr("ใส่รหัสผ่าน");
    setBusy(true); setErr("");
    try { const r = await api("/api/auth/admin", { password: pw }); onDone(r.user, r.role); say("เข้าสู่ระบบผู้ดูแล"); }
    catch (e) { setErr(e.message); setPw(""); } finally { setBusy(false); }
  };
  return (
    <div className="sheet" onClick={onClose}>
      <div className="inner" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>เจ้าหน้าที่เท่านั้น</div>
        <h1 style={{ fontSize: 22 }}>เข้าระบบหลังบ้าน</h1>
        <p style={{ marginBottom: 18 }}>ใส่รหัสผู้ดูแลเพื่อดูข้อมูลลูกค้าและยืนยันสลิป</p>
        <div className="inwrap" style={{ marginBottom: 12 }}>
          <Ico.key style={{ width: 16, height: 16, color: "var(--ter)", flex: "none" }} />
          <input ref={ref} type="password" inputMode="numeric" value={pw} placeholder="รหัสผู้ดูแล"
            onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {err && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <button className="btn" onClick={submit} disabled={busy}>{busy ? "กำลังตรวจสอบ" : "เข้าสู่ระบบ"}</button>
        <button className="btn ghost" style={{ marginTop: 10, width: "100%" }} onClick={onClose}>ยกเลิก</button>
      </div>
    </div>
  );
}

/* ---------- AUTH: สมัครด้วยเบอร์ + ยืนยัน OTP ทาง SMS ---------- */
function OtpBoxes({ value, onChange, onComplete }) {
  const ref = useRef(null);
  const cells = Array.from({ length: 6 });
  return (
    <div style={{ position: "relative" }} onClick={() => ref.current?.focus()}>
      <input
        ref={ref} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); onChange(v); if (v.length === 6) onComplete?.(v); }}
        style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", zIndex: 2, fontSize: 16 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        {cells.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 58, borderRadius: 14, display: "grid", placeItems: "center",
            background: "var(--s1)", border: `1px solid ${i === value.length ? "var(--gold)" : "transparent"}`,
          }}>
            <span className="num" style={{ fontSize: 24 }}>{value[i] || ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Auth({ onDone, say, gate }) {
  const [mode, setMode] = useState("login");       // login | register | reset
  const [step, setStep] = useState("phone");       // phone | otp | password
  const [phone, setPhone] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [code, setCode] = useState(""); const [invite, setInvite] = useState(""); const [agree, setAgree] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0); const [devCode, setDevCode] = useState("");
  const [fails, setFails] = useState(0); const [lockUntil, setLockUntil] = useState(0);
  useTick(1000);

  const okPhone = isThaiMobile(phone);
  const strength = pwStrength(pw);
  const locked = lockUntil > Date.now();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const toMode = (m) => { setMode(m); setStep("phone"); setErr(""); setCode(""); setPw(""); setPw2(""); setDevCode(""); };

  const requestOtp = async (resend) => {
    setErr("");
    if (!okPhone) return setErr("กรอกเบอร์มือถือไทย 10 หลัก ขึ้นต้น 06 08 หรือ 09");
    setBusy(true);
    try {
      const r = await api("/api/auth/otp/request", { phone, purpose: mode === "reset" ? "reset" : "register" });
      setStep("otp"); setCode(""); setResendIn(r.resendIn || 60);
      if (r.devCode) { setDevCode(r.devCode); say(`โหมดทดสอบ รหัสคือ ${r.devCode}`); }
      else say(resend ? "ส่งรหัสใหม่แล้ว" : `ส่งรหัสไปที่ ${phone} แล้ว`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const verifyOtp = async (value) => {
    const c = value || code;
    setErr("");
    if (!/^\d{6}$/.test(c)) return setErr("กรอกรหัส 6 หลัก");
    setBusy(true);
    try { await api("/api/auth/otp/verify", { phone, code: c }); setStep("password"); say("ยืนยันเบอร์เรียบร้อย"); }
    catch (e) { setErr(e.message); setCode(""); } finally { setBusy(false); }
  };

  const finish = async () => {
    setErr("");
    if (strength !== "ok") return setErr("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว และมีทั้งตัวอักษรกับตัวเลข");
    if (pw !== pw2) return setErr("รหัสผ่านสองช่องไม่ตรงกัน");
    if (mode === "register" && !agree) return setErr("กรุณายอมรับข้อตกลงและคำเตือนความเสี่ยงก่อน");
    setBusy(true);
    try {
      const r = mode === "reset"
        ? await api("/api/auth/reset", { phone, password: pw })
        : await api("/api/auth/register", { phone, password: pw, invite: invite.trim() || null });
      onDone(r.user, r.role);
      say(mode === "reset" ? "ตั้งรหัสผ่านใหม่แล้ว" : r.user.plan === "day" ? "เปิดบัญชีแล้ว รับสิทธิ์ Starter 30 ครั้ง" : `เปิดบัญชีแล้ว ทดลองสแกนได้ ${FREE_SCANS} ครั้ง`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const login = async () => {
    if (locked) return;
    setErr("");
    if (!okPhone) return setErr("กรอกเบอร์มือถือ 10 หลัก");
    if (!pw) return setErr("กรอกรหัสผ่าน");
    setBusy(true);
    try { const r = await api("/api/auth/login", { phone, password: pw }); onDone(r.user, r.role); say(r.role === "admin" ? "เข้าสู่ระบบผู้ดูแล" : "ยินดีต้อนรับกลับ"); }
    catch (e) {
      if (e.status === 401) { const n = fails + 1; setFails(n); if (n >= 5) { setLockUntil(Date.now() + 60000); setFails(0); } setErr(e.message); }
      else if (e.status === 429) { setLockUntil(Date.now() + 60000); setErr(e.message); }
      else setErr(e.message);
    } finally { setBusy(false); }
  };

  const secLeft = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
  const title = mode === "login" ? "ยินดีต้อนรับกลับ"
    : mode === "reset" ? (step === "password" ? "ตั้งรหัสผ่านใหม่" : "ลืมรหัสผ่าน")
    : step === "phone" ? "เปิดบัญชีใช้งาน" : step === "otp" ? "ยืนยันเบอร์โทร" : "ตั้งรหัสผ่าน";

  return (
    <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", padding: "20px 22px 28px", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span onClick={gate.tap}><Wordmark size={32} /></span>
        <div className="mono" style={{ marginLeft: "auto", color: "var(--ter)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--up)" }} />ONLINE
        </div>
      </div>
      <div className="rule" style={{ margin: "16px 0 20px" }} />

      {mode !== "reset" && (
        <div className="tabs">
          <button className={mode === "login" ? "on" : ""} onClick={() => toMode("login")}>เข้าสู่ระบบ</button>
          <button className={mode === "register" ? "on" : ""} onClick={() => toMode("register")}>เปิดบัญชีใหม่</button>
        </div>
      )}

      {mode !== "login" && step !== "phone" && (
        <button onClick={() => { setStep(step === "password" ? "otp" : "phone"); setErr(""); }}
          style={{ background: "none", display: "flex", alignItems: "center", gap: 6, color: "var(--ter)", fontSize: 13, marginBottom: 14, padding: 0 }}>
          <Ico.back style={{ width: 15, height: 15 }} />ย้อนกลับ
        </button>
      )}

      <h1>{title}</h1>
      <p style={{ marginBottom: 20 }}>
        {mode === "login" ? "ใช้เบอร์โทรและรหัสผ่านที่ตั้งไว้"
          : step === "phone" ? "กรอกเบอร์มือถือ ระบบจะส่งรหัสยืนยัน 6 หลักไปทาง SMS"
          : step === "otp" ? `ส่งรหัส 6 หลักไปที่ ${phone} แล้ว รหัสมีอายุ 5 นาที`
          : mode === "reset" ? "ตั้งรหัสผ่านใหม่สำหรับบัญชีนี้"
          : `ตั้งรหัสผ่านเพื่อเปิดบัญชี ทดลองสแกนได้ ${FREE_SCANS} ครั้ง`}
      </p>

      {/* ── ขั้นที่ 1 เบอร์โทร ── */}
      {(mode === "login" || step === "phone") && (
        <div className="field">
          <label className="label">เบอร์โทรศัพท์</label>
          <div className="inwrap">
            <Ico.phone style={{ width: 16, height: 16, color: "var(--ter)", flex: "none" }} />
            <span className="pre">+66</span>
            <input inputMode="numeric" maxLength={10} value={phone} placeholder="08xxxxxxxx" autoComplete="tel"
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
            {okPhone && <Ico.check style={{ width: 15, height: 15, color: "var(--gold)", flex: "none" }} />}
          </div>
        </div>
      )}

      {/* ── เข้าสู่ระบบ ── */}
      {mode === "login" && (
        <div className="field">
          <label className="label">รหัสผ่าน</label>
          <div className="inwrap">
            <Ico.lock style={{ width: 16, height: 16, color: "var(--ter)", flex: "none" }} />
            <input type="password" value={pw} placeholder="รหัสผ่าน" autoComplete="current-password"
              onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
          </div>
        </div>
      )}

      {/* ── ขั้นที่ 2 รหัส OTP ── */}
      {mode !== "login" && step === "otp" && (
        <>
          <OtpBoxes value={code} onChange={setCode} onComplete={(v) => verifyOtp(v)} />
          {devCode && (
            <div className="card tight" style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <Ico.bolt style={{ width: 15, height: 15, color: "var(--gold)", flex: "none" }} />
              <p style={{ flex: 1, fontSize: 12.5 }}>โหมดทดสอบ ยังไม่ได้ต่อ SMS จริง รหัสคือ <span className="num" style={{ fontSize: 15, color: "var(--gold2)" }}>{devCode}</span></p>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
            <span className="dim">ไม่ได้รับรหัส</span>
            <button disabled={resendIn > 0 || busy} onClick={() => requestOtp(true)}
              style={{ marginLeft: "auto", background: "none", color: resendIn > 0 ? "var(--ter)" : "var(--gold2)", fontSize: 13, fontWeight: 500, padding: 0 }}>
              {resendIn > 0 ? `ขอรหัสใหม่ได้ในอีก ${resendIn} วินาที` : "ส่งรหัสอีกครั้ง"}
            </button>
          </div>
        </>
      )}

      {/* ── ขั้นที่ 3 ตั้งรหัสผ่าน ── */}
      {mode !== "login" && step === "password" && (
        <>
          <div className="field">
            <label className="label">รหัสผ่าน</label>
            <div className="inwrap">
              <Ico.lock style={{ width: 16, height: 16, color: "var(--ter)", flex: "none" }} />
              <input type="password" value={pw} placeholder="อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข" autoComplete="new-password" onChange={(e) => setPw(e.target.value)} />
            </div>
            {pw && (
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ flex: 1, height: 2, borderRadius: 2,
                    background: (strength === "ok" ? 3 : strength === "weak" ? 2 : 1) > i ? (strength === "ok" ? "var(--green)" : "var(--gold)") : "rgba(255,255,255,.08)" }} />
                ))}
              </div>
            )}
          </div>
          <div className="field">
            <label className="label">ยืนยันรหัสผ่าน</label>
            <div className="inwrap">
              <Ico.lock style={{ width: 16, height: 16, color: "var(--ter)", flex: "none" }} />
              <input type="password" value={pw2} placeholder="พิมพ์รหัสผ่านอีกครั้ง" autoComplete="new-password"
                onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && finish()} />
              {pw2 && pw2 === pw && <Ico.check style={{ width: 15, height: 15, color: "var(--gold)", flex: "none" }} />}
            </div>
          </div>
          {mode === "register" && (
            <>
              <div className="field">
                <label className="label">รหัสเชิญ (ถ้ามี) — รับสิทธิ์ Starter 30 ครั้งฟรี</label>
                <div className="inwrap">
                  <Ico.key style={{ width: 16, height: 16, color: "var(--ter)", flex: "none" }} />
                  <input value={invite} placeholder="ไม่บังคับ" style={{ letterSpacing: ".1em" }} onChange={(e) => setInvite(e.target.value.toUpperCase())} />
                </div>
              </div>
              <label style={{ display: "flex", gap: 11, alignItems: "flex-start", margin: "4px 0 16px" }}>
                <span onClick={() => setAgree(!agree)} style={{ width: 18, height: 18, flex: "none", borderRadius: 5, marginTop: 2, display: "grid", placeItems: "center",
                  border: `1px solid ${agree ? "var(--gold)" : "var(--sep)"}`, background: agree ? "rgba(224,185,107,.15)" : "transparent" }}>
                  {agree && <Ico.check style={{ width: 12, height: 12, color: "var(--gold)" }} />}
                </span>
                <span className="dim" onClick={() => setAgree(!agree)} style={{ lineHeight: 1.6 }}>
                  ข้าพเจ้าเข้าใจว่า AEGIS ORBIT เป็นเครื่องมือช่วยวิเคราะห์ ไม่ใช่คำแนะนำการลงทุน และการเทรดมีความเสี่ยงที่จะสูญเสียเงินทุน
                </span>
              </label>
            </>
          )}
        </>
      )}

      {err && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      {locked && mode === "login" && <div style={{ color: "var(--gold)", fontSize: 12.5, marginBottom: 12 }}>ลองใหม่ได้ในอีก {secLeft} วินาที</div>}

      <button className="btn" disabled={busy || (mode === "login" && locked)}
        onClick={() => mode === "login" ? login() : step === "phone" ? requestOtp(false) : step === "otp" ? verifyOtp() : finish()}>
        {busy ? "กำลังดำเนินการ"
          : mode === "login" ? "เข้าสู่ระบบ"
          : step === "phone" ? "ส่งรหัสยืนยัน"
          : step === "otp" ? "ยืนยันรหัส"
          : mode === "reset" ? "บันทึกรหัสผ่านใหม่" : "เปิดบัญชี"}
      </button>

      {mode === "login" && (
        <button style={{ background: "none", marginTop: 16, color: "var(--ter)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}
          onClick={() => toMode("reset")}>ลืมรหัสผ่าน</button>
      )}
      {mode === "reset" && step === "phone" && (
        <button className="btn ghost" style={{ marginTop: 10, width: "100%" }} onClick={() => toMode("login")}>กลับไปเข้าสู่ระบบ</button>
      )}

      <div style={{ display: "flex", marginTop: 24, borderTop: "1px solid var(--sep2)", paddingTop: 14 }}>
        {["ยืนยันด้วย SMS", "ไม่ใช้อีเมล", "รหัสผ่านเข้ารหัส"].map((t, i) => (
          <div key={t} className="dim" style={{ flex: 1, textAlign: i === 0 ? "left" : i === 1 ? "center" : "right", fontSize: 11 }}>{t}</div>
        ))}
      </div>
      <p className="dim" style={{ marginTop: "auto", paddingTop: 22, fontSize: 11 }}>
        การตัดสินใจเทรดและความเสี่ยงทั้งหมดเป็นของผู้ใช้ ผลวิเคราะห์ในแอปเป็นข้อมูลประกอบเท่านั้น
      </p>
    </div>
  );
}

/* ---------- header / nav ---------- */
function Header({ user, plan, left, unlimited, isAdmin, onPro }) {
  return (
    <>
      <div className="strip">
        <Wordmark size={28} gap={10} />
        <button onClick={onPro} className="badge br" style={{ marginLeft: "auto", background: "none" }}>
          {isAdmin ? "ผู้ดูแลระบบ" : !plan ? `ทดลอง ${left}/${FREE_SCANS}` : unlimited ? plan.label : `${plan.label} ${left}/${plan.quota}`}
        </button>
      </div>
      <div className="rule" style={{ margin: "0 20px 16px" }} />
    </>
  );
}

function Nav({ tab, setTab, hot, isAdmin }) {
  const items = [["scan", "สแกน", Ico.scan], ["market", "ตลาดทอง", Ico.chart], ["hist", "ประวัติ", Ico.hist], ["plans", "แพ็กเกจ", Ico.crown]];
  if (isAdmin) items.push(["admin", "หลังบ้าน", Ico.key]);
  items.push(["me", "บัญชี", Ico.user]);
  return (
    <div className="nav" style={{ gridTemplateColumns: `repeat(${items.length},1fr)` }}>
      {items.map(([k, label, I]) => (
        <button key={k} className={"navb" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
          <I className="navi" />{k === "market" && hot && <span className="dot" />}<span>{label}</span>
        </button>
      ))}
    </div>
  );
}


/* ---------- market ---------- */
const IMP = { high: { c: "var(--down)", t: "ผลกระทบสูง" }, medium: { c: "var(--brass)", t: "ปานกลาง" }, low: { c: "var(--muted)", t: "ต่ำ" } };

function countdown(iso) {
  const d = new Date(iso).getTime() - Date.now();
  if (d <= 0) return "ประกาศแล้ว";
  const h = Math.floor(d / 36e5), m = Math.floor((d % 36e5) / 6e4);
  if (h >= 24) return `อีก ${Math.floor(h / 24)} วัน ${h % 24} ชม.`;
  return `อีก ${h} ชม. ${pad(m)} นาที`;
}

function useEdge(event, enabled) {
  const [data, setData] = useState(null);
  const [state, setState] = useState("idle");
  const keyRef = useRef(null);
  const load = useCallback(async () => {
    if (!event) return;
    setState("loading"); keyRef.current = event.at + event.title;
    try {
      const p = await api("/api/market/edge", { title: event.title, at: event.at });
      if (typeof p.up !== "number") throw new Error("empty");
      setData(p); setState("live");
    } catch { setData(null); setState("offline"); }
  }, [event]);
  useEffect(() => {
    if (enabled && event && keyRef.current !== event.at + event.title && state !== "loading") load();
  }, [enabled, event, load, state]);
  return { data, state, reload: load };
}

function ProbBar({ up, height = 8 }) {
  const u = Math.max(0, Math.min(100, Math.round(up)));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "var(--up)", fontSize: 13 }}>ขึ้น <span className="num" style={{ fontSize: 22 }}>{u}%</span></span>
        <span style={{ color: "var(--down)", fontSize: 13, textAlign: "right" }}>ลง <span className="num" style={{ fontSize: 22 }}>{100 - u}%</span></span>
      </div>
      <div style={{ display: "flex", height, borderRadius: height, overflow: "hidden", background: "rgba(255,255,255,.06)" }}>
        <div style={{ width: `${u}%`, background: "linear-gradient(90deg,#3FA882,#57C99A)", transition: "width .6s ease" }} />
        <div style={{ flex: 1, background: "linear-gradient(90deg,#E36A82,#B94A62)" }} />
      </div>
    </div>
  );
}

function LockedCard({ title, lines, onUpgrade, event }) {
  return (
    <div className="card brass" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--goldBg)", display: "grid", placeItems: "center", flex: "none" }}>
          <Ico.lock style={{ width: 18, height: 18, color: "var(--gold)" }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
          <div className="dim">สำหรับสมาชิก Pro</div>
        </div>
      </div>
      {event && (
        <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(0,0,0,.28)", marginBottom: 14 }}>
          <div className="dim" style={{ marginBottom: 4 }}>ข่าวแรงตัวถัดไป</div>
          <div style={{ fontSize: 14.5, fontWeight: 500 }}>{event.title}</div>
          <div className="mono" style={{ color: "var(--ter)", marginTop: 4 }}>{countdown(event.at)}</div>
        </div>
      )}
      {(lines || []).map((t) => (
        <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0" }}>
          <Ico.check style={{ width: 15, height: 15, color: "var(--gold)", flex: "none", marginTop: 3 }} />
          <p>{t}</p>
        </div>
      ))}
      <button className="btn" style={{ marginTop: 14 }} onClick={onUpgrade}>ดูแพ็กเกจ Pro</button>
      <p className="dim" style={{ textAlign: "center", marginTop: 10 }}>ปฏิทินข่าวและพาดหัวข่าวเปิดให้ทุกบัญชี</p>
    </div>
  );
}

function EdgeCard({ event, edge, onUpgrade, isPro }) {
  if (!event) return null;
  const im = IMP[event.impact] || IMP.low;
  const when = new Date(event.at).toLocaleString("th-TH", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  if (!isPro) return null;
  const d = edge.data;
  return (
    <div className="card brass" style={{ marginBottom: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>ก่อนข่าว · วางไม้ล่วงหน้า</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 2, alignSelf: "stretch", background: im.c }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15 }}>{event.title}</div>
          <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{when} · {countdown(event.at)}</div>
        </div>
      </div>
      {edge.state === "loading" && !d ? (
        <><div className="mono" style={{ color: "var(--brassDim)" }}>กำลังประเมินโอกาสก่อนข่าว</div><div className="prog" style={{ marginTop: 10 }}><i style={{ width: "45%" }} /></div></>
      ) : !d ? (
        <><p className="dim">ยังประเมินไม่ได้ในตอนนี้</p><button className="btn ghost sm" style={{ marginTop: 10 }} onClick={edge.reload}>ลองอีกครั้ง</button></>
      ) : (
        <>
          <ProbBar up={d.up} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <span className={"badge " + (d.edge === "buy" ? "up" : d.edge === "sell" ? "dn" : "")}>
              {d.edge === "buy" ? "ฝั่งซื้อได้เปรียบ" : d.edge === "sell" ? "ฝั่งขายได้เปรียบ" : "ยังไม่ชัดเจน"}
            </span>
            <span className="mono" style={{ color: "var(--muted)" }}>ความมั่นใจ {d.confidence === "high" ? "สูง" : d.confidence === "medium" ? "ปานกลาง" : "ต่ำ"}</span>
          </div>
          <div style={{ marginTop: 14 }}>
            {(d.why || []).map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < d.why.length - 1 ? "1px solid rgba(255,255,255,.05)" : 0 }}>
                <span className="num" style={{ color: "var(--brassDim)", fontSize: 15, lineHeight: 1.5 }}>{i + 1}</span>
                <p style={{ flex: 1 }}>{w}</p>
              </div>
            ))}
          </div>
          {d.play && <div style={{ marginTop: 14, padding: "12px 14px", borderLeft: "2px solid var(--brass)", background: "rgba(216,185,120,.06)" }}>
            <div className="dim" style={{ marginBottom: 4 }}>แนวทางวางไม้</div><p>{d.play}</p></div>}
          {d.risk && <p className="dim" style={{ marginTop: 12 }}>ระวัง: {d.risk}</p>}
        </>
      )}
    </div>
  );
}

/* แถวข่าว: กดดูคาดการณ์ทิศทางก่อนข่าวได้ทีละรายการ */
function EventRow({ e, isPro, onUpgrade }) {
  const [open, setOpen] = useState(false);
  const [pred, setPred] = useState(null);
  const [st, setSt] = useState("idle");
  const im = IMP[e.impact] || IMP.low;
  const future = new Date(e.at).getTime() > Date.now();
  const predictable = future && e.impact !== "low";

  const toggle = async () => {
    if (!isPro) return onUpgrade();
    const next = !open; setOpen(next);
    if (!next || pred || st === "loading") return;
    setSt("loading");
    try {
      const p = await api("/api/market/edge", { title: e.title, at: e.at });
      if (typeof p.up !== "number") throw new Error("empty");
      setPred(p); setSt("live");
    } catch { setSt("offline"); }
  };

  const cells = [
    ["ผลจริง", e.actual, e.actual && e.previous && parseFloat(e.actual) > parseFloat(e.previous) ? "var(--green)"
      : e.actual && e.previous && parseFloat(e.actual) < parseFloat(e.previous) ? "var(--red)" : "var(--label)"],
    ["คาดการณ์", e.forecast, "var(--label)"],
    ["ครั้งก่อน", e.previous, "var(--sec)"],
  ].filter(([, v], idx) => idx !== 0 || !!v);

  return (
    <div className="evt">
      <div className="imp" style={{ background: im.c }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span className="num" style={{ fontSize: 17 }}>{bkkTime(e.at)}</span>
          <span className="badge" style={{ borderColor: im.c, color: im.c }}>{im.t}</span>
          <span className="mono" style={{ marginLeft: "auto", color: "var(--muted)" }}>{e.ccy}</span>
        </div>
        <div style={{ fontSize: 14, margin: "8px 0 7px", lineHeight: 1.5 }}>{e.title}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {cells.map(([k, v, c]) => (
            <div key={k} style={{ flex: 1, padding: "7px 9px", borderRadius: 10, background: "rgba(255,255,255,.04)" }}>
              <div className="dim" style={{ fontSize: 10.5 }}>{k}</div>
              <div className="num" style={{ fontSize: 15, marginTop: 2, color: v ? c : "var(--ter)" }}>
                {v || (future ? "รอตัวเลข" : "—")}
              </div>
            </div>
          ))}
        </div>

        {e.effect && (isPro
          ? <p style={{ fontSize: 12.5 }}>{e.effect}</p>
          : <button onClick={onUpgrade} style={{ background: "none", padding: 0, display: "flex", gap: 6, alignItems: "center", color: "var(--goldDim)", fontSize: 12 }}>
              <Ico.lock style={{ width: 12, height: 12 }} />ผลต่อทองสำหรับสมาชิก Pro</button>)}

        <div className="mono" style={{ color: im.c, marginTop: 9 }}>{countdown(e.at)}</div>

        {predictable && (
          <button onClick={toggle} style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 12, textAlign: "left",
            background: open ? "rgba(224,185,107,.10)" : "rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: 8 }}>
            {!isPro && <Ico.lock style={{ width: 13, height: 13, color: "var(--gold)", flex: "none" }} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: isPro ? "var(--gold2)" : "var(--sec)" }}>
              {isPro ? "คาดการณ์ทิศทางก่อนข่าว" : "คาดการณ์ทิศทางก่อนข่าว · Pro"}
            </span>
            {isPro && pred && <span className="num" style={{ marginLeft: "auto", fontSize: 14, color: pred.up >= 50 ? "var(--green)" : "var(--red)" }}>
              ขึ้น {pred.up}%</span>}
            {isPro && !pred && <span style={{ marginLeft: "auto", color: "var(--ter)", fontSize: 12 }}>{open ? "ซ่อน" : "ดู"}</span>}
          </button>
        )}

        {open && isPro && (
          <div style={{ marginTop: 10 }}>
            {st === "loading" && !pred ? (
              <><div className="skel" style={{ width: "100%", height: 8 }} /><div className="skel" style={{ width: "80%", height: 12, marginTop: 10 }} /></>
            ) : !pred ? (
              <><p className="dim">ยังประเมินไม่ได้ในตอนนี้</p>
                <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => { setSt("idle"); setPred(null); toggle(); }}>ลองอีกครั้ง</button></>
            ) : (
              <>
                <ProbBar up={pred.up} />
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                  <span className={"badge " + (pred.edge === "buy" ? "up" : pred.edge === "sell" ? "dn" : "")}>
                    {pred.edge === "buy" ? "ฝั่งซื้อได้เปรียบ" : pred.edge === "sell" ? "ฝั่งขายได้เปรียบ" : "ยังไม่ชัดเจน"}
                  </span>
                  <span className="mono" style={{ color: "var(--ter)" }}>ความมั่นใจ {pred.confidence === "high" ? "สูง" : pred.confidence === "medium" ? "ปานกลาง" : "ต่ำ"}</span>
                </div>
                {(pred.why || []).map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0" }}>
                    <span className="num" style={{ color: "var(--goldDim)", fontSize: 14, lineHeight: 1.5 }}>{i + 1}</span>
                    <p style={{ flex: 1, fontSize: 12.5 }}>{w}</p>
                  </div>
                ))}
                {pred.play && <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(224,185,107,.08)" }}>
                  <div className="dim" style={{ marginBottom: 3 }}>แนวทางวางไม้</div><p style={{ fontSize: 12.5 }}>{pred.play}</p></div>}
                {pred.risk && <p className="dim" style={{ marginTop: 8 }}>ระวัง: {pred.risk}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketTab({ outlook, calendar, newsFeed, view, setView, isPro, onUpgrade }) {
  const [day, setDay] = useState(0);
  const [dayPicked, setDayPicked] = useState(false);
  useTick(30000);
  useEffect(() => { if (view === "news" && newsFeed.state === "idle") newsFeed.load(); }, [view, newsFeed]);

  const events = calendar.data?.events || [];
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const key = bkkKey(new Date(Date.now() + i * 864e5));
      const label = new Date(key + "T12:00:00+07:00");
      const list = events.filter((e) => bkkKey(e.at) === key).sort((a, b) => new Date(a.at) - new Date(b.at));
      return { key, d: label, list, hot: list.some((e) => e.impact === "high") };
    });
  }, [events]);
  const cur = days[day] || { list: [] };

  useEffect(() => {
    if (dayPicked) return;
    const i = days.findIndex((x) => x.list.length);
    if (i > 0) setDay(i);
  }, [days, dayPicked]);
  const nextHigh = useMemo(() => events.filter((e) => e.impact === "high" && new Date(e.at) > Date.now())
    .sort((a, b) => new Date(a.at) - new Date(b.at))[0] || null, [events]);
  const edge = useEdge(nextHigh, isPro && view === "outlook");

  const ok = outlook.data;
  const score = Math.max(-100, Math.min(100, Number(ok?.score ?? 0)));
  const up = typeof ok?.up === "number" ? ok.up : Math.round(50 + score / 2);
  const biasTxt = ok?.bias === "bull" ? "เอียงขึ้น" : ok?.bias === "bear" ? "เอียงลง" : "ไร้ทิศทางชัด";
  const biasCol = ok?.bias === "bull" ? "var(--up)" : ok?.bias === "bear" ? "var(--down)" : "var(--ice)";
  const refreshAll = () => { outlook.reload(); calendar.reload(); if (newsFeed.state !== "idle") newsFeed.load(); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div className="eyebrow mono" style={{ marginBottom: 7 }}>XAU/USD</div>
          <h1 style={{ margin: 0, fontSize: 23 }}>ภาวะตลาดทองคำ</h1>
        </div>
        <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={refreshAll}>รีเฟรช</button>
      </div>

      {ok?.spot ? (
        <div className="card tight" style={{ marginBottom: 16, display: "flex", alignItems: "flex-end", gap: 14 }}>
          <div>
            <div className="dim" style={{ marginBottom: 5 }}>ราคาสปอตล่าสุด</div>
            <div className="num" style={{ fontSize: 30, lineHeight: 1 }}>{ok.spot}<span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>USD/oz</span></div>
          </div>
          {ok.change && <span className={"badge " + (ok.dir === "up" ? "up" : ok.dir === "down" ? "dn" : "")} style={{ marginLeft: "auto" }}>{ok.change}</span>}
        </div>
      ) : outlook.state === "loading" ? (
        <div className="card tight" style={{ marginBottom: 16 }}><div className="skel" style={{ width: 90, height: 11 }} /><div className="skel" style={{ width: 150, height: 26, marginTop: 10 }} /></div>
      ) : (
        <div className="card tight" style={{ marginBottom: 16 }}><p className="dim">ยังไม่ได้ราคาสด กดรีเฟรชเพื่อดึงข้อมูลอีกครั้ง</p></div>
      )}

      <div className="pill">
        <button className={view === "outlook" ? "on" : ""} onClick={() => setView("outlook")}>แนวโน้ม</button>
        <button className={view === "cal" ? "on" : ""} onClick={() => setView("cal")}>ปฏิทินข่าว</button>
        <button className={view === "news" ? "on" : ""} onClick={() => setView("news")}>ข่าวล่าสุด</button>
      </div>

      {view === "outlook" && (
        !isPro ? (
          <LockedCard title="แนวโน้มและโอกาสก่อนข่าว" event={nextHigh} onUpgrade={onUpgrade}
            lines={["ทิศทางระยะสั้น พร้อมโอกาสขึ้น/ลงเป็นเปอร์เซ็นต์", "แนวรับแนวต้านและปัจจัยขับเคลื่อนจากข้อมูลสด", "ฝั่งไหนได้เปรียบก่อนข่าวแรง พร้อมเหตุผลและแนวทางวางไม้"]} />
        ) : ok ? (
          <>
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <h2 style={{ margin: 0 }}>แนวโน้มระยะสั้น</h2>
                <span className="mono" style={{ marginLeft: "auto", color: "var(--muted)" }}>{ok.horizon}</span>
              </div>
              <div className="num" style={{ fontSize: 30, color: biasCol, margin: "12px 0 14px", lineHeight: 1 }}>{biasTxt}</div>
              <ProbBar up={up} />
              <p style={{ marginTop: 14 }}>{ok.summary}</p>
            </div>
            {nextHigh && <EdgeCard event={nextHigh} edge={edge} onUpgrade={onUpgrade} isPro />}
            {!!(ok.resistance?.length || ok.support?.length) && (
              <div className="card" style={{ marginBottom: 12 }}>
                <h2>ระดับราคาที่ต้องจับตา</h2>
                {(ok.resistance || []).map((r, i) => <div className="row" key={"r" + i}><span className="k">แนวต้าน {i + 1}</span><span className="v num" style={{ fontSize: 17, color: "var(--down)" }}>{r}</span></div>)}
                {(ok.support || []).map((s, i) => <div className="row" key={"s" + i}><span className="k">แนวรับ {i + 1}</span><span className="v num" style={{ fontSize: 17, color: "var(--up)" }}>{s}</span></div>)}
              </div>
            )}
            {!!(ok.drivers || []).length && (
              <div className="card">
                <h2>ปัจจัยขับเคลื่อน</h2>
                {ok.drivers.map((d, i) => (
                  <div className="row" key={i} style={{ alignItems: "flex-start" }}>
                    <span className="k" style={{ flex: "none", width: 96 }}>{d.k}</span>
                    <span className="v" style={{ flex: 1, color: "#A9B4CA" }}>{d.v}</span>
                    <span className={"badge " + (d.s === "up" ? "up" : "dn")} style={{ flex: "none" }}>{d.s === "up" ? "หนุน" : "กดดัน"}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : outlook.state === "loading" ? (
          <div className="card"><div className="skel" style={{ width: 120, height: 14 }} /><div className="skel" style={{ width: "60%", height: 28, marginTop: 14 }} /><div className="skel" style={{ width: "100%", height: 8, marginTop: 16 }} /><div className="skel" style={{ width: "90%", height: 12, marginTop: 16 }} /><div className="skel" style={{ width: "75%", height: 12, marginTop: 8 }} /></div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: 30 }}>
            <h2>ยังประเมินแนวโน้มไม่ได้</h2>
            <p style={{ marginBottom: 18 }}>แนวโน้มคำนวณจากข้อมูลสด ตอนนี้เชื่อมต่อไม่ได้ จึงไม่แสดงตัวเลขที่ไม่ยืนยัน</p>
            <button className="btn" onClick={outlook.reload}>ลองอีกครั้ง</button>
          </div>
        )
      )}

      {view === "cal" && (
        <>
          <div className="days">
            {days.map((x, i) => (
              <button key={i} className={"day" + (day === i ? " on" : "")} onClick={() => { setDay(i); setDayPicked(true); }}>
                <div style={{ fontSize: 10 }}>{x.d.toLocaleDateString("th-TH", { weekday: "short" })}</div>
                <div className="num" style={{ fontSize: 17, marginTop: 3 }}>{x.d.getDate()}</div>
                {x.hot && <em />}
              </button>
            ))}
          </div>
          <div className="card">
            {calendar.state === "loading" && !calendar.data ? (
              <><div className="skel" style={{ width: "70%", height: 14 }} /><div className="skel" style={{ width: "50%", height: 12, marginTop: 12 }} /></>
            ) : cur.list.length === 0 ? (
              <p className="dim" style={{ textAlign: "center", padding: "16px 0" }}>วันที่เลือกไม่มีตัวเลขเศรษฐกิจสำคัญ ราคามักเคลื่อนตามโครงสร้างเดิมและสภาพคล่องระหว่างเซสชัน</p>
            ) : cur.list.map((e, i) => <EventRow key={e.at + i} e={e} isPro={isPro} onUpgrade={onUpgrade} />)}
          </div>
          <p className="dim" style={{ marginTop: 14 }}>
            {calendar.state === "offline" ? "ยังดึงปฏิทินไม่ได้ กดรีเฟรชเพื่อลองอีกครั้ง" : "ช่วง 15 นาทีก่อนและหลังข่าวผลกระทบสูง สเปรดมักกว้างและราคาเหวี่ยงแรง"}
          </p>
        </>
      )}

      {view === "news" && (
        newsFeed.state === "loading" && !newsFeed.data ? (
          <div className="card"><div className="skel" style={{ width: "80%", height: 14 }} /><div className="skel" style={{ width: "95%", height: 12, marginTop: 12 }} /><div className="skel" style={{ width: "70%", height: 14, marginTop: 22 }} /><div className="skel" style={{ width: "90%", height: 12, marginTop: 12 }} /></div>
        ) : (newsFeed.data?.news || []).length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 30 }}>
            <h2>ยังไม่มีข่าวสด</h2>
            <p style={{ marginBottom: 18 }}>ตอนนี้ดึงข่าวจากอินเทอร์เน็ตไม่ได้</p>
            <button className="btn" onClick={newsFeed.load}>ลองอีกครั้ง</button>
          </div>
        ) : (
          <div className="card">
            {newsFeed.data.news.map((n, i) => (
              <div key={i} style={{ padding: "14px 0", borderBottom: i < newsFeed.data.news.length - 1 ? "1px solid rgba(255,255,255,.055)" : 0 }}>
                <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 8 }}>
                  {isPro ? (
                    <span className={"badge " + (n.tone === "bull" ? "up" : n.tone === "bear" ? "dn" : "")}>{n.tone === "bull" ? "หนุนทอง" : n.tone === "bear" ? "กดดันทอง" : n.tone ? "เป็นกลาง" : "Pro"}</span>
                  ) : <span className="badge" onClick={onUpgrade} style={{ cursor: "pointer" }}><Ico.lock style={{ width: 10, height: 10 }} /> Pro</span>}
                  <span className="mono" style={{ color: "var(--muted)" }}>{n.source}</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1.5, marginBottom: 6 }}>{n.title}</div>
                <p style={{ fontSize: 12.5 }}>{n.summary}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ---------- scan ---------- */
/* ---------- กติกาความเสี่ยง: TP ไม่เกิน 1,500 จุด / SL ไม่เกิน 800 จุด (ทองคำ 1 จุด = 0.01) ---------- */
const MAX_TP_PTS = 1500, MAX_SL_PTS = 800, DEFAULT_POINT = 0.01;

const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; };
const ptsBetween = (a, b, ps) => Math.round(Math.abs(a - b) / ps);
const fmtPrice = (v, ps) => v == null ? "-" : v.toFixed(ps >= 1 ? 2 : 2);

/* กู้ JSON ที่ถูกตัดกลางคัน โดยย้อนกลับไปคีย์ล่าสุดที่จบสมบูรณ์แล้วปิดวงเล็บให้ */
function repairParse(txt) {
  const start = txt.indexOf("{");
  if (start < 0) return {};
  const body = txt.slice(start);
  try { return JSON.parse(body.slice(0, body.lastIndexOf("}") + 1)); } catch {}
  let depth = 0, inStr = false, esc = false, lastSafe = -1, lastArrItem = -1;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") { depth--; if (depth === 2) lastArrItem = i; }
    else if (c === "," && depth === 1) lastSafe = i;
  }
  // ถ้าขาดกลางอาเรย์ ให้ปิดอาเรย์ท้ายรายการที่สมบูรณ์ล่าสุด จะเก็บแผนที่มาครบไว้ได้
  if (lastArrItem > lastSafe) { try { return JSON.parse(body.slice(0, lastArrItem + 1) + "]}"); } catch {} }
  if (lastSafe > 0) { try { return JSON.parse(body.slice(0, lastSafe) + "}"); } catch {} }
  return {};
}

/* คีย์ย่อเพื่อประหยัดความยาวคำตอบ ตัวเลขสำคัญถูกส่งมาก่อนเสมอ */
const SCAN_KEYS = { b: "bias", c: "confidence", p: "price", e: "entry", et: "entryType", sl: "sl", tp: "tp", w: "watch",
  ps: "pointSize", s: "symbol", tf: "timeframe", ed: "edge", en: "entryNote", sw: "slWhy", tw: "tpWhy",
  lr: "legRange", st: "structure", r: "reasons", iv: "invalidation", rk: "risk" };
const expandPlan = (o) => Object.entries(o || {}).reduce((a, [k, v]) => (a[SCAN_KEYS[k] || k] = v, a), {});

/* บังคับเพดาน TP/SL ใช้ร่วมกันทั้งแผนหลักและแผนรอเข้า */
function clampLevels(dir, entry, sl, tp, ps) {
  const flags = [];
  let slPts = ptsBetween(entry, sl, ps), tpPts = ptsBetween(entry, tp, ps);
  if (tpPts > MAX_TP_PTS) {
    tp = entry + dir * MAX_TP_PTS * ps;
    flags.push(`ย่อ TP เหลือ ${MAX_TP_PTS.toLocaleString()} จุดตามเพดาน (เดิม ${tpPts.toLocaleString()} จุด)`);
    tpPts = MAX_TP_PTS;
  }
  if (slPts > MAX_SL_PTS) {
    sl = entry - dir * MAX_SL_PTS * ps;
    flags.push(`SL ตามโครงสร้างต้องใช้ ${slPts.toLocaleString()} จุด เกินเพดาน ${MAX_SL_PTS.toLocaleString()} จุด ระบบรัดเข้ามาให้ — ไม้นี้เสี่ยงโดนสะกิดก่อนไปต่อ`);
    slPts = MAX_SL_PTS;
  }
  return { entry, sl, tp, slPts, tpPts, rr: slPts > 0 ? tpPts / slPts : 0, flags };
}

/* แผนรอเข้า: เงื่อนไขที่ต้องเห็นก่อน แล้วค่อยเข้าที่ราคานี้ */
function normalizeSetup(raw, ps) {
  const dir = raw.d === "BUY" ? 1 : raw.d === "SELL" ? -1 : 0;
  const entry = num(raw.e), sl = num(raw.sl), tp = num(raw.tp);
  if (!dir || entry == null || sl == null || tp == null) return null;
  const slOk = dir === 1 ? sl < entry : sl > entry;
  const tpOk = dir === 1 ? tp > entry : tp < entry;
  if (!slOk || !tpOk) return null;
  return { dir, side: raw.d, trigger: raw.if || "", ...clampLevels(dir, entry, sl, tp, ps) };
}

/* ตรวจแผนที่ AI ส่งมา บังคับเพดานเอง ไม่เชื่อโมเดลอย่างเดียว */
function normalizePlan(raw) {
  const ps = num(raw.pointSize) || DEFAULT_POINT;
  const dir = raw.bias === "BUY" ? 1 : raw.bias === "SELL" ? -1 : 0;
  const price = num(raw.price);
  const setups = (Array.isArray(raw.watch) ? raw.watch : []).map((x) => normalizeSetup(x, ps)).filter(Boolean).slice(0, 2);
  let entry = num(raw.entry), sl = num(raw.sl), tp = num(raw.tp);
  const flags = [];

  if (!raw.bias) return { ...raw, ps, price, entry, sl, tp, dir, flags, valid: false, fail: "unparsed", setups };
  if (raw.bias === "WAIT") return { ...raw, ps, price, entry, sl, tp, dir, flags, valid: false, fail: null, setups };
  if (!dir || entry == null || sl == null || tp == null) {
    return { ...raw, ps, price, entry, sl, tp, dir, flags, valid: false, fail: "incomplete", setups };
  }

  // ทิศต้องถูกด้าน ถ้ากลับด้านถือว่าแผนใช้ไม่ได้
  const slOk = dir === 1 ? sl < entry : sl > entry;
  const tpOk = dir === 1 ? tp > entry : tp < entry;
  if (!slOk || !tpOk) return { ...raw, ps, price, entry, sl, tp, dir, flags, valid: false, fail: "inconsistent", setups };

  const c = clampLevels(dir, entry, sl, tp, ps);
  entry = c.entry; sl = c.sl; tp = c.tp;
  const slPts = c.slPts, tpPts = c.tpPts;
  flags.push(...c.flags);

  const rr = c.rr;
  const waiting = raw.entryType === "wait" && price != null && Math.abs(price - entry) / ps >= 20;
  return { ...raw, ps, price, entry, sl, tp, dir, slPts, tpPts, rr, waiting, flags, setups, valid: true, fail: null };
}

/* แผงราคา: TP / จุดเข้า / SL เรียงตามจริง พร้อมระยะเป็นจุด */
function PlanLadder({ p }) {
  const up = p.dir === 1;
  const rows = up
    ? [["TP", p.tp, "var(--green)", `+${p.tpPts.toLocaleString()} จุด`],
       ["จุดเข้า", p.entry, "var(--gold2)", p.waiting ? "รอราคา" : "เข้าได้เลย"],
       ["SL", p.sl, "var(--red)", `-${p.slPts.toLocaleString()} จุด`]]
    : [["SL", p.sl, "var(--red)", `-${p.slPts.toLocaleString()} จุด`],
       ["จุดเข้า", p.entry, "var(--gold2)", p.waiting ? "รอราคา" : "เข้าได้เลย"],
       ["TP", p.tp, "var(--green)", `+${p.tpPts.toLocaleString()} จุด`]];
  return (
    <div style={{ display: "grid", gap: 1, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,.06)" }}>
      {rows.map(([k, v, c, sub], i) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "var(--s1)" }}>
          <span style={{ width: 3, height: 26, borderRadius: 3, background: c, flex: "none" }} />
          <div style={{ flex: 1 }}>
            <div className="dim" style={{ fontSize: 11 }}>{k}</div>
            <div className="num" style={{ fontSize: 20, marginTop: 1, color: c }}>{fmtPrice(v, p.ps)}</div>
          </div>
          <span className="mono" style={{ color: k === "จุดเข้า" ? "var(--gold)" : "var(--ter)" }}>{sub}</span>
        </div>
      ))}
      {p.price != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,.03)" }}>
          <span style={{ width: 3, height: 16, flex: "none" }} />
          <span className="dim" style={{ flex: 1, fontSize: 12 }}>ราคาตอนสแกน</span>
          <span className="num" style={{ fontSize: 15, color: "var(--sec)" }}>{fmtPrice(p.price, p.ps)}</span>
        </div>
      )}
    </div>
  );
}

/* แผนรอเข้า: เงื่อนไข + ราคาเข้า SL TP */
function SetupCard({ st, ps }) {
  const c = st.dir === 1 ? "var(--green)" : "var(--red)";
  const cells = [["รอเข้าที่", st.entry, "var(--gold2)", ""], ["SL", st.sl, "var(--red)", `${st.slPts.toLocaleString()} จุด`], ["TP", st.tp, "var(--green)", `${st.tpPts.toLocaleString()} จุด`]];
  return (
    <div style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,.26)", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span className="badge" style={{ background: st.dir === 1 ? "rgba(48,209,88,.16)" : "rgba(255,69,58,.16)", color: c }}>
          {st.dir === 1 ? "ถ้าลงมา เข้าฝั่งซื้อ" : "ถ้าขึ้นไป เข้าฝั่งขาย"}
        </span>
        <span className="mono" style={{ marginLeft: "auto", color: "var(--ter)" }}>RR 1:{st.rr.toFixed(1)}</span>
      </div>
      {st.trigger && <p style={{ fontSize: 13, marginBottom: 12 }}>{st.trigger}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        {cells.map(([k, v, col, sub]) => (
          <div key={k} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,.04)" }}>
            <div className="dim" style={{ fontSize: 10.5 }}>{k}</div>
            <div className="num" style={{ fontSize: 16, marginTop: 2, color: col }}>{fmtPrice(v, ps)}</div>
            {sub && <div className="mono" style={{ color: "var(--ter)", marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>
      {st.flags.map((f, i) => <p key={i} className="dim" style={{ marginTop: 8, color: "var(--red)" }}>{f}</p>)}
    </div>
  );
}

const SCAN_STEPS = [
  ["อ่านราคาและกรอบเวลาจากภาพ", "OK"],
  ["ลากโครงสร้าง สวิงไฮ สวิงโลว์", "OK"],
  ["วัดระยะที่โครงสร้างวิ่งได้จริง", "OK"],
  ["วางจุดเข้า SL TP ในเพดานความเสี่ยง", "OK"],
];

function ScanTab({ plan, left, unlimited, onResult, onQuota, say, onSaved, onUpgrade, nextEvent, onNews, isPro, spot }) {
  const [img, setImg] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const [res, setRes] = useState(null);
  const [note, setNote] = useState("");
  const [scanError, setScanError] = useState("");
  const fileRef = useRef(null); const cameraRef = useRef(null); const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const pick = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    // Reset the input immediately so selecting the same photo again works on
    // iOS Safari as well as Android Chrome.
    e.target.value = "";
    setScanError("");
    say("กำลังเตรียมภาพสำหรับส่ง...");
    try {
      setImg(await prepareScanImage(f));
      setPhase("idle"); setRes(null);
    } catch (error) {
      setImg(null); setPhase("idle"); setScanError(error.message); say(error.message);
    }
  };

  const run = async () => {
    if (!img) return say("เลือกรูปกราฟก่อน");
    if (!unlimited && left <= 0) return onQuota();
    setPhase("scanning"); setStep(0); setProg(0); setRes(null); setScanError("");
    timers.current.forEach(clearTimeout); timers.current = [];
    SCAN_STEPS.forEach((_, i) => timers.current.push(setTimeout(() => { setStep(i + 1); setProg(Math.round(((i + 1) / SCAN_STEPS.length) * 88)); }, 700 * i + 400)));

    try {
      const form = new FormData();
      form.append("image", img.blob, "chart.jpg");
      form.append("note", note.slice(0, 300));
      const r = await api("/api/scan", form, "POST", { timeoutMs: 90000 });
      console.info("[scan] response", { status: 200, result: r.result, unlimited: r.unlimited });
      const parsed = normalizePlan(expandPlan(r.result || {}));
      timers.current.push(setTimeout(() => {
        setProg(100); setRes(parsed); setPhase("done");
        if (parsed.fail) { say("คำตอบไม่สมบูรณ์ ลองสแกนใหม่"); }
        else { onResult(r); onSaved({ id: Date.now(), url: img.url, r: parsed, at: clock() }); }
      }, Math.max(0, 700 * SCAN_STEPS.length - 1000)));
    } catch (e) {
      timers.current.forEach(clearTimeout);
      console.error("[scan] request failed", { status: e?.status, message: e?.message, body: e?.responseBody });
      if (e.status === 402) { setPhase("idle"); setProg(0); onQuota(); return; }
      setScanError(e.message || "การเชื่อมต่อขาดตอนระหว่างส่งภาพ");
      setPhase("error"); setProg(0);
    }
  };

  const conf = useCountUp(res?.confidence || 0, phase === "done");
  const col = res?.bias === "BUY" ? "var(--green)" : res?.bias === "SELL" ? "var(--red)" : "var(--gold2)";
  const biasTh = { BUY: "ฝั่งซื้อ", SELL: "ฝั่งขาย", WAIT: "ยังไม่ควรเข้า" }[res?.bias] || "";
  const C = 2 * Math.PI * 26;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div className="card tight">
          <div className="dim">ทองคำสปอต</div>
          {spot ? <div className="num" style={{ fontSize: 22, marginTop: 5, lineHeight: 1 }}>{spot}<span style={{ fontSize: 11, color: "var(--ter)", marginLeft: 5 }}>USD</span></div>
                : <div className="skel" style={{ width: 90, height: 22, marginTop: 6 }} />}
        </div>
        <div className="card tight">
          <div className="dim">สิทธิ์การใช้งาน</div>
          <div className="num" style={{ fontSize: 22, marginTop: 5, lineHeight: 1, color: unlimited ? "var(--gold2)" : left > 0 ? "var(--label)" : "var(--red)" }}>{unlimited ? "ไม่จำกัด" : `${left} ครั้ง`}</div>
        </div>
      </div>

      {nextEvent && (
        <button onClick={onNews} style={{ width: "100%", textAlign: "left", background: "none", padding: 0, marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>ข่าวถัดไปที่กระทบทอง</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: (IMP[nextEvent.impact] || IMP.low).c }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextEvent.title}</span>
            <span className="mono" style={{ color: (IMP[nextEvent.impact] || IMP.low).c, flex: "none" }}>{countdown(nextEvent.at)}</span>
          </div>
          <div className="rule" style={{ marginTop: 12 }} />
        </button>
      )}

      {!unlimited && (
        <div className="card tight" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
          <div className="num" style={{ fontSize: 30, lineHeight: 1, color: left > 0 ? "var(--gold2)" : "var(--red)" }}>{left}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5 }}>{plan ? `${plan.label} เหลือ ${left} จาก ${plan.quota} ครั้ง` : `ทดลองใช้ เหลือ ${left} ครั้ง`}</div>
            <div className="dim">{plan?.id === "day" ? "อัปเกรดเป็น Pro เพื่อสแกนไม่จำกัด" : "Pro สแกนได้ไม่จำกัด"}</div>
          </div>
          <button className="btn sm" onClick={onUpgrade}>อัปเกรด</button>
        </div>
      )}

      <div className="stage">
        {img ? <img src={img.url} alt="กราฟที่อัปโหลด" /> : (
          <button onClick={() => fileRef.current?.click()} style={{ background: "none", color: "var(--ter)", display: "grid", gap: 12, justifyItems: "center", padding: 26 }}>
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M3 15l5-4 4 3 3-3 6 5" /><circle cx="8.5" cy="9" r="1.2" />
            </svg>
            <span style={{ fontSize: 14, color: "var(--sec)" }}>แตะเพื่อใส่ภาพกราฟ</span>
            <span className="dim" style={{ fontSize: 11 }}>เห็นแท่งเทียนและแกนราคาชัด จะวางแผนได้แม่นกว่า</span>
          </button>
        )}
        {phase === "scanning" && (<><div className="gridov" /><div className="sweep" /></>)}
        {(phase === "scanning" || phase === "done") && (<><i className="tick tl" /><i className="tick tr" /><i className="tick bl" /><i className="tick br" /></>)}
        {phase === "scanning" && (
          <div className="mono" style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", color: "var(--gold2)" }}>
            <span>ANALYSING</span><span style={{ marginLeft: "auto" }}>{prog}%</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept={SCAN_ACCEPT} onChange={pick} style={{ display: "none" }} />
      <input ref={cameraRef} type="file" accept={SCAN_ACCEPT} capture="environment" onChange={pick} style={{ display: "none" }} />

      {phase === "scanning" && (
        <>
          <div className="log" style={{ marginTop: 16 }}>
            {SCAN_STEPS.map(([label, val], i) => (
              <div className="logrow" key={i} style={{ opacity: i < step ? 1 : .3, transition: "opacity .4s" }}>
                <Ico.check style={{ width: 13, height: 13, color: i < step ? "var(--gold)" : "transparent", flex: "none" }} />
                <span style={{ fontSize: 13, color: "var(--sec)" }}>{label}</span>
                <span className="mono" style={{ color: "var(--ter)" }}>{i < step ? val : "···"}</span>
              </div>
            ))}
          </div>
          <div className="prog" style={{ marginTop: 12 }}><i style={{ width: prog + "%" }} /></div>
        </>
      )}

      {phase === "idle" && (
        <>
          {img && (
            <div className="field" style={{ marginTop: 16 }}>
              <label className="label">บริบทเพิ่มเติม ไม่ใส่ก็ได้</label>
              <input className="solo" value={note} placeholder="เช่น XAUUSD M15 ถือ Buy อยู่ 2 ไม้" onChange={(e) => setNote(e.target.value)} />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>{img ? "เปลี่ยนภาพ" : "เลือกภาพ"}</button>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => cameraRef.current?.click()}>ถ่ายภาพ</button>
            <button className="btn" onClick={run} disabled={!img}>วิเคราะห์</button>
          </div>
          <div className="card tight" style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <Ico.lock style={{ width: 15, height: 15, color: "var(--gold)", flex: "none" }} />
            <p style={{ flex: 1, fontSize: 12.5 }}>ทุกแผนถูกบังคับเพดาน TP ไม่เกิน {MAX_TP_PTS.toLocaleString()} จุด และ SL ไม่เกิน {MAX_SL_PTS.toLocaleString()} จุด</p>
          </div>
        </>
      )}

      {phase === "error" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ color: "var(--red)" }}>วิเคราะห์ไม่สำเร็จ</h2>
          <p style={{ marginBottom: 7 }}>{scanError || "การเชื่อมต่อขาดตอนระหว่างส่งภาพ"}</p>
          <p className="dim" style={{ marginBottom: 16 }}>ระบบจะไม่หักสิทธิ์เมื่อส่งภาพหรือวิเคราะห์ไม่สำเร็จ</p>
          <button className="btn" onClick={() => setPhase("idle")}>ลองใหม่</button>
        </div>
      )}

      {phase === "done" && res && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {res.fail ? (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, flex: "none", display: "grid", placeItems: "center", background: "rgba(255,69,58,.14)" }}>
                  <span style={{ color: "var(--red)", fontSize: 18, fontWeight: 700 }}>!</span>
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>อ่านแผนไม่ครบ</div>
                  <div className="dim">คืนสิทธิ์ให้แล้ว ไม่ถูกหักครั้ง</div>
                </div>
              </div>
              <p style={{ marginBottom: 14 }}>
                {res.fail === "unparsed" || res.fail === "incomplete"
                  ? "คำตอบถูกตัดกลางคันก่อนได้ตัวเลขครบ มักเกิดเมื่อภาพกราฟอ่านยาก ลองครอปเฉพาะส่วนกราฟให้เห็นแกนราคาชัด แล้วสแกนใหม่"
                  : "ตัวเลขจุดเข้า SL และ TP ที่ได้ขัดกันเอง เช่น SL อยู่ผิดด้านของจุดเข้า ระบบจึงไม่แสดงแผนที่เชื่อถือไม่ได้"}
              </p>
              <button className="btn" onClick={() => { setRes(null); setPhase("idle"); }}>สแกนอีกครั้ง</button>
            </div>
          ) : (
            <>
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ flex: "none" }}>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="4" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke={col} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={C} strokeDashoffset={C - (C * conf) / 100} transform="rotate(-90 32 32)" />
                    <text x="32" y="38" textAnchor="middle" fill={col} className="num" style={{ fontSize: 17 }}>{conf}</text>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: col, letterSpacing: "-.02em" }}>{biasTh}</div>
                    <div className="dim" style={{ marginTop: 4 }}>{res.symbol || "ไม่ระบุคู่เงิน"} · {res.timeframe || "-"} · ความเชื่อมั่น {conf}%</div>
                  </div>
                </div>
                {res.edge && <p style={{ marginTop: 14 }}>{res.edge}</p>}
              </div>

              {res.valid ? (
                <>
                  <div className={"card tight" + (res.waiting ? " brass" : "")} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, flex: "none", display: "grid", placeItems: "center",
                      background: res.waiting ? "rgba(224,185,107,.16)" : "rgba(48,209,88,.14)" }}>
                      {res.waiting ? <Ico.hist style={{ width: 17, height: 17, color: "var(--gold)" }} /> : <Ico.check style={{ width: 17, height: 17, color: "var(--green)" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: res.waiting ? "var(--gold2)" : "var(--green)" }}>
                        {res.waiting ? `รอราคา ${fmtPrice(res.entry, res.ps)} ค่อยเข้า` : "ราคาอยู่ในโซนเข้าแล้ว"}
                      </div>
                      {res.entryNote && <p className="dim" style={{ marginTop: 3 }}>{res.entryNote}</p>}
                    </div>
                  </div>

                  <PlanLadder p={res} />

                  <div className="card tight" style={{ display: "flex" }}>
                    {[["ระยะ TP", `${res.tpPts.toLocaleString()} จุด`], ["ระยะ SL", `${res.slPts.toLocaleString()} จุด`], ["ได้ต่อเสีย", `1 : ${res.rr.toFixed(1)}`]]
                      .map(([k, v], i) => (
                        <div key={k} style={{ flex: 1, textAlign: i === 1 ? "center" : i === 2 ? "right" : "left" }}>
                          <div className="dim" style={{ fontSize: 11 }}>{k}</div>
                          <div className="num" style={{ fontSize: 17, marginTop: 3 }}>{v}</div>
                        </div>
                      ))}
                  </div>

                  {res.flags.map((f, i) => (
                    <div key={i} className="card tight" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,69,58,.08)" }}>
                      <span style={{ color: "var(--red)", fontSize: 15, lineHeight: 1.3 }}>!</span>
                      <p style={{ flex: 1, fontSize: 12.5 }}>{f}</p>
                    </div>
                  ))}

                  <div className="card">
                    <h2>เหตุผลของแผนนี้</h2>
                    {(res.reasons || []).filter(Boolean).map((n, i, arr) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--sep2)" : 0 }}>
                        <span className="num" style={{ color: "var(--goldDim)", fontSize: 15, lineHeight: 1.5 }}>{i + 1}</span>
                        <p style={{ flex: 1 }}>{n}</p>
                      </div>
                    ))}
                    {res.structure && <div className="row" style={{ marginTop: 6 }}><span className="k">โครงสร้าง</span><span className="v" style={{ flex: 1, textAlign: "right", fontWeight: 400, color: "var(--sec)" }}>{res.structure}</span></div>}
                    {res.legRange && <div className="row"><span className="k">ขาที่ผ่านมาวิ่ง</span><span className="v">{res.legRange}</span></div>}
                    {res.tpWhy && <div className="row"><span className="k">ทำไม TP ตรงนี้</span><span className="v" style={{ flex: 1, textAlign: "right", fontWeight: 400, color: "var(--sec)" }}>{res.tpWhy}</span></div>}
                    {res.slWhy && <div className="row"><span className="k">ทำไม SL ตรงนี้</span><span className="v" style={{ flex: 1, textAlign: "right", fontWeight: 400, color: "var(--sec)" }}>{res.slWhy}</span></div>}
                  </div>

                  {res.setups.length > 0 && (
                    <div className="card">
                      <h2>แผนสำรองถ้าโครงสร้างพลิก</h2>
                      {res.setups.map((st, i) => <SetupCard key={i} st={st} ps={res.ps} />)}
                    </div>
                  )}

                  {(res.invalidation || res.risk) && (
                    <div className="card tight">
                      {res.invalidation && <><div className="dim" style={{ marginBottom: 4 }}>แผนนี้ผิดเมื่อ</div><p style={{ marginBottom: res.risk ? 12 : 0 }}>{res.invalidation}</p></>}
                      {res.risk && <><div className="dim" style={{ marginBottom: 4 }}>ข้อควรระวัง</div><p>{res.risk}</p></>}
                    </div>
                  )}
                </>
              ) : (
                <div className="card brass">
                  <h2 style={{ color: "var(--gold2)" }}>รอจังหวะถัดไปคุ้มกว่า</h2>
                  <p style={{ marginBottom: 12 }}>ตอนนี้ยังไม่มีไม้ที่คุ้มเสี่ยงภายในเพดาน SL {MAX_SL_PTS.toLocaleString()} จุด</p>
                  {(res.reasons || []).filter(Boolean).map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0" }}>
                      <span className="num" style={{ color: "var(--goldDim)", fontSize: 15 }}>{i + 1}</span><p style={{ flex: 1 }}>{n}</p>
                    </div>
                  ))}
                  {res.structure && <p className="dim" style={{ marginTop: 10 }}>{res.structure}</p>}

                  {res.setups.length > 0 ? (
                    <>
                      <div className="rule" style={{ margin: "16px 0 12px" }} />
                      <div className="eyebrow" style={{ marginBottom: 2 }}>เฝ้าสองระดับนี้</div>
                      {res.setups.map((st, i) => <SetupCard key={i} st={st} ps={res.ps} />)}
                      <p className="dim" style={{ marginTop: 12 }}>ราคายังไม่ถึงทั้งสองระดับ อย่าเพิ่งเข้ากลางทาง รอให้แตะแล้วมีสัญญาณกลับตัวก่อน</p>
                    </>
                  ) : (
                    <p className="dim" style={{ marginTop: 12 }}>ยังไม่มีระดับราคาที่ชัดพอจะวางแผนล่วงหน้า ลองสแกนใหม่เมื่อโครงสร้างเริ่มก่อตัว</p>
                  )}
                </div>
              )}
            </>
          )}

          {nextEvent && (
            <div className="card tight brass">
              <div className="eyebrow" style={{ marginBottom: 8 }}>ข่าวที่อาจรบกวนแผนนี้</div>
              <p>{nextEvent.title} · {countdown(nextEvent.at)}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost" style={{ width: "100%" }} onClick={() => { setImg(null); setRes(null); setNote(""); setPhase("idle"); }}>วิเคราะห์ภาพใหม่</button>
            <button className="btn" onClick={() => say("บันทึกลงประวัติแล้ว")}>บันทึก</button>
          </div>
          <p className="dim" style={{ textAlign: "center", fontSize: 11 }}>ผลวิเคราะห์เป็นแนวทางประกอบการตัดสินใจ ไม่ใช่คำแนะนำการลงทุน</p>
        </div>
      )}
    </div>
  );
}

/* ---------- history ---------- */
function HistoryTab({ items, onScan }) {
  if (!items.length) return (
    <div className="card" style={{ textAlign: "center", padding: 34 }}>
      <h2>ยังไม่มีบันทึก</h2>
      <p style={{ marginBottom: 18 }}>ผลวิเคราะห์ทุกครั้งจะถูกเก็บไว้ที่นี่ ย้อนดูได้ตลอด</p>
      <button className="btn" onClick={onScan}>เริ่มวิเคราะห์</button>
    </div>
  );
  return (
    <div>
      <div className="eyebrow mono" style={{ marginBottom: 14 }}>บันทึกการวิเคราะห์ {items.length} รายการ</div>
      <div className="card">
        {items.map((h) => {
          const c = h.r.bias === "BUY" ? "var(--up)" : h.r.bias === "SELL" ? "var(--down)" : "var(--brass2)";
          return (
            <div className="hist" key={h.id}>
              <img src={h.url} alt="" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}>{h.r.symbol} · {h.r.timeframe}</div>
                <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{h.at}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: c, fontSize: 12.5 }}>{h.r.bias}</div>
                <div className="num" style={{ fontSize: 16, color: "var(--muted)" }}>{h.r.confidence}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- plans ---------- */
function PlansTab({ sel, setSel, onPay, plan, user, pendingPay }) {
  const proBill = PLANS.find((p) => p.id === sel && p.tier === "pro") || PLANS[3];
  const choose = (id) => { setSel(id); onPay(); };
  const Check = ({ on = true }) => on
    ? <Ico.check style={{ width: 16, height: 16, color: "var(--gold)" }} />
    : <span style={{ color: "var(--ter)" }}>—</span>;

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>แพ็กเกจ</div>
      <h1>เลือกแพ็กเกจ</h1>
      <p style={{ marginBottom: 18 }}>Starter สำหรับคนที่เทรดเป็นรอบ · Pro สำหรับคนที่ดูตลาดทุกวันและอยากรู้ทิศทางก่อนข่าว</p>

      {pendingPay && (
        <div className="card tight" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>สลิปรอตรวจสอบ · {pendingPay.id}</span>
          <span className="badge br" style={{ marginLeft: "auto" }}>รอตรวจ</span>
        </div>
      )}
      {plan && (
        <div className="card tight brass" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>ใช้งาน {planTitle(plan)} อยู่ ถึง {new Date(user.expires).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
          <span className="badge br" style={{ marginLeft: "auto" }}>ใช้งานอยู่</span>
        </div>
      )}

      {/* PRO */}
      <div className="tier pro">
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div>
            <div className="tname" style={{ color: "var(--gold2)" }}>Pro</div>
            <div className="tag">สแกนไม่จำกัด · แนวโน้มทองคำ · โอกาสขึ้น/ลงก่อนข่าวพร้อมเหตุผล</div>
          </div>
          <span className="badge br" style={{ marginLeft: "auto", flex: "none" }}>แนะนำ</span>
        </div>

        <div className="bill">
          {PLANS.filter((p) => p.tier === "pro").map((p) => (
            <button key={p.id} className={proBill.id === p.id ? "on" : ""} onClick={() => setSel(p.id)}>
              {p.name}{p.save && <div style={{ fontSize: 10.5, color: proBill.id === p.id ? "var(--gold)" : "var(--ter)", marginTop: 2 }}>{p.save}</div>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="num" style={{ fontSize: 40, lineHeight: 1 }}>{baht(proBill.price)}</span>
          <span style={{ color: "var(--sec)", fontSize: 15 }}>฿ / {proBill.name === "รายเดือน" ? "เดือน" : proBill.name === "รายปี" ? "ปี" : "5 เดือน"}</span>
        </div>
        <div className="dim" style={{ marginTop: 6 }}>{proBill.note}{proBill.perMonth && proBill.id !== "month" ? ` · ถูกกว่ารายเดือน ${baht(2490 - proBill.perMonth)} ฿ ต่อเดือน` : ""}</div>

        <button className="btn" style={{ marginTop: 16 }} onClick={() => choose(proBill.id)}>สมัคร Pro {proBill.name}</button>
      </div>

      {/* STARTER */}
      <div className="tier">
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div>
            <div className="tname">Starter</div>
            <div className="tag">สแกนกราฟ 30 ครั้งใน 24 ชั่วโมง · ปฏิทินข่าวและพาดหัว · ไม่รวมบทวิเคราะห์</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16 }}>
          <span className="num" style={{ fontSize: 34, lineHeight: 1 }}>500</span>
          <span style={{ color: "var(--sec)", fontSize: 15 }}>฿ / วัน</span>
        </div>
        <div className="dim" style={{ marginTop: 6 }}>เฉลี่ยครั้งละ 16.60 ฿</div>
        <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => choose("day")}>เลือก Starter</button>
      </div>

      {/* COMPARE */}
      <div className="card" style={{ marginTop: 4 }}>
        <div className="cmp" style={{ paddingTop: 0 }}>
          <span className="eyebrow">เปรียบเทียบ</span>
          <span style={{ fontWeight: 600, color: "var(--label)" }}>Starter</span>
          <span style={{ fontWeight: 600, color: "var(--gold2)" }}>Pro</span>
        </div>
        <div className="cmp"><span>สแกนกราฟด้วย AI</span><span>30/วัน</span><span style={{ color: "var(--label)" }}>ไม่จำกัด</span></div>
        <div className="cmp"><span>แผนเข้าออก จุดตัดขาดทุน เป้าหมาย</span><span><Check /></span><span><Check /></span></div>
        <div className="cmp"><span>ปฏิทินข่าว นับถอยหลังก่อนประกาศ</span><span><Check /></span><span><Check /></span></div>
        <div className="cmp"><span>พาดหัวข่าวทองคำ</span><span><Check /></span><span><Check /></span></div>
        <div className="cmp"><span>แนวโน้มระยะสั้น แนวรับแนวต้าน</span><span><Check on={false} /></span><span><Check /></span></div>
        <div className="cmp"><span>โอกาสขึ้น/ลงก่อนข่าว พร้อมเหตุผล</span><span><Check on={false} /></span><span><Check /></span></div>
        <div className="cmp"><span>มุมมองข่าว หนุน/กดดันทอง</span><span><Check on={false} /></span><span><Check /></span></div>
      </div>

      <p className="dim" style={{ marginTop: 16, textAlign: "center" }}>ชำระด้วยพร้อมเพย์หรือโอนธนาคาร แนบสลิปแล้วเปิดใช้ภายใน 5-15 นาที</p>
    </div>
  );
}

/* ---------- payment ---------- */
function PromptPayQR({ size = 176 }) {
  return (
    <div style={{ width: size, height: size, margin: "0 auto", padding: 10, background: "#fff", borderRadius: 10 }}>
      <svg viewBox={QR_VIEWBOX} width="100%" height="100%" shapeRendering="crispEdges">
        <path stroke="#0A0E18" strokeWidth="1" fill="none" d={QR_PATH} />
      </svg>
    </div>
  );
}

function PayScreen({ plan, user, onBack, onSubmitted, say }) {
  const [slip, setSlip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const ref = useRef(null);
  const orderId = useRef("รอออกเลข");
  const copy = (t, l) => navigator.clipboard?.writeText(t).then(() => say(l), () => say("คัดลอกไม่สำเร็จ"));

  const pickSlip = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!/^image\//.test(f.type)) return say("รองรับเฉพาะไฟล์รูป");
    try { setSlip(await compressImage(f)); } catch { say("อ่านไฟล์ไม่สำเร็จ"); }
  };

  const submit = async () => {
    if (!slip) return;
    setBusy(true);
    try { const rec = await api("/api/payments/submit", { planId: plan.id, slip }); orderId.current = rec.id; setDone(rec); onSubmitted(rec); }
    catch (e) { say(e.message); } finally { setBusy(false); }
  };

  if (done) return (
    <div style={{ position: "relative", zIndex: 2, flex: 1, display: "grid", placeItems: "center", padding: 26 }}>
      <div className="card" style={{ textAlign: "center", width: "100%" }}>
        <div style={{ width: 54, height: 54, margin: "0 auto 18px", borderRadius: "50%", display: "grid", placeItems: "center", border: "1px solid var(--edgeB)" }}>
          <Ico.check style={{ width: 22, height: 22, color: "var(--brass)" }} />
        </div>
        <h2>ได้รับสลิปแล้ว</h2>
        <p>ทีมงานกำลังตรวจสอบยอด {baht(plan.price)} ฿ ปกติใช้เวลา 5-15 นาที เมื่ออนุมัติแล้วแพ็กเกจจะเปิดให้อัตโนมัติ ดูสถานะได้ที่หน้าบัญชี</p>
        <div className="row" style={{ marginTop: 18 }}><span className="k">เลขที่คำสั่งซื้อ</span><span className="v mono">{done.id}</span></div>
        <div className="row"><span className="k">สถานะ</span><span className="v" style={{ color: "var(--brass)" }}>รอตรวจสอบ</span></div>
        <button className="btn" style={{ marginTop: 18 }} onClick={onBack}>กลับหน้าหลัก</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto" }}>
      <div className="strip">
        <button onClick={onBack} style={{ background: "none", width: 28, height: 28, display: "grid", placeItems: "center", marginLeft: -4 }}>
          <Ico.back style={{ width: 19, height: 19 }} />
        </button>
        <div style={{ fontSize: 15 }}>ชำระเงิน</div>
        <span className="mono" style={{ marginLeft: "auto", color: "var(--muted)" }}>{orderId.current}</span>
      </div>
      <div className="rule" style={{ margin: "0 20px 18px" }} />

      <div className="pad" style={{ paddingBottom: 40 }}>
        <div className="row" style={{ borderTop: "1px solid var(--edge)", borderBottom: "1px solid var(--edge)", padding: "16px 0", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 14.5 }}>{planTitle(plan)}</div>
            <div className="dim" style={{ marginTop: 4 }}>{plan.unit} · {plan.note}</div>
          </div>
          <span className="num" style={{ fontSize: 28, color: "var(--brass2)" }}>{baht(plan.price)} ฿</span>
        </div>

        <div className="card" style={{ marginBottom: 12, textAlign: "center" }}>
          <div className="eyebrow mono" style={{ marginBottom: 14, textAlign: "left" }}>สแกนจ่ายด้วยแอปธนาคารใดก็ได้</div>
          <PromptPayQR />
          <div style={{ marginTop: 14, fontSize: 14.5 }}>{BANK.holder}</div>
          <div className="dim" style={{ marginTop: 4 }}>พร้อมเพย์ · รับเงินได้จากทุกธนาคาร</div>
          <div className="mono" style={{ color: "var(--muted)", marginTop: 8 }}>REF {BANK.promptpayRef}</div>
          <p className="dim" style={{ marginTop: 12 }}>ระบบพร้อมเพย์ไม่ล็อกยอด กรุณากรอกยอด {baht(plan.price)}.00 บาทให้ตรงก่อนยืนยันโอน</p>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <h2>หรือโอนผ่านเลขบัญชี</h2>
          <div className="row"><span className="k">ธนาคาร</span><span className="v">{BANK.name}</span></div>
          <div className="row"><span className="k">ชื่อบัญชี</span><span className="v">{BANK.holder}</span></div>
          <div className="row"><span className="k">เลขที่บัญชี</span>
            <span className="v" style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--brass2)" }}>
              <span className="num" style={{ fontSize: 18 }}>{BANK.accPretty}</span>
              <button onClick={() => copy(BANK.accRaw, "คัดลอกเลขบัญชี " + BANK.accRaw)} style={{ background: "none", color: "var(--muted)" }}>
                <Ico.copy style={{ width: 15, height: 15 }} /></button>
            </span>
          </div>
          <div className="row"><span className="k">ยอดโอน</span>
            <span className="v" style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="num" style={{ fontSize: 18 }}>{baht(plan.price)}.00</span>
              <button onClick={() => copy(String(plan.price), "คัดลอกยอดโอนแล้ว")} style={{ background: "none", color: "var(--muted)" }}>
                <Ico.copy style={{ width: 15, height: 15 }} /></button>
            </span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2>แนบสลิปการโอน</h2>
          {slip ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src={slip} alt="สลิป" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 6, border: "1px solid var(--edge)" }} />
              <p style={{ flex: 1 }}>แนบสลิปแล้ว ตรวจสอบยอดและเวลาโอนให้ชัดก่อนส่ง</p>
              <button className="btn ghost sm" onClick={() => ref.current?.click()}>เปลี่ยน</button>
            </div>
          ) : <button className="btn ghost" style={{ width: "100%" }} onClick={() => ref.current?.click()}>เลือกรูปสลิป</button>}
          <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={pickSlip} />
        </div>

        <button className="btn" disabled={!slip || busy} onClick={submit}>{busy ? "กำลังส่ง" : "ส่งสลิปให้ตรวจสอบ"}</button>
        <p className="dim" style={{ marginTop: 14, textAlign: "center", fontSize: 11 }}>
          บัญชี {user?.phone || "-"} · โอนแล้วแพ็กเกจยังไม่เข้าภายใน 30 นาที ติดต่อทีมงานได้ทันที
        </p>
      </div>
    </div>
  );
}

/* ---------- admin back-office ---------- */
function AdminTab({ say }) {
  const [users, setUsers] = useState([]);
  const [pays, setPays] = useState([]);
  const [view, setView] = useState("pending");
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grant, setGrant] = useState({ phone: "", plan: "month" });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api("/api/admin/overview"); setUsers(r.users || []); setPays(r.payments || []); } catch (e) { say(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (pay) => {
    try { await api("/api/admin/decide", { id: pay.id, action: "approve" }); say(`อนุมัติ ${pay.id} เปิด ${planName(pay.planId)} ให้ ${pay.phone}`); setOpen(null); load(); }
    catch (e) { say(e.message); }
  };
  const reject = async (pay) => {
    try { await api("/api/admin/decide", { id: pay.id, action: "reject" }); say(`ปฏิเสธ ${pay.id}`); setOpen(null); load(); }
    catch (e) { say(e.message); }
  };
  const grantPlan = async () => {
    if (!isThaiMobile(grant.phone)) return say("กรอกเบอร์ให้ถูกต้อง");
    try { await api("/api/admin/grant", { phone: grant.phone, planId: grant.plan }); say(`เปิด ${planName(grant.plan)} ให้ ${grant.phone} แล้ว`); setGrant({ phone: "", plan: "month" }); load(); }
    catch (e) { say(e.message); }
  };

  const approved = pays.filter((p) => p.status === "approved");
  const pending = pays.filter((p) => p.status === "pending");
  const revenue = approved.reduce((s, p) => s + p.amount, 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const revMonth = approved.filter((p) => (p.decidedAt || p.createdAt).startsWith(monthKey)).reduce((s, p) => s + p.amount, 0);
  const activeSubs = users.filter(planActive).length;
  const totalScans = users.reduce((s, u) => s + (u.scans || 0), 0);

  const last14 = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sum = approved.filter((p) => (p.decidedAt || p.createdAt).slice(0, 10) === key).reduce((s, p) => s + p.amount, 0);
      out.push({ d: `${d.getDate()}`, v: sum });
    }
    return out;
  }, [approved]);
  const maxV = Math.max(1, ...last14.map((x) => x.v));

  const planName = (id) => planTitle(PLANS.find((p) => p.id === id));
  const fmt = (iso) => iso ? new Date(iso).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div className="eyebrow mono" style={{ marginBottom: 7 }}>BACK OFFICE</div>
          <h1 style={{ margin: 0, fontSize: 23 }}>หลังบ้าน</h1>
        </div>
        <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={load}>{loading ? "กำลังโหลด" : "รีเฟรช"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[["ยอดขายรวม", `${baht(revenue)} ฿`, "var(--brass2)"], ["เดือนนี้", `${baht(revMonth)} ฿`, "var(--text)"],
          ["รอตรวจสลิป", pending.length, pending.length ? "var(--down)" : "var(--text)"], ["สมาชิกที่ใช้งานอยู่", `${activeSubs} / ${users.length}`, "var(--text)"]].map(([k, v, c]) => (
          <div className="card tight" key={k}>
            <div className="dim">{k}</div>
            <div className="num" style={{ fontSize: 26, marginTop: 6, lineHeight: 1, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card tight" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 13.5 }}>ยอดขาย 14 วัน</span>
          <span className="mono" style={{ marginLeft: "auto", color: "var(--muted)" }}>สแกนรวม {totalScans}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
          {last14.map((x, i) => (
            <div key={i} title={`${x.d}: ${baht(x.v)} ฿`} style={{ flex: 1, height: `${Math.max(3, (x.v / maxV) * 100)}%`, borderRadius: 2,
              background: x.v ? "linear-gradient(180deg,#E4C98C,#B8965A)" : "rgba(255,255,255,.07)" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span className="mono" style={{ color: "var(--muted)" }}>{last14[0].d}</span>
          <span className="mono" style={{ color: "var(--muted)" }}>วันนี้</span>
        </div>
      </div>

      <div className="pill">
        <button className={view === "pending" ? "on" : ""} onClick={() => setView("pending")}>สลิป {pending.length ? `(${pending.length})` : ""}</button>
        <button className={view === "users" ? "on" : ""} onClick={() => setView("users")}>สมาชิก</button>
        <button className={view === "history" ? "on" : ""} onClick={() => setView("history")}>ประวัติ</button>
      </div>

      {view === "pending" && (
        <div className="card">
          {pending.length === 0 ? <p className="dim" style={{ textAlign: "center", padding: "14px 0" }}>ไม่มีสลิปรอตรวจ</p> :
            pending.map((p) => (
              <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.055)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={p.slip} alt="" onClick={() => setOpen(p)} style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 6, border: "1px solid var(--edge)", cursor: "pointer" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14 }}>{p.phone} · {planName(p.planId)}</div>
                    <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{p.id} · {fmt(p.createdAt)}</div>
                  </div>
                  <span className="num" style={{ fontSize: 20, color: "var(--brass2)" }}>{baht(p.amount)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn ghost sm" style={{ flex: 1 }} onClick={() => setOpen(p)}>ดูสลิป</button>
                  <button className="btn ghost sm" style={{ flex: 1, color: "var(--down)" }} onClick={() => reject(p)}>ปฏิเสธ</button>
                  <button className="btn sm" style={{ flex: 1.4 }} onClick={() => approve(p)}>อนุมัติ</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {view === "users" && (
        <>
          <div className="card tight" style={{ marginBottom: 12 }}>
            <div className="dim" style={{ marginBottom: 8 }}>เปิดแพ็กเกจให้ด้วยมือ</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="solo" inputMode="numeric" maxLength={10} placeholder="เบอร์สมาชิก" value={grant.phone}
                onChange={(e) => setGrant({ ...grant, phone: e.target.value.replace(/\D/g, "") })} style={{ flex: 1, padding: 10 }} />
              <select value={grant.plan} onChange={(e) => setGrant({ ...grant, plan: e.target.value })}
                style={{ background: "rgba(5,7,13,.65)", border: "1px solid var(--edge)", color: "var(--text)", borderRadius: 9, padding: "0 10px", fontFamily: "inherit" }}>
                {PLANS.map((p) => <option key={p.id} value={p.id}>{planTitle(p)}</option>)}
              </select>
              <button className="btn sm" onClick={grantPlan}>เปิด</button>
            </div>
          </div>
          <div className="card">
            {users.length === 0 ? <p className="dim" style={{ textAlign: "center", padding: "14px 0" }}>ยังไม่มีสมาชิก</p> :
              users.map((u) => (
                <div key={u.phone} className="row" style={{ alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14 }}>{u.phone}</div>
                    <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>สมัคร {fmt(u.createdAt)} · สแกน {u.scans || 0}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={"badge " + (planActive(u) ? "br" : "")}>{planActive(u) ? planName(u.plan) : "ทดลอง"}</span>
                    <div className="mono" style={{ color: "var(--muted)", marginTop: 5 }}>{planActive(u) ? `ถึง ${fmt(u.expires)}` : `เหลือ ${u.left} ครั้ง`}</div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {view === "history" && (
        <div className="card">
          {pays.filter((p) => p.status !== "pending").length === 0 ? <p className="dim" style={{ textAlign: "center", padding: "14px 0" }}>ยังไม่มีประวัติ</p> :
            pays.filter((p) => p.status !== "pending").map((p) => (
              <div key={p.id} className="row" style={{ alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14 }}>{p.phone} · {planName(p.planId)}</div>
                  <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{p.id} · {fmt(p.decidedAt)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="num" style={{ fontSize: 18, color: p.status === "approved" ? "var(--up)" : "var(--down)" }}>{baht(p.amount)}</span>
                  <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{p.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {open && (
        <div className="sheet" onClick={() => setOpen(null)}>
          <div className="inner" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15 }}>{open.phone} · {planName(open.planId)}</div>
                <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{open.id} · {fmt(open.createdAt)}</div>
              </div>
              <span className="num" style={{ marginLeft: "auto", fontSize: 24, color: "var(--brass2)" }}>{baht(open.amount)} ฿</span>
            </div>
            <img src={open.slip} alt="สลิป" style={{ width: "100%", borderRadius: 8, border: "1px solid var(--edge)" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn ghost" style={{ flex: 1, color: "var(--down)" }} onClick={() => reject(open)}>ปฏิเสธ</button>
              <button className="btn" style={{ flex: 1.4 }} onClick={() => approve(open)}>อนุมัติและเปิดแพ็กเกจ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ---------- account ---------- */
function AccountTab({ user, plan, left, unlimited, isAdmin, isPro, scans, pendingPay, onSync, onPro, onChat, onOut, say }) {
  const [linked, setLinked] = useState(false);
  const exp = user?.expires ? new Date(user.expires).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : null;
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1px solid var(--edgeB)", display: "grid", placeItems: "center" }}>
            <Ico.user style={{ width: 20, height: 20, color: "var(--brass)" }} />
          </div>
          <div>
            <div style={{ fontSize: 15 }}>{user?.phone || "-"}</div>
            <div className="dim" style={{ marginTop: 3 }}>{isAdmin ? "ผู้ดูแลระบบ · สิทธิ์ทั้งหมด" : plan ? `${planTitle(plan)} ถึง ${exp}` : "บัญชีทดลอง"}</div>
          </div>
          <span className="badge br" style={{ marginLeft: "auto" }}>{isAdmin ? "ADMIN" : isPro ? "PRO" : plan ? "STARTER" : "ทดลอง"}</span>
        </div>
      </div>

      {pendingPay && !isAdmin && (
        <div className="card tight brass" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>สลิปรอตรวจสอบ · {planTitle(PLANS.find((p) => p.id === pendingPay.planId))}</div>
              <div className="mono" style={{ color: "var(--muted)", marginTop: 4 }}>{pendingPay.id}</div>
            </div>
            <button className="btn ghost sm" onClick={onSync}>ตรวจสถานะ</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row"><span className="k">วิเคราะห์ในเซสชันนี้</span><span className="v num" style={{ fontSize: 17 }}>{scans} ครั้ง</span></div>
        <div className="row"><span className="k">วิเคราะห์สะสม</span><span className="v num" style={{ fontSize: 17 }}>{isAdmin ? "—" : (user?.scans || 0) + " ครั้ง"}</span></div>
        <div className="row"><span className="k">สิทธิ์คงเหลือ</span><span className="v">{unlimited ? "ไม่จำกัด" : `${left} ครั้ง`}</span></div>
        <div className="row"><span className="k">บทวิเคราะห์ข่าว</span><span className="v" style={{ color: isPro ? "var(--up)" : "var(--muted)" }}>{isPro ? "เปิดใช้งาน" : "รายเดือนขึ้นไป"}</span></div>
        {!isAdmin && <div className="row"><span className="k">เปิดบัญชีเมื่อ</span><span className="v">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span></div>}
      </div>

      {!isAdmin && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h2>ความปลอดภัยของบัญชี</h2>
          <p style={{ marginBottom: 14 }}>ผูกบัญชีไลน์ไว้ใช้กู้รหัสผ่านและรับแจ้งเตือนก่อนข่าวผลกระทบสูง แทนการพึ่ง SMS</p>
          <button className="btn ghost" style={{ width: "100%" }} onClick={() => { setLinked(true); say("ผูกบัญชีไลน์แล้ว"); }} disabled={linked}>{linked ? "ผูกบัญชีไลน์แล้ว" : "ผูกบัญชีไลน์"}</button>
        </div>
      )}

      {!isPro && !isAdmin && <button className="btn" style={{ marginBottom: 12 }} onClick={onPro}>{plan ? "อัปเกรดเป็น Pro เปิดบทวิเคราะห์ข่าว" : "ดูแพ็กเกจ"}</button>}

      <div className="card" style={{ marginBottom: 12 }}>
        <h2>ติดต่อทีมงาน</h2>
        <p style={{ marginBottom: 14 }}>ปัญหาการชำระเงินหรือการใช้งาน ตอบทุกวัน 08:00 ถึง 24:00</p>
        <button className="btn ghost" style={{ width: "100%" }} onClick={onChat}>เปิดหน้าติดต่อ</button>
      </div>

      <button className="btn ghost" style={{ width: "100%" }} onClick={onOut}>ออกจากระบบ</button>
      <div className="rule" style={{ margin: "20px 0 14px" }} />
      <p className="dim" style={{ fontSize: 11 }}>AEGIS ORBIT เวอร์ชัน 5.0 · ให้ข้อมูลเชิงเทคนิคเพื่อประกอบการตัดสินใจเท่านั้น ไม่รับประกันผลกำไร การเทรดมีความเสี่ยง ผู้ใช้ควรบริหารเงินทุนด้วยตัวเอง</p>
    </div>
  );
}

/* ---------- chat ---------- */
function ChatTab() {
  const [msgs, setMsgs] = useState([{ r: "bot", t: "สวัสดีครับ ถามเรื่องแพ็กเกจ การชำระเงิน แนวโน้มทอง หรือวิธีใช้งานได้เลยครับ" }]);
  const [q, setQ] = useState(""); const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text) => {
    const t = (text ?? q).trim(); if (!t || busy) return;
    setQ(""); setBusy(true);
    const next = [...msgs, { r: "me", t }]; setMsgs(next);
    try {
      const r = await api("/api/chat", { messages: next.slice(-8).map((m) => ({ role: m.r === "me" ? "user" : "assistant", content: m.t })) });
      setMsgs((m) => [...m, { r: "bot", t: r.reply || "ขออภัยครับ เดี๋ยวส่งต่อให้ทีมงานนะครับ" }]);
    } catch {
      setMsgs((m) => [...m, { r: "bot", t: "ตอนนี้เชื่อมต่อไม่ได้ครับ ลองใหม่อีกครั้ง หรือรอทีมงานตอบในไม่กี่นาที" }]);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="eyebrow mono" style={{ marginBottom: 16 }}>ติดต่อทีมงาน</div>
      <div className="msgs">
        {msgs.map((m, i) => <div key={i} className={"msg " + (m.r === "me" ? "me" : "bot")}>{m.t}</div>)}
        {busy && <div className="msg bot mono" style={{ color: "var(--brassDim)" }}>กำลังพิมพ์</div>}
        <div ref={endRef} />
      </div>
      {msgs.length <= 1 && (
        <div className="quick">
          {["Starter กับ Pro ต่างกันยังไง", "Pro รายปีคุ้มไหม", "โอนแล้วแพ็กเกจไม่เข้า", "วันนี้มีข่าวอะไร"].map((s) => (
            <button key={s} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
        <input className="solo" value={q} placeholder="พิมพ์ข้อความ" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn" style={{ width: 52, padding: 0, display: "grid", placeItems: "center" }} onClick={() => send()} disabled={busy}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12l16-8-6 8 6 8-16-8z" /></svg>
        </button>
      </div>
    </div>
  );
}
