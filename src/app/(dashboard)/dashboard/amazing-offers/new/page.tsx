import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AmazingOfferForm } from "@/components/amazing-offers/amazing-offer-form";

export default function NewAmazingOfferPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/amazing-offers"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست
      </Link>
      <AmazingOfferForm mode="create" />
    </div>
  );
}
