interface ConversionRateProps {
  rate: number;
  totalChats: number;
  totalLeads: number;
}

export default function ConversionRate({ rate, totalChats, totalLeads }: ConversionRateProps) {
  const circumference = 2 * Math.PI * 45;
  const filled = (rate / 100) * circumference;
  const color = rate >= 50 ? "#16a34a" : rate >= 25 ? "#eab308" : "#2563eb";

  return (
    <div className="flex flex-col items-center justify-center h-[220px]">
      <div className="relative w-[120px] h-[120px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{rate}%</span>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{totalLeads}</span> leads from{" "}
          <span className="font-semibold text-slate-700">{totalChats}</span> chats
        </p>
      </div>
    </div>
  );
}
