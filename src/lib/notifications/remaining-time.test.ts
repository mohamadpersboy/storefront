import { describe, expect, it } from "vitest";
import { formatRemainingTime } from "./remaining-time";

const H = 3600_000;

describe("formatRemainingTime", () => {
  it("formats whole hours", () => {
    expect(formatRemainingTime(24 * H)).toBe("۲۴ ساعت");
    expect(formatRemainingTime(12 * H)).toBe("۱۲ ساعت");
    expect(formatRemainingTime(3 * H)).toBe("۳ ساعت");
    expect(formatRemainingTime(1 * H)).toBe("۱ ساعت");
  });

  it("rounds down and never overstates the remaining time", () => {
    expect(formatRemainingTime(3 * H - 1)).toBe("۲ ساعت");
    expect(formatRemainingTime(23.99 * H)).toBe("۲۳ ساعت");
  });

  it("says «less than one hour» under 60 minutes, including zero/negative", () => {
    expect(formatRemainingTime(59 * 60_000)).toBe("کمتر از یک ساعت");
    expect(formatRemainingTime(0)).toBe("کمتر از یک ساعت");
    expect(formatRemainingTime(-5000)).toBe("کمتر از یک ساعت");
  });

  it("switches to days from 48 hours", () => {
    expect(formatRemainingTime(47 * H)).toBe("۴۷ ساعت");
    expect(formatRemainingTime(48 * H)).toBe("۲ روز");
    expect(formatRemainingTime(168 * H)).toBe("۷ روز");
  });
});
