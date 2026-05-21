import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate } from "../utils/helpers.js";

export default {
    activeTab: "lost", // 'lost', 'found', 'claims'

    async render() {
        const user = db.session ? db.session.profile : null;
        if (!user) {
            return `
                <div class="card text-center" style="padding: 48px; min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-user-lock" style="font-size: 48px; margin-bottom: 16px; color: var(--color-primary);"></i>
                    <h3>Authentication Required</h3>
                    <p>Please sign in to view your reports, claims, and account status.</p>
                    <a href="#login" class="btn btn-primary mt-3">Sign In</a>
                </div>
            `;
        }

        // Fetch fresh listings and claims reported by user
        const items = await db.getItems();
        const myLost = items.filter(i => i.reported_by === user.id && i.type === "lost");
        const myFound = items.filter(i => i.reported_by === user.id && i.type === "found");
        const myClaims = await db.getClaims({ user_id: user.id });

        // Retrieve pre-registered assets (Feature 34)
        const registeredAssets = await db.getRegisteredAssets();

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

        // Render asset list HTML
        let assetsListHTML = "";
        if (registeredAssets.length === 0) {
            assetsListHTML = `
                <div style="font-size: 11px; color: var(--color-outline); text-align: center; padding: 16px; border: 1px dashed var(--color-surface-container); border-radius: var(--rounded-sm); background: var(--color-surface-low); line-height: 15px;">
                    <i class="fa-solid fa-laptop-medical" style="font-size: 18px; display: block; margin-bottom: 6px; color: var(--color-outline-variant);"></i>
                    <span>No pre-registered devices yet. Secure your serial numbers to verify claims instantly!</span>
                </div>
            `;
        } else {
            assetsListHTML = registeredAssets.map(asset => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--color-surface-low); border: 1px solid var(--color-surface-container); border-radius: var(--rounded-sm); padding: 10px 12px; position: relative;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 16px; color: var(--color-primary); width: 20px; text-align: center;">
                            <i class="${asset.name.toLowerCase().includes('phone') ? 'fa-solid fa-mobile-screen-button' : (asset.name.toLowerCase().includes('watch') ? 'fa-solid fa-clock' : 'fa-solid fa-laptop')}"></i>
                        </div>
                        <div>
                            <strong style="font-size: 12px; color: var(--color-on-surface); display: block; line-height: 14px;">${asset.name}</strong>
                            <span style="font-size: 10px; font-family: monospace; color: var(--color-outline); text-transform: uppercase;">S/N: ${asset.serial}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-delete-asset" data-id="${asset.id}" style="border: none; background: transparent; color: var(--color-outline); cursor: pointer; padding: 4px; transition: color 0.2s;" title="Delete Asset">
                        <i class="fa-solid fa-trash-can" style="font-size: 12px;"></i>
                    </button>
                </div>
            `).join("");
        }

        const lockerPanelHTML = `
            <div class="card" style="padding: 24px; border-top: 4px solid var(--color-status-pending);">
                <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-shield-check" style="color: var(--color-status-pending);"></i>
                    <span>Asset Serials Locker (Feature 34)</span>
                </h3>
                <p style="font-size: 11px; color: var(--color-outline); margin-bottom: 16px; line-height: 14px;">Pre-register your electronic devices to prevent false ownership claims and expedite retrieval.</p>
                
                <form id="form-register-asset" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="asset-name" style="font-size: 11px;">Device Name</label>
                        <input type="text" id="asset-name" class="form-input" required placeholder="e.g. MacBook Pro 16" style="padding: 8px 12px; font-size: 13px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="asset-serial" style="font-size: 11px;">Serial Number (Unique Keys)</label>
                        <input type="text" id="asset-serial" class="form-input" required placeholder="e.g. C02DX123GFL4" style="padding: 8px 12px; font-size: 13px; font-family: monospace;">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" style="padding: 9px; font-size: 12px; font-weight: 700; background-color: var(--color-status-pending); border-color: var(--color-status-pending);">
                        <i class="fa-solid fa-plus-circle"></i> Secure Device Serials
                    </button>
                </form>

                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; padding-right: 2px;">
                    <span style="font-size: 11px; font-weight: 800; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; border-bottom: 1px solid var(--color-surface-container); padding-bottom: 4px;">My Registered Assets</span>
                    ${assetsListHTML}
                </div>
            </div>
        `;

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Header -->
                <div>
                    <h2 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">My Reports & Profile</h2>
                    <p style="font-size: 14px; color: var(--color-outline); margin-top: 4px;">Manage your listings, track ownership claim updates, and keep your contact details updated.</p>
                </div>

                <!-- Split Layout -->
                <div class="browse-layout" style="display: flex; flex-wrap: wrap; gap: 32px; align-items: start;">
                    
                    <!-- Left Column: User Card & Form -->
                    <div style="display: flex; flex-direction: column; gap: 24px; width: 340px; max-width: 100%; min-width: 0; flex-shrink: 0;">
                        
                        <!-- Profile Card -->
                        <div class="card" style="padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: var(--color-primary-container); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; overflow: hidden; border: 4px solid var(--color-surface-container);">
                                ${user.avatar_url ? `<img src="${user.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : user.name[0]}
                            </div>
                            
                            <div>
                                <h3 style="font-size: 18px; font-weight: 700; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${user.name}</h3>
                                <p style="font-size: 12px; color: var(--color-outline); font-weight: bold; text-transform: uppercase; margin-top: 4px;">${user.role.toUpperCase()} ACCOUNT</p>
                            </div>

                            <div style="width: 100%; border-top: 1px solid var(--color-surface-container); padding-top: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 13px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--color-outline);">Class / Dept:</span>
                                    <span style="font-weight: 600; color: var(--color-on-surface);">${user.major_class || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--color-outline);">Phone:</span>
                                    <span style="font-weight: 600; color: var(--color-on-surface);">${user.phone || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--color-outline);">Email:</span>
                                    <span style="font-weight: 600; color: var(--color-on-surface); word-break: break-all;">${user.email}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Update Details Card -->
                        <div class="card" style="padding: 24px;">
                            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-user-gear" style="color: var(--color-primary);"></i>
                                <span>Edit Profile</span>
                            </h3>
                            <form id="form-update-profile" style="display: flex; flex-direction: column; gap: 14px;">
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label" for="edit-profile-name">Full Name</label>
                                    <input type="text" id="edit-profile-name" class="form-input" required value="${user.name}">
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label" for="edit-profile-phone">Phone Number</label>
                                    <input type="tel" id="edit-profile-phone" class="form-input" required value="${user.phone || ''}" placeholder="(555) 123-4567">
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label" for="edit-profile-major">Major / Division</label>
                                    <input type="text" id="edit-profile-major" class="form-input" value="${user.major_class || ''}" placeholder="e.g. Physics '26">
                                </div>
                                <button type="submit" class="btn btn-primary btn-block" style="padding: 10px; margin-top: 6px;">
                                    <i class="fa-solid fa-circle-check"></i> Save Changes
                                </button>
                            </form>
                        </div>

                        <!-- Asset Serials Locker Panel (Feature 34) -->
                        ${lockerPanelHTML}

                    </div>

                    <!-- Right Column: Tabs Panel -->
                    <div class="card" style="padding: 0; overflow: hidden; min-height: 480px; display: flex; flex-direction: column; flex: 1; min-width: 0;">
                        
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

        // Form Submit Profile Updates
        const formUpdate = document.getElementById("form-update-profile");
        if (formUpdate) {
            formUpdate.addEventListener("submit", async (e) => {
                e.preventDefault();
                
                const name = document.getElementById("edit-profile-name").value.trim();
                const phone = document.getElementById("edit-profile-phone").value.trim();
                const major = document.getElementById("edit-profile-major").value.trim();

                if (!name) {
                    notify.showToast("Full Name is required.", "error");
                    return;
                }

                if (!major) {
                    notify.showToast("Major / Division is required.", "error");
                    return;
                }

                if (!phone) {
                    notify.showToast("Phone Number is required.", "error");
                    return;
                }

                const phoneRegex = /^\+?[\d\s\-()]{7,15}$/;
                if (!phoneRegex.test(phone)) {
                    notify.showToast("Invalid phone number format. Please check and try again.", "error");
                    return;
                }

                app.showLoader();
                try {
                    await db.updateProfile(name, phone, major);
                    notify.showToast("Profile details updated successfully!", "success");
                    app.onUserLogin(); // update header summaries
                    app.renderView();
                } catch (err) {
                    notify.showToast("Failed to update profile: " + err.message, "error");
                } finally {
                    app.hideLoader();
                }
            });
        }

        // --- ASSET PRE-REGISTRATION SUBMIT (Feature 34) ---
        const formAsset = document.getElementById("form-register-asset");
        if (formAsset) {
            formAsset.addEventListener("submit", async (e) => {
                e.preventDefault();
                const name = document.getElementById("asset-name").value;
                const serial = document.getElementById("asset-serial").value;

                app.showLoader();
                try {
                    await db.preRegisterAsset(name, serial);
                    notify.showToast(`Successfully secured serial keys for ${name}!`, "success");
                    app.renderView();
                } catch (err) {
                    notify.showToast(err.message || "Failed to register asset.", "error");
                } finally {
                    app.hideLoader();
                }
            });
        }

        // --- ASSET DELETION TRIGGER (Feature 34) ---
        const deleteAssetBtns = document.querySelectorAll(".btn-delete-asset");
        deleteAssetBtns.forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("Are you sure you want to remove this pre-registered device asset?")) {
                    app.showLoader();
                    try {
                        await db.deleteRegisteredAsset(id);
                        notify.showToast("Registered device asset removed successfully.", "success");
                        app.renderView();
                    } catch (err) {
                        notify.showToast("Failed to remove asset: " + err.message, "error");
                    } finally {
                        app.hideLoader();
                    }
                }
            });
        });
    }
};
