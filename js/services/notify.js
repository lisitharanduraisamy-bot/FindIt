import { db } from "./supabase.js";

class NotificationService {
    constructor() {
    }

    // In-App Toast Dispatcher
    showToast(message, type = "info") {
        // Play synthesized audible bell chime (Feature 9)
        this.playNotificationChime();

        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let icon = "fa-circle-info";
        if (type === "success") icon = "fa-circle-check";
        if (type === "error") icon = "fa-circle-exclamation";

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <div class="toast-content">${message}</div>
        `;

        container.appendChild(toast);

        // Auto remove toast
        setTimeout(() => {
            toast.style.animation = "slideInRight 0.3s ease-in reverse";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Dynamic HTML Transactional Email Template Builder
    buildEmailHTML(subject, recipientName, bodyContent, actionBtn = null) {
        let actionHTML = "";
        if (actionBtn) {
            actionHTML = `
                <div style="margin: 28px 0; text-align: center;">
                    <a href="${actionBtn.url}" style="background-color: #004ac6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px rgba(0, 74, 198, 0.15);">${actionBtn.label}</a>
                </div>
            `;
        }

        return `
            <div style="background-color: #f8f9ff; padding: 24px; font-family: 'Inter', system-ui, sans-serif; color: #0b1c30; margin: 0 auto; max-width: 600px; border: 1px solid #c3c6d7; border-radius: 12px;">
                <!-- Header -->
                <div style="border-bottom: 2px solid #e5eeff; padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background-color: #004ac6; color: #ffffff; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 16px; font-family: 'Outfit', sans-serif;">FI</span>
                        <span style="font-weight: 800; font-size: 18px; color: #0b1c30; font-family: 'Outfit', sans-serif;">FindIt Portal</span>
                    </div>
                    <span style="font-size: 10px; color: #737686; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">University Systems</span>
                </div>
                
                <!-- Main Body -->
                <div>
                    <h2 style="font-size: 18px; font-weight: 700; color: #0b1c30; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">Hello, ${recipientName}</h2>
                    <p style="font-size: 14px; line-height: 22px; color: #434655; margin-bottom: 16px;">${bodyContent}</p>
                    
                    ${actionHTML}
                    
                    <p style="font-size: 13px; color: #737686; margin-top: 24px; line-height: 20px;">
                        Regards,<br>
                        <strong>FindIt Admin Support</strong><br>
                        Campus Security Division, Room 102
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #e5eeff; padding-top: 14px; margin-top: 24px; text-align: center; font-size: 11px; color: #737686;">
                    This is an automated campus notification. Please do not reply directly to this email.<br>
                    <a href="#welcome" style="color: #004ac6; text-decoration: none; font-weight: 600;">FindIt Portal</a> &bull; 
                    <a href="#help" style="color: #004ac6; text-decoration: none; font-weight: 600;">Help Center</a>
                </div>
            </div>
        `;
    }

    // Trigger Notification & Transactional Email Simulator
    async sendNotificationAndEmail(userId, type, details = {}) {
        // 1. Log In-App Notification in DB
        let notifTitle = "";
        let notifMessage = "";
        let linkTo = "#dashboard";

        if (type === "claim_submitted") {
            notifTitle = "New Claim Submitted";
            notifMessage = `Student ${details.claimantName} claimed item '${details.itemName}'.`;
            linkTo = "#admin";
        } else if (type === "claim_approved") {
            notifTitle = "Claim Approved!";
            notifMessage = `Your claim request for '${details.itemName}' has been approved by Admin.`;
            linkTo = "#profile";
        } else if (type === "claim_rejected") {
            notifTitle = "Claim Rejected";
            notifMessage = `Your claim request for '${details.itemName}' was not approved.`;
            linkTo = "#profile";
        } else if (type === "status_updated") {
            notifTitle = "Status Update";
            notifMessage = `Item '${details.itemName}' status changed to '${details.status}'.`;
            linkTo = "#profile";
        }

        // Write to Supabase / Mock database
        await db.createNotification(userId, type, notifTitle, notifMessage, linkTo);

        // 2. Draft Responsive HTML Email Template for Simulator
        let emailHtml = "";
        let subject = "";
        let recipientEmail = details.recipientEmail;
        let recipientName = details.recipientName;

        if (type === "claim_submitted") {
            subject = `[FindIt] New Claim Submission: ${details.itemName} (${details.refId})`;
            const body = `We are notifying you that a student has submitted an ownership claim request for your reported item: <strong>${details.itemName}</strong> (Reference ID: ${details.refId}). <br><br>The claimant stated the following explanation of ownership:<br><i>"${details.claimantExplanation}"</i>`;
            emailHtml = this.buildEmailHTML(subject, recipientName, body, {
                label: "Review Claim inside Portal",
                url: "#admin"
            });
        } 
        
        else if (type === "claim_approved") {
             const retrievalNotes = details.clerkNotes && details.clerkNotes.trim()
                 ? details.clerkNotes.trim()
                 : "Please retrieve your item at the Central Campus Security Desk in the Student Union (Room 102), Monday to Friday, 9:00 AM - 5:00 PM. Please bring your student ID.";
            subject = `[FindIt] Claim APPROVED: ${details.itemName} (${details.refId})`;
            const body = `Congratulations! The campus safety division has reviewed your verification details and **APPROVED** your ownership claim for the item: <strong>${details.itemName}</strong>.<br><br><strong>Retrieval Instructions:</strong><br>${retrievalNotes}`;
            emailHtml = this.buildEmailHTML(subject, recipientName, body, {
                label: "View Claim Details",
                url: "#profile"
            });
        } 
        
        else if (type === "claim_rejected") {
            subject = `[FindIt] Claim Update: ${details.itemName} (${details.refId})`;
            const body = `We regret to inform you that the campus safety division has reviewed your verification details and has **REJECTED** your ownership claim for the item: <strong>${details.itemName}</strong>. <br><br><strong>Reason:</strong> The identifying characteristics provided did not match the records. If you believe this is an error, please visit campus security directly with secondary proofs.`;
            emailHtml = this.buildEmailHTML(subject, recipientName, body, {
                label: "Submit Secondary Review",
                url: "#help"
            });
        } 
        
        else if (type === "status_updated") {
            subject = `[FindIt] Status Update: ${details.itemName} (${details.refId})`;
            const body = `This is a quick notification that the reported item: <strong>${details.itemName}</strong> (Reference ID: ${details.refId}) has updated its status. It is now marked as **${details.status.toUpperCase()}**.`;
            emailHtml = this.buildEmailHTML(subject, recipientName, body, {
                label: "View Report Status",
                url: "#profile"
            });
        }

        // 3. Dispatch native desktop push notifications if authorized (Feature 26)
        if (window.Notification && Notification.permission === "granted") {
            try {
                new Notification(notifTitle, {
                    body: notifMessage,
                    icon: "https://api.dicebear.com/7.x/adventurer/svg?seed=" + recipientName
                });
            } catch (e) {
                console.warn("FindIt: Browser rejected native desktop notification dispatch:", e);
            }
        }
        
        // Show success alert in-app
        this.showToast(`Simulated email notification dispatched to ${recipientEmail}`, "success");
    }

    // Synthesized Web Audio Notification Bell Chime (Feature 9)
    playNotificationChime() {
        const isChimeEnabled = localStorage.getItem("findit_audio_chime") !== "false";
        if (!isChimeEnabled) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;
            
            // Primary fundamental sine wave oscillator (C5 tone)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(523.25, now);
            // Add rich micro pitch sweep
            osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);
            osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.25);
            
            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7); // natural exponential chime decay

            // Higher harmonic triangle oscillator for standard metallic bright chime timber
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(1046.50, now);
            
            gain2.gain.setValueAtTime(0.04, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            // Audio node routing
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            // Execute oscillator schedule
            osc1.start(now);
            osc2.start(now);

            osc1.stop(now + 0.7);
            osc2.stop(now + 0.35);
        } catch (e) {
            console.warn("FindIt: Web Audio Context initialization blocked or failed:", e);
        }
    }
}

export const notify = new NotificationService();
export default notify;
