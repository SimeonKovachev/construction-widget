'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

/* ─── ScrollReveal ───────────────────────────────────────────────────────── */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Mobile nav ─────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing',  href: '#pricing'  },
  { label: 'Demo',     href: '#demo'     },
  { label: 'FAQ',      href: '#faq'      },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10"
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu className="w-5 h-5 text-white" aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="fixed inset-y-0 right-0 z-[70] w-72 flex flex-col animate-pop-in"
            style={{ background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 h-16 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-white">Sales Widget</span>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Mobile navigation">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/08 transition-all"
                  style={{}}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Footer CTAs */}
            <div className="px-4 pb-8 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
              <Link
                href="/login"
                onClick={close}
                className="block w-full text-center text-sm font-medium text-slate-300 hover:text-white py-2.5 rounded-xl border transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              >
                Log in
              </Link>
              <Link
                href="/login"
                onClick={close}
                className="block w-full text-center text-sm font-bold text-white py-3 rounded-xl cta-glow transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Animated counter stat ──────────────────────────────────────────────── */
export function CountUpStat({
  value,
  label,
  icon: Icon,
  color,
}: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="py-8 sm:py-0 flex flex-col items-center gap-2 px-8 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-500"
        style={{ background: `${color}14`, transform: visible ? 'scale(1)' : 'scale(0.8)' }}
      >
        <Icon className="w-6 h-6" style={{ color }} aria-hidden="true" />
      </div>
      <div
        className="text-4xl font-black text-slate-900 transition-all duration-700"
        style={{ transitionDelay: '150ms' }}
      >
        {value}
      </div>
      <div className="text-sm text-slate-500 leading-relaxed max-w-[160px] text-center">
        {label}
      </div>
    </div>
  );
}

/* ─── Sticky bottom CTA bar ──────────────────────────────────────────────── */
export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 sticky-cta-enter"
      style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      role="complementary"
      aria-label="Quick access to free trial"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <p className="hidden sm:block text-sm text-slate-400 leading-tight">
          <span className="text-white font-semibold">Sales Widget</span>
          {' — '}AI quotes your visitors. You close more deals.
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <span className="hidden sm:block text-xs text-slate-500">No credit card required</span>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl cta-glow transition-all hover:brightness-110 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            Start Free Trial
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing toggle + cards ─────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 29,
    annual: 24,
    tagline: 'Perfect for solo operators testing AI quoting.',
    features: [
      '1 widget',
      'Up to 100 leads / month',
      'Email notifications',
      'AI-powered price quotes',
      'Lead CRM dashboard',
    ],
    cta: 'Get started',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 59,
    annual: 49,
    tagline: 'For growing businesses serious about lead volume.',
    features: [
      '5 widgets',
      'Unlimited leads',
      'Custom pricing catalog',
      'SMTP email config',
      'Knowledge base (docs / FAQs)',
      'Priority support',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: 149,
    annual: 124,
    tagline: 'Run AI chat for every client from one dashboard.',
    features: [
      'Unlimited widgets',
      'Unlimited tenants',
      'Superadmin dashboard',
      'White-label ready',
      'Custom branding per tenant',
      'Dedicated support',
    ],
    cta: 'Contact us',
    popular: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-medium transition-colors ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className="relative w-12 h-6 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
          style={{ background: annual ? '#2563eb' : '#e2e8f0' }}
          aria-label="Toggle annual billing"
          aria-pressed={annual}
        >
          <span
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
            style={{ left: annual ? '1.5rem' : '0.25rem' }}
          />
        </button>
        <span className={`text-sm font-medium flex items-center gap-2 transition-colors ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
          Annual
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Save 17%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) =>
          plan.popular ? (
            <div
              key={plan.id}
              className="relative rounded-[18px] p-[2px]"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed, #2563eb, #1d4ed8)',
                backgroundSize: '300% 300%',
                animation: 'gradientFlow 4s ease infinite',
                boxShadow: '0 8px 40px rgba(37,99,235,0.18)',
              }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span
                  className="text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                >
                  Most Popular
                </span>
              </div>
              <div className="bg-white rounded-[16px] p-8">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mt-2 mb-2">
                  <span className="text-4xl font-black text-slate-900">${annual ? plan.annual : plan.monthly}</span>
                  <span className="text-slate-400 text-sm mb-2">/mo</span>
                </div>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">{plan.tagline}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full text-center text-sm font-bold text-white px-4 py-3 rounded-xl cta-glow transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ) : (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 p-8"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{plan.name}</p>
              <div className="flex items-end gap-1 mt-2 mb-2">
                <span className="text-4xl font-black text-slate-900">${annual ? plan.annual : plan.monthly}</span>
                <span className="text-slate-400 text-sm mb-2">/mo</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">{plan.tagline}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full text-center text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-4 py-3 rounded-xl transition-all"
              >
                {plan.cta}
              </Link>
            </div>
          ),
        )}
      </div>

      {/* Guarantee ribbon */}
      <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
        14-day free trial &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; Cancel anytime
      </div>
    </div>
  );
}

/* ─── FAQ accordion ──────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'How long does it take to set up?',
    a: 'Under 10 minutes. Copy two lines of HTML into your website before the </body> tag. No developer required — the widget goes live immediately.',
  },
  {
    q: 'How does the AI know my prices?',
    a: 'You upload your pricing catalog as a CSV file or enter items manually in the admin panel. The AI reads your catalog and uses it to calculate quotes during every conversation.',
  },
  {
    q: 'What happens when a visitor chats?',
    a: 'The AI asks qualifying questions, calculates a price from your catalog, and saves the lead — name, phone, email, requirements, and quoted price — to your CRM dashboard. You get an email notification instantly.',
  },
  {
    q: 'Can I use this for my industry?',
    a: 'Yes. Sales Widget works for any service business that gives price estimates — contractors, home services, agencies, consultants, and more. If you quote customers, this automates it.',
  },
  {
    q: 'Is there a free trial?',
    a: 'All plans include a 14-day free trial. No credit card required to start. Cancel any time — no questions asked.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
            <ChevronDown
              className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300"
              style={{ transform: open === i ? 'rotate(180deg)' : 'none' }}
              aria-hidden="true"
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
