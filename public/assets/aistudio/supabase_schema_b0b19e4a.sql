-- ========================================================================
-- SKRIP SETUP RESMI DATABASE SUPABASE REALTIME & TABEL LENGKAP
-- SISTEM PENERIMAAN MURID BARU (SPMB) SMK LENTERA BANGSA 2
--
-- Target Project URL : https://jxcjjyqswnvbjpelptig.supabase.co
-- Dashboard SQL Editor: https://supabase.com/dashboard/project/jxcjjyqswnvbjpelptig/sql
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
-- Menyimpan identitas siswa, NISN, pilihan jurusan, status pendaftaran,
-- nilai seleksi, serta full JSON payload untuk kompatibilitas frontend.
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.spmb_registrations (
    id TEXT PRIMARY KEY,
    registration_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    nisn TEXT,
    nik TEXT,
    gender TEXT,
    birth_place TEXT,
    birth_date TEXT,
    phone TEXT,
    email TEXT,
    major_first TEXT,
    major_second TEXT,
    wave TEXT,
    status TEXT DEFAULT 'PENDING',
    status_note TEXT,
    test_score NUMERIC(5, 2) DEFAULT 0,
    interview_score NUMERIC(5, 2) DEFAULT 0,
    final_score NUMERIC(5, 2) DEFAULT 0,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    data_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks untuk query pencarian kilat pendaftar
CREATE INDEX IF NOT EXISTS idx_spmb_reg_num ON public.spmb_registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_spmb_nisn ON public.spmb_registrations(nisn);
CREATE INDEX IF NOT EXISTS idx_spmb_status ON public.spmb_registrations(status);
CREATE INDEX IF NOT EXISTS idx_spmb_created_at ON public.spmb_registrations(created_at DESC);

-- Trigger auto update kolom updated_at
DROP TRIGGER IF EXISTS trg_spmb_registrations_updated_at ON public.spmb_registrations;
CREATE TRIGGER trg_spmb_registrations_updated_at
BEFORE UPDATE ON public.spmb_registrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Full replica identity agar event realtime UPDATE & DELETE mengirimkan data lengkap
ALTER TABLE public.spmb_registrations REPLICA IDENTITY FULL;


-- ========================================================================
-- 2. TABEL PENGATURAN SEKOLAH & SPMB (spmb_settings)
-- Menyimpan profil sekolah, kop surat, brosur, tahun ajaran, dan konfigurasi.
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
-- Menyimpan daftar jurusan, kuota kelas, serta jumlah pendaftar terisi.
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
    data_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.spmb_majors REPLICA IDENTITY FULL;


-- ========================================================================
-- 4. TABEL GELOMBANG PENDAFTARAN (spmb_waves)
-- Menyimpan jadwal buka/tutup gelombang, kuota, biaya, dan diskon.
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
    data_payload JSONB,
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
-- 6. TABEL PENILAIAN & SELEKSI MASUK (spmb_evaluations)
-- Digunakan untuk merekam nilai tes akademik, wawancara, tes minat bakat.
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.spmb_evaluations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    registration_number TEXT REFERENCES public.spmb_registrations(registration_number) ON DELETE CASCADE,
    student_name TEXT,
    major TEXT,
    written_test NUMERIC(5, 2) DEFAULT 0,
    interview_test NUMERIC(5, 2) DEFAULT 0,
    vocational_test NUMERIC(5, 2) DEFAULT 0,
    attitude_score NUMERIC(5, 2) DEFAULT 0,
    final_score NUMERIC(5, 2) DEFAULT 0,
    selection_result TEXT DEFAULT 'BELUM_DITENTUKAN', -- DITERIMA / CADANGAN / TIDAK_LOLOS
    evaluator_name TEXT,
    notes TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.spmb_evaluations REPLICA IDENTITY FULL;


-- ========================================================================
-- 7. TABEL LOG AKTIVITAS SISTEM (spmb_activity_logs)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.spmb_activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL,
    performed_by TEXT,
    target_id TEXT,
    details TEXT,
    type TEXT
);

ALTER TABLE public.spmb_activity_logs REPLICA IDENTITY FULL;


-- ========================================================================
-- 8. TABEL KOMPATIBILITAS LEGACY / SPMB ALTERNATIF ("SPMB")
-- Menjamin kompatibilitas penuh jika ada komponen yang memanggil tabel SPMB
-- ========================================================================
CREATE TABLE IF NOT EXISTS public."SPMB" (
    id TEXT PRIMARY KEY,
    registration_number TEXT UNIQUE,
    data_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."SPMB" REPLICA IDENTITY FULL;


-- ========================================================================
-- 9. KEBIJAKAN KEAMANAN ROW LEVEL SECURITY (RLS)
-- Mengaktifkan RLS dan memberikan izin penuh (CRUD) bagi anon key,
-- authenticated user, dan service role agar pendaftar dari web publik
-- dapat mendaftar tanpa login, dan admin dapat mengelola data secara lancar.
-- ========================================================================
ALTER TABLE public.spmb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spmb_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SPMB" ENABLE ROW LEVEL SECURITY;

-- Policy untuk spmb_registrations
DROP POLICY IF EXISTS "Izin Penuh spmb_registrations" ON public.spmb_registrations;
CREATE POLICY "Izin Penuh spmb_registrations"
ON public.spmb_registrations FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk spmb_settings
DROP POLICY IF EXISTS "Izin Penuh spmb_settings" ON public.spmb_settings;
CREATE POLICY "Izin Penuh spmb_settings"
ON public.spmb_settings FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk spmb_majors
DROP POLICY IF EXISTS "Izin Penuh spmb_majors" ON public.spmb_majors;
CREATE POLICY "Izin Penuh spmb_majors"
ON public.spmb_majors FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk spmb_waves
DROP POLICY IF EXISTS "Izin Penuh spmb_waves" ON public.spmb_waves;
CREATE POLICY "Izin Penuh spmb_waves"
ON public.spmb_waves FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk spmb_announcements
DROP POLICY IF EXISTS "Izin Penuh spmb_announcements" ON public.spmb_announcements;
CREATE POLICY "Izin Penuh spmb_announcements"
ON public.spmb_announcements FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk spmb_evaluations
DROP POLICY IF EXISTS "Izin Penuh spmb_evaluations" ON public.spmb_evaluations;
CREATE POLICY "Izin Penuh spmb_evaluations"
ON public.spmb_evaluations FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk spmb_activity_logs
DROP POLICY IF EXISTS "Izin Penuh spmb_activity_logs" ON public.spmb_activity_logs;
CREATE POLICY "Izin Penuh spmb_activity_logs"
ON public.spmb_activity_logs FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Policy untuk tabel legacy SPMB
DROP POLICY IF EXISTS "Izin Penuh SPMB Legacy" ON public."SPMB";
CREATE POLICY "Izin Penuh SPMB Legacy"
ON public."SPMB" FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);


-- ========================================================================
-- 10. AKTIFKAN PUBLIKASI SUPABASE REALTIME
-- Mendaftarkan tabel ke kanal supabase_realtime agar perubahan data
-- (INSERT, UPDATE, DELETE) langsung memicu sinkronisasi otomatis ke semua klien.
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

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_evaluations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spmb_activity_logs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public."SPMB";
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;


-- ========================================================================
-- 11. DATA AWAL / SEED DATA DEFAULT RESMI
-- Mengisi data bawaan jurusan, gelombang, pengumuman, dan pengaturan sekolah.
-- ========================================================================

-- A. Data Jurusan Unggulan
INSERT INTO public.spmb_majors (id, code, name, short_desc, full_desc, quota, filled_count, color, icon)
VALUES
('rpl', 'PPLG / RPL', 'Pengembangan Perangkat Lunak & Gim', 'Kuasai pemrograman web, aplikasi mobile Android/iOS, AI prompting, dan industri gim modern.', 'Program keahlian unggulan yang membekali siswa keterampilan rekayasa software terstandar industri teknologi, cloud computing, frontend & backend development, database, serta game engine.', 72, 38, 'from-blue-600 to-indigo-600', 'Code2'),
('tkj', 'TJKT / TKJ', 'Teknik Jaringan Komputer & Telekomunikasi', 'Spesialis infrastruktur jaringan fiber optik, administrasi server Linux, cloud, dan cyber security.', 'Mencetak teknisi andal dalam merancang, menginstalasi, dan mengamankan jaringan komputer perusahaan, konfigurasi router Mikrotik & Cisco, VoIP, dan administrasi server cloud.', 72, 42, 'from-cyan-600 to-teal-600', 'Network'),
('tkro', 'TO / TKRO', 'Teknik Kendaraan Ringan Otomotif', 'Teknologi otomotif modern injeksi EFI, sistem kelistrikan kendaraan, dan pengenalan mobil listrik (EV).', 'Bekerja sama dengan ATPM terkemuka membekali calon mekanik profesional dengan keahlian engine tune-up, scan diagnostic tools komputer, overhaul transmisi otomatis, dan AC mobil.', 108, 65, 'from-amber-600 to-orange-600', 'Wrench'),
('dkv', 'DKV', 'Desain Komunikasi Visual', 'Kreativitas grafis, branding, fotografi komersial, motion graphics, dan videografi digital.', 'Menyiapkan talenta kreatif di era digital yang piawai dalam perancangan identitas visual, kampanye periklanan, packaging, editing video sinematik, dan 3D rendering.', 72, 31, 'from-purple-600 to-pink-600', 'Palette'),
('mplb', 'MPLB / OTKP', 'Manajemen Perkantoran & Layanan Bisnis', 'Administrasi perkantoran digital modern, keprotokolan, kearsipan elektronik, dan public relations.', 'Mencetak tenaga administrasi profesional yang cakap dalam pengelolaan korespondensi digital, automasi kantor, customer relation management, dan operasional bisnis modern.', 72, 29, 'from-emerald-600 to-teal-700', 'Briefcase'),
('akl', 'AKL', 'Akuntansi & Keuangan Lembaga', 'Akuntansi keuangan berbasis software komputer (MYOB/Accurate), perpajakan, dan fintech perbankan.', 'Lulusan menguasai penyusunan laporan keuangan standar PSAK, audit pembukuan, pengoperasian spreadsheet akuntansi tingkat lanjut, dan layanan perbankan syariah / konvensional.', 72, 26, 'from-rose-600 to-red-600', 'Coins')
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
('ann-1', 'Pembukaan Pendaftaran Gelombang 1 SPMB 2026/2027 Resmi Dimulai!', 'PENTING', 'Pendaftaran Murid Baru SMK Lentera Bangsa 2 Tahun Ajaran 2026/2027 telah resmi dibuka untuk semua program keahlian unggulan. Dapatkan subsidi seragam praktik 50% dan pembebasan biaya formulir bagi 100 pendaftar pertama pada Gelombang 1. Silakan lakukan pendaftaran secara online mandiri atau langsung ke sekretariat panitia SPMB kampus.', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80', '2026-01-02', 'Ketua Panitia SPMB', true, true),
('ann-2', 'Jadwal Tes Minat Bakat & Wawancara Pemilihan Jurusan', 'JADWAL_TES', 'Bagi seluruh calon peserta yang telah melengkapi data registrasi, tes minat bakat peminatan jurusan akan diselenggarakan setiap hari Sabtu pukul 08.30 - 12.00 WIB di Aula Kampus LB2. Peserta diharapkan membawa kartu bukti registrasi PDF dan berpakaian rapi sekolah asal.', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80', '2026-01-10', 'Panitia Seleksi Akademik', false, true)
ON CONFLICT (id) DO NOTHING;

-- D. Data Pengaturan Sekolah (Default primary_settings)
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
      "accreditation": "TERAKREDITASI \"A\" (UNGGUL)",
      "headmasterName": "Drs. H. Mulyadi Suherman, M.Pd.",
      "headmasterNip": "19740512 199903 1 004",
      "committeeHeadName": "Ahmad Fauzi, S.Kom., M.T.",
      "logoUrl": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80",
      "promoVideoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "tiktokUrl": "https://tiktok.com/@smklenterabangsa2",
      "instagramUrl": "https://instagram.com/smklenterabangsa2_official",
      "facebookUrl": "https://facebook.com/smklenterabangsa2",
      "announcementTicker": "⭐ PENDAFTARAN GELOMBANG 1 SPMB 2026/2027 DIBUKA! Dapatkan subsidi seragam 50% untuk 100 pendaftar pertama! Hubungi Call Center 0813-1442-0312 ⭐",
      "primaryColor": "#2563eb",
      "googleSheetSyncUrl": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
      "customColumns": [
        { "id": "size_uniform", "label": "Ukuran Jas/Seragam (S/M/L/XL/XXL)", "placeholder": "Contoh: L", "required": false },
        { "id": "transport_mode", "label": "Transportasi ke Sekolah", "placeholder": "Contoh: Sepeda Motor / Angkutan Umum", "required": false }
      ]
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    academic_year = EXCLUDED.academic_year,
    updated_at = NOW();

-- E. Contoh Data Pendaftar Awal (Agar Dashboard Langsung Terisi & Siap Uji)
INSERT INTO public.spmb_registrations (
    id, registration_number, full_name, nisn, nik, gender,
    birth_place, birth_date, phone, email, major_first, major_second,
    wave, status, status_note, test_score, interview_score, final_score,
    verified_by, data_payload
)
VALUES
(
    'reg-001',
    'LB2-2026-0001',
    'Muhammad Rizky Pratama',
    '0089123456',
    '3215011405090001',
    'Laki-laki',
    'Karawang',
    '2009-05-14',
    '081234567890',
    'rizky.pratama2009@gmail.com',
    'Pengembangan Perangkat Lunak & Gim',
    'Teknik Jaringan Komputer & Telekomunikasi',
    'Gelombang 1 (Jalur Prestasi & Minat)',
    'DITERIMA',
    'Selamat! Berkas lengkap, nilai rapor memenuhi syarat Jalur Prestasi PPLG.',
    88.5,
    92.0,
    90.25,
    'Ketua Panitia SPMB LB2',
    '{
      "id": "reg-001",
      "registrationNumber": "LB2-2026-0001",
      "createdAt": "2026-01-05 08:32:10",
      "updatedAt": "2026-01-06 14:10:00",
      "status": "DITERIMA",
      "statusNote": "Selamat! Berkas lengkap, nilai rapor memenuhi syarat Jalur Prestasi PPLG.",
      "wave": "Gelombang 1 (Jalur Prestasi & Minat)",
      "personalData": {
        "nik": "3215011405090001",
        "nisn": "0089123456",
        "fullName": "Muhammad Rizky Pratama",
        "gender": "Laki-laki",
        "birthPlace": "Karawang",
        "birthDate": "2009-05-14",
        "religion": "Islam",
        "address": "Perumahan Puri Telukjambe Blok B4 No. 12",
        "rtRw": "003/011",
        "village": "Sukaluyu",
        "district": "Telukjambe Timur",
        "city": "Kabupaten Karawang",
        "province": "Jawa Barat",
        "phoneWhatsApp": "081234567890",
        "email": "rizky.pratama2009@gmail.com"
      },
      "majorChoice": {
        "firstChoice": "Pengembangan Perangkat Lunak & Gim",
        "secondChoice": "Teknik Jaringan Komputer & Telekomunikasi"
      },
      "schoolOrigin": {
        "schoolName": "SMP Negeri 1 Karawang Barat",
        "graduationYear": "2026",
        "averageScore": "89.5"
      },
      "parentData": {
        "fatherName": "Bambang Supriyanto",
        "motherName": "Sri Wahyuni",
        "monthlyIncome": "Rp 5.000.000 - Rp 10.000.000"
      }
    }'::jsonb
),
(
    'reg-002',
    'LB2-2026-0002',
    'Siti Nurhaliza',
    '0087654321',
    '3215025508090002',
    'Perempuan',
    'Bekasi',
    '2009-08-25',
    '085712345678',
    'siti.nurhaliza.id@gmail.com',
    'Manajemen Perkantoran & Layanan Bisnis',
    'Akuntansi & Keuangan Lembaga',
    'Gelombang 1 (Jalur Prestasi & Minat)',
    'VERIFIKASI_BERKAS',
    'Mohon perjelas scan Akta Kelahiran dan pas foto background merah.',
    84.0,
    88.0,
    86.0,
    'Petugas Verifikasi Berkas',
    '{
      "id": "reg-002",
      "registrationNumber": "LB2-2026-0002",
      "createdAt": "2026-01-08 10:14:22",
      "updatedAt": "2026-01-09 11:20:00",
      "status": "VERIFIKASI_BERKAS",
      "statusNote": "Mohon perjelas scan Akta Kelahiran dan pas foto background merah.",
      "wave": "Gelombang 1 (Jalur Prestasi & Minat)",
      "personalData": {
        "nik": "3215025508090002",
        "nisn": "0087654321",
        "fullName": "Siti Nurhaliza",
        "gender": "Perempuan",
        "birthPlace": "Bekasi",
        "birthDate": "2009-08-25",
        "religion": "Islam",
        "address": "Dusun Krajan RT 02 RW 01",
        "rtRw": "002/001",
        "village": "Pinayungan",
        "district": "Telukjambe Timur",
        "city": "Kabupaten Karawang",
        "province": "Jawa Barat",
        "phoneWhatsApp": "085712345678",
        "email": "siti.nurhaliza.id@gmail.com"
      },
      "majorChoice": {
        "firstChoice": "Manajemen Perkantoran & Layanan Bisnis",
        "secondChoice": "Akuntansi & Keuangan Lembaga"
      },
      "schoolOrigin": {
        "schoolName": "MTs Negeri 1 Karawang",
        "graduationYear": "2026",
        "averageScore": "87.0"
      },
      "parentData": {
        "fatherName": "Ahmad Sulaeman",
        "motherName": "Nur Hasanah",
        "monthlyIncome": "Rp 3.000.000 - Rp 5.000.000"
      }
    }'::jsonb
),
(
    'reg-003',
    'LB2-2026-0003',
    'Dimas Bagas Satrio',
    '0083456789',
    '3215031102090003',
    'Laki-laki',
    'Karawang',
    '2009-02-11',
    '087811223344',
    'dimas.satrio@gmail.com',
    'Teknik Kendaraan Ringan Otomotif',
    'Teknik Jaringan Komputer & Telekomunikasi',
    'Gelombang 1 (Jalur Prestasi & Minat)',
    'PENDING',
    'Pendaftaran baru masuk. Menunggu verifikasi tim seleksi administrasi.',
    0,
    0,
    0,
    NULL,
    '{
      "id": "reg-003",
      "registrationNumber": "LB2-2026-0003",
      "createdAt": "2026-01-12 13:45:10",
      "updatedAt": "2026-01-12 13:45:10",
      "status": "PENDING",
      "statusNote": "Pendaftaran baru masuk. Menunggu verifikasi tim seleksi administrasi.",
      "wave": "Gelombang 1 (Jalur Prestasi & Minat)",
      "personalData": {
        "nik": "3215031102090003",
        "nisn": "0083456789",
        "fullName": "Dimas Bagas Satrio",
        "gender": "Laki-laki",
        "birthPlace": "Karawang",
        "birthDate": "2009-02-11",
        "religion": "Islam",
        "address": "Jl. Ahmad Yani No. 76 Nagasari",
        "rtRw": "005/002",
        "village": "Nagasari",
        "district": "Karawang Barat",
        "city": "Kabupaten Karawang",
        "province": "Jawa Barat",
        "phoneWhatsApp": "087811223344",
        "email": "dimas.satrio@gmail.com"
      },
      "majorChoice": {
        "firstChoice": "Teknik Kendaraan Ringan Otomotif",
        "secondChoice": "Teknik Jaringan Komputer & Telekomunikasi"
      },
      "schoolOrigin": {
        "schoolName": "SMP Swasta Al-Azhar Karawang",
        "graduationYear": "2026",
        "averageScore": "84.2"
      },
      "parentData": {
        "fatherName": "Hendra Gunawan",
        "motherName": "Rina Maryana",
        "monthlyIncome": "Rp 5.000.000 - Rp 10.000.000"
      }
    }'::jsonb
)
ON CONFLICT (registration_number) DO UPDATE SET
    status = EXCLUDED.status,
    status_note = EXCLUDED.status_note,
    data_payload = EXCLUDED.data_payload,
    updated_at = NOW();

-- Selesai! Skrip siap dieksekusi di Supabase SQL Editor.
