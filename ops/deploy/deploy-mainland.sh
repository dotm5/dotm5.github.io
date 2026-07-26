#!/usr/bin/env bash
set -euo pipefail

SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-}"
SERVER_PATH="${SERVER_PATH:-}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
EXECUTE=false

usage() {
  cat <<'USAGE'
Usage:
  deploy-mainland.sh [--host HOST] [--user USER] [--path PATH] [--keep N] [--execute]

Without --execute the script verifies the site and prints the deployment plan.
Values may also come from SERVER_HOST, SERVER_USER, SERVER_PATH and KEEP_RELEASES.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) SERVER_HOST="$2"; shift 2 ;;
    --user) SERVER_USER="$2"; shift 2 ;;
    --path) SERVER_PATH="$2"; shift 2 ;;
    --keep) KEEP_RELEASES="$2"; shift 2 ;;
    --execute) EXECUTE=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$SERVER_HOST" || -z "$SERVER_USER" || -z "$SERVER_PATH" ]]; then
  echo "SERVER_HOST, SERVER_USER and SERVER_PATH are required." >&2
  usage
  exit 2
fi

if ! [[ "$KEEP_RELEASES" =~ ^[1-9][0-9]*$ ]]; then
  echo "KEEP_RELEASES must be a positive integer." >&2
  exit 2
fi

corepack pnpm verify

release_id="$(date -u +%Y%m%dT%H%M%SZ)"
release_path="${SERVER_PATH%/}/releases/${release_id}"
target="${SERVER_USER}@${SERVER_HOST}"

echo "Target: ${target}:${release_path}"
echo "Current link: ${SERVER_PATH%/}/current"
echo "Retained releases: ${KEEP_RELEASES}"

if [[ "$EXECUTE" != true ]]; then
  echo "Dry run complete. Re-run with --execute to upload and switch the current link."
  exit 0
fi

ssh "$target" "mkdir -p '$release_path'"
tar -C dist -czf - . | ssh "$target" "tar -xzf - -C '$release_path'"
ssh "$target" "test -f '$release_path/index.html' && test -f '$release_path/404.html'"
ssh "$target" "ln -sfn '$release_path' '${SERVER_PATH%/}/current'"
ssh "$target" "ls -1dt '${SERVER_PATH%/}/releases/'* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf --"

echo "Deployment complete: ${release_id}"
