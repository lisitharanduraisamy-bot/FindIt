import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";

export default {
    async render() {
        const user = db.session ? db.session.profile : null;
        if (!user) return `<div class="card p-4 text-center">Please login to create a support ticket.</div>`;

        return `
            <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <button class="btn btn-outline" style="padding: 8px 12px;" onclick="window.location.hash='#support-list'">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 style="font-size: 24px; font-weight: 800; color: var(--color-on-surface);">Raise Support Ticket</h1>
                        <p style="font-size: 14px; color: var(--color-outline);">Submit an issue and our team will assist you shortly.</p>
                    </div>
                </div>

                <div class="card" style="padding: 32px;">
                    <form id="form-create-ticket" style="display: flex; flex-direction: column; gap: 20px;">
                        
                        <div class="form-group">
                            <label class="form-label">Subject</label>
                            <input type="text" id="ticket-subject" class="form-control" placeholder="Brief description of the issue..." required>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select id="ticket-category" class="form-control" required>
                                    <option value="">Select a category</option>
                                    <option value="Lost Item Issue">Lost Item Issue</option>
                                    <option value="Found Item Issue">Found Item Issue</option>
                                    <option value="Claim Issue">Claim Issue</option>
                                    <option value="Report Issue">Report Issue</option>
                                    <option value="Account Issue">Account Issue</option>
                                    <option value="General Support">General Support</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Priority</label>
                                <select id="ticket-priority" class="form-control" required>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Detailed Description</label>
                            <textarea id="ticket-description" class="form-control" rows="5" placeholder="Please provide as much detail as possible to help us investigate the issue..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Attachment (Optional)</label>
                            <div id="ticket-dropzone" style="border: 2px dashed var(--color-outline-variant); border-radius: var(--rounded-lg); padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                <i class="fa-solid fa-cloud-arrow-up" style="font-size: 32px; color: var(--color-primary); margin-bottom: 12px;"></i>
                                <div style="font-weight: bold; color: var(--color-on-surface);">Click to upload screenshot</div>
                                <div style="font-size: 12px; color: var(--color-outline);">JPG, PNG up to 5MB</div>
                                <input type="file" id="ticket-file" style="display: none;" accept="image/*">
                            </div>
                            <div id="ticket-file-preview" style="display: none; margin-top: 12px;">
                                <img id="ticket-preview-img" src="" alt="Preview" style="max-width: 100%; border-radius: var(--rounded-md); max-height: 200px; object-fit: contain;">
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px;">
                            <button type="button" class="btn btn-outline" onclick="window.location.hash='#support-list'">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fa-solid fa-paper-plane"></i> Submit Ticket
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    attachEvents(app) {
        const form = document.getElementById("form-create-ticket");
        const dropzone = document.getElementById("ticket-dropzone");
        const fileInput = document.getElementById("ticket-file");
        const previewDiv = document.getElementById("ticket-file-preview");
        const previewImg = document.getElementById("ticket-preview-img");
        let selectedFile = null;

        if (dropzone && fileInput) {
            dropzone.addEventListener("click", () => fileInput.click());
            
            fileInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files[0]) {
                    selectedFile = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImg.src = e.target.result;
                        previewDiv.style.display = "block";
                        dropzone.style.display = "none";
                    }
                    reader.readAsDataURL(selectedFile);
                }
            });
        }

        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                
                const subject = document.getElementById("ticket-subject").value;
                const category = document.getElementById("ticket-category").value;
                const priority = document.getElementById("ticket-priority").value;
                const description = document.getElementById("ticket-description").value;

                app.showLoader();
                try {
                    let attachmentUrl = null;
                    if (selectedFile) {
                        attachmentUrl = await db.uploadImage(selectedFile);
                    }
                    
                    await db.createSupportTicket(subject, category, priority, description, attachmentUrl);
                    
                    notify.showSuccessToast("Support ticket submitted successfully!");
                    app.navigateTo("support-list");
                } catch (err) {
                    notify.showErrorToast("Failed to submit ticket: " + err.message);
                } finally {
                    app.hideLoader();
                }
            });
        }
    }
};
