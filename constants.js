// Global Constants and Configuration
// ===================================

// نسبة تحويل الجواهر إلى العملات
export const GEMS_TO_CURRENCY_RATIO = 10; // كل 10 جواهر = 1 عملة

// نظام المستويات
export const LEVEL_SYSTEM = {
  MAGIC: 'magicLevel',
  WEALTH: 'wealthLevel'
};

// حد أقصى للشارات في السطر الواحد
export const BADGES_PER_ROW = 5;

// مدة الرسالة المؤقتة (بالميلي ثانية)
export const TOAST_DURATION = 3000;

// حالات المتابعة
export const FOLLOW_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked'
};

// أنواع الرسائل
export const MESSAGE_TYPES = {
  TEXT: 'text',
  GIFT: 'gift',
  SYSTEM: 'system'
};

// حالات الهدايا
export const GIFT_STATUS = {
  SENT: 'sent',
  RECEIVED: 'received',
  OPENED: 'opened'
};

// الألوان الأساسية للتطبيق
export const COLORS = {
  PRIMARY: '#1f2937',
  SECONDARY: '#6366f1',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  LIGHT: '#f3f4f6',
  DARK: '#111827'
};

// رسائل الأخطاء
export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: 'رصيدك غير كافٍ!',
  USER_NOT_FOUND: 'لم يتم العثور على المستخدم',
  GIFT_NOT_SENT: 'فشل إرسال الهدية',
  NETWORK_ERROR: 'خطأ في الاتصال',
  UNAUTHORIZED: 'غير مصرح لك بهذا الإجراء'
};
