import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
        window.location.replace("home.html"); 
    }
});

const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const usernameGroup = document.getElementById('username-group');
const usernameInput = document.getElementById('username-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const authActionBtn = document.getElementById('auth-action-btn');
const authError = document.getElementById('auth-error');
const togglePrompt = document.getElementById('toggle-prompt');
const toggleMode = document.getElementById('toggle-mode');

let isLoginMode = false;

toggleMode.addEventListener('click', (e) => {
    e.preventDefault(); 
    
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        authTitle.textContent = "Log In";
        authSubtitle.textContent = "Welcome back to Revolt Chat.";
        usernameGroup.style.display = "none";
        authActionBtn.textContent = "Log In";
        togglePrompt.textContent = "Don't have an account?";
        toggleMode.textContent = "Sign up";
    } else {
        authTitle.textContent = "Sign Up";
        authSubtitle.textContent = "Create an account to join Revolt Chat.";
        usernameGroup.style.display = "block";
        authActionBtn.textContent = "Create Account";
        togglePrompt.textContent = "Already have an account?";
        toggleMode.textContent = "Log in";
    }
    
    authError.textContent = "";
});

authActionBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const username = usernameInput.value.trim();
    
    authError.textContent = "";

    if (!email || !password) {
        authError.textContent = "Email and password are required.";
        return;
    }

    try {
        if (isLoginMode) {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await setDoc(doc(db, "users", user.uid), {
                status: "online"
            }, { merge: true });

            window.location.href = "home.html";
            
        } else {
            if (!username) {
                authError.textContent = "Username is required for sign up.";
                return;
            }
            if (username.length > 20) {
                authError.textContent = "Username must be 20 characters or less.";
                return;
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

           
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                status: "online"
            });

            window.location.href = "home.html";
        }
    } catch (error) {
        authError.textContent = error.message.replace("Firebase: ", "");
    }
});
