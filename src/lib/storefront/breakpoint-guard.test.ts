import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Storefront داخل قاب ۲۸rem رندر می‌شود؛ Breakpoint های Viewport
 * (`sm:` تا `2xl:`) به عرض قاب پاسخ نمی‌دهند. فقط `tab:` (۶۴۰–۱۰۲۳px)
 * مجاز است. این Guard ورود دوباره آن‌ها را به Storefront رد می‌کند.
 */
const ROOTS = [
  "src/app/(storefront)",
  "src/components/storefront",
  "src/lib/storefront",
];
const FORBIDDEN = /(^|[^a-zA-Z0-9_-])(sm|md|lg|xl|2xl):[a-zA-Z[!-]/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(tsx|ts)$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : [];
  });
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("storefront breakpoint guard", () => {
  it("uses no viewport sm/md/lg/xl/2xl variants", () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of walk(root)) {
        stripComments(readFileSync(file, "utf8"))
          .split("\n")
          .forEach((line, i) => {
            if (FORBIDDEN.test(line)) offenders.push(`${file}:${i + 1}`);
          });
      }
    }
    expect(offenders).toEqual([]);
  });
});
