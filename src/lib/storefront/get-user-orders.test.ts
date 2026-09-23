import { describe, expect, it } from "vitest";
import { buildOrderItemsSummary } from "@/lib/storefront/get-user-orders";

describe("buildOrderItemsSummary", () => {
  it("returns an empty string for no items", () => {
    expect(buildOrderItemsSummary([])).toBe("");
  });

  it("returns just the title for a single item", () => {
    expect(buildOrderItemsSummary([{ title: "فرش ۶ متری کاشان" }])).toBe("فرش ۶ متری کاشان");
  });

  it("appends the remaining count in Persian digits for two items", () => {
    expect(
      buildOrderItemsSummary([{ title: "فرش ۶ متری کاشان" }, { title: "پادری کناره" }]),
    ).toBe("فرش ۶ متری کاشان و ۱ کالای دیگر");
  });

  it("appends the remaining count in Persian digits for many items", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ title: `کالا ${i}` }));
    expect(buildOrderItemsSummary(items)).toBe("کالا 0 و ۴ کالای دیگر");
  });
});
