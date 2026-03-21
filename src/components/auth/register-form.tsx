"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
import { CaptchaInput } from "./captcha-input";
import { useI18n } from "@/i18n/context";
import { setClientAuthCookie } from "@/lib/client-auth";

export function RegisterForm() {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referredBy, setReferredBy] = useState("");

  // Pre-fill referral code from URL ?ref= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferredBy(ref.toUpperCase().slice(0, 8));
  }, []);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const captchaRefreshRef = useRef<(() => void) | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError(isZh ? "验证码加载中，请稍候" : "Captcha loading, please wait");
      return;
    }
    if (!captchaAnswer.trim()) {
      setError(isZh ? "请输入验证码" : "Please enter the captcha");
      return;
    }
    if (password.length < 8) {
      setError(isZh ? "密码至少8个字符" : "Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError(isZh ? "密码需包含大小写字母和数字" : "Password must include uppercase, lowercase, and a digit");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username, password, captchaToken, captchaAnswer,
          ...(referredBy.trim() ? { referredBy: referredBy.trim().toUpperCase() } : {}),
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Set cookie client-side for WeChat WKWebView compatibility
        if (json.data?.token) {
          setClientAuthCookie(json.data.token);
        }
        window.location.href = "/dashboard?welcome=1";
        return; // Keep loading=true — button stays disabled during navigation
      } else {
        setError(json.error?.message || (isZh ? "注册失败" : "Registration failed"));
        setCaptchaAnswer("");
        captchaRefreshRef.current?.();
      }
    } catch {
      setError(isZh ? "网络错误" : "Network error");
      captchaRefreshRef.current?.();
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isZh ? "注册" : "Sign Up"}
        </CardTitle>
        <CardDescription>
          {isZh ? "创建你的 GameTan 账号" : "Create your GameTan account"}
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
            <Label htmlFor="username">
              {isZh ? "用户名" : "Username"}
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isZh ? "3-20位字母、数字或下划线" : "3-20 chars: letters, numbers, underscore"}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {isZh ? "密码" : "Password"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isZh ? "至少8位含大小写和数字" : "8+ chars, upper/lower/digit"}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral">
              {isZh ? "邀请码 (选填)" : "Referral Code (optional)"}
            </Label>
            <Input
              id="referral"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
              placeholder={isZh ? "好友的邀请码" : "Friend's referral code"}
              maxLength={8}
              className="font-mono tracking-wider uppercase"
            />
          </div>
          <CaptchaInput
            token={captchaToken}
            setToken={setCaptchaToken}
            value={captchaAnswer}
            onChange={setCaptchaAnswer}
            onRefreshReady={(fn) => {
              captchaRefreshRef.current = fn;
            }}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? (isZh ? "注册中..." : "Signing up...")
              : (isZh ? "注册" : "Sign Up")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isZh ? "已有账号？" : "Already have an account?"}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {isZh ? "登录" : "Log in"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
