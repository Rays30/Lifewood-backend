import { app } from './firebase-config.js';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getStorage, ref, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
// Import all necessary functions and templates from utils.js, as per your previous setup
import { showToast, showLoadingOverlay, hideLoadingOverlay, sendEmailViaEmailJS, acceptedApplicantEmailTemplate, rejectedApplicantEmailTemplate } from './utils.js'; 

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Your EmailJS template ID, if it's not managed within utils.js itself
// Assuming template_xqgpzwp is the ID that sendEmailViaEmailJS uses internally,
// or that it's directly passed to sendEmailViaEmailJS as the first argument.
// For now, let's keep it here if sendEmailViaEmailJS needs it as an explicit arg.
const EMAIL_TEMPLATE_ID = 'template_xqgpzwp'; // Retaining your specific template ID

const jobApplicantsTableBody = document.querySelector('#jobApplicantsTable tbody');
const applicantFilter = document.getElementById('applicantFilter');
const departmentFilter = document.getElementById('departmentFilter');
const applicantSearchBar = document.getElementById('applicantSearchBar');
const logoutButton = document.getElementById('logoutButton');

const applicantDetailsModal = document.getElementById('applicantDetailsModal');
const closeModalButtons = applicantDetailsModal.querySelectorAll('.modal-close-button');

// Applicant details elements in the modal
const applicantNameElem = document.getElementById('applicantName');
const applicantEmailElem = document.getElementById('applicantEmail');
const applicantAgeElem = document.getElementById('applicantAge');
const applicantDegreeElem = document.getElementById('applicantDegree');
const applicantProjectElem = document.getElementById('applicantProject'); // This will now show Job Title
const applicantDepartmentElem = document.getElementById('applicantDepartment'); // NEW: For Department
const applicantExperienceElem = document.getElementById('applicantExperience');
const applicantResumeLinkElem = document.getElementById('applicantResumeLink');
const applicantAvailableFromElem = document.getElementById('applicantAvailableFrom');
const applicantAvailableUntilElem = document.getElementById('applicantAvailableUntil');
const applicantTimestampElem = document.getElementById('applicantTimestamp');
const applicantStatusElem = document.getElementById('applicantStatus');

let allApplicants = []; // Store all applicants for local filtering

// --- Authentication Check ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
    } else {
        hideLoadingOverlay();
        fetchAndDisplayApplicants();
    }
});

// --- Logout Functionality ---
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showToast('Logged out successfully.', 'success');
        window.location.href = 'admin-login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to log out.', 'error');
    }
});

// --- Modal Functions ---
function openModal(modal) {
    modal.classList.add('show');
    document.body.classList.add('no-scroll');
}

function closeModals() {
    applicantDetailsModal.classList.remove('show');
    document.body.classList.remove('no-scroll');
}

closeModalButtons.forEach(button => {
    button.addEventListener('click', closeModals);
});

applicantDetailsModal.addEventListener('click', (e) => {
    if (e.target === applicantDetailsModal) {
        closeModals();
    }
});

// --- Fetch and Display Job Applicants ---
async function fetchAndDisplayApplicants() {
    showLoadingOverlay();
    jobApplicantsTableBody.innerHTML = '';
    allApplicants = []; // Clear previous data

    try {
        const querySnapshot = await getDocs(query(collection(db, 'jobApplicants'), orderBy('timestamp', 'desc')));
        const departments = new Set(); // To collect unique departments

        if (querySnapshot.empty) {
            jobApplicantsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No job applications found.</td></tr>'; // Adjusted colspan
            hideLoadingOverlay();
            populateDepartmentFilter([]); // Clear department filter if no applicants
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const applicant = { id: docSnap.id, ...docSnap.data() };
            allApplicants.push(applicant);
            if (applicant.departmentApplied) {
                departments.add(applicant.departmentApplied);
            }
        });

        populateDepartmentFilter(Array.from(departments));
        filterAndRenderApplicants(); // Apply current filters and render

    } catch (error) {
        console.error('Error fetching job applicants:', error);
        showToast('Error loading job applicants.', 'error');
        jobApplicantsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading job applicants.</td></tr>';
    } finally {
        hideLoadingOverlay();
    }
}

// Populate Department Filter Dropdown
function populateDepartmentFilter(departments) {
    departmentFilter.innerHTML = '<option value="All">All Departments</option>';
    departments.sort().forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        departmentFilter.appendChild(option);
    });
}

// --- Filter and Render Applicants ---
function filterAndRenderApplicants() {
    const statusFilter = applicantFilter.value;
    const departmentToFilter = departmentFilter.value;
    const searchTerm = applicantSearchBar.value.toLowerCase();

    let filteredApplicants = allApplicants.filter(applicant => {
        const matchesStatus = statusFilter === 'All' || applicant.status === statusFilter;
        const matchesDepartment = departmentToFilter === 'All' || (applicant.departmentApplied && applicant.departmentApplied.toLowerCase() === departmentToFilter.toLowerCase()); // Case-insensitive match for department
        const matchesSearch = searchTerm === '' ||
                              (applicant.firstName && applicant.firstName.toLowerCase().includes(searchTerm)) ||
                              (applicant.lastName && applicant.lastName.toLowerCase().includes(searchTerm)) ||
                              (applicant.email && applicant.email.toLowerCase().includes(searchTerm)) ||
                              (applicant.jobTitleApplied && applicant.jobTitleApplied.toLowerCase().includes(searchTerm));

        return matchesStatus && matchesDepartment && matchesSearch;
    });

    jobApplicantsTableBody.innerHTML = ''; // Clear table before rendering

    if (filteredApplicants.length === 0) {
        jobApplicantsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No matching job applications found.</td></tr>';
        return;
    }

    filteredApplicants.forEach(applicant => {
        const row = jobApplicantsTableBody.insertRow();
        const timestamp = applicant.timestamp ? applicant.timestamp.toDate().toLocaleString() : 'N/A';
        const statusClass = applicant.status ? applicant.status.toLowerCase() : 'pending';

        row.innerHTML = `
            <td>${timestamp}</td>
            <td>${applicant.firstName || 'N/A'} ${applicant.lastName || 'N/A'}</td>
            <td>${applicant.email || 'N/A'}</td>
            <td>${applicant.jobTitleApplied || 'N/A'}</td>
            <td>${applicant.departmentApplied || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${applicant.status || 'N/A'}</span></td>
            <td class="action-buttons">
                <button class="action-button reply" data-id="${applicant.id}" data-action="viewDetails">View Details</button>
                ${applicant.status === 'Pending' ? `
                    <button class="action-button accept" data-id="${applicant.id}" data-action="accept">Accept</button>
                    <button class="action-button reject" data-id="${applicant.id}" data-action="reject">Reject</button>
                ` : ''}
                <button class="action-button delete delete-from-table-btn" data-id="${applicant.id}" data-action="delete">Delete</button>
            </td>
        `;
    });

    addTableActionListeners();
}

// --- Add Event Listeners for Filters and Search ---
applicantFilter.addEventListener('change', filterAndRenderApplicants);
departmentFilter.addEventListener('change', filterAndRenderApplicants);
applicantSearchBar.addEventListener('input', filterAndRenderApplicants);

// --- Handle Table Actions (View Details, Accept, Reject, Delete) ---
function addTableActionListeners() {
    jobApplicantsTableBody.querySelectorAll('.action-button').forEach(button => {
        button.onclick = async (event) => {
            const applicantId = event.target.dataset.id;
            const action = event.target.dataset.action;

            showLoadingOverlay();
            try {
                if (action === 'viewDetails') {
                    await displayApplicantDetails(applicantId);
                    openModal(applicantDetailsModal);
                } else if (action === 'accept') {
                    await updateApplicantStatus(applicantId, 'Accepted');
                } else if (action === 'reject') {
                    await updateApplicantStatus(applicantId, 'Rejected');
                } else if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this applicant? This action cannot be undone.')) {
                        await deleteApplicant(applicantId);
                    }
                }
            } catch (error) {
                console.error(`Error performing action ${action} for ${applicantId}:`, error);
                showToast(`Failed to ${action} applicant.`, 'error');
            } finally {
                hideLoadingOverlay();
            }
        };
    });
}

// --- Display Applicant Details in Modal ---
async function displayApplicantDetails(id) {
    const applicantRef = doc(db, 'jobApplicants', id); // Use 'jobApplicants' as collection name
    const docSnap = await getDoc(applicantRef);

    if (docSnap.exists()) {
        const applicantData = docSnap.data();
        applicantNameElem.textContent = `${applicantData.firstName || 'N/A'} ${applicantData.lastName || 'N/A'}`;
        applicantEmailElem.textContent = applicantData.email || 'N/A';
        applicantEmailElem.href = `mailto:${applicantData.email}`;
        applicantAgeElem.textContent = applicantData.age || 'N/A';
        applicantDegreeElem.textContent = applicantData.degree || 'N/A';
        applicantProjectElem.textContent = applicantData.jobTitleApplied || 'N/A';
        applicantDepartmentElem.textContent = applicantData.departmentApplied || 'N/A';
        applicantExperienceElem.textContent = `${applicantData.experience || 'N/A'} years`;
        applicantResumeLinkElem.href = applicantData.resumeLink || '#';
        applicantResumeLinkElem.textContent = applicantData.resumeLink ? 'View Resume' : 'No Resume Link';
        applicantResumeLinkElem.target = applicantData.resumeLink ? '_blank' : '_self';
        applicantResumeLinkElem.style.pointerEvents = applicantData.resumeLink ? 'auto' : 'none';
        applicantResumeLinkElem.style.color = applicantData.resumeLink ? '' : '#888';

        applicantAvailableFromElem.textContent = applicantData.availableStart || 'N/A';
        applicantAvailableUntilElem.textContent = applicantData.availableEnd || 'N/A';
        applicantTimestampElem.textContent = applicantData.timestamp ? applicantData.timestamp.toDate().toLocaleString() : 'N/A';
        applicantStatusElem.textContent = applicantData.status || 'Pending';
    } else {
        console.error('No such applicant document!');
        showToast('Applicant details not found.', 'error');
        closeModals();
    }
}

// --- Update Applicant Status and Send Email ---
async function updateApplicantStatus(id, newStatus) {
    const applicantRef = doc(db, 'jobApplicants', id); // Use 'jobApplicants' as collection name
    const docSnap = await getDoc(applicantRef);

    if (!docSnap.exists()) {
        showToast('Applicant not found.', 'error');
        return;
    }

    const applicantData = docSnap.data();
    const applicantEmail = applicantData.email;
    const applicantFullName = `${applicantData.firstName || ''} ${applicantData.lastName || ''}`.trim();
    const jobTitle = applicantData.jobTitleApplied || 'your applied position'; // Safely get job title

    try {
        // 1. Update status in Firestore
        await updateDoc(applicantRef, {
            status: newStatus
            // lastUpdated: serverTimestamp() // Add this if you want to track when admin last updated
        });
        showToast(`Applicant status updated to ${newStatus}!`, 'success');

        // 2. Send Email using EmailJS via your utils.js function
        if (applicantEmail && applicantEmail.trim() !== '') {
            let emailSubject = '';
            let emailBody = '';

            if (newStatus === 'Accepted') {
                emailSubject = `Congratulations! Your Application for ${jobTitle} at Lifewood`;
                // Use the template from utils.js, replacing placeholder
                emailBody = acceptedApplicantEmailTemplate.replace(/{{to_name}}/g, applicantFullName)
                                                        .replace(/{{job_title}}/g, jobTitle); // Pass job title to template
            } else if (newStatus === 'Rejected') {
                emailSubject = `Update on Your Application for ${jobTitle} at Lifewood`;
                // Use the template from utils.js, replacing placeholder
                emailBody = rejectedApplicantEmailTemplate.replace(/{{to_name}}/g, applicantFullName)
                                                          .replace(/{{job_title}}/g, jobTitle); // Pass job title to template
            }

            if (emailSubject && emailBody) {
                // Call your sendEmailViaEmailJS function with your single EMAIL_TEMPLATE_ID
                await sendEmailViaEmailJS(EMAIL_TEMPLATE_ID, applicantEmail, applicantFullName, emailSubject, emailBody);
                showToast('Email notification sent successfully!', 'success');
            } else {
                console.warn('Email not sent: Subject or body could not be generated.', { newStatus, applicantData });
                showToast('Email content not generated. Status updated.', 'warning');
            }
        } else {
            console.warn('Email not sent: Applicant email address is missing or invalid.', { applicantEmail, applicantData });
            showToast('Email not sent: Applicant email missing. Status updated.', 'warning');
        }

    } catch (error) {
        console.error('Error updating status or sending email:', error);
        showToast('Failed to update status or send email. Check console for details.', 'error');
    } finally {
        await fetchAndDisplayApplicants(); // Re-fetch and re-render all applicants, regardless of email status
        closeModals(); // Close modal after action
    }
}

// Function to confirm and delete an applicant
function confirmDeleteApplicant(id, resumeFileName) {
    if (confirm('Are you sure you want to delete this applicant? This action cannot be undone.')) {
        deleteApplicant(id, resumeFileName);
    }
}

// Function to delete an applicant
async function deleteApplicant(id, resumeFileName) {
    showLoadingOverlay();
    try {
        // Delete resume file from Firebase Storage if it exists
        if (resumeFileName) {
            const resumeRef = ref(storage, `resumes/${resumeFileName}`);
            await deleteObject(resumeRef)
                .then(() => {
                    console.log('Resume file deleted from storage.');
                })
                .catch((error) => {
                    console.warn('Could not delete resume file from storage (might not exist or permissions issue):', error);
                    // Continue with document deletion even if file deletion fails
                });
        }

        // Delete applicant document from Firestore
        await deleteDoc(doc(db, 'jobApplicants', id)); // Use 'jobApplicants' as collection name
        showToast('Applicant deleted successfully!', 'success');
        
        // Refresh data
        await fetchAndDisplayApplicants();
    } catch (error) {
        console.error('Error deleting applicant:', error);
        showToast(`Failed to delete applicant: ${error.message}`, 'error');
    } finally {
        hideLoadingOverlay();
    }
}