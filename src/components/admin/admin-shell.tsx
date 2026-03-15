"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, KeyRound, ArrowLeft, Shield, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  username: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/codes", label: "Codes", icon: KeyRound },
];

export function AdminShell({ username, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-12 items-center justify-between px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Admin</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{username}</span>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="border-b border-border bg-background/50">
        <div className="flex gap-1 px-4 max-w-6xl mx-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors",
                  active
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
