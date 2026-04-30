import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageSquare,
  Zap,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Code2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sales Widget — Instant AI Quotes & Lead Capture for Any Business',
  description:
    'Embed one script tag. AI qualifies visitors, gives instant price quotes, and saves leads to your CRM. Works for any service business that gives price estimates to customers.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
              }}
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Sales Widget</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all hover:brightness-110 shadow-md shadow-blue-600/20"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative pt-20 pb-28 px-5 sm:px-8 text-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 55%, #ffffff 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-20 left-1/3 w-[480px] h-[480px] rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #bfdbfe, transparent)' }}
          />
          <div
            className="absolute top-20 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
            <Zap className="w-3 h-3 fill-blue-600" />
            Powered by GPT-4o · Instant price estimates
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Your website visitor describes their project.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AI quotes them instantly.
            </span>{' '}
            You get the lead.
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Embed one{' '}
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md text-sm font-mono">
              &lt;script&gt;
            </code>{' '}
            tag. The AI handles qualifying questions, calculates prices from your catalog, and saves
            the lead to your CRM dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/25 hover:brightness-110 hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              Start Free Trial — it&apos;s free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-7 py-3.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              See It Live
            </a>
          </div>

          {/* Code snippet + live chat mockup */}
          <div className="flex flex-col lg:flex-row gap-5 items-center justify-center max-w-3xl mx-auto">
            {/* Code block */}
            <div className="w-full lg:flex-1 bg-slate-900 rounded-2xl p-5 text-left shadow-2xl shadow-slate-900/25">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                <span className="ml-2 text-xs text-slate-500 font-mono">your-website.html</span>
              </div>
              <pre className="text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto text-slate-400">
                <span className="text-slate-600">{'<!-- Before </body> -->'}</span>
                {'\n'}
                <span className="text-sky-400">{'<script>'}</span>
                {'\n  window.SalesWidgetConfig = {\n    tenantId: '}
                <span className="text-emerald-400">&quot;your-id&quot;</span>
                {',\n    apiUrl: '}
                <span className="text-emerald-400">&quot;https://yourapp.com&quot;</span>
                {'\n  };\n'}
                <span className="text-sky-400">{'</script>'}</span>
                {'\n'}
                <span className="text-sky-400">{'<script'}</span>
                {' src='}
                <span className="text-emerald-400">&quot;/widget.js&quot;</span>
                <span className="text-sky-400">{'></script>'}</span>
              </pre>
            </div>

            {/* Widget preview mockup */}
            <div
              className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-900/10 flex-shrink-0"
            >
              <div
                className="p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Acme Windows</p>
                  <p className="text-xs text-blue-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    AI · Online
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="bg-slate-100 text-slate-700 text-xs rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] leading-relaxed">
                  Hi! I can give you an instant quote. What are you looking to replace?
                </div>
                <div className="ml-auto bg-blue-600 text-white text-xs rounded-xl rounded-tr-sm px-3 py-2 max-w-[78%] text-right leading-relaxed">
                  3 vinyl double-hung windows, 36&quot;×48&quot;
                </div>
                <div className="bg-slate-100 text-slate-800 text-xs rounded-xl rounded-tl-sm px-3 py-2 max-w-[90%] leading-relaxed">
                  <span className="font-bold">Your quote: $1,284</span> for 3 windows installed. Can I get your name and number to confirm?
                </div>
              </div>
              <div className="px-3 pb-3">
                <div className="border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400 flex-1">Type a message…</span>
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Simple Setup</p>
            <h2 className="text-3xl font-black text-slate-900">Up and running in 3 steps</h2>
            <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
              No developer needed. If you can paste HTML, you can install this.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(
              [
                {
                  step: '1',
                  icon: <Code2 className="w-5 h-5" />,
                  iconStyle: { backgroundColor: '#eff6ff', color: '#2563eb' },
                  title: 'Embed one script tag',
                  description:
                    'Copy two lines of HTML and paste before your </body> tag. Takes under 2 minutes. No developer needed.',
                },
                {
                  step: '2',
                  icon: <MessageSquare className="w-5 h-5" />,
                  iconStyle: { backgroundColor: '#f5f3ff', color: '#7c3aed' },
                  title: 'Visitor chats — gets an instant quote',
                  description:
                    'Your visitor describes what they need. The AI asks smart follow-up questions and calculates a price from your catalog.',
                },
                {
                  step: '3',
                  icon: <BarChart3 className="w-5 h-5" />,
                  iconStyle: { backgroundColor: '#f0fdf4', color: '#16a34a' },
                  title: 'Lead saved to your dashboard',
                  description:
                    'Name, phone, email, requirements, and quoted price — all captured in your CRM. Get notified by email instantly.',
                },
              ] as const
            ).map(({ step, icon, iconStyle, title, description }) => (
              <div
                key={step}
                className="bg-white rounded-2xl border border-slate-200 p-7"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={iconStyle}
                  >
                    {icon}
                  </div>
                  <span className="text-5xl font-black leading-none text-slate-100">{step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Industries</p>
            <h2 className="text-3xl font-black text-slate-900">Built for any service business</h2>
            <p className="text-slate-500 mt-3 text-sm max-w-lg mx-auto">
              If your business qualifies customers and gives price estimates — over the phone or online — this automates it.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                emoji: '🏗️',
                label: 'Contractors & Trades',
                desc: 'Windows, roofing, fencing, HVAC, plumbing — instant per-job quotes',
              },
              {
                emoji: '🏡',
                label: 'Home Services',
                desc: 'Cleaning, landscaping, pest control, moving — qualify and quote on the spot',
              },
              {
                emoji: '💼',
                label: 'Professional Services',
                desc: 'Agencies, consultants, law firms — scope projects and capture leads 24/7',
              },
              {
                emoji: '🛒',
                label: 'Any Service Business',
                desc: 'Upload your price list as CSV — the AI handles qualifying and quoting',
              },
            ].map(({ emoji, label, desc }) => (
              <div
                key={label}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-tight">{label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Pricing</p>
            <h2 className="text-3xl font-black text-slate-900">Simple, honest pricing</h2>
            <p className="text-slate-500 mt-3 text-sm">Cancel anytime. No setup fees. 14-day free trial on all plans.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Starter */}
            <div
              className="bg-white rounded-2xl border border-slate-200 p-8"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Starter</p>
              <div className="flex items-end gap-1 mt-2 mb-6">
                <span className="text-4xl font-black text-slate-900">$29</span>
                <span className="text-slate-400 text-sm mb-1.5">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '1 widget',
                  'Up to 100 leads/month',
                  'Email notifications',
                  'AI-powered price quotes',
                  'Lead CRM dashboard',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-4 py-3 rounded-xl transition-all"
              >
                Get started
              </Link>
            </div>

            {/* Pro — Most Popular */}
            <div
              className="relative bg-white rounded-2xl border-2 border-blue-600 p-8"
              style={{ boxShadow: '0 8px 32px rgba(37,99,235,0.14)' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span
                  className="text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-blue-600/30"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                >
                  Most Popular
                </span>
              </div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Pro</p>
              <div className="flex items-end gap-1 mt-2 mb-6">
                <span className="text-4xl font-black text-slate-900">$59</span>
                <span className="text-slate-400 text-sm mb-1.5">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '5 widgets',
                  'Unlimited leads',
                  'Custom pricing catalog',
                  'SMTP email config',
                  'Knowledge base (docs/FAQs)',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center text-sm font-semibold text-white px-4 py-3 rounded-xl shadow-md shadow-blue-600/25 hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                Start free trial
              </Link>
            </div>

            {/* Agency */}
            <div
              className="bg-white rounded-2xl border border-slate-200 p-8"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agency</p>
              <div className="flex items-end gap-1 mt-2 mb-6">
                <span className="text-4xl font-black text-slate-900">$149</span>
                <span className="text-slate-400 text-sm mb-1.5">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited widgets',
                  'Unlimited tenants',
                  'Superadmin dashboard',
                  'White-label ready',
                  'Custom branding per tenant',
                  'Dedicated support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-4 py-3 rounded-xl transition-all"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST / SOCIAL PROOF ── */}
      <section className="py-20 px-5 sm:px-8 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Built with enterprise-grade technology
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            {[
              { label: 'ASP.NET Core 9', bg: '#faf5ff', color: '#7c3aed', border: '#ede9fe' },
              { label: 'OpenAI GPT-4o',   bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
              { label: 'SignalR WebSockets', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
              { label: 'PostgreSQL',       bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
              { label: 'Next.js 15',       bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
            ].map(({ label, bg, color, border }) => (
              <span
                key={label}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border"
                style={{ backgroundColor: bg, color, borderColor: border }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '🚀',
                title: 'No coding required to configure',
                desc: 'Pricing catalog, knowledge base, branding, and SMTP — all set from a simple admin panel. Zero code.',
              },
              {
                icon: '🎨',
                title: 'Your pricing catalog, your branding',
                desc: 'Upload prices as CSV or enter them manually. Set your colors, logo, and agent name. Looks like yours.',
              },
              {
                icon: '🔒',
                title: 'Isolated, secure, multi-tenant',
                desc: 'Each business gets its own tenant. JWT auth, per-tenant data isolation, no data leakage between accounts.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="py-20 px-5 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #1d4ed8 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ready to capture more leads?</h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Set up in under 10 minutes. No developer needed. Your first 14 days are free.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold bg-white text-blue-700 px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/30"
          >
            Start your free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-5 sm:px-8 bg-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-300">Sales Widget</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="mailto:hello@constructionwidget.com" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-slate-500">© 2025 Sales Widget</p>
        </div>
      </footer>
    </div>
  );
}
