"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Users, FileText, Settings, LogOut, MessageSquare } from "lucide-react";
import { logout, getTenantInfo } from "@/lib/auth";

const navItems = [
  { href: "/",          label: "Dashboard", icon: BarChart3 },
  { href: "/leads",     label: "Leads",     icon: Users     },
  { href: "/pricelist", label: "Price List", icon: FileText  },
  { href: "/settings",  label: "Settings",  icon: Settings  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  // Load from localStorage only after mount to avoid SSR/client hydration mismatch
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    setTenant(getTenantInfo());
  }, []);

  const initial = tenant?.name?.[0]?.toUpperCase() ?? "A";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0"
           style={{ boxShadow: "1px 0 0 0 #e2e8f0" }}>

      {/* ── Brand header ── */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">
              {tenant?.name ?? "Sales Widget"}
            </p>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              style={active ? {
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 2px 8px rgba(37,99,235,0.30)",
              } : {}}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-200" : "text-slate-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer / User ── */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-50">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-700 truncate">{tenant?.name ?? "Admin"}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
