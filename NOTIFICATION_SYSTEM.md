# ✅ نظام الإشعارات - Notification System

## نظرة عامة
تم إضافة نظام إشعارات كامل مع badges في Navbar وإشعارات فورية عبر Socket.io.

---

## الميزات

### 1. أنواع الإشعارات
- ✅ **طلب جديد** (`new_request`) - للجامعين عند إنشاء طلب جديد
- ✅ **تم قبول الطلب** (`request_accepted`) - للمستخدم عند قبول جامع لطلبه
- ✅ **تم إكمال الطلب** (`request_completed`) - للمستخدم عند إكمال طلبه
- ✅ **رسالة جديدة** (`new_message`) - عند استلام رسالة جديدة
- ✅ **تم إلغاء الطلب** (`request_cancelled`) - للجامع عند إلغاء طلب قبلته

### 2. Backend Components

#### Notification Model (`backend/models/Notification.js`)
- تخزين الإشعارات في MongoDB
- فهرسة للاستعلامات السريعة
- ربط مع Requests, Messages, Users

#### Notification Routes (`backend/routes/notificationRoutes.js`)
- `GET /api/notifications` - جلب جميع الإشعارات
- `GET /api/notifications/unread-count` - عدد الإشعارات غير المقروءة
- `PUT /api/notifications/:id/read` - تعليم إشعار كمقروء
- `PUT /api/notifications/read-all` - تعليم الكل كمقروء
- `DELETE /api/notifications/:id` - حذف إشعار

#### Notification Helper (`backend/utils/notificationHelper.js`)
- `notifyNewRequest()` - إشعار للجامعين عند طلب جديد
- `notifyRequestAccepted()` - إشعار للمستخدم عند قبول طلبه
- `notifyRequestCompleted()` - إشعار عند إكمال الطلب
- `notifyNewMessage()` - إشعار عند رسالة جديدة
- `notifyRequestCancelled()` - إشعار عند إلغاء الطلب

### 3. Frontend Components

#### NotificationContext (`frontend/src/context/NotificationContext.jsx`)
- إدارة حالة الإشعارات
- Socket.io connection للإشعارات الفورية
- Polling كل 30 ثانية للتحقق من الإشعارات الجديدة
- Functions: `fetchNotifications`, `markAsRead`, `markAllAsRead`, `deleteNotification`

#### Navbar Badge & Dropdown
- 🔔 Bell icon مع badge يظهر عدد الإشعارات غير المقروءة
- Dropdown يعرض آخر 10 إشعارات
- إمكانية تعليم الكل كمقروء من Dropdown
- Navigate تلقائي عند النقر على إشعار

#### Notifications Page (`frontend/src/pages/Notifications.jsx`)
- صفحة كاملة لعرض جميع الإشعارات
- Filter: الكل / غير المقروء
- إمكانية حذف الإشعارات
- عرض الوقت النسبي (منذ X دقيقة/ساعة/يوم)

---

## Socket.io Events

### Backend → Frontend
- `new-notification` - إشعار جديد (يتم إرساله إلى `user_${userId}` room)

### Frontend → Backend
- `join-user` - انضمام المستخدم إلى room الشخصي

---

## التكامل

### في `requestRoutes.js`
- ✅ عند إنشاء طلب جديد → `notifyNewRequest()`
- ✅ عند قبول طلب → `notifyRequestAccepted()`
- ✅ عند إكمال طلب → `notifyRequestCompleted()`
- ✅ عند إلغاء طلب → `notifyRequestCancelled()`

### في `messageRoutes.js`
- ✅ عند إرسال رسالة → `notifyNewMessage()`

---

## الاستخدام

### في Components
```javascript
import { useNotifications } from '../context/NotificationContext'

const MyComponent = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  
  // Use notifications...
}
```

### في Navbar
- Badge يظهر تلقائياً عند وجود إشعارات غير مقروءة
- Dropdown يفتح عند النقر على Bell icon
- Navigate تلقائي عند النقر على إشعار

---

## الملفات المضافة/المحدثة

### Backend
- ✅ `backend/models/Notification.js` - جديد
- ✅ `backend/routes/notificationRoutes.js` - جديد
- ✅ `backend/utils/notificationHelper.js` - جديد
- ✅ `backend/server.js` - إضافة notification routes
- ✅ `backend/routes/requestRoutes.js` - إضافة notification calls
- ✅ `backend/routes/messageRoutes.js` - إضافة notification calls

### Frontend
- ✅ `frontend/src/context/NotificationContext.jsx` - جديد
- ✅ `frontend/src/components/Navbar.jsx` - إضافة badge & dropdown
- ✅ `frontend/src/pages/Notifications.jsx` - جديد
- ✅ `frontend/src/App.jsx` - إضافة NotificationProvider & route

---

## Testing

### اختبار الإشعارات:
1. ✅ إنشاء طلب جديد (يجب أن يتلقى الجامعون إشعار)
2. ✅ قبول طلب (يجب أن يتلقى المستخدم إشعار)
3. ✅ إرسال رسالة (يجب أن يتلقى المستقبل إشعار)
4. ✅ إكمال طلب (يجب أن يتلقى المستخدم إشعار)
5. ✅ Badge في Navbar يظهر العدد الصحيح
6. ✅ Dropdown يعرض الإشعارات
7. ✅ Navigate يعمل عند النقر على إشعار

---

## ملاحظات

- Socket.io connection يتم إنشاؤه تلقائياً عند تسجيل الدخول
- الإشعارات يتم تحديثها فورياً عبر Socket.io
- Polling كل 30 ثانية كـ backup
- Badge يظهر فقط عند وجود إشعارات غير مقروءة
- Dropdown يعرض آخر 10 إشعارات فقط

---

**تاريخ الإنشاء:** 2024
