import { app } from './firebase-config.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { showToast, showLoadingOverlay, hideLoadingOverlay } from './utils.js'; // Import toast and loading utilities

const db = getFirestore(app);
const storage = getStorage(app);

// Get modal elements
const jobBoardModal = document.getElementById('jobBoardModal');
const jobApplicationModal = document.getElementById('jobApplicationModal');
const closeModalButtons = document.querySelectorAll('.modal-close-button');
const openJobBoardModalBtn = document.getElementById('openJobBoardModalBtn');
const jobListingsContainer = document.getElementById('jobListingsContainer');
const jobApplicationForm = document.getElementById('jobApplicationForm');
const backToJobListingsBtn = document.getElementById('backToJobListingsBtn');
const projectAppliedInput = document.getElementById('projectApplied');

// Variable to store the department of the currently selected job
let selectedJobDepartment = ''; // NEW

// --- Modal Display Functions ---
function openModal(modal) {
    modal.classList.add('show');
    document.body.classList.add('no-scroll'); // Prevent background scroll
}

function closeModals() {
    jobBoardModal.classList.remove('show');
    jobApplicationModal.classList.remove('show');
    document.body.classList.remove('no-scroll'); // Re-enable background scroll
}

// --- Event Listeners for Opening/Closing Modals ---
if (openJobBoardModalBtn) {
    openJobBoardModalBtn.addEventListener('click', () => {
        openModal(jobBoardModal);
        fetchAndDisplayJobs(); // Fetch jobs every time modal is opened
    });
}

closeModalButtons.forEach(button => {
    button.addEventListener('click', closeModals);
});

// Close modal when clicking outside the content
jobBoardModal.addEventListener('click', (e) => {
    if (e.target === jobBoardModal) {
        closeModals();
    }
});
jobApplicationModal.addEventListener('click', (e) => {
    if (e.target === jobApplicationModal) {
        closeModals();
    }
});

// Back to Job Listings button
if (backToJobListingsBtn) {
    backToJobListingsBtn.addEventListener('click', () => {
        jobApplicationModal.classList.remove('show'); // Hide application form
        jobBoardModal.classList.add('show');          // Show job board
        // No need to fetch jobs again, they are already there
    });
}

// Check if a hash for job section exists on load
window.addEventListener('load', () => {
    if (window.location.hash === '#join-our-team') {
        openModal(jobBoardModal);
        fetchAndDisplayJobs();
    }
});


// --- Fetch and Display Job Listings from Firestore ---
async function fetchAndDisplayJobs() {
    jobListingsContainer.innerHTML = '<p class="text-center text-secondary">Loading job listings...</p>';
    showLoadingOverlay();
    try {
        const jobsCol = collection(db, 'jobs');
        const q = query(jobsCol, orderBy('timestamp', 'desc')); // Order by timestamp to show newest first
        const querySnapshot = await getDocs(q);

        jobListingsContainer.innerHTML = ''; // Clear loading message

        if (querySnapshot.empty) {
            jobListingsContainer.innerHTML = '<p class="text-center text-secondary">No job opportunities available at this time. Please check back later!</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const job = doc.data();
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card-listing';
            jobCard.innerHTML = `
                <h4>${job.title}</h4>
                <p><strong>Department:</strong> ${job.department ? job.department.toUpperCase() : 'N/A'}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p>${job.description.substring(0, 150)}...</p> <!-- Truncate description for card -->
                <button class="btn btn-primary apply-now-btn"
                        data-job-title="${job.title}"
                        data-job-department="${job.department || 'N/A'}">Apply Now</button> <!-- ADDED data-job-department -->
            `;
            jobListingsContainer.appendChild(jobCard);
        });

        // Add event listeners to the new "Apply Now" buttons
        document.querySelectorAll('.apply-now-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const jobTitle = e.target.dataset.jobTitle;
                const jobDepartment = e.target.dataset.jobDepartment; // NEW: Get department from data attribute

                projectAppliedInput.value = jobTitle; // Pre-fill the project field (now job title)
                selectedJobDepartment = jobDepartment; // NEW: Store the department globally

                openModal(jobApplicationModal);      // Open the application modal
                jobBoardModal.classList.remove('show'); // Hide the job board modal
            });
        });

    } catch (error) {
        console.error('Error fetching job listings:', error);
        jobListingsContainer.innerHTML = '<p class="text-center text-danger">Error loading job listings. Please try again later.</p>';
        showToast('Error loading job opportunities.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}


// --- Job Application Form Submission ---
jobApplicationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoadingOverlay();

    const formData = new FormData(jobApplicationForm);
    const applicantData = Object.fromEntries(formData.entries());

    // Convert age and experience to numbers
    applicantData.age = parseInt(applicantData.age);
    applicantData.experience = parseInt(applicantData.experience);

    // NEW: Rename projectApplied to jobTitleApplied for clarity
    applicantData.jobTitleApplied = applicantData.projectApplied;
    delete applicantData.projectApplied; // Remove the old field if it still exists from form

    // NEW: Add the department to the applicant data
    applicantData.departmentApplied = selectedJobDepartment;

    // Add timestamp
    applicantData.timestamp = new Date();
    applicantData.status = 'Pending'; // Default status for new applications

    try {
        // Add applicant data to Firestore
        await addDoc(collection(db, 'jobApplicants'), applicantData);
        showToast('Application submitted successfully!', 'success');
        jobApplicationForm.reset();
        closeModals(); // Close the modal on success
    } catch (error) {
        console.error('Error submitting application:', error);
        showToast('Error submitting application. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
});

// Initial call to fetch jobs when the script loads (for direct access to services#join-our-team)
// This is now handled by the window.onload and openJobBoardModalBtn click listeners
// fetchAndDisplayJobs(); // Removed this as it was causing a double fetch or fetch on every page load