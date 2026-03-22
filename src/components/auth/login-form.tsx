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

const REMEMBER_KEY = "gametan_remember_username";

export function LoginForm() {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const captchaRefreshRef = useRef<(() => void) | null>(null);

  // Restore remembered username on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setUsername(saved);
        setRememberMe(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.)
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Prevent submit if captcha not ready
    if (!captchaToken) {
      setError(isZh ? "验证码加载中，请稍候" : "Captcha loading, please wait");
      return;
    }
    if (!captchaAnswer.trim()) {
      setError(isZh ? "请输入验证码" : "Please enter the captcha");
      return;
    }
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, captchaToken, captchaAnswer }),
      });
      const json = await res.json();
      if (json.success) {
        // Remember username preference
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, username);
          } else {
            localStorage.removeItem(REMEMBER_KEY);
          }
        } catch {
          // ignore localStorage errors
        }

        // CRITICAL: Set cookie via document.cookie for WeChat WKWebView compatibility.
        // WKWebView doesn't reliably sync Set-Cookie headers from fetch() responses
        // to its navigation cookie store. Setting via document.cookie ensures the cookie
        // is immediately available for the next navigation.
        if (json.data?.token) {
          setClientAuthCookie(json.data.token);
        }

        window.location.href = "/dashboard";
        return; // Keep loading=true — button stays disabled during navigation
      } else {
        setError(json.error?.message || (isZh ? "登录失败" : "Login failed"));
        setCaptchaAnswer("");
        captchaRefreshRef.current?.();
      }
    } catch {
      setError(isZh ? "网络错误，请重试" : "Network error, please retry");
      captchaRefreshRef.current?.();
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isZh ? "登录" : "Sign In"}
        </CardTitle>
        <CardDescription>
          {isZh ? "登录你的 GameTan 账号" : "Sign in to your GameTan account"}
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
              placeholder={isZh ? "请输入用户名" : "Enter username"}
              autoComplete="username"
              required
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
              placeholder={isZh ? "请输入密码" : "Enter password"}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
              {isZh ? "忘记密码？" : "Forgot password?"}
            </Link>
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
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              {isZh ? "记住用户名" : "Remember username"}
            </span>
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isZh
                ? "登录中..."
                : "Signing in..."
              : isZh
                ? "登录"
                : "Sign In"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {isZh ? "或" : "or"}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => { window.location.href = "/api/auth/google"; }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isZh ? "使用 Google 登录" : "Sign in with Google"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isZh ? "还没有账号？" : "No account yet?"}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {isZh ? "注册" : "Sign Up"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
