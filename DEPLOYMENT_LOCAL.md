# 🚀 دليل النشر المحلي - GlassCycle

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:

1. **Node.js** (الإصدار 18 أو أحدث)
   - تحميل من: https://nodejs.org/
   - التحقق من التثبيت: `node --version`

2. **MongoDB** (الإصدار 4.4 أو أحدث)
   - تحميل من: https://www.mongodb.com/try/download/community
   - أو استخدام MongoDB Atlas (سحابي مجاني): https://www.mongodb.com/cloud/atlas

3. **Google Maps API Key** (اختياري للخرائط)
   - الحصول على مفتاح من: https://console.cloud.google.com/
   - تفعيل: Maps JavaScript API

---

## خطوات النشر المحلي

### 1. تثبيت التبعيات

افتح Terminal/PowerShell في مجلد المشروع وقم بتشغيل:

```bash
npm run install-all
```

هذا الأمر سيقوم بتثبيت:
- تبعيات Backend (في المجلد الرئيسي)
- تبعيات Frontend (في مجلد frontend)

### 2. إعداد ملفات البيئة (.env)

تم إنشاء ملفات `.env` تلقائياً. قم بتعديلها:

#### ملف Backend (`.env` في المجلد الرئيسي):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/glasscycle
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**ملاحظات مهمة:**
- `MONGODB_URI`: إذا كنت تستخدم MongoDB Atlas، استبدل الرابط برابط الاتصال الخاص بك
- `JWT_SECRET`: غيّر هذا إلى مفتاح سري قوي في الإنتاج
- `GOOGLE_MAPS_API_KEY`: أضف مفتاح Google Maps API الخاص بك

#### ملف Frontend (`.env` في مجلد `frontend/`):

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**ملاحظة:** استخدم نفس مفتاح Google Maps API هنا

### 3. تشغيل MongoDB

#### إذا كنت تستخدم MongoDB محلي:

```bash
# Windows (إذا كان MongoDB مثبت كخدمة، سيبدأ تلقائياً)
# أو شغّل يدوياً:
mongod
```

#### إذا كنت تستخدم MongoDB Atlas:

- لا حاجة لتشغيل أي شيء
- فقط تأكد من تحديث `MONGODB_URI` في ملف `.env`

### 4. تشغيل المشروع

في Terminal/PowerShell، من المجلد الرئيسي للمشروع:

```bash
npm run dev
```

هذا الأمر سيقوم بتشغيل:
- **Backend** على: http://localhost:5000
- **Frontend** على: http://localhost:5173

---

## الوصول للتطبيق

بعد تشغيل المشروع:

1. افتح المتصفح واذهب إلى: **http://localhost:5173**
2. سترى الصفحة الرئيسية للتطبيق
3. يمكنك التسجيل كـ:
   - **مستخدم عادي** (User): لإنشاء طلبات جمع
   - **جامع** (Collector): لقبول وإكمال طلبات الجمع
   - **مدير** (Admin): لإدارة النظام

---

## إنشاء حساب مدير

لإنشاء حساب مدير، يمكنك:

### الطريقة 1: من خلال MongoDB

1. افتح MongoDB Compass أو mongo shell
2. ابحث عن قاعدة البيانات `glasscycle`
3. في مجموعة `users`، أنشئ مستند جديد:

```json
{
  "name": "Admin",
  "email": "admin@glasscycle.com",
  "password": "$2a$10$..." // كلمة مرور مشفرة
  "role": "admin"
}
```

### الطريقة 2: من خلال التسجيل ثم التعديل

1. سجّل حساب جديد من الواجهة
2. افتح MongoDB وعدّل `role` إلى `"admin"`

---

## استكشاف الأخطاء

### خطأ: MongoDB Connection Failed

**الحل:**
- تأكد من تشغيل MongoDB محلياً
- أو تحقق من صحة `MONGODB_URI` في ملف `.env`
- تأكد من أن MongoDB يستمع على المنفذ 27017

### خطأ: Port Already in Use

**الحل:**
- Backend (5000): غيّر `PORT` في ملف `.env`
- Frontend (5173): غيّر المنفذ في `frontend/vite.config.js`

### خطأ: Google Maps Not Loading

**الحل:**
- تأكد من إضافة `VITE_GOOGLE_MAPS_API_KEY` في `frontend/.env`
- تأكد من تفعيل Maps JavaScript API في Google Cloud Console
- تحقق من أن المفتاح صحيح

### خطأ: Module Not Found

**الحل:**
```bash
# أعد تثبيت التبعيات
npm run install-all
```

### خطأ: CORS Error

**الحل:**
- تأكد من أن `CLIENT_URL` في ملف `.env` يطابق عنوان Frontend
- الافتراضي: `http://localhost:5173`

---

## الأوامر المفيدة

```bash
# تثبيت التبعيات
npm run install-all

# تشغيل المشروع (Backend + Frontend)
npm run dev

# تشغيل Backend فقط
npm run server

# تشغيل Frontend فقط
npm run client

# بناء Frontend للإنتاج
cd frontend
npm run build
```

---

## البنية الأساسية

```
greenglass/
├── backend/
│   ├── models/          # نماذج قاعدة البيانات
│   ├── routes/          # مسارات API
│   ├── middleware/      # Middleware (مثل auth)
│   └── server.js        # نقطة دخول Backend
├── frontend/
│   ├── src/
│   │   ├── pages/       # صفحات React
│   │   ├── components/ # مكونات React
│   │   ├── context/     # React Context
│   │   └── App.jsx      # المكون الرئيسي
│   └── package.json
├── .env                 # متغيرات بيئة Backend
├── package.json         # تبعيات المشروع الرئيسية
└── README.md
```

---

## نصائح للتطوير

1. **Hot Reload**: كل من Backend و Frontend يدعمان Hot Reload تلقائياً
2. **Console Logs**: راقب Terminal لرؤية الأخطاء والرسائل
3. **MongoDB Compass**: استخدم MongoDB Compass لتصفح قاعدة البيانات
4. **React DevTools**: ثبت React DevTools Extension للمتصفح

---

## الخطوات التالية

بعد النشر المحلي الناجح:

1. ✅ اختبر جميع الميزات
2. ✅ أنشئ حساب مدير
3. ✅ اختبر إنشاء طلبات الجمع
4. ✅ اختبر نظام الرسائل
5. ✅ اختبر الخريطة التفاعلية

---

## الدعم

إذا واجهت أي مشاكل:

1. تحقق من ملفات `.env`
2. تأكد من تثبيت جميع التبعيات
3. تحقق من تشغيل MongoDB
4. راجع رسائل الخطأ في Terminal

**استمتع بتطوير GlassCycle! 🌱♻️**
