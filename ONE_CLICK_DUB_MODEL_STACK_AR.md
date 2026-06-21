# One Click Dub Model Stack - RunPod Serverless

النماذج الحالية بعد تحويل RunPod Serverless:

```text
Fast    = OpenAI Whisper Large + Google Translate + Edge TTS
Quality = Faster-Whisper Medium + NLLB-200 + OmniVoice Auto Clone Per Job
Pro     = Faster-Whisper Turbo + NLLB-200 + Fish Audio S2-Pro Local Only
```

Pro لم يعد Preview. يعمل بشرط تشغيل Fish S2-Pro المحلي داخل نفس حاوية RunPod على:

```text
http://127.0.0.1:8080/v1/tts
```

لا يوجد Fish API في هذه النسخة.
