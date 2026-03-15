"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Crown, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  tier: "free" | "premium";
  tierExpiresAt: string | null;
  isAdmin: boolean;
  createdAt: string;
  sessionCount: number;
  partnerCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleTier = async (userId: string, currentTier: string) => {
    const newTier = currentTier === "premium" ? "free" : "premium";
    await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier: newTier }),
    });
    fetchUsers();
  };

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
    });
    fetchUsers();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Users ({total})</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-muted/50 border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tier</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Tests</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Partners</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-foreground/5">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                      </td>
                    </tr>
                  ))
                : users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-foreground/5 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {user.isAdmin && (
                            <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-medium">{user.username}</div>
                            {user.displayName && (
                              <div className="text-xs text-muted-foreground">
                                {user.displayName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {user.tier === "premium" ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums">
                        {user.sessionCount}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums">
                        {user.partnerCount}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleTier(user.id, user.tier)}
                            className={cn(
                              "text-xs px-2 py-1 rounded-lg transition-colors",
                              user.tier === "premium"
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                            title={user.tier === "premium" ? "Downgrade to Free" : "Upgrade to Premium"}
                          >
                            {user.tier === "premium" ? "Downgrade" : "Upgrade"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAdmin(user.id, user.isAdmin)}
                            className={cn(
                              "text-xs px-2 py-1 rounded-lg transition-colors",
                              user.isAdmin
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                            title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                          >
                            {user.isAdmin ? "Admin ✓" : "Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
