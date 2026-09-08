/* js/global.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

function applyTheme(themeName) {
    if (themeName && themeName !== 'default' && themeName !== '') {
        document.documentElement.className = `theme-${themeName}`;
    } else {
        document.documentElement.className = '';
    }
}

const savedTheme = localStorage.getItem('revolt_theme') || 'default';
applyTheme(savedTheme);

window.updateAppTheme = function(themeName) {
    const finalTheme = themeName || 'default';
    localStorage.setItem('revolt_theme', finalTheme);
    applyTheme(finalTheme);
    loadParticles('on');
};

function loadParticles(status) {
    const pDiv = document.getElementById('particles-js');
    if (!pDiv) return;

    if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
    }
    pDiv.innerHTML = '';

    if (status === 'off') return;

    const rootStyles = getComputedStyle(document.body);
    let particleColor = rootStyles.getPropertyValue('--particle-hex').trim().replace(/['"]/g, '');
    if (!particleColor) particleColor = "#ff0000";

    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 100, density: { enable: true, value_area: 800 } },
                color: { value: particleColor },
                shape: { type: "circle" },
                opacity: { value: 0.8, random: true },
                size: { value: 4, random: true },
                line_linked: { enable: false },
                move: {
                    enable: true,
                    speed: 1.5,
                    direction: "bottom",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: false },
                    onclick: { enable: false },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        const path = window.location.pathname;
        const isIndexPage = path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('index.html');

        if (user) {
            if (isIndexPage) {
                window.location.replace('home.html');
                return;
            }

            const cacheKey = `revolt_profile_${user.uid}`;
            const cachedData = sessionStorage.getItem(cacheKey);

            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    const userTheme = data.theme || 'default';
                    localStorage.setItem('revolt_theme', userTheme);
                    applyTheme(userTheme);
                    setTimeout(() => loadParticles(data.particles || 'on'), 50);
                    return;
                } catch (e) {}
            }

            try {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                    const userTheme = data.theme || 'default';
                    localStorage.setItem('revolt_theme', userTheme);
                    applyTheme(userTheme);
                    setTimeout(() => loadParticles(data.particles || 'on'), 50);
                } else {
                    applyTheme('default');
                    loadParticles('on');
                }
            } catch (error) {
                applyTheme('default');
                loadParticles('on');
            }
        } else {
            if (!isIndexPage) {
                window.location.replace('index.html');
                return;
            }
            applyTheme('default');
            loadParticles('on');
        }
    });
});

window.showNotification = function(message) {
    let popup = document.getElementById('global-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'global-popup';
        popup.style.position = 'fixed';
        popup.style.bottom = '20px';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.backgroundColor = 'var(--border-color)';
        popup.style.color = '#fff';
        popup.style.padding = '10px 20px';
        popup.style.borderRadius = '5px';
        popup.style.zIndex = '9999';
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 0.3s ease';
        popup.style.pointerEvents = 'none';
        document.body.appendChild(popup);
    }
    
    popup.textContent = message;
    popup.style.opacity = '1';
    
    setTimeout(() => popup.style.opacity = '0', 3000);
};

window.getCachedUserAvatar = function(uid) {
    const cached = sessionStorage.getItem(`revolt_profile_${uid}`);
    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (data.pfpUrl) return data.pfpUrl;
        } catch(e) {}
    }
    return 'Revoltchat.png';
};
