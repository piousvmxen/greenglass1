# 🚀 دليل النشر السريع على Render

## الخطوات الأساسية (5 دقائق)

### 1️⃣ إعداد MongoDB Atlas
```
1. اذهب إلى mongodb.com/cloud/atlas
2. أنشئ حساب مجاني
3. أنشئ Cluster
4. اضغط Connect → Connect your application
5. انسخ الرابط واستبدل <password> وأضف /greenglass في النهاية
```

### 2️⃣ نشر Backend
```
1. Render Dashboard → New → Web Service
2. اربط GitHub repo
3. Name: greenglass-backend
4. Build: cd backend && npm install
5. Start: cd backend && node server.js
6. أضف Environment Variables:
   - MONGODB_URI: (من MongoDB Atlas)
   - JWT_SECRET: (أي نص عشوائي طويل)
   - CLIENT_URL: (سنضيفه بعد نشر Frontend)
   - NODE_ENV: production
   - PORT: 5000
```

### 3️⃣ نشر Frontend
```
1. Render Dashboard → New → Static Site
2. اربط نفس GitHub repo
3. Name: greenglass-frontend
4. Build: cd frontend && npm install && npm run build
5. Publish: frontend/dist
6. أضف Environment Variables:
   - VITE_GOOGLE_MAPS_API_KEY: (من Google Cloud)
   - VITE_SOCKET_URL: (رابط Backend من Render)
```

### 4️⃣ تحديث CLIENT_URL
```
1. انسخ رابط Frontend من Render
2. اذهب إلى Backend Environment Variables
3. حدث CLIENT_URL برابط Frontend
4. Render سيعيد التشغيل تلقائياً
```

### 5️⃣ إنشاء حساب المدير (تلقائي!)
```
✅ المدير يُنشأ تلقائياً عند بدء الخادم!

البيانات الافتراضية:
- Email: admin@greenglass.com
- Password: admin123

(اختياري) لتخصيص البيانات، أضف في Backend Environment Variables:
- ADMIN_EMAIL=your-admin@email.com
- ADMIN_PASSWORD=your-secure-password

⚠️ غيّر كلمة المرور بعد أول تسجيل دخول!
```

## ✅ تم!

افتح رابط Frontend واختبر التطبيق.

---

**ملاحظة:** Free Plan قد ينام بعد 15 دقيقة. استخدم UptimeRobot لإبقائه نشطاً.
