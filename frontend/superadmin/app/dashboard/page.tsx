"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import type { TenantSummary, PlatformStats, CreateTenantForm, TenantDetail } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form,   setForm]   = useState<CreateTenantForm>({ name: "", ownerEmail: "", password: "", notificationEmail: "" });
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<TenantDetail | null>(null);

  function set(field: keyof CreateTenantForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.post<TenantDetail>("/api/superadmin/tenants", form);
      setResult(res.data);
      onCreated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Failed to create tenant.");
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <Modal open onClose={onClose} title="Create New Tenant" maxWidth="max-w-md">
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
          Tenant created successfully!
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
          <div><span className="text-slate-500 font-medium">Name:</span> <span className="font-semibold">{result.name}</span></div>
          <div><span className="text-slate-500 font-medium">Email:</span> {result.ownerEmail}</div>
          <div className="pt-1">
            <span className="text-slate-500 font-medium block mb-1">API Key:</span>
            <code className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs break-all block font-mono">{result.apiKey}</code>
          </div>
        </div>
        <p className="text-xs text-slate-500">Share the login URL, email, and temporary password with your client.</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Create New Tenant"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving} disabled={!form.name || !form.ownerEmail || !form.password}>
            {saving ? "Creating..." : "Create Tenant"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {([
          { label: "Company name",      field: "name",              type: "text",  placeholder: "Acme Fencing Co" },
          { label: "Owner email",        field: "ownerEmail",        type: "email", placeholder: "owner@company.com" },
          { label: "Temporary password", field: "password",          type: "text",  placeholder: "Min 8 characters" },
          { label: "Notification email", field: "notificationEmail", type: "email", placeholder: "Defaults to owner email" },
        ] as const).map(({ label, field, type, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <Input
              type={type}
              value={form[field]}
              onChange={set(field)}
              placeholder={placeholder}
              required={field !== "notificationEmail"}
              className="focus:!ring-red-500"
            />
          </div>
        ))}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
        )}
      </form>
    </Modal>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats,      setStats]      = useState<PlatformStats | null>(null);
  const [tenants,    setTenants]    = useState<TenantSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [toggling,   setToggling]   = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    fetchData();
  }, [router]);

  async function fetchData() {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        api.get<PlatformStats>("/api/superadmin/stats"),
        api.get<TenantSummary[]>("/api/superadmin/tenants"),
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
    } catch {
      setError("Failed to load data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTenant(id: string) {
    setToggling(id);
    try {
      await api.put(`/api/superadmin/tenants/${id}/toggle`);
      setTenants(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
    } catch {
      alert("Failed to toggle tenant.");
    } finally {
      setToggling(null);
    }
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Super Admin</h1>
            <p className="text-slate-400 text-xs mt-0.5">Platform Operator Dashboard</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="!text-slate-300 hover:!text-white !border !border-slate-600 hover:!border-slate-400"
        >
          Sign out
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Tenants"  value={stats?.totalTenants  ?? 0} color="text-slate-900" />
              <StatCard label="Active Tenants" value={stats?.activeTenants ?? 0} color="text-green-600" />
              <StatCard label="Total Leads"    value={stats?.totalLeads    ?? 0} color="text-blue-600"  />
            </div>

            {/* Tenants table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Tenants</h2>
                <Button variant="danger" size="sm" onClick={() => setShowCreate(true)}>
                  + New Tenant
                </Button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Company", "Email", "Leads", "Status", "Created", "Actions"].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{t.name}</td>
                      <td className="px-6 py-4 text-slate-500">{t.ownerEmail}</td>
                      <td className="px-6 py-4 text-slate-500">{t.leadCount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTenant(t.id)}
                          disabled={toggling === t.id}
                          className={
                            t.isActive
                              ? "!text-orange-600 !border !border-orange-200 hover:!bg-orange-50"
                              : "!text-green-600 !border !border-green-200 hover:!bg-green-50"
                          }
                        >
                          {toggling === t.id ? "..." : t.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No tenants yet. Create your first one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}
