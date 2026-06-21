#!/usr/bin/env bash
set -euo pipefail
mkdir -p "${OCD_ROOT:-/runpod-volume/one-click-dub}"
export OCD_SERVERLESS_OUTPUT_BASE64="${OCD_SERVERLESS_OUTPUT_BASE64:-1}"
export OCD_FISH_TTS_MODE="${OCD_FISH_TTS_MODE:-local-http}"
export OCD_FISH_LOCAL_URL="${OCD_FISH_LOCAL_URL:-http://127.0.0.1:8080/v1/tts}"

# Optional: start a local Fish S2-Pro HTTP server in the same container.
# Set OCD_START_FISH_SERVER=1 and provide OCD_FISH_SERVER_COMMAND if your Fish install uses a different command.
if [[ "${OCD_START_FISH_SERVER:-0}" == "1" ]]; then
  echo "[OCD] Starting local Fish S2-Pro server..."
  bash /app/start_fish_s2_local_server.sh &
  sleep "${OCD_FISH_SERVER_WARMUP_SEC:-10}"
fi

exec python /app/runpod_handler.py
