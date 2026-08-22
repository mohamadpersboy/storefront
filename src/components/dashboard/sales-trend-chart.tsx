"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatToman } from "@/lib/utils/format";

export function SalesTrendChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e4e4e7" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#71717a" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#71717a" }}
            tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}م`}
            width={36}
          />
          <Tooltip
            formatter={(value) => [formatToman(Number(value)), "فروش"]}
            contentStyle={{
              direction: "rtl",
              fontFamily: "inherit",
              fontSize: 12,
              borderRadius: 10,
              border: "1px solid #e4e4e7",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#salesFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
