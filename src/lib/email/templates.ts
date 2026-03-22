const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

/**
 * Community post liked email notification
 */
export function communityLikedHtml(opts: {
  authorUsername: string;
  senderUsername: string;
  postContent: string;
  postId: string;
}): string {
  const { authorUsername, senderUsername, postContent, postId } = opts;
  const postUrl = `${BASE_URL}/community`;
  const preview = postContent.length > 80 ? postContent.slice(0, 80) + "…" : postContent;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">
      ❤️ ${senderUsername} 点赞了你的帖子 / liked your post
    </h2>
    <div style="background: #f9fafb; border-left: 3px solid #007AFF; border-radius: 0 8px 8px 0; padding: 12px 14px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 13px; color: #555; font-style: italic;">"${preview}"</p>
    </div>
    <a href="${postUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      查看社区 / View Community
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai · ${authorUsername}</p>
  </div>
</body>
</html>`;
}

/**
 * Community post replied email notification
 */
export function communityRepliedHtml(opts: {
  authorUsername: string;
  senderUsername: string;
  replyContent: string;
  postContent: string;
  postId: string;
}): string {
  const { authorUsername, senderUsername, replyContent, postContent, postId } = opts;
  const postUrl = `${BASE_URL}/community`;
  const postPreview = postContent.length > 60 ? postContent.slice(0, 60) + "…" : postContent;
  const replyPreview = replyContent.length > 120 ? replyContent.slice(0, 120) + "…" : replyContent;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">
      💬 ${senderUsername} 回复了你的帖子 / replied to your post
    </h2>
    <div style="background: #f9fafb; border-left: 3px solid #8e8e93; border-radius: 0 8px 8px 0; padding: 10px 14px; margin-bottom: 10px;">
      <p style="margin: 0; font-size: 11px; color: #999; margin-bottom: 4px;">你的帖子 / Your post</p>
      <p style="margin: 0; font-size: 13px; color: #555; font-style: italic;">"${postPreview}"</p>
    </div>
    <div style="background: #f0f4ff; border-left: 3px solid #007AFF; border-radius: 0 8px 8px 0; padding: 10px 14px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 11px; color: #007AFF; margin-bottom: 4px;">${senderUsername} 的回复 / Reply</p>
      <p style="margin: 0; font-size: 13px; color: #333;">${replyPreview}</p>
    </div>
    <a href="${postUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      查看回复 / View Reply
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai · ${authorUsername}</p>
  </div>
</body>
</html>`;
}

/**
 * Weekly digest email for users who have email bound
 */
export function weeklyDigestHtml(opts: {
  username: string;
  challengeCount: number;
  streakDays: number;
  topTalent?: string;
  topScore?: number;
  isZh: boolean;
}): string {
  const { username, challengeCount, streakDays, topTalent, topScore, isZh } = opts;

  const greeting = isZh
    ? `${username}，这是你的 GameTan 周报`
    : `${username}, here's your GameTan weekly digest`;

  const challengeText = isZh
    ? `本周完成 <strong>${challengeCount}</strong> 次挑战`
    : `Completed <strong>${challengeCount}</strong> challenges this week`;

  const streakText = isZh
    ? `当前连续挑战 <strong>${streakDays}</strong> 天`
    : `Current streak: <strong>${streakDays}</strong> days`;

  const topText = topTalent && topScore
    ? isZh
      ? `最佳表现：${topTalent} — ${Math.round(topScore)} 分`
      : `Best performance: ${topTalent} — ${Math.round(topScore)} pts`
    : "";

  const ctaText = isZh ? "继续挑战" : "Keep Playing";
  const ctaUrl = `${BASE_URL}/challenge`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111;">
      ${greeting}
    </h2>
    <div style="background: #f0f4ff; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #333;">${challengeText}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #333;">${streakText}</p>
      ${topText ? `<p style="margin: 0; font-size: 14px; color: #333;">${topText}</p>` : ""}
    </div>
    <a href="${ctaUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      ${ctaText}
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">
      GameTan · gametan.ai
    </p>
  </div>
</body>
</html>`;
}

/**
 * Streak milestone notification
 */
export function streakMilestoneHtml(opts: {
  username: string;
  streakDays: number;
  isZh: boolean;
}): string {
  const { username, streakDays, isZh } = opts;

  const title = isZh
    ? `${username}，恭喜连续挑战 ${streakDays} 天！`
    : `${username}, congrats on a ${streakDays}-day streak!`;

  const body = isZh
    ? `你已经连续挑战 ${streakDays} 天了，太厉害了！继续保持，解锁更多成就。`
    : `You've been challenging yourself for ${streakDays} consecutive days. Keep it up!`;

  const ctaText = isZh ? "继续挑战" : "Continue";
  const ctaUrl = `${BASE_URL}/challenge`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">${title}</h2>
    <p style="font-size: 14px; color: #333; margin: 0 0 16px;">${body}</p>
    <a href="${ctaUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      ${ctaText}
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai</p>
  </div>
</body>
</html>`;
}

/**
 * Password reset email
 */
export function passwordResetHtml(opts: {
  username: string;
  resetUrl: string;
  isZh: boolean;
}): string {
  const { username, resetUrl, isZh } = opts;

  const title = isZh
    ? `${username}，重置密码`
    : `${username}, Reset Your Password`;

  const body = isZh
    ? "点击下方按钮重置你的密码。此链接将在 1 小时后过期。"
    : "Click the button below to reset your password. This link expires in 1 hour.";

  const ctaText = isZh ? "重置密码" : "Reset Password";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">${title}</h2>
    <p style="font-size: 14px; color: #333; margin: 0 0 16px;">${body}</p>
    <a href="${resetUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      ${ctaText}
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai</p>
  </div>
</body>
</html>`;
}

/**
 * Email verification email
 */
export function emailVerificationHtml(opts: {
  username: string;
  verifyUrl: string;
  isZh: boolean;
}): string {
  const { username, verifyUrl, isZh } = opts;

  const title = isZh
    ? `${username}，验证邮箱`
    : `${username}, Verify Your Email`;

  const body = isZh
    ? "点击下方按钮验证你的邮箱地址。"
    : "Click the button below to verify your email address.";

  const ctaText = isZh ? "验证邮箱" : "Verify Email";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">${title}</h2>
    <p style="font-size: 14px; color: #333; margin: 0 0 16px;">${body}</p>
    <a href="${verifyUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      ${ctaText}
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai</p>
  </div>
</body>
</html>`;
}
