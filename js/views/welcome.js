/* ==========================================================
   FINDIT: WELCOME LANDING PAGE VIEW
   ========================================================== */

import { db } from "../services/supabase.js";

export default {
    render() {
        const user = db.session ? db.session.profile : null;
        
        return `
            <div class="welcome-container">
                <!-- Hero Section -->
                <section class="welcome-hero">
                    <div class="info-pill">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>Over 10,000 items successfully returned this year</span>
                    </div>
                    
                    <h2>Lost Today. <span>Found Tomorrow.</span></h2>
                    
                    <p>The centralized university platform for reporting, tracking, and recovering misplaced belongings. Designed for rapid resolution and peace of mind on campus.</p>
                    
                    <div class="hero-actions">
                        <button id="hero-btn-lost" class="btn btn-primary btn-lg">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <span>Report Lost Item</span>
                        </button>
                        <button id="hero-btn-found" class="btn btn-outline btn-lg">
                            <i class="fa-solid fa-plus-circle"></i>
                            <span>Report Found Item</span>
                        </button>
                    </div>
                </section>

                <!-- Statistics Section -->
                <section class="stats-banner">
                    <div class="stat-item card">
                        <h3>92%</h3>
                        <p>Recovery Rate</p>
                    </div>
                    <div class="stat-item card">
                        <h3>&lt;24h</h3>
                        <p>Average Match Time</p>
                    </div>
                    <div class="stat-item card">
                        <h3>5k+</h3>
                        <p>Active Listings</p>
                    </div>
                    <div class="stat-item card">
                        <h3>24/7</h3>
                        <p>Security Support</p>
                    </div>
                </section>

                <!-- Process Section -->
                <section class="process-section border-top pt-4">
                    <h2 class="section-headline text-center">A Streamlined Process</h2>
                    <p class="section-subtext text-center">Our intelligent matching system connects lost items with their owners efficiently.</p>
                    
                    <div class="process-grid">
                        <!-- Card 1 -->
                        <div class="process-card">
                            <div class="process-icon">
                                <i class="fa-solid fa-file-pen"></i>
                            </div>
                            <div class="process-text">
                                <h3>1. Report</h3>
                                <p>Submit a detailed description of the lost or found item. Upload photos to improve matching accuracy.</p>
                            </div>
                        </div>

                        <!-- Card 2 -->
                        <div class="process-card">
                            <div class="process-icon">
                                <i class="fa-solid fa-robot"></i>
                            </div>
                            <div class="process-text">
                                <h3>2. AI Matching</h3>
                                <p>Our system automatically scans newly reported items against the database, flagging potential matches instantly based on categories, locations, and descriptions.</p>
                            </div>
                        </div>

                        <!-- Card 3 -->
                        <div class="process-card full-width">
                            <div style="display: flex; gap: 20px; align-items: center;">
                                <div class="process-icon">
                                    <i class="fa-solid fa-shield-halved"></i>
                                </div>
                                <div class="process-text">
                                    <h3>3. Recover securely</h3>
                                    <p>Once a match is confirmed, coordinate a secure handoff at designated campus security desks. Your privacy and safety are maintained throughout the process.</p>
                                </div>
                            </div>
                            <button class="btn btn-primary" id="btn-recovery-locations">
                                <span>View Recovery Locations</span>
                            </button>
                        </div>
                    </div>
                </section>
                
                <!-- Welcome Page Footer -->
                <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b;">
                    <div><strong>FindIt</strong></div>
                    <div style="display: flex; gap: 16px;">
                        <a href="#help" style="color: #64748b;">Privacy Policy</a>
                        <a href="#help" style="color: #64748b;">Terms of Use</a>
                        <a href="#help" style="color: #64748b;">Campus Security</a>
                        <a href="#help" style="color: #64748b;">Accessibility</a>
                    </div>
                    <div>&copy; 2024 FindIt University Systems. All rights reserved.</div>
                </footer>
            </div>
        `;
    },

    attachEvents(app) {
        // Report actions
        document.getElementById("hero-btn-lost").addEventListener("click", () => {
            if (!db.session) {
                app.navigateTo("login");
            } else {
                app.openReportModal("lost");
            }
        });

        document.getElementById("hero-btn-found").addEventListener("click", () => {
            if (!db.session) {
                app.navigateTo("login");
            } else {
                app.openReportModal("found");
            }
        });

        document.getElementById("btn-recovery-locations").addEventListener("click", () => {
            app.openHelpModal();
        });
    }
};
