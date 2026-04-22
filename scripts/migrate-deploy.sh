#!/usr/bin/env bash
# Vercel/로컬 빌드에서 Prisma migrate deploy 전용 URL 변환.
#
# 배경:
#   프로덕션 DATABASE_URL 은 Supabase Transaction-mode pooler (port 6543 +
#   pgbouncer=true). Prisma migrate 는 prepared statement 를 쓰므로 이 모드
#   에서 hang 됨. 같은 pooler 호스트의 Session-mode(port 5432 + pgbouncer
#   미사용) 로 변환해서 migrate 만 실행. 런타임 DATABASE_URL 은 그대로.
#
# 멱등: 이미 적용된 migration 은 skip — 반복 실행 안전.
# Idempotent 가 아닌 경우(ex. 최초 baseline) 는 수동 resolve 로 처리.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL env var required"
  exit 1
fi

# 6543 → 5432, pgbouncer=true 제거. 이미 5432 면 no-op.
MIGRATE_URL=$(printf '%s' "$DATABASE_URL" \
  | sed 's|:6543/|:5432/|; s|pgbouncer=true&||g; s|&pgbouncer=true||g; s|?pgbouncer=true$||; s|[&?]$||')

DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy
