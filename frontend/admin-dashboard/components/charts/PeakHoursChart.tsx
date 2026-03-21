"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface PeakHoursChartProps {
  data: { hour: number; count: number }[];
}

function formatHour(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export default function PeakHoursChart({ data }: PeakHoursChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 0);

  if (maxCount === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
        No conversation data for this period
      </div>
    );
  }

  // Embed fill color into data so Bar can reference it without deprecated Cell
  const formatted = data.map((d) => ({
    ...d,
    label: formatHour(d.hour),
    fill: d.count === maxCount ? "#ea580c" : "#fdba74",
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: 13,
          }}
          formatter={(value) => [value, "Chats"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
