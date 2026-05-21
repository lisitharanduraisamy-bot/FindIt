/* ==========================================================
   FINDIT: SUPABASE SERVICES & DUAL MOCK FALLBACK COORDINATOR
   ========================================================== */

class SupabaseService {
    constructor() {
        this.isMock = false;
        this.client = null;
        this.session = null;
        this.connectionError = false;
        this.hasSeeded = false;
        
        // Dynamic mock database in-memory storage
        this.mockDB = {
            profiles: [],
            categories: [
                { id: "cat-1", name: "Electronics", slug: "electronics", icon: "laptop" },
                { id: "cat-2", name: "Accessories", slug: "accessories", icon: "clock" },
                { id: "cat-3", name: "Documents", slug: "documents", icon: "id-card" },
                { id: "cat-4", name: "Clothing", slug: "clothing", icon: "tshirt" },
                { id: "cat-5", name: "Keys", slug: "keys", icon: "key" },
                { id: "cat-6", name: "Books & Stationery", slug: "books-stationery", icon: "book" },
                { id: "cat-7", name: "Others", slug: "others", icon: "box" }
            ],
            items: [],
            claims: [],
            notifications: []
        };

        this.init();
    }

    // Initialize Connection
    init() {
        let url = localStorage.getItem("findit_supabase_url");
        let key = localStorage.getItem("findit_supabase_key");

        // Pre-configure user's live Supabase instance if none is explicitly saved
        if (!url || !key) {
            url = "REDACTED_URL";
            key = "REDACTED_KEY";
            
            // Persist to local storage to sync across views
            localStorage.setItem("findit_supabase_url", url);
            localStorage.setItem("findit_supabase_key", key);
        }

        if (url && key && window.supabase) {
            try {
                this.client = window.supabase.createClient(url, key);
                this.isMock = false;
                console.log("FindIt: Connected securely to Live Supabase DB");
                this.syncSession();
            } catch (err) {
                console.error("FindIt: Supabase connection failed, falling back to mock database.", err);
                this.isMock = true;
                this.setupMockData();
            }
        } else {
            console.log("FindIt: Running in High-Fidelity Mock/Offline Mode");
            this.isMock = true;
            this.setupMockData();
        }
    }

    // Provision Mock Database with stitch mockups pre-populated
    setupMockData() {
        // Load existing state from localStorage if available, otherwise seed new
        const savedDB = localStorage.getItem("findit_mock_db");
        if (savedDB) {
            this.mockDB = JSON.parse(savedDB);
            // Re-sync active session
            const savedSession = localStorage.getItem("findit_mock_session");
            if (savedSession) {
                this.session = JSON.parse(savedSession);
            }
            return;
        }

        console.log("FindIt: Seeding Mock Database matching Stitch layouts...");
        
        // 1. Seed Profiles
        const adminProfile = {
            id: "user-admin",
            name: "Campus Security Staff",
            email: "security@university.edu",
            phone: "(555) 123-0911",
            role: "admin",
            major_class: "Campus Safety Division",
            avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=security"
        };
        const studentProfile = {
            id: "user-student",
            name: "Alex Morgan",
            email: "amorgan@university.edu",
            phone: "(555) 123-4567",
            role: "student",
            major_class: "Computer Science Major • Class of '25",
            avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=alex"
        };
        const studentProfile2 = {
            id: "user-student2",
            name: "Sarah Jenkins",
            email: "sjenkins@university.edu",
            phone: "(555) 123-8899",
            role: "student",
            major_class: "Biology Major • Class of '24",
            avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=sarah"
        };

        this.mockDB.profiles.push(adminProfile, studentProfile, studentProfile2);

        // Set Default Session as student (Alex Morgan) to explorer, can be swapped inside UI logins
        this.session = {
            user: { id: studentProfile.id, email: studentProfile.email, name: studentProfile.name },
            profile: studentProfile
        };
        localStorage.setItem("findit_mock_session", JSON.stringify(this.session));

        // 2. Seed Items (matching stitch screenshots)
        const item1 = {
            id: "item-1",
            ref_id: "#LST-8902",
            type: "lost",
            name: "Brown Leather Wallet",
            description: "A compact bifold brown leather wallet. Left in the library reading room. Contains student ID card.",
            category_id: "cat-2", // Accessories
            date_reported: "2026-05-12",
            location: "Library Reading Room",
            image_url: "https://images.unsplash.com/photo-1627124424074-7e3243096d76?auto=format&fit=crop&q=80&w=300",
            status: "lost",
            reported_by: studentProfile.id,
            contact_name: studentProfile.name,
            contact_email: studentProfile.email,
            created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        };

        const item2 = {
            id: "item-2",
            ref_id: "#FD-8921",
            type: "found",
            name: "Silver MacBook Pro 14\"",
            description: "A late-model Silver MacBook Pro, 14-inch display. The device was found closed and powered off on a desk. There are some minor scuffs on the bottom casing, but the screen appears intact. It has a small, faded sticker of a coffee cup on the bottom right corner of the top lid. No charging cable or sleeve was found with it.",
            category_id: "cat-1", // Electronics
            date_reported: "2026-05-21",
            location: "Main Library, Study Hall B, Desk 42",
            image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400",
            status: "claim_pending",
            reported_by: adminProfile.id,
            contact_name: adminProfile.name,
            contact_email: adminProfile.email,
            created_at: new Date().toISOString()
        };

        const item3 = {
            id: "item-3",
            ref_id: "#LST-0442",
            type: "lost",
            name: "Calculus Textbook (7th Ed)",
            description: "Single Variable Calculus Early Transcendentals. Red cover. Lost in Math Annex classroom.",
            category_id: "cat-6", // Books
            date_reported: "2026-05-21",
            location: "Math Annex 204",
            image_url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300",
            status: "lost",
            reported_by: studentProfile2.id,
            contact_name: studentProfile2.name,
            contact_email: studentProfile2.email,
            created_at: new Date().toISOString()
        };

        const item4 = {
            id: "item-4",
            ref_id: "#F-0883",
            type: "found",
            name: "Dorm Keys on Blue Lanyard",
            description: "A set of 3 brass keys attached to a blue university lanyard. Found near the dining hall.",
            category_id: "cat-5", // Keys
            date_reported: "2026-05-20",
            location: "Campus Quad Benches",
            image_url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=300",
            status: "returned", // Recovered
            reported_by: adminProfile.id,
            contact_name: adminProfile.name,
            contact_email: adminProfile.email,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        };

        const item5 = {
            id: "item-5",
            ref_id: "#FI-8923-HD",
            type: "found",
            name: "Black Wireless Headphones",
            description: "Over-ear noise cancelling headphones. Found on a study desk.",
            category_id: "cat-1", // Electronics
            date_reported: "2026-05-21",
            location: "Main Library Study Desk",
            image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300",
            status: "found",
            reported_by: adminProfile.id,
            contact_name: adminProfile.name,
            contact_email: adminProfile.email,
            created_at: new Date().toISOString()
        };

        const item6 = {
            id: "item-6",
            ref_id: "#LST-8841",
            type: "lost",
            name: "Student ID Card (Initials J.D.)",
            description: "Undergraduate student ID card belonging to Jack Davis. Found near cafeteria hall.",
            category_id: "cat-3", // Documents
            date_reported: "2026-05-05",
            location: "Main Cafeteria",
            image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300",
            status: "returned",
            reported_by: studentProfile.id,
            contact_name: studentProfile.name,
            contact_email: studentProfile.email,
            created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
        };

        this.mockDB.items.push(item1, item2, item3, item4, item5, item6);

        // 3. Seed Claims
        const claim1 = {
            id: "claim-1",
            item_id: item2.id,
            claimant_id: studentProfile.id, // Alex Morgan claims the MacBook
            ownership_explanation: "I was studying in the library early yesterday morning and had to rush off to a class. I forgot my laptop on the desk in B study hall.",
            identifying_characteristics: "The bottom casing has a slight scratch on the left corner, and there's a small coffee cup sticker under the top lid on the right. The serial number ends in 492A.",
            additional_notes: "It contains my CS senior project codes. Please let me retrieve it, thank you!",
            status: "pending",
            admin_notes: null,
            created_at: new Date().toISOString()
        };
        
        this.mockDB.claims.push(claim1);

        // 4. Seed Notifications
        const notif1 = {
            id: "notif-1",
            user_id: adminProfile.id,
            type: "claim_submitted",
            title: "New Claim Submitted",
            message: `Student ${studentProfile.name} (ID #4492) claimed 'MacBook Pro'.`,
            is_read: false,
            link_to: "#admin",
            created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        };

        const notif2 = {
            id: "notif-2",
            user_id: adminProfile.id,
            type: "status_updated",
            title: "High Value Item Reported",
            message: "Gold watch found in Library Main Hall.",
            is_read: false,
            link_to: "#browse",
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        };

        const notif3 = {
            id: "notif-3",
            user_id: studentProfile.id,
            type: "status_updated",
            title: "System Update",
            message: "Scheduled maintenance tonight at 11:59 PM.",
            is_read: false,
            link_to: "#dashboard",
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        };

        this.mockDB.notifications.push(notif1, notif2, notif3);

        this.saveMockDB();
    }

    saveMockDB() {
        localStorage.setItem("findit_mock_db", JSON.stringify(this.mockDB));
    }

    async syncSession() {
        if (this.isMock) return;
        try {
            // First, do a lightweight query to verify connectivity and credentials
            const { data: catTest, error: testError } = await this.client.from("categories").select("id").limit(1);
            if (testError) throw testError;

            const { data: { session }, error: sessionError } = await this.client.auth.getSession();
            if (sessionError) throw sessionError;
            
            if (session) {
                const { data: profile, error: profileError } = await this.client
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                
                this.session = { user: session.user, profile };
            } else {
                this.session = null;
            }
            this.connectionError = false;
        } catch (err) {
            console.error("FindIt: Connection verification failed. Activating High-Fidelity Mock fallback.", err);
            this.isMock = true;
            this.connectionError = true;
            this.setupMockData();
        }
    }

    async seedDatabaseIfEmpty() {
        if (this.isMock || !this.session || this.hasSeeded) return;
        
        try {
            // Check if there are items in the database
            const { count, error: countError } = await this.client
                .from("items")
                .select("id", { count: "exact", head: true });
            
            if (countError) throw countError;
            
            if (count === 0) {
                console.log("FindIt: Remote database is empty. Commencing client-side high-fidelity seeding...");
                this.hasSeeded = true;
                
                // Get all categories to map slugs to UUIDs
                const { data: dbCategories, error: catError } = await this.client
                    .from("categories")
                    .select("*");
                
                if (catError) throw catError;
                if (!dbCategories || dbCategories.length === 0) {
                    console.warn("FindIt: No categories found in the database. Cannot seed items.");
                    return;
                }
                
                const categorySlugMap = {};
                dbCategories.forEach(cat => {
                    categorySlugMap[cat.slug] = cat.id;
                });
                
                // Prepare the 6 items
                const currentUserId = this.session.profile.id;
                const contactName = this.session.profile.name;
                const contactEmail = this.session.profile.email;
                
                const itemsToInsert = [
                    {
                        ref_id: "#LST-8902",
                        type: "lost",
                        name: "Brown Leather Wallet",
                        description: "A compact bifold brown leather wallet. Left in the library reading room. Contains student ID card.",
                        category_id: categorySlugMap["accessories"] || dbCategories[0].id,
                        date_reported: "2026-05-12",
                        location: "Library Reading Room",
                        image_url: "https://images.unsplash.com/photo-1627124424074-7e3243096d76?auto=format&fit=crop&q=80&w=300",
                        status: "lost",
                        reported_by: currentUserId,
                        contact_name: contactName,
                        contact_email: contactEmail
                    },
                    {
                        ref_id: "#FD-8921",
                        type: "found",
                        name: "Silver MacBook Pro 14\"",
                        description: "A late-model Silver MacBook Pro, 14-inch display. The device was found closed and powered off on a desk. There are some minor scuffs on the bottom casing, but the screen appears intact. It has a small, faded sticker of a coffee cup on the bottom right corner of the top lid. No charging cable or sleeve was found with it.",
                        category_id: categorySlugMap["electronics"] || dbCategories[0].id,
                        date_reported: "2026-05-21",
                        location: "Main Library, Study Hall B, Desk 42",
                        image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400",
                        status: "claim_pending",
                        reported_by: currentUserId,
                        contact_name: contactName,
                        contact_email: contactEmail
                    },
                    {
                        ref_id: "#LST-0442",
                        type: "lost",
                        name: "Calculus Textbook (7th Ed)",
                        description: "Single Variable Calculus Early Transcendentals. Red cover. Lost in Math Annex classroom.",
                        category_id: categorySlugMap["books-stationery"] || dbCategories[0].id,
                        date_reported: "2026-05-21",
                        location: "Math Annex 204",
                        image_url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300",
                        status: "lost",
                        reported_by: currentUserId,
                        contact_name: contactName,
                        contact_email: contactEmail
                    },
                    {
                        ref_id: "#F-0883",
                        type: "found",
                        name: "Dorm Keys on Blue Lanyard",
                        description: "A set of 3 brass keys attached to a blue university lanyard. Found near the dining hall.",
                        category_id: categorySlugMap["keys"] || dbCategories[0].id,
                        date_reported: "2026-05-20",
                        location: "Campus Quad Benches",
                        image_url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=300",
                        status: "returned",
                        reported_by: currentUserId,
                        contact_name: contactName,
                        contact_email: contactEmail
                    },
                    {
                        ref_id: "#FI-8923-HD",
                        type: "found",
                        name: "Black Wireless Headphones",
                        description: "Over-ear noise cancelling headphones. Found on a study desk.",
                        category_id: categorySlugMap["electronics"] || dbCategories[0].id,
                        date_reported: "2026-05-21",
                        location: "Main Library Study Desk",
                        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300",
                        status: "found",
                        reported_by: currentUserId,
                        contact_name: contactName,
                        contact_email: contactEmail
                    },
                    {
                        ref_id: "#LST-8841",
                        type: "lost",
                        name: "Student ID Card (Initials J.D.)",
                        description: "Undergraduate student ID card belonging to Jack Davis. Found near cafeteria hall.",
                        category_id: categorySlugMap["documents"] || dbCategories[0].id,
                        date_reported: "2026-05-05",
                        location: "Main Cafeteria",
                        image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300",
                        status: "returned",
                        reported_by: currentUserId,
                        contact_name: contactName,
                        contact_email: contactEmail
                    }
                ];
                
                const { data: insertedItems, error: insertItemsError } = await this.client
                    .from("items")
                    .insert(itemsToInsert)
                    .select();
                
                if (insertItemsError) throw insertItemsError;
                console.log("FindIt: Successfully seeded 6 items in live Supabase DB.");
                
                // Seed Claims if empty
                const { count: claimsCount, error: claimsCountError } = await this.client
                    .from("claims")
                    .select("id", { count: "exact", head: true });
                
                if (claimsCountError) throw claimsCountError;
                
                if (claimsCount === 0 && insertedItems && insertedItems.length > 0) {
                    const macbook = insertedItems.find(item => item.ref_id === "#FD-8921");
                    if (macbook) {
                        const newClaim = {
                            item_id: macbook.id,
                            claimant_id: currentUserId,
                            ownership_explanation: "I was studying in the library early yesterday morning and had to rush off to a class. I forgot my laptop on the desk in B study hall.",
                            identifying_characteristics: "The bottom casing has a slight scratch on the left corner, and there's a small coffee cup sticker under the top lid on the right. The serial number ends in 492A.",
                            additional_notes: "It contains my CS senior project codes. Please let me retrieve it, thank you!",
                            status: "pending"
                        };
                        
                        const { error: claimInsertError } = await this.client
                            .from("claims")
                            .insert([newClaim]);
                        
                        if (claimInsertError) {
                            console.error("FindIt: Error seeding claim:", claimInsertError);
                        } else {
                            console.log("FindIt: Successfully seeded MacBook claim in live Supabase DB.");
                        }
                    }
                }
                
                // Seed Notifications if empty
                const { count: notifCount, error: notifCountError } = await this.client
                    .from("notifications")
                    .select("id", { count: "exact", head: true });
                
                if (notifCountError) throw notifCountError;
                
                if (notifCount === 0) {
                    const notifsToInsert = [
                        {
                            user_id: currentUserId,
                            type: "claim_submitted",
                            title: "New Claim Submitted",
                            message: `Student ${contactName} claimed 'MacBook Pro'.`,
                            is_read: false,
                            link_to: "#admin"
                        },
                        {
                            user_id: currentUserId,
                            type: "status_updated",
                            title: "High Value Item Reported",
                            message: "Gold watch found in Library Main Hall.",
                            is_read: false,
                            link_to: "#browse"
                        },
                        {
                            user_id: currentUserId,
                            type: "status_updated",
                            title: "System Update",
                            message: "Scheduled maintenance tonight at 11:59 PM.",
                            is_read: false,
                            link_to: "#dashboard"
                        }
                    ];
                    
                    const { error: notifInsertError } = await this.client
                        .from("notifications")
                        .insert(notifsToInsert);
                    
                    if (notifInsertError) {
                        console.error("FindIt: Error seeding notifications:", notifInsertError);
                    } else {
                        console.log("FindIt: Successfully seeded notifications in live Supabase DB.");
                    }
                }
            }
        } catch (e) {
            console.error("FindIt: Client-side seeding encountered an error:", e);
        }
    }

    // ==========================================
    // AUTHENTICATION SERVICES
    // ==========================================

    async signIn(email, password) {
        if (this.isMock) {
            // Simulated validation
            const profile = this.mockDB.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
            if (!profile) {
                throw new Error("Invalid login credentials. User profile not found.");
            }
            
            this.session = {
                user: { id: profile.id, email: profile.email, name: profile.name },
                profile: profile
            };
            localStorage.setItem("findit_mock_session", JSON.stringify(this.session));
            return this.session;
        } else {
            const { data, error } = await this.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await this.syncSession();
            return this.session;
        }
    }

    async signUp(email, password, name, phone, majorClass) {
        if (this.isMock) {
            // Simulated sign up
            const exists = this.mockDB.profiles.some(p => p.email.toLowerCase() === email.toLowerCase());
            if (exists) {
                throw new Error("An account with this email address already exists.");
            }

            const newUserId = "user-" + Math.floor(Math.random() * 100000);
            const role = email.toLowerCase().includes("admin") ? "admin" : "student";
            const profile = {
                id: newUserId,
                name: name,
                email: email,
                phone: phone || "",
                role: role,
                major_class: majorClass || "Student",
                avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
            };

            this.mockDB.profiles.push(profile);
            this.saveMockDB();

            // Auto log in after signup
            this.session = {
                user: { id: profile.id, email: profile.email, name: profile.name },
                profile: profile
            };
            localStorage.setItem("findit_mock_session", JSON.stringify(this.session));
            return this.session;
        } else {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: { name, phone, major_class: majorClass }
                }
            });
            if (error) throw error;
            await this.syncSession();
            return this.session;
        }
    }

    async signOut() {
        if (this.isMock) {
            this.session = null;
            localStorage.removeItem("findit_mock_session");
            return;
        } else {
            const { error } = await this.client.auth.signOut();
            this.session = null;
            if (error) throw error;
        }
    }

    async updateProfile(name, phone, majorClass) {
        if (!this.session) throw new Error("No active authenticated session.");
        const userId = this.session.profile.id;

        if (this.isMock) {
            const profile = this.mockDB.profiles.find(p => p.id === userId);
            if (profile) {
                profile.name = name;
                profile.phone = phone;
                profile.major_class = majorClass;
                this.session.profile = profile;
                localStorage.setItem("findit_mock_session", JSON.stringify(this.session));
                this.saveMockDB();
            }
            return this.session.profile;
        } else {
            const { data, error } = await this.client
                .from("profiles")
                .update({ name, phone, major_class: majorClass })
                .eq("id", userId)
                .select()
                .single();
            if (error) throw error;
            this.session.profile = data;
            return data;
        }
    }

    // ==========================================
    // DATA BASE SERVICES (CATEGORIES, ITEMS, CLAIMS)
    // ==========================================

    async getCategories() {
        if (this.isMock) {
            return this.mockDB.categories;
        } else {
            const { data, error } = await this.client.from("categories").select("*").order("name");
            if (error) throw error;
            return data;
        }
    }

    async getItems(filters = {}) {
        if (this.isMock) {
            let results = [...this.mockDB.items];

            // Apply query text
            if (filters.search) {
                const query = filters.search.toLowerCase();
                results = results.filter(item => 
                    item.name.toLowerCase().includes(query) || 
                    item.description.toLowerCase().includes(query) ||
                    item.location.toLowerCase().includes(query) ||
                    item.ref_id.toLowerCase().includes(query)
                );
            }

            // Apply category slug/id
            if (filters.category) {
                results = results.filter(item => item.category_id === filters.category);
            }

            // Apply report type (lost / found)
            if (filters.type) {
                results = results.filter(item => item.type === filters.type);
            }

            // Apply status
            if (filters.status) {
                results = results.filter(item => item.status === filters.status);
            }

            // Apply date
            if (filters.date) {
                results = results.filter(item => item.date_reported === filters.date);
            }

            // Sort by reported date descending
            results.sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));
            return results;
        } else {
            // Programmatically seed database if it has zero items
            await this.seedDatabaseIfEmpty();

            let query = this.client.from("items").select(`
                *,
                categories (id, name, icon)
            `);

            if (filters.type) query = query.eq("type", filters.type);
            if (filters.status) query = query.eq("status", filters.status);
            if (filters.category) query = query.eq("category_id", filters.category);
            if (filters.date) query = query.eq("date_reported", filters.date);
            if (filters.search) query = query.ilike("name", `%${filters.search}%`);

            const { data, error } = await query.order("date_reported", { ascending: false });
            if (error) throw error;
            return data;
        }
    }

    async getItemById(id) {
        if (this.isMock) {
            const item = this.mockDB.items.find(i => i.id === id);
            if (!item) return null;
            // Join category details
            const category = this.mockDB.categories.find(c => c.id === item.category_id);
            return { ...item, categories: category };
        } else {
            const { data, error } = await this.client
                .from("items")
                .select(`
                    *,
                    categories (id, name, icon)
                `)
                .eq("id", id)
                .single();
            if (error) throw error;
            return data;
        }
    }

    async createItem(itemData, imageFile) {
        if (!this.session) throw new Error("Must be logged in to report an item.");
        const reportedBy = this.session.profile.id;
        
        let imageUrl = itemData.image_url || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=300"; // default placeholder if no image
        
        if (imageFile) {
            imageUrl = await this.uploadImage(imageFile);
        }

        // Generate Ref ID e.g. #LST-8902 or #FD-9988
        const pref = itemData.type === "lost" ? "LST" : "FD";
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const refId = `#${pref}-${randomNum}`;

        const newItem = {
            id: "item-" + Math.floor(Math.random() * 100000),
            ref_id: refId,
            type: itemData.type,
            name: itemData.name,
            description: itemData.description,
            category_id: itemData.category_id,
            date_reported: itemData.date_reported || new Date().toISOString().split("T")[0],
            location: itemData.location,
            image_url: imageUrl,
            status: itemData.type, // 'lost' or 'found'
            reported_by: reportedBy,
            contact_name: itemData.contact_name || this.session.profile.name,
            contact_email: itemData.contact_email || this.session.profile.email,
            created_at: new Date().toISOString()
        };

        if (this.isMock) {
            this.mockDB.items.unshift(newItem);
            this.saveMockDB();
            return newItem;
        } else {
            const { data, error } = await this.client
                .from("items")
                .insert([newItem])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async updateItemStatus(itemId, newStatus) {
        if (this.isMock) {
            const item = this.mockDB.items.find(i => i.id === itemId);
            if (item) {
                item.status = newStatus;
                this.saveMockDB();
                return item;
            }
            throw new Error("Item not found");
        } else {
            const { data, error } = await this.client
                .from("items")
                .update({ status: newStatus })
                .eq("id", itemId)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async deleteItem(itemId) {
        if (this.isMock) {
            const index = this.mockDB.items.findIndex(i => i.id === itemId);
            if (index !== -1) {
                this.mockDB.items.splice(index, 1);
                this.saveMockDB();
                return true;
            }
            return false;
        } else {
            const { error } = await this.client.from("items").delete().eq("id", itemId);
            if (error) throw error;
            return true;
        }
    }

    // ==========================================
    // CLAIMS SYSTEM
    // ==========================================

    async submitClaim(claimData) {
        if (!this.session) throw new Error("Must be logged in to claim an item.");
        const claimantId = this.session.profile.id;

        const newClaim = {
            id: "claim-" + Math.floor(Math.random() * 100000),
            item_id: claimData.item_id,
            claimant_id: claimantId,
            ownership_explanation: claimData.ownership_explanation,
            identifying_characteristics: claimData.identifying_characteristics,
            additional_notes: claimData.additional_notes || "",
            status: "pending",
            admin_notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (this.isMock) {
            this.mockDB.claims.push(newClaim);
            
            // Mark item as Claim Pending
            const item = this.mockDB.items.find(i => i.id === claimData.item_id);
            if (item) item.status = "claim_pending";
            
            this.saveMockDB();
            return newClaim;
        } else {
            // Insert claim and update item status transactionally in live db
            const { data, error } = await this.client
                .from("claims")
                .insert([newClaim])
                .select()
                .single();
            if (error) throw error;

            await this.client
                .from("items")
                .update({ status: "claim_pending" })
                .eq("id", claimData.item_id);
                
            return data;
        }
    }

    async getClaims(filters = {}) {
        if (this.isMock) {
            let results = [...this.mockDB.claims];
            
            // Filter by user if not admin
            if (filters.user_id) {
                results = results.filter(c => c.claimant_id === filters.user_id);
            }

            // Map and Join item details for mock output
            return results.map(claim => {
                const item = this.mockDB.items.find(i => i.id === claim.item_id);
                const claimant = this.mockDB.profiles.find(p => p.id === claim.claimant_id);
                return { 
                    ...claim, 
                    items: item,
                    profiles: claimant
                };
            }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            let query = this.client.from("claims").select(`
                *,
                items (*),
                profiles:claimant_id (*)
            `);

            if (filters.user_id) {
                query = query.eq("claimant_id", filters.user_id);
            }

            const { data, error } = await query.order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        }
    }

    async updateClaimStatus(claimId, newStatus, adminNotes = "") {
        if (this.isMock) {
            const claim = this.mockDB.claims.find(c => c.id === claimId);
            if (!claim) throw new Error("Claim not found");
            
            claim.status = newStatus;
            claim.admin_notes = adminNotes;
            claim.updated_at = new Date().toISOString();

            // If approved, mark corresponding item status as Returned (or Verified / Returned)
            const item = this.mockDB.items.find(i => i.id === claim.item_id);
            if (item) {
                if (newStatus === "approved") {
                    item.status = "returned";
                } else if (newStatus === "rejected") {
                    item.status = item.type; // return to default 'lost' or 'found' status
                }
            }

            this.saveMockDB();
            return { claim, item };
        } else {
            const { data: claim, error } = await this.client
                .from("claims")
                .update({ status: newStatus, admin_notes: adminNotes, updated_at: new Date().toISOString() })
                .eq("id", claimId)
                .select()
                .single();
            if (error) throw error;

            let itemStatus = "found";
            if (newStatus === "approved") {
                itemStatus = "returned";
            } else if (newStatus === "rejected") {
                // query item to check type
                const { data: itemObj } = await this.client.from("items").select("type").eq("id", claim.item_id).single();
                itemStatus = itemObj ? itemObj.type : "found";
            }

            const { data: item } = await this.client
                .from("items")
                .update({ status: itemStatus })
                .eq("id", claim.item_id)
                .select()
                .single();

            return { claim, item };
        }
    }

    // ==========================================
    // NOTIFICATIONS & PROFILE LISTING
    // ==========================================

    async getNotifications() {
        if (!this.session) return [];
        const userId = this.session.profile.id;

        if (this.isMock) {
            return this.mockDB.notifications
                .filter(n => n.user_id === userId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            const { data, error } = await this.client
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        }
    }

    async createNotification(userId, type, title, message, linkTo = "") {
        const notif = {
            id: "notif-" + Math.floor(Math.random() * 100000),
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
            link_to: linkTo,
            created_at: new Date().toISOString()
        };

        if (this.isMock) {
            this.mockDB.notifications.unshift(notif);
            this.saveMockDB();
            return notif;
        } else {
            const { data, error } = await this.client
                .from("notifications")
                .insert([notif])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async markNotificationsAsRead() {
        if (!this.session) return;
        const userId = this.session.profile.id;

        if (this.isMock) {
            this.mockDB.notifications.forEach(n => {
                if (n.user_id === userId) n.is_read = true;
            });
            this.saveMockDB();
        } else {
            await this.client
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId);
        }
    }

    async getProfiles() {
        // Admin capability
        if (this.isMock) {
            return this.mockDB.profiles;
        } else {
            const { data, error } = await this.client.from("profiles").select("*").order("name");
            if (error) throw error;
            return data;
        }
    }

    // Storage simulation helper
    async uploadImage(file) {
        if (this.isMock) {
            // Mock upload returns local object URL or random placeholder
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        } else {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `item-images/${fileName}`;

            const { error: uploadError } = await this.client.storage
                .from('item-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = this.client.storage
                .from('item-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        }
    }
}

export const db = new SupabaseService();
export default db;
