# دليل النشر على Render - GREEN GLASS

## 📋 المتطلبات الأساسية

1. حساب على [Render.com](https://render.com)
2. حساب MongoDB Atlas (مجاني)
3. Google Maps API Key

---

## 🚀 خطوات النشر

### 1. إعداد MongoDB Atlas

1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. أنشئ حساب مجاني
3. أنشئ Cluster جديد
4. اضغط على **Connect** → **Connect your application**
5. انسخ رابط الاتصال (سيبدو مثل: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. استبدل `<password>` بكلمة المرور
7. أضف قاعدة البيانات في النهاية: `mongodb+srv://...@cluster.mongodb.net/greenglass`

---

### 2. إعداد Backend على Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط **New** → **Web Service**
3. اربط مستودع GitHub الخاص بك
4. اختر المستودع `greenglass`
5. املأ الإعدادات:
   - **Name:** `greenglass-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
   - **Plan:** `Free`

6. اضغط **Advanced** وأضف Environment Variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenglass
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
CLIENT_URL=https://greenglass-frontend.onrender.com
```

7. اضغط **Create Web Service**

---

### 3. إعداد Frontend على Render

1. في Render Dashboard، اضغط **New** → **Static Site**
2. اربط نفس المستودع
3. املأ الإعدادات:
   - **Name:** `greenglass-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

4. أضف Environment Variables:

```
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_SOCKET_URL=https://greenglass-backend.onrender.com
VITE_API_URL=https://greenglass-backend.onrender.com
```

**ملاحظة مهمة:** `VITE_API_URL` ضروري للاتصال بـ Backend في الإنتاج!

5. اضغط **Create Static Site**

---

### 4. تحديث CLIENT_URL في Backend

بعد نشر Frontend، ستحصل على رابط مثل: `https://greenglass-frontend.onrender.com`

1. اذهب إلى Backend Service في Render
2. اضغط **Environment**
3. حدث `CLIENT_URL` إلى رابط Frontend الجديد
4. اضغط **Save Changes**
5. Render سيعيد تشغيل الخدمة تلقائياً

---

### 5. تحديث CORS في Backend

تأكد من أن `backend/server.js` يحتوي على:

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
```

---

### 6. إنشاء حساب المدير (تلقائي!)

**✅ لا حاجة لـ Render Shell بعد الآن!**

المدير يُنشأ تلقائياً عند بدء الخادم.

#### بيانات تسجيل الدخول الافتراضية:
```
Email: admin@greenglass.com
Password: admin123
```

#### تخصيص بيانات المدير (اختياري):

أضف في Backend Environment Variables:
```
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
```

**ملاحظة:** غيّر كلمة المرور الافتراضية فوراً بعد أول تسجيل دخول!

#### التحقق من إنشاء المدير:

1. اذهب إلى Backend Service → **Logs**
2. ابحث عن:
   ```
   ✅ Admin user created automatically!
   📧 Admin Credentials: ...
   ```

#### إذا أردت إنشاء مدير يدوياً:

```bash
# محلياً
node create-admin.js
```

---

## 🔧 إعدادات إضافية

### تحديث Google Maps API

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ API Key جديد
3. قيد الاستخدام بـ:
   - HTTP referrers: `https://greenglass-frontend.onrender.com/*`
4. حدث `VITE_GOOGLE_MAPS_API_KEY` في Frontend Environment Variables

---

### إعدادات MongoDB Atlas

1. اذهب إلى **Network Access** في MongoDB Atlas
2. اضغط **Add IP Address**
3. اختر **Allow Access from Anywhere** (0.0.0.0/0)
4. أو أضف IP Render الخاص بك

---

## 📝 ملاحظات مهمة

### Free Plan Limitations:
- ✅ Backend قد ينام بعد 15 دقيقة من عدم الاستخدام
- ✅ Frontend يعمل بشكل مستمر
- ✅ أول طلب بعد النوم قد يستغرق 30-60 ثانية

### حل مشكلة النوم:
- استخدم [UptimeRobot](https://uptimerobot.com) لإرسال طلبات كل 5 دقائق
- أو ترقية إلى Paid Plan

---

## 🔍 اختبار النشر

1. افتح رابط Frontend
2. سجل دخول بحساب المدير
3. اختبر إنشاء طلب
4. اختبر الرسائل
5. اختبر الخريطة

---

## 🐛 حل المشاكل الشائعة

### Backend لا يعمل:
- تحقق من Logs في Render Dashboard
- تأكد من Environment Variables
- تأكد من أن MongoDB URI صحيح

### Frontend لا يتصل بـ Backend:
- تحقق من `VITE_SOCKET_URL`
- تحقق من CORS في Backend
- تأكد من أن Backend يعمل

### رسائل Socket.io لا تعمل:
- تأكد من `CLIENT_URL` في Backend
- تأكد من `VITE_SOCKET_URL` في Frontend
- تحقق من Logs في Backend

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Logs في Render Dashboard
2. تحقق من Environment Variables
3. تأكد من أن جميع الخدمات تعمل

---

**تاريخ الإنشاء:** 2024
**آخر تحديث:** 2024
