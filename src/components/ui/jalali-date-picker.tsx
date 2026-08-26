"use client";

import { Combobox } from "@/components/ui/combobox";
import { toPersianDigits } from "@/lib/utils/format";
import {
  PERSIAN_MONTH_NAMES,
  isoToJalali,
  jalaliToIso,
  jalaliMonthLength,
  todayJalali,
} from "@/lib/utils/jalali";

const YEAR_RANGE_BEFORE = 1;
const YEAR_RANGE_AFTER = 6;

/**
 * A Jalali (Shamsi) date picker built from three Comboboxes rather
 * than a calendar-grid popover — simpler to build correctly and,
 * since Combobox already supports search past 6 options, the ~30-item
 * year list stays just as fast to use.
 */
export function JalaliDatePicker({
  value,
  onChange,
  allowEmpty = false,
  disabled = false,
}: {
  /** Date-only ISO string, or null when allowEmpty and unset. */
  value: string | null;
  onChange: (iso: string | null) => void;
  allowEmpty?: boolean;
  disabled?: boolean;
}) {
  const today = todayJalali();
  const parts = value ? isoToJalali(value) : null;

  const yearOptions = Array.from(
    { length: YEAR_RANGE_BEFORE + YEAR_RANGE_AFTER + 1 },
    (_, i) => today.jy - YEAR_RANGE_BEFORE + i,
  ).map((y) => ({ value: String(y), label: toPersianDigits(y) }));

  const monthOptions = PERSIAN_MONTH_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: name,
  }));

  const dayCount = parts ? jalaliMonthLength(parts.jy, parts.jm) : 31;
  const dayOptions = Array.from({ length: dayCount }, (_, i) => ({
    value: String(i + 1),
    label: toPersianDigits(i + 1),
  }));

  function update(next: Partial<{ jy: number; jm: number; jd: number }>) {
    const base = parts ?? today;
    const jy = next.jy ?? base.jy;
    const jm = next.jm ?? base.jm;
    const maxDay = jalaliMonthLength(jy, jm);
    const jd = Math.min(next.jd ?? base.jd, maxDay);
    onChange(jalaliToIso({ jy, jm, jd }));
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-20">
        <Combobox
          value={parts ? String(parts.jd) : ""}
          onChange={(v) => update({ jd: Number(v) })}
          options={dayOptions}
          placeholder="روز"
          disabled={disabled}
        />
      </div>
      <div className="flex-1">
        <Combobox
          value={parts ? String(parts.jm) : ""}
          onChange={(v) => update({ jm: Number(v) })}
          options={monthOptions}
          placeholder="ماه"
          disabled={disabled}
        />
      </div>
      <div className="w-24">
        <Combobox
          value={parts ? String(parts.jy) : ""}
          onChange={(v) => update({ jy: Number(v) })}
          options={yearOptions}
          placeholder="سال"
          disabled={disabled}
        />
      </div>
      {allowEmpty && value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 px-1 text-xs text-muted hover:text-danger"
        >
          پاک کردن
        </button>
      ) : null}
    </div>
  );
}
