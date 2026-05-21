/* ==========================================================
   FINDIT: CAMPUS SAFETY SECURITY ADMIN PANEL VIEW
   ========================================================== */

import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate } from "../utils/helpers.js";

export default {
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

        // Draft claims listing HTML
        let claimsListHTML = "";
        if (pendingClaims.length === 0) {
            claimsListHTML = `
                <div class="empty-state" style="padding: 48px; text-align: center; color: var(--color-outline);">
                    <i class="fa-solid fa-circle-check text-success" style="font-size: 40px; margin-bottom: 16px;"></i>
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 4px;">Queue Completely Cleared</h3>
                    <p style="font-size: 13px;">No active ownership claims require review at this time.</p>
                </div>
            `;
        } else {
            claimsListHTML = pendingClaims.map(claim => {
                const item = claim.items || { name: "Archived Item", ref_id: "#N/A", location: "N/A" };
                const claimant = claim.profiles || { name: "Unregistered User", email: "N/A", phone: "N/A", major_class: "Student" };

                return `
                    <div class="card claim-review-card" style="padding: 24px; display: flex; flex-direction: column; gap: 20px; border-left: 4px solid var(--color-status-pending);">
                        
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
                                <h4 style="font-weight: 700; color: var(--color-on-surface); font-size: 12px; text-transform: uppercase; color: var(--color-outline); letter-spacing: 0.05em;">Claimant Information</h4>
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

                <!-- Pending Claims section -->
                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
                    <h3 style="font-size: 18px; font-weight: 700; color: var(--color-on-surface);">Verification Approval Queue</h3>
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        ${claimsListHTML}
                    </div>
                </div>
            </div>
        `;
    },

    attachEvents(app) {
        // Approve trigger
        const approveButtons = document.querySelectorAll(".btn-approve-claim");
        approveButtons.forEach(btn => {
            btn.addEventListener("click", async () => {
                const claimId = btn.getAttribute("data-id");
                const notesInput = document.getElementById(`clerk-notes-${claimId}`);
                const adminNotes = notesInput ? notesInput.value : "";

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
                        refId: item.ref_id
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
    }
};
