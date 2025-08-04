import { app } from './firebase-config.js';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast, showLoadingOverlay, hideLoadingOverlay } from './utils.js';

const db = getFirestore(app);
const auth = getAuth(app);

const totalApplicantsCountElem = document.getElementById('totalApplicantsCount');
const pendingApplicantsCountElem = document.getElementById('pendingApplicantsCount');
const acceptedApplicantsCountElem = document.getElementById('acceptedApplicantsCount');
const totalContactsCountElem = document.getElementById('totalContactsCount');
const latestApplicationsList = document.getElementById('latestApplicationsList');
const latestContactsList = document.getElementById('latestContactsList');
const logoutButton = document.getElementById('logoutButton');

// Chart.js instances
let applicantsChartInstance = null;
let applicationsPerWeekChartInstance = null;

// --- Authentication Check ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // User is not logged in, redirect to admin login
        window.location.href = 'admin-login.html';
    } else {
        // User is logged in, hide loading overlay and load data
        hideLoadingOverlay();
        loadDashboardData();
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

// --- Load All Dashboard Data ---
async function loadDashboardData() {
    showLoadingOverlay();
    try {
        console.log('--- DASHBOARD JS RELOADED --- Version 1.0.9'); // ADDED THIS LINE - Change version number each time you test
        await Promise.all([
            updateApplicantCounts(),
            updateContactCounts(),
            loadApplicantsChart(),
            loadApplicationsPerWeekChart(),
            loadRecentActivity()
        ]);
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast("Error loading dashboard data. Please refresh.", "error");
    } finally {
        hideLoadingOverlay();
    }
}

// --- Update Applicant Counts ---
async function updateApplicantCounts() {
    const jobApplicantsRef = collection(db, 'jobApplicants');

    // Query for all applicants
    const allApplicantsQuery = query(jobApplicantsRef);
    const allSnap = await getDocs(allApplicantsQuery);
    console.log('Dashboard: Total Applicants Snapshot Size:', allSnap.size);

    // Query for pending applicants
    const pendingApplicantsQuery = query(jobApplicantsRef, where('status', '==', 'Pending'));
    const pendingSnap = await getDocs(pendingApplicantsQuery);
    console.log('Dashboard: Pending Applicants Snapshot Size:', pendingSnap.size);

    // Query for accepted applicants
    const acceptedApplicantsQuery = query(jobApplicantsRef, where('status', '==', 'Accepted'));
    const acceptedSnap = await getDocs(acceptedApplicantsQuery);
    console.log('Dashboard: Accepted Applicants Snapshot Size:', acceptedSnap.size);

    totalApplicantsCountElem.textContent = allSnap.size;
    pendingApplicantsCountElem.textContent = pendingSnap.size;
    acceptedApplicantsCountElem.textContent = acceptedSnap.size;
}

// --- Update Contact Counts ---
async function updateContactCounts() {
    const contactsRef = collection(db, 'contacts');
    const contactsSnap = await getDocs(query(contactsRef));
    console.log('Dashboard: Total Contacts Snapshot Size:', contactsSnap.size);
    totalContactsCountElem.textContent = contactsSnap.size;
}

// Helper to get start of day in UTC (to ensure consistency across timezones for charting)
function getStartOfDayUTC(date) {
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// --- Load Applicants per Day Chart (Last 7 Days) ---
async function loadApplicantsChart() {
    const applicantsRef = collection(db, 'jobApplicants');
    
    // Get the start of today in UTC
    const todayUTC = getStartOfDayUTC(new Date()); 
    
    // Calculate the start of the 7-day period (inclusive) in UTC
    const sevenDaysAgoStartUTC = new Date(todayUTC); 
    sevenDaysAgoStartUTC.setUTCDate(todayUTC.getUTCDate() - 6); 

    // Calculate the exclusive end date for the query (start of tomorrow in UTC)
    const nextDayUTC = new Date(todayUTC); 
    nextDayUTC.setUTCDate(todayUTC.getUTCDate() + 1); 

    // Debugging dates for query (display in local time for readability, but query uses UTC Date objects)
    console.log('Chart (7 Days): Date Range for Query (Local Time Display):');
    console.log('  Start Date (Inclusive):', sevenDaysAgoStartUTC.toLocaleString());
    console.log('  End Date (Exclusive, Start of Next Day):', nextDayUTC.toLocaleString());

    const q = query(
        applicantsRef,
        where('timestamp', '>=', sevenDaysAgoStartUTC),
        where('timestamp', '<', nextDayUTC),
        orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    console.log('Chart (7 Days): Raw applications fetched:', querySnapshot.docs.length);
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            console.log(`  - App ID: ${doc.id}, Date: ${data.timestamp.toDate().toLocaleString()}`);
        } else {
            console.warn(`  - App ID: ${doc.id}, Missing timestamp!`);
        }
    });

    const dataByDay = {};
    const tempDate = new Date(sevenDaysAgoStartUTC); // Use UTC date for iteration
    for (let i = 0; i < 7; i++) {
        // Use UTC string for key
        const dateKey = tempDate.toISOString().split('T')[0]; 
        dataByDay[dateKey] = 0; 
        tempDate.setUTCDate(tempDate.getUTCDate() + 1); // Increment UTC date
    }

    querySnapshot.forEach((doc) => {
        const timestamp = doc.data().timestamp;
        if (!timestamp || typeof timestamp.toDate !== 'function') {
            console.warn('Dashboard Chart (7 Days): Document missing valid timestamp or toDate method:', doc.id);
            return;
        }
        // Convert Firestore timestamp to a UTC date object and then to ISO string for key
        const dateUTC = getStartOfDayUTC(timestamp.toDate()); 
        const dateKey = dateUTC.toISOString().split('T')[0]; 
        
        if (dataByDay[dateKey] !== undefined) {
            dataByDay[dateKey]++;
        }
    });

    const labels = Object.keys(dataByDay).map(dateKey => {
        // Parse dateKey as UTC for label generation
        const date = new Date(dateKey + 'T00:00:00Z'); // 'Z' explicitly denotes UTC
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = Object.values(dataByDay);

    console.log('Chart Data (Final for Rendering - Daily):');
    console.log('  Labels:', labels); 
    console.log('  Data:', data);   
    console.log('  dataByDay object:', dataByDay); 

    const ctx = document.getElementById('applicantsChart').getContext('2d');
    if (applicantsChartInstance) {
        applicantsChartInstance.destroy(); 
    }
    applicantsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Applicants',
                data: data,
                backgroundColor: 'rgba(4, 98, 65, 0.7)',
                borderColor: 'rgba(4, 98, 65, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                        callback: function(value) { if (value % 1 === 0) return value; }
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                }
            }
        }
    });
}

// --- Load Applications per Week Chart ---
async function loadApplicationsPerWeekChart() {
    const applicantsRef = collection(db, 'jobApplicants');
    const querySnapshot = await getDocs(query(applicantsRef, orderBy('timestamp', 'asc')));

    console.log('Chart (Per Week): Raw applications fetched:', querySnapshot.docs.length);
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            console.log(`  - App ID: ${doc.id}, Date: ${data.timestamp.toDate().toLocaleString()}`);
        } else {
            console.warn(`  - App ID: ${doc.id}, Missing timestamp!`);
        }
    });

    const dataByWeek = {};
    querySnapshot.forEach((doc) => {
        const timestamp = doc.data().timestamp;
        if (!timestamp || typeof timestamp.toDate !== 'function') {
            console.warn('Dashboard Chart (Per Week): Document missing valid timestamp or toDate method:', doc.id);
            return;
        }

        const date = timestamp.toDate();
        // Get the start of the week (Sunday) for the given date, in UTC
        const startOfWeekUTC = getStartOfDayUTC(date);
        startOfWeekUTC.setUTCDate(startOfWeekUTC.getUTCDate() - startOfWeekUTC.getUTCDay()); // Adjust to Sunday (0)

        const weekKey = startOfWeekUTC.toISOString().split('T')[0]; // YYYY-MM-DD for week start (UTC)

        if (!dataByWeek[weekKey]) {
            dataByWeek[weekKey] = 0;
        }
        dataByWeek[weekKey]++;
    });

    // Sort weeks and extract labels and data
    const sortedWeekKeys = Object.keys(dataByWeek).sort();
    const labels = sortedWeekKeys.map(key => {
        const date = new Date(key + 'T00:00:00Z'); // Parse key as UTC
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    });
    const data = sortedWeekKeys.map(key => dataByWeek[key]);

    console.log('Weekly Chart Data (Final for Rendering):');
    console.log('  Labels:', labels);
    console.log('  Data:', data);
    console.log('  dataByWeek object:', dataByWeek);

    const ctx = document.getElementById('applicationsPerWeekChart').getContext('2d');
    if (applicationsPerWeekChartInstance) {
        applicationsPerWeekChartInstance.destroy(); 
    }
    applicationsPerWeekChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Applications',
                data: data,
                fill: false,
                borderColor: 'rgba(255, 179, 71, 0.8)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                        callback: function(value) { if (value % 1 === 0) return value; }
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                }
            }
        }
    });
}

// --- Load Recent Activity (Latest 5 applications and contacts) ---
async function loadRecentActivity() {
    // Latest Applications
    const latestAppsQuery = query(collection(db, 'jobApplicants'), orderBy('timestamp', 'desc'), limit(5));
    const latestAppsSnap = await getDocs(latestAppsQuery);
    latestApplicationsList.innerHTML = '';
    if (latestAppsSnap.empty) {
        latestApplicationsList.innerHTML = '<li>No recent applications.</li>';
    } else {
        latestAppsSnap.forEach(docSnap => {
            const appData = docSnap.data();
            const timestamp = appData.timestamp ? appData.timestamp.toDate().toLocaleDateString() : 'N/A';
            const li = document.createElement('li');
            // Use jobTitleApplied if available, fallback to projectApplied
            const jobTitle = appData.jobTitleApplied || appData.projectApplied || 'N/A';
            li.innerHTML = `
                <span class="activity-name">${appData.firstName || 'N/A'} ${appData.lastName || 'N/A'} - ${jobTitle}</span>
                <span class="activity-date">${timestamp}</span>
            `;
            latestApplicationsList.appendChild(li);
        });
    }

    // Latest Contact Messages
    const latestContactsQuery = query(collection(db, 'contacts'), orderBy('timestamp', 'desc'), limit(5));
    const latestContactsSnap = await getDocs(latestContactsQuery);
    latestContactsList.innerHTML = '';
    if (latestContactsSnap.empty) {
        latestContactsList.innerHTML = '<li>No recent messages.</li>';
    } else {
        latestContactsSnap.forEach(docSnap => {
            const contactData = docSnap.data();
            const timestamp = contactData.timestamp ? contactData.timestamp.toDate().toLocaleDateString() : 'N/A';
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="activity-name">${contactData.name || 'N/A'} - ${contactData.subject || 'N/A'}</span>
                <span class="activity-date">${timestamp}</span>
            `;
            latestContactsList.appendChild(li);
        });
    }
}