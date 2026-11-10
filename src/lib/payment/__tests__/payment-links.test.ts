import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

type Doc = Record<string, unknown>;
const ORDER_ID = new mongoose.Types.ObjectId();
const ADMIN_ID = new mongoose.Types.ObjectId();
const LINK_ID = new mongoose.Types.ObjectId();

let order: Doc | null;
let links: Doc[];
let paid = 0;
let inFlight = false;
let paymentDoc: Doc | null;
const initiate = vi.fn();

const q = <T,>(get: () => T) => {
  const o = { select: () => o, sort: () => o, lean: async () => get(), then: (r: (v: T) => unknown) => Promise.resolve(get()).then(r) };
  return o;
};

vi.mock("@/models/Order", () => ({ Order: { findById: () => q(() => order) } }));
vi.mock("@/models/Payment", () => ({
  Payment: {
    aggregate: async () => (paid ? [{ _id: null, total: paid }] : []),
    exists: async () => (inFlight ? { _id: "x" } : null),
    findOne: () => q(() => paymentDoc),
  },
}));
vi.mock("@/models/PaymentLink", () => ({
  PaymentLink: {
    findOne: (f: Doc) =>
      q(() => {
        if (f.token) return links.find((l) => l.token === f.token) ?? null;
        const now = (f.expiresAt as { $gt: Date }).$gt;
        return links.find((l) => !l.revokedAt && (l.expiresAt as Date) > now) ?? null;
      }),
    findById: () => q(() => links[0] ?? null),
    create: async (d: Doc) => {
      const doc = { _id: LINK_ID, revokedAt: null, ...d };
      links.push(doc);
      return doc;
    },
  },
}));
vi.mock("@/lib/payment/initiate-order-payment", () => ({ initiateOrderPayment: (...a: unknown[]) => initiate(...a) }));

import {
  createPaymentLink,
  generatePaymentLinkToken,
  getPaymentLinkReturnPath,
  getPaymentLinkView,
  isPaymentLinkToken,
  PAYMENT_LINK_TTL_MS,
  PaymentLinkError,
  startPaymentFromLink,
} from "@/lib/payment/payment-links";

const NOW = new Date("2026-11-10T00:00:00Z");
const TOKEN = "A".repeat(32);
const seedLink = (over: Doc = {}) =>
  links.push({ _id: LINK_ID, order: ORDER_ID, token: TOKEN, expiresAt: new Date(NOW.getTime() + 3600_000), createdBy: ADMIN_ID, revokedAt: null, ...over });

beforeEach(() => {
  order = { _id: ORDER_ID, orderNumber: 10007, status: "pending", paymentMethod: "online", prepaymentAmount: 5000 };
  links = [];
  paid = 0;
  inFlight = false;
  paymentDoc = null;
  initiate.mockReset();
  initiate.mockResolvedValue({ paymentUrl: "https://gateway/pay" });
});

describe("token", () => {
  it("generates unguessable 32-char tokens that pass the pattern", () => {
    const a = generatePaymentLinkToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(a).not.toBe(generatePaymentLinkToken());
    expect(isPaymentLinkToken(a)).toBe(true);
    for (const bad of ["", "short", "A".repeat(33), "A".repeat(31) + "$", { a: 1 }, null]) expect(isPaymentLinkToken(bad)).toBe(false);
  });
});

describe("createPaymentLink", () => {
  it("creates a 72h link and reuses the valid one on the next call", async () => {
    const first = await createPaymentLink({ orderId: String(ORDER_ID), createdBy: String(ADMIN_ID), now: NOW });
    expect(first).toMatchObject({ reused: false, remaining: 5000 });
    expect(first.expiresAt.getTime() - NOW.getTime()).toBe(PAYMENT_LINK_TTL_MS);
    const again = await createPaymentLink({ orderId: String(ORDER_ID), createdBy: String(ADMIN_ID), now: NOW });
    expect(again).toMatchObject({ reused: true, token: first.token });
    expect(links).toHaveLength(1);
  });

  it("rejects cash, cancelled, fully paid and unknown orders", async () => {
    const run = () => createPaymentLink({ orderId: String(ORDER_ID), createdBy: String(ADMIN_ID), now: NOW });
    order = { ...order!, paymentMethod: "cash" };
    await expect(run()).rejects.toMatchObject({ status: 422 });
    order = { ...order, paymentMethod: "online", status: "cancelled" };
    await expect(run()).rejects.toMatchObject({ status: 409 });
    order = { ...order, status: "pending" };
    paid = 5000;
    await expect(run()).rejects.toMatchObject({ status: 409 });
    order = null;
    await expect(run()).rejects.toBeInstanceOf(PaymentLinkError);
    await expect(createPaymentLink({ orderId: "nope", createdBy: "x" })).rejects.toMatchObject({ status: 404 });
  });
});

describe("getPaymentLinkView", () => {
  it("payable: only order number, remaining amount and expiry", async () => {
    seedLink();
    paid = 2000;
    const v = await getPaymentLinkView(TOKEN, NOW);
    expect(v).toEqual({ state: "payable", orderNumber: 10007, amount: 3000, expiresAt: links[0].expiresAt });
  });

  it("unknown/malformed token, expired, revoked and cancelled order are unavailable", async () => {
    expect(await getPaymentLinkView("bad", NOW)).toEqual({ state: "unavailable" });
    expect(await getPaymentLinkView(TOKEN, NOW)).toEqual({ state: "unavailable" });
    seedLink({ expiresAt: new Date(NOW.getTime() - 1) });
    expect((await getPaymentLinkView(TOKEN, NOW)).state).toBe("unavailable");
    links = [];
    seedLink({ revokedAt: NOW });
    expect((await getPaymentLinkView(TOKEN, NOW)).state).toBe("unavailable");
    links = [];
    seedLink();
    order = { ...order!, status: "cancelled" };
    expect((await getPaymentLinkView(TOKEN, NOW)).state).toBe("unavailable");
  });

  it("paid is shown from DB even after the link expired; processing is shown while a callback is in flight", async () => {
    seedLink({ expiresAt: new Date(NOW.getTime() - 1) });
    paid = 5000;
    expect(await getPaymentLinkView(TOKEN, NOW)).toMatchObject({ state: "paid", orderNumber: 10007 });
    paid = 0;
    links = [];
    seedLink();
    inFlight = true;
    expect((await getPaymentLinkView(TOKEN, NOW)).state).toBe("processing");
  });
});

describe("startPaymentFromLink", () => {
  it("starts payment for the link's order as the link creator, wallet off, tied to the link", async () => {
    seedLink();
    expect(await startPaymentFromLink(TOKEN, NOW)).toEqual({ paymentUrl: "https://gateway/pay" });
    expect(initiate).toHaveBeenCalledWith({
      orderId: String(ORDER_ID),
      initiatedByUserId: String(ADMIN_ID),
      useWallet: false,
      paymentLinkId: String(LINK_ID),
    });
  });

  it("never starts for invalid, expired, revoked links or cancelled orders", async () => {
    await expect(startPaymentFromLink("bad", NOW)).rejects.toMatchObject({ status: 404 });
    await expect(startPaymentFromLink(TOKEN, NOW)).rejects.toMatchObject({ status: 404 });
    seedLink({ expiresAt: new Date(NOW.getTime() - 1) });
    await expect(startPaymentFromLink(TOKEN, NOW)).rejects.toMatchObject({ status: 404 });
    links = [];
    seedLink({ revokedAt: NOW });
    await expect(startPaymentFromLink(TOKEN, NOW)).rejects.toMatchObject({ status: 404 });
    links = [];
    seedLink();
    order = { ...order!, status: "cancelled" };
    await expect(startPaymentFromLink(TOKEN, NOW)).rejects.toMatchObject({ status: 409 });
    expect(initiate).not.toHaveBeenCalled();
  });

  it("propagates gateway initiation errors and rejects a missing URL", async () => {
    seedLink();
    initiate.mockRejectedValueOnce(Object.assign(new Error("gateway down"), { status: 502 }));
    await expect(startPaymentFromLink(TOKEN, NOW)).rejects.toMatchObject({ status: 502 });
    initiate.mockResolvedValueOnce({ paymentUrl: null });
    await expect(startPaymentFromLink(TOKEN, NOW)).rejects.toMatchObject({ status: 502 });
  });
});

describe("getPaymentLinkReturnPath", () => {
  it("returns /pay/<token> only for payments started from a link", async () => {
    seedLink();
    expect(await getPaymentLinkReturnPath(null)).toBeNull();
    paymentDoc = null;
    expect(await getPaymentLinkReturnPath("AUTH")).toBeNull();
    paymentDoc = { paymentLink: null };
    expect(await getPaymentLinkReturnPath("AUTH")).toBeNull();
    paymentDoc = { paymentLink: LINK_ID };
    expect(await getPaymentLinkReturnPath("AUTH")).toBe(`/pay/${TOKEN}`);
  });
});
