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
            
            <div class="settings-container">
                
                <!-- Preferences Card -->
                <div class="card settings-card">
                    <div class="settings-card-header">
                        <h3>Display Preferences</h3>
                    </div>
                    
                    <div class="settings-row">
                        <div class="settings-info">
                            <strong>Dark Mode</strong>
                            <span>Toggle dark mode theme for the application (Coming soon)</span>
                        </div>
                        <div class="settings-action">
                            <label class="toggle-switch">
                                <input type="checkbox" disabled>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Notifications Card -->
                <div class="card settings-card">
                    <div class="settings-card-header">
                        <h3>Notifications</h3>
                    </div>
                    
                    <div class="settings-row">
                        <div class="settings-info">
                            <strong>Email Alerts</strong>
                            <span>Receive email notifications for item matches and claim updates.</span>
                        </div>
                        <div class="settings-action">
                            <label class="toggle-switch">
                                <input type="checkbox" checked id="setting-email-alerts">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-row">
                        <div class="settings-info">
                            <strong>Push Notifications</strong>
                            <span>Show desktop alerts when you have the app open.</span>
                        </div>
                        <div class="settings-action">
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-push-alerts">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Account Settings Card -->
                <div class="card settings-card">
                    <div class="settings-card-header">
                        <h3>Account Actions</h3>
                    </div>
                    
                    <div class="settings-row">
                        <div class="settings-info">
                            <strong>Data Export</strong>
                            <span>Download a copy of your reported items and claims history.</span>
                        </div>
                        <div class="settings-action">
                            <button class="btn btn-outline" onclick="alert('Data export feature is currently in development.')">
                                <i class="fa-solid fa-download"></i> Export Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .settings-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 32px;
                    max-width: 1000px;
                    width: 100%;
                    margin-top: 32px;
                }
                
                .settings-card {
                    padding: 0 !important;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .settings-card-header {
                    padding: 24px 32px 16px 32px;
                    border-bottom: 1px solid var(--color-surface-container);
                    background-color: #ffffff;
                }
                
                .settings-card-header h3 {
                    font-family: 'Outfit', sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    margin: 0;
                }
                
                .settings-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 24px 32px;
                    border-bottom: 1px solid var(--color-surface-container);
                    gap: 32px;
                    transition: background-color 0.2s ease;
                }
                
                .settings-row:hover {
                    background-color: var(--color-surface-low);
                }
                
                .settings-row:last-child {
                    border-bottom: none;
                }
                
                .settings-info {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }
                
                .settings-info strong {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--color-on-surface);
                    line-height: 1.3;
                }
                
                .settings-info span {
                    font-size: 13px;
                    color: var(--color-outline);
                    line-height: 1.5;
                }
                
                .settings-action {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    min-width: 80px;
                }
                
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
                    background-color: var(--color-outline-variant);
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
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .settings-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                        padding: 20px;
                    }
                    
                    .settings-card-header {
                        padding: 20px;
                    }
                    
                    .settings-action {
                        width: 100%;
                        justify-content: flex-start;
                    }
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
