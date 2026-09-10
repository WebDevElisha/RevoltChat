import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

const updateUsernameBtn = document.getElementById('update-username-btn');
const updatePasswordBtn = document.getElementById('update-password-btn');
const logoutBtn = document.getElementById('logout-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');

let currentUser = null;
let msgUnsubscribe = null;
let userUnsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        applyThemeFromStorage();
        
        const cachedUsername = sessionStorage.getItem('revolt_temp_username');
        if (displayUsername) {
            displayUsername.textContent = cachedUsername || user.displayName || user.email?.split('@')[0] || "User";
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
    const fallbackName = cachedUsername || currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";
    if (displayUsername) {
        displayUsername.textContent = data.username || fallbackName;
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
    userUnsubscribe = onSnapshot(userRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.username) {
                sessionStorage.setItem('revolt_temp_username', data.username);
            } else {
                const cachedUsername = sessionStorage.getItem('revolt_temp_username') || currentUser.email?.split('@')[0] || "User";
                await setDoc(userRef, { username: cachedUsername }, { merge: true });
                return;
            }

            if (data.theme) {
                localStorage.setItem('revolt_theme', data.theme);
                applyThemeFromStorage();
            }
            renderProfileData(data);
        } else {
            const cachedUsername = sessionStorage.getItem('revolt_temp_username') || currentUser.email?.split('@')[0] || "User";
            await setDoc(userRef, { username: cachedUsername, status: "online" }, { merge: true });
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
            await setDoc(doc(db, "users", currentUser.uid), { bio: newBio }, { merge: true });
            saveBioBtn.textContent = "Saved!";
            setTimeout(() => saveBioBtn.textContent = "Save", 2000);
        } catch (e) {}
    });
}

if (updateUsernameBtn) {
    updateUsernameBtn.addEventListener('click', async () => {
        const newUsernameInput = document.getElementById('new-username-input');
        const newUsername = newUsernameInput.value.trim();
        if (!newUsername) {
            alert('Please enter a new username.');
            return;
        }
        if (currentUser) {
            try {
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    username: newUsername
                });
                sessionStorage.setItem('revolt_temp_username', newUsername);
                if (displayUsername) displayUsername.textContent = newUsername;
                newUsernameInput.value = '';
                alert('Username updated successfully!');
            } catch (error) {
                alert('Failed to update username: ' + error.message);
            }
        }
    });
}

if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
        const newPasswordInput = document.getElementById('new-password-input');
        const newPassword = newPasswordInput.value;
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        if (currentUser) {
            try {
                await updatePassword(currentUser, newPassword);
                newPasswordInput.value = '';
                alert('Password updated successfully!');
            } catch (error) {
                alert('Failed to update password. Please re-authenticate and try again.');
            }
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../index.html';
        } catch (error) {
            alert('Failed to log out.');
        }
    });
}

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (!confirmDelete) return;

        if (currentUser) {
            try {
                await deleteDoc(doc(db, 'users', currentUser.uid));
                await deleteUser(currentUser);
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            } catch (error) {
                alert('Failed to delete account. Please re-authenticate and try again.');
            }
        }
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
            await setDoc(doc(db, "users", currentUser.uid), { bannerUrl: base64Img }, { merge: true });
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
            await setDoc(doc(db, "users", currentUser.uid), { pfpUrl: base64Img }, { merge: true });
            if (avatarImg) avatarImg.style.backgroundImage = `url(${base64Img})`;
        } catch (err) {}
    });
}
