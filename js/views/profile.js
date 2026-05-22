import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";

export default {
    async render() {
        const user = db.session ? db.session.profile : null;
        if (!user) {
            return `
                <div class="card text-center" style="padding: 48px; min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 800px; margin: 0 auto;">
                    <i class="fa-solid fa-user-lock" style="font-size: 48px; margin-bottom: 16px; color: var(--color-primary);"></i>
                    <h3>Authentication Required</h3>
                    <p>Please sign in to view your profile and account status.</p>
                    <a href="#login" class="btn btn-primary mt-3">Sign In</a>
                </div>
            `;
        }

        // Retrieve pre-registered assets (Feature 34)
        const registeredAssets = await db.getRegisteredAssets();

        // Render asset list HTML
        let assetsListHTML = "";
        if (registeredAssets.length === 0) {
            assetsListHTML = `
                <div style="font-size: 13px; color: var(--color-outline); text-align: center; padding: 24px; border: 1px dashed var(--color-surface-container); border-radius: var(--rounded-md); background: var(--color-surface-low); line-height: 1.5;">
                    <i class="fa-solid fa-laptop-medical" style="font-size: 24px; display: block; margin-bottom: 12px; color: var(--color-outline-variant);"></i>
                    <span>No pre-registered devices yet. Secure your serial numbers to verify claims instantly!</span>
                </div>
            `;
        } else {
            assetsListHTML = registeredAssets.map(asset => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--color-surface-low); border: 1px solid var(--color-surface-container); border-radius: var(--rounded-md); padding: 16px; position: relative; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 20px; color: var(--color-primary); width: 24px; text-align: center;">
                            <i class="${asset.name.toLowerCase().includes('phone') ? 'fa-solid fa-mobile-screen-button' : (asset.name.toLowerCase().includes('watch') ? 'fa-solid fa-clock' : 'fa-solid fa-laptop')}"></i>
                        </div>
                        <div>
                            <strong style="font-size: 14px; color: var(--color-on-surface); display: block; line-height: 1.2;">${asset.name}</strong>
                            <span style="font-size: 12px; font-family: monospace; color: var(--color-outline); text-transform: uppercase;">S/N: ${asset.serial}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-delete-asset" data-id="${asset.id}" style="border: none; background: transparent; color: var(--color-outline); cursor: pointer; padding: 8px; transition: color 0.2s;" title="Delete Asset">
                        <i class="fa-solid fa-trash-can" style="font-size: 16px;"></i>
                    </button>
                </div>
            `).join("");
        }

        const lockerPanelHTML = `
            <div class="card" style="padding: 32px; border-top: 4px solid var(--color-status-pending);">
                <h3 style="font-size: 18px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 8px; display: flex; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-shield-check" style="color: var(--color-status-pending);"></i>
                    <span>Asset Serials Locker</span>
                </h3>
                <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 24px; line-height: 1.5;">Pre-register your electronic devices to prevent false ownership claims and expedite retrieval if lost.</p>
                
                <form id="form-register-asset" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="asset-name" style="font-size: 13px;">Device Name</label>
                        <input type="text" id="asset-name" class="form-input" required placeholder="e.g. MacBook Pro 16" style="padding: 10px 14px; font-size: 14px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="asset-serial" style="font-size: 13px;">Serial Number (Unique Keys)</label>
                        <input type="text" id="asset-serial" class="form-input" required placeholder="e.g. C02DX123GFL4" style="padding: 10px 14px; font-size: 14px; font-family: monospace;">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; font-size: 14px; font-weight: 700; background-color: var(--color-status-pending); border-color: var(--color-status-pending); margin-top: 8px;">
                        <i class="fa-solid fa-plus-circle"></i> Secure Device Serials
                    </button>
                </form>

                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 12px; font-weight: 800; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px; border-bottom: 1px solid var(--color-surface-container); padding-bottom: 8px;">My Registered Assets</span>
                    <div style="max-height: 300px; overflow-y: auto; padding-right: 4px;">
                        ${assetsListHTML}
                    </div>
                </div>
            </div>
        `;

        return `
            <div class="view-header">
                <div class="view-title">
                    <h2><i class="fa-regular fa-user"></i> My Profile</h2>
                    <p>Manage your account details and registered assets.</p>
                </div>
            </div>

            <div class="profile-container" style="display: flex; gap: 32px; max-width: 1000px; width: 100%; margin-top: 32px; flex-wrap: wrap;">
                
                <!-- Left Column: User Card -->
                <div style="display: flex; flex-direction: column; gap: 32px; flex: 1; min-width: 300px;">
                    <!-- Profile Card -->
                    <div class="card" style="padding: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <div style="width: 100px; height: 100px; border-radius: 50%; background-color: var(--color-primary-container); color: white; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 700; overflow: hidden; border: 4px solid var(--color-surface-container);">
                            ${user.avatar_url ? `<img src="${user.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : user.name[0]}
                        </div>
                        
                        <div>
                            <h3 style="font-size: 22px; font-weight: 700; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">${user.name}</h3>
                            <p style="font-size: 13px; color: var(--color-outline); font-weight: bold; text-transform: uppercase; margin-top: 4px;">${user.role.toUpperCase()} ACCOUNT</p>
                        </div>

                        <div style="width: 100%; border-top: 1px solid var(--color-surface-container); padding-top: 24px; display: flex; flex-direction: column; gap: 12px; text-align: left; font-size: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--color-outline);">Class / Dept:</span>
                                <span style="font-weight: 600; color: var(--color-on-surface);">${user.major_class || 'N/A'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--color-outline);">Phone:</span>
                                <span style="font-weight: 600; color: var(--color-on-surface);">${user.phone || 'N/A'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--color-outline);">Email:</span>
                                <span style="font-weight: 600; color: var(--color-on-surface); word-break: break-all; max-width: 60%; text-align: right;">${user.email}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Update Details Card -->
                    <div class="card" style="padding: 32px;">
                        <h3 style="font-size: 18px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                            <i class="fa-solid fa-user-gear" style="color: var(--color-primary);"></i>
                            <span>Edit Profile</span>
                        </h3>
                        <form id="form-update-profile" style="display: flex; flex-direction: column; gap: 16px;">
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
                            <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 8px;">
                                <i class="fa-solid fa-circle-check"></i> Save Changes
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Right Column: Asset Locker -->
                <div style="flex: 1.2; min-width: 320px;">
                    ${lockerPanelHTML}
                </div>
            </div>
        `;
    },

    attachEvents(app) {
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
                    notify.showToast(\`Successfully secured serial keys for \${name}!\`, "success");
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
