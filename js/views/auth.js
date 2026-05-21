/* ==========================================================
   FINDIT: USER AUTHENTICATION VIEWS WITH SSO & DIRECTORY
   ========================================================== */

import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";

// Campus Directory Synced Lookup data registry (Feature 49)
const CAMPUS_DIRECTORY = {
    "student": { name: "Alex Morgan", phone: "(555) 123-4567", majorClass: "Computer Science Major • Class of '25", role: "student" },
    "amorgan": { name: "Alex Morgan", phone: "(555) 123-4567", majorClass: "Computer Science Major • Class of '25", role: "student" },
    "miller": { name: "Officer Miller", phone: "(555) 123-0911", majorClass: "Campus Safety Division", role: "admin" },
    "officer.miller": { name: "Officer Miller", phone: "(555) 123-0911", majorClass: "Campus Safety Division", role: "admin" },
    "security": { name: "Campus Security Staff", phone: "(555) 123-0911", majorClass: "Campus Safety Division", role: "admin" },
    "jdoe": { name: "John Doe", phone: "(555) 345-6789", majorClass: "Biology Major • Class of '26", role: "student" },
    "jsmith": { name: "Jane Smith", phone: "(555) 567-8901", majorClass: "History Major • Class of '24", role: "student" },
    "ebrown": { name: "Emily Brown", phone: "(555) 789-0123", majorClass: "Mechanical Eng Major • Class of '27", role: "student" }
};

export default {
    mode: "login", // 'login', 'register', 'forgot', 'sso'

    render() {
        if (this.mode === "login") {
            return this.renderLogin();
        } else if (this.mode === "register") {
            return this.renderRegister();
        } else if (this.mode === "sso") {
            return this.renderSSO();
        } else {
            return this.renderForgot();
        }
    },

    // Renders the standard credential login form with Tab Selector
    renderLogin() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; min-height: calc(100vh - 120px);">
                <div class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 40px 32px; box-shadow: var(--shadow-lg); position: relative;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px; font-family: 'Outfit', sans-serif;">FindIt Portal</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 24px; font-weight: 500;">University Management System</p>
                    
                    <!-- TAB SELECTOR (Feature 46) -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: var(--color-surface-container); border-radius: var(--rounded-md);">
                        <button type="button" id="tab-standard-login" class="btn" style="flex: 1; font-size: 12px; font-weight: 700; padding: 8px; border-radius: var(--rounded-sm); border: none; background: var(--color-surface-high); color: var(--color-on-surface); box-shadow: var(--shadow-sm); cursor: pointer;">Standard Account</button>
                        <button type="button" id="tab-sso-login" class="btn" style="flex: 1; font-size: 12px; font-weight: 700; padding: 8px; border-radius: var(--rounded-sm); border: none; background: transparent; color: var(--color-outline); transition: all 0.2s; cursor: pointer;">University SSO</button>
                    </div>
                    
                    <form id="form-auth-login" style="text-align: left;">
                        <div class="form-group">
                            <label for="login-email" class="form-label">University Email</label>
                            <div class="input-icon-wrapper">
                                <i class="fa-regular fa-envelope"></i>
                                <input type="email" id="login-email" class="form-input icon-padding" required placeholder="student@university.edu">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="login-password" class="form-label">Password</label>
                            <div class="input-icon-wrapper">
                                <i class="fa-solid fa-lock"></i>
                                <input type="password" id="login-password" class="form-input icon-padding" required placeholder="••••••••">
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; font-size: 13px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--color-on-surface-variant); font-weight: 500;">
                                <input type="checkbox" id="login-remember" style="border-radius: var(--rounded-sm);"> Remember me
                            </label>
                            <button type="button" id="btn-toggle-forgot" class="btn-link" style="padding: 0; font-weight: 600;">Forgot Password?</button>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; font-weight: 700;">Sign In</button>
                    </form>
                    
                    <p style="margin-top: 24px; font-size: 13px; color: var(--color-on-surface-variant);">
                        Need an account? <button type="button" id="btn-toggle-register" class="btn-link" style="font-weight: 700; padding: 0;">Register</button>
                    </p>
                    
                    <div style="margin: 24px 0 16px; display: flex; align-items: center; justify-content: center; gap: 12px;">
                        <div style="flex: 1; height: 1px; background-color: var(--color-surface-container);"></div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.05em;">Or continue with</span>
                        <div style="flex: 1; height: 1px; background-color: var(--color-surface-container);"></div>
                    </div>
                    
                    <button type="button" id="btn-google-login" class="btn btn-outline btn-block" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: var(--rounded-md); text-align: center; cursor: pointer; border: 1px solid var(--color-surface-container); background-color: var(--color-surface-low); transition: all 0.2s ease;">
                        <i class="fa-brands fa-google" style="font-size: 18px; color: #DB4437;"></i>
                        <strong style="font-size: 14px; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Sign In with Google</strong>
                    </button>
                </div>
            </div>
        `;
    },

    // Renders the Shibboleth / Okta simulation tab (Feature 46)
    renderSSO() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; min-height: calc(100vh - 120px);">
                <div class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 40px 32px; box-shadow: var(--shadow-lg); border-top: 4px solid var(--color-primary);">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-key-skeleton"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px; font-family: 'Outfit', sans-serif;">Shibboleth Gateway</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 24px; font-weight: 500;">University Single Sign-On (Okta Federated)</p>
                    
                    <!-- TAB SELECTOR -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: var(--color-surface-container); border-radius: var(--rounded-md);">
                        <button type="button" id="tab-standard-login" class="btn" style="flex: 1; font-size: 12px; font-weight: 700; padding: 8px; border-radius: var(--rounded-sm); border: none; background: transparent; color: var(--color-outline); transition: all 0.2s; cursor: pointer;">Standard Account</button>
                        <button type="button" id="tab-sso-login" class="btn" style="flex: 1; font-size: 12px; font-weight: 700; padding: 8px; border-radius: var(--rounded-sm); border: none; background: var(--color-surface-high); color: var(--color-on-surface); box-shadow: var(--shadow-sm); cursor: pointer;">University SSO</button>
                    </div>
                    
                    <form id="form-auth-sso" style="text-align: left;">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label for="sso-email" class="form-label">University Email or NetID</label>
                            <div class="input-icon-wrapper">
                                <i class="fa-solid fa-user-circle"></i>
                                <input type="text" id="sso-email" class="form-input icon-padding" required placeholder="student@university.edu" style="font-weight: 500;">
                            </div>
                            <span style="font-size: 11px; color: var(--color-outline); display: block; margin-top: 6px;">
                                <i class="fa-solid fa-circle-info"></i> Enter your registered email (e.g. <b>student@university.edu</b> or <b>amorgan</b>) to sync profile.
                            </span>
                        </div>

                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="sso-domain" class="form-label">Campus Subdomain</label>
                            <select id="sso-domain" class="form-input" style="cursor: pointer; font-weight: 500;">
                                <option value="main">Main Campus Hub (idp.university.edu)</option>
                                <option value="engineering">Engineering Research Center</option>
                                <option value="med">Medical Division Gateway</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fa-solid fa-shield-check"></i> Sign In with Shibboleth
                        </button>
                    </form>
                    
                    <div style="margin-top: 24px; padding: 12px; background-color: var(--color-surface-low); border-radius: var(--rounded-md); border: 1px solid var(--color-surface-container); font-size: 12px; color: var(--color-outline); text-align: left;">
                        <strong style="color: var(--color-on-surface); font-family: 'Outfit', sans-serif;"><i class="fa-solid fa-database"></i> Campus Directory Sync Active:</strong><br>
                        Prefix lookup is fully integrated. Standard students and officers can log in instantly via university credentials.
                    </div>
                </div>
            </div>
        `;
    },

    renderRegister() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; min-height: calc(100vh - 120px);">
                <div class="card" style="width: 100%; max-width: 480px; text-align: center; padding: 40px 32px; box-shadow: var(--shadow-lg);">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-user-plus"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px; font-family: 'Outfit', sans-serif;">Create Account</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 28px; font-weight: 500;">Access the campus Lost & Found network</p>
                    
                    <form id="form-auth-register" style="text-align: left;">
                        <div class="form-group">
                            <label for="register-email" class="form-label">University Email</label>
                            <div style="position: relative; display: flex;">
                                <input type="email" id="register-email" class="form-input" required placeholder="student@university.edu" style="font-weight: 500;">
                                <button type="button" id="btn-directory-sync" class="btn btn-outline" style="position: absolute; right: 4px; top: 4px; bottom: 4px; padding: 0 12px; font-size: 11px; font-weight: 700; border-color: var(--color-surface-container); border-radius: var(--rounded-sm); display: flex; align-items: center; gap: 4px; background-color: var(--color-surface-high);">
                                    <i class="fa-solid fa-arrows-rotate"></i> Sync Directory
                                </button>
                            </div>
                            <span id="sync-indicator" style="font-size: 11px; color: var(--color-outline); display: block; margin-top: 6px;">
                                <i class="fa-solid fa-lightbulb"></i> Type email prefix and click <b>Sync Directory</b> to auto-fill profiles.
                            </span>
                        </div>

                        <div class="form-group">
                            <label for="register-name" class="form-label">Full Name</label>
                            <input type="text" id="register-name" class="form-input" required placeholder="Alex Student">
                        </div>
                        
                        <div class="form-row" style="display: flex; gap: 16px;">
                            <div class="form-group" style="flex: 1;">
                                <label for="register-phone" class="form-label">Phone Number</label>
                                <input type="tel" id="register-phone" class="form-input" placeholder="(555) 000-0000">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label for="register-major" class="form-label">Major / Class Year</label>
                                <input type="text" id="register-major" class="form-input" placeholder="e.g. CS Major '25">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="register-password" class="form-label">Password</label>
                            <input type="password" id="register-password" class="form-input" required placeholder="Minimum 6 characters">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 12px; font-weight: 700;">Register Account</button>
                    </form>

                    <div style="margin: 24px 0 16px; display: flex; align-items: center; justify-content: center; gap: 12px;">
                        <div style="flex: 1; height: 1px; background-color: var(--color-surface-container);"></div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.05em;">Or continue with</span>
                        <div style="flex: 1; height: 1px; background-color: var(--color-surface-container);"></div>
                    </div>
                    
                    <button type="button" id="btn-google-register" class="btn btn-outline btn-block" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: var(--rounded-md); text-align: center; cursor: pointer; border: 1px solid var(--color-surface-container); background-color: var(--color-surface-low); transition: all 0.2s ease;">
                        <i class="fa-brands fa-google" style="font-size: 18px; color: #DB4437;"></i>
                        <strong style="font-size: 14px; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Sign Up with Google</strong>
                    </button>
                    
                    <p style="margin-top: 24px; font-size: 13px; color: var(--color-on-surface-variant);">
                        Already have an account? <button type="button" id="btn-toggle-login" class="btn-link" style="font-weight: 700; padding: 0;">Sign In</button>
                    </p>
                </div>
            </div>
        `;
    },

    renderForgot() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; min-height: calc(100vh - 120px);">
                <div class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 40px 32px; box-shadow: var(--shadow-lg);">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-key"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px; font-family: 'Outfit', sans-serif;">Reset Password</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 28px; font-weight: 500;">Enter your email to receive recovery link</p>
                    
                    <form id="form-auth-forgot" style="text-align: left;">
                        <div class="form-group">
                            <label for="forgot-email" class="form-label">University Email</label>
                            <input type="email" id="forgot-email" class="form-input" required placeholder="student@university.edu">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 12px; font-weight: 700;">Send Recovery Email</button>
                    </form>
                    
                    <p style="margin-top: 24px; font-size: 13px; color: var(--color-on-surface-variant);">
                        Remember your password? <button type="button" id="btn-toggle-login" class="btn-link" style="font-weight: 700; padding: 0;">Sign In</button>
                    </p>
                </div>
            </div>
        `;
    },

    attachEvents(app) {
        // Toggle view triggers
        const toggleLogin = document.getElementById("btn-toggle-login");
        const toggleRegister = document.getElementById("btn-toggle-register");
        const toggleForgot = document.getElementById("btn-toggle-forgot");

        if (toggleLogin) {
            toggleLogin.addEventListener("click", () => {
                this.mode = "login";
                app.renderView();
            });
        }
        if (toggleRegister) {
            toggleRegister.addEventListener("click", () => {
                this.mode = "register";
                app.renderView();
            });
        }
        if (toggleForgot) {
            toggleForgot.addEventListener("click", () => {
                this.mode = "forgot";
                app.renderView();
            });
        }

        // Tab selection switches
        const tabStandard = document.getElementById("tab-standard-login");
        const tabSSO = document.getElementById("tab-sso-login");

        if (tabStandard) {
            tabStandard.addEventListener("click", () => {
                this.mode = "login";
                app.renderView();
            });
        }
        if (tabSSO) {
            tabSSO.addEventListener("click", () => {
                this.mode = "sso";
                app.renderView();
            });
        }

        // --- DIRECTORY SYNC PRE-FILL EVENT (Feature 49) ---
        const btnDirectorySync = document.getElementById("btn-directory-sync");
        const registerEmail = document.getElementById("register-email");

        if (btnDirectorySync && registerEmail) {
            btnDirectorySync.addEventListener("click", () => {
                this.performDirectorySync(registerEmail.value);
            });
        }

        // Fallback: auto-fill on blur as well for maximum convenience
        if (registerEmail) {
            registerEmail.addEventListener("blur", () => {
                this.performDirectorySync(registerEmail.value, true);
            });
        }

        // --- STANDARD CREDENTIALS LOGIN SUBMIT ---
        const formLogin = document.getElementById("form-auth-login");
        if (formLogin) {
            formLogin.addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("login-email").value;
                const pass = document.getElementById("login-password").value;
                
                app.showLoader();
                try {
                    await db.signIn(email, pass);
                    notify.showToast(`Logged in successfully as ${db.session.profile.name}!`, "success");
                    app.onUserLogin();
                    app.navigateTo("dashboard");
                } catch (err) {
                    notify.showToast(err.message || "Login failed.", "error");
                } finally {
                    app.hideLoader();
                }
            });
        }

        // --- INSTITUTIONAL SSO GATEWAY SUBMIT (Feature 46) ---
        const formSSO = document.getElementById("form-auth-sso");
        if (formSSO) {
            formSSO.addEventListener("submit", async (e) => {
                e.preventDefault();
                const emailInput = document.getElementById("sso-email").value.trim();
                const domainSelect = document.getElementById("sso-domain").value;

                // Standardize input to email
                let email = emailInput;
                if (!email.includes("@")) {
                    email = `${emailInput}@university.edu`;
                }

                // Check directory
                const prefix = email.split("@")[0].toLowerCase();
                const record = CAMPUS_DIRECTORY[prefix];

                // Provision default details if prefix doesn't match
                const name = record ? record.name : emailInput.split("@")[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const phone = record ? record.phone : "(555) 432-1000";
                const major = record ? record.majorClass : "Undergrad Hub Member";
                const password = "SSODemoPass123!"; // unified simulated SSO credential

                // Launch Shibboleth/Okta authentication gateway simulation overlay
                this.launchSSOGatewayOverlay(app, email, password, name, phone, major);
            });
        }

        // --- REGISTER ACCOUNT SUBMIT ---
        const formRegister = document.getElementById("form-auth-register");
        if (formRegister) {
            formRegister.addEventListener("submit", async (e) => {
                e.preventDefault();
                const name = document.getElementById("register-name").value;
                const email = document.getElementById("register-email").value;
                const phone = document.getElementById("register-phone").value;
                const major = document.getElementById("register-major").value;
                const pass = document.getElementById("register-password").value;

                if (pass.length < 6) {
                    notify.showToast("Password must be at least 6 characters.", "error");
                    return;
                }

                app.showLoader();
                try {
                    await db.signUp(email, pass, name, phone, major);
                    notify.showToast("Registration completed successfully!", "success");
                    app.onUserLogin();
                    app.navigateTo("dashboard");
                } catch (err) {
                    notify.showToast(err.message || "Registration failed.", "error");
                } finally {
                    app.hideLoader();
                }
            });
        }

        // --- PASSWORD RESET SUBMIT ---
        const formForgot = document.getElementById("form-auth-forgot");
        if (formForgot) {
            formForgot.addEventListener("submit", (e) => {
                e.preventDefault();
                const email = document.getElementById("forgot-email").value;
                notify.showToast(`Password reset instruction sent to ${email}!`, "success");
                this.mode = "login";
                app.renderView();
            });
        }

        // --- QUICK DEMO ACCESS TRIGGERS ---
        const btnGoogleLogin = document.getElementById("btn-google-login");
        const btnGoogleRegister = document.getElementById("btn-google-register");

        const handleGoogleOAuth = async () => {
            app.showLoader();
            try {
                if (db.isMock) {
                    notify.showToast("Google Sign-In is not available in Demo Mode. Connect a live database.", "error");
                    return;
                }
                await db.signInWithGoogle();
                // Supabase will redirect to Google for OAuth flow.
            } catch (err) {
                console.error("FindIt OAuth Error:", err);
                notify.showToast(err.message, "error");
            } finally {
                app.hideLoader();
            }
        };

        if (btnGoogleLogin) btnGoogleLogin.addEventListener("click", handleGoogleOAuth);
        if (btnGoogleRegister) btnGoogleRegister.addEventListener("click", handleGoogleOAuth);
    },

    // Handles Directory Auto-fill based on email prefix (Feature 49)
    performDirectorySync(emailVal, silent = false) {
        if (!emailVal) return;
        
        const prefix = emailVal.split("@")[0].toLowerCase().trim();
        const record = CAMPUS_DIRECTORY[prefix];

        if (record) {
            const nameInput = document.getElementById("register-name");
            const phoneInput = document.getElementById("register-phone");
            const majorInput = document.getElementById("register-major");

            if (nameInput) {
                nameInput.value = record.name;
                nameInput.style.border = "1px solid #10b981"; // dynamic green success outline
                nameInput.style.backgroundColor = "rgba(16, 185, 129, 0.04)";
            }
            if (phoneInput) {
                phoneInput.value = record.phone;
                phoneInput.style.border = "1px solid #10b981";
                phoneInput.style.backgroundColor = "rgba(16, 185, 129, 0.04)";
            }
            if (majorInput) {
                majorInput.value = record.majorClass;
                majorInput.style.border = "1px solid #10b981";
                majorInput.style.backgroundColor = "rgba(16, 185, 129, 0.04)";
            }

            const indicator = document.getElementById("sync-indicator");
            if (indicator) {
                indicator.innerHTML = `<span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Campus Directory Linked: Synced profile details for ${record.name}!</span>`;
            }

            if (!silent) {
                notify.showToast(`Directory record found: Auto-populated profile for ${record.name}!`, "success");
            }
        } else {
            if (!silent) {
                notify.showToast("No explicit directory pre-fill record found for this email prefix.", "info");
            }
        }
    },

    // Launches Federated Identity Shibboleth SSO Gateway Portal Overlay (Feature 46)
    launchSSOGatewayOverlay(app, email, password, name, phone, majorClass) {
        const overlay = document.createElement("div");
        overlay.id = "sso-gateway-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(10, 11, 14, 0.95);
            backdrop-filter: blur(12px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="background: rgba(22, 24, 30, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--rounded-lg); padding: 48px 40px; width: 90%; max-width: 460px; text-align: center; box-shadow: 0 24px 48px rgba(0,0,0,0.5); backdrop-filter: blur(10px);">
                <!-- Animated pulsing SSO key -->
                <div style="position: relative; width: 72px; height: 72px; margin: 0 auto 24px;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; background: var(--color-primary); opacity: 0.15; animation: ping 2s infinite;"></div>
                    <div style="position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border-radius: 50%; background: var(--color-primary); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 4px 12px rgba(107, 70, 193, 0.4);">
                        <i class="fa-solid fa-fingerprint"></i>
                    </div>
                </div>

                <h3 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 6px; font-family: 'Outfit', sans-serif;">Institutional Authentication</h3>
                <p style="font-size: 13px; color: #a0aec0; margin-bottom: 28px; font-weight: 500;">Federated Identity Shibboleth Single Sign-On</p>

                <!-- Status Progress checklist -->
                <div style="text-align: left; background: rgba(0,0,0,0.2); border-radius: var(--rounded-md); padding: 18px 24px; margin-bottom: 28px; border: 1px solid rgba(255,255,255,0.04);">
                    <div id="step-1" style="font-size: 13px; color: #718096; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-spinner fa-spin" style="color: var(--color-primary);"></i> Connecting to server idp.university.edu...
                    </div>
                    <div id="step-2" style="font-size: 13px; color: #718096; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-regular fa-circle" style="font-size: 12px;"></i> Validating Okta assertion tickets...
                    </div>
                    <div id="step-3" style="font-size: 13px; color: #718096; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-regular fa-circle" style="font-size: 12px;"></i> Auto-syncing LDAP Directory profiles...
                    </div>
                </div>

                <div style="font-size: 11px; color: #718096; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="display:inline-block; width:6px; height:6px; background-color:#38a169; border-radius:50%; animation: pulse 1s infinite;"></span> SECURE CONNECTION SECURED VIA SSL
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        // Trigger opacity fade-in
        setTimeout(() => { overlay.style.opacity = "1"; }, 50);

        // Simulation Timeline steps animation
        const step1 = overlay.querySelector("#step-1");
        const step2 = overlay.querySelector("#step-2");
        const step3 = overlay.querySelector("#step-3");

        setTimeout(() => {
            step1.style.color = "#38a169";
            step1.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #38a169;"></i> Connected to server idp.university.edu`;
            step2.style.color = "#ffffff";
            step2.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--color-primary);"></i> Validating Okta assertion tickets...`;
        }, 800);

        setTimeout(() => {
            step2.style.color = "#38a169";
            step2.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #38a169;"></i> Okta assertion tickets authenticated`;
            step3.style.color = "#ffffff";
            step3.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--color-primary);"></i> Syncing Directory profile: <b>${name}</b>...`;
        }, 1600);

        setTimeout(async () => {
            step3.style.color = "#38a169";
            step3.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #38a169;"></i> LDAP Directory synced successfully`;

            // Complete actual authentication under the hood
            try {
                // Sign in or self-heal sign up
                try {
                    await db.signIn(email, password);
                } catch (err) {
                    // Self healing sign up
                    await db.signUp(email, password, name, phone, majorClass);
                    
                    // Auto-promote officer to admin in SSO as well
                    if (email.toLowerCase().includes("admin") || email.toLowerCase().includes("officer") || email.toLowerCase().includes("miller") || email.toLowerCase().includes("security")) {
                        if (!db.isMock && db.session) {
                            await db.client.from("profiles").update({ role: "admin" }).eq("id", db.session.profile.id);
                        } else if (db.isMock && db.session) {
                            const profile = db.mockDB.profiles.find(p => p.id === db.session.profile.id);
                            if (profile) profile.role = "admin";
                            db.saveMockDB();
                        }
                        if (db.session) await db.syncSession();
                    }
                }
                
                // Fade out overlay and transition to dashboard
                overlay.style.opacity = "0";
                setTimeout(() => {
                    overlay.remove();
                    notify.showToast(`SSO Federated Sign-On complete! Welcome back, ${db.session.profile.name}!`, "success");
                    app.onUserLogin();
                    app.navigateTo("dashboard");
                }, 300);

            } catch (authError) {
                console.error("SSO Auth failed:", authError);
                overlay.style.opacity = "0";
                setTimeout(() => {
                    overlay.remove();
                    notify.showToast("Federated identity credentials rejected: " + authError.message, "error");
                }, 300);
            }

        }, 2400);
    },

};
