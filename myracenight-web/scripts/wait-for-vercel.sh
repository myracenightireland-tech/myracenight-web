#!/usr/bin/env bash
# Wait for the newest Vercel PRODUCTION deployment of this project to be READY.
#
# Polls `vercel ls --prod` every 15s for the newest deployment URL, then reads
# its actual state with `vercel inspect <url>` (the ls table's status column is
# colour-coded and unreliable to grep - inspect's status line is not).
#
# Usage:
#   scripts/wait-for-vercel.sh [previous-deployment-url]
#
#   previous-deployment-url  Optional. A deployment URL to wait PAST: while the
#                            newest production row still equals it, keep
#                            polling until the new deployment appears. Without
#                            it, the current newest deployment is checked.
#
# Environment:
#   VERCEL_ORG_ID / VERCEL_PROJECT_ID  Vercel CLI auth context (required when
#                                      the repo is not `vercel link`ed).
#   VERCEL_PROJECT                     Project name (default: myracenight-web).
#   WAIT_FOR_VERCEL_TIMEOUT            Seconds before giving up (default: 300).
#
# Exit codes: 0 = READY, 1 = ERROR/CANCELED deployment, 2 = timeout.

set -u

PROJECT="${VERCEL_PROJECT:-myracenight-web}"
PREV="${1:-}"
TIMEOUT="${WAIT_FOR_VERCEL_TIMEOUT:-300}"
DEADLINE=$(( $(date +%s) + TIMEOUT ))
INTERVAL=15

strip_ansi() {
  sed 's/\x1b\[[0-9;]*m//g'
}

log() {
  echo "[wait-for-vercel $(date -u +%H:%M:%S)] $*"
}

while true; do
  URL=$(vercel ls "$PROJECT" --prod --yes 2>/dev/null | strip_ansi \
    | grep -oE 'https://[^[:space:]]+\.vercel\.app' | head -1)

  if [ -z "$URL" ]; then
    log "no production deployment listed yet"
  elif [ -n "$PREV" ] && [ "$URL" = "$PREV" ]; then
    log "newest is still the previous deployment ($URL) - waiting for a new one"
  else
    # NB: vercel inspect writes its report to stderr, hence 2>&1
    STATUS=$(vercel inspect "$URL" 2>&1 | strip_ansi \
      | awk '/^[[:space:]]*status/ { $1=""; print tolower($0) }' | tr -d ' ●')
    log "newest: $URL status: ${STATUS:-unknown}"
    case "$STATUS" in
      *ready*)
        log "READY: $URL"
        exit 0
        ;;
      *error*|*canceled*)
        log "DEPLOYMENT FAILED ($STATUS): $URL"
        exit 1
        ;;
    esac
  fi

  if [ "$(date +%s)" -ge "$DEADLINE" ]; then
    log "TIMEOUT after ${TIMEOUT}s"
    exit 2
  fi
  sleep "$INTERVAL"
done
