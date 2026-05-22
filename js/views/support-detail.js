import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate } from "../utils/helpers.js";

export default {
    ticketId: null,

    async render() {
        if (!this.ticketId) return `<div class="card p-4 text-center">Ticket ID missing.</div>`;
        const user = db.session ? db.session.profile : null;
        if (!user) return `<div class="card p-4 text-center">Please login to view support tickets.</div>`;

        let ticketInfo;
        try {
            ticketInfo = await db.getSupportTicketById(this.ticketId);
        } catch (err) {
            console.error(err);
            return `<div class="card p-4 text-center text-danger">Failed to load ticket details: ${err.message}</div>`;
        }

        const isAdmin = user.role === "admin";
        
        let badgeClass = "badge-outline";
        if (ticketInfo.status === "Open") badgeClass = "badge-pending"; // Yellow
        else if (ticketInfo.status === "In Review") badgeClass = "badge-found"; // Blue
        else if (ticketInfo.status === "Resolved") badgeClass = "badge-verified"; // Green
        else if (ticketInfo.status === "Closed") badgeClass = "badge-returned"; // Gray

        const attachmentHTML = ticketInfo.attachment_url 
            ? `<div class="mt-3"><a href="${ticketInfo.attachment_url}" target="_blank" class="btn btn-outline" style="font-size: 12px; padding: 4px 8px;"><i class="fa-solid fa-paperclip"></i> View Attachment</a></div>`
            : "";

        const repliesHTML = ticketInfo.replies.map(reply => {
            const isMe = reply.user_id === user.id;
            const align = isMe ? "flex-end" : "flex-start";
            const borderRadius = isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px";
            
            return `
                <div style="display: flex; flex-direction: column; align-items: ${align}; margin-bottom: 16px;">
                    <span style="font-size: 11px; color: var(--color-outline); margin-bottom: 4px;">
                        ${reply.profiles?.name || 'Unknown User'} • ${formatDate(reply.created_at)}
                    </span>
                    <div style="max-width: 80%; background-color: ${isMe ? 'var(--color-primary)' : 'var(--color-surface-container)'}; color: ${isMe ? 'var(--color-on-primary)' : 'var(--color-on-surface)'}; padding: 12px 16px; border-radius: ${borderRadius}; font-size: 14px; line-height: 1.5; white-space: pre-line;">
                        ${reply.message}
                    </div>
                </div>
            `;
        }).join("");

        let adminPanelHTML = "";
        if (isAdmin) {
            adminPanelHTML = `
                <div class="card mb-4 p-4" style="border-left: 4px solid var(--color-primary);">
                    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">Admin Controls</h3>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <label style="font-size: 13px; font-weight: 600;">Update Status:</label>
                        <select id="admin-status-select" class="form-control" style="width: auto; padding: 4px 12px; height: auto;">
                            <option value="Open" ${ticketInfo.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="In Review" ${ticketInfo.status === 'In Review' ? 'selected' : ''}>In Review</option>
                            <option value="Resolved" ${ticketInfo.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                            <option value="Closed" ${ticketInfo.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                        <button id="btn-update-status" class="btn btn-outline" style="padding: 4px 12px;">Apply</button>
                    </div>
                </div>
                
                <div class="card mb-4 p-4">
                    <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 12px;">User Information</h3>
                    <div style="font-size: 13px; color: var(--color-on-surface-variant); display: flex; flex-direction: column; gap: 8px;">
                        <div><strong>Name:</strong> ${ticketInfo.profiles?.name}</div>
                        <div><strong>Email:</strong> ${ticketInfo.profiles?.email}</div>
                        <div><strong>Role:</strong> <span style="text-transform: capitalize;">${ticketInfo.profiles?.role}</span></div>
                    </div>
                </div>
            `;
        }

        const replyBoxHTML = (ticketInfo.status !== "Closed") ? `
            <div class="card p-4 mt-4" style="background-color: var(--color-surface-lowest);">
                <textarea id="reply-message" class="form-control mb-3" rows="3" placeholder="Type your response here..." required></textarea>
                <div style="display: flex; justify-content: flex-end;">
                    <button id="btn-submit-reply" class="btn btn-primary">
                        <i class="fa-solid fa-reply"></i> Send Reply
                    </button>
                </div>
            </div>
        ` : `
            <div class="alert alert-info mt-4">
                <i class="fa-solid fa-lock"></i> This ticket is closed. No further replies can be added.
            </div>
        `;

        return `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <button class="btn btn-outline" style="padding: 8px 12px;" onclick="window.history.back()">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div style="flex: 1;">
                        <span style="font-size: 12px; font-weight: bold; color: var(--color-outline);">${ticketInfo.ticket_number}</span>
                        <h1 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface);">${ticketInfo.subject}</h1>
                    </div>
                    <span class="badge ${badgeClass}">${ticketInfo.status}</span>
                </div>

                <div class="details-grid" style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;">
                    
                    <!-- Left: Conversation Thread -->
                    <div style="display: flex; flex-direction: column;">
                        
                        <div class="card p-4 mb-4">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-surface-container); display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                        ${ticketInfo.profiles?.name ? ticketInfo.profiles.name[0] : 'U'}
                                    </div>
                                    <div>
                                        <div style="font-weight: bold; font-size: 14px;">${ticketInfo.profiles?.name || 'User'}</div>
                                        <div style="font-size: 11px; color: var(--color-outline);">${formatDate(ticketInfo.created_at)}</div>
                                    </div>
                                </div>
                            </div>
                            <div style="font-size: 14px; line-height: 1.6; color: var(--color-on-surface); white-space: pre-line;">
                                ${ticketInfo.description}
                            </div>
                            ${attachmentHTML}
                        </div>

                        <!-- Replies -->
                        <div style="display: flex; flex-direction: column; padding: 0 16px;">
                            ${repliesHTML}
                        </div>

                        <!-- Reply Box -->
                        ${replyBoxHTML}

                    </div>

                    <!-- Right: Ticket Meta Sidebar -->
                    <div style="display: flex; flex-direction: column;">
                        ${adminPanelHTML}

                        <div class="card p-4">
                            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 16px;">Ticket Details</h3>
                            
                            <div style="display: flex; flex-direction: column; gap: 16px; font-size: 13px;">
                                <div>
                                    <div style="color: var(--color-outline); font-weight: 600; margin-bottom: 4px;">Category</div>
                                    <div style="color: var(--color-on-surface);">${ticketInfo.category}</div>
                                </div>
                                <div>
                                    <div style="color: var(--color-outline); font-weight: 600; margin-bottom: 4px;">Priority</div>
                                    <div style="color: var(--color-on-surface);"><i class="fa-solid fa-flag text-danger"></i> ${ticketInfo.priority}</div>
                                </div>
                                <div>
                                    <div style="color: var(--color-outline); font-weight: 600; margin-bottom: 4px;">Created</div>
                                    <div style="color: var(--color-on-surface);">${formatDate(ticketInfo.created_at)}</div>
                                </div>
                                <div>
                                    <div style="color: var(--color-outline); font-weight: 600; margin-bottom: 4px;">Last Updated</div>
                                    <div style="color: var(--color-on-surface);">${formatDate(ticketInfo.updated_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    attachEvents(app) {
        const btnReply = document.getElementById("btn-submit-reply");
        if (btnReply) {
            btnReply.addEventListener("click", async () => {
                const message = document.getElementById("reply-message").value.trim();
                if (!message) {
                    notify.showErrorToast("Reply message cannot be empty.");
                    return;
                }
                
                app.showLoader();
                try {
                    await db.addTicketReply(this.ticketId, message);
                    notify.showSuccessToast("Reply sent.");
                    app.renderView();
                } catch (err) {
                    notify.showErrorToast("Failed to send reply: " + err.message);
                } finally {
                    app.hideLoader();
                }
            });
        }

        const btnUpdateStatus = document.getElementById("btn-update-status");
        if (btnUpdateStatus) {
            btnUpdateStatus.addEventListener("click", async () => {
                const newStatus = document.getElementById("admin-status-select").value;
                app.showLoader();
                try {
                    await db.updateTicketStatus(this.ticketId, newStatus);
                    notify.showSuccessToast(`Ticket status updated to ${newStatus}.`);
                    app.renderView();
                } catch (err) {
                    notify.showErrorToast("Failed to update status: " + err.message);
                } finally {
                    app.hideLoader();
                }
            });
        }
    }
};
