#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:3000}"
MAX_TRIES="${MAX_TRIES:-30}"
SLEEP_SECONDS="${SLEEP_SECONDS:-1}"

echo "[wait] aguardando $BASE/health"

for i in $(seq 1 "$MAX_TRIES"); do
  if curl -fsS "$BASE/health" >/tmp/yourvoice-health.out 2>/tmp/yourvoice-health.err; then
    cat /tmp/yourvoice-health.out
    echo
    echo "[ok] health ready"
    exit 0
  fi

  echo "[wait] tentativa $i/$MAX_TRIES"
  sleep "$SLEEP_SECONDS"
done

echo "[fail] health não respondeu em $BASE/health"
echo "[debug] último erro curl:"
cat /tmp/yourvoice-health.err || true
exit 1
