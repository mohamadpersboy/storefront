import { describe, expect, it } from "vitest";
import { validateProvinceCityRows } from "./validate-province-city-rows";

function row(province: string, provinceCode: string, city: string, cityCode: string) {
  return { Province: province, "Province Code": provinceCode, City: city, "City Code": cityCode };
}

describe("validateProvinceCityRows", () => {
  it("parses valid rows into province/city maps", () => {
    const result = validateProvinceCityRows([
      row("تهران", "TEH", "تهران", "TEH-1"),
      row("تهران", "TEH", "ری", "TEH-2"),
      row("اصفهان", "ESF", "اصفهان", "ESF-1"),
    ]);

    expect(result.errors).toHaveLength(0);
    expect(result.provinces.size).toBe(2);
    expect(result.provinces.get("TEH")).toBe("تهران");
    expect(result.cities.size).toBe(3);
    expect(result.cities.get("TEH-2")).toEqual({ name: "ری", provinceCode: "TEH" });
  });

  it("reports a row-level error for missing required fields", () => {
    const result = validateProvinceCityRows([row("", "TEH", "تهران", "TEH-1")]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
  });

  it("rejects conflicting province names for the same province code", () => {
    const result = validateProvinceCityRows([
      row("تهران", "TEH", "تهران", "TEH-1"),
      row("تهران بزرگ", "TEH", "ری", "TEH-2"),
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.provinces.get("TEH")).toBe("تهران");
  });

  it("rejects a duplicate city code even under a different name", () => {
    const result = validateProvinceCityRows([
      row("تهران", "TEH", "تهران", "TEH-1"),
      row("تهران", "TEH", "شهر تکراری", "TEH-1"),
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.cities.get("TEH-1")?.name).toBe("تهران");
  });

  it("reports correct 1-based Excel row numbers accounting for the header row", () => {
    const result = validateProvinceCityRows([
      row("تهران", "TEH", "تهران", "TEH-1"),
      row("", "", "", ""),
    ]);
    expect(result.errors[0].row).toBe(3);
  });

  it("returns empty maps for an empty input", () => {
    const result = validateProvinceCityRows([]);
    expect(result.provinces.size).toBe(0);
    expect(result.cities.size).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
