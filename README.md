# AEGIS ORBIT — คู่มือเอาขึ้นเว็บ .com

โครงสร้าง: **Render Static Site** (หน้าเว็บ Vite) + **Render Web Service** (Express API) + **Supabase** (ฐานข้อมูล + ที่เก็บสลิป)
ทั้งสองอย่างมีแพ็กเกจฟรีเพียงพอสำหรับเริ่มขาย ค่าใช้จ่ายจริงมีแค่ **โดเมน** (~400-600 บาท/ปี) ระบบใช้ Mock AI ภายในและไม่เรียกบริการ AI ภายนอก

ใช้เวลาประมาณ 30-60 นาที ทำตามลำดับนี้

---

## 0. เตรียมเครื่อง (ครั้งเดียว)

1. ติดตั้ง **Node.js** (LTS) จาก https://nodejs.org
2. ติดตั้ง **Git** จาก https://git-scm.com
3. สมัครบัญชี **GitHub** https://github.com (ฟรี) — Vercel จะดึงโค้ดจากที่นี่

## 1. Supabase — ฐานข้อมูล

1. ไป https://supabase.com → **New project** → ตั้งชื่อ `aegis-orbit` เลือก region **Singapore** ตั้งรหัสฐานข้อมูลอะไรก็ได้ (จดไว้)
2. รอสร้างเสร็จ (~2 นาที) → เมนูซ้าย **SQL Editor** → **New query** → เปิดไฟล์ `supabase/schema.sql` คัดลอกทั้งหมดวางแล้วกด **Run** → ต้องขึ้น "Success"
3. เมนู **Storage** → ต้องเห็น bucket ชื่อ `slips` (ถ้าไม่มี กด New bucket ชื่อ `slips` แบบ **Private**)
4. เมนู **Project Settings → API** จดค่า 2 ตัว:
   - **Project URL** → ใช้เป็น `SUPABASE_URL`
   - **service_role** (secret) → ใช้เป็น `SUPABASE_SERVICE_KEY` (ห้ามเอาไปวางในหน้าเว็บเด็ดขาด)

## 2. Mock AI ภายใน

ระบบสแกนกราฟ, แชต และข้อมูลตลาดใช้ Mock AI ภายใน จึงไม่ต้องสมัครบริการ AI, ไม่ต้องตั้ง API key และไม่มีค่าใช้จ่ายจากผู้ให้บริการ AI ภายนอก ผลลัพธ์มีไว้สำหรับทดสอบระบบและไม่ใช่คำแนะนำการลงทุน

## 2.5 SMS OTP (ยืนยันเบอร์ตอนสมัคร)

ระบบสมัครสมาชิกส่งรหัส 6 หลักทาง SMS ไปยืนยันเบอร์ก่อนเปิดบัญชี เลือกได้ 3 โหมดที่ตัวแปร `SMS_PROVIDER`

### โหมด console — ใช้ตอนทดสอบ ฟรี
ตั้ง `SMS_PROVIDER=console` ระบบจะไม่ส่ง SMS จริงแต่โชว์รหัสบนหน้าจอและใน log ของ Vercel
เหมาะกับตอนทดลองระบบก่อนเปิดขาย **ห้ามใช้ตอนเปิดจริง** เพราะใครก็สมัครด้วยเบอร์คนอื่นได้

### โหมด thaibulksms — แนะนำสำหรับไทย
1. สมัครที่ https://www.thaibulksms.com แล้วเติมเครดิต (ประมาณ 0.25-0.45 บาทต่อข้อความ)
2. ไปที่ **Setting > API Key** กด API Key แล้วจดค่า **API Key** กับ **API Secret**
3. ตั้งค่าใน Vercel

```
SMS_PROVIDER=thaibulksms
THAIBULKSMS_KEY=<API Key>
THAIBULKSMS_SECRET=<API Secret>
SMS_SENDER=SMS
```

`SMS_SENDER` คือชื่อผู้ส่งที่ลูกค้าเห็น ต้องเป็นชื่อที่ลงทะเบียนไว้กับ ThaiBulkSMS แล้วเท่านั้น
ถ้ายังไม่ได้จดชื่อของตัวเอง ให้ใช้ค่าเริ่มต้นที่เขาแถมมา เช่น `SMS` หรือ `Demo` ไปก่อน — **ใส่ชื่อมั่วแล้ว SMS จะไม่ออก**

### โหมด twilio — ถ้ามีลูกค้าต่างประเทศ

```
SMS_PROVIDER=twilio
TWILIO_SID=ACxxxx
TWILIO_TOKEN=xxxx
TWILIO_FROM=+1xxxxxxxxxx
```

### กันค่า SMS บานปลาย
ระบบกันไว้ให้แล้ว: ขอรหัสใหม่ได้ทุก 60 วินาที · ขอได้สูงสุด 5 ครั้งต่อชั่วโมงต่อเบอร์ · ใส่รหัสผิดได้ 5 ครั้งต่อรหัส ·
รหัสหมดอายุใน 5 นาที · รหัสถูกเก็บแบบเข้ารหัส (แม้เปิดฐานข้อมูลดูก็ไม่เห็นตัวเลข) · เบอร์ที่สมัครแล้วขอรหัสสมัครซ้ำไม่ได้

## 3. เอาโค้ดขึ้น GitHub

เปิด Terminal (Mac) / PowerShell (Windows) ในโฟลเดอร์นี้:

```bash
npm install
git init
git add .
git commit -m "AEGIS ORBIT v1"
```

ที่ GitHub กด **New repository** ชื่อ `aegis-orbit` (Private) → คัดลอก 2 คำสั่งที่มันโชว์:

```bash
git remote add origin https://github.com/<ชื่อคุณ>/aegis-orbit.git
git push -u origin main
```

## 4. Render — ขึ้นเว็บ

สร้างสองบริการจาก repository เดียวกัน โดยตั้ง **Root Directory** เป็นโฟลเดอร์นี้ทั้งคู่

1. สร้าง **Web Service** สำหรับ API: Build Command `npm install`, Start Command `npm start` และตั้ง Environment Variables ฝั่งนี้เท่านั้น:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL จาก Supabase |
| `SUPABASE_SERVICE_KEY` | service_role key จาก Supabase — เป็นความลับ |
| `JWT_SECRET` | ค่าสุ่มยาวอย่างน้อย 40 ตัว — เป็นความลับ |
| `ADMIN_PHONE` / `ADMIN_PASSWORD` | เบอร์และรหัสผู้ดูแลที่กำหนดเอง — เป็นความลับ |
| `FRONTEND_URL` | URL ของ Render Static Site เช่น `https://aegis-orbit.onrender.com` |
| `INVITE_CODES` | ไม่บังคับ: รหัสคั่นด้วย comma |
| `SMS_PROVIDER` | `console` ระหว่างทดสอบ หรือ `thaibulksms` / `twilio` สำหรับใช้งานจริง |
| `THAIBULKSMS_KEY`, `THAIBULKSMS_SECRET`, `SMS_SENDER` | ใส่เมื่อใช้ ThaiBulkSMS |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` | ใส่เมื่อใช้ Twilio |
| `COOKIE_SAME_SITE` | แนะนำ `None` สำหรับ Render Static Site + Web Service คนละ origin; ใช้ `Lax` เฉพาะ same-origin |

2. สร้าง **Static Site** สำหรับ frontend: Build Command `npm install && npm run build`, Publish Directory `dist` และกำหนด `VITE_API_URL` เป็น URL ของ Web Service แบบไม่มี `/` ท้ายสุด เช่น `https://aegis-orbit-api.onrender.com` จากนั้น redeploy Static Site เพื่อให้ Vite ฝังค่านี้ตอน build

`FRONTEND_URL` ต้องตรงกับ URL ของ Static Site ทุกตัวอักษร (หากมีหลาย origin ใช้ `CORS_ORIGINS` แบบคั่น comma แทนได้) API อนุญาตเฉพาะ origin ใน allow-list พร้อม credentials จึงไม่มี `Access-Control-Allow-Origin: *`.

ทดสอบให้ครบก่อนต่อโดเมน: เปิดบัญชีใหม่ (ต้องได้รหัส OTP) → สแกน 3 ครั้ง → ครั้งที่ 4 ต้องเด้งแพ็กเกจ → ส่งสลิป → ออกจากระบบ → เข้าด้วยเบอร์แอดมิน → หลังบ้านต้องเห็นสลิป → อนุมัติ → กลับไปบัญชีลูกค้ากด "ตรวจสถานะ" → ต้องเป็น Pro

## 4.5 เข้าหลังบ้าน

หลังบ้านไม่มีปุ่มให้ลูกค้าเห็น เข้าได้ 2 ทาง แล้วใส่รหัส `ADMIN_PASSWORD`

- **คอมพิวเตอร์** กด **F7** ที่หน้าไหนก็ได้
- **มือถือ** แตะที่โลโก้ Aegis Orbit มุมซ้ายบน **5 ครั้งติดกัน**

พอเข้าได้จะมีแท็บ "หลังบ้าน" เพิ่มมาในเมนูล่าง ทำได้:
ดูยอดขายรวม/รายเดือน · กราฟยอดขาย 14 วัน · รายชื่อลูกค้าพร้อมจำนวนสแกนและยอดที่จ่ายมาแล้ว ·
เปิดดูรูปสลิปเต็ม · **กดอนุมัติแล้วแพ็กเกจของลูกค้าเปิดทันที** (ถ้าลูกค้าเปิดแอปค้างไว้ ระบบเช็คให้เองทุก 15 วินาที ไม่ต้องกดอะไร) ·
ปฏิเสธสลิป · เปิดแพ็กเกจให้ด้วยมือ

> ใช้ `ADMIN_PASSWORD` ที่ยาวและคาดเดายาก ไม่ควรใช้รหัสตัวเลขสั้น
> ระบบจึงล็อก 15 นาทีเมื่อใส่ผิดครบ 5 ครั้ง ซึ่งช่วยได้ระดับหนึ่งแต่ไม่ใช่ทั้งหมด
> สามารถเปลี่ยน `ADMIN_PASSWORD` ใน Render ได้ทุกเมื่อโดยไม่ต้องแก้โค้ด

## 5. โดเมน .com

1. ซื้อโดเมนที่ **Cloudflare Registrar** (https://dash.cloudflare.com ราคาทุน ~$10/ปี) หรือ Namecheap / GoDaddy
2. ใน Vercel → Project → **Settings → Domains** → พิมพ์ `yourname.com` → **Add** (เพิ่ม `www.yourname.com` ด้วย Vercel จะ redirect ให้)
3. Vercel จะบอกค่า DNS ที่ต้องตั้ง ไปที่ผู้ให้บริการโดเมน → DNS → เพิ่ม:
   - `A` record ชื่อ `@` ค่า `76.76.21.21`
   - `CNAME` ชื่อ `www` ค่า `cname.vercel-dns.com`
4. รอ 5-30 นาที Vercel ขึ้นติ๊กเขียวและออก **SSL (https) ให้อัตโนมัติ** — เสร็จแล้ว

> ใช้ Cloudflare เป็น DNS: ตั้ง Proxy status ของ record ทั้งสองเป็น **DNS only** (เมฆสีเทา) ไม่งั้น SSL ของ Vercel จะชนกัน

## 5.5 ทดสอบระบบก่อน/หลังแก้โค้ด

```bash
npm install
npm run test
```

เดินระบบจริงทั้งเส้นทาง 35 ข้อบนฐานข้อมูลจำลอง (สมัคร โควตา สลิป อนุมัติ เปิดแพ็กเกจ ปฏิเสธ สิทธิ์ Pro)
ไม่แตะฐานข้อมูลจริงและไม่เสียค่า AI รันได้ตลอด ถ้าขึ้น "ล้มเหลว 0 ข้อ" แปลว่าระบบหลังบ้านพร้อม

## 6. อัปเดตเว็บครั้งต่อไป

แก้โค้ดแล้วรัน `git add . && git commit -m "แก้..." && git push` — Vercel deploy ให้เองใน 1 นาที

## รันบนเครื่องตัวเอง (ไม่บังคับ)

```bash
npm i -g vercel
vercel link          # เชื่อมกับโปรเจกต์บน Vercel
vercel env pull      # ดึง env มาเป็น .env.local
npm run dev          # เปิด http://localhost:3000
```

---

## สิ่งที่ระบบนี้ทำแล้ว vs ยังไม่ทำ

ทำแล้ว: สมัครด้วยเบอร์ + OTP ทาง SMS · ลืมรหัสผ่านผ่าน OTP · หลังบ้านครบวงจร (ดูลูกค้า ยืนยันสลิป เปิดแพ็กเกจทันที) · บัญชีจริง (bcrypt + cookie session 7 วัน) · ล็อกอินผิด 5 ครั้งระงับ 60 วิ · **โควตาและสิทธิ์ Pro ตัดสินที่เซิร์ฟเวอร์** (ปลอมจากหน้าเว็บไม่ได้) · คีย์ AI อยู่หลังบ้านเท่านั้น · สลิปเก็บ private เปิดดูได้เฉพาะแอดมินผ่านลิงก์หมดอายุ 1 ชม. · cache ข้อมูลตลาดประหยัดค่า AI

ยังไม่ทำ (ทำเพิ่มได้ภายหลัง): ตรวจสลิปอัตโนมัติ (ใช้ API ธนาคาร/SlipOK) · จำกัดจำนวนครั้งต่อ IP · หน้า Landing สำหรับคนยังไม่สมัคร · Google Analytics

## ข้อกฎหมายที่ควรทำ

ใส่หน้า **ข้อกำหนดการใช้งาน** และ **นโยบายความเป็นส่วนตัว** (PDPA) และคงคำเตือน "ไม่ใช่คำแนะนำการลงทุน" ไว้ทุกหน้า — การให้สัญญาณเทรดแบบเก็บเงินในไทยควรปรึกษาเรื่องใบอนุญาต ก.ล.ต. ก่อนโฆษณาในวงกว้าง
