import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate } from "../utils/helpers.js";

export default {
    activeTab: "lost", // 'lost', 'found', 'claims'

    async render() {
        const user = db.session ? db.session.profile : null;
        if (!user) {
            return `
                <div class="card text-center" style="padding: 48px; min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 800px; margin: 0 auto;">
                    <i class="fa-solid fa-user-lock" style="font-size: 48px; margin-bottom: 16px; color: var(--color-primary);"></i>
                    <h3>Authentication Required</h3>
                    <p>Please sign in to view your reports and claims.</p>
                    <a href="#login" class="btn btn-primary mt-3">Sign In</a>
                </div>
            `;
        }

        // Fetch fresh listings and claims reported by user
        const items = await db.getItems();
        const myLost = items.filter(i => i.reported_by === user.id && i.type === "lost");
        const myFound = items.filter(i => i.reported_by === user.id && i.type === "found");
        const myClaims = await db.getClaims({ user_id: user.id });

        // Tab selection HTML
        let tabContentHTML = "";

        if (this.activeTab === "lost") {
            if (myLost.length === 0) {
                tabContentHTML = `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--color-outline);">You haven't reported any lost items yet.</div>`;
            } else {
                tabContentHTML = this.renderItemsTable(myLost);
            }
        } else if (this.activeTab === "found") {
            if (myFound.length === 0) {
                tabContentHTML = `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--color-outline);">You haven't reported any found items yet.</div>`;
            } else {
                tabContentHTML = this.renderItemsTable(myFound);
            }
        } else if (this.activeTab === "claims") {
            if (myClaims.length === 0) {
                tabContentHTML = `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--color-outline);">You haven't submitted any claims yet.</div>`;
            } else {
                tabContentHTML = this.renderClaimsTable(myClaims);
            }
        }

        return `
            <div class="view-header">
                <div class="view-title">
                    <h2><i class="fa-solid fa-clock-rotate-left"></i> My Reports</h2>
                    <p>Manage your listings and track ownership claim updates.</p>
                </div>
            </div>

            <div style="width: 100%; margin-top: 32px;">
                <!-- Tabs Panel -->
                <div class="card" style="padding: 0; overflow: hidden; min-height: 480px; display: flex; flex-direction: column; width: 100%;">
                    
                    <!-- Tab Bar -->
                    <div style="background-color: var(--color-surface-low); border-bottom: 1px solid var(--color-surface-container); display: flex;">
                        <button class="profile-tab-btn ${this.activeTab === 'lost' ? 'active' : ''}" id="tab-btn-lost" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeTab === 'lost' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeTab === 'lost' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border-left: none; border-right: none; border-top: none;">
                            <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> My Lost Listings (${myLost.length})
                        </button>
                        <button class="profile-tab-btn ${this.activeTab === 'found' ? 'active' : ''}" id="tab-btn-found" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeTab === 'found' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeTab === 'found' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border-left: none; border-right: none; border-top: none;">
                            <i class="fa-solid fa-box-open" style="margin-right: 6px;"></i> My Found Listings (${myFound.length})
                        </button>
                        <button class="profile-tab-btn ${this.activeTab === 'claims' ? 'active' : ''}" id="tab-btn-claims" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeTab === 'claims' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeTab === 'claims' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border-left: none; border-right: none; border-top: none;">
                            <i class="fa-solid fa-hand-holding-hand" style="margin-right: 6px;"></i> My Claims (${myClaims.length})
                        </button>
                    </div>

                    <!-- Tab Content Body -->
                    <div style="flex: 1; padding: 24px;">
                        ${tabContentHTML}
                    </div>

                </div>
            </div>
        `;
    },

    renderItemsTable(items) {
        return `
            <div style="overflow-x: auto; width: 100%;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-surface-container); color: var(--color-outline); font-weight: bold; font-size: 12px; text-transform: uppercase;">
                            <th style="padding: 12px 16px;">Reference</th>
                            <th style="padding: 12px 16px;">Item Name</th>
                            <th style="padding: 12px 16px;">Location</th>
                            <th style="padding: 12px 16px;">Date</th>
                            <th style="padding: 12px 16px;">Status</th>
                            <th style="padding: 12px 16px; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
                            let badgeClass = "badge-lost";
                            if (item.status === "found") badgeClass = "badge-found";
                            if (item.status === "claim_pending") badgeClass = "badge-pending";
                            if (item.status === "returned") badgeClass = "badge-returned";

                            return `
                                <tr style="border-bottom: 1px solid var(--color-surface-container); transition: background 0.2s;" onmouseover="this.style.backgroundColor='var(--color-surface-low)'" onmouseout="this.style.backgroundColor='transparent'">
                                    <td style="padding: 16px; font-weight: bold; color: var(--color-primary);">${item.ref_id}</td>
                                    <td style="padding: 16px; font-weight: 600; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${item.name}</td>
                                    <td style="padding: 16px;">${item.location}</td>
                                    <td style="padding: 16px; white-space: nowrap;">${formatDate(item.date_reported)}</td>
                                    <td style="padding: 16px;">
                                        <span class="badge ${badgeClass}" style="padding: 4px 10px;">
                                            <span class="badge-dot-indicator"></span>
                                            <span>${item.status === 'returned' ? 'recovered' : item.status}</span>
                                        </span>
                                    </td>
                                    <td style="padding: 16px; text-align: right;">
                                        <a href="#details/${item.id}" class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;">
                                            View <i class="fa-solid fa-chevron-right" style="font-size: 9px; margin-left: 4px;"></i>
                                        </a>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderClaimsTable(claims) {
        return `
            <div style="overflow-x: auto; width: 100%;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-surface-container); color: var(--color-outline); font-weight: bold; font-size: 12px; text-transform: uppercase;">
                            <th style="padding: 12px 16px;">Item Claimed</th>
                            <th style="padding: 12px 16px;">REF ID</th>
                            <th style="padding: 12px 16px;">Submitted</th>
                            <th style="padding: 12px 16px;">Status</th>
                            <th style="padding: 12px 16px;">Clerk Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${claims.map(claim => {
                            let badgeClass = "badge-pending";
                            let statusText = "Pending Review";
                            if (claim.status === "approved") {
                                badgeClass = "badge-verified";
                                statusText = "Approved / Ready";
                            } else if (claim.status === "rejected") {
                                badgeClass = "badge-lost";
                                statusText = "Rejected";
                            }

                            const item = claim.items || { name: "Archived Item", ref_id: "N/A" };

                            return `
                                <tr style="border-bottom: 1px solid var(--color-surface-container); vertical-align: top;">
                                    <td style="padding: 16px; font-weight: 600; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${item.name}</td>
                                    <td style="padding: 16px; font-weight: bold; color: var(--color-primary);">${item.ref_id}</td>
                                    <td style="padding: 16px; white-space: nowrap;">${formatDate(claim.created_at)}</td>
                                    <td style="padding: 16px;">
                                        <span class="badge ${badgeClass}" style="padding: 4px 10px; white-space: nowrap;">
                                            <span class="badge-dot-indicator"></span>
                                            <span>${statusText}</span>
                                        </span>
                                    </td>
                                    <td style="padding: 16px; max-width: 240px; color: var(--color-on-surface-variant); line-height: 18px;">
                                        ${claim.admin_notes ? `<i>"${claim.admin_notes}"</i>` : '<span style="color: var(--color-outline);">Under review by campus safety.</span>'}
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
    },

    attachEvents(app) {
        // Tab triggers
        document.getElementById("tab-btn-lost")?.addEventListener("click", () => {
            this.activeTab = "lost";
            app.renderView();
        });
        document.getElementById("tab-btn-found")?.addEventListener("click", () => {
            this.activeTab = "found";
            app.renderView();
        });
        document.getElementById("tab-btn-claims")?.addEventListener("click", () => {
            this.activeTab = "claims";
            app.renderView();
        });
    }
};
