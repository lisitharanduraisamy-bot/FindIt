/* ==========================================================
   FINDIT: APPLICATION SETTINGS VIEW
   ========================================================== */

import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";

export default {
    async render() {
        return `
            <div class="view-header">
                <div class="view-title">
                    <h2><i class="fa-solid fa-sliders"></i> Application Settings</h2>
                    <p>Manage your preferences, notifications, and account options.</p>
                </div>
            </div>
            
            <div class="content-body" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 800px; margin: 0 auto;">
                
                <!-- Preferences Card -->
                <div class="card">
                    <h3 style="margin-bottom: 16px; font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--color-on-surface); border-bottom: 1px solid var(--color-surface-container); padding-bottom: 12px;">Display Preferences</h3>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0;">
                        <div>
                            <strong style="font-size: 14px; display: block; color: var(--color-on-surface);">Dark Mode</strong>
                            <span style="font-size: 12px; color: var(--color-outline);">Toggle dark mode theme for the application (Coming soon)</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" disabled>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Notifications Card -->
                <div class="card">
                    <h3 style="margin-bottom: 16px; font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--color-on-surface); border-bottom: 1px solid var(--color-surface-container); padding-bottom: 12px;">Notifications</h3>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-surface-container);">
                        <div>
                            <strong style="font-size: 14px; display: block; color: var(--color-on-surface);">Email Alerts</strong>
                            <span style="font-size: 12px; color: var(--color-outline);">Receive email notifications for item matches and claim updates.</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked id="setting-email-alerts">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0;">
                        <div>
                            <strong style="font-size: 14px; display: block; color: var(--color-on-surface);">Push Notifications</strong>
                            <span style="font-size: 12px; color: var(--color-outline);">Show desktop alerts when you have the app open.</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-push-alerts">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Account Settings Card -->
                <div class="card">
                    <h3 style="margin-bottom: 16px; font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--color-on-surface); border-bottom: 1px solid var(--color-surface-container); padding-bottom: 12px;">Account Actions</h3>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0;">
                        <div>
                            <strong style="font-size: 14px; display: block; color: var(--color-on-surface);">Data Export</strong>
                            <span style="font-size: 12px; color: var(--color-outline);">Download a copy of your reported items and claims history.</span>
                        </div>
                        <button class="btn btn-outline" onclick="alert('Data export feature is currently in development.')">
                            <i class="fa-solid fa-download"></i> Export Data
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                /* Simple CSS toggle switch for settings UI */
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--color-surface-container);
                    transition: .4s;
                    border-radius: 34px;
                }
                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .2s;
                    border-radius: 50%;
                }
                input:checked + .toggle-slider {
                    background-color: var(--color-primary);
                }
                input:checked + .toggle-slider:before {
                    transform: translateX(20px);
                }
                input:disabled + .toggle-slider {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            </style>
        `;
    },

    attachEvents(app) {
        // Handle mock interactions for settings UI
        const emailToggle = document.getElementById("setting-email-alerts");
        const pushToggle = document.getElementById("setting-push-alerts");
        
        if (emailToggle) {
            emailToggle.addEventListener("change", (e) => {
                const state = e.target.checked ? "enabled" : "disabled";
                notify.showToast(`Email alerts have been ${state}.`, "info");
            });
        }
        
        if (pushToggle) {
            pushToggle.addEventListener("change", (e) => {
                const state = e.target.checked ? "enabled" : "disabled";
                notify.showToast(`Push notifications have been ${state}.`, "info");
            });
        }
    }
};
