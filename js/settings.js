if (localStorage.getItem('revolt_is_down') === 'true') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const base = window.location.hostname.endsWith('github.io') && segments.length > 0 ? `/${segments[0]}/` : '/';
    if (!window.location.pathname.includes('downtime.html')) window.location.replace(base + 'downtime.html');
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
    const themeBoxes = document.querySelectorAll('.theme-box');
    const toggleParticles = document.getElementById('toggle-particles');
    const saveBtn = document.getElementById('save-settings-btn');
    
    let currentUid = null;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUid = user.uid;
            try {
                const userRef = doc(db, "users", currentUid);
                const docSnap = await getDoc(userRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    if (data.theme) {
                        themeBoxes.forEach(box => {
                            box.classList.remove('selected');
                            if (box.dataset.theme === data.theme) {
                                box.classList.add('selected');
                            }
                        });
                    }
                    
                    if (toggleParticles) {
                        toggleParticles.checked = data.particles !== 'off';
                    }
                }
            } catch (error) {}
        }
    });

    themeBoxes.forEach(box => {
        box.addEventListener('click', () => {
            themeBoxes.forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            
            const previewTheme = box.dataset.theme || 'default';
            if (window.updateAppTheme) {
                window.updateAppTheme(previewTheme, toggleParticles && toggleParticles.checked ? 'on' : 'off');
            }
        });
    });

    if (toggleParticles) {
        toggleParticles.addEventListener('change', () => {
            const selectedThemeBox = document.querySelector('.theme-box.selected');
            const currentTheme = selectedThemeBox ? selectedThemeBox.dataset.theme : 'default';
            if (window.updateAppTheme) {
                window.updateAppTheme(currentTheme, toggleParticles.checked ? 'on' : 'off');
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentUid) return;
            
            const selectedThemeBox = document.querySelector('.theme-box.selected');
            const selectedTheme = selectedThemeBox ? selectedThemeBox.dataset.theme : 'default';
            const particlesEnabled = toggleParticles && toggleParticles.checked ? 'on' : 'off';
            
            try {
                const userRef = doc(db, "users", currentUid);
                await setDoc(userRef, {
                    theme: selectedTheme,
                    particles: particlesEnabled
                }, { merge: true });
                
                const cacheKey = `revolt_profile_${currentUid}`;
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    parsed.theme = selectedTheme;
                    parsed.particles = particlesEnabled;
                    sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
                }

                if (window.updateAppTheme) {
                    window.updateAppTheme(selectedTheme, particlesEnabled);
                }
                
                if (window.showNotification) {
                    window.showNotification('Settings saved successfully!');
                }
            } catch (error) {
                if (window.showNotification) {
                    window.showNotification('Error saving settings.');
                }
            }
        });
    }
});
