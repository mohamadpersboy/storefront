"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Card } from "@/components/ui/card";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <ErrorState onRetry={reset} />
    </Card>
  );
}
