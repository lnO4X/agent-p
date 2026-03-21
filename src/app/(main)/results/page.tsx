"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";

interface Session {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function ResultsListPage() {
  const { locale } = useI18n();
  const isZh = locale === "zh";
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
      <div className="text-center py-20 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{isZh ? "测试记录" : "Test History"}</h1>
      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">{isZh ? "还没有测试记录" : "No test records yet"}</p>
          <Link
            href="/test"
            className="text-primary hover:underline"
          >
            {isZh ? "开始第一次测试" : "Start your first test"}
          </Link>
        </div>
      ) : (
        sessions.map((session) => (
          <Link key={session.id} href={`/results/${session.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium">
                    {new Date(session.startedAt).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isZh ? "完整天赋测试" : "Full Talent Test"}
                  </div>
                </div>
                <div className="text-sm text-primary">{isZh ? "查看详情" : "View Details"} &rarr;</div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
