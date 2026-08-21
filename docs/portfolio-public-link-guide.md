# PropLanding을 포트폴리오 링크로 상시 공개하는 방법

수신: gplive3@gamil.com  
작성: 2026-08-22  
대상 프로젝트: Lab_202608016_PropLanding (web + API + admin + PostgreSQL)

---

## 한 줄 결론

**재설계 없이 가장 간단한 방법:** Railway(또는 Render)에 `docker-compose`/`Dockerfile`로 API+DB+Web을 한 번에 올리고, 커스텀 도메인 또는 `*.up.railway.app` URL을 포트폴리오에 붙인다.  
**더 싸게·더 단순하게:** Web만 Vercel에 올리고 API는 “데모 모드(시드 JSON/읽기 전용)”로 붙이거나, Neon 무료 Postgres + API를 Fly.io에 둔다.

영상 저장/녹화는 제외한다. 클릭 가능한 **항상 켜진 URL**이 목표다.

---

## 왜 일반 정적 호스팅만으로는 부족한가

이 프로젝트는 대략 다음이 동시에 필요하다.

| 구성요소 | 역할 |
|----------|------|
| `apps/web` (Next.js) | 공개 랜딩 |
| `apps/api` | 캠페인·문의·이벤트 API |
| PostgreSQL | 시드·문의 데이터 |
| (선택) `apps/admin` | CMS — 포트폴리오에서는 숨기거나 데모 계정만 |

그래서 “HTML만 올리면 끝”은 안 되고, **항상 켜진 백엔드+DB** 또는 **백엔드를 흉내 내는 데모 모드**가 필요하다.

---

## 방법 A — 재설계 최소, 운영형 데모 (추천)

**아이디어:** 로컬과 동일한 스택을 클라우드에 상시 배포.

1. GitHub 리포를 Railway / Render / Fly.io에 연결  
2. Postgres 플러그인 추가  
3. API·Web 서비스를 각각(또는 모노레포 멀티 서비스) 배포  
4. 마이그레이션 + seed 한 번 실행  
5. 환경변수: `DATABASE_URL`, `NEXT_PUBLIC_API_URL` 등  
6. 공개 URL 예: `https://riverside-demo.up.railway.app/c/riverside`

**장점:** 코드 거의 그대로, 문의 폼·일조 3D·어드민까지 실동작.  
**단점:** 무료 티어 슬립(슬립 후 첫 요청 지연) 가능 → 유료 소액 또는 “항상 on” 옵션.

**슬립 완화:** cron으로 5~10분마다 `/health` ping.

---

## 방법 B — 재설계 약간, 비용·복잡도 최저 (차선 추천)

**아이디어:** “포트폴리오 데모 프로필”만 추가하고, 프로덕션 아키텍처는 유지.

1. Web: `DEMO_MODE=1`이면 API 대신 `public/demo/campaign.json` 로드  
2. 문의 제출: 성공 UI만 보여주고 서버 저장 skip (또는 Formspree 등 외부 폼)  
3. Vercel에 Web만 배포 → URL 즉시 공유

**장점:** 무료에 가깝고 링크가 항상 빠름.  
**단점:** 실제 CRM/메시지 파이프는 데모에서 약해짐. 일조 Three.js는 프론트만으로 충분.

재설계 범위는 **데이터 로더 분기 1곳 + 시드 JSON export** 수준이면 충분하다.

---

## 방법 C — 풀스택 PaaS 원클릭 (중간)

- **Neon** (Postgres) + **Vercel** (web) + **Railway** (api)  
- 또는 **Supabase** DB + Vercel web + API routes를 Next에 점진 이전(이건 재설계 큼 → 비추천 for “지금 당장”)

---

## 방법 D — 비공개 저장소 + 초청 링크

GitHub private + Railway private deploy + 비밀번호 기본 인증(Simple Auth)로 “지인만” 공개.  
포트폴리오 공개용보다는 면접 전용.

---

## 실무적으로 지금 바로 할 순서 (재설계 없음)

1. GitHub 푸시 확인 (이미 `cursor/ongyeol-inspired-landing-995c`)  
2. Railway 계정 → New Project → Deploy from GitHub  
3. Postgres 추가 → `DATABASE_URL` 연결  
4. API 서비스: root에서 `pnpm`/`docker`로 api 기동 커맨드  
5. Web 서비스: `apps/web` build, `NEXT_PUBLIC_API_URL=https://<api-domain>`  
6. Release command: `prisma migrate deploy && prisma db seed`  
7. 브라우저에서 `/c/riverside` 확인 후 그 URL을 노션/이력서/LinkedIn에 고정

Admin은 포트폴리오에서 링크를 빼거나, `admin@demo.local`만 문서에 명시.

---

## 링크를 “언제든지” 유지하는 체크리스트

- [ ] DB 시드가 배포 파이프라인에 포함  
- [ ] Healthcheck URL 모니터링  
- [ ] 슬립 방지 ping (무료 티어)  
- [ ] 프로모 영상·대용량 mp4는 CDN/오브젝트 스토리지 권장 (용량 과다 시 빌드 실패)  
- [ ] CORS: web 도메인만 API 허용  

---

## Cursor 클라우드와의 관계

Cursor Origin 호스팅은 **코드 백업**에 가깝고, 방문자용 공개 웹 URL은 아니다.  
사람들에게 보여줄 “클릭 링크”는 **Railway/Vercel 등 런타임 URL**이어야 한다.

---

## 요약 표

| 방법 | 재설계 | 난이도 | 상시 링크 | 실기능 |
|------|--------|--------|-----------|--------|
| A Railway 풀스택 | 거의 없음 | 중 | 좋음 | 최고 |
| B DEMO_MODE + Vercel | 소량 | 하 | 최고 | 데모 |
| C Neon+Vercel+API | 소~중 | 중 | 좋음 | 높음 |
| D 비공개 데모 | 없음 | 하 | 초청만 | 높음 |

**추천:** 당장 보여주려면 **A**. 비용·속도를 최우선이면 **B**를 다음에 추가.
