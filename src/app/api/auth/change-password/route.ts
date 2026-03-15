import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { changePasswordSchema } from "@/lib/validations";
import { getAuthFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "未登录" },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "用户不存在" },
        },
        { status: 404 }
      );
    }

    const user = rows[0];
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "当前密码错误" },
        },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, auth.sub));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "修改密码失败" },
      },
      { status: 500 }
    );
  }
}
