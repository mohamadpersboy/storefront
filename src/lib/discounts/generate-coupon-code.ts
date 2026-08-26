const THEMES = [
  "RUG",
  "CARPET",
  "PERSIA",
  "WELCOME",
  "VIP",
  "GOLD",
  "SAVE",
  "SPECIAL",
  "YALDA",
  "NOWRUZ",
  "SUMMER",
  "WINTER",
  "TAKHFIF",
] as const;

function randomDigits(rand: () => number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(rand() * 10).toString();
  }
  return out;
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

/**
 * Suggests one candidate coupon code. Deliberately takes an injectable
 * `rand` (defaulting to Math.random) purely so the output shape can be
 * asserted in tests without fighting randomness — every candidate this
 * produces already satisfies the Coupon code pattern
 * (`/^[A-Za-z0-9_-]+$/`, §createCouponSchema), so the caller never
 * needs to re-validate the format, only check availability.
 */
export function generateCandidateCouponCode(
  discountPercentage?: number,
  rand: () => number = Math.random,
): string {
  const theme = pick(rand, THEMES);
  const hasUsablePercentage =
    typeof discountPercentage === "number" &&
    discountPercentage > 0 &&
    discountPercentage <= 99;

  const patterns: Array<() => string> = [
    () => `${theme}${hasUsablePercentage ? Math.round(discountPercentage) : randomDigits(rand, 2)}`,
    () => `${theme}${randomDigits(rand, 3)}`,
    () => `${theme}-${randomDigits(rand, 4)}`,
  ];

  return pick(rand, patterns)();
}
