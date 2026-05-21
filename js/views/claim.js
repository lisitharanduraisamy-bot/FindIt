import { db } from "../services/supabase.js";
import { notify } from "../services/notify.js";
import { getCategoryIcon } from "../utils/helpers.js";

export default {
    itemId: null,

    async render() {
        if (!this.itemId) {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Error: Claim Not Found</h3>
                    <p>No valid item reference was provided to generate a claim. Please go back.</p>
                    <a href="#browse" class="btn btn-primary mt-3">Back to Catalog</a>
                </div>
            `;
        }

        const item = await db.getItemById(this.itemId);
        if (!item) {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Error: Item Not Found</h3>
                    <p>The item you are attempting to claim does not exist.</p>
                    <a href="#browse" class="btn btn-primary mt-3">Back to Catalog</a>
                </div>
            `;
        }

        const user = db.session ? db.session.profile : null;
        if (!user) {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-user-lock" style="font-size: 48px; margin-bottom: 16px; color: var(--color-primary);"></i>
                    <h3>Authentication Required</h3>
                    <p>You must be signed in to submit an ownership claim request for this item.</p>
                    <a href="#login" class="btn btn-primary mt-3">Sign In to Continue</a>
                </div>
            `;
        }

        // Check if user is trying to claim their own reported item
        if (user.id === item.reported_by) {
            return `
                <div class="card text-center" style="padding: 48px;">
                    <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Action Not Permitted</h3>
                    <p>You cannot submit a claim request for an item you reported yourself.</p>
                    <a href="#details/${this.itemId}" class="btn btn-primary mt-3">Back to Details</a>
                </div>
            `;
        }

        const catSlug = item.categories?.slug || "others";
        const catName = item.categories?.name || "Others";
        const catIcon = getCategoryIcon(catSlug);

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Header and Back button -->
                <div>
                    <a href="#details/${this.itemId}" class="btn-link" style="padding: 0; font-weight: 700; display: flex; align-items: center; gap: 8px; width: max-content; margin-bottom: 12px;">
                        <i class="fa-solid fa-arrow-left"></i> Cancel and Return
                    </a>
                    <h2 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Submit Ownership Claim</h2>
                    <p style="font-size: 14px; color: var(--color-outline); margin-top: 4px;">Provide verifiable proof of ownership. Campus security will cross-reference this details to process your claim.</p>
                </div>

                <!-- Main Claim Layout -->
                <div class="browse-layout" style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;">
                    
                    <!-- Left Column: Verification Form -->
                    <div class="card" style="padding: 32px;">
                        <form id="form-submit-claim" style="display: flex; flex-direction: column; gap: 24px;">
                            
                            <!-- Field 1: Path & Context -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" for="claim-explanation" style="font-size: 14px;">1. Ownership Context & Timeline (Required)</label>
                                <span style="font-size: 12px; color: var(--color-outline); margin-bottom: 8px; display: block; line-height: 16px;">
                                    Describe exactly how, when, and where you lost this item. Mention classes, paths walked, or approximate times.
                                </span>
                                <textarea id="claim-explanation" class="form-textarea" required placeholder="e.g., I was studying in library Room 42 from 9 AM to 11 AM on Tuesday. I rushed out for a quiz in the Science Hall and realized my device was missing about an hour later..." style="min-height: 120px;"></textarea>
                            </div>

                            <!-- Field 2: Secret Identifiers -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" for="claim-characteristics" style="font-size: 14px;">2. Identifying Characteristics & Proof (Required)</label>
                                <span style="font-size: 12px; color: var(--color-outline); margin-bottom: 8px; display: block; line-height: 16px;">
                                    List unique attributes: serial numbers, custom case stickers, desktop wallpaper description, passwords to unlock, specific files, engravings, or receipts.
                                </span>
                                <textarea id="claim-characteristics" class="form-textarea" required placeholder="e.g., The laptop has a blue sticker of a space rocket on the lid, a scratch near the USB port. The desktop background is a photo of the campus gates. I can supply the serial ending in '82A' or unlock it in person..." style="min-height: 120px;"></textarea>
                            </div>

                            <!-- Field 3: Additional Notes -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" for="claim-notes" style="font-size: 14px;">3. Additional Notes / Recovery Details (Optional)</label>
                                <span style="font-size: 12px; color: var(--color-outline); margin-bottom: 8px; display: block; line-height: 16px;">
                                    Any secondary contact preference, questions for the desk clerk, or external proof photo URLs (e.g. drive links).
                                </span>
                                <textarea id="claim-notes" class="form-textarea" placeholder="e.g., I can bring my purchase receipt to the desk. You can also text my phone number on file for faster coordination." style="min-height: 80px;"></textarea>
                            </div>

                            <!-- Field 4: Upload Image Proof (BUG-09) -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" style="font-size: 14px;">4. Upload Proof / Supporting Photo (Optional)</label>
                                <span style="font-size: 12px; color: var(--color-outline); margin-bottom: 8px; display: block; line-height: 16px;">
                                    Upload a photo of your receipt, the original box serial number, a photo of yourself with the item, or any other visual proof.
                                </span>
                                <div class="upload-dropzone" id="claim-image-dropzone">
                                    <input type="file" id="claim-image-file" class="hidden-file-input" accept="image/*">
                                    <i class="fa-solid fa-cloud-arrow-up"></i>
                                    <div class="dropzone-text">
                                        <span class="link-text">Click to upload</span> or drag and drop
                                    </div>
                                    <span class="sub-text">SVG, PNG, JPG or GIF (max. 5MB)</span>
                                    <div id="claim-dropzone-preview" class="hidden">
                                        <span id="claim-preview-filename">image.png</span>
                                        <button type="button" id="btn-claim-remove-preview" class="btn-link text-danger">Remove</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Warning disclaimer -->
                            <div style="background-color: rgba(186, 26, 26, 0.04); border-left: 4px solid var(--color-error); padding: 16px; border-radius: var(--rounded-default); display: flex; gap: 12px; font-size: 12px; line-height: 18px; color: var(--color-on-surface-variant);">
                                <i class="fa-solid fa-triangle-exclamation" style="color: var(--color-error); font-size: 16px; margin-top: 1px;"></i>
                                <span>
                                    <strong>Legal Disclaimer:</strong> Filing false ownership claims is a violation of the University Honor Code. Doing so will result in suspension of portal access and referral to campus disciplinary committees.
                                </span>
                            </div>

                            <!-- Action Buttons -->
                            <div style="border-top: 1px solid var(--color-surface-container); padding-top: 20px; display: flex; justify-content: flex-end; gap: 16px;">
                                <a href="#details/${this.itemId}" class="btn btn-outline">Cancel</a>
                                <button type="submit" class="btn btn-primary" style="padding-left: 28px; padding-right: 28px;">
                                    <i class="fa-solid fa-paper-plane"></i> Submit Claim Request
                                </button>
                            </div>

                        </form>
                    </div>

                    <!-- Right Column: Item Sidecard -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                            <div style="height: 160px; background-color: var(--color-surface-low); overflow: hidden; display: flex; justify-content: center; align-items: center;">
                                <img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--color-primary); background-color: rgba(37, 99, 235, 0.08); padding: 4px 8px; border-radius: var(--rounded-sm); width: max-content;">
                                    <i class="${catIcon}"></i>
                                    <span>${catName}</span>
                                </div>
                                <h3 style="font-size: 15px; font-weight: 700; color: var(--color-on-surface); line-height: 20px;">${item.name}</h3>
                                <div style="border-top: 1px solid var(--color-surface-container); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--color-on-surface-variant);">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-location-dot" style="color: var(--color-outline); width: 14px; text-align: center;"></i>
                                        <span>${item.location}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-magnifying-glass" style="color: var(--color-outline); width: 14px; text-align: center;"></i>
                                        <span style="text-transform: uppercase; font-weight: bold;">REF: ${item.ref_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    attachEvents(app) {
        const dropzone = document.getElementById("claim-image-dropzone");
        const fileInput = document.getElementById("claim-image-file");
        const preview = document.getElementById("claim-dropzone-preview");
        const filename = document.getElementById("claim-preview-filename");
        const removeBtn = document.getElementById("btn-claim-remove-preview");
        let selectedFile = null;

        if (dropzone && fileInput) {
            // Drag and drop event listeners (BUG-09)
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.style.borderColor = 'var(--color-primary)';
                    dropzone.style.backgroundColor = 'var(--color-surface-container)';
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.style.borderColor = '';
                    dropzone.style.backgroundColor = '';
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files && files[0]) {
                    const file = files[0];
                    selectedFile = file;
                    filename.textContent = file.name;
                    preview.classList.remove("hidden");
                    dropzone.querySelector("i").style.display = "none";
                    dropzone.querySelector(".dropzone-text").style.display = "none";
                    dropzone.querySelector(".sub-text").style.display = "none";
                }
            });

            dropzone.addEventListener("click", (e) => {
                if (e.target !== fileInput && e.target !== removeBtn) {
                    fileInput.click();
                }
            });

            fileInput.addEventListener("change", () => {
                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    selectedFile = file;
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
                selectedFile = null;
                preview.classList.add("hidden");
                dropzone.querySelector("i").style.display = "block";
                dropzone.querySelector(".dropzone-text").style.display = "block";
                dropzone.querySelector(".sub-text").style.display = "block";
            });
        }

        const formClaim = document.getElementById("form-submit-claim");
        if (formClaim) {
            formClaim.addEventListener("submit", async (e) => {
                e.preventDefault();
                
                const explanation = document.getElementById("claim-explanation").value;
                const characteristics = document.getElementById("claim-characteristics").value;
                const notes = document.getElementById("claim-notes").value;

                app.showLoader();
                try {
                    // 1. Submit claim to DB (returns newClaim and updates item status to 'claim_pending')
                    const newClaim = await db.submitClaim({
                        item_id: this.itemId,
                        ownership_explanation: explanation,
                        identifying_characteristics: characteristics,
                        additional_notes: notes
                    }, selectedFile);

                    // Fetch item to get contact details
                    const item = await db.getItemById(this.itemId);

                    // 2. Dispatch simulated email & notification to the reporter (or Security admin if security reported)
                    await notify.sendNotificationAndEmail(item.reported_by, "claim_submitted", {
                        recipientName: item.contact_name,
                        recipientEmail: item.contact_email,
                        itemName: item.name,
                        refId: item.ref_id,
                        claimantName: db.session.profile.name,
                        claimantExplanation: explanation
                    });

                    // 3. Dispatch confirmation in-app alert and redirect
                    app.showToast("Claim submitted successfully. Security will review it shortly!", "success");
                    app.navigateTo("profile");
                } catch (err) {
                    app.showToast("Failed to submit claim: " + err.message, "error");
                } finally {
                    app.hideLoader();
                }
            });
        }
    }
};
