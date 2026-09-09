import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getCountFromServer, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

const bannerBg = document.getElementById('banner-bg');
const avatarImg = document.getElementById('avatar-img');
const bannerUpload = document.getElementById('banner-upload');
const avatarUpload = document.getElementById('avatar-upload');
const bioInput = document.getElementById('bio-input');
const saveBioBtn = document.getElementById('save-bio-btn');
const displayUsername = document.getElementById('display-username');
const displayStatus = document.getElementById('display-status');
const statMessages = document.getElementById('stat-messages');
const statGems = document.getElementById('stat-gems');

let currentUser = null;
let msgUnsubscribe = null;
let userUnsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        applyThemeFromStorage();
        
        
        const cachedUsername = sessionStorage.getItem('revolt_temp_username');
        if (displayUsername && cachedUsername) {
            displayUsername.textContent = cachedUsername;
        }

        listenToUserProfile();
        listenToMessageCount();
    } else {
        window.location.replace("../index.html");
    }
});

function applyThemeFromStorage() {
    const savedTheme = localStorage.getItem('revolt_theme');
    if (savedTheme && savedTheme !== 'default') {
        document.documentElement.className = `theme-${savedTheme}`;
    } else {
        document.documentElement.className = '';
    }
}

function renderProfileData(data) {
    const cachedUsername = sessionStorage.getItem('revolt_temp_username');
    if (displayUsername) {
        displayUsername.textContent = data.username || cachedUsername || "User";
    }
    if (statGems) statGems.textContent = data.gems || 0;
    if (bioInput && document.activeElement !== bioInput) bioInput.value = data.bio || "";
    if (displayStatus) displayStatus.textContent = data.statusLevel || "Basic";

    if (bannerBg && data.bannerUrl) {
        bannerBg.style.backgroundImage = `url(${data.bannerUrl})`;
    }
    if (avatarImg) {
        if (data.pfpUrl) {
            avatarImg.style.backgroundImage = `url(${data.pfpUrl})`;
        } else {
            avatarImg.style.backgroundImage = `url('../Revoltchat.png')`;
        }
    }
}

function listenToUserProfile() {
    const userRef = doc(db, "users", currentUser.uid);
    userUnsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.theme) {
                localStorage.setItem('revolt_theme', data.theme);
                applyThemeFromStorage();
            }
            renderProfileData(data);
        }
    });
}

function listenToMessageCount() {
    const q = query(collection(db, "messages"), where("uid", "==", currentUser.uid));
    msgUnsubscribe = onSnapshot(q, (snapshot) => {
        if (statMessages) {
            statMessages.textContent = snapshot.size;
        }
    });
}

if (saveBioBtn) {
    saveBioBtn.addEventListener('click', async () => {
        const newBio = bioInput ? bioInput.value.trim() : "";
        if (!currentUser) return;

        try {
            await updateDoc(doc(db, "users", currentUser.uid), { bio: newBio });
            saveBioBtn.textContent = "Saved!";
            setTimeout(() => saveBioBtn.textContent = "Save", 2000);
        } catch (e) {}
    });
}

function resizeAndConvertImage(file, maxWidth, maxHeight, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
    });
}

if (bannerUpload) {
    bannerUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        try {
            const base64Img = await resizeAndConvertImage(file, 800, 300);
            await updateDoc(doc(db, "users", currentUser.uid), { bannerUrl: base64Img });
            if (bannerBg) bannerBg.style.backgroundImage = `url(${base64Img})`;
        } catch (err) {}
    });
}

if (avatarUpload) {
    avatarUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        try {
            const base64Img = await resizeAndConvertImage(file, 200, 200);
            await updateDoc(doc(db, "users", currentUser.uid), { pfpUrl: base64Img });
            if (avatarImg) avatarImg.style.backgroundImage = `url(${base64Img})`;
        } catch (err) {}
    });
}
