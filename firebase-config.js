// firebase-config.js - ملف مشترك بين جميع الصفحات
const firebaseConfig = {
    apiKey: "AIzaSyBnmqWRY6lV54meFvO89QeXwtd28w81FcY",
    authDomain: "rtx3090-28439.firebaseapp.com",
    projectId: "rtx3090-28439",
    storageBucket: "rtx3090-28439.firebasestorage.app",
    messagingSenderId: "178612030690",
    appId: "1:178612030690:web:883189ced2ed3a78e3e2bb",
    databaseURL: "https://rtx3090-28439-default-rtdb.firebaseio.com/"
};

// تهيئة Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const rtdb = firebase.database();

// دالة للحصول على معلومات المستخدم الحالي
async function getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        return userDoc.exists ? userDoc.data() : null;
    }
    return null;
}

// دالة للتحقق من تسجيل الدخول
function checkAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            resolve(!!user);
        });
    });
}

// تصدير المتغيرات والدوال
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, app, auth, db, storage, rtdb, getCurrentUser, checkAuth };
}
