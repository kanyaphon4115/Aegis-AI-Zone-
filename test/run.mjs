/* bundle backend เข้ากับฐานข้อมูลจำลอง แล้วรันชุดทดสอบ */
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || randomUUID();
const env = { ...process.env, SUPABASE_URL: "https://mock.test", SUPABASE_SERVICE_KEY: "k",
  JWT_SECRET: randomUUID() + randomUUID(), ADMIN_PHONE: process.env.TEST_ADMIN_PHONE || "0899999998",
  ADMIN_PASSWORD: testAdminPassword, INVITE_CODES: "AEGIS2026", ANTHROPIC_API_KEY: "test-key" };
if (!existsSync("test/tmp")) mkdirSync("test/tmp", { recursive: true });
execSync(`npx esbuild "api/[...path].js" --bundle --platform=node --format=esm --outfile=test/tmp/api-bundled.js --alias:@supabase/supabase-js=./test/mock-supabase.js --external:bcryptjs --external:jsonwebtoken --log-level=error`, { stdio: "inherit" });
execSync("node test/e2e.mjs", { stdio: "inherit", env });
