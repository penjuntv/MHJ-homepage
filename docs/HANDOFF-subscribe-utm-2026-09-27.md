# 지시서: 뉴스레터 가입 시 utm_source 저장 (2026-09-27)

> Claude Code에 이 파일 경로를 주고 "이 지시서대로 해줘"라고 하면 된다.
> 작성: Cowork 예약 작업 점검 세션. 코드는 읽기만 했고 아무것도 바꾸지 않았다.

## 왜 필요한가

주간 유통 키트(금요일 저녁 예약 작업)가 유튜브·인스타·지역 커뮤니티용 게시 초안을 만들고, 링크마다 `utm_source`를 붙인다.
그런데 가입이 일어나도 DB에는 **어느 채널에서 왔는지가 남지 않는다.** 그래서 키트의 "지난주 효과" 항목이 매주 "데이터 부족"으로 끝난다.

현재 코드 상태(2026-09-27 확인):

| 무엇 | 지금 | 파일 |
|---|---|---|
| `subscribers.source` | **폼 위치** 라벨(homepage_bottom, blog_mid 등). 2026-09-11 W6-C에서 의도적으로 설계됨 — **건드리지 않는다** | `lib/constants.ts:109` `SUBSCRIBE_SOURCES`, `app/api/subscribe/route.ts:12` |
| utm_source | GA 이벤트 `subscribe_complete`에만 보냄. DB에는 없음 | `components/NewsletterCTA.tsx` 40~47행 부근 |
| utm 읽는 시점 | 가입 버튼을 누른 **그 페이지의 URL**에서만 읽음. 유튜브 링크로 들어와 다른 페이지로 이동한 뒤 가입하면 사라짐 | 같은 파일 |

지금 당장 볼 수 있는 대안: GA4에서 이벤트 `subscribe_complete`를 `source` 파라미터로 나눠 보면 채널별 가입이 일부 보인다(같은 페이지에서 바로 가입한 경우만).

## 바꿀 것 (한 PR, 작게)

1. **DB 컬럼 추가** — `subscribers`에 `utm_source text null` 1개. 기본값 없음(null = 모름).
   - 방식: 이 저장소 규칙대로 Supabase `apply_migration`(CLAUDE.md 47행). 마이그레이션 이름 예: `subscribers_add_utm_source`.
   - 정의 사본을 `docs/migrations/2026-09-27_subscribers_utm_source.sql`로 남기고 `docs/DB_SCHEMA.md`의 subscribers 항목에 한 줄 추가.
   - `source` 컬럼과 그 허용 목록은 그대로 둔다. 두 컬럼의 뜻이 다르다: source = 어느 **폼**, utm_source = 어느 **채널**.
2. **허용 목록** — `lib/constants.ts`에 `SUBSCRIBE_UTM_SOURCES = ['youtube','instagram','community','facebook','newsletter'] as const`.
   목록 밖의 값은 `'other'`, 값이 없으면 `null`. (`source`와 같은 방식 — 아무 문자열이나 쌓이지 않게.)
3. **첫 방문 utm 기억** — `app/(public)/layout.tsx`에 작은 클라이언트 컴포넌트 `components/UtmCapture.tsx`를 붙인다.
   - URL에 `utm_source`가 있고, `sessionStorage['mhj_utm_source']`가 비어 있을 때만 저장한다(첫 유입 채널 우선).
   - `sessionStorage` 접근은 전부 `try/catch`로 감싼다(사파리 사생활 보호 모드에서 예외가 난다).
   - 화면에 아무것도 그리지 않는다(`return null`).
4. **폼이 함께 보냄** — `components/NewsletterCTA.tsx`의 `fetch('/api/subscribe')` body에 `utm_source`를 추가한다.
   값 = 현재 URL의 `utm_source` → 없으면 `sessionStorage['mhj_utm_source']` → 없으면 보내지 않음.
   GA `subscribe_complete`도 같은 값을 쓰게 맞춘다(지금은 URL만 봄).
5. **서버가 저장** — `app/api/subscribe/route.ts`에서 body의 `utm_source`를 허용 목록으로 걸러 insert에 넣는다.
   `sourceLabel`과 같은 모양의 함수 하나 추가.

## 지키는 것

- 개인정보 추가 수집 없음. 채널 이름만 저장한다(쿠키 없음, sessionStorage는 탭을 닫으면 사라짐).
- 디자인·문구 변경 없음. 폼 모양 그대로.
- dev 서버가 켜져 있으면 `npm run build` 금지(CLAUDE.md 26행). 먼저 `npx tsc --noEmit`.

## 완료 확인

- [ ] `npx tsc --noEmit` 에러 0
- [ ] 로컬에서 `/mairangi-notes/24?utm_source=youtube`로 들어간 뒤 **홈으로 이동해서** 테스트 이메일로 가입 → `select source, utm_source from subscribers order by id desc limit 1;` 결과가 `homepage_bottom | youtube`
- [ ] `?utm_source=hello`로 가입 → `utm_source = other`
- [ ] utm 없이 가입 → `utm_source = null`
- [ ] 테스트 가입 행은 PeNnY 확인 후 삭제(환영 메일이 실제로 나가니 본인 주소로 테스트)
- [ ] PR 올리고 Vercel 미리보기에서 한 번 더 확인 → PeNnY가 머지

## 머지 후 따로 할 일 없음

주간 유통 키트 프롬프트는 이미 "subscribers에 utm_source 컬럼이 있으면 그걸로 채널별 가입을 센다"로 바꿔 두었다(2026-09-27). 컬럼이 생기면 다음 금요일 실행부터 자동으로 반영된다.
