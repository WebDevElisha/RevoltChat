import { auth, db } from './firebase-config.js';
import { updatePassword, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const updateUsernameBtn = document.getElementById('update-username-btn');
if (updateUsernameBtn) {
    updateUsernameBtn.addEventListener('click', async () => {
        const newUsernameInput = document.getElementById('new-username-input');
        const newUsername = newUsernameInput.value.trim();
        const user = auth.currentUser;

        if (!newUsername) {
            alert('Please enter a new username.');
            return;
        }

        if (user) {
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    username: newUsername
                });
                sessionStorage.setItem('revolt_temp_username', newUsername);
                const displayUsername = document.getElementById('display-username');
                if (displayUsername) displayUsername.textContent = newUsername;
                newUsernameInput.value = '';
                alert('Username updated successfully!');
            } catch (error) {
                alert('Failed to update username: ' + error.message);
            }
        }
    });
}

const updatePasswordBtn = document.getElementById('update-password-btn');
if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
        const newPasswordInput = document.getElementById('new-password-input');
        const newPassword = newPasswordInput.value;
        const user = auth.currentUser;

        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        if (user) {
            try {
                await updatePassword(user, newPassword);
                newPasswordInput.value = '';
                alert('Password updated successfully!');
            } catch (error) {
                alert('Failed to update password. Please re-authenticate and try again.');
            }
        }
    });
}

const logoutBtn = document.getElementById('logout-btn');
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

const deleteAccountBtn = document.getElementById('delete-account-btn');
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (!confirmDelete) return;

        const user = auth.currentUser;
        if (user) {
            try {
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            } catch (error) {
                alert('Failed to delete account. Please re-authenticate and try again.');
            }
        }
    });
}
