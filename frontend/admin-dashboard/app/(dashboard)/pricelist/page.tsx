"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import PriceListUpload from "@/components/PriceListUpload";
import { PricingConfig } from "@/lib/types";
import api from "@/lib/api";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MaterialRow {
  material: string;
  basePrice: number;
  pricePerSqFt: number;
  minimumPrice?: number;
}

// ── Inline-editable number cell ────────────────────────────────────────────────
interface InlineNumProps {
  value: number | undefined;
  onSave: (v: number | undefined) => void;
  prefix?: string;
  placeholder?: string;
  allowEmpty?: boolean;
}
function InlineNum({ value, onSave, prefix = "$", placeholder = "—", allowEmpty }: InlineNumProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value !== undefined ? String(value) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() { setDraft(value !== undefined ? String(value) : ""); setEditing(true); }
  function cancel()    { setEditing(false); }
  function commit() {
    const n = parseFloat(draft);
    if (draft === "" && allowEmpty) { onSave(undefined); setEditing(false); return; }
    if (!isNaN(n) && n >= 0)        { onSave(n);         setEditing(false); return; }
    cancel();
  }

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={startEdit}
        className="group flex items-center gap-1 text-sm text-slate-700 hover:text-blue-600 transition-colors"
        title="Click to edit"
      >
        <span>{value !== undefined ? `${prefix}${value}` : placeholder}</span>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-400 text-xs">{prefix}</span>
      <input
        ref={inputRef}
        type="number"
        min={0}
        step="any"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        onBlur={commit}
        className="w-20 border border-blue-400 rounded px-2 py-0.5 text-sm outline-none"
      />
    </div>
  );
}

// ── Globals editor ─────────────────────────────────────────────────────────────
interface GlobalsEditorProps {
  markup: number;
  labor: number;
  onSave: (markup: number, labor: number) => Promise<void>;
}
function GlobalsEditor({ markup, labor, onSave }: GlobalsEditorProps) {
  const [editMarkup, setEditMarkup] = useState(markup);
  const [editLabor,  setEditLabor]  = useState(labor);
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(editMarkup, editLabor);
    setSaving(false);
  }

  return (
    <div className="flex gap-3 flex-wrap items-end">
      <div className="flex-1 min-w-[140px] bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-500 font-medium mb-1">Markup %</p>
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} step="0.1"
            value={editMarkup}
            onChange={e => setEditMarkup(parseFloat(e.target.value) || 0)}
            className="w-20 bg-white border border-blue-200 rounded px-2 py-1 text-lg font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-blue-700 font-bold text-lg">%</span>
        </div>
      </div>

      <div className="flex-1 min-w-[140px] bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <p className="text-xs text-green-500 font-medium mb-1">Fixed Labor $</p>
        <div className="flex items-center gap-2">
          <span className="text-green-700 font-bold text-lg">$</span>
          <input
            type="number" min={0} step="1"
            value={editLabor}
            onChange={e => setEditLabor(parseFloat(e.target.value) || 0)}
            className="w-20 bg-white border border-green-200 rounded px-2 py-1 text-lg font-bold text-green-700 outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        {saving
          ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Check className="w-3 h-3" />}
        Save Globals
      </button>
    </div>
  );
}

// ── Add material inline form (rendered as a table row) ─────────────────────────
interface AddMaterialFormProps {
  category: string;
  onAdd: (category: string, row: MaterialRow) => Promise<void>;
}
function AddMaterialForm({ category, onAdd }: AddMaterialFormProps) {
  const [open, setOpen]         = useState(false);
  const [material, setMaterial] = useState("");
  const [base, setBase]         = useState("");
  const [perSqFt, setPerSqFt]   = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [saving, setSaving]     = useState(false);

  if (!open) {
    return (
      <tr>
        <td colSpan={5} className="px-3 py-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add material
          </button>
        </td>
      </tr>
    );
  }

  async function handleAdd() {
    if (!material.trim()) return;
    setSaving(true);
    await onAdd(category, {
      material:     material.trim(),
      basePrice:    parseFloat(base)    || 0,
      pricePerSqFt: parseFloat(perSqFt) || 0,
      minimumPrice: minPrice ? parseFloat(minPrice) : undefined,
    });
    setMaterial(""); setBase(""); setPerSqFt(""); setMinPrice("");
    setOpen(false);
    setSaving(false);
  }

  return (
    <tr className="bg-blue-50 border-t border-blue-100">
      <td className="px-3 py-2">
        <input
          autoFocus
          value={material}
          onChange={e => setMaterial(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setOpen(false); }}
          placeholder="Material name"
          className="w-full border border-blue-300 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-3 py-2">
        <input type="number" min={0} value={base} onChange={e => setBase(e.target.value)}
          placeholder="0" className="w-20 border border-blue-300 rounded px-2 py-1 text-xs outline-none" />
      </td>
      <td className="px-3 py-2">
        <input type="number" min={0} value={perSqFt} onChange={e => setPerSqFt(e.target.value)}
          placeholder="0" className="w-20 border border-blue-300 rounded px-2 py-1 text-xs outline-none" />
      </td>
      <td className="px-3 py-2">
        <input type="number" min={0} value={minPrice} onChange={e => setMinPrice(e.target.value)}
          placeholder="optional" className="w-20 border border-blue-300 rounded px-2 py-1 text-xs outline-none" />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <button onClick={handleAdd} disabled={saving || !material.trim()}
            className="p-1.5 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700">
            {saving
              ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <Check className="w-3 h-3" />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PriceListPage() {
  const [config, setConfig]     = useState<PricingConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [newCat, setNewCat]     = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const fetchConfig = useCallback(() => {
    setLoading(true);
    api.get<PricingConfig>("/api/admin/pricelist")
      .then(res => setConfig(res.data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // ── API helpers (all update local state for instant feedback) ─────────────

  async function saveGlobals(markup: number, labor: number) {
    await api.put("/api/admin/pricelist/globals", { markupPercentage: markup, laborFixedCost: labor });
    setConfig(prev => prev ? { ...prev, markupPercentage: markup, laborFixedCost: labor } : prev);
  }

  async function upsertMaterial(category: string, row: MaterialRow) {
    await api.put(
      `/api/admin/pricelist/${encodeURIComponent(category)}/${encodeURIComponent(row.material)}`,
      { basePrice: row.basePrice, pricePerSqFt: row.pricePerSqFt, minimumPrice: row.minimumPrice }
    );
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            materials: {
              ...prev.categories[category]?.materials,
              [row.material]: { basePrice: row.basePrice, pricePerSqFt: row.pricePerSqFt, minimumPrice: row.minimumPrice },
            },
          },
        },
      };
    });
  }

  async function deleteMaterial(category: string, material: string) {
    if (!confirm(`Delete "${material}" from "${category}"?`)) return;
    await api.delete(`/api/admin/pricelist/${encodeURIComponent(category)}/${encodeURIComponent(material)}`);
    setConfig(prev => {
      if (!prev) return prev;
      const mats = { ...prev.categories[category].materials };
      delete mats[material];
      return { ...prev, categories: { ...prev.categories, [category]: { materials: mats } } };
    });
  }

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      await api.post("/api/admin/pricelist/category", { category: name });
      setConfig(prev => prev
        ? { ...prev, categories: { ...prev.categories, [name]: { materials: {} } } }
        : prev);
      setNewCat("");
    } finally {
      setAddingCat(false);
    }
  }

  async function deleteCategory(category: string) {
    if (!confirm(`Delete entire category "${category}" and all its materials?`)) return;
    await api.delete(`/api/admin/pricelist/${encodeURIComponent(category)}`);
    setConfig(prev => {
      if (!prev) return prev;
      const cats = { ...prev.categories };
      delete cats[category];
      return { ...prev, categories: cats };
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Price List</h1>
        <p className="text-slate-500 text-sm mt-1">Edit prices inline or upload a CSV to replace all pricing</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Bulk upload (left, 1/3) ──────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-200 p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <h2 className="text-sm font-bold text-slate-900 mb-1">Bulk Upload</h2>
          <p className="text-xs text-slate-400 mb-5">Replace all pricing with a new CSV file.</p>
          <PriceListUpload onSuccess={fetchConfig} />
        </div>

        {/* ── Inline editor (right, 2/3) ───────────────────────────────────── */}
        <div
          className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <h2 className="text-sm font-bold text-slate-900 mb-1">Edit Pricing</h2>
          <p className="text-xs text-slate-400 mb-5">Click any price to edit. Changes are saved immediately.</p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !config || Object.keys(config.categories ?? {}).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No pricing configured yet.</p>
              <p className="text-slate-400 text-xs mt-1">Upload a CSV or add a category below.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Global settings */}
              <GlobalsEditor
                markup={config.markupPercentage}
                labor={config.laborFixedCost}
                onSave={saveGlobals}
              />

              {/* Per-category tables */}
              {Object.entries(config.categories).map(([category, catData]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider capitalize">
                      {category}
                    </h3>
                    <button
                      onClick={() => deleteCategory(category)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete category
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Material</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Base</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Per sqft</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Min</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {Object.entries(catData.materials).map(([mat, pricing]) => (
                          <tr key={mat} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 capitalize font-medium text-slate-700">{mat}</td>

                            <td className="px-3 py-2">
                              <InlineNum
                                value={pricing.basePrice}
                                onSave={v => upsertMaterial(category, {
                                  material: mat,
                                  basePrice:    v ?? 0,
                                  pricePerSqFt: pricing.pricePerSqFt,
                                  minimumPrice: pricing.minimumPrice,
                                })}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <InlineNum
                                value={pricing.pricePerSqFt}
                                onSave={v => upsertMaterial(category, {
                                  material: mat,
                                  basePrice:    pricing.basePrice,
                                  pricePerSqFt: v ?? 0,
                                  minimumPrice: pricing.minimumPrice,
                                })}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <InlineNum
                                value={pricing.minimumPrice}
                                allowEmpty
                                placeholder="—"
                                onSave={v => upsertMaterial(category, {
                                  material: mat,
                                  basePrice:    pricing.basePrice,
                                  pricePerSqFt: pricing.pricePerSqFt,
                                  minimumPrice: v,
                                })}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <button
                                onClick={() => deleteMaterial(category, mat)}
                                className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                                title="Delete material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Inline add-material form */}
                        <AddMaterialForm
                          category={category}
                          onAdd={async (cat, row) => { await upsertMaterial(cat, row); }}
                        />
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new category */}
          {!loading && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex gap-2">
              <input
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
                placeholder="New category name (e.g. pergolas)"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
              />
              <button
                onClick={addCategory}
                disabled={addingCat || !newCat.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                {addingCat
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Plus className="w-4 h-4" />}
                Add Category
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
