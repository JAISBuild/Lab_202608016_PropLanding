# PropLanding — 세션 변경 로그 (2026-08-22)

> 공개용 요약. 민감 정보·로컬 비밀번호는 `docs/private/` 참고.

## 범위

공개 랜딩(`/c/riverside`) UX·일조 3D UI·네비게이션 복원·문서화.

## 주요 변경

### 유닛 상세 / 네비게이션
- 평면도 확대 라이트박스: 이미지 재클릭으로 축소
- `상담 신청` → 방문 상담 예약 폼(`#pl-section-inquiry` / return target)으로 즉시 이동
- `랜딩으로` → `돌아가기`: 타입 목록 섹션으로 **스무스 스크롤 없이** 즉시 점프
- `sessionStorage` 기반 랜딩 스크롤/섹션 복원 (`apps/web/lib/landing-scroll.ts`)

### 일조 3D (`PlSunStudy`) — 태양·동 매스·그림자 계산은 유지
- 안내 UI: 방위 레일 + 재생 독 + 제목 명패를 하단 그리드로 정렬 (간격 1mm)
- 제목 「빛이 머무는 집의 방향」: 검정/주황 이단 프레임 + 흰 플레이트, **방위바와 동일 가로폭**
- 남북 슬라이더 제거 (드래그로 충분)
- 전체화면: 재생바 우측 표준 확대 아이콘
- 동/향 명패: 위=방향 / 아래=동, 커뮤니티·방위 명패는 높이 1/2
- 조경: 직사각형 바닥·시설 스케일 확대 (동·태양·그림자 로직 미변경)

### 카피/시드
- lifestyle `lightBody` 단축 또는 패널에서 제거
- `lightTitle` 마침표 제거

### 파일
- `apps/web/components/public/PlSunStudy.tsx`
- `apps/web/components/public/PlLifestyle.tsx`
- `apps/web/components/public/PlUnitDetail.tsx`
- `apps/web/components/public/PlUnitGrid.tsx`
- `apps/web/components/public/CampaignView.tsx`
- `apps/web/components/public/PlInquiryForm.tsx`
- `apps/web/lib/landing-scroll.ts`
- `apps/web/app/campaign.css`
- `packages/database/prisma/seed.ts`

## 검증 메모
- 타입 상세 → 돌아가기: 탑 스크롤 없이 유닛 섹션
- 일조 UI: 레일·독·제목 좌측 정렬, 1mm 간격
- 전체화면 Esc / 닫기 아이콘
