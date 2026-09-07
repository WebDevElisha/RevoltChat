import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, where, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

let currentUser = null;
let currentUsername = "";
let currentRoom = "General";
let unsubscribe = null;
let usersUnsubscribe = null;

window.addEventListener('beforeunload', () => {
    if (currentUser) {
        updateDoc(doc(db, "users", currentUser.uid), {
            status: "offline"
        }).catch(() => {});
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        currentUsername = user.email ? user.email.split('@')[0] : "User";
        
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().username) {
                currentUsername = userDoc.data().username;
            }
            
            await updateDoc(doc(db, "users", user.uid), {
                status: "online",
                username: currentUsername
            });
        } catch (e) {
            console.error("Error fetching user profile:", e);
        }
        
        loadMessages(currentRoom);
        loadRevolters();
    } else {
        currentUser = null;
        const path = window.location.pathname;
        if (!path.endsWith('/') && !path.endsWith('/index.html')) {
            window.location.replace("../index.html");
        }
    }
});

roomElements.forEach(room => {
    room.addEventListener('click', (e) => {
        roomElements.forEach(r => r.classList.remove('active'));
        const selected = e.currentTarget;
        selected.classList.add('active');
        currentRoom = selected.getAttribute('data-room');
        if (currentUser) loadMessages(currentRoom);
    });
});

function loadRevolters() {
    if (usersUnsubscribe) usersUnsubscribe();
    if (!currentUser) return;
    
    const q = query(collection(db, "users"), where("status", "==", "online"));
    
    usersUnsubscribe = onSnapshot(q, (snapshot) => {
        if (!revoltUsersList || !userCountSpan) return;
        revoltUsersList.innerHTML = '';
        let count = 0;
        
        snapshot.forEach((docSnap) => {
            count++;
            const userData = docSnap.data();
            const displayName = userData.username || "User";
            const li = document.createElement('li');
            li.innerHTML = `<i data-lucide="user" size="16" style="color: var(--border-color);"></i> <span>${displayName}</span>`;
            revoltUsersList.appendChild(li);
        });
        
        userCountSpan.textContent = count;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, (error) => {
        console.error("Revolt Counter Error:", error);
    });
}

function loadMessages(room) {
    if (unsubscribe) unsubscribe();
    if (!currentUser) return;
    
    messagesContainer.innerHTML = '';
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
            const messageDiv = document.createElement('div');
            const isSentByMe = currentUser && data.uid === currentUser.uid;
            const senderName = data.username || "User";
            
            messageDiv.className = `message ${isSentByMe ? 'sent' : 'received'}`;
            messageDiv.innerHTML = `
                <div class="message-info">
                    <span class="sender-id">${senderName}</span>
                </div>
                <div class="message-text">${data.text || ""}</div>
            `;
            messagesContainer.appendChild(messageDiv);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    messageInput.value = "";
    
    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            room: currentRoom,
            uid: currentUser.uid,
            username: currentUsername || "User",
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error(error);
    }
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
