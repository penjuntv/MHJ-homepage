# Post-Deploy Check
# 슬래시 커맨드: /workflows/post-deploy-check
# 소요: ~3분
# Vercel 배포 완료 후 www.mhj.nz 실행

## 실행 조건
- git push → Vercel 배포 완료 (2~3분 대기)
- Revalidation 호출 완료

## Agent 1: Smoke Test
- Skill: user-flow
- 대상: www.mhj.nz
- 축약 시나리오:
  1. 홈 로드
  2. 블로그 글 1개 상세
  3. 매거진 이슈 1개
  4. About 페이지
- Recording: ON

## Agent 2: Visual Regression
- Skill: visual-regression
- 대상: www.mhj.nz vs 직전 baseline
- 뷰포트: 1440, 375
- 다크모드: 포함

## Agent 3: Console Check
- Skill: console-audit
- 대상: www.mhj.nz
- 페이지: /, /blog, /magazine
- 집중: Supabase 에러, 이미지 404, hydration mismatch

## 합격 기준
- P0 = 0, P1 = 0, Console Error = 0
→ "✅ DEPLOY VERIFIED"
→ 실패 시 "🚨 ROLLBACK 검토 필요" + 상세
