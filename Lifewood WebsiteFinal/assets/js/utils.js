// Lifewood WebsiteFinal/assets/js/utils.js

// EmailJS Configuration - IMPORTANT: Update with your actual Service ID and Public Key
export const EMAILJS_SERVICE_ID = 'service_2onvreb'; // Replace with your EmailJS Service ID
export const EMAILJS_PUBLIC_KEY = 'ah4oIE440AM0t21ja'; // This is provided in your HTML init calls


// --- Global Utility Functions ---

/**
 * Shows the loading overlay.
 */
export function showLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

/**
 * Hides the loading overlay.
 */
export function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

/**
 * Displays a toast message.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of toast (e.g., 'success', 'error', 'warning', 'info').
 * @param {number} [duration=3000] - How long the toast should be visible in milliseconds.
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage) {
        // Clear previous classes except 'toast-message' and add new ones
        toastMessage.className = 'toast-message'; 
        toastMessage.textContent = message;
        toastMessage.classList.add('show', type);
        
        // Hide after duration
        setTimeout(() => {
            toastMessage.classList.remove('show');
        }, duration);
    }
}

/**
 * Function to format Firestore Timestamps to a readable string.
 * This is useful in dashboard contexts.
 */
export function formatFirestoreTimestamp(timestamp) {
    if (timestamp && typeof timestamp.toDate === 'function') { // Ensure it's a Firestore Timestamp object
        const date = timestamp.toDate();
        return date.toLocaleString(); // Or format more specifically: new Date(date).toLocaleDateString('en-US')
    }
    return '';
}

/**
 * Generic modal functions for admin panel and frontend pop-ups.
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.classList.add('no-scroll');
        // Close button functionality
        const closeButton = modal.querySelector('.modal-close-button');
        if (closeButton) {
            closeButton.onclick = () => closeModal(modalId);
        }
        // Close on overlay click
        modal.onclick = (event) => {
            if (event.target === modal) {
                closeModal(modalId);
            }
        };
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('no-scroll');
    }
}

/**
 * Sends an email using EmailJS with dynamic HTML content.
 * @param {string} templateId - The ID of the EmailJS template to use from your dashboard.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} toName - The recipient's name (for personalization).
 * @param {string} subject - The subject of the email.
 * @param {string} htmlBody - The full HTML content for the email body (this will be mapped to {{html_message}} in your EmailJS template).
 * @returns {Promise<any>} A promise that resolves if the email is sent successfully, or rejects otherwise.
 */
export async function sendEmailViaEmailJS(templateId, toEmail, toName, subject, htmlBody) {
    const templateParams = {
        to_name: toName,
        to_email: toEmail,
        subject: subject,
        html_message: htmlBody, // This variable name must match what's in your EmailJS template
    };

    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            templateId, // Use the provided templateId here (e.g., 'template_xqgpzwp')
            templateParams,
            EMAILJS_PUBLIC_KEY
        );
        console.log('Email successfully sent!', response);
        return response;
    } catch (error) {
        console.error('Failed to send email:', error);
        // Provide more detailed error logging from EmailJS response
        if (error.text) {
            console.error('EmailJS response text:', error.text);
        }
        if (error.status) {
            console.error('EmailJS response status:', error.status);
        }
        throw error; // Re-throw to propagate error for UI handling
    }
}


// --- HTML Email Templates ---
// These templates use EmailJS placeholders like {{to_name}} which will be replaced by the data in templateParams.
// The entire HTML string itself will be passed as {{html_message}} to the EmailJS template on the server.

export const acceptedApplicantEmailTemplate = `
<div style="font-family: 'Manrope', sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F7F7; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px 8px 0 0;">
        <tr>
            <td align="center" style="padding: 20px;">
                <img src="https://i.imgur.com/zYSWW50.png" alt="Lifewood Logo" width="160" style="display: block; max-width: 160px; height: auto;">
            </td>
        </tr>
    </table>

    <!-- Main Content -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
        <tr>
            <td style="padding: 0 20px;">
                <h2 style="color: #046241; font-size: 26px; line-height: 1.3; margin-bottom: 20px; text-align: center;">
                    Welcome to the Lifewood Team!
                </h2>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    Dear {{to_name}},
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    We are absolutely thrilled to inform you that your application for a position at Lifewood has been <strong>successful</strong>! We were highly impressed with your qualifications and believe your skills and passion will be a significant asset to our team as we continue to pioneer eco-friendly technology and sustainable development.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                    Our HR team will be reaching out very soon via email to provide you with the full offer details, discuss your start date, and guide you through our comprehensive onboarding process.
                </p>
                <!-- Call to Action Button -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 5px; background-color: #FFB347;">
                                        <a href="mailto:info@lifewood.com?subject=Inquiry%20About%20My%20Lifewood%20Offer" target="_blank" style="font-size: 16px; font-family: 'Manrope', sans-serif; color: #133020; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #FFB347; display: inline-block; font-weight: 600;">
                                            Contact HR
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 25px;">
                    We are incredibly excited about the prospect of you joining us in shaping a greener, more innovative future.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 0;">
                    Best regards,
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 5px; font-weight: 500;">
                    The Lifewood Recruitment Team
                </p>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #133020; color: #FFFFFF; padding: 25px 20px; border-radius: 8px; margin-top: 20px;">
        <tr>
            <td align="center">
                <p style="font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.8);">
                    Innovating for a sustainable tomorrow, one solution at a time.<br>
                    Always on, never off.
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-top: 15px; color: rgba(255, 255, 255, 0.9);">
                    88 GreenTech Avenue, Innovation Park, London, EC1A 1AB, UK
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                    Email: <a href="info@lifewood.com" style="color: #FFB347; text-decoration: none;">info@lifewood.com</a> |
                    Phone: <a href="tel:+15551234567" style="color: #FFB347; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
                <div style="margin-top: 15px;">
                    <a href="https://www.lifewood.com/" aria-label="Lifewood Website" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/uQ5HBZu.png" alt="Website Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.youtube.com/@LifewoodDataTechnology/videos" aria-label="YouTube" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/0zjPmNs.png" alt="YouTube Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.linkedin.com/company/lifewood-data-technology-ltd." aria-label="LinkedIn" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/RQPeE74.png" alt="LinkedIn Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.facebook.com/LifewoodPH" aria-label="Facebook" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/mYWfgqD.png" alt="Facebook Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                </div>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-top: 20px;">
                    © ${new Date().getFullYear()} Lifewood. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</div>
`;

    export const rejectedApplicantEmailTemplate = `
<div style="font-family: 'Manrope', sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F7F7; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px 8px 0 0;">
        <tr>
            <td align="center" style="padding: 20px;">
                <img src="https://i.imgur.com/zYSWW50.png" alt="Lifewood Logo" width="160" style="display: block; max-width: 160px; height: auto;">
            </td>
        </tr>
    </table>

    <!-- Main Content -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
        <tr>
            <td style="padding: 0 20px;">
                <h2 style="color: #046241; font-size: 26px; line-height: 1.3; margin-bottom: 20px; text-align: center;">
                    Regarding Your Application at Lifewood
                </h2>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    Dear {{to_name}},
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    Thank you for your recent application for a position at Lifewood, and for taking the time to share your qualifications and experience with us. We genuinely appreciate your interest in joining our team.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                    We received a large number of applications from highly qualified candidates for this role, making the selection process very competitive. While your background is impressive, we have decided to move forward with other candidates whose profiles were a closer match for the specific requirements of this particular position at this time.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                    We understand that this news may be disappointing, and we sincerely thank you for your understanding. We encourage you to keep an eye on our <a href="https://www.lifewood.com/services.html#join-our-team" style="color: #FFB347; text-decoration: none; font-weight: 500;">careers page</a> for future opportunities that may better align with your skills and experience.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 0;">
                    We wish you the very best in your job search and all your future endeavors.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 5px; font-weight: 500;">
                    Sincerely,
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 5px; font-weight: 500;">
                    The Lifewood Recruitment Team
                </p>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #133020; color: #FFFFFF; padding: 25px 20px; border-radius: 8px; margin-top: 20px;">
        <tr>
            <td align="center">
                <p style="font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.8);">
                    Innovating for a sustainable tomorrow, one solution at a time.<br>
                    Always on, never off.
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-top: 15px; color: rgba(255, 255, 255, 0.9);">
                    88 GreenTech Avenue, Innovation Park, London, EC1A 1AB, UK
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                    Email: <a href="info@lifewood.com" style="color: #FFB347; text-decoration: none;">info@lifewood.com</a> |
                    Phone: <a href="tel:+15551234567" style="color: #FFB347; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
                <div style="margin-top: 15px;">
                    <a href="https://www.lifewood.com/" aria-label="Lifewood Website" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/uQ5HBZu.png" alt="Website Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.youtube.com/@LifewoodDataTechnology/videos" aria-label="YouTube" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/0zjPmNs.png" alt="YouTube Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.linkedin.com/company/lifewood-data-technology-ltd." aria-label="LinkedIn" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/RQPeE74.png" alt="LinkedIn Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.facebook.com/LifewoodPH" aria-label="Facebook" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/mYWfgqD.png" alt="Facebook Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                </div>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-top: 20px;">
                    © ${new Date().getFullYear()} Lifewood. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</div>
`;

export const needsAttentionContactEmailTemplate = `
<div style="font-family: 'Manrope', sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F7F7; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px 8px 0 0;">
        <tr>
            <td align="center" style="padding: 20px;">
                <img src="https://i.imgur.com/zYSWW50.png" alt="Lifewood Logo" width="160" style="display: block; max-width: 160px; height: auto;">
            </td>
        </tr>
    </table>

    <!-- Main Content -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
        <tr>
            <td style="padding: 0 20px;">
                <h2 style="color: #046241; font-size: 26px; line-height: 1.3; margin-bottom: 20px; text-align: center;">
                    We’ve Received Your Message
                </h2>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    Dear {{to_name}},
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    Thank you for reaching out to Lifewood. We appreciate your message and want to let you know that your inquiry has been marked as <strong>high priority</strong>.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                    One of our team members is reviewing your request and will respond to you as soon as possible. Your concerns matter to us, and we’re committed to giving them the attention they deserve.
                </p>
                <!-- CTA -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 5px; background-color: #FFB347;">
                                        <a href="mailto:info@lifewood.com?subject=Follow-up%20on%20My%20Inquiry" target="_blank" style="font-size: 16px; font-family: 'Manrope', sans-serif; color: #133020; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #FFB347; display: inline-block; font-weight: 600;">
                                            Contact Support
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 25px;">
                    Thank you for choosing Lifewood — we’re here to help.
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 0;">
                    Warm regards,
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 5px; font-weight: 500;">
                    Lifewood Support Team
                </p>
            </td>
        </tr>
    </table>

    <!-- Footer (same as others) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #133020; color: #FFFFFF; padding: 25px 20px; border-radius: 8px; margin-top: 20px;">
        <tr>
            <td align="center">
                <p style="font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.8);">
                    Innovating for a sustainable tomorrow, one solution at a time.<br>
                    Always on, never off.
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-top: 15px; color: rgba(255, 255, 255, 0.9);">
                    88 GreenTech Avenue, Innovation Park, London, EC1A 1AB, UK
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                    Email: <a href="info@lifewood.com" style="color: #FFB347; text-decoration: none;">info@lifewood.com</a> |
                    Phone: <a href="tel:+15551234567" style="color: #FFB347; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
                <div style="margin-top: 15px;">
                    <a href="https://www.lifewood.com/" aria-label="Lifewood Website" style="margin: 0 8px; display: inline-block;"><img src="https://i.imgur.com/uQ5HBZu.png" alt="Website Icon" width="24" height="24" style="filter: invert(1);"></a>
                    <a href="https://www.youtube.com/@LifewoodDataTechnology/videos" aria-label="YouTube" style="margin: 0 8px; display: inline-block;"><img src="https://i.imgur.com/0zjPmNs.png" alt="YouTube Icon" width="24" height="24" style="filter: invert(1);"></a>
                    <a href="https://www.linkedin.com/company/lifewood-data-technology-ltd." aria-label="LinkedIn" style="margin: 0 8px; display: inline-block;"><img src="https://i.imgur.com/RQPeE74.png" alt="LinkedIn Icon" width="24" height="24" style="filter: invert(1);"></a>
                    <a href="https://www.facebook.com/LifewoodPH" aria-label="Facebook" style="margin: 0 8px; display: inline-block;"><img src="https://i.imgur.com/mYWfgqD.png" alt="Facebook Icon" width="24" height="24" style="filter: invert(1);"></a>
                </div>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-top: 20px;">
                    © ${new Date().getFullYear()} Lifewood. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</div>
`;

// Generic Admin Reply Email Template
export const adminReplyEmailTemplate = `
<div style="font-family: 'Manrope', sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F7F7; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px 8px 0 0;">
        <tr>
            <td align="center" style="padding: 20px;">
                <img src="https://i.imgur.com/zYSWW50.png" alt="Lifewood Logo" width="160" style="display: block; max-width: 160px; height: auto;">
            </td>
        </tr>
    </table>

    <!-- Main Content -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
        <tr>
            <td style="padding: 0 20px;">
                <h2 style="color: #046241; font-size: 26px; line-height: 1.3; margin-bottom: 20px; text-align: center;">
                    Important Message from Lifewood
                </h2>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 15px;">
                    Dear {{to_name}},
                </p>
                <div style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
                    <!-- Admin's message will be inserted here -->
                    {{message_body}}
                </div>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-bottom: 0;">
                    Best regards,
                </p>
                <p style="color: #133020; font-size: 16px; line-height: 1.7; margin-top: 5px; font-weight: 500;">
                    The Lifewood Team
                </p>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #133020; color: #FFFFFF; padding: 25px 20px; border-radius: 8px; margin-top: 20px;">
        <tr>
            <td align="center">
                <p style="font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.8);">
                    Innovating for a sustainable tomorrow, one solution at a time.<br>
                    Always on, never off.
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-top: 15px; color: rgba(255, 255, 255, 0.9);">
                    88 GreenTech Avenue, Innovation Park, London, EC1A 1AB, UK
                </p>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                    Email: <a href="info@lifewood.com" style="color: #FFB347; text-decoration: none;">info@lifewood.com</a> |
                    Phone: <a href="tel:+15551234567" style="color: #FFB347; text-decoration: none;">+1 (555) 123-4567</a>
                </p>
                <div style="margin-top: 15px;">
                    <a href="https://www.lifewood.com/" aria-label="Lifewood Website" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/uQ5HBZu.png" alt="Website Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.youtube.com/@LifewoodDataTechnology/videos" aria-label="YouTube" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/0zjPmNs.png" alt="YouTube Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.linkedin.com/company/lifewood-data-technology-ltd." aria-label="LinkedIn" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/RQPeE74.png" alt="LinkedIn Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                    <a href="https://www.facebook.com/LifewoodPH" aria-label="Facebook" style="margin: 0 8px; display: inline-block;">
                        <img src="https://i.imgur.com/mYWfgqD.png" alt="Facebook Icon" width="24" height="24" style="filter: invert(1);">
                    </a>
                </div>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-top: 20px;">
                    © ${new Date().getFullYear()} Lifewood. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</div>
`;

// Function to toggle the loading overlay
export function toggleLoadingOverlay(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        console.warn("Loading overlay element not found. Please ensure there is a <div id='loadingOverlay'> in your HTML.");
        return;
    }

    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

// You can add other utility functions here if needed.