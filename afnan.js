// ==========================================
// Afnan AI - Gifts Page Script
// ==========================================

// Global State
let currentUser = null;
let selectedGift = null;
let selectedRecipient = null;
let gifts = [];
let allUsers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeGiftsPage();
});

async function initializeGiftsPage() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    loadGifts();
    loadReceivedGifts();
}

// ========== Load Gifts ==========
function loadGifts() {
    gifts = [
        { id: 'gift1', name: 'هدية الحب', icon: '💝', price: 100 },
        { id: 'gift2', name: 'هدية الفرح', icon: '🎁', price: 150 },
        { id: 'gift3', name: 'هدية الحظ', icon: '🍀', price: 200 },
        { id: 'gift4', name: 'هدية النجاح', icon: '⭐', price: 250 },
        { id: 'gift5', name: 'هدية الصداقة', icon: '👫', price: 180 },
        { id: 'gift6', name: 'هدية الشجاعة', icon: '🦁', price: 220 }
    ];

    renderGiftsGrid();
}

function renderGiftsGrid() {
    const grid = document.getElementById('giftsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    gifts.forEach(gift => {
        const card = document.createElement('div');
        card.className = `gift-card glass-card ${selectedGift?.id === gift.id ? 'selected' : ''}`;
        card.onclick = () => selectGift(gift);
        card.innerHTML = `
            <div class="gift-card-icon">${gift.icon}</div>
            <div class="gift-card-name">${gift.name}</div>
            <div class="gift-card-price">${gift.price} 💎</div>
        `;
        grid.appendChild(card);
    });
}

function selectGift(gift) {
    selectedGift = gift;
    renderGiftsGrid();
    document.getElementById('selectedGiftDisplay').innerHTML = `
        <div class="text-center">
            <div style="font-size: 48px; margin-bottom: 8px;">${gift.icon}</div>
            <div style="font-weight: 600; margin-bottom: 4px;">${gift.name}</div>
            <div style="font-size: 12px; color: #6b7280;">${gift.price} 💎</div>
        </div>
    `;
}

// ========== Search User ==========
window.searchForGift = async () => {
    const input = document.getElementById('recipientSearch');
    const id = input?.value.trim();

    if (!id) {
        alert('أدخل رقم المستخدم');
        return;
    }

    // محاكاة البحث
    selectedRecipient = {
        uid: 'user_' + id,
        displayName: 'مستخدم ' + id,
        photoURL: 'https://via.placeholder.com/150?text=' + id,
        customId: id
    };

    const result = document.getElementById('recipientResult');
    if (result) {
        result.innerHTML = `
            <div class="glass-card p-4 rounded-2xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <img src="${selectedRecipient.photoURL}" class="w-12 h-12 rounded-full object-cover" alt="">
                    <div>
                        <div style="font-weight: 600; font-size: 14px;">${selectedRecipient.displayName}</div>
                        <div style="font-size: 12px; color: #6b7280;">ID: ${selectedRecipient.customId}</div>
                    </div>
                </div>
                <span style="font-size: 20px;">✓</span>
            </div>
        `;
    }
};

// ========== Send Gift ==========
window.sendGift = async () => {
    if (!selectedGift) {
        alert('اختر هدية أولاً');
        return;
    }

    if (!selectedRecipient) {
        alert('اختر مستقبل الهدية');
        return;
    }

    // محاكاة إرسال الهدية
    const userBalance = parseInt(localStorage.getItem('userBalance') || '1000');
    
    if (userBalance < selectedGift.price) {
        alert('رصيدك غير كافٍ!');
        return;
    }

    // خصم الرصيد
    const newBalance = userBalance - selectedGift.price;
    localStorage.setItem('userBalance', newBalance.toString());

    // إضافة الهدية إلى المستقبل
    const receivedGifts = JSON.parse(localStorage.getItem('receivedGifts_' + selectedRecipient.uid) || '[]');
    receivedGifts.push({
        id: generateId(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        giftId: selectedGift.id,
        giftName: selectedGift.name,
        giftIcon: selectedGift.icon,
        giftPrice: selectedGift.price,
        timestamp: new Date().toISOString(),
        opened: false
    });
    localStorage.setItem('receivedGifts_' + selectedRecipient.uid, JSON.stringify(receivedGifts));

    alert('تم إرسال الهدية بنجاح! ✨');
    
    // إعادة تعيين
    selectedGift = null;
    selectedRecipient = null;
    document.getElementById('recipientSearch').value = '';
    document.getElementById('recipientResult').innerHTML = '';
    document.getElementById('selectedGiftDisplay').innerHTML = '';
    renderGiftsGrid();
};

// ========== Load Received Gifts ==========
function loadReceivedGifts() {
    const receivedGifts = JSON.parse(localStorage.getItem('receivedGifts_' + currentUser.uid) || '[]');
    const container = document.getElementById('receivedGiftsContainer');
    
    if (!container) return;

    if (receivedGifts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 24px;">لم تستقبل هدايا بعد 🎁</p>';
        return;
    }

    container.innerHTML = '';
    receivedGifts.forEach(gift => {
        const bubble = document.createElement('div');
        bubble.className = `gift-bubble ${gift.opened ? 'opened' : ''}`;
        bubble.innerHTML = `
            <div class="gift-bubble-header">
                <img src="${gift.senderPhoto}" class="gift-bubble-sender-avatar" alt="">
                <span class="gift-bubble-sender-name">${gift.senderName}</span>
            </div>
            <div class="gift-bubble-gift">
                <div class="gift-bubble-icon">${gift.giftIcon}</div>
                <div class="gift-bubble-info">
                    <div class="gift-bubble-name">${gift.giftName}</div>
                    <div class="gift-bubble-value">${gift.giftPrice} 💎</div>
                </div>
            </div>
            ${!gift.opened ? `
                <button class="gift-bubble-button" onclick="openGift('${gift.id}', '${currentUser.uid}')">
                    فتح الهدية 🎉
                </button>
            ` : `
                <div style="text-align: center; color: rgba(255,255,255,0.8); font-size: 12px;">
                    تم فتح الهدية ✓
                </div>
            `}
        `;
        container.appendChild(bubble);
    });
}

window.openGift = (giftId, userId) => {
    const receivedGifts = JSON.parse(localStorage.getItem('receivedGifts_' + userId) || '[]');
    const gift = receivedGifts.find(g => g.id === giftId);

    if (!gift) return;

    // تحويل الجواهر إلى عملات (10 جواهر = 1 عملة)
    const currencyAmount = Math.floor(gift.giftPrice / 10);
    
    // تحديث الرصيد
    const currentBalance = parseInt(localStorage.getItem('userBalance') || '0');
    const newBalance = currentBalance + currencyAmount;
    localStorage.setItem('userBalance', newBalance.toString());

    // تحديث حالة الهدية
    gift.opened = true;
    localStorage.setItem('receivedGifts_' + userId, JSON.stringify(receivedGifts));

    alert(`تم فتح الهدية! حصلت على ${currencyAmount} عملة 🎉`);
    loadReceivedGifts();
};

// ========== Utility Functions ==========
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

window.goBack = () => {
    window.location.href = 'index.html';
};
