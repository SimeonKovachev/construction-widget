"use client";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

interface LeadsByStatusChartProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#2563eb",
  contacted: "#eab308",
  quoted: "#f97316",
  converted: "#16a34a",
  lost: "#ef4444",
  escalated: "#7c3aed",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  converted: "Converted",
  lost: "Lost",
  escalated: "Escalated",
};

export default function LeadsByStatusChart({ data }: LeadsByStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
        No leads for this period
      </div>
    );
  }

  // Embed fill color into data so Pie renders colors without deprecated Cell
  const colored = data.map((d) => ({
    ...d,
    fill: STATUS_COLORS[d.status] ?? "#94a3b8",
  }));

  return (
    <div className="flex items-center gap-4">
      <div className="w-[140px] h-[140px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              strokeWidth={2}
              stroke="#fff"
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              formatter={(value, name) => [
                value,
                STATUS_LABELS[name as string] ?? name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {[...data]
          .sort((a, b) => b.count - a.count)
          .map((d) => (
            <div key={d.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[d.status] ?? "#94a3b8" }}
                />
                <span className="text-slate-600 text-xs">
                  {STATUS_LABELS[d.status] ?? d.status}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-900">{d.count}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
