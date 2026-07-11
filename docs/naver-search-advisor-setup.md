# 네이버 서치어드바이저 등록 가이드 — www.mhj.nz

작성: 2026-07-12. 목적: 네이버 검색 노출을 위한 서치어드바이저(웹마스터 도구) 등록.
**왜 필요한가**: 네이버는 구글처럼 알아서 크롤링하지 않는다. 서치어드바이저에 **직접 사이트 등록 + 사이트맵 제출**을 해야 네이버 검색에 노출된다. (구글은 자동 크롤링되지만 등록하면 더 빠름 → 구글은 Search Console 별도.)

## 이 사이트의 유리한 점 (미리 준비돼 있음)
- ✅ **소유권 확인 태그가 이미 라이브에 삽입돼 있음** → 확인 단계 즉시 통과
  - `<meta name="naver-site-verification" content="5110def7550b633424a62e87c8bc6c9923b3ff8d">` (2026-07-12 라이브 확인)
- ✅ **robots.txt가 네이버 봇(Yeti) 허용** 중
- ✅ **sitemap.xml 존재** (119개 URL), **feed.xml**(RSS) 존재

즉 아래 절차에서 **"소유권 확인"은 이미 심어둔 HTML 태그 방식으로 클릭 한 번에 통과**된다.

---

## 등록 절차 (약 10분)

### 1. 접속 & 로그인
- https://searchadvisor.naver.com 접속 → 우측 상단 **로그인**(네이버 계정) → 상단 **웹마스터 도구** 클릭.

### 2. 사이트 등록
- **사이트 관리 → 사이트 등록** → 입력창에 **`https://www.mhj.nz`** 입력(끝 슬래시 없이, https·www 정확히) → 등록.
- ⚠️ 네이버는 `http/https`, `www 유무`를 다른 사이트로 취급한다. 실제 정본인 **`https://www.mhj.nz`**로 등록할 것.

### 3. 소유권 확인
- 확인 방법 중 **"HTML 태그"** 선택.
- 네이버가 보여주는 메타태그의 content 값이 **이미 사이트에 심어둔 값과 같으면 즉시 통과**된다.
  - 만약 네이버가 **새 코드**를 발급하면(계정이 달라 값이 다를 수 있음) → 그 새 값을 알려주면 내가 `app/(public)/layout.tsx`의 `naver-site-verification` 값을 교체·배포한 뒤 다시 "확인"을 누르면 된다.

### 4. RSS 제출
- 좌측 **요청 → RSS 제출** → **`feed.xml`** 입력 → 확인. (전체 URL이 아니라 경로만: `feed.xml`)

### 5. 사이트맵 제출 (가장 중요)
- 좌측 **요청 → 사이트맵 제출** → **`sitemap.xml`** 입력 → 확인.
- 정상 접수되면 목록에 뜨고, 이후 "가져온 URL 수"가 채워진다.

### 6. 주요 페이지 수집 요청 (색인 가속)
- 좌측 **요청 → 웹페이지 수집** → 핵심 URL을 직접 넣어 크롤링을 앞당긴다. 우선순위:
  - `https://www.mhj.nz/`
  - `https://www.mhj.nz/blog`
  - `https://www.mhj.nz/magazine`
  - `https://www.mhj.nz/about`
  - 최근 발행 대표 글 2~3개(예: `/blog/matariki-in-the-house`)

### 7. 진단 확인
- **사이트 진단 → robots.txt / 수집 현황**에서 오류 없는지 확인.
- **검증 → 웹페이지 최적화**로 개별 페이지 SEO 점검 가능.

---

## 등록 후 (기대치 관리)
- 네이버 색인까지 **통상 1~4주** 소요. 사이트맵 + 웹페이지 수집요청을 함께 하면 빨라진다.
- 이후 주기적으로 **사이트 진단·검색 노출**에서 노출/클릭 추이를 본다.

## 병행 권장 (동일 원리)
- **구글**: [Google Search Console](https://search.google.com/search-console)에 `https://www.mhj.nz` 등록 → `sitemap.xml` 제출. (구글도 등록하면 색인·커버리지 리포트를 볼 수 있어 유리.)
- **빙(Bing)**: 이미 `msvalidate.01` 태그가 라이브에 있음 → [Bing Webmaster Tools](https://www.bing.com/webmasters)에서 등록 + 사이트맵 제출만 하면 됨.

## 내가 도울 수 있는 것
- 네이버가 **새 verification 코드**를 요구하면 → 코드 교체 + 배포.
- 색인이 안 되는 특정 페이지가 있으면 → robots/canonical/메타 원인 진단.
- 네이버 노출 강화를 위한 **네이버 블로그 크로스포스팅 전략**(핵심 글 요약 + 백링크) 설계.

## 참고 (2026 절차 확인 출처)
- [네이버 서치어드바이저](https://searchadvisor.naver.com/)
- [TBWA 데이터랩 — 서치어드바이저 등록](https://seo.tbwakorea.com/blog/naver-search-advisor/)
- [webdot — 단계별 가이드](https://webdot.co.kr/guide/네이버-서치어드바이저-등록-방법-단계별-가이드)
- [imweb — 사이트맵 제출](https://imweb.me/faq?mode=view&category=29&category2=35&idx=71135)
