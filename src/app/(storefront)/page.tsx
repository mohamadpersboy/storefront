import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontSearchBar } from "@/components/storefront/storefront-search-bar";

export default function StorefrontHomePage() {
  return (
    <main>
      <StorefrontHeader location="زنجان" />
      <StorefrontSearchBar />

      {/*
        Step 1 of the sequential Storefront workflow ends here
        (Header + Search only). HeroSlider, PromoSlider, Categories,
        product carousels, About Us, Footer, and the bottom nav are each
        a separate approved step per CLAUDE.md / Master Prompt §49.
      */}
    </main>
  );
}
