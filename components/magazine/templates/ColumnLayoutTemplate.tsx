'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

/* 타이틀↔그리드 = 컬럼 gap = 이미지 gap 리듬 통일 */
const GAP = 'clamp(16px, 4cqw, 32px)';

export default function ColumnLayoutTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
  imageSide,
}: NewTemplateProps & { imageSide: 'left' | 'right' }) {
  const uid = useId().replace(/:/g, 'd');
  const bg = article.style_overrides?.bgColor ?? bgColor;
  const slots = getImageSlots(article, 3);
  const content = article.content || '<p>본문을 작성해 주세요. 이미지 3장이 측면 컬럼에 세로로 배치됩니다.</p>';

  /* ── 인포블록 슬롯 (사진 컬럼 하단) ──
     영업시간·준비물 같은 실용 정보는 산문이 아니다. 본문 흐름에 두면 지면 분량만
     잡아먹고(2026-02 "Up the Coast" 가 이것 때문에 잘렸다) 읽는 리듬도 끊는다.
     실무 매거진의 service information/fact box 를 사진 컬럼 아래에 둔 것.

     ⚠ getSidebarContent() 를 쓰지 않고 필드를 직접 읽는다 — 그 getter 는 본문의
     <hr> 분할과 image_captions 폴백을 갖고 있어서, 값을 넣은 적 없는 기존 기사에도
     인포블록이 갑자기 나타날 수 있다. 여기서는 명시적으로 입력했을 때만 렌더한다. */
  const infoBody = article.sidebar_body?.trim() ?? '';
  const infoTitle = article.sidebar_title?.trim() ?? '';

  const imageColumn = (
    <div
      className={`col-imgs-${uid}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}
    >
      {slots.map((slot, i) =>
        slot.src ? (
          <div key={i} style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.src}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: slot.pos,
                display: 'block',
              }}
            />
          </div>
        ) : (
          <div
            key={i}
            style={{
              flex: '1 1 0',
              minHeight: 0,
              background: `${accentColor}15`,
              border: `1px dashed ${accentColor}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${accentColor}88`,
              fontFamily: '"Playfair Display", "Noto Sans KR", serif',
              fontStyle: 'italic',
              fontSize: 'var(--mag-font-meta)',
            }}
          >
            image {i + 1}
          </div>
        )
      )}

      {/* 인포블록 — 입력했을 때만 렌더. 없으면 기존 지면과 출력이 완전히 동일하다.
          flexShrink:0 이라 사진(flex:1 1 0)이 그만큼 줄어들고 지면은 넘치지 않는다.
          시각 언어는 SidebarTemplate 의 인포블록과 통일(accent 틴트 + 4px radius). */}
      {infoBody && (
        <div
          className={`col-info-${uid}`}
          style={{
            flexShrink: 0,
            marginTop: '4px', // 이미지 gap 과 동일한 리듬
            background: `${accentColor}08`,
            border: `1px solid ${accentColor}22`,
            borderRadius: '4px',
            padding: '0.9em 1em',
            boxSizing: 'border-box',
          }}
        >
          {infoTitle && (
            <div
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: 'var(--mag-font-meta)',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: accentColor,
                marginBottom: '0.6em',
              }}
            >
              {infoTitle}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: infoBody }} />
        </div>
      )}
    </div>
  );

  const contentColumn = (
    <div
      className={`col-text-${uid}`}
      style={{ minHeight: 0, overflow: 'hidden' }}
    >
      <div className={`col-body-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        padding: 'var(--mag-page-padding-y) var(--mag-page-padding-x)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .col-body-${uid} p {
          margin: 0 0 0.9em;
          font-size: var(--mag-font-body);
          line-height: 1.65;
          color: var(--mag-body-color);
        }
        .col-body-${uid} p:last-child { margin-bottom: 0; }
        /* 인포블록 타이포 — 본문보다 한 단계 작게(SidebarTemplate 과 동일 비율) */
        .col-info-${uid} p {
          margin: 0 0 0.5em;
          font-size: calc(var(--mag-font-body) * 0.92);
          line-height: 1.55;
          color: var(--mag-body-color);
        }
        .col-info-${uid} p:last-child { margin-bottom: 0; }
        .col-info-${uid} ul, .col-info-${uid} ol { margin: 0; padding-left: 1.1em; }
        .col-info-${uid} li {
          margin-bottom: 0.3em;
          font-size: calc(var(--mag-font-body) * 0.92);
          line-height: 1.55;
          color: var(--mag-body-color);
        }
        .col-info-${uid} li:last-child { margin-bottom: 0; }
        .col-info-${uid} em { font-style: italic; }
        .col-info-${uid} strong { font-weight: 700; }
        .col-body-${uid} strong { font-weight: 700; }
        .col-body-${uid} em { font-style: italic; }
        .col-body-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        ${article.style_overrides?.dropCap ? `
        .col-body-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", "Noto Sans KR", serif;
          font-weight: 900;
          font-size: clamp(40px, 11cqw, 88px);
          line-height: 0.85;
          color: var(--mag-body-color);
          margin-right: 0.12em;
          margin-top: 0.04em;
        }` : ''}
        @container (max-width: 500px) {
          .col-grid-${uid} {
            grid-template-columns: 1fr !important;
          }
          /* 1컬럼 모드: 세로 스택(flex 1 1 0)은 auto 행에서 높이 0으로
             붕괴하므로, 1:1 정사각 3장 가로 스트립으로 전환 */
          .col-imgs-${uid} { order: -1 !important; flex-direction: row !important; }
          .col-imgs-${uid} > div { aspect-ratio: 1 / 1; }
          .col-text-${uid} { order: 0 !important; }
        }
      `}</style>

      {/* 타이틀 + 구분선 — 좌측 정렬 (MHJ 매거진 규칙) */}
      {!hideTitle && (
        <div
          style={{
            flexShrink: 0,
            textAlign: 'left',
            paddingBottom: '0.9em',
            borderBottom: '1px solid var(--mag-title-divider)',
          }}
        >
          <h1
            style={{
              fontFamily: '"Playfair Display", "Noto Sans KR", serif',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 'var(--mag-font-title)',
              lineHeight: 1.05,
              color: 'var(--mag-body-color)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {article.title || 'Untitled'}
          </h1>
        </div>
      )}

      {/* 2-컬럼 그리드: imageSide로 이미지 컬럼 위치 결정 */}
      <div
        className={`col-grid-${uid}`}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: imageSide === 'left' ? '38% 1fr' : '1fr 38%',
          gap: GAP,
          marginTop: GAP,
          overflow: 'hidden',
        }}
      >
        {imageSide === 'left' ? (
          <>
            {imageColumn}
            {contentColumn}
          </>
        ) : (
          <>
            {contentColumn}
            {imageColumn}
          </>
        )}
      </div>

      {/* 하단 구분선 + 저자 / The MHJ — marginTop: auto로 바닥 고정 */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 'auto',
          paddingTop: '0.9em',
          borderTop: '1px solid var(--mag-title-divider)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'var(--mag-font-meta)',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--mag-meta-color)',
          }}
        >
          {article.author || 'The MHJ'}
        </span>
        <span
          style={{
            fontFamily: '"Playfair Display", "Noto Sans KR", serif',
            fontStyle: 'italic',
            fontSize: 'var(--mag-font-meta)',
            color: accentColor,
            opacity: 0.6,
          }}
        >
          The MHJ
        </span>
      </div>
    </div>
  );
}
