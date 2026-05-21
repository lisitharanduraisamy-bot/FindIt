/* ==========================================================
   FINDIT: ITEM DETAILS SPECIFICATION VIEW
   ========================================================== */

import { db } from "../services/supabase.js";
import { getCategoryIcon, formatDate } from "../utils/helpers.js";

export default {
    itemId: null,

    async render() {
        if (!this.itemId) {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Error: Item Not Found</h3>
                    <p>No valid item reference was provided. Please go back and try again.</p>
                    <a href="#browse" class="btn btn-primary mt-3">Back to Catalog</a>
                </div>
            `;
        }

        const item = await db.getItemById(this.itemId);
        if (!item) {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Error: Item Not Found</h3>
                    <p>The requested item could not be retrieved from the database. It may have been deleted or archived.</p>
                    <a href="#browse" class="btn btn-primary mt-3">Back to Catalog</a>
                </div>
            `;
        }

        const user = db.session ? db.session.profile : null;
        const isOwner = user && user.id === item.reported_by;
        const isAdmin = user && user.role === "admin";

        // Resolve category slug and icon
        const catSlug = item.categories?.slug || "others";
        const catName = item.categories?.name || "Others";
        const catIcon = getCategoryIcon(catSlug);

        // Status chip configuration
        let badgeClass = "badge-lost";
        let statusText = "Lost";
        if (item.status === "found") {
            badgeClass = "badge-found";
            statusText = "Found";
        } else if (item.status === "claim_pending") {
            badgeClass = "badge-pending";
            statusText = "Claim Pending";
        } else if (item.status === "returned") {
            badgeClass = "badge-returned";
            statusText = "Recovered";
        }

        // Action panel logic
        let actionButtonsHTML = "";
        
        if (!user) {
            actionButtonsHTML = `
                <button class="btn btn-primary btn-block" id="btn-login-to-claim" style="padding: 12px;">
                    <i class="fa-solid fa-arrow-right-to-bracket"></i>
                    <span>Sign In to Claim Item</span>
                </button>
            `;
        } else if (item.status === "returned") {
            actionButtonsHTML = `
                <div class="alert alert-info text-center" style="margin-bottom: 0;">
                    <i class="fa-solid fa-circle-check text-success" style="font-size: 20px; margin-bottom: 4px; display: block;"></i>
                    <div>This item has been successfully claimed and returned to its owner.</div>
                </div>
            `;
        } else {
            // Logged in
            if (isOwner || isAdmin) {
                // Own reported item or Admin
                actionButtonsHTML = `
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div class="alert alert-info" style="font-size: 13px;">
                            <i class="fa-solid fa-user-shield"></i>
                            <span>You have administrative rights over this report.</span>
                        </div>
                        <button class="btn btn-outline text-danger btn-block" id="btn-delete-item" style="padding: 12px;">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Archive/Delete Listing</span>
                        </button>
                    </div>
                `;
            } else {
                // Another user's item
                if (item.type === "found") {
                    actionButtonsHTML = `
                        <button class="btn btn-primary btn-block" id="btn-claim-item" style="padding: 12px;">
                            <i class="fa-solid fa-hand-holding-hand"></i>
                            <span>Submit Ownership Claim</span>
                        </button>
                    `;
                } else {
                    // Item reported as Lost - show contact support/I found it
                    actionButtonsHTML = `
                        <button class="btn btn-outline btn-block" id="btn-found-this" style="padding: 12px; border-color: var(--color-primary); color: var(--color-primary);">
                            <i class="fa-solid fa-box-open"></i>
                            <span>I Found This Item</span>
                        </button>
                    `;
                }
            }
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Navigation breadcrumb and title -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <a href="#browse" class="btn-link" style="padding: 0; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-arrow-left"></i> Back to Catalog
                    </a>
                </div>

                <!-- Product Specifications Detail Grid -->
                <div class="details-grid" style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;">
                    
                    <!-- Left Column: Specs Cover Sheet -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        
                        <!-- Main Item Card -->
                        <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                            <!-- Large Image Cover -->
                            <div style="width: 100%; max-height: 480px; position: relative; background-color: var(--color-surface-low); overflow: hidden; display: flex; justify-content: center; align-items: center;">
                                <img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain; max-height: 480px;">
                            </div>
                            
                            <!-- Specifications Content -->
                            <div style="padding: 32px; display: flex; flex-direction: column; gap: 20px;">
                                <!-- Category and ID header -->
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--color-primary); background-color: rgba(37, 99, 235, 0.08); padding: 6px 12px; border-radius: var(--rounded-sm);">
                                        <i class="${catIcon}"></i>
                                        <span>${catName}</span>
                                    </div>
                                    <span style="font-size: 13px; color: var(--color-outline); font-weight: bold; text-transform: uppercase;">Reference: ${item.ref_id}</span>
                                </div>
                                
                                <h1 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); line-height: 34px; font-family: 'Outfit', sans-serif;">${item.name}</h1>
                                
                                <div style="border-top: 1px solid var(--color-surface-container); padding-top: 20px;">
                                    <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 8px;">Detailed Description</h3>
                                    <p style="font-size: 14px; line-height: 22px; color: var(--color-on-surface-variant); white-space: pre-line;">${item.description}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Safety / Claiming Warning Banner -->
                        <div class="card" style="border-left: 4px solid var(--color-status-pending); background-color: rgba(217, 119, 6, 0.04); display: flex; gap: 16px; padding: 20px 24px;">
                            <i class="fa-solid fa-shield-halved" style="font-size: 24px; color: var(--color-status-pending); margin-top: 2px;"></i>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <h4 style="font-size: 14px; font-weight: 700; color: var(--color-on-surface);">Secure Retrieval Policy</h4>
                                <p style="font-size: 13px; color: var(--color-on-surface-variant); line-height: 18px;">To prevent fraudulent claims, users must provide precise details (such as serial numbers, decals, laptop passwords, or receipts) when filing a claim. Approvals require verification by the campus security desk.</p>
                            </div>
                        </div>

                    </div>

                    <!-- Right Column: Metadata Context Sidebar -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        
                        <!-- Status Panel -->
                        <div class="card" style="display: flex; flex-direction: column; gap: 20px; padding: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-surface-container); padding-bottom: 14px;">
                                <span style="font-size: 13px; font-weight: 600; color: var(--color-outline);">Listing Status</span>
                                <span class="badge ${badgeClass}">
                                    <span class="badge-dot-indicator"></span>
                                    <span>${statusText}</span>
                                </span>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px; color: var(--color-on-surface-variant);">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fa-solid fa-location-dot" style="color: var(--color-outline); width: 16px; text-align: center;"></i>
                                    <div>
                                        <div style="font-weight: 700; color: var(--color-on-surface);">Location</div>
                                        <div>${item.location}</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fa-regular fa-calendar" style="color: var(--color-outline); width: 16px; text-align: center;"></i>
                                    <div>
                                        <div style="font-weight: 700; color: var(--color-on-surface);">Date Reported</div>
                                        <div>${formatDate(item.date_reported)}</div>
                                    </div>
                                </div>
                            </div>

                            <div style="border-top: 1px solid var(--color-surface-container); padding-top: 16px; display: flex; flex-direction: column; gap: 12px;">
                                ${actionButtonsHTML}
                            </div>
                        </div>

                        <!-- Contact / Reporter Card -->
                        <div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                            <h3 style="font-size: 14px; font-weight: 700; color: var(--color-on-surface);">Reported By</h3>
                            
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--color-surface-container); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--color-primary);">
                                    ${item.contact_name ? item.contact_name[0] : 'U'}
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <strong style="font-size: 13px; color: var(--color-on-surface);">${item.contact_name}</strong>
                                    <span style="font-size: 11px; color: var(--color-outline);">${isOwner ? 'You submitted this' : 'Campus Member'}</span>
                                </div>
                            </div>
                            
                            ${isOwner || isAdmin || item.type === "lost" ? `
                                <div style="border-top: 1px solid var(--color-surface-container); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--color-on-surface-variant);">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-regular fa-envelope" style="color: var(--color-outline); width: 14px; text-align: center;"></i>
                                        <span>${item.contact_email}</span>
                                    </div>
                                </div>
                            ` : `
                                <div class="alert alert-info" style="font-size: 11px; padding: 10px; margin-top: 4px;">
                                    <i class="fa-solid fa-lock"></i>
                                    <span>Contact details hidden for privacy. Submit a claim to communicate.</span>
                                </div>
                            `}
                        </div>

                    </div>

                </div>
            </div>
        `;
    },

    attachEvents(app) {
        // Sign in button redirect
        document.getElementById("btn-login-to-claim")?.addEventListener("click", () => {
            app.navigateTo("login");
        });

        // Submit claim redirect
        document.getElementById("btn-claim-item")?.addEventListener("click", () => {
            app.navigateTo(`claim/${this.itemId}`);
        });

        // Archive / Delete report button trigger
        document.getElementById("btn-delete-item")?.addEventListener("click", async () => {
            if (confirm("Are you sure you want to permanently delete/archive this item listing? This action is irreversible.")) {
                app.showLoader();
                try {
                    await db.deleteItem(this.itemId);
                    app.showToast("Report deleted successfully.", "success");
                    app.navigateTo("browse");
                } catch (err) {
                    app.showToast("Failed to delete item: " + err.message, "error");
                } finally {
                    app.hideLoader();
                }
            }
        });

        // I found this lost item trigger
        document.getElementById("btn-found-this")?.addEventListener("click", () => {
            alert(`Thank you for finding this item! Please bring it to the Central Campus Security Desk (Student Union Room 102). Reference ID: ${this.itemId}. Security will log it and notify the owner directly!`);
        });
    }
};
