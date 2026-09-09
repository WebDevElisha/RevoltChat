import { collection, query, onSnapshot, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

let usersUnsubscribe = null;

export function initRevoltCounter(db, currentUser, revoltUsersList, userCountSpan) {
    if (usersUnsubscribe) usersUnsubscribe();
    if (!currentUser) return;
    
    const defaultAvatar = window.location.pathname.includes('/html/') ? "../Revoltchat.png" : "Revoltchat.png";
    const q = query(collection(db, "users"), where("status", "==", "online"));
    
    usersUnsubscribe = onSnapshot(q, (snapshot) => {
        if (!revoltUsersList || !userCountSpan) return;
        revoltUsersList.innerHTML = '';
        let count = 0;
        
        snapshot.forEach((docSnap) => {
            count++;
            const userData = docSnap.data();
            const tempCache = sessionStorage.getItem('revolt_temp_username');
            const fallbackName = (docSnap.id === currentUser.uid ? (tempCache || currentUser.displayName || currentUser.email?.split('@')[0]) : null) || userData.email?.split('@')[0] || "Unknown";
            const displayName = userData.username || fallbackName;
            const avatarSrc = userData.pfpUrl || defaultAvatar;

            const li = document.createElement('li');
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.gap = "8px";
            li.style.marginBottom = "6px";
            
            li.innerHTML = `
                <img src="${avatarSrc}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);" alt="Avatar">
                <span>${displayName}</span>
            `;
            revoltUsersList.appendChild(li);
        });
        
        userCountSpan.textContent = count;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, (error) => {});
}

export function setupPresence(db, currentUser) {
    const setOfflineStatus = () => {
        if (currentUser) {
            setDoc(doc(db, "users", currentUser.uid), {
                status: "offline"
            }, { merge: true }).catch(() => {});
        }
    };

    window.addEventListener('beforeunload', setOfflineStatus);
    window.addEventListener('pagehide', setOfflineStatus);
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            setOfflineStatus();
        } else if (document.visibilityState === 'visible' && currentUser) {
            const fallbackUsername = sessionStorage.getItem('revolt_temp_username') || currentUser.email?.split('@')[0] || "User";
            setDoc(doc(db, "users", currentUser.uid), {
                status: "online",
                username: fallbackUsername
            }, { merge: true }).catch(() => {});
        }
    });
}
