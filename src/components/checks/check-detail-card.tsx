"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { CheckStatusBadge } from "@/components/checks/check-status-badge";
import { ReturnCheckModal } from "@/components/checks/return-check-modal";
import { TransferCheckModal } from "@/components/checks/transfer-check-modal";
import { formatToman, formatPersonWithPhone, toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import { numberToPersianWords } from "@/lib/utils/number-to-words";
import { canReturnCheck, canTransferCheck, type CheckStatus } from "@/lib/constants/check-status";

interface ApiCheckDetail {
  id: string;
  linkedOrder: { orderId: string; orderNumber: number; paymentStatus: string } | null;
  bank: { name: string; logoUrl: string | null } | null;
  issuer: { firstName: string; lastName: string; nationalId: string };
  receiver: { fullName: string | null; phoneNumber: string } | null;
  guarantor: { firstName: string; lastName: string; nationalId?: string } | null;
  phoneNumber: string;
  receivedDate: string;
  dueDate: string;
  amount: number;
  checkSeries: string;
  checkNumber: string;
  sayadiId: string;
  status: CheckStatus;
  transferredTo: { firstName?: string; lastName?: string; nationalId?: string } | null;
  returnInfo: { returnedAt: string; returnedToName: string; reason: string } | null;
  createdBy: { fullName: string | null } | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function CheckDetailCard({ checkId }: { checkId: string }) {
  const router = useRouter();
  const [check, setCheck] = useState<ApiCheckDetail | null>(null);
  const [error, setError] = useState(false);
  const [loading, startTransition] = useTransition();
  const [returnOpen, setReturnOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  function load() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/checks/${checkId}`);
        const body = await res.json();
        if (!body.success) throw new Error();
        setCheck(body.data);
        setError(false);
      } catch {
        setError(true);
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkId]);

  if (loading) {
    return (
      <Card className="p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-8 w-full last:mb-0" />
        ))}
      </Card>
    );
  }

  if (error || !check) {
    return (
      <Card>
        <ErrorState onRetry={load} />
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card className="flex flex-col gap-1 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative size-9 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white">
              {check.bank?.logoUrl ? (
                <Image src={check.bank.logoUrl} alt={check.bank.name} fill className="object-contain p-1" />
              ) : (
                <Landmark className="m-auto mt-2 size-5 text-muted" />
              )}
            </div>
            <span className="text-sm font-semibold text-foreground">{check.bank?.name ?? "—"}</span>
          </div>
          <CheckStatusBadge status={check.status} />
        </div>

        <Row label="مبلغ" value={formatToman(check.amount)} />
        <p className="mb-1 text-xs text-muted">{numberToPersianWords(check.amount)} تومان</p>
        <Row label="تاریخ دریافت" value={formatJalali(check.receivedDate)} />
        <Row label="تاریخ سررسید" value={formatJalali(check.dueDate)} />
        <Row label="سری چک" value={toPersianDigits(check.checkSeries)} />
        <Row label="شناسه چک" value={toPersianDigits(check.checkNumber)} />
        <Row label="شناسه صیادی" value={toPersianDigits(check.sayadiId)} />
      </Card>

      <Card className="flex flex-col p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">صادرکننده</h2>
        <Row label="نام و نام خانوادگی" value={`${check.issuer.firstName} ${check.issuer.lastName}`} />
        <Row label="کد ملی" value={toPersianDigits(check.issuer.nationalId)} />
        <Row label="شماره تماس" value={toPersianDigits(check.phoneNumber)} />
      </Card>

      <Card className="flex flex-col p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">دریافت‌کننده</h2>
        <Row
          label="نام"
          value={formatPersonWithPhone(check.receiver?.fullName, check.receiver?.phoneNumber ?? "—")}
        />
      </Card>

      {check.linkedOrder ? (
        <Card className="flex flex-col p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">سفارش متصل</h2>
          <Row
            label="شماره سفارش"
            value={
              <a
                href={`/dashboard/orders/${check.linkedOrder.orderId}`}
                className="text-primary underline"
              >
                #{toPersianDigits(check.linkedOrder.orderNumber)}
              </a>
            }
          />
          <Row
            label="وضعیت این پرداخت"
            value={check.linkedOrder.paymentStatus === "returned" ? "عودت داده شده" : "دریافت‌شده"}
          />
        </Card>
      ) : null}

      {check.guarantor ? (
        <Card className="flex flex-col p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">ضامن</h2>
          <Row label="نام و نام خانوادگی" value={`${check.guarantor.firstName} ${check.guarantor.lastName}`} />
          {check.guarantor.nationalId ? (
            <Row label="کد ملی" value={toPersianDigits(check.guarantor.nationalId)} />
          ) : null}
        </Card>
      ) : null}

      {check.transferredTo ? (
        <Card className="flex flex-col p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">انتقال به</h2>
          <Row
            label="نام و نام خانوادگی"
            value={`${check.transferredTo.firstName ?? ""} ${check.transferredTo.lastName ?? ""}`}
          />
          {check.transferredTo.nationalId ? (
            <Row label="کد ملی" value={toPersianDigits(check.transferredTo.nationalId)} />
          ) : null}
        </Card>
      ) : null}

      {check.returnInfo ? (
        <Card className="flex flex-col p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">اطلاعات عودت</h2>
          <Row label="تاریخ عودت" value={formatJalali(check.returnInfo.returnedAt)} />
          <Row label="دریافت‌کننده" value={check.returnInfo.returnedToName} />
          <Row label="دلیل" value={check.returnInfo.reason} />
        </Card>
      ) : null}

      {canReturnCheck(check.status) || canTransferCheck(check.status) ? (
        <div className="flex gap-2">
          {canReturnCheck(check.status) ? (
            <Button variant="danger" className="flex-1" onClick={() => setReturnOpen(true)}>
              عودت چک
            </Button>
          ) : null}
          {canTransferCheck(check.status) ? (
            <Button variant="secondary" className="flex-1" onClick={() => setTransferOpen(true)}>
              انتقال چک
            </Button>
          ) : null}
        </div>
      ) : null}

      {returnOpen ? (
        <ReturnCheckModal
          checkId={check.id}
          onCancel={() => setReturnOpen(false)}
          onReturned={() => {
            setReturnOpen(false);
            load();
            router.refresh();
          }}
        />
      ) : null}
      {transferOpen ? (
        <TransferCheckModal
          checkId={check.id}
          onCancel={() => setTransferOpen(false)}
          onTransferred={() => {
            setTransferOpen(false);
            load();
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
