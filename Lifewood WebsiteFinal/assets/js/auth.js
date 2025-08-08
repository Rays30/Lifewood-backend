// Lifewood WebsiteFinal/assets/js/auth.js

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase-config.js";
import { showToast } from "./utils.js"; // Assuming utils.js is updated/present and exports showToast

const auth = getAuth(app);
const ADMIN_EMAIL = "admin@lifewood.com"; // Define the admin email as seen in dashboard.html

export function checkAdminAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    const adminPages = [
        "dashboard.html",
        "jobapplicants.html",
        "managejobs.html",
        "contacts.html"
    ];

    if (adminPages.includes(currentPage)) {
        // Step 1: Immediate check using localStorage to prevent content flicker
        const storedUser = localStorage.getItem('user');
        let isAuthenticatedLocally = false;
        let isAdminRoleLocally = false;

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user && user.email === ADMIN_EMAIL && user.role === 'admin') {
                    isAuthenticatedLocally = true;
                    isAdminRoleLocally = true;
                    console.log("Local storage indicates admin. Proceeding with Firebase verification...");
                }
            } catch (e) {
                console.error("Error parsing user from localStorage:", e);
                localStorage.removeItem('user'); // Clear corrupted data
            }
        }

        if (!isAuthenticatedLocally || !isAdminRoleLocally) {
            console.warn(`Attempted access to ${currentPage} by non-admin/unauthenticated user. Redirecting to index.html.`);
            showToast("Access Denied: You must be logged in as an administrator.", "error", 2500);
            setTimeout(() => { window.location.href = "index.html"; }, 1000); // Redirect faster
            return; // Crucial: Stop further execution of the script for this page
        }

        // Step 2: Firebase Auth state observer for authoritative verification
        // This runs asynchronously after the initial synchronous check.
        onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.email === ADMIN_EMAIL) {
                    // User is signed in and is the admin
                    // Update localStorage in case of inconsistencies or first load after login
                    localStorage.setItem('user', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        role: "admin"
                    }));
                    console.log(`Firebase confirms admin for ${currentPage}. Access granted.`);
                } else {
                    // User is signed in but not the admin email
                    console.warn(`Firebase confirms user (${user.email}) but not admin. Redirecting from ${currentPage}.`);
                    localStorage.removeItem('user'); // Clear incorrect local storage
                    showToast("Access Denied: Your account is not authorized for this page.", "error", 2500);
                    setTimeout(() => { window.location.href = "index.html"; }, 1000);
                }
            } else {
                // No user signed in according to Firebase
                console.warn(`Firebase confirms no user logged in. Redirecting from ${currentPage}.`);
                localStorage.removeItem('user'); // Ensure no stale user data
                showToast("Access Denied: You must be logged in.", "error", 2500);
                setTimeout(() => { window.location.href = "index.html"; }, 1000);
            }
        });
    } else {
        // For public pages (e.g., index.html, about.html, contact.html, admin-login.html)
        // Just ensure localStorage user data is in sync with Firebase state if a user is logged in.
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRole = user.email === ADMIN_EMAIL ? "admin" : "user";
                localStorage.setItem('user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    role: userRole
                }));
            } else {
                localStorage.removeItem('user'); // No user signed in, clear any stale data
            }
        });
    }
}