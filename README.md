# Lab_202608016_PropLanding

분양·프로모션 캠페인용 **랜딩 페이지 생성 및 영업 운영 플랫폼**입니다.

## 현재 진행: Phase 1~7 구현 완료 ✅

상세 점검: [docs/PHASE-CHECKLIST.md](docs/PHASE-CHECKLIST.md)

| 앱/패키지 | 포트 | 설명 |
|-----------|------|------|
| `@proplanding/web` | 3000 | 공개 랜딩 (스켈레톤) |
| `@proplanding/admin` | 3001 | Control Tower (스켈레톤) |
| `@proplanding/api` | 4000 | REST API — `/health`, `/ready` |
| PostgreSQL | 5432 | Docker Compose |

## 빠른 시작

```bash
cp .env.example .env
pnpm install
pnpm docker:up          # PostgreSQL 시작
pnpm db:generate
pnpm db:migrate         # 스키마 v0 적용
pnpm dev:api            # API :4000
pnpm dev:web            # Web :3000
pnpm dev:admin          # Admin :3001
```

헬스체크:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/ready
```

## 모노레포 구조

```text
apps/
  web/          # 공개 랜딩 (Next.js)
  admin/        # 운영 콘솔 (Next.js)
packages/
  api/          # Hono API 서버
  database/     # Prisma schema v0
  shared/       # 공통 타입·유틸
```

## 문서 (코딩 전 필독)

**[docs/README.md](docs/README.md)** — 문서 허브 (모든 항목 클릭 연결)

| 순서 | 문서 | 설명 |
|------|------|------|
| 01 | [design.md](docs/design.md) | 그래픽 우선 UX, 클릭 연결 맵, 화면 목록 |
| 02 | [rules.md](docs/rules.md) | 저작권·안정성·확장성·효율성 개발 룰 |
| 03 | [implementation-plan.md](docs/implementation-plan.md) | **8단계 코딩 로드맵** |
| 04 | [architecture.md](docs/architecture.md) | 시스템·서비스·퍼널 구조 |
| 05 | [data-model.md](docs/data-model.md) | DB 엔티티·관계·PII |
| 06 | [work-summary.md](docs/work-summary.md) | 작업 총정리·의사결정·체크리스트 |

## 설계 요약

- **Site Factory** — 템플릿 기반 캠페인 랜딩 자동 생성
- **Inquiry Hub** — 잠재고객 수집·상태·배정
- **Attribution Layer** — UTM·행동 이벤트 추적
- **Control Tower** — 운영자 웹 콘솔

특정 외부 사이트 구조를 벤치마킹한 문서가 아닌, 업계 공통 패턴을 바탕으로 한 **독자 아키텍처**입니다.
