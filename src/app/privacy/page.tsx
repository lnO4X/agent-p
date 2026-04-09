import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | GameTan",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 prose prose-invert prose-sm">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: April 9, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        When you use GameTan (&quot;gametan.ai&quot;), we collect:
      </p>
      <ul>
        <li><strong>Account data</strong>: email address, username, and hashed password when you register.</li>
        <li><strong>Test data</strong>: game scores, reaction times, and talent assessment results generated during tests.</li>
        <li><strong>Usage data</strong>: pages visited, features used, device type, and browser language (via anonymous analytics).</li>
        <li><strong>Payment data</strong>: processed by Creem (our payment provider). We do not store credit card numbers.</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>Provide and improve the talent assessment service.</li>
        <li>Generate personalized talent reports and AI coaching responses.</li>
        <li>Process payments for Pro Assessment purchases.</li>
        <li>Send transactional emails (password reset, purchase confirmation).</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your personal data. We share data only with:
      </p>
      <ul>
        <li><strong>Creem</strong> — payment processing.</li>
        <li><strong>Vercel</strong> — hosting infrastructure.</li>
        <li><strong>Neon</strong> — database hosting.</li>
        <li><strong>OpenRouter</strong> — AI model provider for coaching (anonymized prompts only).</li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>
        Account and test data is retained while your account is active. You can request deletion by contacting us.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use a session cookie (JWT) for authentication. We do not use tracking cookies or third-party advertising cookies.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by emailing <strong>support@gametan.ai</strong>.
      </p>

      <h2>7. Children</h2>
      <p>
        GameTan is not directed at children under 13. We do not knowingly collect data from children under 13.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this policy. Changes will be posted on this page with an updated date.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy? Email <strong>support@gametan.ai</strong>.
      </p>
    </div>
  );
}
