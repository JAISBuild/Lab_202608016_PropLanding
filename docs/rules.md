# PropLanding — 개발·운영 룰

> 관련 문서: [문서 허브](./README.md) · [설계](./design.md) · [플랜](./implementation-plan.md)

코딩 착수 전 팀이 공유할 **필수 규칙**입니다.  
안정성·확장성·효율성·저작권 안전을 동시에 만족하도록 작성했습니다.

---

## 1. 저작권 및 표현 규칙

### 1.1 금지

- 특정 벤치마크 URL·사이트의 **HTML/CSS 구조, 클래스명, 문구, 이미지** 복제
- 외부 사이트 스크린샷을 설계·마케팅 자료에 **무단 사용**
- 오픈소스·스톡 이미지 **라이선스 미확인** 사용
- 벤치마크 고유 브랜드명·슬로건을 그대로 재사용

### 1.2 허용

- 업계 **공통 패턴**: 랜딩 퍼널, CRM, UTM, 고정 CTA, 갤러리, 평면도 안내
- **독자** 컴포넌트명·디자인 토큰·카피·와이어프레임
- 고객·시행사가 **저작권을 보유한** 분양 자료(계약·확인서 필수)

### 1.3 코드·문서 표기

- 컴포넌트 접두사: `Pl*` (PropLanding)
- API 경로: `/api/v1/...` (버전 명시)
- DB 테이블: [data-model.md](./data-model.md) 명명만 사용

---

## 2. 아키텍처 룰

### 2.1 계층 분리

```text
Presentation (Next.js) → API/BFF → Domain Services → Repository → PostgreSQL
                              ↘ Object Storage (미디어)
```

- **비즈니스 로직**은 API/서비스 레이어에만 둔다 (UI에 직접 SQL 금지)
- **콘텐츠**는 DB `site_blocks.payload` + 스토리지 URL (하드코딩 HTML 최소화)

### 2.2 확장성 (추가·수정·삭제·업데이트)

| 작업 | 규칙 |
|------|------|
| **추가** | 새 `site_blocks.type`는 컴포넌트 1개 + 스키마 1개로 등록 (플러그인 패턴) |
| **수정** | 캠페인은 `draft`에서 편집, `published`는 버전 스냅샷 또는 즉시 반영 정책 명시 |
| **삭제** | 소프트 삭제 `deleted_at` 기본, 미디어는 스토리지 GC 배치 |
| **업데이트** | DB 마이그레이션 필수, **롤백 스크립트** 또는 down 마이그레이션 |
| **API 변경** | `/api/v1` 유지, breaking change는 v2 |

### 2.3 멀티테넌시

- 모든 쿼리에 `organization_id` 필터 (미들웨어에서 강제)
- 테넌트 간 데이터 **절대 혼선 금지** (통합 테스트에 포함)

---

## 3. 프론트엔드 룰

### 3.1 클릭 연결 ([design.md §3](./design.md#3-클릭-연결-맵-click-through-map))

- `<button>` without action **금지** (로딩·disabled 예외)
- 링크는 Next.js `<Link>` 또는 명시적 `router.push`
- 외부 링크: `rel="noopener noreferrer"`, 전화: `tel:`, 카카오: 앱 딥링크

### 3.2 그래픽 ([design.md §2](./design.md#2-그래픽-우선-설계-graphics-first))

- 이미지: WebP/AVIF + `srcset`, LCP 이미지 `priority`
- 평면도: 확대 모달 필수, 원본은 스토리지에서 서명 URL
- 업로드: 클라이언트 압축 + 서버 리사이즈 파이프라인 (Phase 1)

### 3.3 상태·에러

- 로딩: skeleton (레이아웃 점프 방지)
- 에러: 사용자 메시지 + «다시 시도» 클릭
- 빈 상태: **다음 행동 CTA** (예: «첫 캠페인 만들기»)

---

## 4. 백엔드·데이터 룰

### 4.1 API

- REST + OpenAPI 문서 자동 생성
- 입력: Zod/class-validator 등 **스키마 검증**
- 출력: 민감 필드 마스킹 (전화번호 목록 등)
- 멱등성: 문의 제출 `Idempotency-Key` 헤더 (Phase 3)

### 4.2 데이터베이스

- 마이그레이션 도구: Prisma / Drizzle / Flyway 중 팀 선택 (플랜 Phase 0에서 확정)
- 트랜잭션: 문의 생성 + 동의 기록 + 이벤트는 **단일 트랜잭션**
- PII: `phone` 등 암호화 at rest ([data-model.md §7](./data-model.md#7-pii보안))

### 4.3 미디어

- 경로: `{org_id}/{campaign_id}/{uuid}.{ext}`
- 공개 URL: CDN + 서명 URL (만료)
- 삭제: DB soft delete 후 30일 뒤 스토리지 purge

---

## 5. 안정성·장애 복구 룰

### 5.1 가용성 목표 (Phase 7 이후)

| 항목 | 목표 |
|------|------|
| API 가용성 | 99.5%+ (월) |
| RPO (데이터 손실) | ≤ 1시간 |
| RTO (복구 시간) | ≤ 4시간 |

### 5.2 필수 운영 요소

- **DB 자동 백업** (일 1회 전체 + WAL/포인트인타임 복구)
- **헬스체크** `/health`, `/ready` (DB·스토리지 연결)
- **구조화 로그** + 에러 트래킹 (Sentry 등)
- **알림**: 5xx 급증, 디스크, 백업 실패

### 5.3 장애 시

1. 트래픽 우회 또는 정적 «점검 중» 페이지 (CDN 레벨)
2. DB 장애: 읽기 전용 모드 또는 큐잉 (문의 유실 방지)
3. 사후 **포스트모템** 문서화 (재발 방지)

---

## 6. 효율성 룰

- **템플릿 재사용**: 신규 캠페인 80%는 콘텐츠 입력만
- **캐시**: published 캠페인 HTML/JSON CDN 캐시, 무효화 on publish
- **배치**: 리포트·스토리지 GC는 cron/queue
- **번들**: 공개 랜딩은 admin 코드 **분리 빌드** (트리 쉐이킹)

---

## 7. Git·코드 품질

- 브랜치: `cursor/<feature>-1e12` 또는 `feature/*`
- 커밋: Conventional Commits (`feat:`, `fix:`, `docs:`)
- PR: 1 기능 1 PR, 스크린샷/동영상 (UI 변경 시)
- 테스트: API 통합 테스트 + 핵심 E2E (문의 제출, 게시)
- Lint/format: ESLint + Prettier, CI에서 강제

---

## 8. 보안·개인정보

- HTTPS 전 구간
- 관리자: RBAC + 세션 만료 + 감사 로그
- 방문자: 쿠키/추적은 **동의 후** (Attribution Phase 6)
- 보유 기간: 문의 데이터 정책에 따라 **자동 파기** 배치

---

## 9. 사후관리 (Maintenance)

| 주기 | 작업 |
|------|------|
| 주간 | 의존성 보안 패치 검토 |
| 월간 | 백업 복구 리허설, 로그·용량 점검 |
| 분기 | 성능·비용 리뷰, 미사용 미디어 GC |
| 캠페인 종료 | `archived` 전환, 리다이렉트 정책 |

---

## 10. Definition of Done (공통)

- [ ] [design.md](./design.md) 클릭 연결 체크리스트 통과
- [ ] 단위/통합 테스트 통과
- [ ] OpenAPI·마이그레이션 포함
- [ ] 저작권·라이선스 이슈 없음
- [ ] 모바일 실기기 또는 에뮬레이터 확인 (UI)

---

*다음: [implementation-plan.md](./implementation-plan.md)*
