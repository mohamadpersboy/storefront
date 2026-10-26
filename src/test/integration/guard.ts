import fs from "fs";
import path from "path";

/**
 * محافظ ایمنی: بدون URI درست، اجرا متوقف می‌شود.
 * هرگز به دیتابیس دیگر وصل نمی‌شود و URI را چاپ نمی‌کند.
 */
const REQUIRED_DB = "carpet_integration_test";
const REQUIRED_RS = "rs0";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^['"]|['"]$/g, "");
    // متغیرهای Shell/CI اولویت دارند.
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.test.local"));

function fail(reason: string): never {
  throw new Error(`[integration-guard] اجرا متوقف شد: ${reason}`);
}

const uri = process.env.MONGODB_URI;
if (!uri) fail("MONGODB_URI تنظیم نشده (فایل .env.test.local را بسازید).");

let parsed: URL;
try {
  parsed = new URL(uri);
} catch {
  fail("MONGODB_URI قابل خواندن نیست.");
}
if (parsed.protocol !== "mongodb:") fail("فقط mongodb:// محلی مجاز است.");
if (!LOCAL_HOSTS.has(parsed.hostname)) fail("میزبان باید 127.0.0.1 یا localhost باشد.");
if (parsed.pathname.replace(/^\//, "") !== REQUIRED_DB) fail(`نام دیتابیس باید ${REQUIRED_DB} باشد.`);
if (parsed.searchParams.get("replicaSet") !== REQUIRED_RS) fail(`پارامتر replicaSet=${REQUIRED_RS} لازم است.`);
if (process.env.ZARINPAL_MODE && process.env.ZARINPAL_MODE !== "sandbox") fail("ZARINPAL_MODE باید sandbox باشد.");
