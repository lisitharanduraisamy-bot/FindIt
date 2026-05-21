/**
 * FindIt - High Fidelity Interactive Mockup State Engine
 * Synchronizes client-side prototype behavior using LocalStorage
 */

// --- 1. DEFAULT SEED DATA ---
const SEED_ITEMS = [
    {
        id: "ITM-9872",
        title: "MacBook Pro 14\" (Space Gray)",
        category: "Electronics",
        type: "found",
        status: "found",
        location: "Student Union Lounge",
        date: "2026-05-20",
        description: "Found on the third-floor lounge coffee table. Screen is intact, has a metallic sticker of a space shuttle on the lid. Currently held at the main security office.",
        reporter: "Security Officer Miller",
        reporterEmail: "security@university.edu",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ITM-1029",
        title: "Apple AirPods Pro (Gen 2)",
        category: "Accessories",
        type: "lost",
        status: "lost",
        location: "Campus Recreation Center (Gym)",
        date: "2026-05-19",
        description: "Lost during the evening basketball run. Case has a red silicone cover. Left pod might have lower battery. Please help find it!",
        reporter: "Alex Morgan",
        reporterEmail: "student@university.edu",
        image: "https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ITM-4820",
        title: "Brown Leather Bi-fold Wallet",
        category: "Personal Effects",
        type: "found",
        status: "found",
        location: "Science Hall Room 302",
        date: "2026-05-21",
        description: "Found under a desk after organic chemistry lecture. Contains some cash and a student ID for a 'James C.' Handed to Chemistry department admin.",
        reporter: "Prof. Eleanor Davis",
        reporterEmail: "edavis@university.edu",
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ITM-2901",
        title: "Hydro Flask 32oz (Cobalt Blue)",
        category: "Bottles/Containers",
        type: "found",
        status: "found",
        location: "Library Study Room B",
        date: "2026-05-18",
        description: "Cobalt blue water bottle with silver cap and stickers of national parks. Left on the window sill.",
        reporter: "Librarian Smith",
        reporterEmail: "lsmith@university.edu",
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ITM-3304",
        title: "Keys on Carabiner (D-Ring)",
        category: "Personal Effects",
        type: "lost",
        status: "lost",
        location: "Engineering Quad Grass Area",
        date: "2026-05-21",
        description: "Set of three keys (one dorm key, one bike key, one mail key) attached to a blue D-ring carabiner. Has a small plastic Yoda keychain.",
        reporter: "Marcus Brody",
        reporterEmail: "mbrody@university.edu",
        image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80"
    }
];

const SEED_CLAIMS = [
    {
        id: "CLM-4402",
        itemId: "ITM-9872",
        itemTitle: "MacBook Pro 14\" (Space Gray)",
        claimantName: "Alex Morgan",
        claimantEmail: "student@university.edu",
        claimantId: "2026-9876",
        date: "2026-05-21",
        proof: "I forgot it while rushing to my CS capstone meeting. The space shuttle sticker is from Kennedy Space Center, and I can unlock it with my password or TouchID to prove ownership.",
        status: "pending"
    }
];

const SEED_NOTIFICATIONS = [
    {
        id: "nt-1",
        title: "New Match Identified!",
        message: "A MacBook Pro matching your lost listing was recently reported at Student Union Lounge.",
        date: "2026-05-20",
        unread: true
    },
    {
        id: "nt-2",
        title: "System Notification",
        message: "Welcome to the FindIt academic lost & found portal.",
        date: "2026-05-19",
        unread: false
    }
];

const SEED_OUTBOX = [
    {
        id: "em-1",
        to: "student@university.edu",
        type: "System Account Notification",
        subject: "Welcome to FindIt Lost & Found Portal",
        body: "Hi Student,\n\nWelcome to FindIt. Easily report lost items, log found items, and reclaim your belongings securely.\nTo get started, please browse dashboard to view recent items.",
        date: "2026-05-19 12:00"
    }
];

const SEED_USER = {
    name: "Alex Morgan",
    email: "student@university.edu",
    id: "2026-9876",
    role: "student",
    avatar: "AM"
};

// --- 2. STATE MANAGER CLASS ---
class MockupStateManager {
    constructor() {
        this.initializeState();
    }

    initializeState() {
        if (!localStorage.getItem("findit_initialized")) {
            localStorage.setItem("findit_items", JSON.stringify(SEED_ITEMS));
            localStorage.setItem("findit_claims", JSON.stringify(SEED_CLAIMS));
            localStorage.setItem("findit_notifications", JSON.stringify(SEED_NOTIFICATIONS));
            localStorage.setItem("findit_outbox", JSON.stringify(SEED_OUTBOX));
            localStorage.setItem("findit_user", JSON.stringify(SEED_USER));
            localStorage.setItem("findit_initialized", "true");
        }
    }

    // -- GETTERS --
    getItems() {
        return JSON.parse(localStorage.getItem("findit_items") || "[]");
    }

    getClaims() {
        return JSON.parse(localStorage.getItem("findit_claims") || "[]");
    }

    getNotifications() {
        return JSON.parse(localStorage.getItem("findit_notifications") || "[]");
    }

    getOutbox() {
        return JSON.parse(localStorage.getItem("findit_outbox") || "[]");
    }

    getUser() {
        return JSON.parse(localStorage.getItem("findit_user") || "{}");
    }

    // -- ACTIONS --
    saveUser(user) {
        localStorage.setItem("findit_user", JSON.stringify(user));
    }

    addItem(item) {
        const items = this.getItems();
        const nextId = "ITM-" + Math.floor(1000 + Math.random() * 9000);
        const newItem = { id: nextId, ...item };
        items.unshift(newItem);
        localStorage.setItem("findit_items", JSON.stringify(items));
        
        // Log notification and email outbox
        this.logEmail(
            item.reporterEmail || "student@university.edu",
            "Item Submission Confirmed",
            `Hello,\n\nWe have successfully received your report for the item: "${item.title}". It is now registered in the FindIt system.\n\nRef ID: ${nextId}\nCategory: ${item.category}\nLocation: ${item.location}`
        );

        return newItem;
    }

    submitClaim(claim) {
        const claims = this.getClaims();
        const nextId = "CLM-" + Math.floor(1000 + Math.random() * 9000);
        const newClaim = { id: nextId, ...claim, status: "pending" };
        claims.unshift(newClaim);
        localStorage.setItem("findit_claims", JSON.stringify(claims));

        // Update item status to show it is now claimed/pending
        const items = this.getItems();
        const itemIdx = items.findIndex(i => i.id === claim.itemId);
        if (itemIdx !== -1) {
            items[itemIdx].status = "pending";
            localStorage.setItem("findit_items", JSON.stringify(items));
        }

        // Add outbox log
        this.logEmail(
            claim.claimantEmail,
            "Ownership Claim Filed",
            `Hi ${claim.claimantName},\n\nYour ownership claim for item Ref ID: ${claim.itemId} has been filed successfully. Our campus security office will review your provided proof and contact you once approved.\n\nClaim ID: ${nextId}`
        );

        // Add Notification
        this.addNotification("Claim Submitted", `Your claim CLM-${nextId.substring(4)} has been logged and is awaiting security review.`);
        
        return newClaim;
    }

    updateClaimStatus(claimId, newStatus) {
        const claims = this.getClaims();
        const claimIdx = claims.findIndex(c => c.id === claimId);
        if (claimIdx !== -1) {
            const claim = claims[claimIdx];
            claim.status = newStatus;
            localStorage.setItem("findit_claims", JSON.stringify(claims));

            // Also update the item status
            const items = this.getItems();
            const itemIdx = items.findIndex(i => i.id === claim.itemId);
            if (itemIdx !== -1) {
                if (newStatus === "approved") {
                    items[itemIdx].status = "returned";
                } else if (newStatus === "rejected") {
                    items[itemIdx].status = "found"; // back to available
                }
                localStorage.setItem("findit_items", JSON.stringify(items));
            }

            // Email log
            const subject = newStatus === "approved" ? "Ownership Claim Approved" : "Ownership Claim Rejected";
            const body = newStatus === "approved" 
                ? `Hi ${claim.claimantName},\n\nGood news! Your claim for "${claim.itemTitle}" (ID: ${claim.itemId}) has been APPROVED by campus security.\n\nPlease pick up your item at: Student Union Hall Desk 102.\nMake sure to bring your Student ID card: ${claim.claimantId}.`
                : `Hi ${claim.claimantName},\n\nWe were unable to verify your ownership claim for "${claim.itemTitle}" (ID: ${claim.itemId}) based on the details provided.\n\nIf you have additional proof or questions, please visit the Campus Security Center.`;
            
            this.logEmail(claim.claimantEmail, subject, body);

            // Add notification
            const title = newStatus === "approved" ? "Claim Approved 🎉" : "Claim Rejected";
            this.addNotification(title, `Your ownership claim for ${claim.itemTitle} has been ${newStatus}.`);
        }
    }

    logEmail(to, subject, body) {
        const outbox = this.getOutbox();
        const date = new Date().toISOString().replace('T', ' ').substring(0, 16);
        outbox.unshift({
            id: "em-" + Math.floor(1000 + Math.random() * 9000),
            to,
            type: "Transactional Alert",
            subject,
            body,
            date
        });
        localStorage.setItem("findit_outbox", JSON.stringify(outbox));
        
        // Dispatch custom event to refresh outbox simulator UI in real time
        window.dispatchEvent(new Event("findit_outbox_updated"));
    }

    addNotification(title, message) {
        const notifications = this.getNotifications();
        notifications.unshift({
            id: "nt-" + Math.floor(1000 + Math.random() * 9000),
            title,
            message,
            date: new Date().toISOString().substring(0, 10),
            unread: true
        });
        localStorage.setItem("findit_notifications", JSON.stringify(notifications));
        window.dispatchEvent(new Event("findit_notifications_updated"));
    }

    clearNotifications() {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.unread = false);
        localStorage.setItem("findit_notifications", JSON.stringify(notifications));
        window.dispatchEvent(new Event("findit_notifications_updated"));
    }
}

// Global instance
window.mockState = new MockupStateManager();

// --- 3. COMMON INTERACTIVE RENDERERS ---
document.addEventListener("DOMContentLoaded", () => {
    // Determine active menu item based on URL filename
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf("/") + 1);
    
    // Set active item in Sidebar
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        const href = item.getAttribute("href");
        if (href && page.includes(href)) {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
        }
    });

    // Update avatar/initials and profile names
    updateProfileDisplays();

    // Setup outbox simulator automatically
    setupOutboxSimulator();

    // Setup notification dropdown/badge in header
    setupHeaderNotifications();

    // Listen to custom updates
    window.addEventListener("findit_outbox_updated", renderOutboxItems);
    window.addEventListener("findit_notifications_updated", updateHeaderNotifications);
});

// Update profile elements with current LocalStorage values
function updateProfileDisplays() {
    const user = window.mockState.getUser();
    if (!user) return;
    
    // Header avatar text
    const headerAvatar = document.querySelector(".header-right .avatar, .header-right .profile-trigger .avatar");
    if (headerAvatar) {
        headerAvatar.textContent = user.avatar || "AM";
    }

    // Sidebar footer student info
    const footerName = document.querySelector(".sidebar-footer .user-name");
    const footerEmail = document.querySelector(".sidebar-footer .user-email");
    if (footerName) footerName.textContent = user.name || "Alex Morgan";
    if (footerEmail) footerEmail.textContent = user.email || "student@university.edu";
    
    // Check role to conditionally toggle admin link in sidebar
    const adminLink = document.querySelector(".nav-item[href='admin_portal.html']");
    if (adminLink) {
        if (user.role === "admin") {
            adminLink.style.display = "flex";
        } else {
            adminLink.style.display = "none";
        }
    }
}

// Build notification popups
function setupHeaderNotifications() {
    const bellBtn = document.querySelector(".header-right .badge-wrapper, .header-right button i.fa-bell");
    if (!bellBtn) return;

    // Ensure it is wrapped in an interactive container
    const wrapper = bellBtn.closest(".badge-wrapper") || bellBtn.parentElement;
    wrapper.style.cursor = "pointer";

    // Setup Dropdown UI container
    const dropdown = document.createElement("div");
    dropdown.id = "notification-dropdown";
    dropdown.className = "hidden";
    dropdown.style.cssText = `
        position: absolute;
        top: 50px;
        right: 0;
        width: 320px;
        background: #ffffff;
        border: 1px solid var(--color-outline-variant);
        border-radius: var(--rounded-md);
        box-shadow: var(--shadow-overlay);
        z-index: 1000;
        overflow: hidden;
    `;
    
    wrapper.appendChild(dropdown);

    wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
        if (!dropdown.classList.contains("hidden")) {
            window.mockState.clearNotifications();
        }
    });

    document.addEventListener("click", () => {
        dropdown.classList.add("hidden");
    });

    updateHeaderNotifications();
}

function updateHeaderNotifications() {
    const notifications = window.mockState.getNotifications();
    const unreadCount = notifications.filter(n => n.unread).length;

    // Update red dot badge
    let dot = document.querySelector(".header-right .badge-dot");
    const badgeWrapper = document.querySelector(".header-right .badge-wrapper");
    if (badgeWrapper) {
        if (unreadCount > 0) {
            if (!dot) {
                dot = document.createElement("div");
                dot.className = "badge-dot";
                badgeWrapper.appendChild(dot);
            }
        } else if (dot) {
            dot.remove();
        }
    }

    // Render dropdown list
    const dropdown = document.getElementById("notification-dropdown");
    if (!dropdown) return;

    let html = `
        <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-outline-variant); display: flex; justify-content: space-between; align-items: center; background: var(--color-surface-low);">
            <strong style="font-size: 14px; color: var(--color-on-surface);">Notifications</strong>
            <span style="font-size: 11px; font-weight:600; padding:2px 8px; background:var(--color-primary-container); color:white; border-radius:12px;">${unreadCount} New</span>
        </div>
        <div style="max-height: 250px; overflow-y: auto;">
    `;

    if (notifications.length === 0) {
        html += `<div style="padding: 24px; text-align: center; color: var(--color-outline); font-size: 13px;">No notifications yet</div>`;
    } else {
        notifications.forEach(n => {
            html += `
                <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-surface-container); transition: background 0.2s;" class="notification-item">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                        <span style="font-size: 13px; font-weight: 600; color: var(--color-on-surface);">${n.title}</span>
                        <span style="font-size: 10px; color: var(--color-outline);">${n.date}</span>
                    </div>
                    <p style="font-size: 12px; color: var(--color-on-surface-variant); line-height: 1.4; margin: 0;">${n.message}</p>
                </div>
            `;
        });
    }

    html += `</div>`;
    dropdown.innerHTML = html;
}

// Shared Outbox UI Injector
function setupOutboxSimulator() {
    let simulator = document.getElementById("dev-email-simulator");
    if (simulator) return; // already in static html

    // Inject outbox html at the bottom of the page
    simulator = document.createElement("div");
    simulator.id = "dev-email-simulator";
    simulator.className = "email-outbox-collapsed";
    simulator.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 380px;
        border-radius: var(--rounded-lg);
        box-shadow: var(--shadow-overlay);
        z-index: 9999;
        overflow: hidden;
        border: 1px solid var(--color-outline-variant);
        background: #ffffff;
        font-family: 'Inter', sans-serif;
    `;

    document.body.appendChild(simulator);
    renderOutboxWrapper();
}

function renderOutboxWrapper() {
    const simulator = document.getElementById("dev-email-simulator");
    if (!simulator) return;

    simulator.innerHTML = `
        <div class="simulator-bar" id="email-simulator-bar" style="background-color: var(--color-inverse-surface); color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div class="title-with-badge" style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;">
                <i class="fa-solid fa-envelope-open-text" style="color: var(--color-inverse-primary);"></i>
                <span>Email Outbox Simulator (Dev Mode)</span>
                <span id="email-outbox-badge" class="count-badge" style="background: var(--color-error); color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">0</span>
            </div>
            <button id="btn-toggle-outbox" class="btn-icon" style="color: white; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
                <i class="fa-solid fa-chevron-up" id="outbox-toggle-icon"></i>
            </button>
        </div>
        <div class="simulator-body hidden" id="email-simulator-body" style="padding: 16px; max-height: 350px; overflow-y: auto; background-color: var(--color-surface);">
            <div class="outbox-list" id="outbox-list-container">
                <!-- Rendered dynamically -->
            </div>
        </div>
    `;

    const bar = document.getElementById("email-simulator-bar");
    bar.addEventListener("click", toggleOutbox);

    renderOutboxItems();
}

function toggleOutbox() {
    const body = document.getElementById("email-simulator-body");
    const icon = document.getElementById("outbox-toggle-icon");
    if (body.classList.contains("hidden")) {
        body.classList.remove("hidden");
        icon.className = "fa-solid fa-chevron-down";
    } else {
        body.classList.add("hidden");
        icon.className = "fa-solid fa-chevron-up";
    }
}

function renderOutboxItems() {
    const outbox = window.mockState.getOutbox();
    
    // Update badge count
    const badge = document.getElementById("email-outbox-badge");
    if (badge) {
        badge.textContent = outbox.length;
    }

    const list = document.getElementById("outbox-list-container");
    if (!list) return;

    if (outbox.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:24px 0; color:var(--color-outline); font-size:12px;">No outbox logs yet</div>`;
        return;
    }

    let html = "";
    outbox.forEach(email => {
        html += `
            <div class="email-preview-card" style="background:#ffffff; border:1px solid var(--color-outline-variant); border-radius:var(--rounded-default); padding:12px; margin-bottom:12px; box-shadow:var(--shadow-sm);">
                <div class="email-preview-header" style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:6px; border-bottom:1px dashed var(--color-surface-container); padding-bottom:4px;">
                    <div style="color:var(--color-on-surface-variant);">To: <span style="font-weight:600; color:var(--color-primary);">${email.to}</span></div>
                    <div style="color:var(--color-outline);">${email.date}</div>
                </div>
                <div class="email-preview-subject" style="font-size:12px; font-weight:700; color:var(--color-on-surface); margin-bottom:6px;">Subject: ${email.subject}</div>
                <div class="email-preview-html" style="font-size:11px; color:var(--color-on-surface-variant); white-space:pre-wrap; line-height:1.4; background:var(--color-surface-low); padding:8px; border-radius:var(--rounded-sm); font-family: monospace;">${email.body}</div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// Utility Toast Alert helper
window.showToast = function(title, message, type = "success") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #ffffff;
        border-left: 4px solid ${type === 'success' ? 'var(--color-status-verified)' : 'var(--color-error)'};
        box-shadow: var(--shadow-overlay);
        border-radius: var(--rounded-default);
        padding: 12px 20px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Inter', sans-serif;
        animation: toast-fade-in 0.3s ease;
    `;
    
    // Add slide in keyframes if not defined
    if (!document.getElementById("toast-animation-styles")) {
        const style = document.createElement("style");
        style.id = "toast-animation-styles";
        style.textContent = `
            @keyframes toast-fade-in {
                from { top: 0px; opacity: 0; }
                to { top: 24px; opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    const icon = type === "success" 
        ? '<i class="fa-solid fa-circle-check" style="color:var(--color-status-verified); font-size:18px;"></i>'
        : '<i class="fa-solid fa-circle-exclamation" style="color:var(--color-error); font-size:18px;"></i>';

    toast.innerHTML = `
        ${icon}
        <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--color-on-surface);">${title}</div>
            <div style="font-size: 11px; color: var(--color-on-surface-variant);">${message}</div>
        </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = "opacity 0.3s ease";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
