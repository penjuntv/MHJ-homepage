import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — MY MAIRANGI',
  description: 'How MY MAIRANGI collects, uses, and protects your personal information under the NZ Privacy Act 2020.',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 48,
};

const h2Style: React.CSSProperties = {
  fontSize: 'clamp(20px, 2vw, 24px)',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 16,
  lineHeight: 1.3,
};

const pStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: 'var(--text-secondary)',
  fontWeight: 500,
  marginBottom: 16,
};

const ulStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: 'var(--text-secondary)',
  fontWeight: 500,
  paddingLeft: 24,
  marginBottom: 16,
  listStyleType: 'disc',
};

const liStyle: React.CSSProperties = {
  marginBottom: 8,
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 32px)',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          display: 'block',
          marginBottom: 16,
        }}
      >
        Last updated: March 2026
      </span>

      {/* Title */}
      <h1
        className="font-display"
        style={{
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: 900,
          letterSpacing: -2,
          lineHeight: 0.9,
          color: 'var(--text)',
          marginBottom: 48,
        }}
      >
        Privacy Policy
      </h1>

      {/* 1 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>1. Who We Are</h2>
        <p style={pStyle}>
          MY MAIRANGI (mhj.nz) is a family lifestyle editorial magazine based in
          Mairangi Bay, Auckland, New Zealand. This policy explains how we collect,
          use, and protect your personal information in accordance with the
          New Zealand Privacy Act 2020.
        </p>
      </section>

      {/* 2 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>2. What Information We Collect</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Newsletter subscription:</strong> name (optional) and email address
          </li>
          <li style={liStyle}>
            <strong>Blog comments:</strong> display name, email address (never publicly
            displayed), and comment content
          </li>
          <li style={liStyle}>
            <strong>Article reactions:</strong> a hashed version of your IP address
            (not your actual IP) to prevent duplicate votes
          </li>
          <li style={liStyle}>
            <strong>Analytics:</strong> anonymised browsing data through Google Analytics (GA4)
          </li>
          <li style={liStyle}>
            <strong>Preferences:</strong> theme setting (light/dark mode) stored locally
            in your browser
          </li>
        </ul>
      </section>

      {/* 3 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>3. How We Use Your Information</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Email addresses:</strong> solely to send our weekly newsletter
            &ldquo;Mairangi Notes&rdquo; and related communications. You can unsubscribe
            at any time.
          </li>
          <li style={liStyle}>
            <strong>Comment details:</strong> to display your comment (after approval)
            with your chosen display name. Your email is never shown publicly and is
            only used if we need to contact you about your comment.
          </li>
          <li style={liStyle}>
            <strong>Analytics data:</strong> to understand how visitors use our site and
            improve content. This data is anonymised and cannot identify you personally.
          </li>
        </ul>
      </section>

      {/* 4 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>4. Third-Party Services</h2>
        <p style={pStyle}>
          We use the following services to operate this website:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Supabase</strong> (Sydney, Australia): database and file storage
          </li>
          <li style={liStyle}>
            <strong>Resend:</strong> email delivery for newsletters
          </li>
          <li style={liStyle}>
            <strong>Vercel:</strong> website hosting
          </li>
          <li style={liStyle}>
            <strong>Google Analytics (GA4):</strong> anonymised traffic analysis
          </li>
        </ul>
        <p style={pStyle}>
          We do not sell, trade, or share your personal information with any other
          third parties.
        </p>
      </section>

      {/* 5 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>5. Cookies and Analytics</h2>
        <p style={pStyle}>This site uses:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            A localStorage item to remember your theme preference (light/dark mode).
            This is not a cookie and contains no personal information.
          </li>
          <li style={liStyle}>
            Google Analytics (GA4) cookies to collect anonymised usage data such as
            pages visited, time on site, and general location (country level).
          </li>
        </ul>
        <p style={pStyle}>
          No advertising cookies or tracking pixels are used on this site.
        </p>
      </section>

      {/* 6 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>6. Your Rights Under the NZ Privacy Act 2020</h2>
        <p style={pStyle}>Under the Privacy Act 2020, you have the right to:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>Request access to the personal information we hold about you</li>
          <li style={liStyle}>Request correction of any inaccurate information</li>
          <li style={liStyle}>Request deletion of your personal information</li>
          <li style={liStyle}>
            Unsubscribe from our newsletter at any time via the link in every email
            or at mhj.nz/unsubscribe
          </li>
        </ul>
        <p style={pStyle}>
          To exercise any of these rights, contact us at{' '}
          <a
            href="mailto:hello@mhj.nz"
            style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'underline' }}
          >
            hello@mhj.nz
          </a>
          . We will respond within 20 working days as required by law.
        </p>
      </section>

      {/* 7 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>7. Data Storage and Security</h2>
        <p style={pStyle}>
          Your data is stored on servers in Sydney, Australia (Supabase) and protected
          by industry-standard encryption. Access to personal data is restricted to
          site administrators only. We do not store payment information as we do not
          process payments on this site.
        </p>
      </section>

      {/* 8 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>8. Children&apos;s Privacy</h2>
        <p style={pStyle}>
          While our content discusses family life including our children, we do not
          knowingly collect personal information from children under 16. The newsletter
          subscription and comment features are intended for adults.
        </p>
      </section>

      {/* 9 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>9. Changes to This Policy</h2>
        <p style={pStyle}>
          We may update this policy from time to time. The &ldquo;Last updated&rdquo;
          date at the top will reflect the most recent revision. Continued use of
          the site after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      {/* 10 */}
      <section style={{ marginBottom: 0 }}>
        <h2 style={h2Style}>10. Contact Us</h2>
        <p style={pStyle}>
          If you have questions about this privacy policy or your personal information:
        </p>
        <p style={{ ...pStyle, marginBottom: 8 }}>
          Email:{' '}
          <a
            href="mailto:hello@mhj.nz"
            style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'underline' }}
          >
            hello@mhj.nz
          </a>
        </p>
        <p style={{ ...pStyle, marginBottom: 8 }}>
          Location: Mairangi Bay, Auckland, New Zealand
        </p>
        <p style={pStyle}>
          Privacy Commissioner:{' '}
          <a
            href="https://www.privacy.org.nz"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'underline' }}
          >
            www.privacy.org.nz
          </a>
        </p>
      </section>
    </main>
  );
}
