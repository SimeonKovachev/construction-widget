"use client";
import { useEffect, useState } from "react";
import { Copy, Check, Building2, Mail, Code2, Palette } from "lucide-react";
import { TenantInfo } from "@/lib/types";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";


export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [form, setForm] = useState({
    notificationEmail: "",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    primaryColor: "#2563eb",
    secondaryColor: "#1d4ed8",
    logoUrl: "",
    welcomeMessage: "",
    widgetPosition: "bottom-right",
    agentName: "",
    agentAvatarUrl: "",
  });

  useEffect(() => {
    api.get<TenantInfo>("/api/admin/tenants/me")
      .then((res) => {
        setTenant(res.data);
        setForm((f) => ({
          ...f,
          notificationEmail: res.data.notificationEmail ?? "",
          primaryColor: res.data.primaryColor ?? "#2563eb",
          secondaryColor: res.data.secondaryColor ?? "#1d4ed8",
          logoUrl: res.data.logoUrl ?? "",
          welcomeMessage: res.data.welcomeMessage ?? "",
          widgetPosition: res.data.widgetPosition ?? "bottom-right",
          agentName: res.data.agentName ?? "",
          agentAvatarUrl: res.data.agentAvatarUrl ?? "",
        }));
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
      primaryColor:   form.primaryColor   || null,
      secondaryColor: form.secondaryColor || null,
      logoUrl:        form.logoUrl        || null,
      welcomeMessage: form.welcomeMessage || null,
      widgetPosition: form.widgetPosition || null,
      agentName:      form.agentName      || null,
      agentAvatarUrl: form.agentAvatarUrl || null,
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
          <Button
            variant="secondary"
            size="sm"
            onClick={copyEmbed}
            className="absolute top-3 right-3 !bg-slate-700 hover:!bg-slate-600 !text-slate-300 hover:!text-white !shadow-none"
          >
            {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedEmbed ? "Copied!" : "Copy"}
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">API Key:</span>
          <code className="flex-1 text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 font-mono truncate">
            {tenant?.apiKey}
          </code>
          <IconButton onClick={copyApiKey} size="sm">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </IconButton>
        </div>
      </div>

      {/* ── Widget Branding ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5"
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">Widget Branding</h2>
        </div>

        <div className="space-y-4">
          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <Input
                  value={form.secondaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  placeholder="#1d4ed8"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Agent Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Agent Name</label>
            <Input
              value={form.agentName}
              onChange={(e) => setForm((f) => ({ ...f, agentName: e.target.value }))}
              placeholder="Sales Assistant"
            />
            <p className="text-xs text-slate-400 mt-1">Displayed in the chat header (e.g. &quot;Chat with Maria&quot;)</p>
          </div>

          {/* Agent Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Agent Avatar URL</label>
            <Input
              value={form.agentAvatarUrl}
              onChange={(e) => setForm((f) => ({ ...f, agentAvatarUrl: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Logo URL</label>
            <Input
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-slate-400 mt-1">Shown next to the agent name in the chat header</p>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Welcome Message</label>
            <textarea
              value={form.welcomeMessage}
              onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
              placeholder="Hi! I'm your sales assistant. How can I help you today?"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Widget Position */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Widget Position</label>
            <select
              value={form.widgetPosition}
              onChange={(e) => setForm((f) => ({ ...f, widgetPosition: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-3">Preview</label>
            <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-4 h-24 overflow-hidden">
              {/* Mini chat window preview */}
              <div
                className="absolute bottom-3 rounded-lg shadow-lg overflow-hidden"
                style={{
                  [form.widgetPosition === "bottom-left" ? "left" : "right"]: "16px",
                  width: "180px",
                  height: "60px",
                }}
              >
                <div
                  className="h-full flex items-center gap-2 px-3"
                  style={{
                    background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)`,
                  }}
                >
                  {form.agentAvatarUrl ? (
                    <img src={form.agentAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{form.agentName || "Sales Assistant"}</p>
                    <p className="text-white/70 text-[10px]">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <Input
              type="email"
              value={form.notificationEmail}
              onChange={(e) => setForm((f) => ({ ...f, notificationEmail: e.target.value }))}
              placeholder="owner@company.com"
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
                  <Input
                    value={form.smtpHost}
                    onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Port</label>
                  <Input
                    type="number"
                    value={form.smtpPort}
                    onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value }))}
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                <Input
                  value={form.smtpUser}
                  onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))}
                  placeholder="you@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <Input
                  type="password"
                  value={form.smtpPassword}
                  onChange={(e) => setForm((f) => ({ ...f, smtpPassword: e.target.value }))}
                  placeholder="App password or SMTP password"
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
