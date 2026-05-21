/* ==========================================================
   FINDIT: CENTRAL COORDINATOR & SPA ROUTER
   ========================================================== */

import { db } from "./services/supabase.js";
import { notify } from "./services/notify.js";
import welcomeView from "./views/welcome.js";
import authView from "./views/auth.js";
import dashboardView from "./views/dashboard.js";
import browseView from "./views/browse.js";
import detailsView from "./views/details.js";
import claimView from "./views/claim.js";
import profileView from "./views/profile.js";
import analyticsView from "./views/analytics.js";
import adminView from "./views/admin.js";

class AppCoordinator {
    constructor() {
        this.routes = {
            "welcome": welcomeView,
            "dashboard": dashboardView,
            "browse": browseView,
            "details": detailsView,
            "claim": claimView,
            "profile": profileView,
            "analytics": analyticsView,
            "admin": adminView,
            "login": authView,
            "register": authView,
            "forgot": authView
        };
        
        this.activeRoute = null;
        this.selectedFile = null;
        this.init();
    }

    async init() {
        console.log("FindIt: Core application initializing...");
        
        // Connect listeners
        window.addEventListener("hashchange", () => this.handleRouting());
        
        // Provision global components
        this.setupModals();
        this.setupDropzone();
        this.setupHeaderActions();
        
        // Initial setup and routing
        await this.handleSessionSync();
        this.handleRouting();
        
        // Initial category listing
        await this.loadCategoriesInModal();
    }

    async handleSessionSync() {
        // Sync active user details
        this.onUserLogin();
    }

    // SPA Router Core
    async handleRouting() {
        const hash = window.location.hash.slice(1) || "welcome";
        let routeName = hash;
        let routeParam = null;

        // Parse path parameters
        if (hash.startsWith("details/")) {
            routeName = "details";
            routeParam = hash.replace("details/", "");
        } else if (hash.startsWith("claim/")) {
            routeName = "claim";
            routeParam = hash.replace("claim/", "");
        }

        // Auth Protection Guard
        const user = db.session ? db.session.profile : null;
        const guestRoutes = ["welcome", "login", "register", "forgot", "browse", "details", "analytics"];
        
        if (!user && !guestRoutes.includes(routeName)) {
            // Guard protected pages
            window.location.hash = "#welcome";
            return;
        }

        // If user logged in and tries to access welcome/login, redirect to dashboard
        if (user && (routeName === "welcome" || routeName === "login" || routeName === "register" || routeName === "forgot")) {
            window.location.hash = "#dashboard";
            return;
        }

        // Render appropriate views
        const view = this.routes[routeName];
        if (view) {
            this.showLoader();
            this.activeRoute = view;

            // Set state params if detail views
            if (routeName === "details") {
                view.itemId = routeParam;
            } else if (routeName === "claim") {
                view.itemId = routeParam;
            } else if (routeName === "login") {
                view.mode = "login";
            } else if (routeName === "register") {
                view.mode = "register";
            } else if (routeName === "forgot") {
                view.mode = "forgot";
            }

            try {
                // Render HTML to main main viewport
                const viewport = document.getElementById("main-content");
                const html = await view.render();
                viewport.innerHTML = html;

                // Sync sidebar links
                this.updateSidebarActiveState(routeName);
                this.updateSidebarVisibility();
                
                // Bind event listeners specific to that view
                if (view.attachEvents) {
                    view.attachEvents(this);
                }

                // Sync unread bell counts
                await this.syncHeaderNotifications();

            } catch (err) {
                console.error("Router error:", err);
                notify.showToast("Failed to render page view. Fallback routing.", "error");
            } finally {
                this.hideLoader();
            }
        } else {
            console.warn(`Route not resolved: ${routeName}. Redirecting home.`);
            window.location.hash = "#welcome";
        }
    }

    navigateTo(path) {
        window.location.hash = `#${path}`;
    }

    // Dynamic header and sidebar state sync
    onUserLogin() {
        this.updateSidebarVisibility();
        this.syncHeaderProfile();
    }

    updateSidebarVisibility() {
        const sidebar = document.getElementById("app-sidebar");
        const header = document.getElementById("app-header");
        const mainWrapper = document.querySelector(".main-wrapper");
        const adminNavWrapper = document.getElementById("admin-nav-wrapper");

        if (db.session) {
            sidebar.classList.remove("hidden");
            header.classList.remove("hidden");
            mainWrapper.style.marginLeft = "280px";
            
            // Show Admin tab if admin
            if (db.session.profile.role === "admin") {
                adminNavWrapper.classList.remove("hidden");
            } else {
                adminNavWrapper.classList.add("hidden");
            }
        } else {
            sidebar.classList.add("hidden");
            header.classList.add("hidden");
            mainWrapper.style.marginLeft = "0";
        }
    }

    updateSidebarActiveState(routeName) {
        const navs = ["dashboard", "browse", "profile", "analytics", "admin"];
        navs.forEach(nav => {
            const el = document.getElementById(`nav-${nav}`);
            if (el) {
                if (nav === routeName) {
                    el.classList.add("active");
                } else {
                    el.classList.remove("active");
                }
            }
        });
    }

    syncHeaderProfile() {
        const avatarInitials = document.getElementById("user-avatar-initials");
        const avatarImage = document.getElementById("user-avatar-image");
        const dropdownName = document.getElementById("user-dropdown-name");
        const dropdownEmail = document.getElementById("user-dropdown-email");

        if (db.session && db.session.profile) {
            const user = db.session.profile;
            if (avatarInitials) avatarInitials.textContent = user.name[0];
            
            if (user.avatar_url && avatarImage) {
                avatarImage.src = user.avatar_url;
                avatarImage.classList.remove("hidden");
                avatarInitials.classList.add("hidden");
            } else if (avatarImage) {
                avatarImage.classList.add("hidden");
                avatarInitials.classList.remove("hidden");
            }

            if (dropdownName) dropdownName.textContent = user.name;
            if (dropdownEmail) dropdownEmail.textContent = user.email;
        }
    }

    async syncHeaderNotifications() {
        if (!db.session) return;
        
        const notifications = await db.getNotifications();
        const unread = notifications.filter(n => !n.is_read);
        
        const badge = document.getElementById("unread-notification-count");
        if (badge) {
            if (unread.length > 0) {
                badge.classList.remove("hidden");
                badge.textContent = unread.length;
            } else {
                badge.classList.add("hidden");
            }
        }

        const listContainer = document.getElementById("notification-list-container");
        if (listContainer) {
            if (unread.length === 0) {
                listContainer.innerHTML = `<div class="empty-state">No new alerts.</div>`;
            } else {
                listContainer.innerHTML = unread.map(n => `
                    <div class="dropdown-item notif-header-item" style="padding: 12px 16px; border-bottom: 1px solid var(--color-surface-container); display: flex; gap: 10px; align-items: flex-start; cursor: pointer;" data-link="${n.link_to || '#dashboard'}">
                        <div style="flex: 1;">
                            <h4 style="font-size: 12px; font-weight: 700; color: var(--color-on-surface); line-height: 16px;">${n.title}</h4>
                            <p style="font-size: 11px; color: var(--color-on-surface-variant); margin-top: 1px; line-height: 14px;">${n.message}</p>
                        </div>
                    </div>
                `).join("");

                // Link clicks
                document.querySelectorAll(".notif-header-item").forEach(item => {
                    item.addEventListener("click", () => {
                        const link = item.getAttribute("data-link");
                        window.location.hash = link;
                        document.getElementById("notification-dropdown").classList.add("hidden");
                    });
                });
            }
        }
    }

    // Spinner loaders
    showLoader() {
        const viewport = document.getElementById("main-content");
        if (viewport) {
            viewport.innerHTML = `
                <div class="app-spinner-wrapper" style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 240px;">
                    <div class="spinner"></div>
                </div>
            `;
        }
    }

    hideLoader() {
        // Handled by rendering direct HTML inside router
    }

    // Modal Manager
    setupModals() {
        const closeReport = document.getElementById("btn-close-report-modal");
        const cancelReport = document.getElementById("btn-cancel-report");
        const reportForm = document.getElementById("form-report-item");
        
        // Report forms triggers
        if (closeReport) closeReport.addEventListener("click", () => this.closeReportModal());
        if (cancelReport) cancelReport.addEventListener("click", () => this.closeReportModal());

        if (reportForm) {
            reportForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.submitReportForm();
            });

            // Handle Lost / Found toggles
            const typeRadios = document.querySelectorAll('input[name="report_type"]');
            typeRadios.forEach(radio => {
                radio.addEventListener("change", () => {
                    const val = radio.value;
                    const contactSection = document.getElementById("contact-info-section");
                    const labelDate = document.getElementById("label-report-date");
                    const labelLocation = document.getElementById("label-report-location");
                    const locationInput = document.getElementById("report-location");

                    if (val === "lost") {
                        contactSection.classList.remove("hidden");
                        labelDate.textContent = "Date Lost";
                        labelLocation.textContent = "Last Known Location";
                        locationInput.placeholder = "e.g. Science Quad near bench, Library Floor 1";
                    } else {
                        contactSection.classList.add("hidden");
                        labelDate.textContent = "Date Found";
                        labelLocation.textContent = "Location Found";
                        locationInput.placeholder = "e.g. Library Desk 42, Campus Quad Benches";
                    }
                });
            });
        }

        // Sidebar reports found button
        const btnSidebar = document.getElementById("btn-sidebar-report");
        if (btnSidebar) {
            btnSidebar.addEventListener("click", () => this.openReportModal("found"));
        }

        // Credentials / settings modal
        const toggleSet = document.getElementById("btn-settings-toggle");
        const closeSet = document.getElementById("btn-close-settings-modal");
        const formSettings = document.getElementById("form-settings");
        const clearSettings = document.getElementById("btn-clear-settings");

        if (toggleSet) toggleSet.addEventListener("click", () => this.openSettingsModal());
        if (closeSet) closeSet.addEventListener("click", () => this.closeSettingsModal());
        
        if (formSettings) {
            // Load current key placeholders
            const urlInput = document.getElementById("settings-supabase-url");
            const keyInput = document.getElementById("settings-supabase-key");
            if (urlInput) urlInput.value = localStorage.getItem("findit_supabase_url") || "";
            if (keyInput) keyInput.value = localStorage.getItem("findit_supabase_key") || "";

            formSettings.addEventListener("submit", (e) => {
                e.preventDefault();
                const url = urlInput.value.trim();
                const key = keyInput.value.trim();

                if (url && key) {
                    localStorage.setItem("findit_supabase_url", url);
                    localStorage.setItem("findit_supabase_key", key);
                    localStorage.removeItem("findit_mock_db"); // Clear mock to force sync live
                    notify.showToast("Supabase connected! Reloading layout...", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    notify.showToast("Please provide both Supabase URL and Key", "error");
                }
            });
        }

        if (clearSettings) {
            clearSettings.addEventListener("click", () => {
                localStorage.removeItem("findit_supabase_url");
                localStorage.removeItem("findit_supabase_key");
                localStorage.removeItem("findit_mock_db");
                localStorage.removeItem("findit_mock_session");
                notify.showToast("Reset to Offline Mock database! Reloading...", "info");
                setTimeout(() => window.location.reload(), 1000);
            });
        }

        // Help Center
        const toggleHelp = document.getElementById("btn-help-toggle");
        const closeHelp = document.getElementById("btn-close-help-modal");
        if (toggleHelp) toggleHelp.addEventListener("click", () => this.openHelpModal());
        if (closeHelp) closeHelp.addEventListener("click", () => this.closeHelpModal());
    }

    openReportModal(defaultType = "found") {
        if (!db.session) {
            notify.showToast("You must be logged in to file a report listing.", "error");
            this.navigateTo("login");
            return;
        }

        const modal = document.getElementById("modal-report-item");
        if (modal) {
            modal.classList.remove("hidden");
            
            // Sync radio button choices
            const radio = document.getElementById(`radio-type-${defaultType}`);
            if (radio) {
                radio.checked = true;
                // trigger change
                radio.dispatchEvent(new Event("change"));
            }

            // Fill default date to today
            const dateInput = document.getElementById("report-date");
            if (dateInput) {
                dateInput.value = new Date().toISOString().split("T")[0];
            }
        }
    }

    closeReportModal() {
        const modal = document.getElementById("modal-report-item");
        const form = document.getElementById("form-report-item");
        if (modal) modal.classList.add("hidden");
        if (form) {
            form.reset();
            // Clear image uploader states
            const removeBtn = document.getElementById("btn-remove-preview");
            if (removeBtn) removeBtn.click();
        }
    }

    openSettingsModal() {
        document.getElementById("modal-settings")?.classList.remove("hidden");
    }

    closeSettingsModal() {
        document.getElementById("modal-settings")?.classList.add("hidden");
    }

    openHelpModal() {
        document.getElementById("modal-help")?.classList.remove("hidden");
    }

    closeHelpModal() {
        document.getElementById("modal-help")?.classList.add("hidden");
    }

    // Drag-and-drop Image handler
    setupDropzone() {
        const dropzone = document.getElementById("report-image-dropzone");
        const fileInput = document.getElementById("report-image-file");
        const preview = document.getElementById("dropzone-preview");
        const filename = document.getElementById("preview-filename");
        const removeBtn = document.getElementById("btn-remove-preview");

        if (!dropzone || !fileInput) return;

        dropzone.addEventListener("click", (e) => {
            if (e.target !== fileInput && e.target !== removeBtn) {
                fileInput.click();
            }
        });

        fileInput.addEventListener("change", () => {
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                this.selectedFile = file;
                filename.textContent = file.name;
                preview.classList.remove("hidden");
                dropzone.querySelector("i").style.display = "none";
                dropzone.querySelector(".dropzone-text").style.display = "none";
                dropzone.querySelector(".sub-text").style.display = "none";
            }
        });

        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            fileInput.value = "";
            this.selectedFile = null;
            preview.classList.add("hidden");
            dropzone.querySelector("i").style.display = "block";
            dropzone.querySelector(".dropzone-text").style.display = "block";
            dropzone.querySelector(".sub-text").style.display = "block";
        });
    }

    async loadCategoriesInModal() {
        const select = document.getElementById("report-category");
        if (!select) return;
        try {
            const categories = await db.getCategories();
            select.innerHTML = '<option value="" disabled selected>Select a category</option>' + 
                categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    }

    async submitReportForm() {
        const type = document.querySelector('input[name="report_type"]:checked').value;
        const name = document.getElementById("report-item-name").value;
        const categoryId = document.getElementById("report-category").value;
        const date = document.getElementById("report-date").value;
        const location = document.getElementById("report-location").value;
        const description = document.getElementById("report-description").value;

        const contactName = document.getElementById("contact-name").value;
        const contactEmail = document.getElementById("contact-email").value;

        this.showLoader();
        try {
            const itemData = {
                type,
                name,
                category_id: categoryId,
                date_reported: date,
                location,
                description,
                contact_name: contactName,
                contact_email: contactEmail
            };

            await db.createItem(itemData, this.selectedFile);
            notify.showToast(`Listing for '${name}' reported successfully!`, "success");
            
            this.closeReportModal();
            this.navigateTo("browse");
            this.handleRouting(); // force reload browse list
        } catch (err) {
            notify.showToast("Failed to create report: " + err.message, "error");
        } finally {
            this.hideLoader();
        }
    }

    setupHeaderActions() {
        // Bell toggle
        const bell = document.getElementById("btn-notification-bell");
        const dropdown = document.getElementById("notification-dropdown");
        const btnMarkAll = document.getElementById("btn-mark-all-read");

        if (bell && dropdown) {
            bell.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdown.classList.toggle("hidden");
                // hide user dropdown
                document.getElementById("user-dropdown").classList.add("hidden");
            });

            document.addEventListener("click", () => {
                dropdown.classList.add("hidden");
            });

            dropdown.addEventListener("click", (e) => e.stopPropagation());
        }

        if (btnMarkAll) {
            btnMarkAll.addEventListener("click", async () => {
                await db.markNotificationsAsRead();
                notify.showToast("All alerts marked as read.", "info");
                this.syncHeaderNotifications();
                this.handleRouting(); // refresh current view if needed
            });
        }

        // Avatar toggle
        const avatar = document.getElementById("btn-user-profile");
        const userDropdown = document.getElementById("user-dropdown");
        const logoutBtn = document.getElementById("btn-logout-submit");

        if (avatar && userDropdown) {
            avatar.addEventListener("click", (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle("hidden");
                // hide notify dropdown
                document.getElementById("notification-dropdown").classList.add("hidden");
            });

            document.addEventListener("click", () => {
                userDropdown.classList.add("hidden");
            });

            userDropdown.addEventListener("click", (e) => e.stopPropagation());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await db.signOut();
                notify.showToast("Signed out successfully.", "info");
                this.onUserLogin();
                this.navigateTo("welcome");
            });
        }

        // Global search quick trigger
        const globalSearch = document.getElementById("global-search-input");
        if (globalSearch) {
            globalSearch.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const query = globalSearch.value.trim();
                    if (query) {
                        // Redirect to browse and pass query
                        import("./views/browse.js").then(module => {
                            module.default.filters.search = query;
                            globalSearch.value = "";
                            this.navigateTo("browse");
                        });
                    }
                }
            });
        }

        // Mobile Nav Hamburger Drawer trigger
        const burger = document.getElementById("mobile-nav-toggle");
        const sidebar = document.getElementById("app-sidebar");
        if (burger && sidebar) {
            burger.addEventListener("click", (e) => {
                e.stopPropagation();
                sidebar.classList.toggle("hidden");
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener("click", (e) => {
                if (window.innerWidth <= 1024 && !sidebar.classList.contains("hidden") && !sidebar.contains(e.target) && e.target !== burger) {
                    sidebar.classList.add("hidden");
                }
            });
        }
    }

    // Public Toast mapping helper
    showToast(msg, type) {
        notify.showToast(msg, type);
    }
}

// Instantiate app
document.addEventListener("DOMContentLoaded", () => {
    window.app = new AppCoordinator();
});
