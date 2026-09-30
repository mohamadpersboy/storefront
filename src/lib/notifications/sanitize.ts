import sanitizeHtml from "sanitize-html";
import { isSafeNotificationImageUrl } from "./links";

/**
 * Allowlist مشخص برای محتوای Rich Text اعلان. هر تگ/ویژگی/Scheme
 * خارج از این فهرست حذف می‌شود؛ `<script>`، `on*=`، `javascript:` و
 * `data:` هرگز عبور نمی‌کنند. لینک‌ها همیشه `noopener noreferrer`.
 * تصویر فقط از Cloudinary پروژه.
 */
const HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "a",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  // تصویر فقط از Cloudinary پروژه (https://res.cloudinary.com)؛ هر منبع
  // دیگر (Host دیگر، http، نسبی، خالی، data:) کل تگ را حذف می‌کند.
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !isSafeNotificationImageUrl(frame.attribs.src ?? ""),
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...(attribs.href ? { href: attribs.href } : {}),
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      },
    }),
  },
};

export function sanitizeNotificationHtml(html: string): string {
  return sanitizeHtml(html, HTML_OPTIONS).trim();
}

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** متن ساده از HTML (برای Excerpt و بررسی خالی‌بودن). */
export function htmlToPlainText(html: string): string {
  const stripped = sanitizeHtml(html.replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " "), {
    allowedTags: [],
    allowedAttributes: {},
  });
  return stripped
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITY_MAP[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

export function makeExcerpt(content: string, format: "text" | "html", max = 140): string {
  const text = format === "html" ? htmlToPlainText(content) : content.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** آیا محتوای HTML (بعد از Sanitize) چیزی برای نمایش دارد؟ (متن یا تصویر) */
export function htmlHasContent(sanitizedHtml: string): boolean {
  return htmlToPlainText(sanitizedHtml).length > 0 || /<img\s/i.test(sanitizedHtml);
}
