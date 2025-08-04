// Function to update the progress bar based on scroll position
function updateProgressBar() {
    const {
        scrollTop,
        scrollHeight,
        clientHeight
    } = document.documentElement;
    const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
    document.getElementById('progressBar').style.width = scrollPercent + '%';
}

// Function to toggle dark mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    // Save preference to localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
}

// Function to show/hide the scroll-to-top button
function toggleScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
}

// Function to handle smooth scrolling to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Function to handle mobile navigation toggle
function setupMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    const navOverlay = document.querySelector('.nav-overlay');

    if (navToggle && navList && navOverlay) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('open');
            navList.classList.toggle('open');
            navOverlay.classList.toggle('show');
            document.body.classList.toggle('no-scroll'); // Prevent scroll
        });

        // Close nav when clicking outside (on overlay)
        navOverlay.addEventListener('click', () => {
            navToggle.classList.remove('open');
            navList.classList.remove('open');
            navOverlay.classList.remove('show');
            document.body.classList.remove('no-scroll');
        });

        // Close nav when a link is clicked (for single-page navigation or general UX)
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                navList.classList.remove('open');
                navOverlay.classList.remove('show');
                document.body.classList.remove('no-scroll');
            });
        });
    }
}

// Function for hero section parallax effect (optional, visual enhancement)
function setupHeroParallax() {
    const heroContent = document.querySelector('.hero-content');
    const pageHeroContent = document.querySelector('.page-hero-content');

    if (heroContent) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.pageYOffset;
            heroContent.style.transform = `translateY(${scrollPosition * 0.3}px)`; // Adjust multiplier for desired effect
        });
    }
    if (pageHeroContent) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.pageYOffset;
            pageHeroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`; // Adjust multiplier
        });
    }
}

// Initialize AOS (Animate On Scroll)
function initializeAOS() {
    AOS.init({
        duration: 1000, // global duration
        once: true // animations once
    });
}

// Main DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Event listeners
    window.addEventListener('scroll', updateProgressBar);
    window.addEventListener('scroll', toggleScrollToTopButton);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', scrollToTop);
    }

    // Set current year in footer (handles multiple elements with this ID)
    const currentYearSpans = document.querySelectorAll('[id^="current-year"]');
    currentYearSpans.forEach(span => {
        span.textContent = new Date().getFullYear();
    });

    // Admin secret link (hidden)
    const adminSecretLink = document.getElementById('admin-secret-link');
    if (adminSecretLink) {
        adminSecretLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'admin-login.html';
        });
    }

    // Call setup functions
    setupMobileNav();
    setupHeroParallax(); // Call for both hero sections
    initializeAOS(); // Initialize AOS
});

// Run on load to set initial state
updateProgressBar();
toggleScrollToTopButton();