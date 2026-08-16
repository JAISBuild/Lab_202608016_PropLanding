# PropLanding — 장애 복구 Runbook (Phase 7)

## RPO / RTO 목표

| 항목 | 목표 |
|------|------|
| RPO | ≤ 1시간 |
| RTO | ≤ 4시간 |

## 일상 백업

```bash
export DATABASE_URL="postgresql://proplanding:proplanding@localhost:5432/proplanding"
bash scripts/backup-db.sh
```

## DB 복구

```bash
psql "$DATABASE_URL" < backups/proplanding_YYYYMMDD_HHMMSS.sql
pnpm db:migrate
```

## API 장애

1. `curl http://localhost:4000/health` — 프로세스 확인
2. `curl http://localhost:4000/ready` — DB 연결 확인
3. PostgreSQL 재시작: `docker compose restart postgres` 또는 `sudo service postgresql restart`
4. API 재시작: `pnpm dev:api`

## 헬스체크 실패 시

- **503 /ready**: DB 다운 → Postgres 복구 후 API 재시작
- **429**: Rate limit → 1분 대기 또는 IP 확인

## 포스트모템

장애 해결 후 `docs/ops/incidents/` 에 날짜·원인·조치·재발방지 기록
