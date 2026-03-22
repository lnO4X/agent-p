"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { KeyRound, CheckCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(isZh ? "重置链接无效" : "Invalid reset link");
    }
  }, [token, isZh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !token) return;

    setError("");

    // Client-side validation
    if (password.length < 6) {
      setError(isZh ? "密码至少6个字符" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError(isZh ? "两次输入的密码不一致" : "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setError(json.error?.message || (isZh ? "重置失败" : "Reset failed"));
      }
    } catch {
      setError(isZh ? "网络错误，请重试" : "Network error, please retry");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {isZh ? "密码已重置" : "Password Reset"}
            </CardTitle>
            <CardDescription>
              {isZh
                ? "你的密码已成功重置，请使用新密码登录。"
                : "Your password has been successfully reset. Please sign in with your new password."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button>
                {isZh ? "前往登录" : "Go to Login"}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <KeyRound className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            {isZh ? "重置密码" : "Reset Password"}
          </CardTitle>
          <CardDescription>
            {isZh ? "输入你的新密码" : "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">
                {isZh ? "新密码" : "New Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isZh ? "至少6个字符" : "6+ characters"}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {isZh ? "确认新密码" : "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isZh ? "再次输入新密码" : "Re-enter new password"}
                autoComplete="new-password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading
                ? (isZh ? "重置中..." : "Resetting...")
                : (isZh ? "重置密码" : "Reset Password")}
            </Button>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="inline mr-1 h-3 w-3" />
              {isZh ? "返回登录" : "Back to Login"}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
