"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  Radio,
  Search,
  Users,
  Globe,
  Stethoscope,
  Lightbulb,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Map,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

type NavSection = {
  label?: string;
  items: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    accent?: string; // optional color accent for primary tabs
  }>;
};

const navSections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard, accent: "bg-accent/10 text-accent" },
    ],
  },
  {
    label: "モニタリング",
    items: [
      { href: "/keywords", label: "キーワード", icon: Key, accent: "bg-emerald-50 text-emerald-600" },
      { href: "/monitoring", label: "GEOモニタリング", icon: Radio, accent: "bg-indigo-50 text-indigo-600" },
      { href: "/seo", label: "SEO順位", icon: Search, accent: "bg-amber-50 text-amber-600" },
    ],
  },
  {
    label: "分析",
    items: [
      { href: "/competitors", label: "競合管理", icon: Users },
      { href: "/competitors/map", label: "業界マップ", icon: Map },
      { href: "/diagnosis", label: "サイト診断", icon: Stethoscope },
    ],
  },
  {
    label: "改善",
    items: [
      { href: "/actions", label: "施策提案", icon: Lightbulb },
      { href: "/content", label: "コンテンツ生成", icon: FileText },
    ],
  },
  {
    label: "管理",
    items: [
      { href: "/sites", label: "サイト管理", icon: Globe },
      { href: "/reports", label: "レポート", icon: BarChart3 },
      { href: "/alerts", label: "アラート", icon: Bell },
      { href: "/settings", label: "設定", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-bg-sidebar h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
          GEO
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-text-primary truncate">
            GEO Monitor
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-3" : ""}>
            {section.label && !collapsed && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted/60">
                {section.label}
              </p>
            )}
            {si > 0 && collapsed && (
              <div className="mx-3 mb-1 border-t border-border-light" />
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors mb-0.5",
                    isActive
                      ? "bg-accent-light text-accent-text font-medium"
                      : item.accent && !isActive
                        ? cn(item.accent, "hover:opacity-80")
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Mock data indicator */}
      {process.env.NEXT_PUBLIC_USE_MOCK === "true" && !collapsed && (
        <div className="mx-3 mb-2 rounded-md bg-warning-light px-3 py-1.5 text-xs text-amber-700 font-medium text-center">
          Mock Data
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
