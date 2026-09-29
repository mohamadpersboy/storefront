"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Heading2, ImageIcon, Italic, Link2, List, ListOrdered, Unlink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * ویرایشگر Rich Text اعلان (Tiptap). فقط از `next/dynamic` با
 * `ssr: false` لود می‌شود. خروجی HTML فقط ورودیِ فرم است؛ اعتماد به آن
 * ممنوع و سرور همیشه با Allowlist دوباره Sanitize می‌کند.
 * فقط قابلیت‌های Allowlist سرور فعال است (پاراگراف، تیتر، Bold، Italic،
 * لیست، لینک، تصویر).
 */
export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // SSR-safe
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Image,
    ],
    content: value,
    editorProps: {
      attributes: {
        dir: "rtl",
        "aria-label": "متن اعلان",
        class:
          "notification-content min-h-40 rounded-b-[var(--radius-sm)] px-3 py-2 text-sm leading-7 outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  // همگام‌سازی وقتی مقدار از بیرون عوض شد (بارگذاری اولیه ویرایش).
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="h-48 animate-pulse rounded-[var(--radius-sm)] border border-border bg-surface-subtle" />;
  }

  function askHttps(message: string): string | null {
    const url = window.prompt(message, "https://")?.trim();
    if (!url) return null;
    if (!/^https:\/\//i.test(url)) {
      window.alert("فقط آدرس https مجاز است");
      return null;
    }
    return url;
  }

  const btn = (active: boolean) =>
    cn(
      "flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground",
      active && "bg-surface-subtle text-foreground",
    );

  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-white">
      <div
        role="toolbar"
        aria-label="ابزار قالب‌بندی"
        className="flex flex-wrap gap-1 border-b border-border p-1"
      >
        <button type="button" aria-label="پررنگ" aria-pressed={editor.isActive("bold")} className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </button>
        <button type="button" aria-label="کج" aria-pressed={editor.isActive("italic")} className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </button>
        <button type="button" aria-label="تیتر" aria-pressed={editor.isActive("heading")} className={btn(editor.isActive("heading"))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </button>
        <button type="button" aria-label="لیست نقطه‌ای" aria-pressed={editor.isActive("bulletList")} className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </button>
        <button type="button" aria-label="لیست شماره‌دار" aria-pressed={editor.isActive("orderedList")} className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </button>
        <button
          type="button"
          aria-label="افزودن لینک"
          className={btn(editor.isActive("link"))}
          onClick={() => {
            const url = askHttps("آدرس لینک (https)");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          <Link2 className="size-4" />
        </button>
        <button type="button" aria-label="حذف لینک" className={btn(false)} disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="size-4" />
        </button>
        <button
          type="button"
          aria-label="افزودن تصویر"
          className={btn(false)}
          onClick={() => {
            const url = askHttps("آدرس تصویر (https)");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          <ImageIcon className="size-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
