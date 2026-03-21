import { HelpCircle } from "lucide-react";

interface TopQuestionsProps {
  data: { question: string; count: number }[];
}

export default function TopQuestions({ data }: TopQuestionsProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <HelpCircle className="w-8 h-8 mb-2 text-slate-300" />
        <p className="text-sm">No customer inquiries yet for this period</p>
      </div>
    );
  }

  const maxCount = data[0]?.count ?? 1;

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 w-5 text-right flex-shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className="text-sm text-slate-700 truncate">{item.question}</p>
              <span className="text-xs font-semibold text-slate-500 flex-shrink-0 bg-slate-100 px-2 py-0.5 rounded-full">
                {item.count}x
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
