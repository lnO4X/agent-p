"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiAnalysisProps {
  sessionId: string;
}

export function AiAnalysis({ sessionId }: AiAnalysisProps) {
  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/ai/analyze",
  });

  useEffect(() => {
    complete("", { body: { sessionId } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI 天赋分析</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-muted-foreground text-sm">
            AI 分析暂不可用（未配置 API Key 或服务异常）
          </p>
        )}
        {isLoading && !completion && (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        )}
        {completion && (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {completion}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
