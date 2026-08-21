import localFont from "next/font/local";

/**
 * IRANYekanX Pro — primary typeface for the entire app (RTL, Persian).
 *
 * We only register the weights the design system actually uses
 * (Regular / Medium / DemiBold / Bold) instead of all 11 available
 * weights, to keep the font payload small. Add more `src` entries
 * here if a new weight becomes necessary — do not import additional
 * one-off font files elsewhere in the app.
 */
export const iranYekanX = localFont({
  src: [
    {
      path: "../../public/fonts/IRANYekanX-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANYekanX-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANYekanX-DemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANYekanX-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-iran-yekan-x",
  display: "swap",
  preload: true,
});
