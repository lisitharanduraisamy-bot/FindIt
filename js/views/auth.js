/* ==========================================================
   FINDIT: USER AUTHENTICATION VIEWS (SIGNIN, SIGNUP, RESET)
   ========================================================== */

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

    renderLogin() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px;">
                <div class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 40px 32px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px;">FindIt Portal</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 28px; font-weight: 500;">University Management System</p>
                    
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
                            <button type="button" id="btn-toggle-forgot" class="btn-link" style="padding: 0;">Forgot Password?</button>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 12px;">Sign In</button>
                    </form>
                    
                    <p style="margin-top: 24px; font-size: 13px; color: var(--color-on-surface-variant);">
                        Need an account? <button type="button" id="btn-toggle-register" class="btn-link" style="font-weight: 700; padding: 0;">Register</button>
                    </p>
                </div>
            </div>
        `;
    },

    renderRegister() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px;">
                <div class="card" style="width: 100%; max-width: 480px; text-align: center; padding: 40px 32px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-user-plus"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px;">Create Account</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 28px; font-weight: 500;">Access the campus Lost & Found network</p>
                    
                    <form id="form-auth-register" style="text-align: left;">
                        <div class="form-group">
                            <label for="register-name" class="form-label">Full Name</label>
                            <input type="text" id="register-name" class="form-input" required placeholder="Alex Student">
                        </div>
                        
                        <div class="form-group">
                            <label for="register-email" class="form-label">University Email</label>
                            <input type="email" id="register-email" class="form-input" required placeholder="student@university.edu">
                        </div>

                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="register-phone" class="form-label">Phone Number</label>
                                <input type="tel" id="register-phone" class="form-input" placeholder="(555) 000-0000">
                            </div>
                            <div class="form-group col-6">
                                <label for="register-major" class="form-label">Major / Class Year</label>
                                <input type="text" id="register-major" class="form-input" placeholder="e.g. CS Major '25">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="register-password" class="form-label">Password</label>
                            <input type="password" id="register-password" class="form-input" required placeholder="Minimum 6 characters">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 12px;">Register Account</button>
                    </form>
                    
                    <p style="margin-top: 24px; font-size: 13px; color: var(--color-on-surface-variant);">
                        Already have an account? <button type="button" id="btn-toggle-login" class="btn-link" style="font-weight: 700; padding: 0;">Sign In</button>
                    </p>
                </div>
            </div>
        `;
    },

    renderForgot() {
        return `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px;">
                <div class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 40px 32px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary-container); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                        <i class="fa-solid fa-key"></i>
                    </div>
                    
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface); margin-bottom: 4px;">Reset Password</h2>
                    <p style="font-size: 13px; color: var(--color-outline); margin-bottom: 28px; font-weight: 500;">Enter your email to receive recovery link</p>
                    
                    <form id="form-auth-forgot" style="text-align: left;">
                        <div class="form-group">
                            <label for="forgot-email" class="form-label">University Email</label>
                            <input type="email" id="forgot-email" class="form-input" required placeholder="student@university.edu">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 12px;">Send Recovery Email</button>
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

        // Form Submit Listeners
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
    }
};
