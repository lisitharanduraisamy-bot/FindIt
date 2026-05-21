-- ==========================================
-- FINDIT: CAMPUS LOST & FOUND PORTAL
-- SUPABASE POSTGRESQL DATABASE DDL & SETUP
-- ==========================================

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Extends the Supabase auth.users system table.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'staff', 'admin')),
    major_class TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ITEMS TABLE (Lost & Found reports)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_id TEXT UNIQUE NOT NULL, -- e.g., #LST-8902 or #FD-8921
    type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT NOT NULL,
    image_url TEXT, -- URL of uploaded image in Supabase storage bucket
    status TEXT NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'claim_pending', 'verified', 'returned')),
    reported_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CLAIMS TABLE (Ownership verification claims)
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    claimant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    ownership_explanation TEXT NOT NULL,
    identifying_characteristics TEXT NOT NULL,
    additional_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'claim_submitted', 'claim_approved', 'claim_rejected', 'status_updated'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_to TEXT, -- dynamic link to detail page e.g. '#details/item-uuid'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Items Policies
CREATE POLICY "Items are viewable by everyone" ON public.items
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert items" ON public.items
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can update their own reported items" ON public.items
    FOR UPDATE USING (auth.uid() = reported_by OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "Users can delete their own reported items" ON public.items
    FOR DELETE USING (auth.uid() = reported_by OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Claims Policies
CREATE POLICY "Claims are viewable by claimant or admins" ON public.claims
    FOR SELECT USING (auth.uid() = claimant_id OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "Authenticated users can create claims" ON public.claims
    FOR INSERT WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Only admins can update claim status" ON public.claims
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- AUTO PROFILE CREATION ON USER SIGNUP TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        CASE 
            WHEN new.email LIKE '%admin%' THEN 'admin'
            WHEN new.email LIKE '%faculty%' THEN 'faculty'
            WHEN new.email LIKE '%staff%' THEN 'staff'
            ELSE 'student'
        END,
        'https://api.dicebear.com/7.x/adventurer/svg?seed=' || new.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- SEED INITIAL STATIC CATEGORIES
-- ==========================================

INSERT INTO public.categories (name, slug, icon) VALUES
('Electronics', 'electronics', 'laptop') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.categories (name, slug, icon) VALUES
('Accessories', 'accessories', 'clock') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.categories (name, slug, icon) VALUES
('Documents', 'documents', 'id-card') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.categories (name, slug, icon) VALUES
('Clothing', 'clothing', 'tshirt') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.categories (name, slug, icon) VALUES
('Keys', 'keys', 'key') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.categories (name, slug, icon) VALUES
('Books & Stationery', 'books-stationery', 'book') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.categories (name, slug, icon) VALUES
('Others', 'others', 'box') ON CONFLICT (name) DO NOTHING;

-- Create helpful database indexes for fast query speeds
CREATE INDEX IF NOT EXISTS items_type_idx ON public.items(type);
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items(status);
CREATE INDEX IF NOT EXISTS items_category_id_idx ON public.items(category_id);
CREATE INDEX IF NOT EXISTS claims_item_id_idx ON public.claims(item_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
