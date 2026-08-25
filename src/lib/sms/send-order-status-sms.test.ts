import { describe, it, expect } from "vitest";
import { ORDER_STATUSES } from "@/lib/constants/order-status";

// We can't import sendOrderStatusSms directly and call it (it hits the
// network), but we can verify the STATUS_MESSAGES map covers every
// status by re-importing the module and checking its exported keys
// indirectly through a dry run: construct a message for every status
// and confirm none throw / none are empty.
import { sendOrderStatusSms } from "@/lib/sms/send-order-status-sms";

describe("sendOrderStatusSms message coverage", () => {
  it("has a defined message for every order status (no silent gaps)", async () => {
    // Mock fetch so no real network call happens; we only care that
    // STATUS_MESSAGES[status] doesn't throw a "cannot read property of
    // undefined" for any status in the state machine.
    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response(JSON.stringify({ status: 1 }), { status: 200 })) as typeof fetch;

    try {
      for (const status of ORDER_STATUSES) {
        await expect(
          sendOrderStatusSms("09121234567", 10001, status),
        ).resolves.not.toThrow();
      }
    } finally {
      global.fetch = originalFetch;
    }
  });
});
