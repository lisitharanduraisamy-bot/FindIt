/* ==========================================================
   FINDIT: ANALYTICS & METRICS DASHBOARD VIEW
   ========================================================== */

import { db } from "../services/supabase.js";

export default {
    async render() {
        const items = await db.getItems();
        
        // Calculate Statistics
        const totalLost = items.filter(i => i.type === "lost").length;
        const totalFound = items.filter(i => i.type === "found").length;
        const returnedCount = items.filter(i => i.status === "returned").length;
        const activeListings = items.filter(i => i.status !== "returned").length;
        
        // Calculate recovery rate
        const recoveryRate = items.length > 0 ? Math.round((returnedCount / (totalLost + totalFound)) * 100) : 0;

        return `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Header -->
                <div>
                    <h2 style="font-size: 28px; font-weight: 800; color: var(--color-on-surface); font-family: 'Outfit', sans-serif;">System Analytics</h2>
                    <p style="font-size: 14px; color: var(--color-outline); margin-top: 4px;">Real-time recovery metrics, hot-spot tracking, and category distribution logs across campus.</p>
                </div>

                <!-- Stats summary grid -->
                <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 8px;">
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(37, 99, 235, 0.08); color: var(--color-primary);">
                            <i class="fa-solid fa-calculator"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Total Logs</span>
                            <div class="stats-card-value">${items.length}</div>
                        </div>
                    </div>
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(22, 163, 74, 0.08); color: var(--color-status-verified);">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Recovery Rate</span>
                            <div class="stats-card-value">${recoveryRate}%</div>
                        </div>
                    </div>
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(217, 119, 6, 0.08); color: var(--color-status-pending);">
                            <i class="fa-solid fa-hourglass-half"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Active Listings</span>
                            <div class="stats-card-value">${activeListings}</div>
                        </div>
                    </div>
                    <div class="dashboard-stats-card">
                        <div class="stats-card-icon" style="background-color: rgba(71, 85, 105, 0.08); color: var(--color-status-returned);">
                            <i class="fa-solid fa-handshake-angle"></i>
                        </div>
                        <div>
                            <span class="stats-card-label">Returned Items</span>
                            <div class="stats-card-value">${returnedCount}</div>
                        </div>
                    </div>
                </div>

                <!-- Graphic Canvas Panel -->
                <div class="browse-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    
                    <!-- Card 1: Category Distribution -->
                    <div class="card" style="padding: 24px;">
                        <h3 class="card-title">Category Distribution</h3>
                        <div style="position: relative; height: 300px; width: 100%;">
                            <canvas id="chart-categories"></canvas>
                        </div>
                    </div>

                    <!-- Card 2: Status Breakdown -->
                    <div class="card" style="padding: 24px;">
                        <h3 class="card-title">Success Trends (Returned vs Active)</h3>
                        <div style="position: relative; height: 300px; width: 100%;">
                            <canvas id="chart-trends"></canvas>
                        </div>
                    </div>

                    <!-- Card 3: Hotspots Grid -->
                    <div class="card" style="grid-column: 1 / -1; padding: 24px;">
                        <h3 class="card-title">Campus Hotspot Locations</h3>
                        <div style="position: relative; height: 260px; width: 100%;">
                            <canvas id="chart-hotspots"></canvas>
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    async attachEvents(app) {
        const items = await db.getItems();
        const categories = await db.getCategories();

        // 1. Compute Category Counts
        const categoryMap = {};
        categories.forEach(c => categoryMap[c.id] = { name: c.name, count: 0 });
        items.forEach(item => {
            if (categoryMap[item.category_id]) {
                categoryMap[item.category_id].count++;
            }
        });
        const categoryLabels = Object.values(categoryMap).map(c => c.name);
        const categoryCounts = Object.values(categoryMap).map(c => c.count);

        // 2. Compute Status breakdown
        const statuses = { "lost": 0, "found": 0, "claim_pending": 0, "returned": 0 };
        items.forEach(item => {
            if (statuses[item.status] !== undefined) {
                statuses[item.status]++;
            }
        });

        // 3. Compute Location Hotspots
        const locationMap = {};
        items.forEach(item => {
            const cleanLoc = item.location.split(',')[0].trim(); // aggregate first component
            locationMap[cleanLoc] = (locationMap[cleanLoc] || 0) + 1;
        });
        // Sort locations by reported count descending
        const sortedLocations = Object.entries(locationMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
        const locationLabels = sortedLocations.map(l => l[0]);
        const locationCounts = sortedLocations.map(l => l[1]);

        // Render Chart.js instances securely
        if (window.Chart) {
            // Doughnut: Category Distribution
            const ctxCat = document.getElementById('chart-categories')?.getContext('2d');
            if (ctxCat) {
                new Chart(ctxCat, {
                    type: 'doughnut',
                    data: {
                        labels: categoryLabels,
                        datasets: [{
                            data: categoryCounts,
                            backgroundColor: [
                                '#2563eb', // Blue
                                '#3b82f6', // Bright Blue
                                '#60a5fa', // Light Blue
                                '#f59e0b', // Amber
                                '#10b981', // Emerald
                                '#ec4899', // Pink
                                '#6b7280'  // Gray
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    font: { family: 'Outfit', size: 12 },
                                    boxWidth: 12
                                }
                            }
                        }
                    }
                });
            }

            // Pie: Success Trends
            const ctxTrend = document.getElementById('chart-trends')?.getContext('2d');
            if (ctxTrend) {
                new Chart(ctxTrend, {
                    type: 'pie',
                    data: {
                        labels: ['Lost Active', 'Found Active', 'Claim Pending', 'Recovered Successfully'],
                        datasets: [{
                            data: [statuses.lost, statuses.found, statuses.claim_pending, statuses.returned],
                            backgroundColor: [
                                '#ef4444', // Red
                                '#3b82f6', // Blue
                                '#f59e0b', // Amber
                                '#16a34a'  // Green
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    font: { family: 'Outfit', size: 12 },
                                    boxWidth: 12
                                }
                            }
                        }
                    }
                });
            }

            // Horizontal Bar: Hotspots
            const ctxHot = document.getElementById('chart-hotspots')?.getContext('2d');
            if (ctxHot) {
                new Chart(ctxHot, {
                    type: 'bar',
                    data: {
                        labels: locationLabels,
                        datasets: [{
                            label: 'Reports Filed',
                            data: locationCounts,
                            backgroundColor: '#2563eb',
                            borderRadius: 4,
                            barThickness: 16
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { font: { family: 'Inter', size: 11 } }
                            },
                            y: {
                                grid: { display: false },
                                ticks: { font: { family: 'Inter', size: 11 } }
                            }
                        }
                    }
                });
            }
        }
    }
};
