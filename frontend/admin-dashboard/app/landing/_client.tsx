'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle, ChevronDown } from 'lucide-react';

/* ─── Scroll-reveal wrapper ─────────────────────────────────────────────── */
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
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── Pricing toggle + cards ────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 29,
    annual: 24,
    tagline: 'Perfect for solo operators testing AI quoting.',
    color: 'slate' as const,
    features: [
      '1 widget',
      'Up to 100 leads / month',
      'Email notifications',
      'AI-powered price quotes',
      'Lead CRM dashboard',
    ],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 59,
    annual: 49,
    tagline: 'For growing businesses serious about lead volume.',
    color: 'blue' as const,
    popular: true,
    features: [
      '5 widgets',
      'Unlimited leads',
      'Custom pricing catalog',
      'SMTP email config',
      'Knowledge base (docs / FAQs)',
      'Priority support',
    ],
    cta: 'Start free trial',
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: 149,
    annual: 124,
    tagline: 'Run AI chat for every client from one dashboard.',
    color: 'slate' as const,
    features: [
      'Unlimited widgets',
      'Unlimited tenants',
      'Superadmin dashboard',
      'White-label ready',
      'Custom branding per tenant',
      'Dedicated support',
    ],
    cta: 'Contact us',
  },
] as const;

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
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
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
          'popular' in plan && plan.popular ? (
            /* Animated gradient border wrapper for Pro plan */
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
                  <span className="text-4xl font-black text-slate-900">
                    ${annual ? plan.annual : plan.monthly}
                  </span>
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
                  className="block w-full text-center text-sm font-bold text-white px-4 py-3 rounded-xl transition-all hover:brightness-110 shadow-md shadow-blue-600/25"
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
                <span className="text-4xl font-black text-slate-900">
                  ${annual ? plan.annual : plan.monthly}
                </span>
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
    a: 'The AI asks qualifying questions, calculates a price from your catalog, and saves the lead (name, phone, email, requirements, quoted price) to your CRM dashboard. You get an email notification instantly.',
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
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
            <ChevronDown
              className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform"
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
