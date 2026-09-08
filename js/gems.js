import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

const rewards = [200, 300, 450, 675, 1013, 1519, 2278];
const daysContainer = document.getElementById('days-container');
const collectBtn = document.getElementById('collect-btn');

let currentUid = null;
let userData = null;

if (daysContainer && collectBtn) {
    renderBoard(true, 1, true);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUid = user.uid;
            await loadUserData();
        }
    });
}

async function loadUserData() {
    const userRef = doc(db, "users", currentUid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        userData = docSnap.data();
    } else {
        userData = {
            gemStreak: 1,
            lastGemClaim: 0,
            walletGems: 0,
            gems: 0
        };
        await setDoc(userRef, userData);
    }
    
    evaluateStreak();
}

function evaluateStreak() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let gemStreak = userData.gemStreak || 1;
    let lastGemClaim = userData.lastGemClaim || 0;
    let canClaim = true;

    if (lastGemClaim > 0) {
        const timePassed = now - lastGemClaim;
        
        if (timePassed < oneDay) {
            canClaim = false;
        } else if (timePassed >= oneDay * 2) {
            gemStreak = 1;
        } else {
            gemStreak++;
            if (gemStreak > 7) {
                gemStreak = 1;
            }
        }
    }

    userData.gemStreak = gemStreak;
    renderBoard(canClaim, userData.gemStreak, false);
}

function renderBoard(canClaim, currentDay, isLoading) {
    if (!daysContainer || !collectBtn) return;
    daysContainer.innerHTML = '';
    
    rewards.forEach((amt, index) => {
        const dayNum = index + 1;
        const box = document.createElement('div');
        box.className = 'day-card';
        
        if (dayNum < currentDay) {
            box.classList.add('claimed');
        } else if (dayNum === currentDay) {
            if (canClaim) {
                box.classList.add('active');
            } else {
                box.classList.add('claimed');
            }
        } else {
            box.classList.add('locked');
        }
        
        box.innerHTML = `
            <div class="day-label">Day ${dayNum}</div>
            <div class="gem-icon"><i data-lucide="gem" size="32"></i></div>
            <div class="gem-amount">+${amt}</div>
        `;
        
        daysContainer.appendChild(box);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }

    if (isLoading) {
        collectBtn.textContent = 'Loading...';
        collectBtn.style.opacity = '0.5';
        collectBtn.style.cursor = 'wait';
        collectBtn.onclick = null;
    } else if (!canClaim) {
        collectBtn.style.opacity = '0.5';
        collectBtn.style.cursor = 'not-allowed';
        collectBtn.textContent = 'Come Back in 24 Hours';
        collectBtn.onclick = null;
    } else {
        collectBtn.style.opacity = '1';
        collectBtn.style.cursor = 'pointer';
        collectBtn.textContent = `Collect Day ${currentDay} Reward`;
        
        collectBtn.onclick = async () => {
            collectBtn.onclick = null;
            collectBtn.textContent = 'Collecting...';
            await processClaim();
        };
    }
}

async function processClaim() {
    const rewardAmount = rewards[userData.gemStreak - 1];
    userData.walletGems = (userData.walletGems || 0) + rewardAmount;
    userData.gems = (userData.gems || 0) + rewardAmount;
    userData.lastGemClaim = Date.now();
    
    const userRef = doc(db, "users", currentUid);
    await updateDoc(userRef, {
        gemStreak: userData.gemStreak,
        lastGemClaim: userData.lastGemClaim,
        walletGems: userData.walletGems,
        gems: userData.gems
    });
    
    renderBoard(false, userData.gemStreak, false);
    
    if (window.showNotification) {
        window.showNotification(`Awesome! You collected ${rewardAmount} gems! 💎`);
    }
}
