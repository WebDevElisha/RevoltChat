import { collection, query, onSnapshot, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

let usersUnsubscribe = null;

export function initRevoltCounter(db, currentUser, revoltUsersList, userCountSpan) {
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
