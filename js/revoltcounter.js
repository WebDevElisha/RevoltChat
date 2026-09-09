import { collection, query, onSnapshot, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
            const displayName = userData.username || (docSnap.id === currentUser.uid ? tempCache : null) || "Unknown";
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
            updateDoc(doc(db, "users", currentUser.uid), {
                status: "offline"
            }).catch(() => {});
        }
    };

    window.addEventListener('beforeunload', setOfflineStatus);
    window.addEventListener('pagehide', setOfflineStatus);
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            setOfflineStatus();
        } else if (document.visibilityState === 'visible' && currentUser) {
            updateDoc(doc(db, "users", currentUser.uid), {
                status: "online"
            }).catch(() => {});
        }
    });
}
