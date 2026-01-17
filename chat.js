// ==========================================
// Afnan AI - Chat Page Script
// ==========================================

// Global State
let currentUser = null;
let otherUser = null;
let messages = [];
let chatId = null;
let isFollowing = false;
let followRequestPending = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
});

async function initializeChat() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Get recipient from URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');

    if (!userId) {
        window.location.href = 'index.html';
        return;
    }

    // محاكاة تحميل بيانات المستخدم الآخر
    otherUser = {
        uid: userId,
        displayName: 'مستخدم ' + userId,
        photoURL: 'https://via.placeholder.com/150?text=' + userId,
        customId: userId
    };

    // Generate chat ID
    const ids = [currentUser.uid, otherUser.uid].sort();
    chatId = `chat_${ids[0]}_${ids[1]}`;

    // Update header
    updateChatHeader();

    // Load messages
    loadMessages();

    // Check follow status
    checkFollowStatus();

    // Setup auto-refresh
    setInterval(loadMessages, 2000);
}

// ========== Chat Header ==========
function updateChatHeader() {
    const header = document.getElementById('chatHeader');
    if (header) {
        header.innerHTML = `
            <div class="chat-header-info">
                <img src="${otherUser.photoURL}" class="chat-header-avatar" alt="">
                <div class="chat-header-text">
                    <h3>${otherUser.displayName}</h3>
                    <p>ID: ${otherUser.customId}</p>
                </div>
            </div>
            <button onclick="goBack()" class="w-10 h-10 rounded-full flex items-center justify-center active:scale-90">
                <i data-lucide="arrow-left" class="text-black w-6 h-6"></i>
            </button>
        `;
        lucide.createIcons();
    }
}

// ========== Follow Status ==========
function checkFollowStatus() {
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    isFollowing = friends.includes(otherUser.uid);

    const followRequests = JSON.parse(localStorage.getItem('followRequests') || '[]');
    followRequestPending = followRequests.some(r => r.uid === otherUser.uid);

    // Show follow request modal if needed
    if (!isFollowing && !followRequestPending) {
        showFollowRequestModal();
    }
}

function showFollowRequestModal() {
    const modal = document.getElementById('followModal');
    if (modal) {
        modal.classList.add('active');
    }
}

window.acceptFollowRequest = () => {
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    friends.push(otherUser.uid);
    localStorage.setItem('friends', JSON.stringify(friends));
    
    isFollowing = true;
    closeFollowModal();
};

window.rejectFollowRequest = () => {
    const followRequests = JSON.parse(localStorage.getItem('followRequests') || '[]');
    followRequests.push({ uid: otherUser.uid, name: otherUser.displayName });
    localStorage.setItem('followRequests', JSON.stringify(followRequests));
    
    followRequestPending = true;
    closeFollowModal();
};

function closeFollowModal() {
    const modal = document.getElementById('followModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ========== Messages ==========
function loadMessages() {
    const stored = localStorage.getItem('messages_' + chatId) || '[]';
    messages = JSON.parse(stored);
    renderMessages();
}

function renderMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    container.innerHTML = '';
    messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
        
        if (msg.type === 'gift') {
            messageEl.innerHTML = `
                <div class="message-bubble gift-message">
                    <div class="gift-message-content">
                        <div class="gift-message-icon">${msg.giftIcon}</div>
                        <div class="gift-message-info">
                            <div class="gift-message-name">${msg.giftName}</div>
                            <div class="gift-message-value">${msg.giftPrice} 💎</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="message-bubble">${msg.text}</div>
                <div class="message-time">${formatTime(msg.timestamp)}</div>
            `;
        }
        
        container.appendChild(messageEl);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

window.sendMessage = () => {
    if (!isFollowing) {
        alert('يجب قبول المتابعة أولاً للتحدث');
        return;
    }

    const input = document.getElementById('messageInput');
    const text = input?.value.trim();

    if (!text) return;

    const message = {
        id: generateId(),
        senderId: currentUser.uid,
        text,
        type: 'text',
        timestamp: new Date().toISOString()
    };

    messages.push(message);
    localStorage.setItem('messages_' + chatId, JSON.stringify(messages));

    input.value = '';
    renderMessages();
};

// ========== Send Gift ==========
window.openGiftSelector = () => {
    if (!isFollowing) {
        alert('يجب قبول المتابعة أولاً لإرسال هدايا');
        return;
    }

    const gifts = [
        { id: 'gift1', name: 'هدية الحب', icon: '💝', price: 100 },
        { id: 'gift2', name: 'هدية الفرح', icon: '🎁', price: 150 },
        { id: 'gift3', name: 'هدية الحظ', icon: '🍀', price: 200 }
    ];

    let giftHTML = '';
    gifts.forEach(gift => {
        giftHTML += `
            <button onclick="sendGiftMessage('${gift.id}', '${gift.name}', '${gift.icon}', ${gift.price})" 
                    style="padding: 12px; margin: 8px; background: rgba(102, 126, 234, 0.2); border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                ${gift.icon} ${gift.name} (${gift.price} 💎)
            </button>
        `;
    });

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
    `;
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 24px; max-width: 90%; width: 300px;">
            <h3 style="font-weight: 700; margin-bottom: 16px; text-align: center;">اختر هدية</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${giftHTML}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="width: 100%; padding: 12px; margin-top: 16px; background: #f3f4f6; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                إغلاق
            </button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.sendGiftMessage = (giftId, giftName, giftIcon, giftPrice) => {
    const userBalance = parseInt(localStorage.getItem('userBalance') || '1000');
    
    if (userBalance < giftPrice) {
        alert('رصيدك غير كافٍ!');
        return;
    }

    // خصم الرصيد
    localStorage.setItem('userBalance', (userBalance - giftPrice).toString());

    const message = {
        id: generateId(),
        senderId: currentUser.uid,
        type: 'gift',
        giftId,
        giftName,
        giftIcon,
        giftPrice,
        timestamp: new Date().toISOString()
    };

    messages.push(message);
    localStorage.setItem('messages_' + chatId, JSON.stringify(messages));

    // إضافة الهدية إلى المستقبل
    const receivedGifts = JSON.parse(localStorage.getItem('receivedGifts_' + otherUser.uid) || '[]');
    receivedGifts.push({
        id: generateId(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        giftId,
        giftName,
        giftIcon,
        giftPrice,
        timestamp: new Date().toISOString(),
        opened: false
    });
    localStorage.setItem('receivedGifts_' + otherUser.uid, JSON.stringify(receivedGifts));

    // Close modal
    document.querySelectorAll('[style*="position: fixed"]').forEach(el => {
        if (el.style.background === 'rgba(0, 0, 0, 0.5)') {
            el.remove();
        }
    });

    renderMessages();
};

// ========== Utility Functions ==========
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

window.goBack = () => {
    window.location.href = 'index.html';
};

// ========== Input Handling ==========
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
