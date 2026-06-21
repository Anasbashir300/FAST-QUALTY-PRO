# One Click Dub - RunPod Serverless RTX 3090 image
# Build target: worker that receives /run jobs and returns final MP3 as base64.
# Fish S2-Pro is LOCAL ONLY. No Fish API is used.

ARG BASE_IMAGE=pytorch/pytorch:2.4.1-cuda12.4-cudnn9-runtime
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/runpod-volume/huggingface \
    TRANSFORMERS_CACHE=/runpod-volume/huggingface \
    XDG_CACHE_HOME=/runpod-volume/.cache \
    OCD_ROOT=/runpod-volume/one-click-dub \
    OCD_SERVERLESS_OUTPUT_BASE64=1 \
    OCD_FISH_TTS_MODE=local-http \
    OCD_FISH_LOCAL_URL=http://127.0.0.1:8080/v1/tts \
    OCD_START_FISH_SERVER=0

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git git-lfs curl wget ca-certificates nodejs npm build-essential \
    libsndfile1 espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# YouTube extraction needs an external JS runtime for yt-dlp EJS/n-challenges.
# RunPod builds sometimes fail on the Deno install script, so this image uses apt nodejs
# plus the Python yt-dlp-ejs package and passes --js-runtimes node:/usr/bin/node.
ENV OCD_YTDLP_JS_RUNTIME=node:/usr/bin/node \
    OCD_YTDLP_REMOTE_EJS=1 \
    OCD_YTDLP_REMOTE_COMPONENTS=ejs:github

WORKDIR /app
COPY requirements_runpod_serverless.txt /app/requirements_runpod_serverless.txt
RUN python -m pip install -U pip wheel setuptools packaging && \
    python -m pip install -r /app/requirements_runpod_serverless.txt

# Optional Fish source checkout. The actual local server command is configured via
# OCD_FISH_SERVER_COMMAND because Fish S2-Pro serving commands may change upstream.
RUN git clone --depth=1 https://github.com/fishaudio/fish-speech.git /opt/fish-speech || true

COPY . /app
RUN chmod +x /app/start_runpod_worker.sh /app/start_fish_s2_local_server.sh && \
    python -m py_compile /app/colab_custom_dub_server.py /app/runpod_handler.py /app/handler.py

CMD ["/app/start_runpod_worker.sh"]
