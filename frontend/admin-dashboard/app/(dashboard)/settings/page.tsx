"use client";
import { useEffect, useState } from "react";
import { Copy, Check, Building2, Mail, Code2 } from "lucide-react";
import { TenantInfo } from "@/lib/types";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Input styling is now handled by the shared <Input> component

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [form, setForm] = useState({
    notificationEmail: "", smtpHost: "", smtpPort: "", smtpUser: "", smtpPassword: "",
  });

  useEffect(() => {
    api.get<TenantInfo>("/api/admin/tenants/me")
      .then((res) => {
        setTenant(res.data);
        setForm((f) => ({ ...f, notificationEmail: res.data.notificationEmail ?? "" }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await api.put("/api/admin/tenants/me", {
      notificationEmail: form.notificationEmail || null,
      smtpHost:     form.smtpHost     || null,
      smtpPort:     form.smtpPort     ? parseInt(form.smtpPort) : null,
      smtpUser:     form.smtpUser     || null,
      smtpPassword: form.smtpPassword || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function copyApiKey() {
    if (tenant?.apiKey) {
      navigator.clipboard.writeText(tenant.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5032";
  const embedSnippet = tenant
    ? `<div id="sales-widget"></div>\n<script>\n  window.SalesWidgetConfig = {\n    tenantId: "${tenant.id}",\n    apiUrl: "${apiUrl}"\n  };\n</script>\n<script src="${apiUrl}/widget.js"></script>`
    : "";

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and widget configuration</p>
      </div>

      {/* ── Account Info ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5"
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">Account</h2>
        </div>
        <dl className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <dt className="text-sm text-slate-500">Company Name</dt>
            <dd className="text-sm font-semibold text-slate-900">{tenant?.name}</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-slate-500">Owner Email</dt>
            <dd className="text-sm font-semibold text-slate-900">{tenant?.ownerEmail}</dd>
          </div>
        </dl>
      </div>

      {/* ── Widget Embed ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5"
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">Widget Embed Code</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">Paste into any page where you want the chat widget to appear.</p>

        <div className="relative rounded-xl overflow-hidden">
          <pre className="bg-slate-900 text-emerald-400 text-xs p-4 overflow-x-auto whitespace-pre leading-relaxed">
            {embedSnippet}
          </pre>
          <button
            onClick={copyEmbed}
            className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
          >
            {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedEmbed ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">API Key:</span>
          <code className="flex-1 text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 font-mono truncate">
            {tenant?.apiKey}
          </code>
          <button
            onClick={copyApiKey}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6"
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Mail className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">Lead Notifications</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Notification Email
            </label>
            <input
              type="email"
              value={form.notificationEmail}
              onChange={(e) => setForm((f) => ({ ...f, notificationEmail: e.target.value }))}
              placeholder="owner@company.com"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              You&apos;ll receive an email whenever a new lead is captured by the widget.
            </p>
          </div>

          <details className="group">
            <summary className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors select-none list-none">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Custom SMTP Settings
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </summary>
            <div className="mt-4 space-y-3 pl-5 border-l-2 border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMTP Host</label>
                  <input
                    value={form.smtpHost}
                    onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Port</label>
                  <input
                    type="number"
                    value={form.smtpPort}
                    onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value }))}
                    placeholder="587"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                <input
                  value={form.smtpUser}
                  onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))}
                  placeholder="you@gmail.com"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.smtpPassword}
                  onChange={(e) => setForm((f) => ({ ...f, smtpPassword: e.target.value }))}
                  placeholder="App password or SMTP password"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                />
              </div>
            </div>
          </details>

          <div className="pt-2">
            <Button type="submit">
              {saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
