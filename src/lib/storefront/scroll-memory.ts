/**
 * حافظهٔ موقعیت اسکرول به‌ازای هر URL — برای قاب دسکتاپ.
 *
 * Next.js هنگام Back/Forward/Refresh موقعیت یک Scroll Container داخلی
 * (قاب) را بازیابی نمی‌کند، پس خودمان ذخیره و بازیابی می‌کنیم.
 * حافظه در RAM است و در `sessionStorage` هم نوشته می‌شود (برای Refresh).
 */
const STORAGE_KEY = "sf-scroll-memory";
const MAX_ENTRIES = 50;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type ScrollMemory = {
  get(key: string): number | undefined;
  set(key: string, top: number): void;
};

export function createScrollMemory(storage: StorageLike | null): ScrollMemory {
  let map = new Map<string, number>();
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        map = new Map(
          parsed.filter(
            (e): e is [string, number] =>
              Array.isArray(e) && typeof e[0] === "string" && typeof e[1] === "number",
          ),
        );
      }
    }
  } catch {
    map = new Map();
  }

  return {
    get: (key) => map.get(key),
    set(key, top) {
      map.delete(key);
      map.set(key, Math.max(0, Math.round(top)));
      while (map.size > MAX_ENTRIES) {
        const oldest = map.keys().next().value;
        if (oldest === undefined) break;
        map.delete(oldest);
      }
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify([...map]));
      } catch {
        // Storage پر/بسته است؛ حافظهٔ RAM کافی است.
      }
    },
  };
}
