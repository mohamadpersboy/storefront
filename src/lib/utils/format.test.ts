import { describe, expect, it } from "vitest";
import {
  toPersianDigits,
  toEnglishDigits,
  digitsOnly,
  formatPersonWithPhone,
} from "@/lib/utils/format";

describe("toPersianDigits", () => {
  it("converts ASCII digits to Persian digits", () => {
    expect(toPersianDigits(1234567890)).toBe("۱۲۳۴۵۶۷۸۹۰");
  });

  it("leaves non-digit characters untouched", () => {
    expect(toPersianDigits("1,234")).toBe("۱,۲۳۴");
  });
});

describe("toEnglishDigits", () => {
  it("converts Persian digits to ASCII", () => {
    expect(toEnglishDigits("۱۲۳۴۵۶۷۸۹۰")).toBe("1234567890");
  });

  it("converts Arabic-Indic digits to ASCII", () => {
    expect(toEnglishDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("leaves ASCII digits and other characters untouched", () => {
    expect(toEnglishDigits("09123456789")).toBe("09123456789");
  });
});

describe("digitsOnly", () => {
  it("strips non-digit characters from ASCII input", () => {
    expect(digitsOnly("1,234,567")).toBe("1234567");
  });

  it("normalizes Persian digits before stripping (regression: typing after a Persian-formatted value must not wipe it)", () => {
    // Simulates the exact bug: the input already displays "۱۲۳" and
    // the user types "4" on an ASCII keyboard -> raw value "۱۲۳4".
    expect(digitsOnly("۱۲۳4")).toBe("1234");
  });

  it("handles a purely Persian-digit string", () => {
    expect(digitsOnly("۵۰۰۰۰۰")).toBe("500000");
  });

  it("handles Arabic-Indic digits mixed with separators", () => {
    expect(digitsOnly("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
  });
});

describe("formatPersonWithPhone", () => {
  it("shows name and phone together when a name exists", () => {
    expect(formatPersonWithPhone("علی محمدی", "09121234567")).toBe(
      "علی محمدی (۰۹۱۲۱۲۳۴۵۶۷)",
    );
  });

  it("falls back to just the phone number when there is no name", () => {
    expect(formatPersonWithPhone(null, "09121234567")).toBe("۰۹۱۲۱۲۳۴۵۶۷");
  });

  it("falls back to just the phone number when name is undefined", () => {
    expect(formatPersonWithPhone(undefined, "09121234567")).toBe("۰۹۱۲۱۲۳۴۵۶۷");
  });
});
