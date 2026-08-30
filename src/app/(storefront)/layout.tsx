export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `.storefront` scopes the navy/blue accent tokens defined in
    // globals.css so the Dashboard's Indigo tokens remain untouched.
    // `pb-*` reserves space for the fixed bottom navigation added in a
    // later step — kept here from the start so we don't have to retrofit
    // spacing into every page once that lands.
    <div className="storefront min-h-screen bg-background pb-20">
      {children}
    </div>
  );
}
