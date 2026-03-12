"use client";
import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import { Lead } from "@/lib/types";
import { getTenantInfo } from "@/lib/auth";
import api from "@/lib/api";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const tenant = getTenantInfo();

  useEffect(() => {
    api.get<Lead[]>("/api/admin/leads")
      .then((res) => setLeads(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today        = new Date().toDateString();
  const todayLeads   = leads.filter((l) => new Date(l.createdAt).toDateString() === today);
  const totalRevenue = leads.reduce((sum, l) => sum + l.quotedPrice, 0);
  const avgQuote     = leads.length > 0 ? totalRevenue / leads.length : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600 mb-1">{greeting()}, {tenant?.name ?? "Admin"} 👋</p>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatsCard
          title="Total Leads"
          value={leads.length}
          subtitle="All time"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Today's Leads"
          value={todayLeads.length}
          subtitle={new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          icon={<Calendar className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Quoted"
          value={`$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          subtitle="Sum of all quotes"
          icon={<DollarSign className="w-5 h-5" />}
          color="orange"
        />
        <StatsCard
          title="Avg Quote Value"
          value={`$${avgQuote.toFixed(0)}`}
          subtitle="Per lead"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* ── Recent Leads ── */}
      <div className="bg-white rounded-2xl border border-slate-200"
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Recent Leads</h2>
          <Link
            href="/leads"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {leads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No leads yet</p>
            <p className="text-xs text-slate-400 mt-1">Share your widget embed code with customers to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">
                      {lead.customerName[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{lead.customerName}</p>
                    <p className="text-xs text-slate-400">
                      {lead.phone} · {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  ${lead.quotedPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
