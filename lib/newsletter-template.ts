export interface BlogPostInfo {
  title: string;
  image_url: string;
  slug: string;
  category: string;
  date: string;
  author: string;
  meta_description?: string;
}

export function generateNewsletterHTML(
  subject: string,
  content: string,
  blogPost?: BlogPostInfo,
): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

  /* ── 공통 파트 ── */
  const header = `
    <tr>
      <td style="padding:32px 40px 24px 40px; border-bottom:1px solid #F1F5F9;">
        <a href="${siteUrl}"
           style="text-decoration:none; color:#8A6B4F; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:400; letter-spacing:0.05em;">
          MHJ
        </a>
        <p style="margin:4px 0 0; font-family:Arial,sans-serif; font-size:10px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#CBD5E1;">
          Mairangi Bay &nbsp;&middot;&nbsp; Auckland, New Zealand
        </p>
      </td>
    </tr>`;

  const footer = `
    <tr>
      <td style="padding:28px 40px 36px 40px; background:#F8FAFC; border-top:1px solid #F1F5F9;">
        <p style="margin:0 0 10px; font-family:Arial,sans-serif; font-size:12px; color:#94A3B8; text-align:center; line-height:1.6;">
          You received this because you subscribed to MHJ newsletter.
        </p>
        <p style="margin:0; font-family:Arial,sans-serif; font-size:11px; color:#CBD5E1; text-align:center;">
          <a href="${siteUrl}/unsubscribe" style="color:#94A3B8; text-decoration:underline;">Unsubscribe</a>
          &nbsp;&middot;&nbsp;
          <a href="${siteUrl}" style="color:#94A3B8; text-decoration:underline;">Visit Website</a>
        </p>
      </td>
    </tr>`;

  /* ── 블로그 글 연동 카드 스타일 ── */
  let bodyRows: string;

  if (blogPost) {
    const readMoreUrl = `${siteUrl}/blog/${blogPost.slug}`;

    // 이미지가 없을 때 대비
    const imageSection = blogPost.image_url
      ? `<tr>
           <td style="padding:0; line-height:0;">
             <a href="${readMoreUrl}" style="display:block; line-height:0;">
               <img src="${blogPost.image_url}"
                    alt="${escapeHtml(blogPost.title)}"
                    width="600"
                    style="width:100%; max-width:600px; height:320px; object-fit:cover; display:block; border:0;" />
             </a>
           </td>
         </tr>`
      : '';

    // 본문 첫 200자 요약 (HTML 태그 제거)
    const plain = content.replace(/<[^>]*>/g, '').trim();
    const excerpt = plain.slice(0, 200) + (plain.length > 200 ? '...' : '');

    bodyRows = `
      ${imageSection}
      <tr>
        <td style="padding:40px 40px 36px 40px;">
          <!-- 카테고리 · 날짜 -->
          <p style="margin:0 0 16px; font-family:Arial,sans-serif; font-size:10px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#CBD5E1;">
            ${escapeHtml(blogPost.category)} &nbsp;&middot;&nbsp; ${escapeHtml(blogPost.date)}
          </p>
          <!-- 제목 -->
          <h1 style="margin:0 0 20px; font-family:Georgia,'Times New Roman',serif; font-size:30px; font-weight:900; letter-spacing:-1px; line-height:1.15; color:#1a1a1a;">
            ${escapeHtml(blogPost.title)}
          </h1>
          <!-- 구분선 -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="40" style="margin:0 0 24px;">
            <tr><td style="background:#1a1a1a; height:3px; width:40px;"></td></tr>
          </table>
          <!-- 요약 -->
          <p style="margin:0 0 36px; font-family:Arial,sans-serif; font-size:16px; line-height:1.85; color:#374151;">
            ${escapeHtml(excerpt)}
          </p>
          <!-- Read More 버튼 (Outlook 호환 table 방식) -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background:#1a1a1a;">
                <a href="${readMoreUrl}"
                   style="display:inline-block; padding:18px 48px; font-family:Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none;">
                  Read More &rarr;
                </a>
              </td>
            </tr>
          </table>
          <!-- 저자 -->
          <p style="margin:28px 0 0; font-family:Arial,sans-serif; font-size:12px; color:#94A3B8; font-style:italic;">
            Written by ${escapeHtml(blogPost.author)}
          </p>
        </td>
      </tr>`;
  } else {
    /* ── 직접 작성 뉴스레터 ── */
    bodyRows = `
      <tr>
        <td style="padding:40px 40px 36px 40px;">
          <!-- 제목 -->
          <h1 style="margin:0 0 8px; font-family:Georgia,'Times New Roman',serif; font-size:30px; font-weight:900; letter-spacing:-1px; line-height:1.15; color:#1a1a1a;">
            ${escapeHtml(subject)}
          </h1>
          <!-- 구분선 -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="40" style="margin:0 0 28px;">
            <tr><td style="background:#1a1a1a; height:3px; width:40px;"></td></tr>
          </table>
          <!-- 본문 (TipTap HTML 그대로) -->
          <div style="font-family:Arial,sans-serif; font-size:16px; line-height:1.85; color:#374151;">
            ${sanitizeContent(content)}
          </div>
        </td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="ko" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* 모든 이메일 클라이언트에서 라이트 모드 강제 */
    :root { color-scheme: light only; }
    * { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    /* TipTap HTML 스타일 인라인 보정 */
    h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 800; color: #1a1a1a; margin: 28px 0 12px; }
    h3 { font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 20px 0 10px; }
    p  { margin: 12px 0; }
    blockquote { border-left: 3px solid #CBD5E1; padding-left: 20px; margin: 20px 0; color: #64748B; font-style: italic; }
    ul, ol { padding-left: 24px; margin: 12px 0; }
    li { margin: 6px 0; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    a { color: #4F46E5; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9; font-family:Arial,sans-serif;">
  <!--[if mso]>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td>
  <![endif]-->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
         style="background-color:#F1F5F9; padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- 카드 컨테이너 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
               style="max-width:600px; width:100%; background:#ffffff; border:1px solid #E2E8F0; border-collapse:collapse;">
          ${header}
          ${bodyRows}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]>
  </td></tr></table>
  <![endif]-->
</body>
</html>`;
}

/* ── 유틸 ── */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** TipTap HTML에서 script/iframe 제거 후 반환 */
function sanitizeContent(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

/** 평문 텍스트를 HTML로 안전하게 변환 (줄바꿈 → <br>) */
function formatText(str: string): string {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

/* ──────────────────────────────────────────────────────────────────
   Mairangi Notes — 구조화된 이메일 템플릿
   ────────────────────────────────────────────────────────────────── */

export interface MailrangiNotesData {
  issueNumber: number;
  issueDate: string;          // "2026.03.27"
  preheader: string;
  noteTitle: string;          // §1 Yussi's Note 제목
  noteBody: string;           // §1 본문
  blog?: {                    // §2 Main Story (blogs 테이블 조인)
    title: string;
    slug: string;
    category: string;
    date: string;
    image_url: string;
    excerpt: string;          // main_excerpt 또는 meta_description
  };
  lunch?: {                   // §3 Lunch Box
    image: string;
    title: string;
    body: string;
  };
  campus?: {                  // §4 Campus Notes
    title: string;
    body: string;
  };
  sponsor?: {                 // §4.5 Partner Spotlight
    label?: string;           // 기본값 "PARTNER SPOTLIGHT"
    name: string;
    url?: string;
    image?: string;
    body: string;
  };
  jin?: {                     // §5 English with Jin
    expression: string;
    body: string;
    storypressUrl: string;
  };
  locals?: Array<{            // §6 Local Guide (1~2개)
    emoji: string;
    label: string;
    title: string;
    body: string;
    link?: string;
  }>;
  archive?: {                 // §7 From the Archive
    title: string;
    slug: string;
    category: string;
    image_url: string;
    excerpt: string;
  };
  unsubscribeUrl: string;
}

export function renderMailrangiNotes(data: MailrangiNotesData): string {
  const siteUrl = 'https://www.mhj.nz';

  /* ── 섹션 헤더 배지 + 라벨 + 요일 태그 ── */
  function sectionHead(num: number, label: string, dayTag?: string): string {
    const dayCell = dayTag
      ? `<td style="padding-left:12px;vertical-align:middle;">
           <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#818cf8;border:1px solid #818cf8;padding:2px 8px;display:inline-block;">${dayTag}</span>
         </td>`
      : '';
    return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="background:#1a1a1a;width:28px;height:28px;text-align:center;vertical-align:middle;">
          <span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#ffffff;line-height:28px;display:block;">${num}</span>
        </td>
        <td style="padding-left:10px;vertical-align:middle;">
          <span style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1a1a1a;">${escapeHtml(label)}</span>
        </td>
        ${dayCell}
      </tr>
    </table>`;
  }

  /* ── 섹션 구분선 (<tr> 행 단위) ── */
  function sep(): string {
    return `<tr>
      <td style="padding:0 40px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td class="border-divider" style="background:#f1f5f9;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>`;
  }

  /* ── §1 Yussi's Note ── */
  const section1 = `
  <tr>
    <td class="section-pad" style="padding:32px 40px 28px;">
      ${sectionHead(1, "Yussi's Note")}
      <h2 class="headline" style="margin:20px 0 14px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.35;letter-spacing:-0.3px;">
        ${formatText(data.noteTitle)}
      </h2>
      <p style="margin:0;font-family:'Noto Sans KR',Arial,sans-serif;font-size:15px;line-height:1.9;color:#475569;">
        ${formatText(data.noteBody)}
      </p>
    </td>
  </tr>`;

  /* ── §2 Main Story ── */
  const section2 = data.blog
    ? `${sep()}
  <tr>
    <td class="section-pad" style="padding:32px 40px 28px;">
      ${sectionHead(2, 'Main Story')}
      ${data.blog.image_url
        ? `<div style="margin:20px -0px 0;line-height:0;">
             <img src="${escapeHtml(data.blog.image_url)}" alt="${escapeHtml(data.blog.title)}" width="520"
                  style="width:100%;max-width:520px;height:260px;object-fit:cover;display:block;border:0;" />
           </div>`
        : ''}
      <div style="margin:${data.blog.image_url ? '0' : '20px 0 0'};padding:20px 24px;background:#f8fafc;border-left:3px solid #818cf8;">
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#818cf8;">
          ${escapeHtml(data.blog.category)} &nbsp;&middot;&nbsp; ${escapeHtml(data.blog.date)}
        </p>
        <h3 class="headline" style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.35;">
          ${escapeHtml(data.blog.title)}
        </h3>
        <p style="margin:0 0 18px;font-family:'Noto Sans KR',Arial,sans-serif;font-size:14px;line-height:1.85;color:#475569;">
          ${formatText(data.blog.excerpt)}
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background:#1a1a1a;">
              <a href="${siteUrl}/blog/${escapeHtml(data.blog.slug)}"
                 style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                Read Story &rarr;
              </a>
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>`
    : '';

  /* ── §3 Lunch Box ── */
  const section3 = data.lunch
    ? `${sep()}
  <tr>
    <td class="section-pad lunch-bg" style="padding:32px 40px 28px;background:#fefce8;">
      ${sectionHead(3, 'Lunch Box', 'MON')}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
        <tr>
          ${data.lunch.image
            ? `<td class="lunch-img-cell" style="width:180px;vertical-align:top;">
                 <img src="${escapeHtml(data.lunch.image)}" alt="${escapeHtml(data.lunch.title)}" width="180"
                      style="width:180px;height:180px;object-fit:cover;display:block;border:0;" />
               </td>
               <td class="lunch-text-cell" style="padding-left:20px;vertical-align:top;">`
            : `<td style="vertical-align:top;">`}
            <h3 style="margin:0 0 10px;font-family:'Noto Sans KR',Arial,sans-serif;font-size:17px;font-weight:700;color:#1a1a1a;line-height:1.4;">
              ${escapeHtml(data.lunch.title)}
            </h3>
            <p style="margin:0;font-family:'Noto Sans KR',Arial,sans-serif;font-size:14px;line-height:1.85;color:#475569;">
              ${formatText(data.lunch.body)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
    : '';

  /* ── §4 Campus Notes ── */
  const section4 = data.campus
    ? `${sep()}
  <tr>
    <td class="section-pad" style="padding:32px 40px 28px;">
      ${sectionHead(4, 'Campus Notes', 'TUE')}
      <div style="margin-top:20px;padding:20px 24px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h3 style="margin:0 0 10px;font-family:'Noto Sans KR',Arial,sans-serif;font-size:17px;font-weight:700;color:#1a1a1a;line-height:1.4;">
          ${escapeHtml(data.campus.title)}
        </h3>
        <p style="margin:0;font-family:'Noto Sans KR',Arial,sans-serif;font-size:14px;line-height:1.85;color:#475569;">
          ${formatText(data.campus.body)}
        </p>
      </div>
    </td>
  </tr>`
    : '';

  /* ── §4.5 Partner Spotlight ── */
  const sectionSponsor = data.sponsor
    ? `${sep()}
  <tr>
    <td style="padding:32px 40px 28px;">
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:10px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#9ca3af;">
        ${escapeHtml(data.sponsor.label ?? 'PARTNER SPOTLIGHT')}
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#faf8f5;border-radius:12px;overflow:hidden;">
        ${data.sponsor.image
          ? `<tr>
               <td style="padding:0;line-height:0;">
                 <img src="${escapeHtml(data.sponsor.image)}" alt="${escapeHtml(data.sponsor.name)}" width="100%"
                      style="display:block;width:100%;max-height:200px;object-fit:cover;border-radius:12px 12px 0 0;border:0;" />
               </td>
             </tr>`
          : ''}
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#1a1a1a;">
              ${escapeHtml(data.sponsor.name)}
            </p>
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;font-weight:500;line-height:1.65;color:#4b5563;">
              ${formatText(data.sponsor.body)}
            </p>
            ${data.sponsor.url
              ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
                   <tr>
                     <td style="background:#1a1a1a;border-radius:6px;">
                       <a href="${escapeHtml(data.sponsor.url)}" target="_blank"
                          style="display:inline-block;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;padding:8px 20px;">
                         Learn more &rarr;
                       </a>
                     </td>
                   </tr>
                 </table>`
              : ''}
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:10px;font-weight:500;color:#d4d0c8;text-align:center;">
        This section is sponsored. MHJ only partners with brands we genuinely recommend.
      </p>
    </td>
  </tr>`
    : '';

  /* ── §5 English with Jin ── */
  const section5 = data.jin
    ? `${sep()}
  <tr>
    <td class="section-pad jin-bg" style="padding:32px 40px 28px;background:#eff6ff;">
      ${sectionHead(5, 'English with Jin')}
      <p style="margin:18px 0 6px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3b82f6;">
        This Week's Expression
      </p>
      <p style="margin:0 0 16px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;font-style:italic;color:#1e40af;line-height:1.4;">
        &#8220;${escapeHtml(data.jin.expression)}&#8221;
      </p>
      <p style="margin:0 0 20px;font-family:'Noto Sans KR',Arial,sans-serif;font-size:14px;line-height:1.85;color:#1e40af;">
        ${formatText(data.jin.body)}
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="background:#1d4ed8;">
            <a href="${escapeHtml(data.jin.storypressUrl)}"
               style="display:inline-block;padding:10px 24px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;">
              StoryPress &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
    : '';

  /* ── §6 Local Guide ── */
  const section6 =
    data.locals && data.locals.length > 0
      ? `${sep()}
  <tr>
    <td class="section-pad" style="padding:32px 40px 28px;">
      ${sectionHead(6, 'Local Guide')}
      ${data.locals
        .map(
          (item, idx) => `
      ${idx > 0 ? '<div style="margin:18px 0;border-top:1px solid #f1f5f9;"></div>' : ''}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:${idx === 0 ? '20px' : '0'};">
        <tr>
          <td style="width:44px;vertical-align:top;padding-top:2px;">
            <span style="font-size:28px;line-height:1;display:block;">${escapeHtml(item.emoji)}</span>
          </td>
          <td style="padding-left:12px;vertical-align:top;">
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#818cf8;">
              ${escapeHtml(item.label)}
            </p>
            <h4 style="margin:0 0 8px;font-family:'Noto Sans KR',Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;line-height:1.4;">
              ${escapeHtml(item.title)}
            </h4>
            <p style="margin:0${item.link ? ' 0 10px' : ''};font-family:'Noto Sans KR',Arial,sans-serif;font-size:14px;line-height:1.8;color:#475569;">
              ${formatText(item.body)}
            </p>
            ${item.link
              ? `<a href="${escapeHtml(item.link)}" style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:#818cf8;text-decoration:none;">More &rarr;</a>`
              : ''}
          </td>
        </tr>
      </table>`,
        )
        .join('')}
    </td>
  </tr>`
      : '';

  /* ── §7 From the Archive ── */
  const section7 = data.archive
    ? `${sep()}
  <tr>
    <td class="section-pad" style="padding:32px 40px 28px;">
      ${sectionHead(7, 'From the Archive')}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
        <tr>
          ${data.archive.image_url
            ? `<td class="archive-img-cell" style="width:120px;vertical-align:top;">
                 <img src="${escapeHtml(data.archive.image_url)}" alt="${escapeHtml(data.archive.title)}" width="120"
                      style="width:120px;height:120px;object-fit:cover;display:block;border:0;" />
               </td>
               <td class="archive-text-cell" style="padding-left:16px;vertical-align:top;">`
            : `<td style="vertical-align:top;">`}
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#818cf8;">
              ${escapeHtml(data.archive.category)}
            </p>
            <h3 style="margin:0 0 8px;font-family:'Noto Sans KR',Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;line-height:1.4;">
              <a href="${siteUrl}/blog/${escapeHtml(data.archive.slug)}" style="color:#1a1a1a;text-decoration:none;">
                ${escapeHtml(data.archive.title)}
              </a>
            </h3>
            <p style="margin:0;font-family:'Noto Sans KR',Arial,sans-serif;font-size:13px;line-height:1.75;color:#475569;">
              ${formatText(data.archive.excerpt)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
    : '';

  /* ── Footer ── */
  const footer = `
  <tr>
    <td class="footer-bg footer-pad" style="background:#1a1a1a;padding:36px 40px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <a href="https://www.instagram.com/mhj_nz"
               style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;text-decoration:none;margin:0 10px;">
              Instagram
            </a>
            <span style="color:#475569;font-size:10px;">&middot;</span>
            <a href="https://www.facebook.com"
               style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;text-decoration:none;margin:0 10px;">
              Facebook
            </a>
            <span style="color:#475569;font-size:10px;">&middot;</span>
            <a href="https://www.youtube.com"
               style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;text-decoration:none;margin:0 10px;">
              YouTube
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
        <a href="${siteUrl}" style="color:#94a3b8;text-decoration:none;font-weight:700;">www.mhj.nz</a>
        &nbsp;&middot;&nbsp; Mairangi Bay, Auckland, New Zealand
      </p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#475569;text-align:center;line-height:1.6;">
        You received this because you subscribed to Mairangi Notes.
        &nbsp;
        <a href="${escapeHtml(data.unsubscribeUrl)}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
      </p>
    </td>
  </tr>`;

  /* ── 전체 HTML 조립 ── */
  return `<!DOCTYPE html>
<html lang="ko" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Mairangi Notes #${data.issueNumber} — ${escapeHtml(data.issueDate)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet" type="text/css" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    * { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; }

    /* 다크 모드 */
    @media (prefers-color-scheme: dark) {
      .email-bg    { background-color: #0f172a !important; }
      .email-card  { background-color: #1e293b !important; border-color: #334155 !important; }
      .text-primary   { color: #f1f5f9 !important; }
      .text-secondary { color: #94a3b8 !important; }
      .border-divider { background-color: #334155 !important; }
      .lunch-bg    { background-color: #2d2a0a !important; }
      .jin-bg      { background-color: #0f1e3d !important; }
      .footer-bg   { background-color: #000000 !important; }
    }

    /* 모바일 반응형 */
    @media only screen and (max-width: 600px) {
      .email-card   { width: 100% !important; }
      .section-pad  { padding: 24px 20px !important; }
      .header-pad   { padding: 24px 20px 20px !important; }
      .footer-pad   { padding: 28px 20px !important; }
      .headline     { font-size: 19px !important; }
      .lunch-img-cell  { display: block !important; width: 100% !important; }
      .lunch-img-cell img  { width: 100% !important; height: 220px !important; object-fit: cover !important; }
      .lunch-text-cell { display: block !important; width: 100% !important; padding-left: 0 !important; padding-top: 16px !important; }
      .archive-img-cell    { display: block !important; width: 100% !important; }
      .archive-img-cell img { width: 100% !important; height: 180px !important; object-fit: cover !important; }
      .archive-text-cell   { display: block !important; width: 100% !important; padding-left: 0 !important; padding-top: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">

  <!-- 프리헤더 (숨김) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f1f5f9;line-height:1px;">
    ${escapeHtml(data.preheader)}&nbsp;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;
  </div>

  <!--[if mso]>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td>
  <![endif]-->
  <table class="email-bg" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
         style="background-color:#f1f5f9;">
    <tr>
      <td style="padding:40px 16px;" align="center">

        <!-- 600px 카드 컨테이너 -->
        <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
               style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;">

          <!-- HEADER -->
          <tr>
            <td class="header-pad" style="padding:36px 40px 28px;border-bottom:2px solid #1a1a1a;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:bottom;">
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#1a1a1a;line-height:1;">
                      Mairangi Notes
                    </p>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#94a3b8;">
                      MHJ &nbsp;&middot;&nbsp; Mairangi Bay, Auckland
                    </p>
                  </td>
                  <td style="text-align:right;vertical-align:bottom;">
                    <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Issue</p>
                    <p style="margin:0 0 2px;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1;">#${data.issueNumber}</p>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">${escapeHtml(data.issueDate)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${section1}
          ${section2}
          ${section3}
          ${section4}
          ${sectionSponsor}
          ${section5}
          ${section6}
          ${section7}
          ${footer}

        </table>
        <!-- /카드 컨테이너 -->

      </td>
    </tr>
  </table>
  <!--[if mso]>
  </td></tr></table>
  <![endif]-->

</body>
</html>`;
}
