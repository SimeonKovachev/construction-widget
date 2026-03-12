"use client";
import { useEffect, useState, useCallback } from "react";
import PriceListUpload from "@/components/PriceListUpload";
import { PricingConfig } from "@/lib/types";
import api from "@/lib/api";

export default function PriceListPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(() => {
    setLoading(true);
    api.get<PricingConfig>("/api/admin/pricelist")
      .then((res) => setConfig(res.data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Price List</h1>
        <p className="text-slate-500 text-sm mt-1">Upload your CSV price list and review current pricing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6"
             style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Upload New Price List</h2>
          <p className="text-xs text-slate-400 mb-5">Drop a CSV file to update pricing instantly.</p>
          <PriceListUpload onSuccess={fetchConfig} />
        </div>

        {/* Current pricing panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6"
             style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Current Pricing</h2>
          <p className="text-xs text-slate-400 mb-5">Live pricing your AI widget uses for quotes.</p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !config || Object.keys(config.categories ?? {}).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No pricing configured yet.</p>
              <p className="text-slate-400 text-xs mt-1">Upload a CSV to get started.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Global settings */}
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-blue-500 font-medium">Markup</p>
                  <p className="text-lg font-bold text-blue-700">{config.markupPercentage}%</p>
                </div>
                <div className="flex-1 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-green-500 font-medium">Fixed Labor</p>
                  <p className="text-lg font-bold text-green-700">${config.laborFixedCost}</p>
                </div>
              </div>

              {/* Per-category tables */}
              {Object.entries(config.categories).map(([category, data]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 capitalize">{category}</h3>
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Material</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">Base</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">Per sqft</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">Min</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {Object.entries(data.materials).map(([mat, pricing]) => (
                          <tr key={mat} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 capitalize font-medium text-slate-700">{mat}</td>
                            <td className="px-3 py-2 text-right text-slate-600">${pricing.basePrice}</td>
                            <td className="px-3 py-2 text-right text-slate-600">${pricing.pricePerSqFt}</td>
                            <td className="px-3 py-2 text-right text-slate-600">
                              {pricing.minimumPrice ? `$${pricing.minimumPrice}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
