import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

// فقط درگاه زرین‌پال Mock می‌شود. پایگاه داده واقعی (محلی، Replica Set) است و
// `reconcileTopups`، `processTopupCallback`، Claim، Transaction و Ledger همگی واقعی‌اند.
vi.mock("@/lib/payment/zarinpal", async (orig) => {
  const actual = await orig<typeof import("@/lib/payment/zarinpal")>();
  return { ...actual, verifyZarinpalPayment: vi.fn() };
});

import { connectToDatabase } from "@/lib/db/connect";
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
import { Wallet } from "@/models/Wallet";
import { WalletTransaction } from "@/models/WalletTransaction";
import { WalletTopup } from "@/models/WalletTopup";
import { reconcileTopups, RECONCILE_BATCH_LIMIT } from "@/lib/wallet/reconcile-topups";
import { topupCreditKey, TOPUP_CLAIM_TTL_MS } from "@/lib/wallet/process-topup-callback";

/**
 * Phase 2.2A.4.1 — تأیید رفتار واقعی MongoDB برای فیلتر `provider` صف Cron.
 *
 * ایزولاسیون: `reconcileTopups` کل Collection را بر اساس وضعیت و سن می‌خواند، نه بر
 * اساس رکوردهای همین تست. پس «اکنون» ساختگی و بسیار قدیمی (سال ۲۰۰۰) داده می‌شود:
 * هر رکورد غیرمرتبط (ساخته‌شده در زمان واقعی) «جوان‌تر از حداقل سن» حساب می‌شود و
 * هرگز انتخاب یا علامت‌گذاری نمی‌شود. Cleanup فقط `_id`/کاربرهای ساخته‌شده توسط خود
 * تست را حذف می‌کند و هر تست داده‌های مستقل می‌سازد.
 */
const NOW = new Date("2000-01-01T12:00:00Z");
const minutesBefore = (m: number) => new Date(NOW.getTime() - m * 60 * 1000);

const verify = vi.mocked(verifyZarinpalPayment);
const OK = { success: true, refId: 4242, cardPan: "6037" } as never;
const TRANSIENT = { success: false, code: 0, message: "net", retryable: true } as never;

type ProviderSpec = "zarinpal" | "sepehr" | null | "absent";
interface Spec {
  provider: ProviderSpec;
  ageMin: number;
  /** "legacy" = رکورد قدیمی که فیلدهای 2.2A/2.2A.2 را ندارد. */
  shape?: "full" | "legacy";
  status?: "pending" | "processing";
  /** فقط برای `processing`: چند میلی‌ثانیه پیش Claim شده است. */
  claimedAgoMs?: number;
  amount?: number;
}
interface Made {
  id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  authority: string;
  amount: number;
}

const RUN = Date.now().toString(36).toUpperCase();
let seq = 0;
const ids: mongoose.Types.ObjectId[] = [];
const users: mongoose.Types.ObjectId[] = [];
let fetchSpy: ReturnType<typeof vi.spyOn>;

/** Insert خام (بدون Mongoose)، تا `provider` دقیقاً مقدار/نبودِ دلخواه را داشته باشد و `createdAt` ساختگی بماند. */
async function insertTopup(spec: Spec): Promise<Made> {
  const id = new mongoose.Types.ObjectId();
  const user = new mongoose.Types.ObjectId();
  const amount = spec.amount ?? 10000;
  const authority = `RCN${RUN}${seq++}`.padEnd(36, "0");
  const createdAt = minutesBefore(spec.ageMin);
  const status = spec.status ?? "pending";
  const doc: Record<string, unknown> = {
    _id: id, user, amount, status, authority, description: "reconcile-itest",
    refId: null, cardPan: null, paidAt: null, failureReason: null, createdAt, updatedAt: createdAt,
  };
  if ((spec.shape ?? "full") === "full") {
    Object.assign(doc, {
      gatewayToken: null, digitalReceipt: null, processingToken: null, processingStartedAt: null,
      reconciliationNote: null, needsManualReview: false, lastReconcileAt: null, reconcileAttempts: 0,
    });
  }
  if (status === "processing") {
    doc.processingToken = "dead-worker";
    doc.processingStartedAt = new Date(NOW.getTime() - (spec.claimedAgoMs ?? TOPUP_CLAIM_TTL_MS + 60_000));
  }
  if (spec.provider !== "absent") doc.provider = spec.provider;
  await WalletTopup.collection.insertOne(doc);
  ids.push(id);
  users.push(user);
  return { id, user, authority, amount };
}

async function insertWallet(user: mongoose.Types.ObjectId, balance: number) {
  await Wallet.collection.insertOne({ user, balance, createdAt: NOW, updatedAt: NOW });
}

const rawTopups = (list: Made[]) =>
  WalletTopup.collection.find({ _id: { $in: list.map((m) => m.id) } }).sort({ _id: 1 }).toArray();
const rawWallets = (list: Made[]) =>
  Wallet.collection.find({ user: { $in: list.map((m) => m.user) } }).sort({ user: 1 }).toArray();
const ledgerRows = (list: Made[]) => WalletTransaction.countDocuments({ user: { $in: list.map((m) => m.user) } });
const topupOf = (m: Made) => WalletTopup.findById(m.id).lean();
const balanceOf = async (m: Made) =>
  (await Wallet.findOne({ user: m.user }).lean<{ balance: number } | null>())?.balance ?? 0;
const creditRows = (m: Made) => WalletTransaction.countDocuments({ idempotencyKey: topupCreditKey(m.id) });
const verifiedAuthorities = () =>
  verify.mock.calls.map((c) => (c[0] as { authority: string }).authority).sort();

beforeAll(async () => {
  await connectToDatabase();
  await Wallet.syncIndexes();
  await WalletTransaction.syncIndexes();
  await WalletTopup.syncIndexes();
});

beforeEach(() => {
  verify.mockReset();
  // Verify سپهر با `fetch` انجام می‌شود؛ در این مسیر نباید هیچ تماسی برقرار شود.
  fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network must not be used"));
});

afterEach(async () => {
  fetchSpy.mockRestore();
  if (mongoose.connection.readyState === 1) {
    await WalletTopup.deleteMany({ _id: { $in: ids } });
    await WalletTransaction.deleteMany({ user: { $in: users } });
    await Wallet.deleteMany({ user: { $in: users } });
  }
  ids.length = 0;
  users.length = 0;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Mongo واقعی: reconcileTopups — فیلتر provider (M-1)", () => {
  it("Test 1 — Provider Filtering: zarinpal، null و نبودِ فیلد انتخاب می‌شوند؛ sepehr نه", async () => {
    const z = await insertTopup({ provider: "zarinpal", ageMin: 60 });
    const n = await insertTopup({ provider: null, ageMin: 61 });
    const a = await insertTopup({ provider: "absent", ageMin: 62, shape: "legacy" });
    const s = await insertTopup({ provider: "sepehr", ageMin: 63 });
    const sepehrBefore = await rawTopups([s]);
    // Verify موقتاً ناموفق: هیچ پولی جابه‌جا نمی‌شود؛ انتخاب با اثر Claim در DB دیده می‌شود.
    verify.mockResolvedValue(TRANSIENT);

    const summary = await reconcileTopups({ now: NOW });

    expect(summary.scanned).toBe(3);
    expect(summary.errors).toBe(0);
    expect(verifiedAuthorities()).toEqual([z, n, a].map((m) => m.authority).sort());
    for (const m of [z, n, a]) {
      const doc = await topupOf(m);
      expect(doc?.status).toBe("pending");
      expect(doc?.reconcileAttempts).toBe(1);
      expect(doc?.lastReconcileAt).toEqual(NOW);
    }
    expect(await rawTopups([s])).toEqual(sepehrBefore);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Test 1b — معنای `$in:[...,null]` در Mongo: null و نبودِ فیلد هر دو مطابق‌اند", async () => {
    const z = await insertTopup({ provider: "zarinpal", ageMin: 60 });
    const n = await insertTopup({ provider: null, ageMin: 60 });
    const a = await insertTopup({ provider: "absent", ageMin: 60, shape: "legacy" });
    const s = await insertTopup({ provider: "sepehr", ageMin: 60 });
    const found = await WalletTopup.find({
      _id: { $in: [z, n, a, s].map((m) => m.id) },
      provider: { $in: ["zarinpal", null] },
    })
      .select("_id")
      .lean();
    expect(found.map((d) => String(d._id)).sort()).toEqual([z, n, a].map((m) => String(m.id)).sort());
  });

  it("Test 2 — Starvation Regression: ۲۵ Sepehr قدیمی نباید Zarinpal را از Batch بیندازند", async () => {
    expect(25).toBeGreaterThan(RECONCILE_BATCH_LIMIT);
    const sepehr: Made[] = [];
    // Sepehr قدیمی‌تر است تا در ترتیب صف (`lastReconcileAt` سپس `createdAt`) جلوتر بیاید.
    for (let i = 0; i < 25; i++) sepehr.push(await insertTopup({ provider: "sepehr", ageMin: 600 + i }));
    const z = await insertTopup({ provider: "zarinpal", ageMin: 60, amount: 7000 });
    const sepehrBefore = await rawTopups(sepehr);
    verify.mockResolvedValue(OK);

    const summary = await reconcileTopups({ now: NOW });

    expect(summary.scanned).toBe(1);
    expect(summary.credited).toBe(1);
    expect(summary.errors).toBe(0);
    expect((await topupOf(z))?.status).toBe("paid");
    expect(await balanceOf(z)).toBe(7000);
    expect(await creditRows(z)).toBe(1);
    expect(verifiedAuthorities()).toEqual([z.authority]);
    expect(await rawTopups(sepehr)).toEqual(sepehrBefore);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Test 3 — Sepehr Data Integrity: وضعیت، فیلدهای صف، موجودی و Ledger قبل/بعد یکسان‌اند", async () => {
    const sepehr: Made[] = [];
    for (let i = 0; i < 24; i++) sepehr.push(await insertTopup({ provider: "sepehr", ageMin: 600 + i }));
    // Sepehr با Claim کهنه: در شاخه `processing` هم نباید انتخاب شود.
    sepehr.push(await insertTopup({ provider: "sepehr", ageMin: 700, status: "processing" }));
    for (const m of sepehr) await insertWallet(m.user, 5000);
    const z = await insertTopup({ provider: "zarinpal", ageMin: 60, amount: 3000 });

    const topupsBefore = await rawTopups(sepehr);
    const walletsBefore = await rawWallets(sepehr);
    const ledgerBefore = await ledgerRows(sepehr);
    verify.mockResolvedValue(OK);

    const s1 = await reconcileTopups({ now: NOW });
    const s2 = await reconcileTopups({ now: new Date(NOW.getTime() + 60 * 60 * 1000) });

    expect(s1.credited).toBe(1);
    expect(s2.scanned).toBe(0); // اجرای بعدی: چیزی برای پردازش نیست، حلقه‌ای وجود ندارد.
    expect(await creditRows(z)).toBe(1);

    expect(await rawTopups(sepehr)).toEqual(topupsBefore);
    for (const t of await rawTopups(sepehr)) {
      expect(["pending", "processing"]).toContain(t.status);
      expect(t.lastReconcileAt).toBeNull();
      expect(t.reconcileAttempts).toBe(0);
      expect(t.needsManualReview).toBe(false);
    }
    expect((await topupOf(sepehr[24]))?.processingToken).toBe("dead-worker");
    expect(await rawWallets(sepehr)).toEqual(walletsBefore);
    expect(await ledgerRows(sepehr)).toBe(ledgerBefore);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Test 3b — فقط Sepehr: هیچ پردازشی، هیچ Credit، هیچ تغییری", async () => {
    const sepehr: Made[] = [];
    for (let i = 0; i < 25; i++) sepehr.push(await insertTopup({ provider: "sepehr", ageMin: 60 + i }));
    const before = await rawTopups(sepehr);

    const s = await reconcileTopups({ now: NOW });

    expect(s).toMatchObject({
      scanned: 0, processed: 0, credited: 0, stillPending: 0,
      failed: 0, flaggedForReview: 0, errors: 0, stoppedByBudget: false,
    });
    expect(verify).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await rawTopups(sepehr)).toEqual(before);
    expect(await ledgerRows(sepehr)).toBe(0);
  });

  it("Test 3c — رفتار قبلی (خارج از M-1): Sepehr قدیمی‌تر از ۴۸ ساعت فقط علامت بررسی دستی می‌خورد، نه Verify/Credit/تغییر وضعیت", async () => {
    const old = await insertTopup({ provider: "sepehr", ageMin: 49 * 60 });
    verify.mockResolvedValue(OK);

    await reconcileTopups({ now: NOW });

    const doc = await topupOf(old);
    expect(doc?.status).toBe("pending");
    expect(doc?.needsManualReview).toBe(true); // مرحله ۱ تابع، برای همه Providerها (رفتار موجود)
    expect(doc?.reconcileAttempts).toBe(0);
    expect(verify).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await ledgerRows([old])).toBe(0);
  });
});

describe("Mongo واقعی: reconcileTopups — Regression رفتار Zarinpal", () => {
  it("Test 4a — واجدشرایط، رکورد قدیمی بدون Provider، پنجره زمانی و processing کهنه/تازه", async () => {
    const explicit = await insertTopup({ provider: "zarinpal", ageMin: 60 });
    const nullProv = await insertTopup({ provider: null, ageMin: 61 });
    const legacy = await insertTopup({ provider: "absent", ageMin: 62, shape: "legacy" });
    const staleProc = await insertTopup({ provider: "zarinpal", ageMin: 90, status: "processing" });
    const young = await insertTopup({ provider: "zarinpal", ageMin: 1 });
    const freshProc = await insertTopup({
      provider: "zarinpal", ageMin: 90, status: "processing", claimedAgoMs: 10_000,
    });
    const tooOld = await insertTopup({ provider: "zarinpal", ageMin: 49 * 60 });
    verify.mockResolvedValue(OK);

    const summary = await reconcileTopups({ now: NOW });

    expect(summary.scanned).toBe(4);
    expect(summary.credited).toBe(4);
    expect(summary.errors).toBe(0);
    for (const m of [explicit, nullProv, legacy, staleProc]) {
      expect((await topupOf(m))?.status).toBe("paid");
      expect(await balanceOf(m)).toBe(m.amount);
      expect(await creditRows(m)).toBe(1);
    }
    // خارج از پنجره / Claim تازه: Verify نمی‌شوند.
    expect((await topupOf(young))?.status).toBe("pending");
    expect((await topupOf(freshProc))?.status).toBe("processing");
    expect((await topupOf(freshProc))?.processingToken).toBe("dead-worker");
    // قدیمی‌تر از سقف سن: فقط علامت بررسی دستی، بدون Verify و بدون failed.
    const old = await topupOf(tooOld);
    expect(old?.status).toBe("pending");
    expect(old?.needsManualReview).toBe(true);
    expect(old?.reconciliationNote).toContain("unverified_after_max_age");
    expect(await creditRows(tooOld)).toBe(0);
    expect(verifiedAuthorities()).toEqual(
      [explicit, nullProv, legacy, staleProc].map((m) => m.authority).sort(),
    );
  });

  it("Test 4b — Batch Limit و عدم Credit تکراری در اجراهای پشت‌سرهم", async () => {
    const list: Made[] = [];
    for (let i = 0; i < 5; i++) list.push(await insertTopup({ provider: "zarinpal", ageMin: 60 + i }));
    verify.mockResolvedValue(OK);

    const r1 = await reconcileTopups({ now: NOW, limit: 2 });
    expect(r1.scanned).toBe(2);
    expect((await Promise.all(list.map(topupOf))).filter((t) => t?.status === "paid")).toHaveLength(2);

    const r2 = await reconcileTopups({ now: NOW, limit: 2 });
    expect(r2.scanned).toBe(2);
    const r3 = await reconcileTopups({ now: NOW, limit: 2 });
    expect(r3.scanned).toBe(1);
    const r4 = await reconcileTopups({ now: NOW, limit: 2 });
    expect(r4.scanned).toBe(0);

    for (const m of list) {
      expect((await topupOf(m))?.status).toBe("paid");
      expect(await creditRows(m)).toBe(1);
      expect(await balanceOf(m)).toBe(m.amount);
    }
    expect(verify).toHaveBeenCalledTimes(5);
  });

  it("Test 4c — دو Cron هم‌زمان روی Mongo واقعی: برای هر TopUp فقط یک اعتبار", async () => {
    const list: Made[] = [];
    for (let i = 0; i < 6; i++) list.push(await insertTopup({ provider: "zarinpal", ageMin: 60 + i }));
    verify.mockResolvedValue(OK);

    const [a, b] = await Promise.all([reconcileTopups({ now: NOW }), reconcileTopups({ now: NOW })]);

    expect(a.errors + b.errors).toBe(0);
    for (const m of list) {
      expect((await topupOf(m))?.status).toBe("paid");
      expect(await creditRows(m)).toBe(1);
      expect(await balanceOf(m)).toBe(m.amount);
    }
  });

  it("Test 4d — Verify موقتاً ناموفق: pending می‌ماند و در اجرای بعدیِ پس از فاصله دوباره بررسی می‌شود", async () => {
    const z = await insertTopup({ provider: "zarinpal", ageMin: 60 });
    verify.mockResolvedValueOnce(TRANSIENT);
    expect((await reconcileTopups({ now: NOW })).stillPending).toBe(1);
    expect((await topupOf(z))?.status).toBe("pending");
    expect(await creditRows(z)).toBe(0);

    verify.mockResolvedValue(OK);
    const later = new Date(NOW.getTime() + 31 * 60 * 1000);
    expect((await reconcileTopups({ now: later })).credited).toBe(1);
    expect(await creditRows(z)).toBe(1);
  });
});
