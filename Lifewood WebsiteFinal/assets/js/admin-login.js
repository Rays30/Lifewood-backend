// assets/js/admin-login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const loginForm = document.getElementById('adminLoginForm');
const loginMessage = document.getElementById('adminLoginMessage');

// Check if user is already logged in (optional, but good UX)
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
});

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.username.value; // Assuming 'username' input is actually for email
        const password = loginForm.password.value;

        loginMessage.style.display = 'none'; // Hide previous messages

        try {
            // Firebase Authentication: Sign in with email and password
            await signInWithEmailAndPassword(auth, email, password);
            loginMessage.textContent = 'Login successful! Redirecting...';
            loginMessage.className = 'admin-message success';
            loginMessage.style.display = 'block';
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Redirect to dashboard
            }, 1000);
        } catch (error) {
            console.error("Login error:", error.code, error.message);
            let message = 'Login failed. Please check your credentials.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email format.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many failed login attempts. Try again later.';
            }
            loginMessage.textContent = message;
            loginMessage.className = 'admin-message error';
            loginMessage.style.display = 'block';
        }
    });
}