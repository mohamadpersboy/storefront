import { describe, expect, it } from "vitest";
import { createScrollMemory } from "@/lib/storefront/scroll-memory";

function fakeStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v;
    },
  };
}

describe("scroll memory", () => {
  it("stores and returns rounded, non-negative positions per URL", () => {
    const m = createScrollMemory(null);
    m.set("/a", 120.6);
    m.set("/b", -5);
    expect(m.get("/a")).toBe(121);
    expect(m.get("/b")).toBe(0);
    expect(m.get("/c")).toBeUndefined();
  });

  it("survives a reload through storage", () => {
    const storage = fakeStorage();
    createScrollMemory(storage).set("/p/1?x=2", 300);
    expect(createScrollMemory(storage).get("/p/1?x=2")).toBe(300);
  });

  it("ignores corrupt storage and caps the number of entries", () => {
    const m = createScrollMemory(fakeStorage("{not json"));
    for (let i = 0; i < 80; i++) m.set(`/u${i}`, i);
    expect(m.get("/u0")).toBeUndefined();
    expect(m.get("/u79")).toBe(79);
  });
});
