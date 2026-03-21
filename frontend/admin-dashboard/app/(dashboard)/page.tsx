"use client";
import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Clock,
  PieChart as PieChartIcon,
  HelpCircle,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import RangeSelector from "@/components/ui/RangeSelector";
import LeadsChart from "@/components/charts/LeadsChart";
import RevenueChart from "@/components/charts/RevenueChart";
import PeakHoursChart from "@/components/charts/PeakHoursChart";
import LeadsByStatusChart from "@/components/charts/LeadsByStatusChart";
import ConversionRate from "@/components/charts/ConversionRate";
import TopQuestions from "@/components/charts/TopQuestions";
import { analyticsService } from "@/lib/services/analyticsService";
import { getTenantInfo } from "@/lib/auth";
import type { AnalyticsData, AnalyticsRange } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [loading, setLoading] = useState(true);
  const tenant = getTenantInfo();

  useEffect(() => {
    setLoading(true);
    analyticsService
      .get(range)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const totalRevenue = data?.revenueOverTime.reduce((sum, d) => sum + d.revenue, 0) ?? 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600 mb-1">
            {greeting()}, {tenant?.name ?? "Admin"}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard
          title="Total Leads"
          value={data?.totalLeads ?? 0}
          subtitle={`Last ${range.replace("d", " days")}`}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Conversations"
          value={data?.totalConversations ?? 0}
          subtitle="Chat sessions"
          icon={<MessageSquare className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${data?.conversionRate ?? 0}%`}
          subtitle="Chats to leads"
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
        <StatsCard
          title="Total Quoted"
          value={`$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          subtitle="Sum of all quotes"
          icon={<DollarSign className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* ── Charts row 1: Leads + Revenue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Leads Over Time" icon={<BarChart3 className="w-4 h-4" />}>
          <LeadsChart data={data?.leadsOverTime ?? []} />
        </ChartCard>
        <ChartCard title="Revenue Over Time" icon={<DollarSign className="w-4 h-4" />}>
          <RevenueChart data={data?.revenueOverTime ?? []} />
        </ChartCard>
      </div>

      {/* ── Charts row 2: Peak Hours + Status + Conversion ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Peak Hours" icon={<Clock className="w-4 h-4" />}>
          <PeakHoursChart data={data?.peakHours ?? []} />
        </ChartCard>
        <ChartCard title="Leads by Status" icon={<PieChartIcon className="w-4 h-4" />}>
          <LeadsByStatusChart data={data?.leadsByStatus ?? []} />
        </ChartCard>
        <ChartCard title="Conversion" icon={<TrendingUp className="w-4 h-4" />}>
          <ConversionRate
            rate={data?.conversionRate ?? 0}
            totalChats={data?.totalConversations ?? 0}
            totalLeads={data?.totalLeads ?? 0}
          />
        </ChartCard>
      </div>

      {/* ── Top Questions ── */}
      <ChartCard title="Most Asked Questions" icon={<HelpCircle className="w-4 h-4" />}>
        <TopQuestions data={data?.topQuestions ?? []} />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
