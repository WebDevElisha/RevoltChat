import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, where, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { initRevoltCounter, setupPresence } from "./revoltcounter.js";

const firebaseConfig = {
    apiKey: "AIzaSyDWnr-9qpfzW_y-LMuTorItQTUHJVvhLDk",
    authDomain: "revolt-chat-4fada.firebaseapp.com",
    databaseURL: "https://revolt-chat-4fada-default-rtdb.firebaseio.com/",
    projectId: "revolt-chat-4fada",
    storageBucket: "revolt-chat-4fada.firebasestorage.app",
    messagingSenderId: "488624788181",
    appId: "1:488624788181:web:1571ba31aafb8c1441c85c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const messageForm = document.getElementById('input-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages-container');
const roomElements = document.querySelectorAll('.room');
const revoltUsersList = document.getElementById('revolt-users-list');
const userCountSpan = document.getElementById('user-count');

const defaultAvatar = window.location.pathname.includes('/html/') ? "../Revoltchat.png" : "Revoltchat.png";

let currentUser = null;
let currentUsername = sessionStorage.getItem('revolt_temp_username') || "User";
let currentPfpUrl = defaultAvatar;
let currentRoom = "General";
let unsubscribe = null;
let usersUnsubscribe = null;
const userProfiles = {}; 

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
@keyframes messagePopIn {
    0% {
        opacity: 0;
        transform: translateY(15px) scale(0.95);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
.message-wrapper {
    animation: messagePopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;
document.head.appendChild(styleSheet);

if (sendButton) {
    sendButton.textContent = "R->";
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        try {
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const d = userDoc.data();
                if (d.username) {
                    currentUsername = d.username;
                }
                if (d.pfpUrl) {
                    currentPfpUrl = d.pfpUrl;
                }
            }
            
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email || "",
                status: "online"
            }, { merge: true });
            
        } catch (e) {
            console.error("Error loading user profile in chat:", e);
        }
        
        setupPresence(db, currentUser);
        listenToAllUserProfiles();
        loadMessages(currentRoom);
        initRevoltCounter(db, currentUser, revoltUsersList, userCountSpan);
    } else {
        currentUser = null;
        const path = window.location.pathname;
        if (!path.endsWith('/') && !path.endsWith('/index.html')) {
            window.location.replace("../index.html");
        }
    }
});

function listenToAllUserProfiles() {
    if (usersUnsubscribe) usersUnsubscribe();
    usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        snapshot.forEach((docSnap) => {
            userProfiles[docSnap.id] = docSnap.data();
            
            if (currentUser && docSnap.id === currentUser.uid) {
                const data = docSnap.data();
                if (data.username) {
                    currentUsername = data.username;
                }
            }
        });
        if (currentRoom) loadMessages(currentRoom);
    }, (error) => {});
}

roomElements.forEach(room => {
    room.addEventListener('click', (e) => {
        roomElements.forEach(r => r.classList.remove('active'));
        const selected = e.currentTarget;
        selected.classList.add('active');
        currentRoom = selected.getAttribute('data-room');
        if (currentUser) loadMessages(currentRoom);
    });
});

function loadMessages(room) {
    if (unsubscribe) unsubscribe();
    if (!currentUser || !messagesContainer) return;
    
    const q = query(collection(db, "messages"), where("room", "==", room));

    unsubscribe = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = '';
        const docs = [];
        
        snapshot.forEach((docSnap) => docs.push(docSnap.data()));

        docs.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
            const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
            return timeA - timeB;
        });

        docs.forEach((data) => {
            const isSentByMe = currentUser && data.uid === currentUser.uid;
            
            const senderProfile = userProfiles[data.uid] || {};
            const tempCache = (currentUser && data.uid === currentUser.uid) ? sessionStorage.getItem('revolt_temp_username') : null;
            const senderName = senderProfile.username || data.username || tempCache || "User";
            const avatarSrc = senderProfile.pfpUrl || data.pfpUrl || defaultAvatar;
            
            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = `message-wrapper ${isSentByMe ? 'sent-wrapper' : 'received-wrapper'}`;
            wrapperDiv.innerHTML = `
                <img src="${avatarSrc}" class="chat-avatar" alt="User">
                <div class="message ${isSentByMe ? 'sent' : 'received'}">
                    <div class="message-info">
                        <span class="sender-id">${senderName}</span>
                    </div>
                    <div class="message-text">${data.text || ""}</div>
                </div>
            `;
            messagesContainer.appendChild(wrapperDiv);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendMessage() {
    if (!messageInput) return;
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    messageInput.value = "";
    
    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            room: currentRoom,
            uid: currentUser.uid,
            username: currentUsername || sessionStorage.getItem('revolt_temp_username') || "User",
            pfpUrl: currentPfpUrl,
            createdAt: serverTimestamp()
        });
    } catch (error) {}
}

if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
}

if (sendButton) {
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });
}
