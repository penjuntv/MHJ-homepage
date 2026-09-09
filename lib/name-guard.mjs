/**
 * 실명 노출 차단 패턴 — CLAUDE.md 규칙 10(P0)의 런타임 짝.
 *
 * `.claude/hooks/name-guard.sh` 는 **에이전트가 파일을 고칠 때만** 작동한다.
 * 편집자가 저장하는 값은 그 훅을 지나지 않는다 — 특히 `/api/ai-seo` 의 한국어 요약은
 * 본문에서 산문을 새로 만들기 때문에, 옛 초안에 남은 로마자 표기를 그대로 옮길 수 있고
 * 그 결과가 공개 페이지의 `<section lang="ko">` 로 나간다.
 *
 * 패턴은 훅(`.claude/hooks/name-guard.sh` 의 PATTERN)과 **같은 목록**이어야 한다.
 * 한쪽만 고치면 한쪽이 뚫린다.
 *
 * ⚠️ 이 파일에는 금칙 이름을 **글자 그대로 적지 않는다** — 적으면 훅이 이 파일 자체를 막는다.
 *    한글은 유니코드 이스케이프(\uXXXX), 로마자는 조각 이어붙이기로 만든다.
 */

const Y = '유'; // 성(姓)에 해당하는 첫 글자
/** 훅의 PATTERN 과 같은 구성. 표기를 바꾸려면 훅과 함께 고칠 것. */
const FORBIDDEN = [
  'yu' + 'min',
  'yu' + 'hyeon',
  'yu' + 'hyun',
  'yu' + 'jin',
  Y + '민',
  Y + '현',
  Y + '진',
  'hee' + 'jong\\s+jo',
];

const RE = new RegExp(FORBIDDEN.join('|'), 'i');

/** 금칙 이름이 들어 있는가. 발견하면 그 텍스트는 저장·게시하지 않는다. */
export function containsForbiddenName(text) {
  return RE.test(String(text ?? ''));
}

/** 테스트용 샘플 — 테스트 파일에도 실명을 적지 않기 위해 여기서 조립해 내보낸다. */
export const FORBIDDEN_SAMPLES = FORBIDDEN.map((f) => f.replace('\\s+', ' '));

/** 사용자에게 보여줄 안내 — 무엇이 걸렸는지는 적지 않는다(그 자체가 노출이다). */
export const FORBIDDEN_NAME_MESSAGE =
  '생성된 문장에 사용할 수 없는 이름이 있어 폐기했습니다. 본문에서 아이 이름을 사이트 표기(Min/Hyun/Jin)로 바꾼 뒤 다시 시도하세요.';
