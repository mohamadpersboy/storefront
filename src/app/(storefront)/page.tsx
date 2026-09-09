import { MobileTopBar } from "@/components/storefront/mobile-top-bar";

export default function StorefrontHomePage() {
  return (
    <>
      <MobileTopBar />
      <main className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-[var(--sf-ink)]/60">
            فروشگاه اینترنتی تخصصی فرش — در حال ساخت
          </p>
        </div>
      </main>
    </>
  );
}
