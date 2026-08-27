export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border bg-surface-subtle pb-20 sm:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <p className="font-semibold text-foreground">فرش سقطچی</p>
        <p className="mt-2 max-w-md leading-6">
          فروشگاه اینترنتی تخصصی فرش ماشینی، موکت، تابلو فرش، پادری و
          محصولات مرتبط.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} فرش سقطچی. تمامی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
}
