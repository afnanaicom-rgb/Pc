// rooms-system.js - نظام إدارة الرومات
class RoomsSystem {
    constructor() {
        this.currentRoom = null;
        this.rooms = [];
        this.peerConnections = {};
        this.localStream = null;
        this.audioContext = null;
        this.audioAnalyser = null;
        
        // تكوين WebRTC
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    // إنشاء روم جديد
    async createRoom(roomName, maxUsers = 10, isPublic = true) {
        try {
            const user = auth.currentUser;
            const userData = await getCurrentUser();
            
            if (!user || !userData) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            const roomId = this.generateRoomId();
            const roomData = {
                id: roomId,
                name: roomName,
                ownerId: user.uid,
                ownerName: userData.displayName,
                ownerAvatar: userData.photoURL,
                maxUsers: maxUsers,
                isPublic: isPublic,
                users: [{
                    uid: user.uid,
                    name: userData.displayName,
                    avatar: userData.photoURL,
                    isMuted: false,
                    isSpeaker: true,
                    joinedAt: new Date(),
                    magicLevel: userData.magicLevel || 1,
                    wealthLevel: userData.wealthLevel || 1
                }],
                createdAt: new Date(),
                isActive: true,
                currentSpeakers: 1
            };

            // حفظ الروم في Firestore
            await db.collection('rooms').doc(roomId).set(roomData);
            
            // إنشاء غرفة في Realtime Database للإشارات
            await rtdb.ref(`rooms/${roomId}/signals`).set({});
            
            // حفظ في بيانات المستخدم
            await db.collection('users').doc(user.uid).update({
                currentRoom: roomId,
                joinedRooms: firebase.firestore.FieldValue.arrayUnion(roomId)
            });

            this.currentRoom = roomId;
            
            // بدء الاستماع للتحديثات
            this.listenToRoomUpdates(roomId);
            
            // بدء الاتصال الصوتي
            await this.startAudioConnection(roomId);
            
            return roomId;
            
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    // الانضمام إلى روم
    async joinRoom(roomId) {
        try {
            const user = auth.currentUser;
            const userData = await getCurrentUser();
            
            if (!user || !userData) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // الحصول على بيانات الروم
            const roomDoc = await db.collection('rooms').doc(roomId).get();
            
            if (!roomDoc.exists) {
                throw new Error('الروم غير موجود');
            }

            const roomData = roomDoc.data();
            
            if (roomData.users.length >= roomData.maxUsers) {
                throw new Error('الروم ممتلئ');
            }

            // إضافة المستخدم إلى الروم
            const userInRoom = {
                uid: user.uid,
                name: userData.displayName,
                avatar: userData.photoURL,
                isMuted: true,
                isSpeaker: false,
                joinedAt: new Date(),
                magicLevel: userData.magicLevel || 1,
                wealthLevel: userData.wealthLevel || 1
            };

            await db.collection('rooms').doc(roomId).update({
                users: firebase.firestore.FieldValue.arrayUnion(userInRoom),
                currentSpeakers: firebase.firestore.FieldValue.increment(1)
            });

            // تحديث بيانات المستخدم
            await db.collection('users').doc(user.uid).update({
                currentRoom: roomId,
                joinedRooms: firebase.firestore.FieldValue.arrayUnion(roomId)
            });

            this.currentRoom = roomId;
            
            // بدء الاستماع للتحديثات
            this.listenToRoomUpdates(roomId);
            
            // بدء الاتصال الصوتي
            await this.startAudioConnection(roomId);
            
            return roomData;
            
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    // مغادرة الروم
    async leaveRoom(roomId) {
        try {
            const user = auth.currentUser;
            
            if (!user) return;

            const roomDoc = await db.collection('rooms').doc(roomId).get();
            
            if (roomDoc.exists) {
                const roomData = roomDoc.data();
                const updatedUsers = roomData.users.filter(u => u.uid !== user.uid);
                
                if (updatedUsers.length === 0) {
                    // حذف الروم إذا أصبح فارغاً
                    await db.collection('rooms').doc(roomId).delete();
                    await rtdb.ref(`rooms/${roomId}`).remove();
                } else {
                    // تحديث الروم
                    await db.collection('rooms').doc(roomId).update({
                        users: updatedUsers,
                        currentSpeakers: Math.max(updatedUsers.filter(u => u.isSpeaker).length, 1)
                    });
                }
            }

            // تحديث بيانات المستخدم
            await db.collection('users').doc(user.uid).update({
                currentRoom: null
            });

            // إغلاق الاتصالات الصوتية
            this.closeAllConnections();
            
            // إيقاف الاستماع للتحديثات
            if (this.roomListener) {
                this.roomListener();
            }

            this.currentRoom = null;
            
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    }

    // بدء الاتصال الصوتي
    async startAudioConnection(roomId) {
        try {
            // الحصول على صلاحيات الميكروفون
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // إنشاء سياق الصوت
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioAnalyser = this.audioContext.createAnalyser();
            
            const source = this.audioContext.createMediaStreamSource(this.localStream);
            source.connect(this.audioAnalyser);

            // الاستماع لإشارات WebRTC
            this.listenForSignals(roomId);
            
            // إرسال إشارة دخولي للآخرين
            this.sendJoinSignal(roomId);

        } catch (error) {
            console.error('Error starting audio connection:', error);
            throw error;
        }
    }

    // الاستماع لإشارات WebRTC
    listenForSignals(roomId) {
        const signalsRef = rtdb.ref(`rooms/${roomId}/signals`);
        
        signalsRef.on('child_added', async (snapshot) => {
            const signal = snapshot.val();
            const currentUser = auth.currentUser;
            
            if (signal.userId === currentUser.uid) return;
            
            if (signal.type === 'join') {
                await this.createPeerConnection(signal.userId, roomId, true);
            } else if (signal.type === 'offer') {
                await this.handleOffer(signal.userId, signal.offer);
            } else if (signal.type === 'answer') {
                await this.handleAnswer(signal.userId, signal.answer);
            } else if (signal.type === 'ice-candidate') {
                await this.handleIceCandidate(signal.userId, signal.candidate);
            } else if (signal.type === 'leave') {
                this.closePeerConnection(signal.userId);
            }
        });
    }

    // إنشاء اتصال WebRTC
    async createPeerConnection(userId, roomId, isInitiator = false) {
        try {
            const pc = new RTCPeerConnection(this.rtcConfig);
            this.peerConnections[userId] = pc;

            // إضافة المسار المحلي
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });

            // معالجة مرشحات ICE
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendSignal(userId, 'ice-candidate', event.candidate);
                }
            };

            // معالجة المسار الوارد
            pc.ontrack = (event) => {
                const remoteAudio = document.createElement('audio');
                remoteAudio.id = `audio-${userId}`;
                remoteAudio.autoplay = true;
                remoteAudio.controls = false;
                remoteAudio.style.display = 'none';
                document.body.appendChild(remoteAudio);
                remoteAudio.srcObject = event.streams[0];
            };

            // إنشاء عرض إذا كان المُنشئ
            if (isInitiator) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                this.sendSignal(userId, 'offer', offer);
            }

            return pc;
            
        } catch (error) {
            console.error('Error creating peer connection:', error);
        }
    }

    // معالجة عرض الاتصال
    async handleOffer(userId, offer) {
        try {
            const pc = await this.createPeerConnection(userId, this.currentRoom, false);
            
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            this.sendSignal(userId, 'answer', answer);
            
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    // معالجة الإجابة
    async handleAnswer(userId, answer) {
        try {
            const pc = this.peerConnections[userId];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    // معالجة مرشح ICE
    async handleIceCandidate(userId, candidate) {
        try {
            const pc = this.peerConnections[userId];
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    // إرسال إشارة
    sendSignal(targetUserId, type, data) {
        const currentUser = auth.currentUser;
        const roomId = this.currentRoom;
        
        if (!currentUser || !roomId) return;
        
        const signalRef = rtdb.ref(`rooms/${roomId}/signals`).push();
        signalRef.set({
            type: type,
            userId: currentUser.uid,
            targetUserId: targetUserId,
            [type]: data,
            timestamp: Date.now()
        });
    }

    // إرسال إشارة دخول
    sendJoinSignal(roomId) {
        const currentUser = auth.currentUser;
        const signalRef = rtdb.ref(`rooms/${roomId}/signals`).push();
        signalRef.set({
            type: 'join',
            userId: currentUser.uid,
            timestamp: Date.now()
        });
    }

    // الاستماع لتحديثات الروم
    listenToRoomUpdates(roomId) {
        this.roomListener = db.collection('rooms').doc(roomId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const roomData = doc.data();
                    this.updateRoomUI(roomData);
                }
            });
    }

    // تحديث واجهة الروم
    updateRoomUI(roomData) {
        const roomContainer = document.getElementById('roomContainer');
        if (!roomContainer) return;

        let html = `
            <div class="room-header glass-card p-4 rounded-3xl mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <img src="${roomData.ownerAvatar}" class="w-12 h-12 rounded-full">
                        <div>
                            <h3 class="font-bold text-lg">${roomData.name}</h3>
                            <p class="text-xs text-gray-400">أنشأه: ${roomData.ownerName}</p>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold">${roomData.users.length}/${roomData.maxUsers}</div>
                        <div class="text-xs text-gray-400">مستمعين</div>
                    </div>
                </div>
            </div>

            <div class="mics-grid grid grid-cols-4 gap-4 mb-6">
        `;

        // عرض المستخدمين في الروم
        roomData.users.forEach(user => {
            const isCurrentUser = user.uid === auth.currentUser?.uid;
            html += `
                <div class="mic-item glass-card p-3 rounded-2xl text-center ${isCurrentUser ? 'border-2 border-blue-500' : ''}">
                    <div class="relative">
                        <img src="${user.avatar}" class="w-16 h-16 rounded-full mx-auto mb-2">
                        ${user.isMuted ? 
                            '<div class="absolute bottom-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">' +
                            '<i class="fas fa-microphone-slash text-white text-xs"></i></div>' : 
                            '<div class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">' +
                            '<i class="fas fa-microphone text-white text-xs"></i></div>'}
                    </div>
                    <h4 class="font-bold text-sm truncate">${user.name}</h4>
                    <div class="flex justify-center gap-1 mt-1">
                        <span class="text-xs bg-yellow-100 text-yellow-800 px-2 rounded">W${user.wealthLevel}</span>
                        <span class="text-xs bg-purple-100 text-purple-800 px-2 rounded">M${user.magicLevel}</span>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div class="room-controls flex gap-3">
                <button onclick="toggleMute()" class="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-bold">
                    <i class="fas fa-microphone"></i> كتم/إلغاء
                </button>
                <button onclick="leaveCurrentRoom()" class="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold">
                    <i class="fas fa-sign-out-alt"></i> مغادرة
                </button>
            </div>
        `;

        roomContainer.innerHTML = html;
    }

    // توليد معرف فريد للروم
    generateRoomId() {
        return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    }

    // كتم/إلغاء كتم الميكروفون
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                
                // تحديث حالة الكتم في قاعدة البيانات
                const currentUser = auth.currentUser;
                if (currentUser && this.currentRoom) {
                    db.collection('rooms').doc(this.currentRoom).get().then(doc => {
                        if (doc.exists) {
                            const roomData = doc.data();
                            const updatedUsers = roomData.users.map(user => {
                                if (user.uid === currentUser.uid) {
                                    return { ...user, isMuted: !audioTrack.enabled };
                                }
                                return user;
                            });
                            
                            db.collection('rooms').doc(this.currentRoom).update({
                                users: updatedUsers
                            });
                        }
                    });
                }
            }
        }
    }

    // إغلاق جميع الاتصالات
    closeAllConnections() {
        Object.values(this.peerConnections).forEach(pc => pc.close());
        this.peerConnections = {};
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // إزالة عناصر الصوت
        document.querySelectorAll('audio[id^="audio-"]').forEach(audio => audio.remove());
    }

    // إغلاق اتصال معين
    closePeerConnection(userId) {
        if (this.peerConnections[userId]) {
            this.peerConnections[userId].close();
            delete this.peerConnections[userId];
        }
        
        const audioElement = document.getElementById(`audio-${userId}`);
        if (audioElement) {
            audioElement.remove();
        }
    }

    // الحصول على الرومات النشطة
    async getActiveRooms(limit = 20) {
        try {
            const snapshot = await db.collection('rooms')
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            this.rooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return this.rooms;
        } catch (error) {
            console.error('Error getting active rooms:', error);
            return [];
        }
    }
}

// إنشاء نسخة عامة من النظام
const roomsSystem = new RoomsSystem();

// تصدير النظام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoomsSystem, roomsSystem };
}
