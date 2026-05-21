/* ==========================================================
   FINDIT: ITEM DETAILS SPECIFICATION VIEW & RECOVERY TIMELINE
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

        // --- LIFECYCLE TIMELINE LOGIC (Feature 5) ---
        let activeStep = 1; // 1: Reported, 2: Claim Under Review, 3: Approved & Handoff, 4: Returned & Closed
        
        if (item.status === "claim_pending") {
            activeStep = 2;
        } else if (item.status === "returned") {
            activeStep = 4;
        } else if (item.status === "found") {
            activeStep = 1;
        }

        const steps = [
            { label: "Reported", desc: "Item logged on portal", icon: "fa-solid fa-file-circle-plus" },
            { label: "Claim Under Review", desc: "Verifying claimant proof", icon: "fa-solid fa-magnifying-glass-chart" },
            { label: "Approved & Handoff", desc: "Receipt generated", icon: "fa-solid fa-receipt" },
            { label: "Returned & Closed", desc: "Item back with owner", icon: "fa-solid fa-box-open" }
        ];

        const stepperHTML = `
            <div class="card" style="padding: 24px; margin-bottom: 8px;">
                <h3 style="font-size: 13px; font-weight: 800; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-timeline" style="color: var(--color-primary);"></i>
                    <span>Interactive Recovery Lifecycle Timeline</span>
                </h3>
                <div style="display: flex; align-items: flex-start; justify-content: space-between; position: relative; flex-wrap: nowrap; overflow-x: auto; padding: 10px 0;">
                    <!-- Background connecting line -->
                    <div style="position: absolute; top: 28px; left: 12.5%; right: 12.5%; height: 4px; background-color: var(--color-surface-container); z-index: 1; border-radius: 2px;">
                        <div style="width: ${((activeStep - 1) / 3) * 100}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-container)); transition: width 0.5s ease-in-out; border-radius: 2px;"></div>
                    </div>
                    
                    ${steps.map((step, idx) => {
                        const stepNum = idx + 1;
                        const isCompleted = stepNum < activeStep;
                        const isActive = stepNum === activeStep;
                        
                        let iconColor = "var(--color-outline)";
                        let circleBg = "var(--color-surface-high)";
                        let circleBorder = "2px solid var(--color-surface-container)";
                        let labelColor = "var(--color-outline)";
                        let textWeight = "500";
                        let glowStyle = "";

                        if (isCompleted) {
                            iconColor = "#ffffff";
                            circleBg = "var(--color-primary)";
                            circleBorder = "2px solid var(--color-primary)";
                            labelColor = "var(--color-primary)";
                            textWeight = "700";
                        } else if (isActive) {
                            iconColor = "#ffffff";
                            circleBg = "var(--color-on-surface)";
                            circleBorder = "2px solid var(--color-on-surface)";
                            labelColor = "var(--color-on-surface)";
                            textWeight = "800";
                            glowStyle = "box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2);";
                        }

                        return `
                            <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; min-width: 110px; z-index: 2;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${circleBg}; border: ${circleBorder}; display: flex; align-items: center; justify-content: center; font-size: 15px; color: ${iconColor}; ${glowStyle} transition: all 0.3s ease;">
                                    <i class="${step.icon}"></i>
                                </div>
                                <span style="font-size: 13px; font-weight: ${textWeight}; color: ${labelColor}; margin-top: 12px; display: block; font-family: 'Outfit', sans-serif;">${step.label}</span>
                                <span style="font-size: 10px; color: var(--color-outline); margin-top: 4px; display: block; max-width: 120px; line-height: 14px;">${step.desc}</span>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;

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
                    <div style="font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--color-on-surface);">Item Restored Successfully</div>
                    <div style="font-size: 12px; margin-top: 2px;">This item has been successfully claimed and returned to its rightful owner.</div>
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
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Navigation breadcrumb -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <a href="#browse" class="btn-link" style="padding: 0; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-arrow-left"></i> Back to Catalog
                    </a>
                </div>

                <!-- Recovery stepper timeline panel -->
                ${stepperHTML}

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
                    notify.showToast("Report deleted successfully.", "success");
                    app.navigateTo("browse");
                } catch (err) {
                    notify.showToast("Failed to delete item: " + err.message, "error");
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
