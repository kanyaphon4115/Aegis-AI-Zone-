/* bundle backend เข้ากับฐานข้อมูลจำลอง แล้วรันชุดทดสอบ */
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
const env = { ...process.env, SUPABASE_URL: "https://mock.test", SUPABASE_SERVICE_KEY: "k",
  JWT_SECRET: "testsecret1234567890", ADMIN_PHONE: process.env.ADMIN_PHONE || "0820431635",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "254777", INVITE_CODES: "AEGIS2026", ANTHROPIC_API_KEY: "sk-test" };
if (!existsSync("test/tmp")) mkdirSync("test/tmp", { recursive: true });
execSync(`npx esbuild "api/[...path].js" --bundle --platform=node --format=esm --outfile=test/tmp/api-bundled.js --alias:@supabase/supabase-js=./test/mock-supabase.js --external:bcryptjs --external:jsonwebtoken --log-level=error`, { stdio: "inherit" });
execSync("node test/e2e.mjs", { stdio: "inherit", env });
