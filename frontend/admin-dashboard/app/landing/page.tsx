import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import {
  MessageSquare,
  Zap,
  BarChart3,
  Shield,
  Clock,
  Code2,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Wrench,
  Home,
  Briefcase,
  LayoutGrid,
  Bell,
  Settings2,
  Database,
  Lock,
  Sparkles,
  Star,
  ChevronRight,
} from 'lucide-react';
import { PricingSection, FAQSection } from './_client';

/* ─── SEO metadata ──────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Sales Widget — Instant AI Quotes & Lead Capture for Any Business',
  description:
    'Embed one script tag. AI qualifies visitors, gives instant price quotes, and saves leads to your CRM. Works for contractors, home services, agencies, and any service business that gives estimates.',
  keywords: [
    'AI sales widget',
    'lead capture',
    'instant quotes',
    'service business automation',
    'AI chatbot pricing',
    'CRM lead generation',
    'price estimation tool',
    'contractor lead capture',
  ],
  alternates: { canonical: 'https://saleswidget.app' },
  openGraph: {
    title: 'Sales Widget — AI Quotes & Lead Capture for Any Business',
    description:
      'One script tag. AI qualifies visitors, gives instant quotes, saves leads to your CRM.',
    type: 'website',
    siteName: 'Sales Widget',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sales Widget — Instant AI Quotes for Any Service Business',
    description:
      'Embed one script tag. AI handles qualifying, quoting, and lead capture automatically.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sales Widget',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered sales chat widget that qualifies visitors, gives instant price quotes, and captures leads for any service business.',
  offers: [
    { '@type': 'Offer', name: 'Starter', price: '29', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro',     price: '59', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Agency',  price: '149', priceCurrency: 'USD' },
  ],
};

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header>
        <nav
          className="fixed top-0 left-0 right-0 z-50 border-b"
          style={{
            background: 'rgba(10,15,30,0.88)',
            backdropFilter: 'blur(14px)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}
          aria-label="Main navigation"
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 2px 10px rgba(37,99,235,0.45)',
                }}
              >
                <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-white">Sales Widget</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(
                ([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ),
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-400 hover:text-white px-3 py-2 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="text-sm font-bold text-white px-4 py-2 rounded-xl transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 0 18px rgba(37,99,235,0.35)',
                }}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section
          className="relative min-h-screen flex items-center pt-16 pb-20 px-5 sm:px-8 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #0f172a 45%, #1e1b4b 100%)' }}
          aria-label="Hero"
        >
          {/* Dot-grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgba(37,99,235,0.18) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden="true"
          />

          {/* Animated blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div
              className="animate-blob absolute -top-32 -left-20 w-[480px] h-[480px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(37,99,235,0.35), transparent 70%)',
                filter: 'blur(72px)',
              }}
            />
            <div
              className="animate-blob animation-delay-2 absolute top-1/3 -right-32 w-96 h-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%)',
                filter: 'blur(72px)',
              }}
            />
            <div
              className="animate-blob animation-delay-4 absolute -bottom-20 left-1/3 w-80 h-80 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(14,165,233,0.25), transparent 70%)',
                filter: 'blur(72px)',
              }}
            />
          </div>

          <div className="max-w-6xl mx-auto w-full relative">
            {/* Eyebrow badge */}
            <div className="flex justify-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold"
                style={{
                  background: 'rgba(37,99,235,0.13)',
                  borderColor: 'rgba(99,151,235,0.3)',
                  color: '#93c5fd',
                }}
              >
                <Zap className="w-3 h-3 fill-blue-400" aria-hidden="true" />
                Powered by GPT-4o · Instant price estimates · 24/7
              </div>
            </div>

            {/* H1 */}
            <h1 className="text-center text-4xl sm:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-black text-white leading-[1.05] tracking-tight mb-6 max-w-5xl mx-auto">
              Your website visitor describes their project.{' '}
              <span
                style={{
                  background:
                    'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI quotes them instantly.
              </span>{' '}
              You get the lead.
            </h1>

            {/* Subheadline */}
            <p className="text-center text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Embed one{' '}
              <code
                className="text-sm font-mono rounded-md px-1.5 py-0.5"
                style={{ background: 'rgba(255,255,255,0.09)', color: '#93c5fd' }}
              >
                &lt;script&gt;
              </code>{' '}
              tag. The AI handles qualifying questions, calculates prices from your catalog, and
              saves the lead to your CRM dashboard.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-white px-8 py-4 rounded-xl transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 0 36px rgba(37,99,235,0.55), 0 4px 16px rgba(37,99,235,0.3)',
                }}
              >
                Start Free Trial — 14 days free
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold px-8 py-4 rounded-xl border transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.78)' }}
              >
                See It Live
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            {/* Hero visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto animate-float">
              {/* Terminal */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
                }}
              >
                <div
                  className="flex items-center gap-1.5 px-4 py-3"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: '#161b22',
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-400/70" aria-hidden="true" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/70" aria-hidden="true" />
                  <div className="w-3 h-3 rounded-full bg-green-400/70" aria-hidden="true" />
                  <span className="ml-3 text-xs font-mono" style={{ color: '#6e7681' }}>
                    your-website.html
                  </span>
                </div>
                <pre
                  className="p-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto"
                  style={{ color: '#8b949e' }}
                >
                  <span style={{ color: '#6e7681' }}>{'<!-- Before </body> -->'}</span>
                  {'\n'}
                  <span style={{ color: '#79c0ff' }}>{'<script>'}</span>
                  {'\n  window.SalesWidgetConfig = {\n    tenantId: '}
                  <span style={{ color: '#a5d6ff' }}>&quot;your-id&quot;</span>
                  {',\n    apiUrl: '}
                  <span style={{ color: '#a5d6ff' }}>&quot;https://yourapp.com&quot;</span>
                  {'\n  };\n'}
                  <span style={{ color: '#79c0ff' }}>{'</script>'}</span>
                  {'\n'}
                  <span style={{ color: '#79c0ff' }}>{'<script'}</span>
                  {' src='}
                  <span style={{ color: '#a5d6ff' }}>&quot;https://yourapp.com/widget.js&quot;</span>
                  <span style={{ color: '#79c0ff' }}>{'></script>'}</span>
                </pre>
              </div>

              {/* Chat widget mockup */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'white',
                  boxShadow:
                    '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(37,99,235,0.22)',
                }}
              >
                <div
                  className="p-4 flex items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Acme Services</p>
                    <p className="text-xs text-blue-200 flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                        aria-hidden="true"
                      />
                      AI Assistant · Online
                    </p>
                  </div>
                </div>
                <div className="p-3 space-y-2.5 bg-slate-50">
                  {[
                    { from: 'ai',   text: 'Hi! I can give you an instant quote. What service are you looking for?' },
                    { from: 'user', text: 'Full roof replacement, about 2,200 sq ft.' },
                    { from: 'ai',   text: '📋 Your estimate: $8,800–$11,000 installed. Can I get your name and number?' },
                    { from: 'user', text: 'Sarah — 555-0192' },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`text-xs rounded-xl px-3 py-2 leading-relaxed ${
                        m.from === 'ai'
                          ? 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-sm max-w-[88%]'
                          : 'ml-auto bg-blue-600 text-white shadow-sm rounded-tr-sm max-w-[72%] text-right'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  <div className="bg-white border border-emerald-100 text-emerald-700 text-xs rounded-xl rounded-tl-sm px-3 py-2 max-w-[90%] shadow-sm flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    Lead saved! You&apos;ll hear back within 24 hours.
                  </div>
                </div>
                <div className="px-3 pb-3 bg-slate-50">
                  <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                    <span className="text-xs text-slate-400 flex-1">Type a message…</span>
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <ArrowRight className="w-2.5 h-2.5 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ───────────────────────────────────────────────────── */}
        <section
          className="py-10 px-5 sm:px-8 border-b border-slate-100"
          aria-label="Technology stack"
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
              Enterprise-grade technology
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: 'ASP.NET Core 9',    bg: '#faf5ff', color: '#7c3aed', border: '#ede9fe' },
                { label: 'OpenAI GPT-4o',     bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
                { label: 'SignalR',           bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
                { label: 'PostgreSQL',        bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
                { label: 'Next.js 15',        bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
                { label: 'JWT Auth',          bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
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
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8 bg-white" aria-label="Key metrics">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center">
            {[
              { value: '< 2 min',  label: 'average setup time',                   Icon: Clock,      color: '#2563eb' },
              { value: '4.9×',     label: 'more leads vs. contact forms',          Icon: TrendingUp, color: '#7c3aed' },
              { value: '< 3 sec',  label: 'AI response time',                      Icon: Zap,        color: '#16a34a' },
            ].map(({ value, label, Icon, color }) => (
              <div key={label} className="py-8 sm:py-0 flex flex-col items-center gap-2 px-8">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                  style={{ background: `${color}14` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} aria-hidden="true" />
                </div>
                <div className="text-4xl font-black text-slate-900">{value}</div>
                <div className="text-sm text-slate-500 leading-relaxed max-w-[160px]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES BENTO ──────────────────────────────────────────────── */}
        <section
          id="features"
          className="py-24 px-5 sm:px-8 bg-slate-50"
          aria-labelledby="features-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Features
              </p>
              <h2
                id="features-heading"
                className="text-3xl font-black text-slate-900"
              >
                Everything you need to close leads automatically
              </h2>
              <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
                No more missed calls. No more &ldquo;I&apos;ll get back to you with a quote.&rdquo;
                The AI handles it 24/7.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Wide featured tile */}
              <article
                className="md:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 group hover:border-blue-200 hover:shadow-xl transition-all"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: '#eff6ff' }}
                >
                  <Zap className="w-6 h-6 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Instant AI Quotes</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Visitors describe their project in plain language. The AI asks smart follow-up
                  questions, references your pricing catalog, and delivers an accurate quote — all
                  in under 3 seconds. No waiting, no phone tag.
                </p>
              </article>

              {[
                {
                  Icon: BarChart3,  title: 'Lead CRM Dashboard',      bg: '#f5f3ff', color: '#7c3aed',
                  desc: 'Name, phone, email, requirements, and quoted price in one place.',
                },
                {
                  Icon: Database,   title: 'Custom Pricing Catalog',   bg: '#f0fdf4', color: '#16a34a',
                  desc: 'Upload prices as CSV or enter them manually. The AI learns your rates instantly.',
                },
                {
                  Icon: Shield,     title: 'Multi-tenant Isolation',   bg: '#fff7ed', color: '#ea580c',
                  desc: 'Each business gets its own isolated tenant. JWT auth, zero data leakage.',
                },
                {
                  Icon: Bell,       title: 'SMTP Notifications',       bg: '#eff6ff', color: '#2563eb',
                  desc: 'Get emailed the instant a lead comes in. Configure your own SMTP server.',
                },
                {
                  Icon: Settings2,  title: 'No-Code Setup',            bg: '#f8fafc', color: '#64748b',
                  desc: 'Configure everything from the admin panel. Zero coding required after embed.',
                },
              ].map(({ Icon, title, bg, color, desc }) => (
                <article
                  key={title}
                  className="bg-white rounded-2xl p-7 border border-slate-200 group hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                    style={{ background: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section className="py-24 px-5 sm:px-8 bg-white" aria-labelledby="how-heading">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Simple Setup
              </p>
              <h2 id="how-heading" className="text-3xl font-black text-slate-900">
                Up and running in 3 steps
              </h2>
              <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
                No developer needed. If you can paste HTML, you can install this in under
                10&nbsp;minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line */}
              <div
                className="hidden md:block absolute top-11 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #bfdbfe 20%, #bfdbfe 80%, transparent)' }}
                aria-hidden="true"
              />

              {[
                {
                  step: '01', Icon: Code2,
                  iconBg: '#eff6ff', iconColor: '#2563eb',
                  title: 'Embed one script tag',
                  desc: 'Copy two lines of HTML and paste before your </body> tag. Takes under 2 minutes.',
                },
                {
                  step: '02', Icon: MessageSquare,
                  iconBg: '#f5f3ff', iconColor: '#7c3aed',
                  title: 'Visitor chats, gets an instant quote',
                  desc: 'The AI asks smart follow-up questions and calculates a price from your catalog.',
                },
                {
                  step: '03', Icon: BarChart3,
                  iconBg: '#f0fdf4', iconColor: '#16a34a',
                  title: 'Lead saved to your dashboard',
                  desc: 'Name, phone, email, requirements, quoted price — all captured. Email alert sent instantly.',
                },
              ].map(({ step, Icon, iconBg, iconColor, title, desc }) => (
                <article key={step} className="relative flex flex-col items-center text-center p-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 relative z-10"
                    style={{ background: iconBg, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}
                  >
                    <Icon className="w-9 h-9" style={{ color: iconColor }} aria-hidden="true" />
                  </div>
                  <div
                    className="absolute top-0 right-6 text-7xl font-black leading-none pointer-events-none select-none"
                    style={{ color: '#f1f5f9' }}
                    aria-hidden="true"
                  >
                    {step}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO ────────────────────────────────────────────────────────── */}
        <section
          id="demo"
          className="py-24 px-5 sm:px-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #0f172a 50%, #1e1b4b 100%)' }}
          aria-labelledby="demo-heading"
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-72 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(37,99,235,0.15), transparent 70%)',
              filter: 'blur(40px)',
            }}
            aria-hidden="true"
          />
          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-14">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
                Live Demo
              </p>
              <h2
                id="demo-heading"
                className="text-3xl font-black text-white"
              >
                See it in action
              </h2>
              <p className="text-slate-400 mt-3 text-sm max-w-md mx-auto">
                This is exactly what your website visitors see — a conversational AI that
                qualifies and quotes in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Expanded chat */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'white',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,99,235,0.2)',
                }}
              >
                <div
                  className="p-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Your Business Name</p>
                      <p className="text-xs text-blue-200 flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                          aria-hidden="true"
                        />
                        AI Assistant · Instant quotes
                      </p>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-blue-300" aria-label="Secure connection" />
                </div>

                <div className="p-4 space-y-3 bg-slate-50" style={{ minHeight: '288px' }}>
                  {[
                    { from: 'ai',   text: "Hi! I'm here to help you get an instant quote. What service are you looking for today?" },
                    { from: 'user', text: 'I need 4 windows replaced in my home.' },
                    { from: 'ai',   text: 'Are you looking for double-hung, casement, or sliding windows? And standard 36"×48" or custom sizing?' },
                    { from: 'user', text: 'Double-hung, standard size.' },
                    { from: 'ai',   text: '✅ Your quote: $1,940 for 4 double-hung windows installed — includes labor, disposal & 1-year warranty. Can I get your name and number?' },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`text-xs rounded-xl px-3 py-2 leading-relaxed ${
                        m.from === 'ai'
                          ? 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-sm max-w-[88%]'
                          : 'ml-auto bg-blue-600 text-white rounded-tr-sm max-w-[75%] text-right'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4 bg-slate-50">
                  <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                    <span className="text-xs text-slate-400 flex-1">Type your message…</span>
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>

              {/* What gets captured */}
              <div className="space-y-4">
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.09)',
                  }}
                >
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    What gets saved to your CRM
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      ['Name',          'Sarah Johnson'],
                      ['Phone',         '(555) 012-3456'],
                      ['Email',         'sarah@email.com'],
                      ['Requirements',  '4× double-hung windows'],
                      ['Quoted price',  '$1,940'],
                      ['Status',        'New lead'],
                    ].map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{key}</span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: key === 'Quoted price' ? '#4ade80' : 'rgba(255,255,255,0.72)' }}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.09)',
                  }}
                >
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    Instant email notification
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You get an email the moment the lead is captured — all details included,
                    ready for your follow-up.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white py-3.5 rounded-xl transition-all hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: '0 0 24px rgba(37,99,235,0.4)',
                  }}
                >
                  Start capturing leads like this
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── INDUSTRIES ──────────────────────────────────────────────────── */}
        <section
          className="py-24 px-5 sm:px-8 bg-white"
          aria-labelledby="industries-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Industries
              </p>
              <h2
                id="industries-heading"
                className="text-3xl font-black text-slate-900"
              >
                Built for any service business
              </h2>
              <p className="text-slate-500 mt-3 text-sm max-w-lg mx-auto">
                If your business qualifies customers and gives price estimates — over the phone,
                online, or in person — this automates it.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  Icon: Wrench,     label: 'Contractors & Trades',
                  desc: 'Windows, roofing, fencing, HVAC, plumbing — instant per-job quotes',
                  bg: '#eff6ff', color: '#2563eb',
                },
                {
                  Icon: Home,       label: 'Home Services',
                  desc: 'Cleaning, landscaping, pest control, moving — qualify and quote on the spot',
                  bg: '#f0fdf4', color: '#16a34a',
                },
                {
                  Icon: Briefcase,  label: 'Professional Services',
                  desc: 'Agencies, consultants, law firms — scope projects and capture leads 24/7',
                  bg: '#f5f3ff', color: '#7c3aed',
                },
                {
                  Icon: LayoutGrid, label: 'Any Service Business',
                  desc: 'Upload your price list as CSV — the AI handles qualifying and quoting',
                  bg: '#fff7ed', color: '#ea580c',
                },
              ].map(({ Icon, label, desc, bg, color }) => (
                <article
                  key={label}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-blue-200 hover:bg-blue-50/30 hover:-translate-y-1 transition-all group"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-tight">{label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="py-24 px-5 sm:px-8 bg-slate-50"
          aria-labelledby="pricing-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Pricing
              </p>
              <h2
                id="pricing-heading"
                className="text-3xl font-black text-slate-900"
              >
                Simple, honest pricing
              </h2>
              <p className="text-slate-500 mt-3 text-sm">
                Cancel anytime. No setup fees. 14-day free trial on all plans.
              </p>
            </div>
            <PricingSection />
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
        <section
          className="py-24 px-5 sm:px-8 bg-white"
          aria-labelledby="testimonials-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Social Proof
              </p>
              <h2
                id="testimonials-heading"
                className="text-3xl font-black text-slate-900"
              >
                Businesses love Sales Widget
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  initials: 'MR', name: 'Marcus R.', role: 'Owner', company: 'Apex Roofing Co.',
                  color: '#2563eb',
                  quote:
                    "We were losing leads overnight. Now the AI captures them 24/7 with a real quote attached. Our close rate went up almost immediately — we're following up with already-qualified leads.",
                },
                {
                  initials: 'JS', name: 'Jamie S.', role: 'Operations Manager', company: 'ClearView Windows',
                  color: '#7c3aed',
                  quote:
                    'Setup took 8 minutes. I uploaded our price sheet, embedded the script, and it was live. Leads come in with name, phone, and a quoted price already filled out.',
                },
                {
                  initials: 'TK', name: 'Theresa K.', role: 'Founder', company: 'GreenScape Landscaping',
                  color: '#16a34a',
                  quote:
                    "My customers get quotes at 11pm on a Saturday. I wake up to 3-4 new leads with full details every Monday morning. It's like having a sales rep who never sleeps.",
                },
              ].map(({ initials, name, role, company, color, quote }) => (
                <article
                  key={name}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-all"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex gap-1" role="img" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote className="text-sm text-slate-600 leading-relaxed flex-1">
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">
                        {role} · {company}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          className="py-24 px-5 sm:px-8 bg-slate-50"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                FAQ
              </p>
              <h2 id="faq-heading" className="text-3xl font-black text-slate-900">
                Common questions
              </h2>
            </div>
            <FAQSection />
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
        <section
          className="py-24 px-5 sm:px-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #1d4ed8 100%)' }}
          aria-label="Call to action"
        >
          <div
            className="absolute -top-24 right-1/4 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(147,197,253,0.2), transparent)',
              filter: 'blur(60px)',
            }}
            aria-hidden="true"
          />
          <div className="max-w-2xl mx-auto text-center relative">
            <Sparkles className="w-8 h-8 text-blue-300 mx-auto mb-6" aria-hidden="true" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Ready to capture more leads automatically?
            </h2>
            <p className="text-blue-200 text-base leading-relaxed mb-8">
              Set up in under 10 minutes. No developer needed. Your first 14 days are completely
              free.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold bg-white px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/30"
              style={{ color: '#1d4ed8' }}
            >
              Start your free trial today
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-14 px-5 sm:px-8" aria-label="Site footer">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-white">Sales Widget</span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[190px]">
                AI-powered quoting and lead capture for any service business.
              </p>
            </div>

            {/* Product */}
            <nav aria-label="Product links">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Product
              </p>
              <ul className="space-y-2">
                {[['Features', '#features'], ['Pricing', '#pricing'], ['Demo', '#demo'], ['FAQ', '#faq']].map(
                  ([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-slate-500 hover:text-white transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company links">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Company
              </p>
              <ul className="space-y-2">
                {[
                  ['Log in',           '/login'],
                  ['Start Free Trial', '/login'],
                  ['Contact',          'mailto:hello@saleswidget.app'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Legal links">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Legal
              </p>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Security'].map((label) => (
                  <li key={label}>
                    <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">© 2025 Sales Widget. All rights reserved.</p>
            <p className="text-xs text-slate-600">
              Built with ASP.NET Core · OpenAI · SignalR · PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
