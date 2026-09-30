import { describe, expect, it } from "vitest";
import {
  htmlHasContent,
  htmlToPlainText,
  makeExcerpt,
  sanitizeNotificationHtml,
} from "./sanitize";

describe("sanitizeNotificationHtml (XSS)", () => {
  it("removes <script> tags and their content", () => {
    const out = sanitizeNotificationHtml('<p>سلام</p><script>alert(1)</script>');
    expect(out).toBe("<p>سلام</p>");
    expect(out).not.toContain("script");
  });

  it("removes event handler attributes", () => {
    const out = sanitizeNotificationHtml(
      '<img src="https://res.cloudinary.com/demo/a.png" onerror="alert(1)">',
    );
    expect(out).toContain('src="https://res.cloudinary.com/demo/a.png"');
    expect(out).not.toContain("onerror");
  });

  it("drops javascript: links but keeps the text", () => {
    const out = sanitizeNotificationHtml('<a href="javascript:alert(1)">کلیک</a>');
    expect(out).not.toContain("javascript");
    expect(out).toContain("کلیک");
  });

  it("drops data: and http: image sources", () => {
    expect(sanitizeNotificationHtml('<img src="data:image/png;base64,AAAA">')).not.toContain("data:");
    expect(sanitizeNotificationHtml('<img src="http://x.test/a.png">')).not.toContain("src=");
  });

  it("allows images only from https://res.cloudinary.com", () => {
    expect(sanitizeNotificationHtml('<img src="https://res.cloudinary.com/demo/image/upload/a.jpg">')).toContain(
      "<img",
    );
    for (const src of [
      "https://example.com/image.jpg",
      "http://res.cloudinary.com/demo/a.jpg",
      "https://res.cloudinary.com.evil.test/a.jpg",
      "https://evil.test/https://res.cloudinary.com/a.jpg",
      "//res.cloudinary.com/a.jpg",
      "/local.jpg",
    ]) {
      expect(sanitizeNotificationHtml(`<p>x</p><img src="${src}">`)).toBe("<p>x</p>");
    }
  });

  it("drops iframe, style and inline style attributes", () => {
    const out = sanitizeNotificationHtml(
      '<iframe src="https://evil.test"></iframe><p style="color:red">x</p><style>p{}</style>',
    );
    expect(out).toBe("<p>x</p>");
  });

  it("forces safe rel/target on links and keeps allowed formatting", () => {
    const out = sanitizeNotificationHtml(
      '<h2>تیتر</h2><p><strong>پررنگ</strong> <em>کج</em> <a href="https://site.test">لینک</a></p><ul><li>الف</li></ul>',
    );
    expect(out).toContain("<h2>تیتر</h2>");
    expect(out).toContain("<strong>پررنگ</strong>");
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain("<ul><li>الف</li></ul>");
  });
});

describe("plain text helpers", () => {
  it("extracts text and decodes entities", () => {
    expect(htmlToPlainText("<p>الف &amp; ب</p><p>ج</p>")).toBe("الف & ب ج");
  });

  it("truncates long excerpts", () => {
    const excerpt = makeExcerpt("ا".repeat(300), "text", 50);
    expect(excerpt.length).toBe(50);
    expect(excerpt.endsWith("…")).toBe(true);
  });

  it("htmlHasContent is false for empty markup and true for text or image", () => {
    expect(htmlHasContent("<p></p>")).toBe(false);
    expect(htmlHasContent("<p>متن</p>")).toBe(true);
    expect(htmlHasContent('<img src="https://x.test/a.png">')).toBe(true);
  });
});
