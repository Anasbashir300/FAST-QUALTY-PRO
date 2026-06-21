# One Click Dub على RunPod Serverless RTX 3090

هذه النسخة تعمل كـ RunPod Serverless Worker وليس كـ Pod عادي ولا تحتاج Cloudflare.

## النماذج المفعلة

- Fast: OpenAI Whisper Large + Google Translate + Edge TTS.
- Quality: Faster-Whisper Medium + NLLB-200 + OmniVoice Auto Clone Per Job.
- Pro: Faster-Whisper Turbo + NLLB-200 + Fish Audio S2-Pro محلي داخل السيرفر فقط.

## مهم قبل التشغيل

هذه النسخة لا تستخدم Fish API نهائيًا. يجب تشغيل Fish S2-Pro كخادم محلي داخل نفس الحاوية، ويجب أن يستقبل طلبات POST على:

```bash
http://127.0.0.1:8080/v1/tts
```

إذا كان أمر تشغيل Fish الرسمي عندك مختلفًا، ضعه في متغير البيئة:

```bash
OCD_FISH_SERVER_COMMAND="cd /opt/fish-speech && <OFFICIAL_FISH_S2_PRO_SERVER_COMMAND> --host 127.0.0.1 --port 8080"
```

ثم فعّل:

```bash
OCD_START_FISH_SERVER=1
```

## 1) ارفع المشروع إلى GitHub

ارفع كل ملفات هذا المجلد إلى repository.

## 2) أنشئ Docker image

استخدم Dockerfile:

```text
Dockerfile.runpod-serverless
```

مثال build محلي:

```bash
docker build -f Dockerfile.runpod-serverless -t YOUR_DOCKERHUB/one-click-dub-runpod:latest .
docker push YOUR_DOCKERHUB/one-click-dub-runpod:latest
```

أو استخدم GitHub build داخل RunPod إذا كان متاحًا عندك.

## 3) إنشاء RunPod Serverless Endpoint

في RunPod:

1. Serverless
2. New Endpoint
3. اختر GPU: RTX 3090
4. ضع Docker image الذي بنيته
5. Container Start Command اتركه فارغًا لأن Dockerfile يستخدم:

```bash
/app/start_runpod_worker.sh
```

## 4) Environment Variables المقترحة

```bash
OCD_ROOT=/runpod-volume/one-click-dub
OCD_SERVERLESS_OUTPUT_BASE64=1
OCD_FAST_WHISPER_MODEL=large
OCD_QUALITY_WHISPER_MODEL=medium
OCD_PRO_WHISPER_MODEL=turbo
OCD_WHISPER_COMPUTE_TYPE=float16
OCD_NLLB_MODEL=facebook/nllb-200-distilled-600M
OCD_NLLB_DTYPE=float16
OCD_NLLB_BEAMS=2
OCD_OMNIVOICE_AUTO_CLONE=1
OCD_FISH_AUTO_CLONE=1
OCD_FISH_MODEL=s2-pro
OCD_FISH_TTS_MODE=local-http
OCD_FISH_LOCAL_URL=http://127.0.0.1:8080/v1/tts
OCD_START_FISH_SERVER=1
OCD_FISH_SERVER_COMMAND=cd /opt/fish-speech && <OFFICIAL_FISH_S2_PRO_SERVER_COMMAND> --host 127.0.0.1 --port 8080
OCD_USE_PUNCTUATION=1
OCD_TTS_PUNCT_PAUSES=1
OCD_DELETE_JOB_TEMP_AFTER_DONE=1
OCD_JOB_TEMP_TTL_SEC=600
OCD_DELETE_OUTPUT_AFTER_TTL=1
OCD_OUTPUT_TTL_SEC=21600
```

## 5) تحديث الإضافة

افتح:

```text
background.js
```

وغيّر:

```javascript
const RUNPOD_ENDPOINT_ID = "PUT_YOUR_RUNPOD_ENDPOINT_ID_HERE";
const RUNPOD_API_KEY = "PUT_YOUR_RUNPOD_API_KEY_HERE";
```

إلى بياناتك من RunPod.

تحذير: لا تنشر الإضافة للعامة وفيها API key. هذا مناسب للاختبار الشخصي فقط. للإنتاج استخدم Proxy backend صغير يخفي المفتاح.

## 6) تثبيت الإضافة في Chrome

افتح:

```text
chrome://extensions
```

ثم:

```text
Developer mode → ON
Load unpacked → اختر مجلد الإضافة
```

## 7) اختبار Health

من RunPod API أرسل job:

```bash
curl -X POST "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run" \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":{"health":true}}'
```

ثم خذ `id` واستعلم:

```bash
curl "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/status/JOB_ID" \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY"
```

يجب أن يظهر في output:

```json
"serverless": true
```

## 8) اختبار فيديو قصير

ابدأ بفيديو YouTube قصير 1-3 دقائق.

- اختر Fast للتأكد أن RunPod يعمل.
- اختر Quality لاختبار OmniVoice.
- اختر Pro لاختبار Fish S2-Pro المحلي.

## 9) كيف تعرف أن Pro يستخدم Fish المحلي وليس API؟

في output أو error يجب أن ترى:

```text
fish-speech-s2-pro
local-http-only
```

إذا ظهر خطأ يقول Fish local server is not reachable، فهذا يعني أن Fish S2-Pro المحلي لم يبدأ، أو أن `OCD_FISH_SERVER_COMMAND` غير صحيح.

## 10) ملاحظة عن الملفات الكبيرة

RunPod Serverless يرجع MP3 كـ Base64 إلى الإضافة. هذا ممتاز للفيديوهات القصيرة والمتوسطة. للفيديوهات الطويلة جدًا الأفضل لاحقًا استخدام S3/R2 لتخزين الصوت النهائي بدل إرجاعه كاملًا داخل status output.
