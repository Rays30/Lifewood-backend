// Lifewood WebsiteFinal/assets/js/admin-login.js

import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase-config.js";
import { showToast } from "./utils.js"; // Import showToast utility

const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const adminLoginMessage = document.getElementById('adminLoginMessage');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = usernameInput.value;
            const password = passwordInput.value;

            adminLoginMessage.textContent = "";
            adminLoginMessage.classList.remove("success", "error");
            adminLoginMessage.style.display = "none"; // Hide by default

            // Show loading overlay
            document.getElementById('loadingOverlay').classList.add('show');

            try {
                const userCredential = await signInWithEmailAndPassword(auth, username, password);
                const user = userCredential.user;

                // --- START MODIFICATION ---
                // Define the admin email. This should match the expected admin email.
                const ADMIN_EMAIL = "admin@lifewood.com"; // Adjust this if your admin email is different
                const userRole = user.email === ADMIN_EMAIL ? "admin" : "user";

                // Store user information, including role, in localStorage
                localStorage.setItem('user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    role: userRole
                }));
                // --- END MODIFICATION ---

                showToast("Login successful!", "success");
                setTimeout(() => {
                    window.location.href = "dashboard"; // Redirect to the dashboard
                }, 1000);

            } catch (error) {
                document.getElementById('loadingOverlay').classList.remove('show');
                console.error("Login failed:", error.code, error.message);
                let errorMessage = "Login failed. Please check your credentials.";

                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address format.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This user account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'Invalid username or password.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed login attempts. Please try again later.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                    default:
                        errorMessage = 'An unexpected error occurred. Please try again.';
                        break;
                }
                adminLoginMessage.textContent = errorMessage;
                adminLoginMessage.classList.add("error");
                adminLoginMessage.style.display = "block"; // Show message
                showToast(errorMessage, "error");
            }
        });
    }
});