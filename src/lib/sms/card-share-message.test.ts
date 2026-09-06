import { describe, expect, it } from "vitest";
import { buildCardShareMessage } from "./card-share-message";

describe("buildCardShareMessage", () => {
  it("includes the card number, shaba, bank, owner name, and store name", () => {
    const message = buildCardShareMessage({
      cardNumber: "6037991234567890",
      shabaNumber: "IR120570028180010956499103",
      bankName: "بانک ملت",
      ownerName: "محمد پرس‌بوی",
    });

    expect(message).toContain("6037991234567890");
    expect(message).toContain("IR120570028180010956499103");
    expect(message).toContain("بانک ملت");
    expect(message).toContain("محمد پرس‌بوی");
    expect(message).toContain("سرای فرش سَقَطچی");
  });
});
