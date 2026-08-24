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

const usernameDisplay = document.getElementById('wallet-username');
const gemAmountDisplay = document.getElementById('gem-amount');
const gemStreakDisplay = document.getElementById('gem-streak');
const messagesSentDisplay = document.getElementById('messages-sent');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                usernameDisplay.textContent = data.username || "User";
                gemAmountDisplay.textContent = data.gems || 0;
                gemStreakDisplay.textContent = data.gemStreak || 0;
                messagesSentDisplay.textContent = data.messagesSent || 0;
            } else {
                usernameDisplay.textContent = "Data Not Found";
            }
        } catch (error) {
            usernameDisplay.textContent = "Error Loading";
        }
    } else {
        window.location.href = "../index.html";
    }
});
