# Lab_202608016_PropLanding

분양·프로모션 캠페인용 **랜딩 페이지 생성 및 영업 운영 플랫폼** 설계 저장소입니다.

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
