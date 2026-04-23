# 하네스 패턴 블로그 글 2편 분리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 하네스 패턴 블로그 글 1편을 시간축(도입기/성숙기) 기준으로 2편으로 분리하고, vault-sync 내용을 제거한다.

**Architecture:** 기존 글에서 해당 섹션을 추출하여 초안을 만든 뒤, vault-sync 참조를 제거하고 각 편의 도입/마무리를 새로 작성한다. 완성된 초안을 tech-blog-transformer 업데이트 모드로 품질 검증한다.

**Tech Stack:** Jekyll (Chirpy theme), Markdown

**원본 파일:** `/Users/dj/Dropbox (Maestral)/dev/epikoding.github.io/_posts/2026-03-27-claude-code-note-skill-harness-pattern-guide.md`
**출력 경로:** `/Users/dj/Dropbox (Maestral)/dev/epikoding.github.io/_posts/`

---

## Task 1: 1편 초안 추출

기존 글에서 1편에 해당하는 섹션을 추출하여 새 파일로 생성한다.

**Files:**
- Create: `_posts/2026-03-27-claude-code-harness-pattern-guide-part1.md`
- Read: `_posts/2026-03-27-claude-code-note-skill-harness-pattern-guide.md`

**추출 대상 (원본 라인 기준):**

| 섹션 | 원본 라인 | 비고 |
|------|-----------|------|
| frontmatter | 1~8 | tags 수정 필요 |
| 도입부 | 10~18 | vault-sync 언급 제거 |
| 1. 왜 하네스 패턴이 필요한가 | 20~30 | vault-sync 예시 제거 |
| 2. 하네스 패턴이란 | 32~73 | 그대로 |
| 3. note 스킬 | 75~262 | v4.0 Evaluator 3분할까지 |
| 4. tech-blog-transformer | 431~723 | v3 10축 확장/결과까지 |
| 마무리 | — | 신규 작성 (교훈 요약 + 2편 예고) |

- [ ] **Step 1:** 원본 파일에서 1편 해당 섹션을 Read하여 내용을 파악한다.
- [ ] **Step 2:** frontmatter를 작성한다. 제목: `[AI] Claude Code 스킬에 하네스 패턴 적용하기 (1) — Generator/Evaluator 분리와 Evaluator 전문화`. tags에서 vault-sync, cross-model-review, codex-exec, gpt-5-4 등 2편 전용 태그를 제거한다.
- [ ] **Step 3:** 도입부(line 10~18)에서 vault-sync 관련 문장과 표의 vault-sync 행을 제거한다. "세 스킬" → "두 스킬"로 수정한다.
- [ ] **Step 4:** 1절(line 20~30), 2절(line 32~73)을 추출한다. vault-sync 언급이 있으면 제거한다.
- [ ] **Step 5:** 3절 note 스킬(line 75~262)을 추출한다. 섹션 번호를 조정한다.
- [ ] **Step 6:** 4절 tech-blog-transformer(line 431~723)를 추출한다. 섹션 번호를 조정한다.
- [ ] **Step 7:** 1편 마무리를 신규 작성한다. 내용: Evaluator 전문화까지의 핵심 교훈 2~3문장 요약 + 2편 예고 ("다음 편에서는 CC 진화, 토큰 최적화, cross-model review를 다룬다"). 2편 링크를 포함한다.
- [ ] **Step 8:** 파일을 저장하고 전체 구조가 맞는지 확인한다.
- [ ] **Step 9:** 커밋한다. `blog: 하네스 패턴 글 1편 초안 추출`

---

## Task 2: 1편 vault-sync 참조 제거 및 정리

추출한 1편에서 vault-sync 참조를 모두 제거하고, "세 스킬" → "두 스킬" 등 문맥을 일관되게 수정한다.

**Files:**
- Modify: `_posts/2026-03-27-claude-code-harness-pattern-guide-part1.md`

- [ ] **Step 1:** 파일 전체에서 `vault-sync` 키워드를 검색하여 모든 참조 위치를 확인한다.
- [ ] **Step 2:** vault-sync 관련 문장/단락을 제거하거나, 두 스킬 맥락에 맞게 다시 쓴다. 변경 목록:
  - "세 스킬 모두" → "두 스킬 모두" (또는 문맥에 맞게)
  - "세 스킬에 적용하면서" → "두 스킬에 적용하면서"
  - vault-sync를 예시로 드는 문장은 note 또는 tech-blog 예시로 대체하거나 삭제
- [ ] **Step 3:** 섹션 번호를 재조정한다. (기존 3절→3절, 4절→4절이므로 큰 변경 없을 수 있음)
- [ ] **Step 4:** 전체를 읽고 문맥이 자연스러운지 확인한다.
- [ ] **Step 5:** 커밋한다. `blog: 1편 vault-sync 참조 제거 및 정리`

---

## Task 3: 2편 초안 추출

기존 글에서 2편에 해당하는 섹션을 추출하여 새 파일로 생성한다.

**Files:**
- Create: `_posts/2026-03-27-claude-code-harness-pattern-guide-part2.md`
- Read: `_posts/2026-03-27-claude-code-note-skill-harness-pattern-guide.md`

**추출 대상 (원본 라인 기준):**

| 섹션 | 원본 라인 | 비고 |
|------|-----------|------|
| frontmatter | — | 신규 작성 |
| 도입부 | — | 신규 작성 (1편 요약 + 이번 편 범위) |
| note 후반 | 263~428 | v5.0 CC 전환 ~ v5.1 cross-model |
| tech-blog 후반 | 724~1156 | v3.1 CC 5분할 ~ v5 Codex 혼합 |
| 교훈 | 1272~1321 | vault-sync 제거 필요 |
| 실전 가이드 | 1322~1367 | vault-sync 제거 필요 |
| 참고 자료 | 1368~1374 | 그대로 |

- [ ] **Step 1:** 원본 파일에서 2편 해당 섹션을 Read하여 내용을 파악한다.
- [ ] **Step 2:** frontmatter를 작성한다. 제목: `[AI] Claude Code 스킬에 하네스 패턴 적용하기 (2) — CC 진화, 토큰 최적화, Cross-model Review`. 1편 전용 태그(evaluator-split 등)를 제거하고 2편 전용 태그(cross-model-review, codex-exec, gpt-5-4, token-optimization 등)를 유지한다.
- [ ] **Step 3:** 2편 도입부를 신규 작성한다. 내용: 1편 핵심 요약 2~3문장 (G/E 분리, Evaluator 전문화) + 이번 편 범위 (CC 진화, 토큰 최적화, cross-model review) + 1편 링크.
- [ ] **Step 4:** note 후반(line 263~428)을 추출한다. 섹션 번호를 조정한다.
- [ ] **Step 5:** tech-blog 후반(line 724~1156)을 추출한다. 섹션 번호를 조정한다.
- [ ] **Step 6:** 교훈 섹션(line 1272~1321)을 추출한다.
- [ ] **Step 7:** 실전 가이드(line 1322~1367)와 참고 자료(line 1368~1374)를 추출한다.
- [ ] **Step 8:** 파일을 저장하고 전체 구조가 맞는지 확인한다.
- [ ] **Step 9:** 커밋한다. `blog: 하네스 패턴 글 2편 초안 추출`

---

## Task 4: 2편 vault-sync 참조 제거 및 정리

2편에서 vault-sync 참조를 제거한다. 교훈/실전 가이드 섹션에 vault-sync 참조가 깊게 섞여 있으므로 1편보다 작업량이 많다.

**Files:**
- Modify: `_posts/2026-03-27-claude-code-harness-pattern-guide-part2.md`

**교훈 섹션(6절) 주요 수정 대상:**
- 공통 패턴(line 1274~1289): vault-sync 관련 문장 다수. "세 스킬" → "두 스킬", vault-sync 고유 사례(v4 프롬프트 롤백, Correction Protocol) 제거 또는 note/tech-blog 맥락으로 대체
- 같은 원칙, 다른 구현(line 1302~1315): vault-sync 비교 사례 제거. note vs tech-blog 2자 비교로 재구성
- 에이전트 추가의 유혹과 한계(line 1316~1321): vault-sync 위키링크 가설 단락 제거

**실전 가이드(7절) 수정 대상:**
- 스킬 특성별 설계 선택(line 1326~1336): "무인(cron)" 행에서 vault-sync 암시 제거 또는 일반화
- 도입 체크리스트(line 1337~1357): vault-sync 직접 참조 없음, 수정 불필요 예상

- [ ] **Step 1:** 파일 전체에서 `vault-sync`, `vault`, `cron`, `무인`, `Correction`, `Scorecard`, `Gardening` 키워드를 검색하여 모든 참조 위치를 확인한다.
- [ ] **Step 2:** 공통 패턴 섹션에서 vault-sync 고유 사례를 제거하고, note/tech-blog 두 스킬 맥락으로 다시 쓴다.
- [ ] **Step 3:** 같은 원칙, 다른 구현 섹션에서 3자 비교를 2자 비교(note vs tech-blog)로 재구성한다.
- [ ] **Step 4:** 에이전트 추가의 유혹과 한계 섹션에서 vault-sync 위키링크 가설 단락을 제거한다.
- [ ] **Step 5:** 실전 가이드 섹션에서 vault-sync 암시를 일반화한다.
- [ ] **Step 6:** 마무리 단락(line 1360~1367)에서 vault-sync 참조를 제거한다.
- [ ] **Step 7:** 섹션 번호를 재조정한다.
- [ ] **Step 8:** 전체를 읽고 문맥이 자연스러운지 확인한다.
- [ ] **Step 9:** 커밋한다. `blog: 2편 vault-sync 참조 제거 및 정리`

---

## Task 5: tech-blog-transformer로 1편 품질 검증

초안이 완성된 1편을 tech-blog-transformer 업데이트 모드로 돌려 품질을 검증한다.

**Files:**
- Modify: `_posts/2026-03-27-claude-code-harness-pattern-guide-part1.md`

- [ ] **Step 1:** `/tech-blog-transformer _posts/2026-03-27-claude-code-harness-pattern-guide-part1.md 업데이트해줘` 실행
- [ ] **Step 2:** tech-blog-transformer의 Phase 1~9 워크플로우를 따른다.
- [ ] **Step 3:** 최종 결과물을 확인하고 승인한다.
- [ ] **Step 4:** 커밋한다. `blog: 1편 tech-blog-transformer 품질 검증 완료`

---

## Task 6: tech-blog-transformer로 2편 품질 검증

초안이 완성된 2편을 tech-blog-transformer 업데이트 모드로 돌려 품질을 검증한다.

**Files:**
- Modify: `_posts/2026-03-27-claude-code-harness-pattern-guide-part2.md`

- [ ] **Step 1:** `/tech-blog-transformer _posts/2026-03-27-claude-code-harness-pattern-guide-part2.md 업데이트해줘` 실행
- [ ] **Step 2:** tech-blog-transformer의 Phase 1~9 워크플로우를 따른다.
- [ ] **Step 3:** 최종 결과물을 확인하고 승인한다.
- [ ] **Step 4:** 커밋한다. `blog: 2편 tech-blog-transformer 품질 검증 완료`

---

## Task 7: 상호 링크 및 최종 확인

두 편 간 상호 링크를 넣고, 기존 글 보관 처리를 한다.

**Files:**
- Modify: `_posts/2026-03-27-claude-code-harness-pattern-guide-part1.md`
- Modify: `_posts/2026-03-27-claude-code-harness-pattern-guide-part2.md`

- [ ] **Step 1:** 1편 마무리에 2편 링크가 있는지 확인한다. 없으면 추가한다.
- [ ] **Step 2:** 2편 도입부에 1편 링크가 있는지 확인한다. 없으면 추가한다.
- [ ] **Step 3:** 두 편의 frontmatter에서 `series` 또는 관련 필드를 설정한다 (Chirpy 테마 지원 여부 확인).
- [ ] **Step 4:** 기존 원본 글의 파일명 앞에 날짜를 유지하되, draft로 이동하거나 published: false를 추가하여 보관 처리한다.
- [ ] **Step 5:** 로컬에서 Jekyll 빌드가 정상인지 확인한다 (`bundle exec jekyll build`).
- [ ] **Step 6:** 커밋한다. `blog: 하네스 패턴 글 2편 분리 완료, 원본 보관 처리`
