# CloudFront & 캐시 무효화

캠페인 **게시** 시 API가 CloudFront 캐시 무효화와 Next.js ISR revalidate를 자동 호출합니다.

## 아키텍처

```
Admin 게시 → API publishCampaign()
              ├─ CloudFront CreateInvalidation (선택)
              └─ POST /api/revalidate?secret=...&slug=...
                    └─ Next.js revalidatePath(/c/{slug})
```

## 환경 변수

### API 서버

```env
CLOUDFRONT_DISTRIBUTION_ID=E1234ABCDEF
AWS_REGION=ap-northeast-2
CDN_PATH_PREFIX=/media          # 선택: 미디어 경로 prefix
WEB_REVALIDATE_URL=https://your-site.com/api/revalidate
REVALIDATE_SECRET=long-random-string
```

`CLOUDFRONT_DISTRIBUTION_ID`가 없으면 CDN 무효화는 건너뜁니다.

### Web (Next.js)

```env
REVALIDATE_SECRET=long-random-string   # API와 동일 값
```

### Admin / Web (선택)

```env
NEXT_PUBLIC_CDN_URL=https://d1234.cloudfront.net
NEXT_PUBLIC_WEB_URL=https://your-site.com
```

## 무효화 경로

게시 시 다음 경로가 무효화됩니다:

- `/c/{slug}`
- `/c/{slug}/*`
- `/api/v1/public/campaigns/{slug}`
- `{CDN_PATH_PREFIX}/{slug}/*` (설정 시)

## IAM 권한

API 서버 IAM 역할에 최소 권한:

```json
{
  "Effect": "Allow",
  "Action": "cloudfront:CreateInvalidation",
  "Resource": "arn:aws:cloudfront::*:distribution/E1234ABCDEF"
}
```

## 로컬 개발

로컬에서는 CloudFront 없이 동작합니다. ISR revalidate 테스트:

```bash
REVALIDATE_SECRET=dev-secret pnpm dev:web
curl -X POST "http://localhost:3000/api/revalidate?secret=dev-secret&slug=riverside"
```

## 트러블슈팅

| 증상 | 확인 |
|------|------|
| CDN 무효화 skipped | `CLOUDFRONT_DISTRIBUTION_ID` 설정 여부 |
| revalidate 실패 | `REVALIDATE_SECRET` API/Web 동일 여부, `WEB_REVALIDATE_URL` 접근 가능 여부 |
| 이미지가 갱신 안 됨 | S3 객체 키 변경 vs 동일 키 덮어쓰기 — variants는 새 UUID 키 사용 |
