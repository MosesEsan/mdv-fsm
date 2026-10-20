#!/bin/bash
# Rebuild a scratch database from the migrations and run every pgTAP test file.
# usage: run.sh [repo_dir] [test-file-filter]
set -u
REPO=${1:-$(cd "$(dirname "$0")/../.." && pwd)}; FILTER=${2:-}
H=$(dirname "$0")
export PGHOST=/var/run/postgresql PGUSER=postgres
psql -q -c "drop database if exists fsm_test" -c "create database fsm_test" >/dev/null 2>&1
export PGDATABASE=fsm_test
psql -q -v ON_ERROR_STOP=1 -f "$H/stub.sql" >/dev/null 2>"$H/stub.err" || { echo "STUB FAILED"; cat "$H/stub.err"; exit 1; }
for f in "$REPO"/supabase/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null 2>"$H/mig.err" || { echo "MIGRATION FAILED: $(basename "$f")"; cat "$H/mig.err"; exit 1; }
done
psql -q -v ON_ERROR_STOP=1 -f "$REPO/supabase/seed.sql" >/dev/null 2>"$H/seed.err" || { echo "SEED FAILED"; cat "$H/seed.err"; exit 1; }
total=0; bad=0
for t in "$REPO"/supabase/tests/*${FILTER}*.test.sql; do
  out=$(psql -X -At -v ON_ERROR_STOP=0 -f "$t" 2>&1)
  n=$(echo "$out" | grep -cE '^ok ')
  nb=$(echo "$out" | grep -cE '^not ok ')
  err=$(echo "$out" | grep -E 'ERROR:|Looks like|psql:.*ERROR' | head -5)
  plan=$(echo "$out" | grep -oE '^1\.\.[0-9]+' | head -1 | cut -c4-)
  total=$((total+n));
  if [ "$nb" -gt 0 ] || [ -n "$err" ] || [ "${plan:-0}" != "$((n+nb))" ]; then bad=$((bad+1)); echo "FAIL $(basename "$t"): ok=$n notok=$nb plan=${plan:-?}"; echo "$out" | grep -E '^not ok|#|ERROR' | head -20; else echo "pass $(basename "$t") ($n)"; fi
done
echo "TOTAL ok: $total  failing files: $bad"
