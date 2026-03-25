"use client";

import { Bell, User } from "lucide-react";
import { Badge } from "@/components/ui";

interface HeaderProps {
  orgName?: string;
  userName?: string;
  alertCount?: number;
}

export function Header({
  orgName = "Stock Value",
  userName = "木村",
  alertCount = 3,
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-bg-card px-6">
      {/* Left: breadcrumb area (filled by pages) */}
      <div />

      {/* Right: controls */}
      <div className="flex items-center gap-4">
        {/* Alerts */}
        <button className="relative rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors cursor-pointer">
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>

        {/* Org + User */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <Badge variant="muted">{orgName}</Badge>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-muted text-text-secondary">
            <User size={14} />
          </div>
          <span className="text-sm text-text-secondary">{userName}</span>
        </div>
      </div>
    </header>
  );
}
