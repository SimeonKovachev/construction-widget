interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "orange" | "purple";
}

const colorMap: Record<string, { bar: string; icon: string; iconBg: string }> = {
  blue:   { bar: "#2563eb", icon: "#2563eb", iconBg: "#eff6ff" },
  green:  { bar: "#16a34a", icon: "#16a34a", iconBg: "#f0fdf4" },
  orange: { bar: "#ea580c", icon: "#ea580c", iconBg: "#fff7ed" },
  purple: { bar: "#7c3aed", icon: "#7c3aed", iconBg: "#f5f3ff" },
};

export default function StatsCard({ title, value, subtitle, icon, color = "blue" }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden"
         style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
      {/* Colored top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
           style={{ backgroundColor: c.bar }} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-900 leading-none mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 mt-1"
             style={{ backgroundColor: c.iconBg, color: c.icon }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
