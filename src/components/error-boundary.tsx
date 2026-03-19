"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackTitleEn?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto py-12">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <AlertTriangle size={40} className="text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">
                  {this.props.fallbackTitle || "出了点问题"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {this.props.fallbackTitleEn || "Something went wrong"}
                </p>
                {this.state.error && (
                  <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded">
                    {this.state.error.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw size={14} className="mr-1.5" />
                  重试 / Retry
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  刷新页面 / Reload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
