import { app, auth } from './firebase-config.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// --- FIX: Corrected import for utility functions ---
import { showToast, toggleLoadingOverlay } from './utils.js';

const db = getFirestore(app);
const contactForm = document.getElementById('contactForm');
// The formMessageDiv is generally not needed if you're using showToast
// const formMessageDiv = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleLoadingOverlay(true); // Show loading indicator

        const name = contactForm.name.value;
        const email = contactForm.email.value;
        const subject = contactForm.subject.value;
        const category = contactForm.category.value;
        const message = contactForm.message.value;

        // Basic validation
        if (!name || !email || !category || !message) {
            showToast('Please fill in all required fields.', 'error');
            toggleLoadingOverlay(false); // Hide loading indicator
            return;
        }

        try {
            // --- FIX: Changed collection name from 'contactMessages' to 'contacts' ---
            await addDoc(collection(db, 'contacts'), {
                name: name,
                email: email,
                subject: subject,
                category: category,
                message: message,
                timestamp: new Date(), // Add server timestamp
                status: 'New', // Default status for new messages
                replies: [] // Initialize an empty array for replies
            });

            contactForm.reset();
            showToast('Your message has been sent successfully!', 'success');
        } catch (error) {
            console.error('Error sending message: ', error);
            showToast('Failed to send message. Please try again later: ' + error.message, 'error'); // Added error.message for more detail
        } finally {
            toggleLoadingOverlay(false); // Hide loading indicator
        }
    });
}