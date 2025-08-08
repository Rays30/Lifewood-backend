import { app } from './firebase-config.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast, showLoadingOverlay, hideLoadingOverlay } from './utils.js';

const db = getFirestore(app);
const auth = getAuth(app);

const addJobForm = document.getElementById('addJobForm');
const jobTitleInput = document.getElementById('jobTitle');
const jobLocationInput = document.getElementById('jobLocation');
const jobDepartmentInput = document.getElementById('jobDepartment'); // MODIFIED: Changed variable name to reflect input
const jobDescriptionTextarea = document.getElementById('jobDescription');
const addJobMessageDiv = document.getElementById('addJobMessage');
const jobListingsTableBody = document.querySelector('#jobListingsTable tbody');
const logoutButton = document.getElementById('logoutButton');

// --- Authentication Check ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // User is not logged in, redirect to admin login
        window.location.href = 'admin-login';
    } else {
        // User is logged in, hide loading overlay and load data
        hideLoadingOverlay();
        displayJobListings();
    }
});

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('user'); // <-- **ADD THIS LINE**
            showToast('Logged out successfully.', 'info'); // Changed to 'info' as it's not an error/success of an operation on data
            // Add a slight delay to allow the toast message to be seen
            setTimeout(() => {
                window.location.href = 'admin-login';
            }, 1000); // 1-second delay
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Failed to log out: ' + error.message, 'error'); // Include error message for debugging
        }
    });
}

// --- Add New Job Functionality ---
addJobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoadingOverlay();

    const jobTitle = jobTitleInput.value.trim();
    const jobLocation = jobLocationInput.value.trim();
    const jobDepartment = jobDepartmentInput.value.trim(); // MODIFIED: Get value from input
    const jobDescription = jobDescriptionTextarea.value.trim();

    if (!jobTitle || !jobLocation || !jobDepartment || !jobDescription) {
        addJobMessageDiv.textContent = 'Please fill in all fields.';
        addJobMessageDiv.className = 'admin-message error show';
        hideLoadingOverlay();
        return;
    }

    try {
        await addDoc(collection(db, 'jobs'), {
            title: jobTitle,
            location: jobLocation,
            department: jobDepartment,
            description: jobDescription,
            timestamp: new Date()
        });
        showToast('Job added successfully!', 'success');
        addJobForm.reset(); // Clear the form
        addJobMessageDiv.textContent = ''; // Clear message
        addJobMessageDiv.className = 'admin-message'; // Reset class
        await displayJobListings(); // Refresh the list
    } catch (e) {
        console.error('Error adding document: ', e);
        showToast('Error adding job. Please try again.', 'error');
        addJobMessageDiv.textContent = 'Error adding job: ' + e.message;
        addJobMessageDiv.className = 'admin-message error show';
    } finally {
        hideLoadingOverlay();
    }
});

// --- Display Job Listings Functionality ---
async function displayJobListings() {
    jobListingsTableBody.innerHTML = ''; // Clear existing table rows
    showLoadingOverlay();

    try {
        const jobsCol = collection(db, 'jobs');
        const q = query(jobsCol, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            const row = jobListingsTableBody.insertRow();
            // Colspan remains 6 as the "Department" column is still there, just with text input
            row.innerHTML = `<td colspan="6" class="text-center">No job listings found.</td>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const jobData = docSnap.data();
            const jobId = docSnap.id;
            const row = jobListingsTableBody.insertRow();

            // Format timestamp
            const date = jobData.timestamp ? jobData.timestamp.toDate() : new Date();
            const formattedTimestamp = date.toLocaleString(); // Adjust format as needed

            row.innerHTML = `
                <td>${formattedTimestamp}</td>
                <td>${jobData.title}</td>
                <td>${jobData.location}</td>
                <td>${jobData.department || 'N/A'}</td>
                <td>${jobData.description}</td>
                <td class="action-buttons">
                    <button class="action-button delete" data-job-id="${jobId}">Delete</button>
                </td>
            `;
        });

        // Add event listeners for delete buttons (using delegation)
        jobListingsTableBody.querySelectorAll('.action-button.delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const jobIdToDelete = e.target.dataset.jobId;
                if (confirm('Are you sure you want to delete this job listing?')) {
                    await deleteJobListing(jobIdToDelete);
                }
            });
        });

    } catch (error) {
        console.error('Error fetching job listings:', error);
        showToast('Error loading job listings.', 'error');
        const row = jobListingsTableBody.insertRow();
        // Colspan remains 6 for error message too
        row.innerHTML = `<td colspan="6" class="text-center text-danger">Error loading job listings.</td>`;
    } finally {
        hideLoadingOverlay();
    }
}

// --- Delete Job Listing Functionality ---
async function deleteJobListing(jobId) {
    showLoadingOverlay();
    try {
        await deleteDoc(doc(db, 'jobs', jobId));
        showToast('Job listing deleted successfully!', 'success');
        await displayJobListings(); // Refresh the list
    } catch (error) {
        console.error('Error deleting job listing:', error);
        showToast('Error deleting job listing. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Initial load (after auth check) is handled by onAuthStateChanged