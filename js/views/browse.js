/* ==========================================================
   FINDIT: CATALOG BROWSE & FILTER VIEW WITH LIFECYCLE TIMELINES
   ========================================================== */

import { db } from "../services/supabase.js";
import { getCategoryIcon, formatDate, truncateText } from "../utils/helpers.js";

export default {
    // Component State
    filters: {
        search: "",
        category: "",
        type: "",
        status: "",
        date: "",
        sort: "date_desc", // Feature 2
        location: "" // Feature 3
    },

    async render() {
        // Fetch all categories and filtered items
        const categories = await db.getCategories();
        let items = await db.getItems(this.filters);

        // Apply Location Cluster Filter client-side if active (Feature 3)
        if (this.filters.location) {
            const locQuery = this.filters.location.toLowerCase();
            items = items.filter(item => 
                item.location.toLowerCase().includes(locQuery)
            );
        }

        // Render Category Dropdown options
        const categoryOptions = categories.map(cat => `
            <option value="${cat.id}" ${this.filters.category === cat.id ? 'selected' : ''}>
                ${cat.name}
            </option>
        `).join("");

        // Render Cards Grid with Mini Lifecycle Timelines (Feature 5)
        let itemsGridHTML = "";
        if (items.length === 0) {
            itemsGridHTML = `
                <div class="empty-state card" style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--color-outline);">
                    <i class="fa-regular fa-folder-open" style="font-size: 48px; margin-bottom: 16px; color: var(--color-outline-variant);"></i>
                    <h3 style="font-size: 16px; font-weight: 700; color: var(--color-on-surface); margin-bottom: 8px;">No matching items found</h3>
                    <p style="font-size: 13px; max-width: 320px; margin: 0 auto;">Try adjusting your keywords, locations, or status filters to expand your search results.</p>
                </div>
            `;
        } else {
            itemsGridHTML = items.map(item => {
                let badgeClass = "badge-lost";
                if (item.status === "found") badgeClass = "badge-found";
                if (item.status === "claim_pending") badgeClass = "badge-pending";
                if (item.status === "returned") badgeClass = "badge-returned";

                // Resolve category slug
                const catSlug = item.categories?.slug || "others";
                const catName = item.categories?.name || "Others";
                const catIcon = getCategoryIcon(catSlug);

                // Setup timeline status widths
                let timelineWidth = "0%";
                if (item.status === "claim_pending") timelineWidth = "50%";
                else if (item.status === "returned") timelineWidth = "100%";

                return `
                    <div class="card item-explorer-card" data-id="${item.id}" style="cursor: pointer; display: flex; flex-direction: column; overflow: hidden; padding: 0; position: relative;">
                        <!-- Card Cover Image -->
                        <div style="height: 180px; width: 100%; position: relative; background-color: var(--color-surface-low); overflow: hidden;">
                            <img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
                            <span class="badge ${badgeClass}" style="position: absolute; top: 12px; right: 12px; box-shadow: var(--shadow-sm);">
                                <span class="badge-dot-indicator"></span>
                                <span>${item.status === 'returned' ? 'recovered' : item.status}</span>
                            </span>
                        </div>
                        
                        <!-- Card Body -->
                        <div style="padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 12px;">
                            <!-- Category Pill -->
                            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--color-primary); background-color: rgba(37, 99, 235, 0.08); padding: 4px 8px; border-radius: var(--rounded-sm); width: max-content;">
                                <i class="${catIcon}"></i>
                                <span>${catName}</span>
                            </div>
                            
                            <!-- Title & Ref ID -->
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <h3 style="font-size: 16px; font-weight: 700; color: var(--color-on-surface); line-height: 20px; font-family: 'Outfit', sans-serif;">${truncateText(item.name, 35)}</h3>
                                <span style="font-size: 11px; color: var(--color-outline); font-weight: bold; text-transform: uppercase;">REF: ${item.ref_id}</span>
                            </div>
                            
                            <!-- Description (Truncated) -->
                            <p style="font-size: 13px; color: var(--color-on-surface-variant); line-height: 18px; flex: 1;">
                                ${truncateText(item.description, 70)}
                            </p>

                            <!-- Mini Lifecycle Timeline (Feature 5) -->
                            <div style="margin: 8px 0; background: var(--color-surface-low); padding: 8px 12px; border-radius: var(--rounded-sm); border: 1px solid var(--color-surface-container);">
                                <div style="position: relative; height: 4px; background: var(--color-surface-container); border-radius: 2px; margin-bottom: 6px;">
                                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${timelineWidth}; background: var(--color-primary); border-radius: 2px; transition: width 0.3s ease;"></div>
                                    <!-- Dot 1 -->
                                    <div style="position: absolute; left: 0; top: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);"></div>
                                    <!-- Dot 2 -->
                                    <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: ${item.status === 'claim_pending' || item.status === 'returned' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}; border: 1px solid #ffffff;"></div>
                                    <!-- Dot 3 -->
                                    <div style="position: absolute; right: 0; top: 50%; transform: translate(50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: ${item.status === 'returned' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}; border: 1px solid #ffffff;"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.02em;">
                                    <span style="color: var(--color-primary);">Reported</span>
                                    <span style="color: ${item.status === 'claim_pending' || item.status === 'returned' ? 'var(--color-on-surface)' : 'var(--color-outline)'};">In Review</span>
                                    <span style="color: ${item.status === 'returned' ? 'var(--color-primary)' : 'var(--color-outline)'};">Returned</span>
                                </div>
                            </div>
                            
                            <!-- Location and Date Metadata -->
                            <div style="border-top: 1px solid var(--color-surface-container); padding-top: 12px; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--color-on-surface-variant);">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-location-dot" style="color: var(--color-outline); width: 14px; text-align: center;"></i>
                                    <span>${item.location}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-regular fa-clock" style="color: var(--color-outline); width: 14px; text-align: center;"></i>
                                    <span>${formatDate(item.date_reported)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Header Title -->
                <div>
                    <h2 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">Browse Catalog</h2>
                    <p style="font-size: 14px; color: var(--color-outline); margin-top: 4px;">Explore, filter, and search all lost and found reports submitted on campus.</p>
                </div>

                <!-- Catalog Explorer Layout -->
                <div class="browse-layout" style="display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start;">
                    
                    <!-- Filters Sidebar -->
                    <aside class="card" style="padding: 24px; position: sticky; top: 96px; display: flex; flex-direction: column; gap: 20px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-surface-container); padding-bottom: 12px;">
                            <h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-sliders" style="color: var(--color-primary);"></i>
                                <span>Filter By</span>
                            </h3>
                            <button id="btn-reset-filters" class="btn-link" style="font-size: 12px; font-weight: 600; padding: 0;">Reset All</button>
                        </div>
                        
                        <!-- Search input inside filter sidebar -->
                        <div class="form-group">
                            <label class="form-label" for="filter-search-box">Keywords</label>
                            <input type="text" id="filter-search-box" class="form-input" placeholder="Search by name, tags..." value="${this.filters.search}">
                        </div>

                        <!-- Sort dropdown (Feature 2) -->
                        <div class="form-group">
                            <label class="form-label" for="filter-sort">Sort Order</label>
                            <select id="filter-sort" class="form-input" style="cursor: pointer;">
                                <option value="date_desc" ${this.filters.sort === 'date_desc' ? 'selected' : ''}>Date Reported: Newest</option>
                                <option value="date_asc" ${this.filters.sort === 'date_asc' ? 'selected' : ''}>Date Reported: Oldest</option>
                                <option value="name_asc" ${this.filters.sort === 'name_asc' ? 'selected' : ''}>Item Name: A-Z</option>
                                <option value="name_desc" ${this.filters.sort === 'name_desc' ? 'selected' : ''}>Item Name: Z-A</option>
                                <option value="location_asc" ${this.filters.sort === 'location_asc' ? 'selected' : ''}>Location: A-Z</option>
                            </select>
                        </div>

                        <!-- Report Type Selection -->
                        <div class="form-group">
                            <label class="form-label" for="filter-type">Report Type</label>
                            <select id="filter-type" class="form-input">
                                <option value="" ${this.filters.type === '' ? 'selected' : ''}>All Reports</option>
                                <option value="lost" ${this.filters.type === 'lost' ? 'selected' : ''}>Lost Items</option>
                                <option value="found" ${this.filters.type === 'found' ? 'selected' : ''}>Found Items</option>
                            </select>
                        </div>

                        <!-- Category Filter -->
                        <div class="form-group">
                            <label class="form-label" for="filter-category">Category</label>
                            <select id="filter-category" class="form-input">
                                <option value="">All Categories</option>
                                ${categoryOptions}
                            </select>
                        </div>

                        <!-- Status Filter -->
                        <div class="form-group">
                            <label class="form-label" for="filter-status">Item Status</label>
                            <select id="filter-status" class="form-input">
                                <option value="" ${this.filters.status === '' ? 'selected' : ''}>All Statuses</option>
                                <option value="lost" ${this.filters.status === 'lost' ? 'selected' : ''}>Lost</option>
                                <option value="found" ${this.filters.status === 'found' ? 'selected' : ''}>Found</option>
                                <option value="claim_pending" ${this.filters.status === 'claim_pending' ? 'selected' : ''}>Claim Pending</option>
                                <option value="returned" ${this.filters.status === 'returned' ? 'selected' : ''}>Recovered</option>
                            </select>
                        </div>

                        <!-- Date Filter -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" for="filter-date">Date Reported</label>
                            <input type="date" id="filter-date" class="form-input" value="${this.filters.date}">
                        </div>
                    </aside>

                    <!-- Items Catalog View Grid -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <!-- Location Cluster Grouping Pill Bar (Feature 3) -->
                        <div style="background-color: var(--color-surface-low); border: 1px solid var(--color-surface-container); border-radius: var(--rounded-md); padding: 16px 20px;">
                            <span style="font-size: 11px; font-weight: 800; color: var(--color-outline); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">
                                <i class="fa-solid fa-map-location-dot" style="color: var(--color-primary); margin-right: 4px;"></i> Location Cluster Pills
                            </span>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="location-cluster-pills">
                                <button type="button" class="location-pill" data-location="" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 100px; border: 1px solid ${!this.filters.location ? 'var(--color-primary)' : 'var(--color-surface-container)'}; background-color: ${!this.filters.location ? 'var(--color-primary)' : 'var(--color-surface-high)'}; color: ${!this.filters.location ? '#ffffff' : 'var(--color-on-surface)'}; cursor: pointer; transition: all 0.2s;">
                                    All Clusters
                                </button>
                                <button type="button" class="location-pill" data-location="Library" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 100px; border: 1px solid ${this.filters.location === 'Library' ? 'var(--color-primary)' : 'var(--color-surface-container)'}; background-color: ${this.filters.location === 'Library' ? 'var(--color-primary)' : 'var(--color-surface-high)'}; color: ${this.filters.location === 'Library' ? '#ffffff' : 'var(--color-on-surface)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-book" style="font-size: 11px;"></i> Library
                                </button>
                                <button type="button" class="location-pill" data-location="Gym" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 100px; border: 1px solid ${this.filters.location === 'Gym' ? 'var(--color-primary)' : 'var(--color-surface-container)'}; background-color: ${this.filters.location === 'Gym' ? 'var(--color-primary)' : 'var(--color-surface-high)'}; color: ${this.filters.location === 'Gym' ? '#ffffff' : 'var(--color-on-surface)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-dumbbell" style="font-size: 11px;"></i> Gym
                                </button>
                                <button type="button" class="location-pill" data-location="Cafeteria" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 100px; border: 1px solid ${this.filters.location === 'Cafeteria' ? 'var(--color-primary)' : 'var(--color-surface-container)'}; background-color: ${this.filters.location === 'Cafeteria' ? 'var(--color-primary)' : 'var(--color-surface-high)'}; color: ${this.filters.location === 'Cafeteria' ? '#ffffff' : 'var(--color-on-surface)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-utensils" style="font-size: 11px;"></i> Cafeteria
                                </button>
                                <button type="button" class="location-pill" data-location="Science" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 100px; border: 1px solid ${this.filters.location === 'Science' ? 'var(--color-primary)' : 'var(--color-surface-container)'}; background-color: ${this.filters.location === 'Science' ? 'var(--color-primary)' : 'var(--color-surface-high)'}; color: ${this.filters.location === 'Science' ? '#ffffff' : 'var(--color-on-surface)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-flask" style="font-size: 11px;"></i> Science Quad
                                </button>
                                <button type="button" class="location-pill" data-location="Quad" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 100px; border: 1px solid ${this.filters.location === 'Quad' ? 'var(--color-primary)' : 'var(--color-surface-container)'}; background-color: ${this.filters.location === 'Quad' ? 'var(--color-primary)' : 'var(--color-surface-high)'}; color: ${this.filters.location === 'Quad' ? '#ffffff' : 'var(--color-on-surface)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-tree" style="font-size: 11px;"></i> Campus Quad
                                </button>
                            </div>
                        </div>

                        <!-- Results Count bar -->
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px; font-weight: 600; color: var(--color-on-surface-variant);">
                                Showing ${items.length} item${items.length === 1 ? '' : 's'} found
                            </span>
                        </div>

                        <!-- Card Grid container -->
                        <div class="catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
                            ${itemsGridHTML}
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    attachEvents(app) {
        // Link filter UI to state and reload view
        const getVal = (id) => document.getElementById(id)?.value || "";

        const refreshFilters = () => {
            this.filters.search = getVal("filter-search-box");
            this.filters.type = getVal("filter-type");
            this.filters.category = getVal("filter-category");
            this.filters.status = getVal("filter-status");
            this.filters.date = getVal("filter-date");
            this.filters.sort = getVal("filter-sort"); // Feature 2
            app.renderView();
        };

        // Form listeners
        document.getElementById("filter-search-box")?.addEventListener("input", (e) => {
            this.filters.search = e.target.value;
            // Delay render slightly on key typing (debounce)
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                app.renderView();
            }, 300);
        });

        document.getElementById("filter-type")?.addEventListener("change", refreshFilters);
        document.getElementById("filter-category")?.addEventListener("change", refreshFilters);
        document.getElementById("filter-status")?.addEventListener("change", refreshFilters);
        document.getElementById("filter-date")?.addEventListener("change", refreshFilters);
        document.getElementById("filter-sort")?.addEventListener("change", refreshFilters); // Feature 2

        // --- LOCATION PILLS TRIGGERS (Feature 3) ---
        const locationPills = document.querySelectorAll("#location-cluster-pills .location-pill");
        locationPills.forEach(pill => {
            pill.addEventListener("click", () => {
                const targetLoc = pill.getAttribute("data-location");
                this.filters.location = targetLoc;
                app.renderView();
            });
        });

        // Reset Filter Trigger
        document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
            this.filters = {
                search: "",
                category: "",
                type: "",
                status: "",
                date: "",
                sort: "date_desc",
                location: ""
            };
            app.renderView();
        });

        // Click card explorer to redirect to details view
        const cards = document.querySelectorAll(".item-explorer-card");
        cards.forEach(card => {
            card.addEventListener("click", () => {
                const itemId = card.getAttribute("data-id");
                app.navigateTo(`details/${itemId}`);
            });
        });
    }
};
