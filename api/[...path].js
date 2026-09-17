/* ============================================================
   AEGIS ORBIT — Backend (Express/Render และ Vercel-compatible, ไฟล์เดียวรวมทุก endpoint)
   Environment Variables ที่ต้องตั้งใน Render Web Service:
     SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET,
     ADMIN_PHONE, ADMIN_PASSWORD
   ไม่บังคับ: INVITE_CODES (คั่นด้วย ,)
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const config = { maxDuration: 60 };

const REQUIRED_RUNTIME_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "JWT_SECRET", "ADMIN_PHONE", "ADMIN_PASSWORD"];
export const missingRuntimeEnv = () => REQUIRED_RUNTIME_ENV.filter((name) => !process.env[name]);

// Do not crash the process during module import when Render/local environment
// variables have not been entered yet. server.js reports a clear 503 for API
// calls until they are configured; with valid env, this is the original client.
const sb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;
const COOKIE = "ao_session";
const FREE_SCANS = 3;
const MAX_SCAN_IMAGE_BYTES = 5 * 1024 * 1024;
const PLANS = {
  day:   { label: "Starter", name: "รายวัน",  price: 500,   days: 1,   quota: 30 },
  month: { label: "Pro",     name: "รายเดือน", price: 2490,  days: 30,  quota: null },
  five:  { label: "Pro",     name: "5 เดือน",  price: 9900,  days: 150, quota: null },
  year:  { label: "Pro",     name: "รายปี",    price: 14900, days: 365, quota: null },
};
const PRO = ["month", "five", "year"];
const BANK = { name: "ธนาคารกสิกรไทย", acc: "083-3-21158-7", holder: "นาย ธนาวิล ไกกาจ" };

/* ---------- helpers ---------- */
const json = (res, code, body) => { res.status(code).setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(body)); };
const err = (res, code, message) => json(res, code, { error: message });
const isThaiMobile = (p) => /^0[689]\d{8}$/.test(p || "");
const strongPw = (pw) => typeof pw === "string" && pw.length >= 8 && /\d/.test(pw) && /[a-zA-Z]/.test(pw);
const active = (u) => !!(u && u.plan && u.expires && new Date(u.expires) > new Date());
const isPro = (u, role) => role === "admin" || (active(u) && PRO.includes(u.plan));
const unlimited = (u, role) => role === "admin" || (active(u) && PLANS[u.plan]?.quota == null);
const publicUser = (u) => u && ({ phone: u.phone, plan: active(u) ? u.plan : null, expires: active(u) ? u.expires : null, left: u.quota_left ?? 0, scans: u.scans ?? 0, createdAt: u.created_at, via: u.via });

function readCookie(req) {
  const m = (req.headers.cookie || "").split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : null;
}
function cookieSameSite() {
  // Render Static Sites and Web Services use different origins. `Lax` can
  // prevent fetch(..., { credentials: "include" }) from sending ao_session
  // between them, even after a successful login. None requires Secure, which
  // is already enforced below. Set COOKIE_SAME_SITE=Lax only for same-origin
  // deployments that deliberately do not need cross-origin credentials.
  return process.env.COOKIE_SAME_SITE?.toLowerCase() === "lax" ? "Lax" : "None";
}
function setSession(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=${cookieSameSite()}; Path=/; Max-Age=604800`);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=${cookieSameSite()}; Path=/; Max-Age=0`);
}
function session(req) {
  const t = readCookie(req); if (!t) return null;
  try { return jwt.verify(t, process.env.JWT_SECRET); } catch { return null; }
}
async function loadUser(phone) {
  const { data } = await sb.from("users").select("*").eq("phone", phone).maybeSingle();
  if (data && data.plan && data.expires && new Date(data.expires) <= new Date()) {
    await sb.from("users").update({ plan: null, expires: null, quota_left: 0 }).eq("phone", phone);
    data.plan = null; data.expires = null; data.quota_left = 0;
  }
  return data;
}
async function requireAuth(req, res) {
  const s = session(req); if (!s) { err(res, 401, "กรุณาเข้าสู่ระบบ"); return null; }
  if (s.role === "admin") return { role: "admin", user: { phone: s.phone, scans: 0, quota_left: 0 } };
  const user = await loadUser(s.phone); if (!user) { clearSession(res); err(res, 401, "ไม่พบบัญชี"); return null; }
  return { role: "user", user };
}

/* ---------- ส่ง SMS: ThaiBulkSMS / Twilio / console (โหมดทดสอบไม่เสียเงิน) ---------- */
const OTP_TTL_MIN = 5;          // รหัสมีอายุ 5 นาที
const OTP_RESEND_SEC = 60;      // ขอรหัสใหม่ได้ทุก 60 วินาที
const OTP_MAX_SEND = 5;         // ขอได้สูงสุด 5 ครั้งต่อชั่วโมงต่อเบอร์
const OTP_MAX_TRY = 5;          // ใส่รหัสผิดได้ 5 ครั้ง

async function sendSMS(phone, text) {
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();

  if (provider === "console") {
    console.log(`[SMS DEV] ${phone}: ${text}`);
    return { ok: true, dev: true };
  }

  if (provider === "thaibulksms") {
    const key = process.env.THAIBULKSMS_KEY, secret = process.env.THAIBULKSMS_SECRET;
    if (!key || !secret) throw new Error("ยังไม่ได้ตั้ง THAIBULKSMS_KEY / THAIBULKSMS_SECRET");
    const r = await fetch("https://api-v2.thaibulksms.com/sms", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
        authorization: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64"),
      },
      body: new URLSearchParams({ msisdn: phone, message: text, sender: process.env.SMS_SENDER || "SMS" }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error?.message || j.message || "ส่ง SMS ไม่สำเร็จ");
    return { ok: true, id: j.remaining_credit ?? null };
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_SID, token = process.env.TWILIO_TOKEN, from = process.env.TWILIO_FROM;
    if (!sid || !token || !from) throw new Error("ยังไม่ได้ตั้ง TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM");
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      },
      body: new URLSearchParams({ To: "+66" + phone.replace(/^0/, ""), From: from, Body: text }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || "ส่ง SMS ไม่สำเร็จ");
    return { ok: true, id: j.sid };
  }

  throw new Error("SMS_PROVIDER ไม่ถูกต้อง ใช้ได้เฉพาะ thaibulksms, twilio หรือ console");
}

const otpCode = () => String(Math.floor(100000 + Math.random() * 900000));

/* ---------- Internal Mock AI (ไม่เรียกบริการ AI ภายนอก) ---------- */
function mockAI({ system = "", messages = [] }) {
  const text = [system, ...messages.map((m) => Array.isArray(m.content)
    ? m.content.filter((p) => p.type === "text").map((p) => p.text).join(" ")
    : m.content || "")].join(" ");

  // Keep the same JSON contracts as the live prompts so the frontend and API
  // endpoints continue to behave normally during local development/testing.
  if (text.includes("อ่านภาพกราฟ")) return JSON.stringify({
    b: "WAIT", c: 0, p: 0, e: 0, sl: 0, tp: 0, et: "wait", w: [], ps: 0.01,
    s: "XAUUSD", tf: "", ed: "Mock AI ภายในระบบ", en: "ผลสแกนใช้สำหรับทดสอบเท่านั้น",
    sw: "", tw: "", lr: "", st: "รอข้อมูล AI", r: ["Mock AI mode"], iv: "", rk: "ผลนี้ใช้สำหรับทดสอบเท่านั้น",
  });
  if (text.includes("แนวโน้มระยะสั้น")) return JSON.stringify({
    spot: "", change: "", dir: "flat", bias: "neutral", score: 0, up: 50,
    horizon: "โหมด Mock", summary: "ข้อมูลนี้เป็นผลจำลองภายในระบบ", support: [], resistance: [], drivers: [],
  });
  if (text.includes("ปฏิทินเศรษฐกิจ")) return JSON.stringify({ e: [] });
  if (text.includes("ข่าวทองคำล่าสุด")) return JSON.stringify({ news: [] });
  if (text.includes("ประเมินว่าก่อนข่าว")) return JSON.stringify({
    up: 50, edge: "none", confidence: "low", why: ["โหมดทดสอบไม่มีข้อมูลตลาดจริง"],
    play: "ใช้เพื่อทดสอบหน้าจอและระบบเท่านั้น", risk: "ผลจำลองไม่ใช่คำแนะนำการลงทุน",
  });
  if (text.includes("ทีมงานของแอป AEGIS ORBIT")) return "ขณะนี้ระบบใช้ Mock AI ภายในสำหรับการทดสอบ กรุณาติดต่อทีมงานหากต้องการความช่วยเหลือ";
  return JSON.stringify({});
}
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

/* วันประกาศผลประชุมเฟดปี 2026 ตามปฏิทินทางการ (14:00 เวลานิวยอร์ก)
   ต้นปีหน้าอัปเดตจาก federalreserve.gov/monetarypolicy/fomccalendars.htm */
const FOMC_DATES = ["2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09"];

/* ตารางข่าวประจำที่รู้ล่วงหน้าแน่นอน สร้างในเครื่อง ไม่ต้องรออินเทอร์เน็ต */
function buildSchedule(daysAhead = 7) {
  const out = [], now = Date.now(), end = now + daysAhead * 864e5;
  const push = (at, title, impact, effect) => {
    const t = at.getTime();
    if (t > now - 2 * 36e5 && t < end) out.push({ at: at.toISOString(), title, impact, ccy: "USD", forecast: "", previous: "", actual: "", effect, fixed: true });
  };
  FOMC_DATES.forEach((sdate) => {
    const [y, m, d] = sdate.split("-").map(Number);
    push(etWall(y, m, d, 14, 0), "ผลประชุมเฟด FOMC", "high", "มติดอกเบี้ยและ dot plot กำหนดทิศทางดอลลาร์และทอง");
    push(etWall(y, m, d, 14, 30), "แถลงข่าวประธานเฟด", "high", "โทนสายเหยี่ยวกดทอง โทนผ่อนคลายหนุนทอง");
  });
  for (let i = 0; i <= daysAhead; i++) {
    const { y, m, d, wd } = etParts(new Date(now + i * 864e5));
    if (wd === "Thu") push(etWall(y, m, d, 8, 30), "ยอดขอรับสวัสดิการว่างงาน", "medium", "ตัวเลขแย่กว่าคาดกดดันดอลลาร์ หนุนทอง");
    if (wd === "Fri" && d <= 7) push(etWall(y, m, d, 8, 30), "การจ้างงานนอกภาคเกษตร NFP", "high", "แรงงานแข็งแกร่งหนุนดอลลาร์ กดดันทอง");
  }
  const seen = new Set();
  return out.filter((e) => { const k = e.title + bkkKey(e.at); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

/* รวมตัวเลขจาก AI เข้ากับตารางประจำ โดยจับคู่จากเวลาที่ใกล้กัน */
function mergeEvents(base, extra) {
  const out = base.map((e) => ({ ...e }));
  for (const e of extra) {
    const t = new Date(e.at).getTime();
    const hit = out.find((b) => Math.abs(new Date(b.at).getTime() - t) < 3 * 36e5 &&
      (b.title.includes(e.title.slice(0, 4)) || e.title.includes(b.title.slice(0, 4))));
    if (hit) { hit.forecast = e.forecast || hit.forecast; hit.previous = e.previous || hit.previous; hit.actual = e.actual || hit.actual; hit.effect = hit.effect || e.effect; }
    else out.push(e);
  }
  return out.sort((a, b) => new Date(a.at) - new Date(b.at));
}


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
const SCAN_KEYS = { b: "bias", c: "confidence", p: "price", e: "entry", et: "entryType", sl: "sl", tp: "tp",
  ps: "pointSize", s: "symbol", tf: "timeframe", ed: "edge", en: "entryNote", sw: "slWhy", tw: "tpWhy",
  lr: "legRange", st: "structure", r: "reasons", iv: "invalidation", rk: "risk" };
const expandPlan = (o) => Object.entries(o || {}).reduce((a, [k, v]) => (a[SCAN_KEYS[k] || k] = v, a), {});

function salvageObjects(txt) {
  const out = [], stack = []; let inStr = false, esc = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") stack.push(i);
    else if (c === "}" && stack.length) { const st = stack.pop(); try { out.push(JSON.parse(txt.slice(st, i + 1))); } catch {} }
  }
  return out;
}
const parseJSON = (txt) => {
  try { return JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)); }
  catch { return { __salvaged: salvageObjects(txt) }; }
};
const IMPACT_MAP = { h: "high", m: "medium", l: "low", high: "high", medium: "medium", low: "low" };
function normalizeEvents(payload) {
  const rows = payload?.__salvaged?.length ? payload.__salvaged : (payload?.e || payload?.events || []);
  return rows
    .filter((r) => r && (r.at || r.time) && (r.t || r.title))
    .map((r) => ({
      at: r.at || r.time, title: r.t || r.title,
      impact: IMPACT_MAP[r.i || r.impact] || "medium", ccy: r.ccy || "USD",
      forecast: (r.f ?? r.forecast ?? "").toString().replace(/^-$/, "").trim(),
      previous: (r.p ?? r.previous ?? "").toString().replace(/^-$/, "").trim(),
      actual: (r.a ?? r.actual ?? "").toString().replace(/^-$/, "").trim(),
      effect: r.x || r.effect || "",
    }))
    .filter((r) => !isNaN(new Date(r.at).getTime()))
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}
const thaiDate = () => new Date().toLocaleDateString("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" });

/* cache ในตาราง cache เพื่อไม่ให้ทุกคนที่เปิดหน้าตลาดยิง web search ซ้ำ (ประหยัดค่า API มาก) */
async function cached(key, ttlMin, producer) {
  const { data } = await sb.from("cache").select("value, updated_at").eq("key", key).maybeSingle();
  if (data && Date.now() - new Date(data.updated_at).getTime() < ttlMin * 60000) return data.value;
  const value = await producer();
  await sb.from("cache").upsert({ key, value, updated_at: new Date().toISOString() });
  return value;
}

const P = {
  outlook: () => `วันนี้ ${thaiDate()} ค้นหาราคาทองคำ XAUUSD ล่าสุดและประเมินแนวโน้มระยะสั้น 1-2 สัปดาห์ ตอบเป็น JSON อย่างเดียว ห้ามมีข้อความอื่น
{"spot":"ตัวเลขราคาสปอต เช่น 3120","change":"เช่น +0.8%","dir":"up|down|flat","bias":"bull|bear|neutral","score":-100..100,"up":0..100 โอกาสขึ้น,"horizon":"กรอบเวลาสั้นๆ","summary":"เหตุผล ไม่เกิน 40 คำ","support":["ใกล้สุด","ถัดไป"],"resistance":["ใกล้สุด","ถัดไป"],"drivers":[{"k":"ปัจจัย ≤4 คำ","v":"เหตุผล ≤12 คำ","s":"up|dn"}]}
drivers ไม่เกิน 3 ภาษาไทยกระชับ ห้ามคัดลอกข้อความต้นฉบับ`,
  calendar: () => `วันนี้ ${thaiDate()} ค้นหาปฏิทินเศรษฐกิจสหรัฐ 7 วันข้างหน้าที่มีผลต่อทองคำ จากแหล่งที่ลงตัวเลขคาดการณ์ เช่น Trading Economics, Investing, ForexFactory
ตอบ JSON อย่างเดียว ใช้คีย์สั้นตามนี้เป๊ะ
{"e":[{"at":"ISO เวลาไทย +07:00","t":"ชื่อข่าวไทย ≤6 คำ","i":"h","f":"ตัวเลขคาดการณ์","p":"ตัวเลขครั้งก่อน","a":"ผลจริงถ้าประกาศแล้ว","x":"ผลต่อทอง ≤8 คำ"}]}
i คือผลกระทบ h=สูง m=กลาง l=ต่ำ
f ต้องเป็นตัวเลขจริงที่ตลาดคาดการณ์ เช่น 3.1% หรือ 150K ถ้ายังไม่มีสำนักไหนลงตัวเลขให้ใส่ ""
a ใส่เฉพาะข่าวที่ประกาศแล้ว ยังไม่ประกาศใส่ ""
สูงสุด 7 รายการ ห้ามคัดลอกข้อความต้นฉบับ`,
  news: () => `วันนี้ ${thaiDate()} ค้นหาข่าวทองคำล่าสุด 4 หัวข้อ ตอบ JSON อย่างเดียว
{"news":[{"title":"พาดหัวไทย ≤10 คำ","source":"สำนักข่าว","summary":"สรุป 1 ประโยค ≤20 คำ ด้วยคำพูดของคุณเอง","tone":"bull|bear|neutral"}]}
ห้ามคัดลอกข้อความต้นฉบับ`,
  edge: (title, when) => `วันนี้ ${thaiDate()} ประเมินว่าก่อนข่าว "${title}" (ประกาศ ${when} เวลาไทย) ทองคำมีโอกาสไปทางไหนมากกว่า
พิจารณา ผลของข่าวเดียวกันครั้งก่อน ตัวเลขเศรษฐกิจสหรัฐล่าสุด ท่าทีเฟดและบอนด์ยีลด์ ดอลลาร์ สงครามและภูมิรัฐศาสตร์ การวางสถานะกองทุน
ตอบ JSON อย่างเดียว {"up":0..100,"edge":"buy|sell|none","confidence":"low|medium|high","why":["เหตุผล ≤14 คำ","",""],"play":"แนวทางวางไม้ 1 ประโยค ≤25 คำ","risk":"สิ่งที่ทำให้มุมมองผิด ≤15 คำ"} ภาษาไทยกระชับ`,
  scan: (note) => `คุณคือเทรดเดอร์มืออาชีพ อ่านภาพกราฟนี้แล้ววางแผนเทรดที่ทำได้จริง ${note ? "บริบทจากผู้ใช้: " + note : ""}

กติกาที่ห้ามละเมิด
1 TP ห่างจากจุดเข้าไม่เกิน 1500 จุด (ทอง 1 จุด = 0.01 คือ 15.00 ดอลลาร์ เช่น เข้า 4000.00 TP ไม่เกิน 4015.00)
2 SL ห่างจากจุดเข้าไม่เกิน 800 จุด (= 8.00 ดอลลาร์)
3 ถ้าโครงสร้างต้องใช้ SL เกิน 800 จุดถึงจะปลอดภัย ให้ b เป็น WAIT ห้ามฝืนย่อ SL
4 TP เอาพอดีระยะที่โครงสร้างวิ่งไหวจริง ไม่ต้องลากถึงโครงสร้างเดิม
5 SL วางหลังโครงสร้างจริง ใต้สวิงโลว์ล่าสุด (ซื้อ) หรือเหนือสวิงไฮล่าสุด (ขาย) เผื่อไส้เทียน
6 ถ้าราคาอยู่กลางช่วงไม่ได้เปรียบฝั่งไหน ให้ et เป็น wait แล้วระบุราคาที่ควรรอ

ตอบ JSON อย่างเดียว ใช้คีย์สั้นและเรียงตามนี้เป๊ะ
{"b":"BUY|SELL|WAIT","c":0-100,"p":ราคาล่าสุด,"e":ราคาเข้า,"sl":ราคาSL,"tp":ราคาTP,"et":"now|wait","w":[{"d":"BUY|SELL","e":ราคาที่รอเข้า,"sl":ราคาSL,"tp":ราคาTP,"if":"เงื่อนไขที่ต้องเห็นก่อนกดเข้า ≤15 คำ"}],"ps":0.01,"s":"ชื่อคู่","tf":"กรอบเวลา","ed":"ฝั่งไหนได้เปรียบเพราะอะไร ≤20 คำ","en":"ถ้า wait รอราคาไหนเพราะอะไร ≤20 คำ","sw":"เหตุผล SL ≤15 คำ","tw":"เหตุผล TP ≤15 คำ","lr":"ขาที่ผ่านมาวิ่งกี่จุด","st":"โครงสร้างตอนนี้ ≤15 คำ","r":["≤12 คำ","",""],"iv":"แผนผิดเมื่อ ≤12 คำ","rk":"ข้อควรระวัง ≤12 คำ"}

w คือแผนรอเข้า ต้องมีเสมอแม้ b จะเป็น WAIT
- ถ้า b เป็น WAIT ให้ใส่ w 2 แผน คือฝั่งซื้อถ้าราคาลงมาถึงแนวรับ และฝั่งขายถ้าขึ้นไปชนแนวต้าน ระบุราคาจริงจากกราฟ ห้ามเว้นว่าง
- ถ้า b เป็น BUY หรือ SELL ให้ใส่ w 1 แผนเป็นทางเลือกฝั่งตรงข้ามถ้าโครงสร้างพลิก
- ทุกแผนใน w ต้องอยู่ในเพดาน TP 1500 จุด SL 800 จุดเหมือนกัน

เขียนไทยสั้นที่สุด ถ้าภาพไม่ใช่กราฟราคาให้ b เป็น WAIT c เป็น 0 w เป็น [] และอธิบายใน r`,
  chat: `คุณคือทีมงานของแอป AEGIS ORBIT ตอบลูกค้าสั้น สุภาพ ภาษาไทย ไม่เกิน 3 ประโยค
ข้อมูล: แอปสแกนกราฟด้วย AI + แนวโน้มทองคำ + โอกาสก่อนข่าว | สมัครด้วยเบอร์และรหัสผ่าน ไม่มี SMS ลืมรหัสติดต่อไลน์ทีมงาน | ทดลองฟรี ${FREE_SCANS} ครั้ง
แพ็กเกจ Starter รายวัน 500 บาท 30 ครั้ง ไม่รวมบทวิเคราะห์ / Pro รายเดือน 2,490 / Pro 5 เดือน 9,900 / Pro รายปี 14,900 (คุ้มสุด) Pro สแกนไม่จำกัด + แนวโน้ม + โอกาสก่อนข่าว
ชำระ: สแกน QR พร้อมเพย์ในแอป หรือโอน ${BANK.name} ${BANK.acc} ${BANK.holder} แนบสลิป ตรวจใน 5-15 นาที | แอปไม่เปิดออเดอร์ให้ ไม่ใช่คำแนะนำการลงทุน ไม่รู้ให้บอกว่าจะส่งต่อทีมงาน`,
};

/* ---------- handlers ---------- */
const H = {
  /* ขอรหัส OTP — purpose: register (สมัครใหม่) หรือ reset (ตั้งรหัสผ่านใหม่) */
  "POST /api/auth/otp/request": async (req, res) => {
    const { phone, purpose } = req.body || {};
    const mode = purpose === "reset" ? "reset" : "register";
    if (!isThaiMobile(phone)) return err(res, 400, "กรอกเบอร์มือถือไทย 10 หลัก ขึ้นต้น 06 08 หรือ 09");
    if (phone === process.env.ADMIN_PHONE) return err(res, 400, "เบอร์นี้ถูกสงวนไว้");

    const existing = await loadUser(phone);
    if (mode === "register" && existing) return err(res, 409, "เบอร์นี้เปิดบัญชีไว้แล้ว กรุณาเข้าสู่ระบบ");
    if (mode === "reset" && !existing) return err(res, 404, "ไม่พบบัญชีของเบอร์นี้");

    const now = Date.now();
    const { data: prev } = await sb.from("otp").select("*").eq("phone", phone).maybeSingle();
    if (prev?.last_sent && now - new Date(prev.last_sent).getTime() < OTP_RESEND_SEC * 1000) {
      const wait = Math.ceil((OTP_RESEND_SEC * 1000 - (now - new Date(prev.last_sent).getTime())) / 1000);
      return err(res, 429, `ขอรหัสใหม่ได้ในอีก ${wait} วินาที`);
    }
    const freshWindow = prev?.window_start && now - new Date(prev.window_start).getTime() < 3600e3;
    const sent = freshWindow ? (prev.sent_count || 0) : 0;
    if (sent >= OTP_MAX_SEND) return err(res, 429, "ขอรหัสครบ 5 ครั้งแล้ว กรุณารอ 1 ชั่วโมง");

    const code = otpCode();
    const text = `รหัสยืนยัน AEGIS ORBIT ของคุณคือ ${code} (หมดอายุใน ${OTP_TTL_MIN} นาที) ห้ามบอกรหัสนี้กับผู้อื่น`;
    let dev = false;
    try { const out = await sendSMS(phone, text); dev = !!out.dev; }
    catch (e) { console.error("SMS error:", e.message); return err(res, 502, "ส่ง SMS ไม่สำเร็จ กรุณาลองใหม่"); }

    await sb.from("otp").upsert({
      phone, code_hash: await bcrypt.hash(code, 8),
      expires_at: new Date(now + OTP_TTL_MIN * 60000).toISOString(),
      attempts: 0, sent_count: sent + 1,
      window_start: freshWindow ? prev.window_start : new Date(now).toISOString(),
      last_sent: new Date(now).toISOString(), verified: false, verified_at: null, purpose: mode,
    });
    // devCode ส่งกลับเฉพาะโหมดทดสอบเท่านั้น โหมดจริงไม่มีทางหลุดออกไปหน้าเว็บ
    return json(res, 200, { ok: true, expiresIn: OTP_TTL_MIN * 60, resendIn: OTP_RESEND_SEC, ...(dev ? { devCode: code } : {}) });
  },

  "POST /api/auth/otp/verify": async (req, res) => {
    const { phone, code } = req.body || {};
    if (!isThaiMobile(phone) || !/^\d{6}$/.test(code || "")) return err(res, 400, "กรอกรหัส 6 หลัก");
    const { data: row } = await sb.from("otp").select("*").eq("phone", phone).maybeSingle();
    if (!row) return err(res, 404, "ยังไม่ได้ขอรหัส กรุณากดรับรหัสก่อน");
    if (new Date(row.expires_at) < new Date()) return err(res, 410, "รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่");
    if ((row.attempts || 0) >= OTP_MAX_TRY) return err(res, 429, "ใส่รหัสผิดครบ 5 ครั้ง กรุณาขอรหัสใหม่");
    if (!(await bcrypt.compare(code, row.code_hash))) {
      const attempts = (row.attempts || 0) + 1;
      await sb.from("otp").update({ attempts }).eq("phone", phone);
      return err(res, 401, `รหัสไม่ถูกต้อง เหลือ ${OTP_MAX_TRY - attempts} ครั้ง`);
    }
    await sb.from("otp").update({ verified: true, verified_at: new Date().toISOString() }).eq("phone", phone);
    return json(res, 200, { ok: true, purpose: row.purpose || "register" });
  },

  /* ตั้งรหัสผ่านใหม่ ต้องยืนยัน OTP มาก่อน */
  "POST /api/auth/reset": async (req, res) => {
    const { phone, password } = req.body || {};
    if (!strongPw(password)) return err(res, 400, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัว และมีทั้งตัวอักษรกับตัวเลข");
    const { data: row } = await sb.from("otp").select("*").eq("phone", phone).maybeSingle();
    if (!row?.verified || row.purpose !== "reset") return err(res, 403, "ยังไม่ได้ยืนยันเบอร์โทร");
    if (Date.now() - new Date(row.verified_at).getTime() > 15 * 60000) return err(res, 410, "หมดเวลายืนยัน กรุณาขอรหัสใหม่");
    const u = await loadUser(phone);
    if (!u) return err(res, 404, "ไม่พบบัญชี");
    await sb.from("users").update({ pass_hash: await bcrypt.hash(password, 10) }).eq("phone", phone);
    await sb.from("otp").delete().eq("phone", phone);
    await sb.from("login_attempts").delete().eq("phone", phone);
    setSession(res, { phone, role: "user" });
    return json(res, 200, { user: publicUser(await loadUser(phone)), role: "user" });
  },

  "POST /api/auth/register": async (req, res) => {
    const { phone, password, invite } = req.body || {};
    if (!isThaiMobile(phone)) return err(res, 400, "กรอกเบอร์มือถือไทย 10 หลัก ขึ้นต้น 06 08 หรือ 09");
    if (!strongPw(password)) return err(res, 400, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัว และมีทั้งตัวอักษรกับตัวเลข");
    if (phone === process.env.ADMIN_PHONE) return err(res, 400, "เบอร์นี้ถูกสงวนไว้");
    if (await loadUser(phone)) return err(res, 409, "เบอร์นี้เปิดบัญชีไว้แล้ว กรุณาเข้าสู่ระบบ");
    // ต้องยืนยันเบอร์ด้วย OTP ก่อนจึงจะเปิดบัญชีได้
    const { data: otp } = await sb.from("otp").select("*").eq("phone", phone).maybeSingle();
    if (!otp?.verified || otp.purpose !== "register") return err(res, 403, "กรุณายืนยันเบอร์โทรด้วยรหัส OTP ก่อน");
    if (Date.now() - new Date(otp.verified_at).getTime() > 15 * 60000) return err(res, 410, "หมดเวลายืนยัน กรุณาขอรหัสใหม่");

    const codes = (process.env.INVITE_CODES || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const inv = (invite || "").trim().toUpperCase();
    if (inv && !codes.includes(inv)) return err(res, 400, "รหัสเชิญไม่ถูกต้อง เว้นว่างไว้ได้ถ้าไม่มี");
    const row = { phone, pass_hash: await bcrypt.hash(password, 10), plan: null, expires: null, quota_left: FREE_SCANS, scans: 0, via: inv ? "invite" : "phone", invite: inv || null, last_login: new Date().toISOString() };
    if (inv) { const d = new Date(); d.setDate(d.getDate() + 1); row.plan = "day"; row.expires = d.toISOString(); row.quota_left = 30; }
    const { error } = await sb.from("users").insert(row);
    if (error) return err(res, 500, "บันทึกบัญชีไม่สำเร็จ");
    await sb.from("otp").delete().eq("phone", phone);
    setSession(res, { phone, role: "user" });
    return json(res, 200, { user: publicUser(await loadUser(phone)), role: "user" });
  },
  "POST /api/auth/login": async (req, res) => {
    const { phone, password } = req.body || {};
    if (!isThaiMobile(phone) || !password) return err(res, 400, "กรอกเบอร์และรหัสผ่าน");
    if (phone === process.env.ADMIN_PHONE) {
      if (password !== process.env.ADMIN_PASSWORD) return err(res, 401, "รหัสผ่านไม่ถูกต้อง");
      setSession(res, { phone, role: "admin" });
      return json(res, 200, { user: { phone, plan: "admin", expires: null, left: 0, scans: 0, createdAt: null }, role: "admin" });
    }
    const { data: la } = await sb.from("login_attempts").select("*").eq("phone", phone).maybeSingle();
    if (la && la.locked_until && new Date(la.locked_until) > new Date()) return err(res, 429, `ผิดหลายครั้ง ลองใหม่ได้ในอีก ${Math.ceil((new Date(la.locked_until) - Date.now()) / 1000)} วินาที`);
    const user = await loadUser(phone);
    if (!user) return err(res, 404, "ไม่พบบัญชีนี้ กรุณาเปิดบัญชีก่อน");
    if (!(await bcrypt.compare(password, user.pass_hash))) {
      const count = (la?.count || 0) + 1;
      const lock = count >= 5 ? new Date(Date.now() + 60000).toISOString() : null;
      await sb.from("login_attempts").upsert({ phone, count: lock ? 0 : count, locked_until: lock });
      return err(res, 401, lock ? "ผิด 5 ครั้ง ระงับชั่วคราว 60 วินาที" : `รหัสผ่านไม่ถูกต้อง เหลือ ${5 - count} ครั้ง`);
    }
    await sb.from("login_attempts").delete().eq("phone", phone);
    await sb.from("users").update({ last_login: new Date().toISOString() }).eq("phone", phone);
    setSession(res, { phone, role: "user" });
    return json(res, 200, { user: publicUser(user), role: "user" });
  },
  /* ทางเข้าหลังบ้าน ใช้รหัสอย่างเดียว ไม่ต้องรู้เบอร์แอดมิน */
  "POST /api/auth/admin": async (req, res) => {
    const { password } = req.body || {};
    const KEY = "__admin__";
    const { data: la } = await sb.from("login_attempts").select("*").eq("phone", KEY).maybeSingle();
    if (la && la.locked_until && new Date(la.locked_until) > new Date())
      return err(res, 429, `ใส่รหัสผิดหลายครั้ง ลองใหม่ในอีก ${Math.ceil((new Date(la.locked_until) - Date.now()) / 60000)} นาที`);
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      const count = (la?.count || 0) + 1;
      const lock = count >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
      await sb.from("login_attempts").upsert({ phone: KEY, count: lock ? 0 : count, locked_until: lock });
      return err(res, 401, lock ? "ใส่รหัสผิด 5 ครั้ง ระงับ 15 นาที" : `รหัสไม่ถูกต้อง เหลือ ${5 - count} ครั้ง`);
    }
    await sb.from("login_attempts").delete().eq("phone", KEY);
    const phone = process.env.ADMIN_PHONE || "admin";
    setSession(res, { phone, role: "admin" });
    return json(res, 200, { user: { phone, plan: "admin", expires: null, left: 0, scans: 0, createdAt: null }, role: "admin" });
  },

  "POST /api/auth/logout": async (req, res) => { clearSession(res); return json(res, 200, { ok: true }); },
  "GET /api/auth/me": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    if (a.role === "admin") return json(res, 200, { user: { phone: a.user.phone, plan: "admin", expires: null, left: 0, scans: 0, createdAt: null }, role: "admin", pending: null, last: null });
    const { data: pays } = await sb.from("payments").select("id, plan_id, amount, status, created_at").eq("phone", a.user.phone).order("created_at", { ascending: false }).limit(5);
    const mine = (pays || []).map((p) => ({ id: p.id, planId: p.plan_id, amount: p.amount, status: p.status, createdAt: p.created_at }));
    return json(res, 200, { user: publicUser(a.user), role: "user", pending: mine.find((p) => p.status === "pending") || null, last: mine[0] || null });
  },

  /* scan — โควตาตัดฝั่งเซิร์ฟเวอร์ แก้จากหน้าเว็บไม่ได้ */
  "POST /api/scan": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    const upload = req.file;
    const { image: bodyImage, mime: bodyMime, note } = req.body || {};
    // Render/Express receives current mobile uploads as multipart/form-data.
    // JSON base64 remains supported for existing desktop clients.
    const image = upload ? upload.buffer.toString("base64") : bodyImage;
    const mime = upload?.mimetype || bodyMime;
    if (!image || !/^image\/(png|jpeg|webp|gif)$/.test(mime || "")) return err(res, 400, "รองรับเฉพาะไฟล์รูป PNG JPG WEBP");
    if (Buffer.byteLength(image, "base64") > MAX_SCAN_IMAGE_BYTES)
      return err(res, 413, "รูปกราฟใหญ่เกิน 5 MB กรุณาครอปหรือย่อรูปก่อนส่ง");
    const unl = unlimited(a.user, a.role);
    if (!unl && (a.user.quota_left || 0) <= 0) return err(res, 402, "quota");
    const badPlan = (r) => !r || !r.b;
    let result;
    try {
      result = repairParse(mockAI({ messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mime, data: image } }, { type: "text", text: P.scan(String(note || "").slice(0, 300)) }] }] }));
    } catch { return err(res, 502, "วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้ง สิทธิ์ยังไม่ถูกตัด"); }
    if (badPlan(result)) return err(res, 502, "คำตอบไม่สมบูรณ์ ลองสแกนใหม่ สิทธิ์ยังไม่ถูกตัด");
    let left = a.user.quota_left || 0;
    if (a.role !== "admin") {
      const upd = { scans: (a.user.scans || 0) + 1 }; if (!unl) { left -= 1; upd.quota_left = left; }
      await sb.from("users").update(upd).eq("phone", a.user.phone);
      await sb.from("scans").insert({ phone: a.user.phone, symbol: result.s, timeframe: result.tf, bias: result.b, confidence: result.c, result });
    }
    return json(res, 200, { result, left, unlimited: unl });
  },

  /* market — Pro gating ตัดสินฝั่งเซิร์ฟเวอร์ */
  "GET /api/market/calendar": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    const pro = isPro(a.user, a.role);
    try {
      const v = await cached("calendar", 60, async () => {
        const base = buildSchedule();
        for (let i = 0; i < 2; i++) {
          const ai = normalizeEvents(parseJSON(mockAI({ messages: [{ role: "user", content: P.calendar() }] })));
          if (ai.length) return { events: mergeEvents(base, ai) };
        }
        return { events: base };
      });
      return json(res, 200, { events: (v.events || []).map((e) => (pro ? e : { ...e, effect: e.effect ? "locked" : "" })) });
    } catch { return err(res, 502, "ดึงปฏิทินไม่สำเร็จ"); }
  },
  "GET /api/market/news": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    const pro = isPro(a.user, a.role);
    try {
      const v = await cached("news", 20, async () => {
        const p = parseJSON(mockAI({ messages: [{ role: "user", content: P.news() }] }));
        return { news: p.news?.length ? p.news : (p.__salvaged || []).filter((n) => n && n.title) };
      });
      return json(res, 200, { news: (v.news || []).map((n) => (pro ? n : { ...n, tone: null })) });
    } catch { return err(res, 502, "ดึงข่าวไม่สำเร็จ"); }
  },
  "GET /api/market/outlook": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    try {
      const v = await cached("outlook", 15, async () => parseJSON(mockAI({ messages: [{ role: "user", content: P.outlook() }] })));
      if (!isPro(a.user, a.role)) return json(res, 200, { spot: v.spot, change: v.change, dir: v.dir, locked: true });
      return json(res, 200, v);
    } catch { return err(res, 502, "ประเมินแนวโน้มไม่สำเร็จ"); }
  },
  "POST /api/market/edge": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    if (!isPro(a.user, a.role)) return err(res, 403, "สำหรับสมาชิก Pro");
    const { title, at } = req.body || {}; if (!title || !at) return err(res, 400, "missing event");
    const when = new Date(at).toLocaleString("th-TH", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
    try {
      const v = await cached("edge:" + at + ":" + title, 30, async () => parseJSON(mockAI({ messages: [{ role: "user", content: P.edge(title, when) }] })));
      return json(res, 200, v);
    } catch { return err(res, 502, "ประเมินไม่สำเร็จ"); }
  },

  "POST /api/chat": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    const msgs = (req.body?.messages || []).slice(-8).filter((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return err(res, 400, "bad messages");
    try { return json(res, 200, { reply: mockAI({ system: P.chat, messages: msgs }).trim() }); }
    catch { return err(res, 502, "ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง"); }
  },

  "POST /api/payments/submit": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return;
    if (a.role === "admin") return err(res, 400, "บัญชีผู้ดูแลไม่ต้องชำระ");
    const { planId, slip } = req.body || {};
    const plan = PLANS[planId]; if (!plan) return err(res, 400, "ไม่พบแพ็กเกจ");
    const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(slip || ""); if (!m) return err(res, 400, "แนบรูปสลิปไม่ถูกต้อง");
    const buf = Buffer.from(m[2], "base64"); if (buf.length > 2_500_000) return err(res, 413, "รูปสลิปใหญ่เกินไป");
    const id = "AO" + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 5).toUpperCase();
    const path = `${a.user.phone}/${id}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
    const up = await sb.storage.from("slips").upload(path, buf, { contentType: `image/${m[1]}`, upsert: true });
    if (up.error) return err(res, 500, "อัปโหลดสลิปไม่สำเร็จ");
    const { error } = await sb.from("payments").insert({ id, phone: a.user.phone, plan_id: planId, amount: plan.price, slip_path: path, status: "pending" });
    if (error) return err(res, 500, "บันทึกคำสั่งซื้อไม่สำเร็จ");
    return json(res, 200, { id, planId, amount: plan.price, status: "pending", createdAt: new Date().toISOString() });
  },

  "GET /api/admin/overview": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return; if (a.role !== "admin") return err(res, 403, "forbidden");
    const [{ data: users }, { data: pays }] = await Promise.all([
      sb.from("users").select("phone, plan, expires, quota_left, scans, via, created_at, last_login").order("created_at", { ascending: false }).limit(500),
      sb.from("payments").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    const out = [];
    for (const p of pays || []) {
      let slip = null;
      if (p.status === "pending") { const s = await sb.storage.from("slips").createSignedUrl(p.slip_path, 3600); slip = s.data?.signedUrl || null; }
      out.push({ id: p.id, phone: p.phone, planId: p.plan_id, amount: p.amount, status: p.status, createdAt: p.created_at, decidedAt: p.decided_at, slip });
    }
    const paid = {};
    for (const p of pays || []) if (p.status === "approved") paid[p.phone] = (paid[p.phone] || 0) + p.amount;
    return json(res, 200, {
      users: (users || []).map((u) => ({ phone: u.phone, plan: u.plan, expires: u.expires, left: u.quota_left,
        scans: u.scans, via: u.via, createdAt: u.created_at, lastLogin: u.last_login, paid: paid[u.phone] || 0 })),
      payments: out,
    });
  },
  "POST /api/admin/decide": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return; if (a.role !== "admin") return err(res, 403, "forbidden");
    const { id, action } = req.body || {};
    const { data: p } = await sb.from("payments").select("*").eq("id", id).maybeSingle();
    if (!p || p.status !== "pending") return err(res, 404, "ไม่พบรายการที่รอตรวจ");
    if (action === "reject") { await sb.from("payments").update({ status: "rejected", decided_at: new Date().toISOString() }).eq("id", id); return json(res, 200, { ok: true }); }
    const plan = PLANS[p.plan_id]; const u = await loadUser(p.phone); if (!plan || !u) return err(res, 404, "ไม่พบผู้ใช้หรือแพ็กเกจ");
    const base = active(u) && u.plan === p.plan_id ? new Date(u.expires) : new Date(); base.setDate(base.getDate() + plan.days);
    const quota = plan.quota == null ? 0 : (active(u) && u.plan === p.plan_id ? u.quota_left || 0 : 0) + plan.quota;
    await sb.from("users").update({ plan: p.plan_id, expires: base.toISOString(), quota_left: quota }).eq("phone", p.phone);
    await sb.from("payments").update({ status: "approved", decided_at: new Date().toISOString() }).eq("id", id);
    return json(res, 200, { ok: true });
  },
  "POST /api/admin/grant": async (req, res) => {
    const a = await requireAuth(req, res); if (!a) return; if (a.role !== "admin") return err(res, 403, "forbidden");
    const { phone, planId } = req.body || {}; const plan = PLANS[planId]; const u = await loadUser(phone);
    if (!plan || !u) return err(res, 404, "ไม่พบผู้ใช้หรือแพ็กเกจ");
    const d = new Date(); d.setDate(d.getDate() + plan.days);
    await sb.from("users").update({ plan: planId, expires: d.toISOString(), quota_left: plan.quota ?? 0 }).eq("phone", phone);
    return json(res, 200, { ok: true });
  },
};

export default async function handler(req, res) {
  const missing = missingRuntimeEnv();
  if (missing.length) return err(res, 503, `server configuration missing: ${missing.join(", ")}`);
  const path = (req.url || "").split("?")[0].replace(/\/+$/, "");
  const fn = H[`${req.method} ${path}`];
  if (!fn) return err(res, 404, "not found");
  try { await fn(req, res); } catch (e) { console.error(e); if (!res.headersSent) err(res, 500, "server error"); }
}
