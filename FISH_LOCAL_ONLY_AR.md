# Fish S2-Pro Local Only

هذه النسخة لا تستخدم Fish API. تم حذف fallback السحابي نهائيًا.

المسار الحالي:

```text
Pro → Whisper turbo → NLLB-200 → Fish Audio S2-Pro local HTTP → MP3 base64 → Chrome Blob audio
```

المطلوب لتشغيل Pro:

1. تشغيل Fish S2-Pro داخل نفس حاوية RunPod.
2. أن يوفر endpoint محلي:

```text
POST http://127.0.0.1:8080/v1/tts
```

3. أن يرجع إما raw audio أو JSON فيه audioBase64/audio_base64/audio/data.

إذا لم يكن Fish المحلي يعمل، سيعمل Fast و Quality، لكن Pro سيفشل برسالة واضحة بدل استخدام API.
