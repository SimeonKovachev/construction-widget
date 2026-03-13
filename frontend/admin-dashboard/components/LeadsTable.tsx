"use client";
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, Search, Pencil, Trash2, X, Check } from "lucide-react";
import { Lead, LeadStatus, UpdateLeadRequest } from "@/lib/types";
import api from "@/lib/api";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_META: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new:       { label: "New",       bg: "bg-blue-100",   text: "text-blue-700"   },
  contacted: { label: "Contacted", bg: "bg-yellow-100", text: "text-yellow-700" },
  quoted:    { label: "Quoted",    bg: "bg-purple-100", text: "text-purple-700" },
  converted: { label: "Converted", bg: "bg-green-100",  text: "text-green-700"  },
  lost:      { label: "Lost",      bg: "bg-red-100",    text: "text-red-600"    },
};

const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "quoted", "converted", "lost"];

function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

// ── Lead detail drawer ─────────────────────────────────────────────────────────
interface DrawerProps {
  lead: Lead;
  onClose: () => void;
  onSaved: (updated: Lead) => void;
  onDeleted: (id: string) => void;
}

function LeadDrawer({ lead, onClose, onSaved, onDeleted }: DrawerProps) {
  const [email, setEmail]   = useState(lead.email ?? "");
  const [status, setStatus] = useState<LeadStatus>(lead.status ?? "new");
  const [notes, setNotes]   = useState(lead.notes ?? "");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload: UpdateLeadRequest = {
        email: email || undefined,
        status,
        notes: notes || undefined,
      };
      const res = await api.patch<Lead>(`/api/admin/leads/${lead.id}`, payload);
      onSaved(res.data);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/api/admin/leads/${lead.id}`);
      onDeleted(lead.id);
    } catch {
      setError("Failed to delete lead.");
      setDeleting(false);
    }
  }

  const extras = (() => {
    try { return lead.extrasJson ? JSON.parse(lead.extrasJson) : null; } catch { return null; }
  })();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-40 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">{lead.customerName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(lead.createdAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</label>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 w-12 shrink-0">Phone</span>
                <span className="font-medium text-slate-800">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 w-12 shrink-0">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Add email..."
                  className="flex-1 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none text-slate-800 pb-0.5 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requirements</label>
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {lead.requirements}
            </div>
          </div>

          {/* Quoted price */}
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-green-500 font-medium">Quoted Price</p>
            <p className="text-2xl font-bold text-green-700">${lead.quotedPrice.toFixed(2)}</p>
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_STATUSES.map(s => {
                const meta = STATUS_META[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? `${meta.bg} ${meta.text} border-transparent ring-2 ring-offset-1 ring-current`
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internal Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes visible only to you..."
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
            />
          </div>

          {/* Extra fields (business-specific questions answered by AI) */}
          {extras && Object.keys(extras).length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extra Details</label>
              <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5">
                {Object.entries(extras).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-slate-400 capitalize min-w-0 shrink-0">{k}:</span>
                    <span className="text-slate-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Check className="w-4 h-4" />}
            Save Changes
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors border ${
              confirmDelete
                ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                : "text-red-500 border-red-200 hover:bg-red-50"
            }`}
          >
            {deleting
              ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <Trash2 className="w-4 h-4" />}
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Status filter tabs ─────────────────────────────────────────────────────────
const FILTER_TABS: { label: string; value: LeadStatus | "all" }[] = [
  { label: "All",       value: "all"       },
  { label: "New",       value: "new"       },
  { label: "Contacted", value: "contacted" },
  { label: "Quoted",    value: "quoted"    },
  { label: "Converted", value: "converted" },
  { label: "Lost",      value: "lost"      },
];

// ── Column helper ──────────────────────────────────────────────────────────────
const colHelper = createColumnHelper<Lead>();

// ── Main LeadsTable component ──────────────────────────────────────────────────
interface LeadsTableProps {
  data: Lead[];
  onUpdate: (updated: Lead) => void;
  onDelete: (id: string) => void;
}

export default function LeadsTable({ data, onUpdate, onDelete }: LeadsTableProps) {
  const [sorting, setSorting]         = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filtered = statusFilter === "all" ? data : data.filter(l => l.status === statusFilter);

  const columns = [
    colHelper.accessor("customerName", { header: "Name" }),
    colHelper.accessor("phone",        { header: "Phone" }),
    colHelper.accessor("email", {
      header: "Email",
      cell: info => <span className="text-slate-500 text-xs">{info.getValue() ?? "—"}</span>,
    }),
    colHelper.accessor("requirements", {
      header: "Requirements",
      cell: info => (
        <span className="line-clamp-1 max-w-[180px] text-slate-600 text-xs block">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor("quotedPrice", {
      header: "Quoted",
      cell: info => <span className="font-semibold text-green-700">${info.getValue().toFixed(2)}</span>,
    }),
    colHelper.accessor("status", {
      header: "Status",
      cell: info => <StatusBadge status={info.getValue() as LeadStatus} />,
    }),
    colHelper.accessor("createdAt", {
      header: "Date",
      cell: info => new Date(info.getValue()).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }),
    colHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={e => { e.stopPropagation(); setSelectedLead(row.original); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
          title="Edit lead"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  function handleSaved(updated: Lead) {
    onUpdate(updated);
    setSelectedLead(updated);
  }

  function handleDeleted(id: string) {
    onDelete(id);
    setSelectedLead(null);
  }

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTER_TABS.map(tab => {
          const count = tab.value === "all"
            ? data.length
            : data.filter(l => l.status === tab.value).length;
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0 rounded-full font-medium ${
                active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search leads..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc"  && <ChevronUp   className="w-3 h-3" />}
                      {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  No leads yet. When customers request quotes, they&apos;ll appear here.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedLead(row.original)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        {table.getFilteredRowModel().rows.length} of {filtered.length} shown
        {statusFilter !== "all" && ` · ${STATUS_META[statusFilter as LeadStatus].label} only`}
      </p>

      {/* Detail drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
