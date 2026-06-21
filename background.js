try { if (typeof globalThis.g === "undefined") globalThis.g = globalThis; } catch {}
var g = globalThis;

// One Click Dub - RunPod Serverless mode.
// 1) Put your endpoint id and API key here.
// 2) Reload the extension from chrome://extensions.
// SECURITY: Do not publish this extension publicly with your RunPod API key inside it.
const RUNPOD_ENDPOINT_ID = "PUT_YOUR_RUNPOD_ENDPOINT_ID_HERE";
const RUNPOD_API_KEY = "PUT_YOUR_RUNPOD_API_KEY_HERE";
const RUNPOD_API_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`;

const LOCAL_SERVER_BASE = "https://one-click-dub-fast-server.onrender.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OCD_GET_YOUTUBE_COOKIES") {
    getYoutubeCookieString()
      .then(cookieString => sendResponse({ ok: true, cookieString }))
      .catch(error => sendResponse({ ok: false, error: error?.message || String(error), cookieString: "" }));
    return true;
  }

  if (message?.type === "OCD_GET_SITE_COOKIES") {
    getCookieStringForUrl(message.url || sender?.tab?.url || "")
      .then(cookieString => sendResponse({ ok: true, cookieString }))
      .catch(error => sendResponse({ ok: false, error: error?.message || String(error), cookieString: "" }));
    return true;
  }

  if (message?.type === "OCD_FAST_FREE_PREPARE_BATCH") {
    postLocal("/api/fast/prepare-batch", message.payload || {})
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error?.message || String(error), source: "local-server" }));
    return true;
  }

  if (message?.type === "OCD_FAST_EDGE_DUB") {
    postLocal("/api/fast/sample", message.payload || {})
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error?.message || String(error), source: "local-server" }));
    return true;
  }

  if (message?.type === "OCD_PVT_START_JOB") {
    runpodStartJob(message.payload || {})
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error?.message || String(error), source: "runpod-serverless" }));
    return true;
  }

  if (message?.type === "OCD_PVT_JOB_STATUS") {
    runpodJobStatus(message.jobId || "")
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error?.message || String(error), source: "runpod-serverless" }));
    return true;
  }
});

function assertRunpodConfigured() {
  if (!RUNPOD_ENDPOINT_ID || RUNPOD_ENDPOINT_ID.includes("PUT_YOUR")) {
    throw new Error("RunPod Endpoint ID is not configured in background.js");
  }
  if (!RUNPOD_API_KEY || RUNPOD_API_KEY.includes("PUT_YOUR")) {
    throw new Error("RunPod API key is not configured in background.js");
  }
}

async function runpodStartJob(payload) {
  assertRunpodConfigured();
  const res = await fetch(`${RUNPOD_API_BASE}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RUNPOD_API_KEY}`
    },
    body: JSON.stringify({ input: payload })
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `RunPod /run failed HTTP ${res.status}`);
  const jobId = data?.id || data?.jobId;
  if (!jobId) throw new Error(`RunPod /run did not return job id: ${JSON.stringify(data).slice(0, 500)}`);
  return { ok: true, jobId, runpodStatus: data.status || "IN_QUEUE", service: "runpod-serverless" };
}

async function runpodJobStatus(jobId) {
  assertRunpodConfigured();
  if (!jobId) throw new Error("Missing RunPod job id");
  const res = await fetch(`${RUNPOD_API_BASE}/status/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${RUNPOD_API_KEY}` }
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `RunPod /status failed HTTP ${res.status}`);

  const st = String(data.status || "").toUpperCase();
  if (st === "COMPLETED") {
    const out = data.output || {};
    if (out.ok === false) {
      return { ok: false, status: "error", progress: 100, error: out.error || out.message || "RunPod job failed", message: out.message || out.error || "RunPod job failed", service: "runpod-serverless" };
    }
    return {
      ok: true,
      status: "done",
      progress: 100,
      message: out.message || "Done · MP3 returned from RunPod Serverless",
      outputKind: out.outputKind || "audio-base64",
      audioBase64: out.audioBase64 || "",
      mimeType: out.mimeType || "audio/mpeg",
      audioBytes: out.audioBytes || 0,
      modelName: out.modelName,
      ttsBackend: out.ttsBackend,
      voiceClone: out.voiceClone,
      service: "runpod-serverless"
    };
  }
  if (st === "FAILED" || st === "CANCELLED" || st === "TIMED_OUT") {
    const err = data.error || data.output?.error || data.output?.message || `RunPod job ${st}`;
    return { ok: false, status: "error", progress: 100, error: err, message: err, service: "runpod-serverless" };
  }
  const progress = st === "IN_PROGRESS" ? 50 : 10;
  return { ok: true, status: st.toLowerCase() || "queued", progress, message: `RunPod ${st || "queued"}`, service: "runpod-serverless" };
}

async function parseJsonResponse(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

async function postLocal(path, payload) {
  const res = await fetch(LOCAL_SERVER_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await parseJsonResponse(res);
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Local server failed: HTTP ${res.status}`);
  return data;
}

async function getYoutubeCookieString() {
  if (!chrome.cookies?.getAll) return "";
  const domains = [".youtube.com", "youtube.com", "www.youtube.com", ".google.com", "google.com"];
  const map = new Map();
  for (const domain of domains) {
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      for (const c of cookies || []) if (c?.name && typeof c.value === "string") map.set(c.name, c.value);
    } catch {}
  }
  return [...map.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function getCookieStringForUrl(rawUrl) {
  if (!chrome.cookies?.getAll || !rawUrl) return "";
  let url;
  try { url = new URL(rawUrl); } catch { return ""; }
  if (!/^https?:$/.test(url.protocol)) return "";
  const urls = new Set([url.origin + "/", url.href]);
  const map = new Map();
  for (const u of urls) {
    try {
      const cookies = await chrome.cookies.getAll({ url: u });
      for (const c of cookies || []) if (c?.name && typeof c.value === "string") map.set(c.name, c.value);
    } catch {}
  }
  return [...map.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}
