# 🔐 أين تجد JWT_SECRET؟

## 📍 الموقع الحالي
أنت تعمل في: `C:\Users\moham\OneDrive\Bureau\greenglass\greenglass`

---

## ✅ JWT_SECRET يجب أن يكون في:

### ملف `.env` في جذر المشروع:
```
C:\Users\moham\OneDrive\Bureau\greenglass\greenglass\.env
```

---

## 🚀 كيفية إنشاء JWT_SECRET:

### الطريقة 1: استخدام الملف المساعد (الأسهل)

في Terminal، من مجلد المشروع:
```bash
node generate-jwt-secret.js
```

سيطبع لك مفتاح عشوائي آمن. انسخه وأضفه لملف `.env`.

---

### الطريقة 2: استخدام Node.js مباشرة

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 مثال ملف .env:

افتح أو أنشئ ملف `.env` في:
```
C:\Users\moham\OneDrive\Bureau\greenglass\greenglass\.env
```

وأضف:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/greenglass

# JWT Secret (64+ characters)
JWT_SECRET=your-generated-secret-here-min-64-characters

# Server
PORT=5000
NODE_ENV=development

# Client
CLIENT_URL=http://localhost:5173
```

---

## ⚠️ ملاحظات مهمة:

1. ✅ ملف `.env` موجود في `.gitignore` (لن يُرفع على Git)
2. ✅ استخدم مفتاح قوي (64+ حرف)
3. ❌ لا تشارك JWT_SECRET أبداً
4. ❌ لا ترفعه على GitHub

---

## 🔍 التحقق:

بعد إضافة JWT_SECRET في `.env`، تأكد من:
- ✅ الملف موجود في: `C:\Users\moham\OneDrive\Bureau\greenglass\greenglass\.env`
- ✅ السطر `JWT_SECRET=...` موجود في الملف
- ✅ المفتاح طويل (64+ حرف)

---

## 📋 الخطوات السريعة:

1. افتح Terminal في: `C:\Users\moham\OneDrive\Bureau\greenglass\greenglass`
2. شغّل: `node generate-jwt-secret.js`
3. انسخ المفتاح المطبوع
4. افتح أو أنشئ ملف `.env` في نفس المجلد
5. أضف: `JWT_SECRET=المفتاح_المنسوخ`
6. احفظ الملف

---

**جاهز!** 🎉
