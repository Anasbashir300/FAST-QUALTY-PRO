# إعداد الإضافة للاتصال بـ RunPod Serverless

افتح `background.js` وضع:

```javascript
const RUNPOD_ENDPOINT_ID = "xxxx";
const RUNPOD_API_KEY = "rpa_xxxx";
```

ثم:

1. افتح `chrome://extensions`
2. اضغط Reload على الإضافة
3. حدّث صفحة الفيديو
4. اختر النموذج المطلوب من Popup
5. اضغط Dub

ملاحظة أمنية: مفتاح RunPod داخل الإضافة ظاهر لمن يملك ملفاتها. لا تستخدم هذا الأسلوب في نسخة عامة للعملاء.
