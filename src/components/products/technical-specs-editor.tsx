"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface TechSpecForm {
  key: string;
  value: string;
}

export function TechnicalSpecsEditor({
  specs,
  onChange,
}: {
  specs: TechSpecForm[];
  onChange: (specs: TechSpecForm[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {specs.map((spec, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="عنوان (مثلاً شانه)"
            value={spec.key}
            onChange={(e) =>
              onChange(
                specs.map((s, idx) =>
                  idx === i ? { ...s, key: e.target.value } : s,
                ),
              )
            }
          />
          <Input
            placeholder="مقدار (مثلاً 1200)"
            value={spec.value}
            onChange={(e) =>
              onChange(
                specs.map((s, idx) =>
                  idx === i ? { ...s, value: e.target.value } : s,
                ),
              )
            }
          />
          <button
            type="button"
            onClick={() => onChange(specs.filter((_, idx) => idx !== i))}
            className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
            aria-label="حذف ویژگی فنی"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...specs, { key: "", value: "" }])}
        className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
      >
        <Plus className="size-3.5" />
        افزودن ویژگی فنی
      </button>
    </div>
  );
}
