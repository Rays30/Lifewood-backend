// ===============================================
// Imports from Firebase and other utility modules
// ===============================================
import { app } from './firebase-config.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    getFirestore,
    collection,
    getDocs, // Still needed for general queries
    getDoc,  // Used for single document fetches (e.g., reply history)
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast, toggleLoadingOverlay } from './utils.js'; // Assuming utils.js exists

// ===============================================
// Firebase Service Initialization
// ===============================================
const auth = getAuth(app);
const db = getFirestore(app);
// === Collection name: 'contacts' to match the Firebase index and data collection name ===
const contactsCollection = collection(db, 'contacts');

// ===============================================
// DOM Element References
// ===============================================
const logoutButton = document.getElementById('logoutButton');
const contactMessagesTableBody = document.querySelector('#contactMessagesTable tbody');
const contactFilter = document.getElementById('contactFilter');
const categoryFilter = document.getElementById('categoryFilter');
const contactSearchBar = document.getElementById('contactSearchBar');
const showIgnoredToggle = document.getElementById('showIgnoredToggle');

const replyModal = document.getElementById('replyModal');
const replyModalCloseButton = replyModal.querySelector('.modal-close-button');
const originalSubjectEl = document.getElementById('originalSubject');
const originalMessageEl = document.getElementById('originalMessage');
const replyHistoryEl = document.getElementById('replyHistory');
const replyToEmailEl = document.getElementById('replyToEmail');
const replySubjectEl = document.getElementById('replySubject');
const replyMessageEl = document.getElementById('replyMessage');
const replyForm = document.getElementById('replyForm');
const replyMessageStatusEl = document.getElementById('replyMessageStatus');

let currentMessageId = null; // To store the ID of the message being replied to


// ===============================================
// Authentication State Management
// ===============================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // User is signed out, redirect to login
        window.location.href = 'admin-login.html';
    } else {
        // User is signed in, load messages
        console.log('Admin user logged in:', user.email);
        loadContactMessages();
    }
});

// ===============================================
// Logout Functionality
// ===============================================
logoutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            // Sign-out successful.
            showToast("Signed out successfully!", "success");
            window.location.href = 'admin-login.html';
        })
        .catch((error) => {
            // An error happened.
            console.error("Error signing out:", error);
            showToast("Error signing out: " + error.message, "error");
        });
});

// ===============================================
// Load and Display Contact Messages
// ===============================================
async function loadContactMessages() {
    toggleLoadingOverlay(true);
    try {
        let q;
        const selectedStatus = contactFilter.value;
        const selectedCategory = categoryFilter.value;
        const searchTerm = contactSearchBar.value.toLowerCase();
        const showIgnored = showIgnoredToggle.checked;

        let filters = [];

        // --- UPDATED STATUS FILTER LOGIC ---
        if (showIgnored && selectedStatus === 'All') {
            // If 'Show Ignored' is checked AND 'Filter by Status' is 'All',
            // then explicitly show ONLY 'Ignored' messages.
            filters.push(where('status', '==', 'Ignored'));
        } else if (selectedStatus !== 'All') {
            // If a specific status is selected (e.g., 'New', 'Replied', 'Ignored'), apply it.
            filters.push(where('status', '==', selectedStatus));
        } else { // This means 'selectedStatus' is 'All' AND 'showIgnored' is UNCHECKED
            // Default: Filter out 'Ignored' messages if 'Show Ignored' is unchecked
            filters.push(where('status', '!=', 'Ignored'));
        }
        // --- END UPDATED STATUS FILTER LOGIC ---


        // Apply category filter
        if (selectedCategory !== 'All') {
            filters.push(where('category', '==', selectedCategory));
        }

        // Combine filters into the query, always order by timestamp
        q = query(contactsCollection, ...filters, orderBy('timestamp', 'desc'));

        const querySnapshot = await getDocs(q);
        let messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        // Apply search filter in client-side for simplicity, as Firestore search is limited
        if (searchTerm) {
            messages = messages.filter(msg =>
                msg.name.toLowerCase().includes(searchTerm) ||
                msg.email.toLowerCase().includes(searchTerm) ||
                msg.subject.toLowerCase().includes(searchTerm) ||
                (msg.message && msg.message.toLowerCase().includes(searchTerm)) // Check if message exists
            );
        }

        renderContactMessages(messages);

    } catch (error) {
        console.error("Error loading contact messages:", error);
        showToast("Error loading messages: " + error.message, "error");
    } finally {
        toggleLoadingOverlay(false);
    }
}

function renderContactMessages(messages) {
    contactMessagesTableBody.innerHTML = ''; // Clear existing rows

    if (messages.length === 0) {
        contactMessagesTableBody.innerHTML = `<tr><td colspan="7" class="text-center">No messages found.</td></tr>`;
        return;
    }

    messages.forEach(message => {
        const row = contactMessagesTableBody.insertRow();

        // Format timestamp
        const date = message.timestamp ? new Date(message.timestamp.toDate()) : new Date(); // Handle undefined timestamp
        const formattedDate = date.toLocaleString(); // e.g., "3/14/2024, 10:30:00 AM"

        row.insertCell(0).textContent = formattedDate;
        row.insertCell(1).textContent = message.name;
        row.insertCell(2).innerHTML = `<a href="mailto:${message.email}">${message.email}</a>`;
        row.insertCell(3).textContent = message.subject;

        // Category Badge
        const categoryCell = row.insertCell(4);
        const categoryBadge = document.createElement('span');
        categoryBadge.textContent = message.category || 'N/A';
        categoryBadge.classList.add('status-badge', 'category');
        // Add specific class for styling based on category
        if (message.category) {
            const categoryClass = message.category.toLowerCase().replace(/\s/g, '-');
            categoryBadge.classList.add(`category-${categoryClass}`);
        }
        categoryCell.appendChild(categoryBadge);

        // Status Badge
        const statusCell = row.insertCell(5);
        const statusBadge = document.createElement('span');
        statusBadge.textContent = message.status || 'New';
        statusBadge.classList.add('status-badge');
        statusBadge.classList.add(message.status ? message.status.toLowerCase() : 'new');
        statusCell.appendChild(statusBadge);

        // Actions
        const actionsCell = row.insertCell(6);
        actionsCell.classList.add('action-buttons'); // Apply flexbox styling for buttons

        // Reply button
        const replyBtn = document.createElement('button');
        replyBtn.textContent = 'Reply';
        replyBtn.classList.add('btn', 'action-button', 'reply');
        replyBtn.addEventListener('click', () => openReplyModal(message));
        actionsCell.appendChild(replyBtn);

        // Ignore/Unignore button
        if (message.status !== 'Ignored') {
            const ignoreBtn = document.createElement('button');
            ignoreBtn.textContent = 'Ignore';
            ignoreBtn.classList.add('btn', 'action-button', 'ignore');
            ignoreBtn.addEventListener('click', () => updateMessageStatus(message.id, 'Ignored'));
            actionsCell.appendChild(ignoreBtn);
        } else {
            const unignoreBtn = document.createElement('button');
            unignoreBtn.textContent = 'Unignore';
            unignoreBtn.classList.add('btn', 'action-button', 'accept'); // Re-use accept styling for unignore
            unignoreBtn.addEventListener('click', () => updateMessageStatus(message.id, 'New')); // Change back to New
            actionsCell.appendChild(unignoreBtn);
        }

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn', 'action-button', 'delete');
        deleteBtn.addEventListener('click', () => deleteMessage(message.id));
        actionsCell.appendChild(deleteBtn);
    });
}

// ===============================================
// Message Actions (Update Status, Delete)
// ===============================================

async function updateMessageStatus(messageId, newStatus) {
    if (!confirm(`Are you sure you want to set this message as '${newStatus}'?`)) {
        return;
    }
    toggleLoadingOverlay(true);
    try {
        const messageRef = doc(db, 'contacts', messageId);
        await updateDoc(messageRef, { status: newStatus });
        showToast(`Message status updated to '${newStatus}'!`, "success");
        loadContactMessages(); // Reload messages to reflect changes
    } catch (error) {
        console.error("Error updating message status:", error);
        showToast("Error updating status: " + error.message, "error");
    } finally {
        toggleLoadingOverlay(false);
    }
}

async function deleteMessage(messageId) {
    if (!confirm("Are you sure you want to permanently delete this message? This action cannot be undone.")) {
        return;
    }
    toggleLoadingOverlay(true);
    try {
        await deleteDoc(doc(db, 'contacts', messageId));
        showToast("Message deleted successfully!", "success");
        loadContactMessages(); // Reload messages to reflect changes
    } catch (error) {
        console.error("Error deleting message:", error);
        showToast("Error deleting message: " + error.message, "error");
    } finally {
        toggleLoadingOverlay(false);
    }
}

// ===============================================
// Reply Modal Functionality
// ===============================================
function openReplyModal(message) {
    currentMessageId = message.id; // Store message ID

    originalSubjectEl.textContent = message.subject;
    originalMessageEl.textContent = message.message;
    replyToEmailEl.value = message.email;
    replySubjectEl.value = `RE: ${message.subject}`; // Pre-fill subject
    replyMessageEl.value = ''; // Clear previous reply message
    replyMessageStatusEl.textContent = ''; // Clear status message

    // Display reply history
    displayReplyHistory(message.replyHistory || []);

    replyModal.classList.add('show');
    document.body.classList.add('no-scroll');
}

function closeReplyModal() {
    replyModal.classList.remove('show');
    document.body.classList.remove('no-scroll');
    currentMessageId = null; // Clear current message ID
}

function displayReplyHistory(history) {
    replyHistoryEl.innerHTML = ''; // Clear existing history

    if (history.length === 0) {
        replyHistoryEl.innerHTML = '<p class="text-center text-secondary">No replies yet.</p>';
        return;
    }

    // Sort history by timestamp descending for newest first (or ascending, your preference)
    history.sort((a, b) => {
        // Ensure timestamp is a Firebase Timestamp object, convert if needed
        const tsA = a.timestamp && typeof a.timestamp.toMillis === 'function' ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
        const tsB = b.timestamp && typeof b.timestamp.toMillis === 'function' ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
        return tsB - tsA;
    });

    history.forEach(reply => {
        const replyItem = document.createElement('div');
        replyItem.classList.add('reply-history-item');

        const replyContent = document.createElement('p');
        replyContent.textContent = reply.message;
        replyItem.appendChild(replyContent);

        const replyMeta = document.createElement('p');
        replyMeta.classList.add('reply-meta');
        // Ensure timestamp is a Firebase Timestamp object before calling toDate()
        const replyDate = reply.timestamp && typeof reply.timestamp.toDate === 'function' ? new Date(reply.timestamp.toDate()) : new Date(reply.timestamp);
        replyMeta.textContent = `Sent on: ${replyDate.toLocaleString()}`;
        replyItem.appendChild(replyMeta);

        replyHistoryEl.appendChild(replyItem);
    });
}


replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoadingOverlay(true);

    const recipientEmail = replyToEmailEl.value;
    const subject = replySubjectEl.value;
    const message = replyMessageEl.value;

    try {
        // Send email using EmailJS
        const templateParams = {
            to_email: recipientEmail,
            subject: subject,
            message: message,
            from_name: 'Lifewood Admin', // Or dynamically fetch admin name
            reply_to: 'info@lifewood.com' // Set a reply-to address
        };

        // These IDs are already in your provided code, so assuming they are correct
        const serviceId = 'service_2onvreb';
        const templateId = 'template_xqgpzwp';

        await emailjs.send(serviceId, templateId, templateParams);

        // Update Firestore message status and add to reply history
        const messageRef = doc(db, 'contacts', currentMessageId);

        // OPTIMIZATION: Fetch the document directly to get current replyHistory
        const messageDoc = await getDoc(messageRef);
        let existingReplyHistory = [];
        if (messageDoc.exists()) {
            existingReplyHistory = messageDoc.data().replyHistory || [];
        }

        await updateDoc(messageRef, {
            status: 'Replied',
            repliedAt: new Date(),
            replyHistory: [
                ...existingReplyHistory,
                { message: message, timestamp: new Date() }
            ]
        });

        showToast("Reply sent and message status updated!", "success");
        replyForm.reset();
        closeReplyModal();
        loadContactMessages(); // Reload table data
    } catch (error) {
        console.error("Error sending reply or updating Firestore:", error);
        // Distinguish between EmailJS and Firestore errors if possible
        if (error.status && error.text) { // EmailJS error structure
            showToast(`Email sending failed: ${error.text}`, "error");
        } else {
            showToast("Error processing reply: " + error.message, "error");
        }
    } finally {
        toggleLoadingOverlay(false);
    }
});


// ===============================================
// Event Listeners for Filters and Search
// ===============================================
contactFilter.addEventListener('change', loadContactMessages);
categoryFilter.addEventListener('change', loadContactMessages);
contactSearchBar.addEventListener('input', loadContactMessages);
showIgnoredToggle.addEventListener('change', loadContactMessages);

// Modal close listener
replyModalCloseButton.addEventListener('click', closeReplyModal);
replyModal.addEventListener('click', (e) => {
    if (e.target === replyModal) { // Close only if clicked on overlay
        closeReplyModal();
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && replyModal.classList.contains('show')) {
        closeReplyModal();
    }
});

// Initial load of contact messages when the script loads and user is authenticated
// (This is handled by the onAuthStateChanged listener, so no need for an immediate call here)