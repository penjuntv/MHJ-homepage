/**
 * 매거진 지면 "잘림" 측정 — Admin 경고와 감사 게이트의 단일 정의.
 *
 * 두 소비처가 같은 함수를 쓴다:
 *   - app/mhj-desk/magazines/[id]/page.tsx  (편집 중 빨간 경고)
 *   - scripts/magazine-overflow-audit.mjs   (라이브/빌드 감사, page.evaluate 로 주입)
 * 정의가 갈라지면 편집자가 보는 경고와 실제 라이브가 어긋나므로 반드시 여기 한 곳만 고친다.
 *
 * ⚠ 이 함수는 반드시 self-contained 여야 한다. Playwright 의 page.evaluate 는 함수를
 *   문자열로 직렬화해 브라우저에 넣기 때문에, 모듈 스코프 변수를 참조하면 깨진다.
 *   (import 한 상수·헬퍼를 본문에서 쓰지 말 것)
 *
 * ── 왜 scrollHeight - clientHeight 를 쓰지 않는가 ──
 * 그 방식은 오탐이 난다. TipTap 이 본문 끝에 남기는 빈 <p></p> 가 빈 줄 하나(≈28px)를
 * 차지해 "넘침"으로 잡히지만 실제로 사라지는 글자는 없다. 2026-08 실측에서 라이브
 * 경고 5건 중 3건이 이 오탐이었고, 그래서 빨간 경고가 늑대소년이 됐다.
 * 여기서는 텍스트 노드의 line box 를 직접 재서 "클리핑 박스 밖으로 나간 글자"만 센다.
 *
 * @param {{ epsilon?: number, rootSelector?: string }} [opts]
 *   epsilon      - 서브픽셀 노이즈 무시 임계값(620-space px). 기본 2.
 *   rootSelector - 측정할 지면 루트. 기본 '.mag-page-root'.
 * @returns {{ clip: number, sample: string, label: string, pageH: number } | null}
 *   clip 은 620-space px (transform: scale 을 되돌린 값)이라 창 크기와 무관하게 비교 가능.
 *   지면을 못 찾으면 null.
 */
export function measureMagazineClip(opts) {
  const epsilon = (opts && opts.epsilon) ?? 2;
  const rootSelector = (opts && opts.rootSelector) ?? '.mag-page-root';

  const root = document.querySelector(rootSelector);
  if (!root) return null;

  const rect = root.getBoundingClientRect();
  // 뷰어·어드민 미리보기는 transform: scale() 로 축소한다. 화면 px → 620-space px 환산.
  const scale = root.clientHeight > 0 ? rect.height / root.clientHeight : 1;

  /** el 을 실제로 잘라내는 가장 가까운 조상. 없으면 null. */
  const clipperOf = (el) => {
    let n = el;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      // 의도적 line-clamp(제목 N줄 자르기)는 편집 의도이므로 잘림으로 치지 않는다.
      if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') return null;
      // hidden/clip 만 — auto/scroll 은 스크롤로 도달 가능하므로 "사라진 글자"가 아니다.
      if (cs.overflowY === 'hidden' || cs.overflowY === 'clip' ||
          cs.overflow === 'hidden' || cs.overflow === 'clip') return n;
      n = n.parentElement;
    }
    return null;
  };

  let worst = 0;
  let sample = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue;
    if (!text || !text.trim()) continue;          // 빈 문단/공백은 잘려도 손실이 아니다
    const parent = node.parentElement;
    if (!parent) continue;
    const pcs = getComputedStyle(parent);
    if (pcs.visibility === 'hidden' || pcs.display === 'none' || Number(pcs.opacity) === 0) continue;

    const box = clipperOf(parent);
    if (!box) continue;
    const boxBottom = box.getBoundingClientRect().bottom;

    // line box 단위로 재야 "몇 줄이 사라졌나"를 정확히 안다.
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.height === 0) continue;
      const over = scale > 0 ? (r.bottom - boxBottom) / scale : r.bottom - boxBottom;
      if (over > worst) {
        worst = over;
        sample = text.trim().slice(0, 70);
      }
    }
  }

  const header = root.querySelector('div[style*="letter-spacing"]');
  return {
    clip: worst > epsilon ? Math.round(worst) : 0,
    sample,
    label: (header && header.textContent ? header.textContent : '').trim().slice(0, 44),
    pageH: root.clientHeight,
  };
}

/**
 * TipTap 이 본문 끝에 남기는 빈 문단을 제거한다.
 *
 * `<p></p>` / `<p><br></p>` / `<p>&nbsp;</p>` / `<p style="text-align: right;">  </p>` 전부 해당.
 * 고정 캔버스 지면에서 이 빈 줄들은 의미가 없는데도 자리를 차지해
 *   (1) 편집자에게 헛된 넘침 경고를 띄우고
 *   (2) 진짜 본문을 지면 밖으로 밀어낸다.
 * 저장 시점에 잘라 DB 로 들어가지 않게 한다.
 *
 * @param {string | null | undefined} html
 * @returns {string} 정규화된 HTML (입력이 비면 빈 문자열)
 */
export function stripTrailingEmptyBlocks(html) {
  if (!html) return '';
  // 끝에서부터 반복 적용 — 빈 문단이 여러 개 연속일 수 있다.
  const trailingEmptyP = /\s*<p\b[^>]*>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>\s*$/i;
  let out = html;
  let prev;
  do {
    prev = out;
    out = out.replace(trailingEmptyP, '');
  } while (out !== prev);
  return out.trim();
}
