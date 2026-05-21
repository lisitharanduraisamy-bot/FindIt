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
                    <div class="dropdown-item dashboard-notif-item" style="padding: 16px; border-bottom: 1px solid var(--color-surface-container); display: flex; gap: 12px; align-items: flex-start; cursor: pointer;" data-link="${n.link_to || '#dashboard'}" data-id="${n.id}">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${iconBg}; display: flex; align-items: center; justify-content: center;" class="${iconColorClass}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <h4 style="font-size: 13px; font-weight: 700; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${n.title}</h4>
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
                                <h4 style="font-family: 'Outfit', sans-serif;">${item.name}</h4>
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
                <div class="activity-header" style="margin-bottom: 24px;">
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

                <!-- Desktop Notification Authorization Prompt Banner (Feature 26) -->
                <div id="desktop-notification-prompt" style="display: none; background: linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(99, 102, 241, 0.04)); border: 1px solid rgba(37, 99, 235, 0.12); border-radius: var(--rounded-md); padding: 12px 16px; margin-bottom: 20px; align-items: center; justify-content: space-between; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: rgba(37, 99, 235, 0.08); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 14px;">
                            <i class="fa-solid fa-bell-on"></i>
                        </div>
                        <div style="text-align: left;">
                            <strong style="font-size: 13px; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Enable Real-Time Desktop Notifications</strong>
                            <p style="font-size: 11px; color: var(--color-outline); margin-top: 2px; line-height: 14px;">Receive instant alerts on your device when security officers review your claims or post matching assets.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" id="btn-enable-desktop-push" class="btn btn-primary" style="padding: 6px 14px; font-size: 11px; font-weight: 700; white-space: nowrap;">Enable Push</button>
                        <button type="button" id="btn-dismiss-desktop-push" class="btn-link" style="font-size: 11px; font-weight: 700; padding: 0 8px; color: var(--color-outline); cursor: pointer;">Dismiss</button>
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

                    <!-- Notifications Card with Synthesizer Settings (Feature 9) -->
                    <div class="dashboard-right-panel card" style="padding: 0; display: flex; flex-direction: column;">
                        <div class="dropdown-header" style="border-bottom: 1px solid var(--color-surface-container); padding: 20px 24px;">
                            <h3 style="font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;">Notifications</h3>
                            <button id="dash-btn-mark-read" class="btn-link" style="font-size: 12px; font-weight: 600;">Mark all read</button>
                        </div>
                        <div class="dropdown-content" style="flex: 1; max-height: unset; overflow-y: auto;">
                            ${notificationListHTML}
                        </div>
                        
                        <!-- Web Audio synthesiser controls widget (Feature 9) -->
                        <div style="border-top: 1px solid var(--color-surface-container); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; background: var(--color-surface-low);">
                            <span style="font-weight: 700; color: var(--color-on-surface); display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-volume-high" style="color: var(--color-primary);"></i>
                                <span>Audible Alert Chimes</span>
                            </span>
                            <label style="position: relative; display: inline-block; width: 34px; height: 18px; cursor: pointer; user-select: none;">
                                <input type="checkbox" id="toggle-audio-chime" style="opacity: 0; width: 0; height: 0;" ${localStorage.getItem('findit_audio_chime') !== 'false' ? 'checked' : ''}>
                                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--color-surface-container); transition: .3s; border-radius: 20px; border: 1px solid var(--color-surface-container); display: flex; align-items: center;" id="slider-chime-bg"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Recent Activity Section -->
                    <div class="recent-activity-panel">
                        <div class="activity-header" style="margin-top: 16px;">
                            <h3 style="font-size: 18px; font-weight: 700; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Recent Activity</h3>
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
        // Render desktop push prompt if appropriate (Feature 26)
        if (window.Notification && Notification.permission === "default") {
            const promptBox = document.getElementById("desktop-notification-prompt");
            if (promptBox) promptBox.style.display = "flex";
        }

        // --- BIND PUSH BUTTONS ---
        document.getElementById("btn-enable-desktop-push")?.addEventListener("click", async () => {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                notify.showToast("Desktop notifications enabled successfully!", "success");
                const promptBox = document.getElementById("desktop-notification-prompt");
                if (promptBox) promptBox.style.display = "none";
                
                // Play synthesised chime & dispatch desktop notif
                if (notify.playNotificationChime) notify.playNotificationChime();
                new Notification("FindIt Portal Synchronized", {
                    body: "Secure real-time dashboard updates are now active on this browser.",
                    icon: "https://api.dicebear.com/7.x/adventurer/svg?seed=security"
                });
            } else {
                notify.showToast("Desktop notification authorization rejected.", "info");
                const promptBox = document.getElementById("desktop-notification-prompt");
                if (promptBox) promptBox.style.display = "none";
            }
        });

        document.getElementById("btn-dismiss-desktop-push")?.addEventListener("click", () => {
            const promptBox = document.getElementById("desktop-notification-prompt");
            if (promptBox) promptBox.style.display = "none";
        });

        // --- BIND AUDIO SYNTH SLIDER TOGGLE (Feature 9) ---
        const toggleAudioChime = document.getElementById("toggle-audio-chime");
        const sliderBg = document.getElementById("slider-chime-bg");

        const updateToggleStyle = (isChecked) => {
            if (isChecked) {
                sliderBg.style.backgroundColor = "var(--color-primary)";
                sliderBg.style.borderColor = "var(--color-primary)";
                sliderBg.innerHTML = `<span style="position: absolute; content: ''; height: 12px; width: 12px; left: 18px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%;"></span>`;
            } else {
                sliderBg.style.backgroundColor = "var(--color-surface-container)";
                sliderBg.style.borderColor = "var(--color-surface-container)";
                sliderBg.innerHTML = `<span style="position: absolute; content: ''; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%;"></span>`;
            }
        };

        if (toggleAudioChime && sliderBg) {
            updateToggleStyle(toggleAudioChime.checked);
            
            toggleAudioChime.addEventListener("change", (e) => {
                const isChecked = e.target.checked;
                localStorage.setItem('findit_audio_chime', isChecked ? 'true' : 'false');
                updateToggleStyle(isChecked);
                
                if (isChecked) {
                    notify.showToast("Audible alert chimes enabled!", "success");
                    // Test synth bell frequency
                    if (notify.playNotificationChime) {
                        notify.playNotificationChime();
                    }
                } else {
                    notify.showToast("Audible alerts muted.", "info");
                }
            });
        }

        // Quick lost/found triggers
        document.getElementById("dash-btn-lost")?.addEventListener("click", () => {
            app.openReportModal("lost");
        });
        document.getElementById("dash-btn-found")?.addEventListener("click", () => {
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

        // Click on dashboard notification list item
        const notifItems = document.querySelectorAll(".dashboard-notif-item");
        notifItems.forEach(el => {
            el.addEventListener("click", async () => {
                const notifId = el.getAttribute("data-id");
                const link = el.getAttribute("data-link");
                try {
                    await db.markNotificationAsRead(notifId);
                } catch (err) {
                    console.error("Failed to mark notification as read:", err);
                }
                await app.syncHeaderNotifications();
                window.location.hash = link;
                if (window.location.hash === link) {
                    app.renderView();
                }
            });
        });
    }
};
