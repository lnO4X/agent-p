"use client";

import { useState } from "react";
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

export function ChangePasswordForm() {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(isZh ? "两次密码输入不一致" : "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError(isZh ? "新密码至少6个字符" : "New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(isZh ? "密码修改成功" : "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(json.error?.message || (isZh ? "修改失败" : "Change failed"));
      }
    } catch {
      setError(isZh ? "网络错误，请重试" : "Network error, please retry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isZh ? "修改密码" : "Change Password"}</CardTitle>
        <CardDescription>
          {isZh ? "请输入当前密码和新密码" : "Enter your current password and a new password"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-md bg-green-500/10 text-green-500 text-sm">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {isZh ? "当前密码" : "Current Password"}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {isZh ? "新密码" : "New Password"}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={isZh ? "至少6个字符" : "6+ characters"}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">
              {isZh ? "确认新密码" : "Confirm New Password"}
            </Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? (isZh ? "修改中..." : "Updating...")
              : (isZh ? "修改密码" : "Change Password")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
