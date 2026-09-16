/* ทดสอบระบบจริงทั้งเส้นทาง: สมัคร → สแกน → จ่ายเงิน → แอดมินยืนยัน → แพ็กเกจเปิดทันที */
import handler from "./tmp/api-bundled.js";

let COOKIES = {};
const jar = (who) => COOKIES[who] || "";

function makeRes() {
  const res = { _status: 200, _headers: {}, _body: "" };
  res.status = (c) => { res._status = c; return res; };
  res.setHeader = (k, v) => { res._headers[k] = v; };
  res.end = (b) => { res._body = b; };
  Object.defineProperty(res, "headersSent", { get: () => false });
  return res;
}

async function call(who, method, url, body) {
  const req = { method, url, headers: { cookie: jar(who) }, body };
  const res = makeRes();
  await handler(req, res);
  const sc = res._headers["Set-Cookie"];
  if (sc) COOKIES[who] = sc.split(";")[0];
  let json = null;
  try { json = JSON.parse(res._body); } catch {}
  return { status: res._status, body: json };
}

let pass = 0, fail = 0;
const check = (label, cond, detail = "") => {
  if (cond) { pass++; console.log("  ✓", label, detail); }
  else { fail++; console.log("  ✗", label, detail); }
};

/* จำลองคำตอบของ Claude */
globalThis.fetch = async (url, opts) => {
  const b = JSON.parse(opts.body);
  const isScan = JSON.stringify(b.messages).includes("วางแผนเทรด");
  const text = isScan
    ? '{"b":"BUY","c":64,"p":4347.5,"e":4341,"sl":4334.5,"tp":4353,"et":"wait","w":[{"d":"SELL","e":4362,"sl":4368,"tp":4352,"if":"ถ้าหลุด"}],"ps":0.01,"s":"XAUUSD","tf":"M5","ed":"ซื้อได้เปรียบ","r":["a","b","c"]}'
    : '{"spot":"4348","change":"+1.0%","dir":"up","bias":"bull","score":30,"up":62,"horizon":"1-2 สัปดาห์","summary":"s","support":["4300"],"resistance":["4400"],"drivers":[],"events":[],"news":[{"title":"n","source":"R","summary":"s","tone":"bull"}]}';
  return { ok: true, json: async () => ({ content: [{ type: "text", text }] }) };
};

const PNG = "data:image/png;base64," + Buffer.from("x".repeat(500)).toString("base64");
const IMG_B64 = Buffer.from("x".repeat(500)).toString("base64");

console.log("\n═══ 1. สมัครด้วย OTP ═══");
let r = await call("cust", "POST", "/api/auth/register", { phone: "0899999999", password: "abcd1234" });
check("สมัครโดยไม่ยืนยัน OTP ไม่ได้", r.status === 403, r.body?.error);

r = await call("cust", "POST", "/api/auth/otp/request", { phone: "0812", purpose: "register" });
check("เบอร์ไม่ถูกต้องขอรหัสไม่ได้", r.status === 400);
r = await call("cust", "POST", "/api/auth/otp/request", { phone: "0899999999", purpose: "register" });
const otp1 = r.body?.devCode;
check("ขอรหัส OTP สำเร็จ", r.status === 200 && /^\d{6}$/.test(otp1 || ""), `รหัส ${otp1}`);
r = await call("cust", "POST", "/api/auth/otp/request", { phone: "0899999999", purpose: "register" });
check("ขอรหัสรัวไม่ได้ (กัน SMS บาน)", r.status === 429, r.body?.error);

r = await call("cust", "POST", "/api/auth/otp/verify", { phone: "0899999999", code: "000000" });
check("รหัสผิดยืนยันไม่ผ่าน", r.status === 401, r.body?.error);
r = await call("cust", "POST", "/api/auth/otp/verify", { phone: "0899999999", code: otp1 });
check("รหัสถูกยืนยันผ่าน", r.status === 200);

r = await call("cust", "POST", "/api/auth/register", { phone: "0899999999", password: "short" });
check("รหัสผ่านสั้นเกินถูกปฏิเสธ", r.status === 400);
r = await call("cust", "POST", "/api/auth/register", { phone: "0899999999", password: "abcd1234" });
check("เปิดบัญชีสำเร็จ", r.status === 200 && r.body.user.left === 3, `เหลือ ${r.body?.user?.left} ครั้ง`);
check("ลบ OTP ทิ้งหลังใช้แล้ว", globalThis.__DB.otp.length === 0);

r = await call("cust", "POST", "/api/auth/otp/request", { phone: "0899999999", purpose: "register" });
check("เบอร์ที่สมัครแล้วขอรหัสสมัครซ้ำไม่ได้", r.status === 409);

console.log("\n═══ 2. เข้าสู่ระบบ ═══");
COOKIES.cust = "";
r = await call("cust", "POST", "/api/auth/login", { phone: "0899999999", password: "ผิด1234" });
check("รหัสผิดเข้าไม่ได้", r.status === 401, r.body?.error);
r = await call("cust", "POST", "/api/auth/login", { phone: "0811111111", password: "abcd1234" });
check("บัญชีที่ไม่มีเข้าไม่ได้", r.status === 404);
r = await call("cust", "POST", "/api/auth/login", { phone: "0899999999", password: "abcd1234" });
check("เข้าสู่ระบบสำเร็จ", r.status === 200 && r.body.role === "user");

console.log("\n═══ 3. สแกนและโควตา ═══");
for (let i = 1; i <= 3; i++) {
  r = await call("cust", "POST", "/api/scan", { image: IMG_B64, mime: "image/png", note: "" });
  check(`สแกนครั้งที่ ${i}`, r.status === 200 && r.body.result.b === "BUY", `เหลือ ${r.body?.left}`);
}
r = await call("cust", "POST", "/api/scan", { image: IMG_B64, mime: "image/png" });
check("ครั้งที่ 4 ถูกกั้น (โควตาหมด)", r.status === 402, r.body?.error);

console.log("\n═══ 4. สิทธิ์ Pro ถูกกั้นฝั่งเซิร์ฟเวอร์ ═══");
r = await call("cust", "GET", "/api/market/outlook");
check("บัญชีฟรีได้แค่ราคา ไม่ได้บทวิเคราะห์", r.status === 200 && r.body.locked === true && !r.body.summary);
r = await call("cust", "POST", "/api/market/edge", { title: "FOMC", at: new Date().toISOString() });
check("คาดการณ์ก่อนข่าวถูกปฏิเสธ", r.status === 403);

console.log("\n═══ 5. ส่งสลิป ═══");
r = await call("cust", "POST", "/api/payments/submit", { planId: "month", slip: PNG });
const orderId = r.body?.id;
check("ส่งสลิปสำเร็จ", r.status === 200 && r.body.status === "pending", orderId);
check("สลิปถูกเก็บใน storage", globalThis.__FILES.size === 1);
r = await call("cust", "GET", "/api/auth/me");
check("ลูกค้าเห็นสถานะรอตรวจ", r.body.pending?.id === orderId);

console.log("\n═══ 6. เข้าหลังบ้านด้วยรหัส (F7) ═══");
r = await call("admin", "POST", "/api/auth/admin", { password: "000000" });
check("รหัสผิดเข้าไม่ได้", r.status === 401, r.body?.error);
r = await call("admin", "POST", "/api/auth/admin", { password: "254777" });
check("รหัสถูกเข้าได้", r.status === 200 && r.body.role === "admin");

console.log("\n═══ 7. หลังบ้านดูข้อมูลลูกค้า ═══");
r = await call("admin", "GET", "/api/admin/overview");
const ov = r.body;
check("เห็นรายชื่อลูกค้า", ov.users.length === 1 && ov.users[0].phone === "0899999999");
check("เห็นจำนวนสแกนของลูกค้า", ov.users[0].scans === 3, `${ov.users[0].scans} ครั้ง`);
check("เห็นสลิปรอตรวจ", ov.payments.length === 1 && ov.payments[0].status === "pending");
check("มีลิงก์ดูรูปสลิป", !!ov.payments[0].slip);
r = await call("cust", "GET", "/api/admin/overview");
check("ลูกค้าเปิดหลังบ้านไม่ได้", r.status === 403);

console.log("\n═══ 8. ยืนยันสลิป → แพ็กเกจเปิดทันที ═══");
r = await call("admin", "POST", "/api/admin/decide", { id: orderId, action: "approve" });
check("อนุมัติสำเร็จ", r.status === 200);
r = await call("cust", "GET", "/api/auth/me");
check("ลูกค้าได้แพ็กเกจทันที", r.body.user.plan === "month", `plan=${r.body?.user?.plan}`);
check("ไม่มีสลิปค้างแล้ว", r.body.pending === null);
const days = Math.round((new Date(r.body.user.expires) - Date.now()) / 864e5);
check("อายุ 30 วัน", days === 30, `${days} วัน`);

console.log("\n═══ 9. Pro ใช้งานได้เต็ม ═══");
r = await call("cust", "POST", "/api/scan", { image: IMG_B64, mime: "image/png" });
check("สแกนได้ไม่จำกัด", r.status === 200 && r.body.unlimited === true);
r = await call("cust", "GET", "/api/market/outlook");
check("เห็นบทวิเคราะห์เต็ม", r.status === 200 && !r.body.locked && !!r.body.summary);
r = await call("cust", "POST", "/api/market/edge", { title: "FOMC", at: new Date().toISOString() });
check("เห็นคาดการณ์ก่อนข่าว", r.status === 200);

console.log("\n═══ 10. ปฏิเสธสลิป ═══");
r = await call("cust", "POST", "/api/payments/submit", { planId: "day", slip: PNG });
const id2 = r.body.id;
r = await call("admin", "POST", "/api/admin/decide", { id: id2, action: "reject" });
check("ปฏิเสธสำเร็จ", r.status === 200);
r = await call("cust", "GET", "/api/auth/me");
check("แพ็กเกจเดิมไม่ถูกแตะ", r.body.user.plan === "month");
check("สถานะสลิปเป็นถูกปฏิเสธ", r.body.last.status === "rejected");

console.log("\n═══ 11. เปิดแพ็กเกจด้วยมือ ═══");
r = await call("admin", "POST", "/api/admin/grant", { phone: "0899999999", planId: "year" });
check("เปิดให้ด้วยมือสำเร็จ", r.status === 200);
r = await call("cust", "GET", "/api/auth/me");
check("ลูกค้าได้รายปี", r.body.user.plan === "year");

console.log("\n═══ 12. ลืมรหัสผ่าน (OTP) ═══");
r = await call("cust2", "POST", "/api/auth/otp/request", { phone: "0811111111", purpose: "reset" });
check("เบอร์ที่ไม่มีบัญชี รีเซ็ตไม่ได้", r.status === 404);
r = await call("cust2", "POST", "/api/auth/otp/request", { phone: "0899999999", purpose: "reset" });
const otpR = r.body?.devCode;
check("ขอรหัสรีเซ็ตสำเร็จ", r.status === 200 && !!otpR);
r = await call("cust2", "POST", "/api/auth/reset", { phone: "0899999999", password: "newpass123" });
check("ยังไม่ยืนยัน OTP รีเซ็ตไม่ได้", r.status === 403);
await call("cust2", "POST", "/api/auth/otp/verify", { phone: "0899999999", code: otpR });
r = await call("cust2", "POST", "/api/auth/reset", { phone: "0899999999", password: "newpass123" });
check("ตั้งรหัสผ่านใหม่สำเร็จ", r.status === 200);
COOKIES.cust2 = "";
r = await call("cust2", "POST", "/api/auth/login", { phone: "0899999999", password: "abcd1234" });
check("รหัสเดิมใช้ไม่ได้แล้ว", r.status === 401);
r = await call("cust2", "POST", "/api/auth/login", { phone: "0899999999", password: "newpass123" });
check("รหัสใหม่เข้าได้", r.status === 200);

console.log("\n═══ 13. ออกจากระบบ ═══");
r = await call("cust", "POST", "/api/auth/logout");
COOKIES.cust = "";
r = await call("cust", "GET", "/api/auth/me");
check("ออกแล้วเข้าข้อมูลไม่ได้", r.status === 401);

console.log(`\n${"═".repeat(46)}\nผ่าน ${pass} ข้อ  ล้มเหลว ${fail} ข้อ\n${"═".repeat(46)}`);
process.exit(fail ? 1 : 0);
