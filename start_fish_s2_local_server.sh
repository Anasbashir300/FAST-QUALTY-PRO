#!/usr/bin/env bash
set -euo pipefail

# One Click Dub never calls Fish API in this build.
# This script starts a LOCAL Fish-compatible HTTP TTS server that accepts POST /v1/tts.
# Because Fish S2-Pro serving commands can change between official releases, this is configurable.

export OCD_FISH_LOCAL_HOST="${OCD_FISH_LOCAL_HOST:-127.0.0.1}"
export OCD_FISH_LOCAL_PORT="${OCD_FISH_LOCAL_PORT:-8080}"
export OCD_FISH_LOCAL_URL="${OCD_FISH_LOCAL_URL:-http://${OCD_FISH_LOCAL_HOST}:${OCD_FISH_LOCAL_PORT}/v1/tts}"

if [[ -n "${OCD_FISH_SERVER_COMMAND:-}" ]]; then
  echo "[OCD] Running custom Fish server command: ${OCD_FISH_SERVER_COMMAND}"
  exec bash -lc "${OCD_FISH_SERVER_COMMAND}"
fi

cat >&2 <<'EOF'
[OCD] ERROR: OCD_START_FISH_SERVER=1 was set, but OCD_FISH_SERVER_COMMAND is empty.
Fish S2-Pro must run locally, not through Fish API.
Set OCD_FISH_SERVER_COMMAND to the official Fish/SGLang/vLLM server command that exposes POST /v1/tts.
Example placeholder:
  OCD_FISH_SERVER_COMMAND='cd /opt/fish-speech && <official Fish S2-Pro server command> --host 127.0.0.1 --port 8080'
EOF
exit 64
