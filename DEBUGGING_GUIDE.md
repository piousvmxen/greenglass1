# 🐛 دليل Debugging - GREEN GLASS

## المشكلة الحالية
- ❌ 404 عند الوصول إلى `/dashboard` مباشرة
- ❌ Failed to load resource: 404 في console
- ❌ Not Found على الصفحة

---

## ✅ الإصلاحات المطبقة

### 1. إصلاح Client-Side Routing

تم إضافة ملفات لإعادة التوجيه:
- ✅ `frontend/public/_redirects` - لـ Netlify/Render
- ✅ `frontend/public/vercel.json` - لـ Vercel
- ✅ `frontend/public/render.json` - لـ Render

**كيف يعمل:**
عندما يذهب المستخدم إلى `/dashboard` مباشرة، الخادم يعيد توجيهه إلى `index.html`، ثم React Router يتولى الأمر.

---

### 2. إضافة Debugging Logs

#### Frontend (Browser Console):
- ✅ **🚀 API Request** - كل طلب API
- ✅ **✅ API Response** - كل استجابة ناجحة
- ✅ **❌ API Error** - كل خطأ
- ✅ **🔐 Login/Register** - محاولات تسجيل الدخول والتسجيل
- ✅ **🔄 Redirects** - إعادة التوجيه

#### Backend (Server Console):
- ✅ **📝 Registration** - طلبات التسجيل
- ✅ **🔐 Login** - طلبات تسجيل الدخول
- ✅ **🔍 GET /me** - طلبات جلب المستخدم
- ✅ **❌ Errors** - جميع الأخطاء

---

### 3. إصلاح API Base URL

تم إضافة:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://greenglass-backend.onrender.com' : 'http://localhost:5000')
axios.defaults.baseURL = API_URL
```

---

## 🔍 كيفية استخدام Debugging

### في Browser Console:

1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ستجد logs مثل:

```
🚀 API Request: { method: 'POST', url: '/api/auth/login', ... }
✅ API Response: { status: 200, data: {...} }
🔐 Attempting login for: user@example.com
✅ Login successful: {...}
🔄 Redirecting to /dashboard
```

### في Server Console (Render):

1. اذهب إلى Render Dashboard
2. اختر Backend Service
3. اضغط **Logs**
4. ستجد logs مثل:

```
📝 Registration request received: { email: '...', name: '...' }
✅ User created successfully: ...
🔐 Login request received for: user@example.com
✅ User found: ...
✅ Password verified
✅ Token generated for user: ...
```

---

## 🛠️ حل المشاكل الشائعة

### المشكلة 1: 404 على `/dashboard`

**السبب:** Static Site لا يدعم client-side routing

**الحل:**
1. تأكد من وجود `_redirects` في `frontend/public/`
2. أعد بناء Frontend
3. في Render، تأكد من أن Static Site يعيد توجيه جميع المسارات إلى `index.html`

---

### المشكلة 2: Failed to load resource: 404

**السبب:** API URL غير صحيح

**الحل:**
1. تحقق من `VITE_API_URL` في Render Environment Variables
2. يجب أن يكون: `https://greenglass-backend.onrender.com`
3. افتح Console وستجد logs توضح URL المستخدم

---

### المشكلة 3: CORS Error

**السبب:** Backend لا يسمح بـ Frontend URL

**الحل:**
1. تحقق من `CLIENT_URL` في Backend Environment Variables
2. يجب أن يكون: `https://greenglass-frontend.onrender.com`
3. أعد تشغيل Backend

---

## 📋 Checklist للتحقق

### Frontend:
- [ ] `_redirects` موجود في `frontend/public/`
- [ ] `VITE_API_URL` مضاف في Render Environment Variables
- [ ] Console logs تظهر الطلبات
- [ ] لا توجد CORS errors

### Backend:
- [ ] `CLIENT_URL` مضاف في Render Environment Variables
- [ ] Server logs تظهر الطلبات
- [ ] `/api/auth/me` يعمل
- [ ] `/api/auth/login` يعمل
- [ ] `/api/auth/register` يعمل

---

## 🔧 Environment Variables المطلوبة

### Frontend (Render):
```
VITE_API_URL=https://greenglass-backend.onrender.com
VITE_SOCKET_URL=https://greenglass-backend.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your-key
```

### Backend (Render):
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
CLIENT_URL=https://greenglass-frontend.onrender.com
```

---

## 📝 مثال Console Output

### عند تسجيل الدخول بنجاح:

**Browser Console:**
```
🚀 API Request: { method: 'POST', url: '/api/auth/login', baseURL: 'https://greenglass-backend.onrender.com', ... }
🔐 Attempting login for: user@example.com
✅ API Response: { status: 200, url: '/api/auth/login', data: {...} }
✅ Login successful: { token: '...', user: {...} }
🔄 Redirecting to /dashboard
```

**Server Console:**
```
🔐 Login request received for: user@example.com
✅ User found: 507f1f77bcf86cd799439011
✅ Password verified
✅ Token generated for user: 507f1f77bcf86cd799439011
```

---

## 🆘 إذا استمرت المشكلة

1. **افتح Browser Console** وانسخ جميع الأخطاء
2. **افتح Server Logs** في Render وانسخ الأخطاء
3. **تحقق من Environment Variables** في Render
4. **تحقق من Network Tab** في Browser DevTools لرؤية الطلبات الفعلية

---

**تاريخ الإنشاء:** 2024
