import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { formatDate } from "../utils/helpers.js";

export default {
    currentFilter: "All",

    async render() {
        const user = db.session ? db.session.profile : null;
        if (!user) return `<div class="card p-4 text-center">Please login to view support tickets.</div>`;

        let tickets = [];
        try {
            tickets = await db.getSupportTickets({ status: this.currentFilter });
        } catch (err) {
            console.error("Failed to fetch tickets", err);
            return `<div class="card p-4 text-center text-danger">Error loading tickets.</div>`;
        }

        const tabs = ["All", "Open", "In Review", "Resolved", "Closed"].map(tab => {
            const active = this.currentFilter === tab ? "active" : "";
            return `<button class="filter-btn ${active}" data-filter="${tab}">${tab}</button>`;
        }).join("");

        let ticketsHTML = "";
        if (tickets.length === 0) {
            ticketsHTML = `
                <div class="card text-center p-5">
                    <i class="fa-solid fa-headset text-outline mb-3" style="font-size: 48px;"></i>
                    <h3 class="font-bold text-lg mb-2">No Support Tickets</h3>
                    <p class="text-outline">You haven't opened any support tickets${this.currentFilter !== "All" ? ` in the "${this.currentFilter}" status` : ""}.</p>
                </div>
            `;
        } else {
            ticketsHTML = tickets.map(t => {
                let badgeClass = "badge-outline";
                if (t.status === "Open") badgeClass = "badge-pending"; // Yellow
                else if (t.status === "In Review") badgeClass = "badge-found"; // Blue
                else if (t.status === "Resolved") badgeClass = "badge-verified"; // Green
                else if (t.status === "Closed") badgeClass = "badge-returned"; // Gray

                return `
                    <div class="card mb-3 p-4" style="display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: transform 0.2s;" onclick="window.location.hash='#support-detail/${t.id}'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span style="font-size: 12px; font-weight: bold; color: var(--color-outline);">${t.ticket_number}</span>
                                <h3 style="font-size: 16px; font-weight: bold; color: var(--color-on-surface); margin-top: 4px;">${t.subject}</h3>
                            </div>
                            <span class="badge ${badgeClass}">${t.status}</span>
                        </div>
                        <div style="display: flex; gap: 16px; font-size: 13px; color: var(--color-on-surface-variant);">
                            <span><i class="fa-solid fa-tag"></i> ${t.category}</span>
                            <span><i class="fa-solid fa-flag"></i> ${t.priority} Priority</span>
                            <span><i class="fa-regular fa-clock"></i> ${formatDate(t.updated_at)}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface);">My Support Tickets</h1>
                        <p style="font-size: 14px; color: var(--color-outline);">Manage your technical issues, claim disputes, and support requests.</p>
                    </div>
                    <button id="btn-raise-ticket" class="btn btn-primary">
                        <i class="fa-solid fa-plus"></i>
                        <span>Raise Support Ticket</span>
                    </button>
                </div>

                <div class="filter-tabs" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;">
                    ${tabs}
                </div>

                <div>
                    ${ticketsHTML}
                </div>
            </div>
        `;
    },

    attachEvents(app) {
        document.getElementById("btn-raise-ticket")?.addEventListener("click", () => {
            app.navigateTo("support-create");
        });

        const filterBtns = document.querySelectorAll(".filter-btn");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                this.currentFilter = e.target.getAttribute("data-filter");
                app.renderView();
            });
        });
    }
};
