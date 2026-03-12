"use client";
import { useEffect, useState } from "react";
import LeadsTable from "@/components/LeadsTable";
import { Lead } from "@/lib/types";
import api from "@/lib/api";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Lead[]>("/api/admin/leads")
      .then((res) => setLeads(res.data))
      .catch(() => setError("Failed to load leads."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <p className="text-slate-500 text-sm mt-1">Customer enquiries captured by your widget</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6"
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        ) : (
          <LeadsTable data={leads} />
        )}
      </div>
    </div>
  );
}
