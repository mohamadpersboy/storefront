import { MobileTopBar } from "@/components/storefront/mobile-top-bar";
import { HeroSlider } from "@/components/storefront/hero-slider";

export default function StorefrontHomePage() {
  return (
    <>
      <MobileTopBar />
      <HeroSlider />
      <main className="flex min-h-[40vh] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-[var(--sf-ink)]/60">
            فروشگاه اینترنتی تخصصی فرش — در حال ساخت
          </p>
        </div>
      </main>
    </>
  );
}
