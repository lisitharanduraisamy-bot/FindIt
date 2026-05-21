import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";

export default {
    mode: "login", // 'login', 'register', 'forgot'

    render() {
        if (this.mode === "login") {
            return this.renderLogin();
        } else if (this.mode === "register") {
            return this.renderRegister();
        } else {
            return this.renderForgot();
        }
    },

    // Renders the standard credential login form
    renderLogin() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; min-height: calc(100vh - 120px);">
                <div class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 40px 32px; box-shadow: var(--shadow-lg); position: relative;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px; font-family: 'Outfit', sans-serif;">FindIt Portal</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 24px; font-weight: 500;">Campus Lost & Found Portal</p>
                    
                    <form id="form-auth-login" style="text-align: left;">
                        <div class="form-group">
                            <label for="login-email" class="form-label">Email Address</label>
                            <div class="input-icon-wrapper">
                                <i class="fa-regular fa-envelope"></i>
                                <input type="email" id="login-email" class="form-input icon-padding" required placeholder="example@gmail.com">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="login-password" class="form-label">Password</label>
                            <div class="input-icon-wrapper">
                                <i class="fa-solid fa-lock"></i>
                                <input type="password" id="login-password" class="form-input icon-padding icon-padding-right">
                                <button type="button" class="password-toggle" tabindex="-1">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
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
                            <label for="register-email" class="form-label">Email Address</label>
                            <div style="position: relative; display: flex;">
                                <input type="email" id="register-email" class="form-input" required placeholder="example@gmail.com" style="font-weight: 500; width: 100%;">
                            </div>
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
                            <div class="input-icon-wrapper">
                                <i class="fa-solid fa-lock"></i>
                                <input type="password" id="register-password" class="form-input icon-padding icon-padding-right" required placeholder="Minimum 6 characters">
                                <button type="button" class="password-toggle" tabindex="-1">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
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
                            <label for="forgot-email" class="form-label">Email Address</label>
                            <input type="email" id="forgot-email" class="form-input" required placeholder="example@gmail.com">
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
        // --- PASSWORD TOGGLE LOGIC ---
        const passwordToggles = document.querySelectorAll(".password-toggle");
        passwordToggles.forEach(toggle => {
            toggle.addEventListener("click", () => {
                const input = toggle.parentElement.querySelector("input");
                const icon = toggle.querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    input.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
        });

        // --- MODE TOGGLES ---
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

        // Tab selection logic removed

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
    }
};
