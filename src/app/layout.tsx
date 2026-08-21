import type { Metadata } from "next";
import { iranYekanX } from "@/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "فرش سقطچی | فروشگاه تخصصی فرش",
    template: "%s | فرش سقطچی",
  },
  description:
    "فروشگاه اینترنتی تخصصی فرش ماشینی، موکت، تابلو فرش، پادری و محصولات مرتبط.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={iranYekanX.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
