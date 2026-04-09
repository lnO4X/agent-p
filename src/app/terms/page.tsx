import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | GameTan",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 prose prose-invert prose-sm">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: April 9, 2026</p>

      <h2>1. Acceptance</h2>
      <p>
        By using GameTan (&quot;gametan.ai&quot;), you agree to these terms. If you do not agree, do not use the service.
      </p>

      <h2>2. Service Description</h2>
      <p>
        GameTan provides esports talent assessment through cognitive mini-games, AI coaching, and talent reports. Results are for entertainment and self-improvement purposes and do not constitute professional psychological assessment.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide accurate registration information.</li>
        <li>You are responsible for maintaining the security of your account.</li>
        <li>One account per person.</li>
      </ul>

      <h2>4. Pro Assessment</h2>
      <ul>
        <li>Pro Assessment is a one-time purchase ($3.99) granting 365 days of access.</li>
        <li>Payments are processed by Creem. All sales are final.</li>
        <li>Refund requests may be considered within 7 days of purchase if no Pro test has been completed.</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use automated tools to access or scrape the service.</li>
        <li>Attempt to manipulate test results or leaderboards.</li>
        <li>Share account credentials with others.</li>
        <li>Use the service for any unlawful purpose.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        All content, games, scoring algorithms, and AI coaching systems are owned by GameTan. You may share your personal test results.
      </p>

      <h2>7. Disclaimer</h2>
      <p>
        GameTan is provided &quot;as is&quot; without warranties. Talent assessments are based on cognitive science research but are not clinical diagnoses. Results should not be used for employment or admissions decisions.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        GameTan is not liable for any indirect, incidental, or consequential damages arising from use of the service. Total liability is limited to the amount you paid for the Pro Assessment.
      </p>

      <h2>9. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these terms. You may delete your account at any time.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these terms. Continued use after changes constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions? Email <strong>support@gametan.ai</strong>.
      </p>
    </div>
  );
}
