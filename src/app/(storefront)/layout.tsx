import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { MobileTabBar } from "@/components/storefront/mobile-tab-bar";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
