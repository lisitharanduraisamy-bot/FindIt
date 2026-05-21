/* ==========================================================
   FINDIT: CAMPUS SAFETY SECURITY ADMIN PANEL VIEW (SUB-TABS)
   ========================================================== */

import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate } from "../utils/helpers.js";

export default {
    activeAdminTab: "claims", // default tab: claims, approved, blacklist, audit
    blacklistSearchQuery: "",

    async render() {
        const user = db.session ? db.session.profile : null;
        
        // Safety guard
        if (!user || user.role !== "admin") {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-shield-halved text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Access Denied</h3>
                    <p>You do not have administrative privileges required to access this portal.</p>
                    <a href="#dashboard" class="btn btn-primary mt-3">Return to Dashboard</a>
                </div>
            `;
        }

        // Fetch all claims across database
        const claims = await db.getClaims();
        const pendingClaims = claims.filter(c => c.status === "pending");
        const approvedClaims = claims.filter(c => c.status === "approved");
        
        // Active found items counts
        const items = await db.getItems();
        const pendingFoundItemsCount = items.filter(i => i.status === "found" || i.status === "claim_pending").length;

        // Fetch all user profiles (for User Blacklist tab)
        let profiles = [];
        try {
            profiles = await db.getProfiles();
        } catch (e) {
            console.warn("Failed to get profiles:", e);
        }

        // Fetch security audit logs (for Audit Logs tab)
        let auditLogs = [];
        try {
            auditLogs = await db.getAuditLogs();
        } catch (e) {
            console.warn("Failed to get audit logs:", e);
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Header -->
                <div>
                    <h2 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Security Claims Center</h2>
                    <p style="font-size: 14px; color: var(--color-outline); margin-top: 4px;">Administrative portal for reviewing ownership verifications and coordinating item handoffs.</p>
                </div>

                <!-- Admin Metrics widgets -->
                <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(217, 119, 6, 0.08); color: var(--color-status-pending);">
                            <i class="fa-solid fa-hourglass-half"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Active Claims Pending</span>
                            <div class="stats-card-value">${pendingClaims.length}</div>
                        </div>
                    </div>
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(37, 99, 235, 0.08); color: var(--color-primary);">
                            <i class="fa-solid fa-boxes-stacked"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Unresolved Found Items</span>
                            <div class="stats-card-value">${pendingFoundItemsCount}</div>
                        </div>
                    </div>
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(22, 163, 74, 0.08); color: var(--color-status-verified);">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Total Claims Approved</span>
                            <div class="stats-card-value">${approvedClaims.length}</div>
                        </div>
                    </div>
                </div>

                <!-- Tabbed Content Section -->
                <div class="card" style="padding: 0; overflow: hidden; min-height: 480px; display: flex; flex-direction: column;">
                    
                    <!-- Tab Bar -->
                    <div style="background-color: var(--color-surface-low); border-bottom: 1px solid var(--color-surface-container); display: flex;">
                        <button class="profile-tab-btn ${this.activeAdminTab === 'claims' ? 'active' : ''}" id="admin-tab-claims" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeAdminTab === 'claims' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeAdminTab === 'claims' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border: none;">
                            <i class="fa-solid fa-hourglass-half" style="margin-right: 6px;"></i> Claims Queue (${pendingClaims.length})
                        </button>
                        <button class="profile-tab-btn ${this.activeAdminTab === 'approved' ? 'active' : ''}" id="admin-tab-approved" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeAdminTab === 'approved' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeAdminTab === 'approved' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border: none;">
                            <i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i> Approved Claims (${approvedClaims.length})
                        </button>
                        <button class="profile-tab-btn ${this.activeAdminTab === 'blacklist' ? 'active' : ''}" id="admin-tab-blacklist" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeAdminTab === 'blacklist' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeAdminTab === 'blacklist' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border: none;">
                            <i class="fa-solid fa-user-slash" style="margin-right: 6px;"></i> User Blacklist
                        </button>
                        <button class="profile-tab-btn ${this.activeAdminTab === 'audit' ? 'active' : ''}" id="admin-tab-audit" style="flex: 1; padding: 16px 20px; font-weight: 700; font-size: 14px; text-align: center; border-bottom: 3px solid ${this.activeAdminTab === 'audit' ? 'var(--color-primary)' : 'transparent'}; color: ${this.activeAdminTab === 'audit' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}; cursor: pointer; background: transparent; border: none;">
                            <i class="fa-solid fa-shield-halved" style="margin-right: 6px;"></i> Security Audit Logs
                        </button>
                    </div>

                    <!-- Tab Content Body -->
                    <div style="flex: 1; padding: 24px;">
                        ${this.renderTabContent(pendingClaims, approvedClaims, profiles, auditLogs)}
                    </div>

                </div>
            </div>
        `;
    },

    renderTabContent(pendingClaims, approvedClaims, profiles, auditLogs) {
        if (this.activeAdminTab === "claims") {
            if (pendingClaims.length === 0) {
                return `
                    <div class="empty-state" style="padding: 48px; text-align: center; color: var(--color-outline);">
                        <i class="fa-solid fa-circle-check text-success" style="font-size: 40px; margin-bottom: 16px;"></i>
                        <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 4px;">Queue Completely Cleared</h3>
                        <p style="font-size: 13px;">No active ownership claims require review at this time.</p>
                    </div>
                `;
            }
            return pendingClaims.map(claim => {
                const item = claim.items || { name: "Archived Item", ref_id: "#N/A", location: "N/A" };
                const claimant = claim.profiles || { name: "Unregistered User", email: "N/A", phone: "N/A", major_class: "Student" };

                return `
                    <div class="card claim-review-card" style="padding: 24px; display: flex; flex-direction: column; gap: 20px; border-left: 4px solid var(--color-status-pending); margin-bottom: 24px; background: var(--color-surface-lowest);">
                        
                        <!-- Claim Card Header -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--color-surface-container); padding-bottom: 14px;">
                           <div>
                               <h3 style="font-size: 16px; font-weight: 700; color: var(--color-on-surface);">${item.name}</h3>
                               <span style="font-size: 12px; color: var(--color-outline); font-weight: bold; text-transform: uppercase;">REF ID: ${item.ref_id} &bull; Found near: ${item.location}</span>
                           </div>
                           <span class="badge badge-pending">
                               <span class="badge-dot-indicator"></span>
                               <span>Pending Approval</span>
                           </span>
                        </div>

                        <!-- Info Grid -->
                        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 24px; font-size: 13px; line-height: 18px; align-items: start;">
                           <!-- Claimant Context -->
                           <div style="background-color: var(--color-surface-low); padding: 16px; border-radius: var(--rounded-md); display: flex; flex-direction: column; gap: 10px;">
                               <h4 style="font-weight: 700; color: var(--color-outline); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Claimant Information</h4>
                               <div>
                                   <strong style="color: var(--color-on-surface); display: block;">${claimant.name}</strong>
                                   <span style="color: var(--color-outline); font-size: 11px;">${claimant.major_class}</span>
                               </div>
                               <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--color-surface-container); padding-top: 8px; font-size: 12px;">
                                   <div style="display: flex; align-items: center; gap: 6px;"><i class="fa-regular fa-envelope" style="color: var(--color-outline);"></i> <span>${claimant.email}</span></div>
                                   <div style="display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-phone" style="color: var(--color-outline);"></i> <span>${claimant.phone || 'N/A'}</span></div>
                               </div>
                           </div>

                           <!-- Explanations and Proofs -->
                           <div style="display: flex; flex-direction: column; gap: 14px;">
                               <div>
                                   <h4 style="font-weight: 700; color: var(--color-on-surface); font-size: 13px; margin-bottom: 4px;">Ownership Context & Timeline</h4>
                                   <p style="color: var(--color-on-surface-variant); background: var(--color-surface-lowest); border: 1px solid var(--color-surface-container); padding: 12px; border-radius: var(--rounded-default); font-style: italic;">
                                       "${claim.ownership_explanation}"
                                   </p>
                               </div>
                               <div>
                                   <h4 style="font-weight: 700; color: var(--color-on-surface); font-size: 13px; margin-bottom: 4px;">Secret Identifiers & Verification Proof</h4>
                                   <p style="color: var(--color-on-surface-variant); background: var(--color-surface-lowest); border: 1px solid var(--color-surface-container); padding: 12px; border-radius: var(--rounded-default); font-style: italic; border-left: 3px solid var(--color-primary);">
                                       "${claim.identifying_characteristics}"
                                   </p>
                               </div>
                               ${claim.attachment_url ? `
                               <div>
                                   <h4 style="font-weight: 700; color: var(--color-on-surface); font-size: 13px; margin-bottom: 4px;">Visual Attachment Proof (BUG-09)</h4>
                                   <div style="max-width: 240px; border-radius: var(--rounded-md); overflow: hidden; border: 1px solid var(--color-surface-container); margin-top: 6px;">
                                       <img src="${claim.attachment_url}" style="width: 100%; max-height: 180px; object-fit: contain; cursor: pointer; display: block;" onclick="window.open(this.src, '_blank')">
                                   </div>
                               </div>
                               ` : ''}
                               ${claim.additional_notes ? `
                               <div>
                                   <h4 style="font-weight: 700; color: var(--color-on-surface); font-size: 13px; margin-bottom: 4px;">Additional Notes</h4>
                                   <p style="color: var(--color-on-surface-variant); font-size: 12px;">
                                       ${claim.additional_notes}
                                   </p>
                               </div>
                               ` : ''}
                           </div>
                        </div>

                        <!-- Action Form Section -->
                        <div style="border-top: 1px solid var(--color-surface-container); padding-top: 16px; background-color: var(--color-surface-low); margin: 0 -24px -24px; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" for="clerk-notes-${claim.id}" style="font-size: 12px;">Clerk Comments / Collection Instructions (Attached to email notifications)</label>
                                <input type="text" id="clerk-notes-${claim.id}" class="form-input" placeholder="e.g. Approved. Please bring student ID to retrieve at Desk B..." style="background: white;">
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                                <button class="btn btn-outline text-danger btn-reject-claim" data-id="${claim.id}" style="background: white;">
                                    <i class="fa-solid fa-ban"></i> Reject Claim
                                </button>
                                <button class="btn btn-primary btn-approve-claim" data-id="${claim.id}">
                                    <i class="fa-solid fa-circle-check"></i> Approve & Issue Retrieval
                                </button>
                            </div>
                        </div>

                    </div>
                `;
            }).join("");
        }

        if (this.activeAdminTab === "approved") {
            if (approvedClaims.length === 0) {
                return `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--color-outline);">No approved claims reported yet.</div>`;
            }
            return `
                <div style="overflow-x: auto; width: 100%;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--color-surface-container); color: var(--color-outline); font-weight: bold; font-size: 12px; text-transform: uppercase;">
                                <th style="padding: 12px 16px;">Item Claimed</th>
                                <th style="padding: 12px 16px;">REF ID</th>
                                <th style="padding: 12px 16px;">Claimant</th>
                                <th style="padding: 12px 16px;">Date Approved</th>
                                <th style="padding: 12px 16px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${approvedClaims.map(claim => {
                                const item = claim.items || { name: "Archived Item", ref_id: "N/A" };
                                const claimant = claim.profiles || { name: "Unregistered User", email: "N/A" };
                                return `
                                    <tr style="border-bottom: 1px solid var(--color-surface-container); vertical-align: middle;">
                                        <td style="padding: 16px; font-weight: 600; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${item.name}</td>
                                        <td style="padding: 16px; font-weight: bold; color: var(--color-primary);">${item.ref_id}</td>
                                        <td style="padding: 16px;">
                                            <strong style="color: var(--color-on-surface); display: block;">${claimant.name}</strong>
                                            <span style="font-size: 11px; color: var(--color-outline);">${claimant.email}</span>
                                        </td>
                                        <td style="padding: 16px; white-space: nowrap;">${formatDate(claim.updated_at)}</td>
                                        <td style="padding: 16px; text-align: right;">
                                            <button class="btn btn-outline btn-print-receipt" data-id="${claim.id}" style="padding: 6px 12px; font-size: 12px; background: white;">
                                                <i class="fa-solid fa-print"></i> Print Return Receipt
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (this.activeAdminTab === "blacklist") {
            const filteredProfiles = profiles.filter(p => {
                const query = (this.blacklistSearchQuery || "").toLowerCase().trim();
                return p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query) || (p.major_class && p.major_class.toLowerCase().includes(query));
            });

            return `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; gap: 12px; max-width: 480px;">
                        <input type="text" id="blacklist-search-input" class="form-input" placeholder="Search users by name, email, or division..." value="${this.blacklistSearchQuery || ''}">
                        <button class="btn btn-primary" id="btn-search-blacklist" style="padding-left: 20px; padding-right: 20px;">Search</button>
                    </div>

                    <div style="overflow-x: auto; width: 100%;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--color-surface-container); color: var(--color-outline); font-weight: bold; font-size: 12px; text-transform: uppercase;">
                                    <th style="padding: 12px 16px;">User Name</th>
                                    <th style="padding: 12px 16px;">Email</th>
                                    <th style="padding: 12px 16px;">Division</th>
                                    <th style="padding: 12px 16px;">Role</th>
                                    <th style="padding: 12px 16px;">Portal Status</th>
                                    <th style="padding: 12px 16px; text-align: right;">Banning Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredProfiles.map(p => {
                                    const isBanned = !!p.banned;
                                    const statusLabel = isBanned ? '<span class="badge badge-lost">Banned</span>' : '<span class="badge badge-verified">Active</span>';
                                    const isMe = db.session && db.session.profile.id === p.id;
                                    return `
                                        <tr style="border-bottom: 1px solid var(--color-surface-container); vertical-align: middle;">
                                            <td style="padding: 16px; font-weight: 600; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${p.name} ${isMe ? '<span style="font-size: 10px; color: var(--color-primary);">(You)</span>' : ''}</td>
                                            <td style="padding: 16px;">${p.email}</td>
                                            <td style="padding: 16px;">${p.major_class || 'N/A'}</td>
                                            <td style="padding: 16px; text-transform: uppercase; font-size: 11px; font-weight: bold; color: var(--color-outline);">${p.role}</td>
                                            <td style="padding: 16px;">${statusLabel}</td>
                                            <td style="padding: 16px; text-align: right;">
                                                <label style="position: relative; display: inline-block; width: 38px; height: 20px; cursor: ${isMe || p.role === 'admin' ? 'not-allowed' : 'pointer'}; user-select: none; opacity: ${isMe || p.role === 'admin' ? 0.4 : 1};">
                                                    <input type="checkbox" class="toggle-ban-user" data-id="${p.id}" ${isBanned ? 'checked' : ''} ${isMe || p.role === 'admin' ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;">
                                                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isBanned ? 'var(--color-error)' : 'var(--color-surface-container)'}; transition: .3s; border-radius: 20px; border: 1px solid var(--color-surface-container); display: flex; align-items: center;" class="slider-ban-bg">
                                                        <span style="position: absolute; content: ''; height: 14px; width: 14px; left: ${isBanned ? '20px' : '2px'}; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%;"></span>
                                                    </span>
                                                </label>
                                            </td>
                                        </tr>
                                    `;
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        if (this.activeAdminTab === "audit") {
            if (auditLogs.length === 0) {
                return `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--color-outline);">No audit logs reported yet.</div>`;
            }
            return `
                <div style="overflow-x: auto; width: 100%;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--color-surface-container); color: var(--color-outline); font-weight: bold; font-size: 12px; text-transform: uppercase;">
                                <th style="padding: 12px 16px;">Timestamp</th>
                                <th style="padding: 12px 16px;">Operator</th>
                                <th style="padding: 12px 16px;">Security Action</th>
                                <th style="padding: 12px 16px;">Target Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${auditLogs.map(log => `
                                <tr style="border-bottom: 1px solid var(--color-surface-container); transition: background 0.2s;" onmouseover="this.style.backgroundColor='var(--color-surface-low)'" onmouseout="this.style.backgroundColor='transparent'">
                                    <td style="padding: 16px; white-space: nowrap; font-family: monospace;">${formatDate(log.created_at)} ${new Date(log.created_at).toLocaleTimeString()}</td>
                                    <td style="padding: 16px; font-weight: 600; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${log.operator_name}</td>
                                    <td style="padding: 16px;"><span class="badge ${log.action.includes('Blacklisted') || log.action.includes('Banned') || log.action.includes('Deleted') || log.action.includes('Rejected') ? 'badge-lost' : 'badge-verified'}" style="padding: 4px 8px;">${log.action}</span></td>
                                    <td style="padding: 16px; color: var(--color-on-surface-variant); font-family: monospace; font-size: 12px;">${log.target_id}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }
    },

    attachEvents(app) {
        // Tab triggers
        document.getElementById("admin-tab-claims")?.addEventListener("click", () => {
            this.activeAdminTab = "claims";
            app.renderView();
        });
        document.getElementById("admin-tab-approved")?.addEventListener("click", () => {
            this.activeAdminTab = "approved";
            app.renderView();
        });
        document.getElementById("admin-tab-blacklist")?.addEventListener("click", () => {
            this.activeAdminTab = "blacklist";
            app.renderView();
        });
        document.getElementById("admin-tab-audit")?.addEventListener("click", () => {
            this.activeAdminTab = "audit";
            app.renderView();
        });

        // Search trigger for blacklist
        const searchBlacklistInput = document.getElementById("blacklist-search-input");
        const btnSearchBlacklist = document.getElementById("btn-search-blacklist");

        if (searchBlacklistInput) {
            searchBlacklistInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    this.blacklistSearchQuery = searchBlacklistInput.value;
                    app.renderView();
                }
            });
        }
        if (btnSearchBlacklist) {
            btnSearchBlacklist.addEventListener("click", () => {
                this.blacklistSearchQuery = searchBlacklistInput ? searchBlacklistInput.value : "";
                app.renderView();
            });
        }

        // Approve trigger
        const approveButtons = document.querySelectorAll(".btn-approve-claim");
        approveButtons.forEach(btn => {
            btn.addEventListener("click", async () => {
                const claimId = btn.getAttribute("data-id");
                const notesInput = document.getElementById(`clerk-notes-${claimId}`);
                const adminNotes = notesInput && notesInput.value.trim()
                    ? notesInput.value.trim()
                    : "Please retrieve your item at the Central Campus Security Desk in the Student Union (Room 102), Monday to Friday, 9:00 AM - 5:00 PM. Please bring your student ID.";

                app.showLoader();
                try {
                    // Update DB claim status
                    const { claim, item } = await db.updateClaimStatus(claimId, "approved", adminNotes);

                    // Fetch claimant profile
                    const claimsList = await db.getClaims();
                    const targetClaim = claimsList.find(c => c.id === claimId);
                    const claimant = targetClaim.profiles;

                    // Send email notification & update local notification table
                    await notify.sendNotificationAndEmail(claim.claimant_id, "claim_approved", {
                        recipientName: claimant.name,
                        recipientEmail: claimant.email,
                        itemName: item.name,
                        refId: item.ref_id,
                        clerkNotes: adminNotes
                    });

                    app.showToast("Claim approved! Retrieval instructions emailed successfully.", "success");
                    app.renderView();
                } catch (err) {
                    app.showToast("Failed to approve claim: " + err.message, "error");
                } finally {
                    app.hideLoader();
                }
            });
        });

        // Reject trigger
        const rejectButtons = document.querySelectorAll(".btn-reject-claim");
        rejectButtons.forEach(btn => {
            btn.addEventListener("click", async () => {
                const claimId = btn.getAttribute("data-id");
                const notesInput = document.getElementById(`clerk-notes-${claimId}`);
                const adminNotes = notesInput ? notesInput.value : "";

                if (!adminNotes) {
                    app.showToast("Please provide clerk comments explaining the rejection reason.", "error");
                    notesInput.focus();
                    return;
                }

                app.showLoader();
                try {
                    // Update DB claim status
                    const { claim, item } = await db.updateClaimStatus(claimId, "rejected", adminNotes);

                    // Fetch claimant profile
                    const claimsList = await db.getClaims();
                    const targetClaim = claimsList.find(c => c.id === claimId);
                    const claimant = targetClaim.profiles;

                    // Send email notification & update local notification table
                    await notify.sendNotificationAndEmail(claim.claimant_id, "claim_rejected", {
                        recipientName: claimant.name,
                        recipientEmail: claimant.email,
                        itemName: item.name,
                        refId: item.ref_id
                    });

                    app.showToast("Claim rejected. Notification sent to claimant.", "info");
                    app.renderView();
                } catch (err) {
                    app.showToast("Failed to reject claim: " + err.message, "error");
                } finally {
                    app.hideLoader();
                }
            });
        });

        // --- PRINT RETURN RECEIPT TRIGGER (Feature 30) ---
        const printButtons = document.querySelectorAll(".btn-print-receipt");
        printButtons.forEach(btn => {
            btn.addEventListener("click", async () => {
                const claimId = btn.getAttribute("data-id");
                try {
                    app.showLoader();
                    const claimsList = await db.getClaims();
                    const claim = claimsList.find(c => c.id === claimId);
                    if (!claim) {
                        app.showToast("Claim not found.", "error");
                        return;
                    }
                    const item = claim.items || { name: "Archived Item", ref_id: "#N/A" };
                    const claimant = claim.profiles || { name: "Unregistered User", email: "N/A" };

                    // Open popup window for receipt
                    const printWindow = window.open("", "_blank", "width=800,height=600");
                    if (!printWindow) {
                        app.showToast("Popup blocked! Please allow popups to print the receipt.", "error");
                        return;
                    }

                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>FindIt - Item Return Receipt</title>
                                <style>
                                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; line-height: 1.5; background-color: #ffffff; }
                                    .receipt-container { border: 2px solid #333; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                                    .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 20px; margin-bottom: 20px; }
                                    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                                    .header p { margin: 5px 0 0; font-size: 14px; color: #555; }
                                    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                                    .details-table td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                                    .details-table td.label { font-weight: bold; color: #555; width: 180px; }
                                    .notes-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 4px; font-style: italic; font-size: 13px; margin-bottom: 30px; }
                                    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
                                    .sig-line { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 8px; font-size: 12px; font-weight: bold; }
                                    .footer { text-align: center; font-size: 11px; color: #777; margin-top: 30px; border-top: 1px dashed #333; padding-top: 15px; }
                                    @media print {
                                        body { padding: 0; }
                                        .receipt-container { border: none; box-shadow: none; }
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="receipt-container">
                                    <div class="header">
                                        <h1>University Lost & Found</h1>
                                        <p>Official Item Handoff & Return Receipt</p>
                                    </div>
                                    <table class="details-table">
                                        <tr><td class="label">Receipt Number:</td><td>REC-${claim.id.replace("claim-", "")}</td></tr>
                                        <tr><td class="label">Item Name:</td><td><strong>${item.name}</strong></td></tr>
                                        <tr><td class="label">Reference ID:</td><td>${item.ref_id}</td></tr>
                                        <tr><td class="label">Claimant Name:</td><td>${claimant.name}</td></tr>
                                        <tr><td class="label">Claimant Email:</td><td>${claimant.email}</td></tr>
                                        <tr><td class="label">Date Approved:</td><td>${formatDate(claim.updated_at)}</td></tr>
                                        <tr><td class="label">Released By:</td><td>Campus Safety Clerk</td></tr>
                                    </table>
                                    <h4 style="margin-bottom: 10px; font-size: 14px;">Clerk Release Notes:</h4>
                                    <div class="notes-box">
                                        "${claim.admin_notes || 'Item retrieved successfully.'}"
                                    </div>
                                    <div class="signatures">
                                        <div class="sig-line">Claimant Signature</div>
                                        <div class="sig-line">Campus Officer Signature</div>
                                    </div>
                                    <div class="footer">
                                        <p>Thank you for using FindIt Campus Lost & Found.</p>
                                        <p>This is an officially recorded handoff receipt.</p>
                                    </div>
                                </div>
                                <script>
                                    window.onload = function() {
                                        window.print();
                                    }
                                </script>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    app.showToast("Receipt document generated successfully.", "success");
                } catch (err) {
                    app.showToast("Failed to print receipt: " + err.message, "error");
                } finally {
                    app.hideLoader();
                }
            });
        });

        // --- BLACKLIST BAN/UNBAN USER priviledge switches (Feature 35) ---
        const banToggles = document.querySelectorAll(".toggle-ban-user");
        banToggles.forEach(toggle => {
            toggle.addEventListener("change", async () => {
                const userId = toggle.getAttribute("data-id");
                const checked = toggle.checked;

                const confirmChange = confirm(`Are you sure you want to ${checked ? 'BAN' : 'UNBAN'} this user? ${checked ? 'Banned users will be locked out of the portal immediately.' : 'Unbanned users will regain portal capabilities.'}`);
                if (!confirmChange) {
                    toggle.checked = !checked; // revert switch state
                    return;
                }

                app.showLoader();
                try {
                    await db.banUser(userId, checked);
                    app.showToast(`User successfully ${checked ? 'blacklisted & banned' : 'unbanned & reactivated'}.`, "success");
                    app.renderView();
                } catch (err) {
                    app.showToast("Failed to update user ban state: " + err.message, "error");
                    toggle.checked = !checked; // revert
                } finally {
                    app.hideLoader();
                }
            });
        });
    }
};
