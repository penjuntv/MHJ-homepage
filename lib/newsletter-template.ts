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
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mymairangi.com';

  /* ── 공통 파트 ── */
  const header = `
    <tr>
      <td style="padding:32px 40px 24px 40px; border-bottom:1px solid #F1F5F9;">
        <a href="${siteUrl}"
           style="text-decoration:none; color:#1a1a1a; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:900; letter-spacing:-0.5px;">
          MY MAIRANGI
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
          You received this because you subscribed to MY MAIRANGI newsletter.
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
