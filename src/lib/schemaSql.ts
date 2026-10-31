/**
 * SKRIP RESMI DATABASE SUPABASE DENGAN REALTIME LENGKAP
 * Target Supabase Project: https://wfdphizrtxgmyypmxvuq.supabase.co
 */

export const SUPABASE_SQL_SCHEMA = `-- ========================================================================
-- SKRIP SETUP RESMI DATABASE SUPABASE REALTIME & TABEL LENGKAP
-- SISTEM PENERIMAAN MURID BARU (SPMB) SMK LENTERA BANGSA 2
--
-- Target Project URL : https://wfdphizrtxgmyypmxvuq.supabase.co
-- Dashboard SQL Editor: https://supabase.com/dashboard/project/wfdphizrtxgmyypmxvuq/sql
-- ========================================================================

-- 0. EKSTENSI DATABASE (UUID & PGCRYPTO)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fungsi Helper Otomatis: Update kolom updated_at saat data berubah
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 1. TABEL PENDAFTARAN SISWA BARU (spmb_registrations)
-- Menyimpan identitas siswa, No. KK & NIK terpisah, pemisahan alamat lengkap,
-- 10 data orang tua/wali baru, status seleksi, dan payload JSON lengkap.
-- ========================================================================
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

-- Indeks pencarian cepat
CREATE INDEX IF NOT EXISTS idx_spmb_reg_num ON public.spmb_registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_spmb_nisn ON public.spmb_registrations(nisn);
CREATE INDEX IF NOT EXISTS idx_spmb_status ON public.spmb_registrations(status);
CREATE INDEX IF NOT EXISTS idx_spmb_created_at ON public.spmb_registrations(created_at DESC);

-- Trigger auto-update updated_at
DROP TRIGGER IF EXISTS trg_spmb_registrations_updated_at ON public.spmb_registrations;
CREATE TRIGGER trg_spmb_registrations_updated_at
BEFORE UPDATE ON public.spmb_registrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Full replica identity agar event realtime UPDATE & DELETE mengirimkan data lengkap
ALTER TABLE public.spmb_registrations REPLICA IDENTITY FULL;

-- ========================================================================
-- 2. TABEL PENGATURAN SEKOLAH & SPMB (spmb_settings)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.spmb_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_settings',
    school_name TEXT NOT NULL DEFAULT 'SMK LENTERA BANGSA 2',
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    settings_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.spmb_settings REPLICA IDENTITY FULL;

-- ========================================================================
-- 3. TABEL PROGRAM KEAHLIAN / JURUSAN (spmb_majors)
-- ========================================================================
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

-- ========================================================================
-- 4. TABEL GELOMBANG PENDAFTARAN (spmb_waves)
-- ========================================================================
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

-- ========================================================================
-- 5. TABEL PENGUMUMAN RESMI SPMB (spmb_announcements)
-- ========================================================================
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

-- ========================================================================
-- 6. TABEL KOMPATIBILITAS LEGACY ("SPMB")
-- ========================================================================
CREATE TABLE IF NOT EXISTS public."SPMB" (
    id TEXT PRIMARY KEY,
    registration_number TEXT UNIQUE,
    data_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."SPMB" REPLICA IDENTITY FULL;

-- ========================================================================
-- 7. KEBIJAKAN KEAMANAN ROW LEVEL SECURITY (RLS)
-- Aktifkan RLS dan berikan akses penuh untuk anon, authenticated, dan service_role
-- agar calon pendaftar dapat mengisi form langsung dari web tanpa wajib login.
-- ========================================================================
ALTER TABLE public.spmb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SPMB" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Izin Penuh spmb_registrations" ON public.spmb_registrations;
CREATE POLICY "Izin Penuh spmb_registrations"
ON public.spmb_registrations FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_settings" ON public.spmb_settings;
CREATE POLICY "Izin Penuh spmb_settings"
ON public.spmb_settings FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_majors" ON public.spmb_majors;
CREATE POLICY "Izin Penuh spmb_majors"
ON public.spmb_majors FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_waves" ON public.spmb_waves;
CREATE POLICY "Izin Penuh spmb_waves"
ON public.spmb_waves FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh spmb_announcements" ON public.spmb_announcements;
CREATE POLICY "Izin Penuh spmb_announcements"
ON public.spmb_announcements FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Izin Penuh SPMB Legacy" ON public."SPMB";
CREATE POLICY "Izin Penuh SPMB Legacy"
ON public."SPMB" FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- ========================================================================
-- 8. AKTIFKAN SUPABASE REALTIME (PUBLIKASI)
-- Mengizinkan sinkronisasi realtime otomatis saat pendaftaran masuk/diubah.
-- ========================================================================
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

-- ========================================================================
-- 9. DATA AWAL (SEED DATA DEFAULT)
-- ========================================================================

-- A. Data Jurusan
INSERT INTO public.spmb_majors (id, code, name, short_desc, full_desc, quota, filled_count, color, icon)
VALUES
('rpl', 'PPLG / RPL', 'Pengembangan Perangkat Lunak & Gim', 'Pemrograman web, aplikasi mobile Android/iOS, AI prompting, dan rekayasa perangkat lunak modern.', 'Program keahlian unggulan berstandar industri software, cloud computing, frontend & backend development, database, serta game engine.', 72, 38, 'from-blue-600 to-indigo-600', 'Code2'),
('tkj', 'TJKT / TKJ', 'Teknik Jaringan Komputer & Telekomunikasi', 'Infrastruktur jaringan fiber optic, administrasi server Linux, cloud, dan cyber security.', 'Mencetak teknisi andal dalam merancang, menginstalasi, dan mengamankan jaringan komputer enterprise, router Mikrotik & Cisco, VoIP, dan cloud.', 72, 42, 'from-cyan-600 to-teal-600', 'Network'),
('tkro', 'TO / TKRO', 'Teknik Kendaraan Ringan Otomotif', 'Teknologi injeksi EFI, kelistrikan kendaraan, diagnosis scan tools komputer, dan mobil listrik (EV).', 'Bekerjasama dengan ATPM terkemuka membekali calon teknisi profesional dengan keahlian engine tune-up, overhaul transmisi otomatis, dan AC mobil.', 108, 65, 'from-amber-600 to-orange-600', 'Wrench'),
('dkv', 'DKV', 'Desain Komunikasi Visual', 'Kreativitas grafis, branding, fotografi komersial, motion graphics, dan videografi digital.', 'Menyiapkan talenta kreatif di era digital yang piawai dalam perancangan identitas visual, kampanye periklanan, packaging, dan video sinematik.', 72, 31, 'from-purple-600 to-pink-600', 'Palette'),
('mplb', 'MPLB / OTKP', 'Manajemen Perkantoran & Layanan Bisnis', 'Administrasi perkantoran digital modern, keprotokolan, kearsipan elektronik, dan public relations.', 'Mencetak tenaga administrasi profesional yang cakap dalam pengelolaan korespondensi digital, automasi kantor, dan customer relation management.', 72, 29, 'from-emerald-600 to-teal-700', 'Briefcase'),
('akl', 'AKL', 'Akuntansi & Keuangan Lembaga', 'Akuntansi keuangan berbasis software komputer (MYOB/Accurate), perpajakan, dan fintech perbankan.', 'Lulusan menguasai penyusunan laporan keuangan standar PSAK, audit pembukuan, spreadsheet akuntansi lanjut, dan layanan perbankan.', 72, 26, 'from-rose-600 to-red-600', 'Coins')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    quota = EXCLUDED.quota;

-- B. Data Gelombang Pendaftaran
INSERT INTO public.spmb_waves (id, name, start_date, end_date, is_active, benefits, quota, fee, discount_note)
VALUES
('wave-1', 'Gelombang 1 (Jalur Prestasi & Minat)', '2026-01-01', '2026-02-28', true, 'Diskon Biaya Seragam 50% + Bebas Biaya Pendaftaran + Prioritas Jurusan Utama', 200, 'Gratis Biaya Pendaftaran', 'Potongan DPP Rp 500.000'),
('wave-2', 'Gelombang 2 (Jalur Reguler)', '2026-03-01', '2026-05-31', false, 'Subsidi SPP Bulan Pertama + Paket Modul & Jas Almamater Lengkap', 150, 'Rp 150.000', 'Potongan Uang Praktik 25%'),
('wave-3', 'Gelombang 3 (Jalur Kuota Terakhir)', '2026-06-01', '2026-07-10', false, 'Pendaftaran Terakhir Selama Sisa Kuota Jurusan Masih Tersedia', 100, 'Rp 200.000', 'Reguler Sesuai Ketentuan')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

-- C. Data Pengumuman
INSERT INTO public.spmb_announcements (id, title, category, content, image_url, published_date, author, is_pinned, is_active)
VALUES
('ann-1', 'Pembukaan Pendaftaran Gelombang 1 SPMB 2026/2027 Resmi Dimulai!', 'PENTING', 'Pendaftaran Murid Baru SMK Lentera Bangsa 2 Tahun Ajaran 2026/2027 telah resmi dibuka untuk semua program keahlian unggulan. Dapatkan subsidi seragam praktik 50% dan pembebasan biaya formulir bagi 100 pendaftar pertama pada Gelombang 1.', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80', '2026-01-02', 'Ketua Panitia SPMB', true, true),
('ann-2', 'Jadwal Tes Minat Bakat & Wawancara Pemilihan Jurusan', 'JADWAL_TES', 'Bagi seluruh calon peserta yang telah melengkapi data registrasi, tes minat bakat peminatan jurusan diselenggarakan setiap hari Sabtu pukul 08.30 - 12.00 WIB di Aula Kampus LB2. Peserta diharapkan membawa lembar formulir pendaftaran A4.', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80', '2026-01-10', 'Panitia Seleksi Akademik', false, true)
ON CONFLICT (id) DO NOTHING;

-- D. Data Pengaturan Sekolah
INSERT INTO public.spmb_settings (id, school_name, academic_year, settings_payload)
VALUES (
    'primary_settings',
    'SMK LENTERA BANGSA 2',
    '2026/2027',
    '{
      "schoolName": "SMK LENTERA BANGSA 2",
      "schoolTagline": "Mencetak Generasi Cerdas, Terampil, Mandiri & Berakhlak Mulia",
      "academicYear": "2026/2027",
      "address": "Jl. Raya Lentera No. 88, Telukjambe Timur, Karawang, Jawa Barat 41361",
      "phone": "(0267) 845-9922 / 845-9923",
      "whatsappNumber": "6281314420312",
      "email": "spmb@smklenterabangsa2.sch.id",
      "website": "https://smklenterabangsa2.sch.id",
      "npsn": "69987654",
      "accreditation": "TERAKREDITASI \\"A\\" (UNGGUL)",
      "headmasterName": "Drs. H. Mulyadi Suherman, M.Pd.",
      "committeeHeadName": "Ahmad Fauzi, S.Kom., M.T.",
      "announcementTicker": "⭐ PENDAFTARAN GELOMBANG 1 SPMB 2026/2027 DIBUKA! Dapatkan subsidi seragam 50% untuk 100 pendaftar pertama! Hubungi Call Center 0813-1442-0312 ⭐"
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    academic_year = EXCLUDED.academic_year,
    updated_at = NOW();

-- Selesai! Skrip siap dieksekusi di Supabase SQL Editor.
`;
