# PropLanding — 작업 총정리

> [문서 허브](./README.md) · 최종 업데이트: 설계·룰·플랜 패키지 v1.0

코딩 **이전**에 완료한 산출물과 의사결정, 저작권 개선, 8단계 코딩 계획을 한곳에 정리합니다.

---

## 1. 작업 범위 요약

| 구분 | 상태 | 링크 |
|------|------|------|
| 시스템 아키텍처 | ✅ 완료 | [architecture.md](./architecture.md) |
| 데이터 모델 | ✅ 완료 | [data-model.md](./data-model.md) |
| UX·그래픽·클릭 설계 | ✅ 완료 | [design.md](./design.md) |
| 개발·운영 룰 | ✅ 완료 | [rules.md](./rules.md) |
| 8단계 구현 플랜 | ✅ 완료 | [implementation-plan.md](./implementation-plan.md) |
| **코딩** | 🔄 Phase 0 완료 | [implementation-plan.md](./implementation-plan.md) Phase 0 |

---

## 2. 저작권 위배 요소 → 개선안

기존 벤치마크 기반 PDF에서 식별한 리스크와 **독자 설계로의 전환**입니다.

| # | 기존 리스크 | 개선 방향 | 반영 문서 |
|---|-------------|-----------|-----------|
| 1 | 특정 분양 사이트명·구조 언급 | 제거, 도메인 용어(Site Factory 등) | [architecture.md](./architecture.md) |
| 2 | 벤치마크와 동일 화면·섹션 순서 | 독자 Visual Hierarchy + 블록 플러그인 | [design.md §2](./design.md#2-그래픽-우선-설계-graphics-first) |
| 3 | 동일 UI 문구 («관심고객 등록» 등) | 캠페인별 커스텀 카피 + PropLanding 토큰 | [design.md §6](./design.md#6-저작권-회피--uiux-변경-요약) |
| 4 | 외부 사이트 스크린샷·에셋 가정 | 고객 제공·라이선스 자산만 | [rules.md §1](./rules.md#1-저작권-및-표현-규칙) |
| 5 | HTML 수작업 CMS | `site_blocks` JSON + 컴포넌트 레지스트리 | [data-model.md](./data-model.md) |
| 6 | 단순 사이트 복제 목표 | 영업 운영 자동화 플랫폼으로 재정의 | [architecture.md §1](./architecture.md#1-제품-비전) |

---

## 3. 핵심 요구사항 반영 매트릭스

| 사용자 요구 | 설계 반영 | 검증 시점 |
|-------------|-----------|-----------|
| **모든 항목 클릭 연결** | Click-through Map, 화면 인벤토리, QA 체크리스트 | Phase 3, 4 E2E |
| **분양 그래픽 중요** | Graphics-first, 미디어 사양, LCP·lightbox·평면 확대 | Phase 2 |
| **안정성** | 백업·DR·헬스·멱등·트랜잭션 | Phase 0, 3, 7 |
| **확장성 (CRUD·장애·사후)** | 블록 플러그인, API 버전, soft delete, runbook | Phase 1~7 |
| **효율성** | 템플릿 재사용, CDN, 배치, 번들 분리 | Phase 1, 2, 6, 7 |

---

## 4. 코딩 단계 — 최종 답변

### 총 **8단계** (0~7 필수 + 8 선택)

```text
Phase 0  기반 구축          … CI/CD, DB, 헬스, 마이그레이션
Phase 1  Site Factory       … 캠페인·블록·미디어 API
Phase 2  공개 랜딩 (그래픽)  … 히어로·갤러리·평면·영상  ★ 분양 핵심
Phase 3  전환·문의          … 클릭→완료 E2E              ★ 클릭 연결 완성
Phase 4  Control Tower     … 운영 콘솔·게시
Phase 5  일정·영업          … 예약·상태·배정
Phase 6  Attribution       … UTM·리포트·360° 뷰
Phase 7  안정화·운영        … DR·모니터링·보안·사후관리  ★ 프로덕션 필수
Phase 8  지능 보조 (선택)   … AI·스코어링
```

**왜 8단계인가 (한 줄):**  
그래픽(2)·클릭 완결(3)·운영(4~5)·분석(6)·안정화(7)를 **분리**해야 품질과 롤백 단위를 동시에 확보하기 때문.

상세 작업 목록: [implementation-plan.md §4](./implementation-plan.md#4-단계별-코딩-로드맵-8단계)

---

## 5. 문서 읽기 순서 (전부 클릭 연결)

1. [docs/README.md](./README.md) — 허브  
2. [design.md](./design.md) — 화면·그래픽·클릭  
3. [rules.md](./rules.md) — 개발 규칙  
4. [implementation-plan.md](./implementation-plan.md) — 8단계 플랜  
5. [architecture.md](./architecture.md) — 시스템 구조  
6. [data-model.md](./data-model.md) — DB  
7. **본 문서** — 총정리  

---

## 6. 의사결정 로그 (ADR 요약)

| ID | 결정 | 이유 |
|----|------|------|
| ADR-01 | 8단계 로드맵 | 그래픽·안정화 분리 |
| ADR-02 | 블록 기반 Site Factory | 확장·저작권 안전 |
| ADR-03 | 공개/Admin 앱 분리 빌드 | 효율·번들 크기 |
| ADR-04 | Phase 7 필수 | DR·사후관리 별도 마일스톤 |
| ADR-05 | AI는 Phase 8 | 데이터 축적 후 |

---

## 7. 코딩 착수 전 체크리스트

- [ ] 팀이 [rules.md](./rules.md) 합의
- [ ] 디자인 토큰·폰트·색상 확정 ([design.md §2.4](./design.md#24-독자-디자인-토큰-저작권-회피))
- [ ] 호스팅·도메인·S3 버킷 결정 (Phase 0)
- [ ] 첫 캠페인 샘플 에셋 (저작권 확인)
- [ ] Phase 0 스프린트 백로그 생성

---

## 8. 다음 액션

| 우선순위 | 작업 | 담당 |
|----------|------|------|
| P0 | Phase 0 저장소·CI·DB 스캐폴딩 | 개발 |
| P0 | 디자인 토큰·히어로 와이어 1종 | 디자인 |
| P1 | Phase 1 캠페인 API | 개발 |
| P1 | Phase 2 `PlHero`·`PlGallery` | 개발+디자인 |

---

## 9. 산출물 목록 (파일)

```
docs/
  README.md                 # 문서 허브 (클릭 네비게이션)
  design.md                 # UX·그래픽·클릭 맵
  rules.md                  # 개발·운영·저작권 룰
  implementation-plan.md    # 8단계 코딩 플랜
  architecture.md           # 시스템 아키텍처
  data-model.md             # DB 스키마
  work-summary.md           # 본 문서
```

---

*PropLanding Lab · 설계 패키지 v1.0 — 코딩은 [implementation-plan.md Phase 0](./implementation-plan.md#phase-0--기반-구축)부터 시작*
