// ==========================================
// Afnan AI - Main Page Script
// ==========================================

// Import Firebase functions (في بيئة الإنتاج يتم استيراد هذه من CDN)
// import { auth, db } from './firebase-config.js';
// import * as firebaseService from './firebase-service.js';

// ========== Global State ==========
let userData = null;
let storeData = {
    frames: [],
    badges: [],
    gifts: [],
    magicLevels: {},
    wealthLevels: {}
};

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // تحقق من تسجيل الدخول
    const user = getCurrentUser();
    if (!user) {
        showLoginPage();
    } else {
        await loadUserData(user.uid);
        showMainApp();
    }
}

// ========== User Management ==========
function getCurrentUser() {
    // في بيئة الإنتاج: return auth.currentUser;
    // للاختبار: محاكاة مستخدم
    return JSON.parse(localStorage.getItem('currentUser')) || null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// ========== Login Functions ==========
function showLoginPage() {
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('main-app');
    
    if (loginPage) loginPage.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
}

function showMainApp() {
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('main-app');
    
    if (loginPage) loginPage.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
}

window.loginWithTwitter = async () => {
    // محاكاة تسجيل الدخول عبر تويتر
    const mockUser = {
        uid: 'user_' + Date.now(),
        displayName: 'مستخدم تويتر',
        photoURL: 'https://via.placeholder.com/150?text=Twitter',
        email: 'user@twitter.com'
    };
    
    setCurrentUser(mockUser);
    await loadUserData(mockUser.uid);
    showMainApp();
};

window.loginWithGoogle = async () => {
    // محاكاة تسجيل الدخول عبر جوجل
    const mockUser = {
        uid: 'user_' + Date.now(),
        displayName: 'مستخدم جوجل',
        photoURL: 'https://via.placeholder.com/150?text=Google',
        email: 'user@google.com'
    };
    
    setCurrentUser(mockUser);
    await loadUserData(mockUser.uid);
    showMainApp();
};

// ========== Data Loading ==========
async function loadUserData(uid) {
    try {
        // محاكاة تحميل بيانات المستخدم من Firebase
        userData = {
            uid,
            displayName: getCurrentUser().displayName,
            photoURL: getCurrentUser().photoURL,
            customId: generateCustomId(),
            balance: 1000,
            magicLevel: 1,
            wealthLevel: 1,
            purchasedFrames: [],
            purchasedBadges: [],
            activeFrame: null,
            activeBadges: [],
            friends: [],
            receivedGifts: []
        };
        
        // تحميل البيانات العامة
        await loadGlobalData();
        await updateUI();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadGlobalData() {
    // محاكاة تحميل البيانات من Firebase
    storeData = {
        frames: [
            { id: 'frame1', name: 'إطار ذهبي', image: '🖼️', price: 100 },
            { id: 'frame2', name: 'إطار فضي', image: '🖼️', price: 50 }
        ],
        badges: [
            { id: 'badge1', name: 'شارة النجم', image: '⭐', price: 50 },
            { id: 'badge2', name: 'شارة القلب', image: '❤️', price: 50 },
            { id: 'badge3', name: 'شارة الماس', image: '💎', price: 100 },
            { id: 'badge4', name: 'شارة الحكمة', image: '🧠', price: 75 },
            { id: 'badge5', name: 'شارة الشجاعة', image: '🦁', price: 75 },
            { id: 'badge6', name: 'شارة الفن', image: '🎨', price: 60 }
        ],
        gifts: [
            { id: 'gift1', name: 'هدية الحب', image: '💝', reward: 100 },
            { id: 'gift2', name: 'هدية الفرح', image: '🎁', reward: 150 },
            { id: 'gift3', name: 'هدية الحظ', image: '🍀', reward: 200 }
        ],
        magicLevels: {
            1: { image: '✨', name: 'المبتدئ' },
            2: { image: '🌟', name: 'المتقدم' },
            3: { image: '💫', name: 'الخبير' }
        },
        wealthLevels: {
            1: { image: '💰', name: 'الفقير' },
            2: { image: '💵', name: 'الغني' },
            3: { image: '👑', name: 'الملك' }
        }
    };
}

async function updateUI() {
    // تحديث بيانات المستخدم في الواجهة
    const sideName = document.getElementById('sideName');
    const sideID = document.getElementById('sideID');
    const sideAvatar = document.getElementById('sideAvatar');
    const walletAmount = document.getElementById('walletAmount');
    
    if (sideName) sideName.innerText = userData.displayName || 'مستخدم';
    if (sideID) sideID.innerText = userData.customId || '000000';
    if (sideAvatar) sideAvatar.src = userData.photoURL || 'https://via.placeholder.com/150';
    if (walletAmount) walletAmount.innerText = (userData.balance || 0).toLocaleString();
    
    // تحديث المستويات
    updateLevelDisplay();
    
    // تحديث الشارات
    await loadBadges();
}

function updateLevelDisplay() {
    const magicLevelDisplay = document.getElementById('magicLevelDisplay');
    const wealthLevelDisplay = document.getElementById('wealthLevelDisplay');
    const magicLevelImg = document.getElementById('magicLevelImg');
    const wealthLevelImg = document.getElementById('wealthLevelImg');
    
    const ml = userData.magicLevel || 1;
    const wl = userData.wealthLevel || 1;
    
    if (magicLevelDisplay) magicLevelDisplay.innerText = ml;
    if (wealthLevelDisplay) wealthLevelDisplay.innerText = wl;
    
    if (magicLevelImg && storeData.magicLevels[ml]) {
        magicLevelImg.innerText = storeData.magicLevels[ml].image;
    }
    
    if (wealthLevelImg && storeData.wealthLevels[wl]) {
        wealthLevelImg.innerText = storeData.wealthLevels[wl].image;
    }
}

async function loadBadges() {
    const badgesContainer = document.getElementById('badgesContainer');
    if (!badgesContainer) return;
    
    badgesContainer.innerHTML = '';
    const badges = userData.activeBadges || [];
    
    badges.forEach((badgeId, index) => {
        const badge = storeData.badges.find(b => b.id === badgeId);
        if (badge) {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge-item glass-card';
            badgeEl.innerHTML = `
                <img src="${badge.image}" alt="${badge.name}" title="${badge.name}">
            `;
            badgesContainer.appendChild(badgeEl);
        }
    });
}

// ========== Navigation ==========
window.toggleSidebar = (show) => {
    const sidebarContainer = document.getElementById('sidebarContainer');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (show) {
        if (sidebarContainer) sidebarContainer.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('visible');
    } else {
        if (sidebarContainer) sidebarContainer.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
    }
};

window.navigateTo = (page) => {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => s.classList.remove('active'));
    
    const section = document.getElementById(`view-${page}`);
    if (section) {
        section.classList.add('active');
    }
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const titles = {
            'home': 'الرئيسية',
            'store': 'المتجر',
            'bag': 'الحقيبة',
            'friends': 'الأصدقاء'
        };
        pageTitle.innerText = titles[page] || 'الرئيسية';
    }
    
    toggleSidebar(false);
};

// ========== Store Functions ==========
window.loadStoreItems = (type) => {
    const grid = document.getElementById('storeGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const items = type === 'frames' ? storeData.frames : storeData.badges;
    
    items.forEach(item => {
        const field = type === 'frames' ? 'purchasedFrames' : 'purchasedBadges';
        const owned = userData[field]?.some(i => i.id === item.id);
        
        const card = document.createElement('div');
        card.className = 'glass-card p-4 rounded-3xl flex flex-col items-center justify-between min-h-[160px]';
        card.innerHTML = `
            <img src="${item.image}" class="w-16 h-16 object-contain mb-2" alt="${item.name}">
            <h4 class="font-bold text-sm text-center mb-2">${item.name}</h4>
            <button onclick="${owned ? '' : `buyItem('${type}', '${item.id}', ${item.price})`}" 
                    class="w-full py-2 ${owned ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'} text-xs font-bold rounded-xl">
                ${owned ? 'مملوك' : `${item.price} 💰 شراء`}
            </button>
        `;
        grid.appendChild(card);
    });
};

window.buyItem = async (type, id, price) => {
    if (userData.balance < price) {
        alert('رصيدك غير كافٍ!');
        return;
    }
    
    userData.balance -= price;
    const field = type === 'frames' ? 'purchasedFrames' : 'purchasedBadges';
    userData[field].push({ id, purchasedAt: new Date() });
    
    updateUI();
    loadStoreItems(type);
};

// ========== Bag Functions ==========
window.loadBagItems = async () => {
    const fGrid = document.getElementById('bagGrid');
    const bGrid = document.getElementById('badgesBagGrid');
    
    if (fGrid) {
        fGrid.innerHTML = '';
        const frames = userData.purchasedFrames || [];
        frames.forEach(f => {
            const exists = storeData.frames.find(sf => sf.id === f.id);
            if (exists) {
                const isEquipped = userData.activeFrame === f.id;
                const frameEl = document.createElement('div');
                frameEl.className = `p-3 rounded-2xl glass-card flex flex-col items-center justify-center cursor-pointer ${isEquipped ? 'border-2 border-black bg-white' : ''}`;
                frameEl.onclick = () => equipFrame(f.id);
                frameEl.innerHTML = `<img src="${exists.image}" class="w-12 h-12 object-contain" alt="${exists.name}">`;
                fGrid.appendChild(frameEl);
            }
        });
    }
    
    if (bGrid) {
        bGrid.innerHTML = '';
        const badges = userData.purchasedBadges || [];
        badges.forEach(b => {
            const exists = storeData.badges.find(sb => sb.id === b.id);
            if (exists) {
                const isActive = userData.activeBadges?.includes(b.id);
                const badgeEl = document.createElement('div');
                badgeEl.className = `p-2 rounded-xl glass-card flex items-center justify-center cursor-pointer ${isActive ? 'border-2 border-black bg-white' : ''}`;
                badgeEl.onclick = () => toggleBadge(b.id);
                badgeEl.innerHTML = `<img src="${exists.image}" class="w-8 h-8 object-contain" alt="${exists.name}">`;
                bGrid.appendChild(badgeEl);
            }
        });
    }
};

window.equipFrame = async (id) => {
    userData.activeFrame = userData.activeFrame === id ? null : id;
    loadBagItems();
};

window.toggleBadge = async (id) => {
    const isActive = userData.activeBadges?.includes(id);
    if (isActive) {
        userData.activeBadges = userData.activeBadges.filter(b => b !== id);
    } else {
        userData.activeBadges.push(id);
    }
    loadBagItems();
    updateUI();
};

// ========== Friends Functions ==========
window.searchUser = async () => {
    const input = document.getElementById('searchUserInput');
    const results = document.getElementById('searchResults');
    const container = document.getElementById('userResult');
    
    if (!input || !results || !container) return;
    
    const id = input.value.trim();
    if (!id) return;
    
    results.classList.remove('hidden');
    
    // محاكاة البحث
    if (id === userData.customId) {
        container.innerHTML = '<p class="text-center text-gray-400 text-sm">لا يمكنك متابعة نفسك</p>';
    } else {
        const mockUser = {
            uid: 'user_' + id,
            displayName: 'مستخدم ' + id,
            photoURL: 'https://via.placeholder.com/150?text=' + id,
            customId: id
        };
        
        const isFollowing = userData.friends?.includes(mockUser.uid);
        container.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <img src="${mockUser.photoURL}" class="w-12 h-12 rounded-full object-cover" alt="${mockUser.displayName}">
                    <div>
                        <h4 class="font-bold text-sm">${mockUser.displayName}</h4>
                        <p class="text-xs text-gray-400">ID: ${mockUser.customId}</p>
                    </div>
                </div>
                <button onclick="toggleFollow('${mockUser.uid}')" class="px-4 py-2 rounded-xl ${isFollowing ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'} font-bold text-xs">
                    ${isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                </button>
            </div>`;
    }
};

window.toggleFollow = async (uid) => {
    const isFollowing = userData.friends?.includes(uid);
    if (isFollowing) {
        userData.friends = userData.friends.filter(f => f !== uid);
    } else {
        userData.friends.push(uid);
    }
    searchUser();
};

window.loadFriends = async () => {
    const list = document.getElementById('friendsList');
    if (!list) return;
    
    list.innerHTML = '';
    if (!userData.friends || userData.friends.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">لا يوجد أصدقاء بعد</p>';
        return;
    }
    
    userData.friends.forEach(uid => {
        const friendEl = document.createElement('div');
        friendEl.className = 'glass-card p-4 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white transition';
        friendEl.onclick = () => openChat(uid);
        friendEl.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="https://via.placeholder.com/150?text=${uid}" class="w-12 h-12 rounded-full object-cover" alt="صديق">
                <div>
                    <h4 class="font-bold text-sm">صديق ${uid}</h4>
                    <p class="text-xs text-gray-400">ID: ${uid}</p>
                </div>
            </div>
            <span>💬</span>
        `;
        list.appendChild(friendEl);
    });
};

window.openChat = (uid) => {
    // الانتقال إلى صفحة الدردشة
    window.location.href = `chat.html?userId=${uid}`;
};

window.openGiftsPage = () => {
    window.location.href = 'afnan.html';
};

// ========== Utility Functions ==========
function generateCustomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

window.logout = () => {
    localStorage.removeItem('currentUser');
    location.reload();
};
