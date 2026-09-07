import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
const bannerBtn = document.getElementById('banner-btn');
const avatarBtn = document.getElementById('avatar-btn');
const bioInput = document.getElementById('bio-input');
const saveBioBtn = document.getElementById('save-bio-btn');
const displayUsername = document.getElementById('display-username');
const displayStatus = document.getElementById('display-status');
const statMessages = document.getElementById('stat-messages');
const statGems = document.getElementById('stat-gems');

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserProfile();
        await loadMessageCount();
    } else {
        window.location.replace("../index.html");
    }
});

function renderProfileData(data, email) {
    displayUsername.textContent = data.username || email.split('@')[0];
    statGems.textContent = data.gems || 0;
    bioInput.value = data.bio || "";
    displayStatus.textContent = data.statusLevel || "Basic";

    if (data.bannerUrl) {
        bannerBg.style.backgroundImage = `url(${data.bannerUrl})`;
    }
    if (data.pfpUrl) {
        avatarImg.style.backgroundImage = `url(${data.pfpUrl})`;
    } else {
        avatarImg.style.backgroundImage = `url('../Revoltchat.png')`;
    }

    if (!data.bannerChanged || data.statusLevel === "Premium") {
        bannerBtn.style.display = "flex";
    }
    if (!data.pfpChanged || data.statusLevel === "Premium") {
        avatarBtn.style.display = "flex";
    }
}

async function loadUserProfile() {
    try {
        const cacheKey = `revolt_profile_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            renderProfileData(JSON.parse(cachedData), currentUser.email);
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            renderProfileData(data, currentUser.email);
        }
    } catch (e) {}
}

async function loadMessageCount() {
    try {
        const cacheKey = `revolt_msg_count_${currentUser.uid}`;
        const cachedCount = sessionStorage.getItem(cacheKey);

        if (cachedCount !== null) {
            statMessages.textContent = cachedCount;
            return;
        }

        const q = query(collection(db, "messages"), where("uid", "==", currentUser.uid));
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;

        sessionStorage.setItem(cacheKey, count);
        statMessages.textContent = count;
    } catch (e) {}
}

saveBioBtn.addEventListener('click', async () => {
    const newBio = bioInput.value.trim();
    if (!currentUser) return;

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            bio: newBio
        });
        
        const cacheKey = `revolt_profile_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            parsed.bio = newBio;
            sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        }

        saveBioBtn.textContent = "Saved!";
        setTimeout(() => saveBioBtn.textContent = "Save", 2000);
    } catch (e) {}
});

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

bannerUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    try {
        const base64Img = await resizeAndConvertImage(file, 800, 300);
        await updateDoc(doc(db, "users", currentUser.uid), {
            bannerUrl: base64Img,
            bannerChanged: true
        });

        const cacheKey = `revolt_profile_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            parsed.bannerUrl = base64Img;
            parsed.bannerChanged = true;
            sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        }

        bannerBg.style.backgroundImage = `url(${base64Img})`;
        bannerBtn.style.display = "none";
    } catch (err) {}
});

avatarUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    try {
        const base64Img = await resizeAndConvertImage(file, 200, 200);
        await updateDoc(doc(db, "users", currentUser.uid), {
            pfpUrl: base64Img,
            pfpChanged: true
        });

        const cacheKey = `revolt_profile_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            parsed.pfpUrl = base64Img;
            parsed.pfpChanged = true;
            sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        }

        avatarImg.style.backgroundImage = `url(${base64Img})`;
        avatarBtn.style.display = "none";
    } catch (err) {}
});
