"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivationCode {
  id: string;
  code: string;
  tier: string;
  durationDays: number;
  usedBy: string | null;
  usedByUsername: string | null;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "unused">("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(1);
  const [genDays, setGenDays] = useState(30);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const limit = 20;

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/codes?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setCodes(data.data.codes);
        setTotal(data.data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: genCount, durationDays: genDays }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCodes(data.data.codes);
        fetchCodes();
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // fallback
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Activation Codes ({total})</h1>

      {/* Generate section */}
      <div className="rounded-2xl border border-foreground/10 bg-muted/20 p-4 mb-4">
        <h2 className="text-sm font-medium mb-3">Generate Codes</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Count</label>
            <input
              type="number"
              min={1}
              max={50}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="w-20 px-3 py-1.5 text-sm rounded-xl bg-background border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Days</label>
            <input
              type="number"
              min={1}
              max={365}
              value={genDays}
              onChange={(e) => setGenDays(Number(e.target.value))}
              className="w-20 px-3 py-1.5 text-sm rounded-xl bg-background border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Generated codes display */}
        {generatedCodes.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-green-600 mb-2 font-medium">
              Generated {generatedCodes.length} code(s):
            </p>
            <div className="flex flex-wrap gap-2">
              {generatedCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => copyCode(code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono bg-background rounded-lg border border-foreground/10 hover:bg-muted transition-colors"
                >
                  {code}
                  {copiedCode === code ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3">
        {(["all", "unused", "used"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg transition-colors",
              statusFilter === s
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Codes table */}
      <div className="rounded-2xl border border-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Code</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Days</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Used By</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-foreground/5">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-2/3" />
                      </td>
                    </tr>
                  ))
                : codes.map((code) => (
                    <tr
                      key={code.id}
                      className="border-b border-foreground/5 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs">{code.code}</td>
                      <td className="px-4 py-2.5 text-center tabular-nums">
                        {code.durationDays}
                      </td>
                      <td className="px-4 py-2.5">
                        {code.usedBy ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Used
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {code.usedByUsername || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!code.usedBy && (
                          <button
                            type="button"
                            onClick={() => copyCode(code.code)}
                            className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-3.5 h-3.5 text-green-500 inline" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 inline" />
                            )}
                          </button>
                        )}
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
