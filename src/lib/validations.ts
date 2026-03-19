import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  password: z
    .string()
    .min(8, "密码至少8个字符 / Password must be at least 8 characters")
    .max(50, "密码最多50个字符")
    .regex(/[a-z]/, "密码需包含小写字母 / Must include a lowercase letter")
    .regex(/[A-Z]/, "密码需包含大写字母 / Must include an uppercase letter")
    .regex(/[0-9]/, "密码需包含数字 / Must include a digit"),
  captchaToken: z.string().min(1),
  captchaAnswer: z.string().min(1),
  referredBy: z.string().max(8).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
  captchaToken: z.string().min(1),
  captchaAnswer: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z
    .string()
    .min(8, "密码至少8个字符 / Password must be at least 8 characters")
    .max(50, "新密码最多50个字符")
    .regex(/[a-z]/, "密码需包含小写字母 / Must include a lowercase letter")
    .regex(/[A-Z]/, "密码需包含大写字母 / Must include an uppercase letter")
    .regex(/[0-9]/, "密码需包含数字 / Must include a digit"),
});

export const submitScoreSchema = z.object({
  sessionId: z.string().min(1),
  gameId: z.string().min(1),
  rawScore: z.number(),
  durationMs: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createSessionSchema = z.object({
  categories: z.array(z.string()).optional(),
});

// ==================== PARTNER SCHEMAS ====================

const PARTNER_ICONS = [
  "Bot",
  "Brain",
  "Lightbulb",
  "Shield",
  "Sword",
  "Heart",
  "Compass",
  "Flame",
  "Star",
  "Sparkles",
  "Gem",
  "Crown",
] as const;

export const createPartnerSchema = z.object({
  name: z
    .string()
    .min(1, "名称不能为空")
    .max(20, "名称最多20个字符"),
  avatar: z.enum(PARTNER_ICONS, "请选择有效的图标"),
  definition: z
    .string()
    .min(10, "人格定义至少10个字符")
    .max(2000, "人格定义最多2000个字符"),
  modelId: z.string().max(100).nullable().optional(),
});

export const updatePartnerSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  avatar: z.enum(PARTNER_ICONS, "请选择有效的图标").optional(),
  definition: z.string().min(10).max(2000).optional(),
  modelId: z.string().max(100).nullable().optional(),
});

export const chatMessageSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1),
  partnerId: z.string().min(1, "需要指定伙伴ID"),
});

export const memoryExtractionSchema = z.object({
  conversationText: z
    .string()
    .min(1, "对话文本不能为空")
    .max(20000, "对话文本过长"),
});

// ==================== EMAIL SCHEMA ====================

export const bindEmailSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址").max(100, "邮箱最多100个字符"),
});

export { PARTNER_ICONS };
