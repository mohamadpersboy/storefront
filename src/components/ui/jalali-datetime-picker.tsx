"use client";

import { Combobox } from "@/components/ui/combobox";
import { toPersianDigits } from "@/lib/utils/format";
import {
  PERSIAN_MONTH_NAMES,
  isoToJalaliDateTime,
  jalaliDateTimeToIso,
  jalaliMonthLength,
  todayJalali,
  type JalaaliDateTimeParts,
} from "@/lib/utils/jalali";

const YEAR_RANGE_BEFORE = 1;
const YEAR_RANGE_AFTER = 3;

function pad2(n: number): string {
  return toPersianDigits(String(n).padStart(2, "0"));
}

/**
 * Same three-Combobox approach as JalaliDatePicker, plus hour/minute,
 * for fields that need an exact moment in time (Amazing Offer's
 * start/end) rather than just a calendar day.
 */
export function JalaliDateTimePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
}) {
  const today = todayJalali();
  const parts: JalaaliDateTimeParts = value
    ? isoToJalaliDateTime(value)
    : { ...today, hh: 0, mm: 0 };

  const yearOptions = Array.from(
    { length: YEAR_RANGE_BEFORE + YEAR_RANGE_AFTER + 1 },
    (_, i) => today.jy - YEAR_RANGE_BEFORE + i,
  ).map((y) => ({ value: String(y), label: toPersianDigits(y) }));

  const monthOptions = PERSIAN_MONTH_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: name,
  }));

  const dayCount = jalaliMonthLength(parts.jy, parts.jm);
  const dayOptions = Array.from({ length: dayCount }, (_, i) => ({
    value: String(i + 1),
    label: toPersianDigits(i + 1),
  }));

  const hourOptions = Array.from({ length: 24 }, (_, h) => ({
    value: String(h),
    label: pad2(h),
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, m) => ({
    value: String(m),
    label: pad2(m),
  }));

  function update(next: Partial<JalaaliDateTimeParts>) {
    const jy = next.jy ?? parts.jy;
    const jm = next.jm ?? parts.jm;
    const maxDay = jalaliMonthLength(jy, jm);
    const jd = Math.min(next.jd ?? parts.jd, maxDay);
    const hh = next.hh ?? parts.hh;
    const mm = next.mm ?? parts.mm;
    onChange(jalaliDateTimeToIso({ jy, jm, jd, hh, mm }));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="w-16">
        <Combobox
          value={String(parts.jd)}
          onChange={(v) => update({ jd: Number(v) })}
          options={dayOptions}
          placeholder="روز"
          disabled={disabled}
        />
      </div>
      <div className="w-28">
        <Combobox
          value={String(parts.jm)}
          onChange={(v) => update({ jm: Number(v) })}
          options={monthOptions}
          placeholder="ماه"
          disabled={disabled}
        />
      </div>
      <div className="w-24">
        <Combobox
          value={String(parts.jy)}
          onChange={(v) => update({ jy: Number(v) })}
          options={yearOptions}
          placeholder="سال"
          disabled={disabled}
        />
      </div>
      <span className="text-xs text-muted">ساعت</span>
      <div className="w-16">
        <Combobox
          value={String(parts.hh)}
          onChange={(v) => update({ hh: Number(v) })}
          options={hourOptions}
          disabled={disabled}
        />
      </div>
      <span className="text-xs text-muted">:</span>
      <div className="w-16">
        <Combobox
          value={String(parts.mm)}
          onChange={(v) => update({ mm: Number(v) })}
          options={minuteOptions}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
