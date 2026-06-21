# إصلاح فشل بناء RunPod بسبب Deno

الخطأ كان من هذا السطر في Dockerfile:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

في بيئة build الخاصة بـ RunPod قد يفشل هذا السكربت الخارجي. لذلك تم حذفه.

التعديل الجديد يستخدم:

- `nodejs` من apt كـ JavaScript runtime.
- `yt-dlp-ejs` من pip.
- تمرير `--js-runtimes node:/usr/bin/node` إلى yt-dlp.
- استمرار استخدام `--remote-components ejs:github` عند توفره.

بهذا لا يعتمد البناء على سكربت Deno الخارجي.
