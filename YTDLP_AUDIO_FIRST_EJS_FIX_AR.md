# إصلاح yt-dlp النهائي — Audio First + Remote EJS

هذه النسخة لا تستخدم الأمر القديم:

```bash
-f bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best --merge-output-format mp4
```

بل تستخدم تحميل الصوت فقط:

```bash
-f ba[ext=m4a]/bestaudio[ext=m4a]/bestaudio/best
```

وتضيف:

```bash
--remote-components ejs:github
```

ولا تمرر Cookies كـ header. إذا ظهر في اللوج `--add-header Cookie:` أو `input.mp4` فهذا يعني أنك ما زلت تشغل ملف سيرفر قديم أو لم تعيد تشغيل uvicorn بعد رفع الملف الجديد.

تأكد من `/health`، يجب أن يظهر:

```json
"fixVersion": "2026-06-17-ytdlp-audio-first-ejs-mp3-blob-safe"
```
