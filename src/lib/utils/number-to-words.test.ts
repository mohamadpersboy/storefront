import { describe, it, expect } from "vitest";
import { numberToPersianWords, tomanAmountToWords } from "@/lib/utils/number-to-words";

describe("numberToPersianWords", () => {
  it("converts zero", () => {
    expect(numberToPersianWords(0)).toBe("صفر");
  });

  it("converts a single digit", () => {
    expect(numberToPersianWords(7)).toBe("هفت");
  });

  it("converts a teen number", () => {
    expect(numberToPersianWords(14)).toBe("چهارده");
  });

  it("converts a two-digit compound number", () => {
    expect(numberToPersianWords(34)).toBe("سی و چهار");
  });

  it("converts a three-digit number", () => {
    expect(numberToPersianWords(234)).toBe("دویست و سی و چهار");
  });

  it("converts thousands", () => {
    expect(numberToPersianWords(1234)).toBe("یک هزار و دویست و سی و چهار");
  });

  it("converts millions with a zero thousands group", () => {
    expect(numberToPersianWords(1_000_234)).toBe("یک میلیون و دویست و سی و چهار");
  });

  it("converts large amounts (billions)", () => {
    expect(numberToPersianWords(50_000_000_000)).toBe("پنجاه میلیارد");
  });

  it("throws for negative numbers", () => {
    expect(() => numberToPersianWords(-1)).toThrow();
  });

  it("throws for non-integers", () => {
    expect(() => numberToPersianWords(1.5)).toThrow();
  });
});

describe("tomanAmountToWords", () => {
  it("appends the toman unit", () => {
    expect(tomanAmountToWords(1000)).toBe("یک هزار تومان");
  });
});
