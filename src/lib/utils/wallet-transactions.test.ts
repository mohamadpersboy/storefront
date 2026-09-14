import { describe, expect, it } from "vitest";
import { classifyWalletTransaction } from "./wallet-transactions";

describe("classifyWalletTransaction", () => {
  it("classifies a gateway top-up as topup", () => {
    // متن دقیق از wallet/topup/callback/route.ts
    expect(
      classifyWalletTransaction("شارژ کیف پول از طریق درگاه پرداخت (کد پیگیری: 123456)"),
    ).toBe("topup");
  });

  it("classifies a withdrawal request debit as withdrawal", () => {
    // متن دقیق از api/v1/wallet/withdrawals/route.ts
    expect(
      classifyWalletTransaction("درخواست برداشت — در انتظار بررسی و واریز توسط ادمین"),
    ).toBe("withdrawal");
  });

  it("classifies a rejected-withdrawal refund as withdrawal", () => {
    // متن دقیق از api/v1/wallets/withdrawals/[id]/review/route.ts
    expect(classifyWalletTransaction("استرداد درخواست برداشت رد‌شده")).toBe("withdrawal");
  });

  it("classifies a full or partial wallet order payment as order_payment", () => {
    // متن دقیق از lib/payment/initiate-order-payment.ts
    expect(classifyWalletTransaction("پرداخت بخشی از سفارش #1042 از کیف پول")).toBe(
      "order_payment",
    );
  });

  it("classifies an order-payment gateway-failure refund as order_payment", () => {
    expect(
      classifyWalletTransaction(
        "استرداد بخش کیف پول — درخواست پرداخت سفارش #1042 توسط درگاه رد شد",
      ),
    ).toBe("order_payment");
  });

  it("falls back to manual_adjustment for a plain admin adjustment reason", () => {
    expect(classifyWalletTransaction("جبران مغایرت سفارش تلفنی")).toBe("manual_adjustment");
  });
});
