/* ==========================================================
   FINDIT: USER DASHBOARD VIEW
   ========================================================== */

import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate, timeAgo } from "../utils/helpers.js";

export default {
    async render() {
        const user = db.session ? db.session.profile : null;
        
        // Fetch fresh stats from live/mock database
        const items = await db.getItems();
        const claims = await db.getClaims();
        const notifications = await db.getNotifications();
        
        const totalLost = items.filter(i => i.type === "lost").length;
        const totalFound = items.filter(i => i.type === "found").length;
        const activeClaims = claims.filter(c => c.status === "pending").length;
        const recoveredCount = items.filter(i => i.status === "returned").length;
        
        // Take recent activity (first 4 items)
        const recentItems = items.slice(0, 4);

        // Take recent unread notifications (first 3 items)
        const unreadNotifs = notifications.filter(n => !n.is_read).slice(0, 3);
        let notificationListHTML = "";
        
        if (unreadNotifs.length === 0) {
            notificationListHTML = `<div class="empty-state" style="padding: 24px; text-align: center; color: var(--color-outline); font-size: 13px;">No new alerts.</div>`;
        } else {
            notificationListHTML = unreadNotifs.map(n => {
                let icon = "fa-bell";
                let iconColorClass = "text-primary";
                let iconBg = "rgba(37, 99, 235, 0.08)";
                
                if (n.type === "claim_submitted") {
                    icon = "fa-hand-holding-hand";
                    iconColorClass = "text-primary";
                    iconBg = "rgba(37, 99, 235, 0.08)";
                } else if (n.type === "claim_approved" || n.type === "status_updated" && n.title.includes("Returned")) {
                    icon = "fa-circle-check";
                    iconColorClass = "text-success";
                    iconBg = "rgba(22, 163, 74, 0.08)";
                } else if (n.type === "claim_rejected") {
                    icon = "fa-triangle-exclamation";
                    iconColorClass = "text-danger";
                    iconBg = "rgba(239, 68, 68, 0.08)";
                }
                
                return `
                    <div class="dropdown-item" style="padding: 16px; border-bottom: 1px solid var(--color-surface-container); display: flex; gap: 12px; align-items: flex-start; cursor: pointer;" onclick="window.location.hash='${n.link_to || '#dashboard'}'">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${iconBg}; display: flex; align-items: center; justify-content: center;" class="${iconColorClass}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <h4 style="font-size: 13px; font-weight: 700; color: var(--color-on-surface);">${n.title}</h4>
                            <p style="font-size: 11px; color: var(--color-on-surface-variant); margin-top: 2px;">${n.message}</p>
                            <span style="font-size: 9px; color: var(--color-outline); font-weight: bold; margin-top: 4px; display: block;">${timeAgo(n.created_at)}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }

        // Recent activity feed render
        let activityListHTML = "";
        if (recentItems.length === 0) {
            activityListHTML = `<div class="empty-state" style="padding: var(--spacing-md); text-align: center; color: var(--color-outline);">No recent activity reported yet.</div>`;
        } else {
            activityListHTML = recentItems.map(item => {
                let badgeClass = "badge-lost";
                if (item.status === "found") badgeClass = "badge-found";
                if (item.status === "claim_pending") badgeClass = "badge-pending";
                if (item.status === "returned") badgeClass = "badge-returned";

                return `
                    <div class="activity-item" data-id="${item.id}">
                        <div class="item-meta-info">
                            <div class="item-thumb-wrapper">
                                ${item.image_url ? `<img src="${item.image_url}" alt="Thumbnail">` : `<i class="fa-solid fa-box"></i>`}
                            </div>
                            <div class="item-text-info">
                                <h4>${item.name}</h4>
                                <p>${item.type === 'lost' ? 'Lost in' : 'Found near'} ${item.location} &bull; Ref: ${item.ref_id}</p>
                            </div>
                        </div>
                        <div class="item-right-info">
                            <span class="badge ${badgeClass}">
                                <span class="badge-dot-indicator"></span>
                                <span>${item.status === 'returned' ? 'recovered' : item.status}</span>
                            </span>
                            <span class="item-date-text">${formatDate(item.date_reported)}</span>
                            <i class="fa-solid fa-chevron-right" style="color: var(--color-outline-variant);"></i>
                        </div>
                    </div>
                `;
            }).join("");
        }

        return `
            <div class="dashboard-wrapper">
                <!-- Welcome Banner -->
                <div class="activity-header" style="margin-bottom: 28px;">
                    <div>
                        <h2 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Welcome back, ${user ? user.name : 'Explorer'}</h2>
                        <p style="font-size: 14px; color: var(--color-outline); margin-top: 4px;">Here is the latest overview of campus lost and found activity.</p>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button id="dash-btn-lost" class="btn btn-outline">
                            <i class="fa-solid fa-circle-exclamation" style="color: var(--color-status-lost);"></i>
                            <span>New Lost Report</span>
                        </button>
                        <button id="dash-btn-found" class="btn btn-primary">
                            <i class="fa-solid fa-plus-circle"></i>
                            <span>New Found Report</span>
                        </button>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <!-- Stat Card 1 -->
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(239, 68, 68, 0.08); color: var(--color-status-lost);">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Total Lost Reports</span>
                            <div class="stats-card-value">${totalLost}</div>
                        </div>
                    </div>

                    <!-- Stat Card 2 -->
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(37, 99, 235, 0.08); color: var(--color-status-found);">
                            <i class="fa-solid fa-box-archive"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Total Found Reports</span>
                            <div class="stats-card-value">${totalFound}</div>
                        </div>
                    </div>

                    <!-- Stat Card 3 -->
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(217, 119, 6, 0.08); color: var(--color-status-pending);">
                            <i class="fa-solid fa-id-badge"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Active Claims</span>
                            <div class="stats-card-value">${activeClaims}</div>
                        </div>
                    </div>

                    <!-- Stat Card 4 -->
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(22, 163, 74, 0.08); color: var(--color-status-verified);">
                            <i class="fa-solid fa-shield-halved"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Recovered Items</span>
                            <div class="stats-card-value">${recoveredCount}</div>
                        </div>
                    </div>

                    <!-- Notifications Card -->
                    <div class="dashboard-right-panel card" style="padding: 0; display: flex; flex-direction: column;">
                        <div class="dropdown-header" style="border-bottom: 1px solid var(--color-surface-container); padding: 20px 24px;">
                            <h3 style="font-size: 15px; font-weight: 700;">Notifications</h3>
                            <button id="dash-btn-mark-read" class="btn-link" style="font-size: 12px; font-weight: 600;">Mark all read</button>
                        </div>
                        <div class="dropdown-content" style="flex: 1; max-height: unset;">
                            ${notificationListHTML}
                        </div>
                    </div>

                    <!-- Recent Activity Section -->
                    <div class="recent-activity-panel">
                        <div class="activity-header" style="margin-top: 16px;">
                            <h3 style="font-size: 18px; font-weight: 700; color: var(--color-on-surface);">Recent Activity</h3>
                            <a href="#browse" class="btn-link" style="font-weight: 700; font-size: 13px;">View All <i class="fa-solid fa-arrow-right" style="font-size: 11px;"></i></a>
                        </div>
                        
                        <div class="activity-list">
                            ${activityListHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    attachEvents(app) {
        // Quick lost/found triggers
        document.getElementById("dash-btn-lost").addEventListener("click", () => {
            app.openReportModal("lost");
        });
        document.getElementById("dash-btn-found").addEventListener("click", () => {
            app.openReportModal("found");
        });

        // Click on activity list item to view details
        const items = document.querySelectorAll(".activity-item");
        items.forEach(el => {
            el.addEventListener("click", () => {
                const itemId = el.getAttribute("data-id");
                app.navigateTo(`details/${itemId}`);
            });
        });

        // Mark all read button trigger
        const btnMarkRead = document.getElementById("dash-btn-mark-read");
        if (btnMarkRead) {
            btnMarkRead.addEventListener("click", async () => {
                await db.markNotificationsAsRead();
                notify.showToast("All notifications marked as read.", "info");
                app.syncHeaderNotifications();
                app.renderView();
            });
        }
    }
};
