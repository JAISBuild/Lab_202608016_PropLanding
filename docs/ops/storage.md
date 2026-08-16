# 스토리지 & CDN 설정

## Local (기본)

```env
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
API_PUBLIC_URL=http://localhost:4000
```

이미지 업로드 시 **sharp**가 thumb(400px)·medium(800px)·large(1600px) WebP variants를 자동 생성합니다.

## S3 / MinIO

```bash
pnpm docker:up   # postgres + minio 포함
```

```env
STORAGE_DRIVER=s3
S3_BUCKET=proplanding
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_URL=http://localhost:9000/proplanding
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
CDN_URL=http://localhost:9000/proplanding   # 선택
```

### 서명 URL 업로드 (Admin)

```
GET /api/v1/media/upload-url?fileName=hero.jpg&contentType=image/jpeg
Authorization: Bearer <token>
```

## 프로덕션 (AWS S3 + CloudFront)

```env
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket
S3_REGION=ap-northeast-2
CDN_URL=https://d1234.cloudfront.net
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

`S3_ENDPOINT`는 AWS 실서비스에서 생략합니다.
