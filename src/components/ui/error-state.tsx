import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export function ErrorState({
  title = "خطایی رخ داد",
  description = "مشکلی در دریافت اطلاعات پیش آمد. لطفاً دوباره تلاش کنید.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-red-50 text-danger">
        <AlertTriangle className="size-5" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}
