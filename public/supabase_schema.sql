-- ========================================================================
-- SKRIP SETUP RESMI DATABASE SUPABASE REALTIME & TABEL LENGKAP
-- SISTEM PENERIMAAN MURID BARU (SPMB) SMK LENTERA BANGSA 2
--
-- Target Project URL : https://wfdphizrtxgmyypmxvuq.supabase.co
-- Dashboard SQL Editor: https://supabase.com/dashboard/project/wfdphizrtxgmyypmxvuq/sql
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.spmb_registrations (
    id TEXT PRIMARY KEY,
    registration_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    nisn TEXT,
    nik TEXT NOT NULL,
    kk_number TEXT,
    gender TEXT,
    birth_place TEXT,
    birth_date TEXT,
    religion TEXT,
    address TEXT,
    hamlet TEXT,
    rt TEXT,
    rw TEXT,
    rt_rw TEXT,
    village TEXT,
    district TEXT,
    city TEXT DEFAULT 'Kabupaten Karawang',
    province TEXT DEFAULT 'Jawa Barat',
    phone TEXT,
    email TEXT,
    school_origin TEXT,
    graduation_year TEXT,
    average_score TEXT,
    major_first TEXT NOT NULL,
    major_second TEXT,
    father_name TEXT,
    mother_name TEXT,
    father_nik TEXT,
    mother_nik TEXT,
    father_job TEXT,
    mother_job TEXT,
    father_phone TEXT,
    mother_phone TEXT,
    living_with_status TEXT DEFAULT 'Orang Tua',
    parent_address TEXT,
    parent_job TEXT,
    parent_income TEXT,
    parent_phone TEXT,
    uniform_size TEXT,
    transport_mode TEXT,
    wave TEXT,
    status TEXT DEFAULT 'PENDING',
    status_note TEXT,
    test_score NUMERIC(5, 2) DEFAULT 0,
    interview_score NUMERIC(5, 2) DEFAULT 0,
    final_score NUMERIC(5, 2) DEFAULT 0,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN DEFAULT false,
    data_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spmb_reg_num ON public.spmb_registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_spmb_nisn ON public.spmb_registrations(nisn);
CREATE INDEX IF NOT EXISTS idx_spmb_status ON public.spmb_registrations(status);
CREATE INDEX IF NOT EXISTS idx_spmb_created_at ON public.spmb_registrations(created_at DESC);

DROP TRIGGER IF EXISTS trg_spmb_registrations_updated_at ON public.spmb_registrations;
CREATE TRIGGER trg_spmb_registrations_updated_at
BEFORE UPDATE ON public.spmb_registrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.spmb_registrations REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.spmb_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_settings',
    school_name TEXT NOT NULL DEFAULT 'SMK LENTERA BANGSA 2',
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    settings_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.spmb_settings REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.spmb_majors (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    short_desc TEXT,
    full_desc TEXT,
    quota INTEGER DEFAULT 72,
    filled_count INTEGER DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.spmb_majors REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.spmb_waves (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    benefits TEXT,
    quota INTEGER,
    fee TEXT,
    discount_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.spmb_waves REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.spmb_announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    image_url TEXT,
    published_date TEXT,
    author TEXT,
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.spmb_announcements REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public."SPMB" (
    id TEXT PRIMARY KEY,
    registration_number TEXT UNIQUE,
    data_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public."SPMB" REPLICA IDENTITY FULL;

ALTER TABLE public.spmb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SPMB" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Izin Penuh spmb_registrations" ON public.spmb_registrations;
CREATE POLICY "Izin Penuh spmb_registrations" ON public.spmb_registrations FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_settings" ON public.spmb_settings;
CREATE POLICY "Izin Penuh spmb_settings" ON public.spmb_settings FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_majors" ON public.spmb_majors;
CREATE POLICY "Izin Penuh spmb_majors" ON public.spmb_majors FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_waves" ON public.spmb_waves;
CREATE POLICY "Izin Penuh spmb_waves" ON public.spmb_waves FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_announcements" ON public.spmb_announcements;
CREATE POLICY "Izin Penuh spmb_announcements" ON public.spmb_announcements FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh SPMB Legacy" ON public."SPMB";
CREATE POLICY "Izin Penuh SPMB Legacy" ON public."SPMB" FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_registrations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_settings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_majors;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_waves;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_announcements;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
