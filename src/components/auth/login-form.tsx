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
