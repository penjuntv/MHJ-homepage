const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(subject: string, preheader: string, body: string, email: string): string {
  const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(subject)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Noto+Sans+KR:wght@400;700&display=swap');
  @media (prefers-color-scheme: dark) {
    .email-body { background-color: #1a1a1a !important; }
    .email-card { background-color: #262626 !important; }
    .text-primary { color: #f5f5f5 !important; }
    .text-secondary { color: #a3a3a3 !important; }
    .text-tertiary { color: #737373 !important; }
    .border-light { border-color: #404040 !important; }
    .bg-footer { background-color: #1f1f1f !important; }
  }
</style>
</head>
<body class="email-body" style="margin:0;padding:0;background:#f5f5f4;font-family:'Noto Sans KR',Arial,sans-serif;">
<!--[if mso]><span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span><![endif]-->
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" class="email-card" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;border-radius:8px;overflow:hidden;">
  <!-- Header -->
  <tr>
    <td class="border-light" style="padding:32px 40px 24px;border-bottom:1px solid #f1f5f9;">
      <a href="${siteUrl}" style="text-decoration:none;color:#1a1a1a;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;" class="text-primary">MY MAIRANGI</a>
      <p class="text-tertiary" style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#cbd5e1;">Mairangi Bay &middot; Auckland, New Zealand</p>
    </td>
  </tr>
  <!-- Body -->
  ${body}
  <!-- Footer -->
  <tr>
    <td class="bg-footer border-light" style="padding:28px 40px 36px;background:#f8fafc;border-top:1px solid #f1f5f9;">
      <p style="margin:0 0 12px;text-align:center;">
        <a href="https://www.instagram.com/mhj_nz" style="text-decoration:none;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Instagram @mhj_nz</a>
      </p>
      <p class="text-tertiary" style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
        You received this because you subscribed to MY MAIRANGI newsletter.
      </p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#cbd5e1;text-align:center;">
        <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
        &middot;
        <a href="${siteUrl}" style="color:#94a3b8;text-decoration:underline;">Visit Website</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ── 1통: Welcome to MHJ ── */
export interface PopularPost { title: string; slug: string }

export function generateWelcome1(
  name: string | null,
  email: string,
  popularPosts: PopularPost[],
): { subject: string; html: string } {
  const greeting = name ? `Hi ${escapeHtml(name)}!` : 'Hi there!';
  const postLinks = popularPosts
    .map(
      (p) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <a href="${siteUrl}/blog/${p.slug}" style="text-decoration:none;color:#1a1a1a;font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:700;line-height:1.4;" class="text-primary">${escapeHtml(p.title)}</a>
        </td></tr>`,
    )
    .join('');

  const body = `
  <tr>
    <td style="padding:40px 40px 36px;">
      <h1 class="text-primary" style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#1a1a1a;line-height:1.2;">Welcome to My Mairangi Journal</h1>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        ${greeting} I'm Yussi, a mum of three living in Mairangi Bay, Auckland. I started this journal to share the little moments that make up our life here in Aotearoa &mdash; from school lunches to weekend adventures, from settling-in stories to the English expressions my youngest picks up each day.
      </p>
      <p class="text-secondary" style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#525252;">
        Thank you for joining our community. Here are a few stories our readers have loved:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${postLinks}
      </table>
      <p style="margin:28px 0 0;text-align:center;">
        <a href="${siteUrl}/blog" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">Read our latest stories</a>
      </p>
    </td>
  </tr>`;

  return {
    subject: 'Welcome to My Mairangi Journal',
    html: wrap('Welcome to My Mairangi Journal', 'Welcome! Here are some stories our readers love.', body, email),
  };
}

/* ── 2통: Meet Yussi ── */
export function generateWelcome2(
  name: string | null,
  email: string,
): { subject: string; html: string } {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';

  const body = `
  <tr>
    <td style="padding:40px 40px 36px;">
      <h1 class="text-primary" style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#1a1a1a;line-height:1.2;">A little about me</h1>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        ${greeting}
      </p>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        A few days ago you joined My Mairangi Journal &mdash; and I wanted to properly introduce myself.
      </p>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        I'm Yussi (Heejong), currently studying a Master of Social Welfare here in Auckland while raising three daughters &mdash; Min, Hyun, and Jin. My husband PeNnY runs the tech side of MHJ (he's the one who built this very website).
      </p>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        We moved to New Zealand a few years ago, and this journal is our way of documenting the journey: the challenges of settling in, the beauty of Mairangi Bay, the chaos of three kids, and the small victories that make it all worthwhile.
      </p>
      <p class="text-secondary" style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#525252;">
        Every week, I put together <strong>Mairangi Notes</strong> &mdash; a newsletter that covers what happened in our world that week. Think of it as a letter from a friend in Mairangi Bay. This week's edition is coming soon!
      </p>
      <p style="margin:0;text-align:center;">
        <a href="${siteUrl}/blog" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">Check out our blog</a>
      </p>
    </td>
  </tr>`;

  return {
    subject: 'A little about me — and what\'s coming this week',
    html: wrap('A little about me', 'Meet Yussi — the person behind My Mairangi Journal.', body, email),
  };
}

/* ── 3통: Every Friday in Your Inbox ── */
export function generateWelcome3(
  name: string | null,
  email: string,
): { subject: string; html: string } {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';

  const sections = [
    { label: "Yussi's Note", desc: 'A personal hello to start the week' },
    { label: 'Main Story', desc: 'The best blog post of the week' },
    { label: 'Lunch Box', desc: "What's in the kids' lunch today" },
    { label: 'Campus Notes', desc: "Updates from Yussi's postgrad life" },
    { label: 'English with Jin', desc: 'A new expression Jin learned this week' },
    { label: 'Local Guide', desc: 'Weekend spots around Auckland' },
    { label: 'From the Archive', desc: 'A favourite post from the past' },
  ];

  const sectionRows = sections
    .map(
      (s) =>
        `<tr>
          <td style="padding:8px 0;font-size:14px;line-height:1.6;">
            <strong class="text-primary" style="color:#1a1a1a;">${s.label}</strong>
            <span class="text-secondary" style="color:#525252;"> &mdash; ${s.desc}</span>
          </td>
        </tr>`,
    )
    .join('');

  const body = `
  <tr>
    <td style="padding:40px 40px 36px;">
      <h1 class="text-primary" style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#1a1a1a;line-height:1.2;">Every Friday, Mairangi Notes lands in your inbox</h1>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        ${greeting}
      </p>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        It's been a week since you joined, and I wanted to show you what <strong>Mairangi Notes</strong> looks like. Every Friday, you'll get a newsletter with seven sections:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        ${sectionRows}
      </table>
      <p class="text-primary" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        We also built something called <strong>StoryPress</strong> &mdash; a simple English learning app where Jin records the expressions she picks up at school. It's still early days, but it's become one of the most-loved parts of what we do.
      </p>
      <p class="text-secondary" style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#525252;">
        That's it from me. Your next Mairangi Notes arrives this Friday. Grab a coffee and enjoy.
      </p>
      <p style="margin:0;text-align:center;">
        <a href="${siteUrl}" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">Visit MHJ</a>
      </p>
    </td>
  </tr>`;

  return {
    subject: 'Every Friday, Mairangi Notes lands in your inbox',
    html: wrap('Every Friday, Mairangi Notes', 'Here\'s what to expect from our weekly newsletter.', body, email),
  };
}
