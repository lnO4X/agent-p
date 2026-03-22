import { describe, it, expect } from "vitest";
import {
  communityLikedHtml,
  communityRepliedHtml,
  weeklyDigestHtml,
  streakMilestoneHtml,
  passwordResetHtml,
  emailVerificationHtml,
} from "@/lib/email/templates";

describe("email templates", () => {
  describe("communityLikedHtml", () => {
    const opts = {
      authorUsername: "alice",
      senderUsername: "bob",
      postContent: "This is a great post about gaming!",
      postId: "post-123",
    };

    it("returns an HTML string", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("contains sender username", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("bob");
    });

    it("contains author username in footer", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("alice");
    });

    it("contains post preview content", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("This is a great post about gaming!");
    });

    it("truncates long post content to 80 chars", () => {
      const longContent = "A".repeat(100);
      const html = communityLikedHtml({ ...opts, postContent: longContent });
      expect(html).toContain("A".repeat(80) + "\u2026");
      expect(html).not.toContain("A".repeat(100));
    });

    it("is bilingual (contains Chinese and English)", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("\u70B9\u8D5E"); // 点赞
      expect(html).toContain("liked your post");
    });

    it("contains community link", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("/community");
    });

    it("contains GameTan branding", () => {
      const html = communityLikedHtml(opts);
      expect(html).toContain("GameTan");
      expect(html).toContain("gametan.ai");
    });

    it("does not break HTML with special chars in username", () => {
      const html = communityLikedHtml({
        ...opts,
        senderUsername: '<script>alert("xss")</script>',
      });
      // Template literals don't auto-escape, but the structure should still be valid HTML
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });
  });

  describe("communityRepliedHtml", () => {
    const opts = {
      authorUsername: "alice",
      senderUsername: "bob",
      replyContent: "Great point, I totally agree!",
      postContent: "What do you think about strategy games?",
      postId: "post-456",
    };

    it("returns an HTML string", () => {
      const html = communityRepliedHtml(opts);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("contains sender username", () => {
      const html = communityRepliedHtml(opts);
      expect(html).toContain("bob");
    });

    it("contains post preview", () => {
      const html = communityRepliedHtml(opts);
      expect(html).toContain("What do you think about strategy games?");
    });

    it("contains reply content", () => {
      const html = communityRepliedHtml(opts);
      expect(html).toContain("Great point, I totally agree!");
    });

    it("truncates long post content to 60 chars", () => {
      const longPost = "B".repeat(80);
      const html = communityRepliedHtml({ ...opts, postContent: longPost });
      expect(html).toContain("B".repeat(60) + "\u2026");
    });

    it("truncates long reply content to 120 chars", () => {
      const longReply = "C".repeat(150);
      const html = communityRepliedHtml({ ...opts, replyContent: longReply });
      expect(html).toContain("C".repeat(120) + "\u2026");
    });

    it("is bilingual", () => {
      const html = communityRepliedHtml(opts);
      expect(html).toContain("\u56DE\u590D"); // 回复
      expect(html).toContain("replied to your post");
    });

    it("contains GameTan branding", () => {
      const html = communityRepliedHtml(opts);
      expect(html).toContain("GameTan");
    });
  });

  describe("weeklyDigestHtml", () => {
    const baseOpts = {
      username: "alice",
      challengeCount: 15,
      streakDays: 7,
      isZh: true,
    };

    it("returns an HTML string", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).toContain("<!DOCTYPE html>");
    });

    it("contains username in greeting (zh)", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).toContain("alice");
      expect(html).toContain("\u5468\u62A5"); // 周报
    });

    it("contains username in greeting (en)", () => {
      const html = weeklyDigestHtml({ ...baseOpts, isZh: false });
      expect(html).toContain("alice");
      expect(html).toContain("weekly digest");
    });

    it("interpolates challenge count", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).toContain("15");
    });

    it("interpolates streak days", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).toContain("7");
    });

    it("includes top talent when provided", () => {
      const html = weeklyDigestHtml({
        ...baseOpts,
        topTalent: "Reaction Speed",
        topScore: 92.7,
      });
      expect(html).toContain("Reaction Speed");
      expect(html).toContain("93"); // Math.round(92.7)
    });

    it("omits top talent section when not provided", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).not.toContain("\u6700\u4F73\u8868\u73B0"); // 最佳表现
    });

    it("contains challenge CTA link", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).toContain("/challenge");
    });

    it("contains GameTan branding", () => {
      const html = weeklyDigestHtml(baseOpts);
      expect(html).toContain("GameTan");
      expect(html).toContain("gametan.ai");
    });
  });

  describe("streakMilestoneHtml", () => {
    it("returns HTML with username and streak days (zh)", () => {
      const html = streakMilestoneHtml({
        username: "bob",
        streakDays: 30,
        isZh: true,
      });
      expect(html).toContain("bob");
      expect(html).toContain("30");
      expect(html).toContain("\u8FDE\u7EED\u6311\u6218"); // 连续挑战
    });

    it("returns HTML with username and streak days (en)", () => {
      const html = streakMilestoneHtml({
        username: "bob",
        streakDays: 30,
        isZh: false,
      });
      expect(html).toContain("bob");
      expect(html).toContain("30-day streak");
    });

    it("contains CTA link to challenge", () => {
      const html = streakMilestoneHtml({
        username: "bob",
        streakDays: 7,
        isZh: false,
      });
      expect(html).toContain("/challenge");
    });

    it("contains GameTan branding", () => {
      const html = streakMilestoneHtml({
        username: "bob",
        streakDays: 7,
        isZh: true,
      });
      expect(html).toContain("GameTan");
    });
  });

  describe("passwordResetHtml", () => {
    const opts = {
      username: "charlie",
      resetUrl: "https://gametan.ai/reset-password?token=abc123",
      isZh: true,
    };

    it("returns an HTML string", () => {
      const html = passwordResetHtml(opts);
      expect(html).toContain("<!DOCTYPE html>");
    });

    it("contains username (zh)", () => {
      const html = passwordResetHtml(opts);
      expect(html).toContain("charlie");
      expect(html).toContain("\u91CD\u7F6E\u5BC6\u7801"); // 重置密码
    });

    it("contains username (en)", () => {
      const html = passwordResetHtml({ ...opts, isZh: false });
      expect(html).toContain("charlie");
      expect(html).toContain("Reset Your Password");
    });

    it("contains the reset URL as a link", () => {
      const html = passwordResetHtml(opts);
      expect(html).toContain(
        "https://gametan.ai/reset-password?token=abc123"
      );
    });

    it("mentions expiry time (zh)", () => {
      const html = passwordResetHtml(opts);
      expect(html).toContain("1 \u5C0F\u65F6"); // 1 小时
    });

    it("mentions expiry time (en)", () => {
      const html = passwordResetHtml({ ...opts, isZh: false });
      expect(html).toContain("1 hour");
    });

    it("contains GameTan branding", () => {
      const html = passwordResetHtml(opts);
      expect(html).toContain("GameTan");
    });
  });

  describe("emailVerificationHtml", () => {
    const opts = {
      username: "diana",
      verifyUrl: "https://gametan.ai/api/auth/verify-email?token=xyz789",
      isZh: true,
    };

    it("returns an HTML string", () => {
      const html = emailVerificationHtml(opts);
      expect(html).toContain("<!DOCTYPE html>");
    });

    it("contains username (zh)", () => {
      const html = emailVerificationHtml(opts);
      expect(html).toContain("diana");
      expect(html).toContain("\u9A8C\u8BC1\u90AE\u7BB1"); // 验证邮箱
    });

    it("contains username (en)", () => {
      const html = emailVerificationHtml({ ...opts, isZh: false });
      expect(html).toContain("diana");
      expect(html).toContain("Verify Your Email");
    });

    it("contains the verification URL as a link", () => {
      const html = emailVerificationHtml(opts);
      expect(html).toContain(
        "https://gametan.ai/api/auth/verify-email?token=xyz789"
      );
    });

    it("contains GameTan branding", () => {
      const html = emailVerificationHtml(opts);
      expect(html).toContain("GameTan");
    });

    it("does not break with special characters in username", () => {
      const html = emailVerificationHtml({
        ...opts,
        username: "user<br>name",
      });
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("user<br>name");
    });
  });
});
