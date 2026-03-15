"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Session {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function ResultsListPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSessions(json.data.filter((s: Session) => s.status === "completed"));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">加载中...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">测试记录</h1>
      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">还没有测试记录</p>
          <Link
            href="/test"
            className="text-primary hover:underline"
          >
            开始第一次测试
          </Link>
        </div>
      ) : (
        sessions.map((session) => (
          <Link key={session.id} href={`/results/${session.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium">
                    {new Date(session.startedAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    完整天赋测试
                  </div>
                </div>
                <div className="text-sm text-primary">查看详情 &rarr;</div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
