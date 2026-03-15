"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Crown,
  UserPlus,
  FlaskConical,
  Swords,
  Bot,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  registeredToday: number;
  totalSessions: number;
  totalChallenges: number;
  totalPartners: number;
  unusedCodes: number;
}

const STAT_CARDS = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "text-blue-500" },
  { key: "premiumUsers", label: "Premium", icon: Crown, color: "text-amber-500" },
  { key: "registeredToday", label: "Today", icon: UserPlus, color: "text-green-500" },
  { key: "totalSessions", label: "Tests Done", icon: FlaskConical, color: "text-purple-500" },
  { key: "totalChallenges", label: "Challenges", icon: Swords, color: "text-red-500" },
  { key: "totalPartners", label: "Partners", icon: Bot, color: "text-cyan-500" },
  { key: "unusedCodes", label: "Codes Left", icon: KeyRound, color: "text-orange-500" },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-muted/50 border border-foreground/5 p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key];
            return (
              <div
                key={card.key}
                className="rounded-2xl bg-muted/30 border border-foreground/5 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", card.color)} />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Failed to load stats</p>
      )}
    </div>
  );
}
