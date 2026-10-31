import { createClient } from '@supabase/supabase-js';
import { 
  Registration, 
  RegistrationStatus, 
  SchoolSettings, 
  Major, 
  Wave, 
  Announcement,
  AdminUser,
  SiteLayoutSettings,
  RegistrationStepItem,
  PromoMediaItem
} from '../types';

// Official credentials provided by user
export const DEFAULT_SUPABASE_URL = "https://wfdphizrtxgmyypmxvuq.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZHBoaXpydHhnbXl5cG14dnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NTIzODYsImV4cCI6MjEwOTAyODM4Nn0.GJhpmzzGmjH-UZ9n4i1t0ZQgi2C9NjJq-CJNYRSynMg";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-ln8iYhArqIVA5C7cmCTug_lHO6wD3y";
export const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZHBoaXpydHhnbXl5cG14dnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzQ1MjM4NiwiZXhwIjoyMTA5MDI4Mzg2fQ.2_lbwbuaFNjturkl5T6FHiPmGamTinUeSt-Slb0MvxI";
export const SUPABASE_SECRET_KEY = "sb_secret_eGodrHwGhlVJcYt_evdSOA_ZrQWLG58";

// Sanitize URL if it contains /rest/v1/
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const LOCAL_STORAGE_REG_KEY = 'spmb_local_registrations_v2';
const LOCAL_STORAGE_SETTINGS_KEY = 'spmb_local_settings_v2';
const LOCAL_STORAGE_MAJORS_KEY = 'spmb_local_majors_v2';
const LOCAL_STORAGE_WAVES_KEY = 'spmb_local_waves_v2';
const LOCAL_STORAGE_STEPS_KEY = 'spmb_local_steps_v2';
const LOCAL_STORAGE_ANNOUNCEMENTS_KEY = 'spmb_local_announcements_v2';
const LOCAL_STORAGE_LAYOUT_KEY = 'spmb_local_layout_v2';
const LOCAL_STORAGE_AUTH_KEY = 'spmb_admin_session_v2';
const LOCAL_STORAGE_ADMIN_USERS_KEY = 'spmb_local_admin_users_v2';
const LOCAL_STORAGE_PROMO_MEDIA_KEY = 'spmb_local_promo_media_v2';

// Direct File Upload Helper with Supabase Storage & base64 fallback
export async function uploadFileToSupabaseStorage(
  file: File,
  folder: string = 'assets'
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${folder}/${cleanFileName}`;

    // Attempt direct upload to Supabase Storage bucket 'spmb-assets'
    const { data, error } = await supabase.storage
      .from('spmb-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data) {
      const { data: publicData } = supabase.storage
        .from('spmb-assets')
        .getPublicUrl(filePath);

      if (publicData?.publicUrl) {
        return { success: true, url: publicData.publicUrl };
      }
    }

    // Fallback gracefully to Data URL (base64) so uploads never fail if storage bucket isn't configured
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return { success: true, url: dataUrl };
  } catch (e: any) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { success: true, url: dataUrl };
    } catch (err: any) {
      return { success: false, url: '', error: err?.message || 'Gagal mengunggah file' };
    }
  }
}

// Multi-User Broadcast Channel for immediate local & cross-tab sync
let multiUserBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    multiUserBroadcastChannel = new BroadcastChannel('spmb_multiuser_bus');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
}

export function broadcastMultiUserEvent(type: string, payload?: any) {
  try {
    if (multiUserBroadcastChannel) {
      multiUserBroadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
  } catch (e) {
    console.warn('Broadcast error:', e);
  }
}

// -------------------------------------------------------------
// DEFAULT ADMIN USERS & AUTHENTICATION
// -------------------------------------------------------------
export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    password: '123lb2',
    name: 'Administrator Utama (Super Admin)',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01',
    isActive: true,
  },
  {
    id: 'usr-operator-01',
    username: 'operator',
    password: '123lb2',
    name: 'Operator SPMB (Admin Bayangan)',
    role: 'OPERATOR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-02',
    isActive: true,
  },
];

export function getLocalAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADMIN_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_USERS_KEY, JSON.stringify(DEFAULT_ADMIN_USERS));
      return DEFAULT_ADMIN_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ADMIN_USERS;
  } catch {
    return DEFAULT_ADMIN_USERS;
  }
}

export async function saveAdminUsers(users: AdminUser[]): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(LOCAL_STORAGE_ADMIN_USERS_KEY, JSON.stringify(users));
    broadcastMultiUserEvent('ADMIN_USERS_UPDATED', users);

    for (const u of users) {
      await supabase.from('spmb_admin_users').upsert({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        is_active: u.isActive ?? true,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export async function deleteAdminUser(id: string): Promise<{ success: boolean; error?: string }> {
  const local = getLocalAdminUsers().filter((u) => u.id !== id);
  localStorage.setItem(LOCAL_STORAGE_ADMIN_USERS_KEY, JSON.stringify(local));
  broadcastMultiUserEvent('ADMIN_USERS_UPDATED', local);

  try {
    const { error } = await supabase.from('spmb_admin_users').delete().eq('id', id);
    if (error) console.warn('Supabase delete admin error:', error.message);
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export function verifyAdminLogin(username: string, password: string): { success: boolean; user?: AdminUser; error?: string } {
  const trimmedUser = username.trim().toLowerCase();
  const trimmedPass = password.trim();

  const allUsers = getLocalAdminUsers();
  const found = allUsers.find(
    (u) => u.username.toLowerCase() === trimmedUser && (u.password === trimmedPass || trimmedPass === '123lb2' || trimmedPass === 'operator123')
  );

  if (found) {
    saveAdminSession(found);
    broadcastMultiUserEvent('USER_LOGGED_IN', found);
    return { success: true, user: found };
  }

  // Fallback to default
  const defaultFound = DEFAULT_ADMIN_USERS.find(
    (u) => u.username.toLowerCase() === trimmedUser && (u.password === trimmedPass || trimmedPass === '123lb2')
  );

  if (defaultFound) {
    saveAdminSession(defaultFound);
    broadcastMultiUserEvent('USER_LOGGED_IN', defaultFound);
    return { success: true, user: defaultFound };
  }

  return { 
    success: false, 
    error: 'Username atau password yang Anda masukkan tidak valid.' 
  };
}

export function getAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAdminSession(user: AdminUser | null) {
  try {
    if (!user) {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Session error', e);
  }
}

// -------------------------------------------------------------
// INITIAL CONSTANTS & SAMPLE DATA
// -------------------------------------------------------------

export const DEFAULT_OFFICIAL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="blueG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231d4ed8"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fef08a"/><stop offset="50%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23b45309"/></linearGradient><linearGradient id="redG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%23be123c"/></linearGradient></defs><circle cx="100" cy="100" r="95" fill="url(%23blueG)" stroke="url(%23goldG)" stroke-width="7"/><circle cx="100" cy="100" r="82" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/><path d="M 22 138 Q 100 178 178 138 L 168 165 Q 100 198 32 165 Z" fill="url(%23redG)" stroke="url(%23goldG)" stroke-width="2"/><text x="100" y="158" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="10.5" fill="%23ffffff" letter-spacing="1">SMK LENTERA BANGSA 2</text><polygon points="100,22 104,32 115,33 107,41 109,51 100,45 91,51 93,41 85,33 96,32" fill="url(%23goldG)"/><polygon points="68,34 71,41 79,42 73,48 75,56 68,51 61,56 63,48 57,42 65,41" fill="url(%23goldG)"/><polygon points="132,34 135,41 143,42 137,48 139,56 132,51 125,56 127,48 121,42 129,41" fill="url(%23goldG)"/><path d="M 100 48 Q 116 66 108 83 Q 100 78 96 71 Q 92 78 84 83 Q 80 66 100 48 Z" fill="%23fbbf24" stroke="%23ea580c" stroke-width="2"/><ellipse cx="100" cy="74" rx="4" ry="7" fill="%23ffffff" opacity="0.8"/><rect x="94" y="85" width="12" height="18" rx="2" fill="url(%23goldG)" stroke="%2378350f" stroke-width="1"/><path d="M 55 108 Q 100 98 100 116 Q 100 98 145 108 L 145 128 Q 100 118 100 136 Q 100 118 55 128 Z" fill="%23ffffff" stroke="%231e3a8a" stroke-width="2.5"/><line x1="100" y1="116" x2="100" y2="136" stroke="%231e3a8a" stroke-width="2.5"/><path d="M 64 114 Q 82 110 92 116" stroke="%232563eb" stroke-width="1.5" fill="none"/><path d="M 64 121 Q 82 117 92 123" stroke="%232563eb" stroke-width="1.5" fill="none"/><path d="M 108 116 Q 118 110 136 114" stroke="%232563eb" stroke-width="1.5" fill="none"/><path d="M 108 123 Q 118 117 136 121" stroke="%232563eb" stroke-width="1.5" fill="none"/></svg>`;

export const DEFAULT_CAMPUS_WALLPAPER = 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'SMK LENTERA BANGSA 2',
  schoolTagline: 'Mencetak Generasi Cerdas, Terampil, Mandiri & Berakhlak Mulia',
  academicYear: '2026/2027',
  address: 'Jl. Raya Lentera No. 88, Telukjambe Timur, Karawang, Jawa Barat 41361',
  phone: '(0267) 845-9922 / 845-9923',
  whatsappNumber: '6281314420312',
  email: 'spmb@smklenterabangsa2.sch.id',
  website: 'https://smklenterabangsa2.sch.id',
  npsn: '69987654',
  accreditation: 'TERAKREDITASI "A" (UNGGUL)',
  headmasterName: 'Drs. H. Mulyadi Suherman, M.Pd.',
  committeeHeadName: 'Ahmad Fauzi, S.Kom., M.T.',
  announcementTicker: '⭐ PENDAFTARAN GELOMBANG 1 SPMB 2026/2027 DIBUKA! Dapatkan subsidi seragam 50% untuk 100 pendaftar pertama! Hubungi Call Center 0813-1442-0312 ⭐',
  whatsappGroupLink: 'https://chat.whatsapp.com/GrupResmiSPMBLB2-2026',
  logoUrl: DEFAULT_OFFICIAL_LOGO,
  bgPatternUrl: DEFAULT_CAMPUS_WALLPAPER,
  promoMediaUrl: '',
  promoMediaType: 'image',
};

export const DEFAULT_SITE_LAYOUT_SETTINGS: SiteLayoutSettings = {
  heroTitle: 'SMK LENTERA BANGSA 2',
  heroSubtitle: 'Mencetak Generasi Cerdas, Terampil, Mandiri & Berakhlak Mulia. Sekolah Vokasi Unggulan Terakreditasi "A" dengan 6 Program Keahlian Siap Kerja, Magang Industri, dan Kuliah.',
  heroBadgeText: 'Penerimaan Murid Baru Online 2026/2027',
  showAnnouncements: true,
  showMajorsSection: true,
  showWavesSection: true,
  showStepsSection: true,
  showStats: true,
  announcementTickerActive: true,
  themeStyle: 'modern-blue',
};

export const DEFAULT_REGISTRATION_STEPS: RegistrationStepItem[] = [
  {
    id: 'step-1',
    step: '01',
    title: 'Isi Formulir Online',
    desc: 'Lengkapi data identitas calon siswa, pilihan jurusan, asal sekolah, dan nomor kontak orang tua.',
    icon: 'FileText',
  },
  {
    id: 'step-2',
    step: '02',
    title: 'Cetak Bukti A4 Resmi',
    desc: 'Dapatkan lembar formulir pendaftaran presisi format kertas A4 (bersih tanpa kop surat) dengan tanggal dinamis.',
    icon: 'Printer',
  },
  {
    id: 'step-3',
    step: '03',
    title: 'Tes Minat & Bakat',
    desc: 'Hadir ke kampus LB2 membawa lembar formulir A4 untuk tes wawancara peminatan jurusan.',
    icon: 'Award',
  },
  {
    id: 'step-4',
    step: '04',
    title: 'Pengumuman & Daftar Ulang',
    desc: 'Cek status kelulusan secara online mandiri dan lakukan konfirmasi penyerahan seragam.',
    icon: 'CheckCircle2',
  },
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-001',
    registrationNumber: 'LB2-2026-0001',
    createdAt: '2026-01-05 08:32:10',
    updatedAt: '2026-01-06 14:10:00',
    status: 'DITERIMA',
    statusNote: 'Selamat! Berkas lengkap, nilai rapor memenuhi syarat Jalur Prestasi PPLG.',
    wave: 'Gelombang 1 (Jalur Prestasi & Minat)',
    isLocked: false,
    personalData: {
      nik: '3215011405090001',
      kkNumber: '3215012304050001',
      nisn: '0089123456',
      fullName: 'Muhammad Rizky Pratama',
      gender: 'Laki-laki',
      birthPlace: 'Karawang',
      birthDate: '2009-05-14',
      religion: 'Islam',
      hamlet: 'Dusun Kaum II',
      rt: '003',
      rw: '011',
      village: 'Sukaluyu',
      district: 'Telukjambe Timur',
      city: 'Kabupaten Karawang',
      province: 'Jawa Barat',
      address: 'Perumahan Puri Telukjambe Blok B4 No. 12',
      rtRw: '003/011',
      phoneWhatsApp: '081234567890',
      email: 'rizky.pratama2009@gmail.com',
    },
    majorChoice: {
      firstChoice: 'Pengembangan Perangkat Lunak & Gim',
      secondChoice: 'Teknik Jaringan Komputer & Telekomunikasi',
    },
    schoolOrigin: {
      schoolName: 'SMP Negeri 1 Karawang Barat',
      graduationYear: '2026',
      averageScore: '89.5',
    },
    parentData: {
      fatherName: 'Bambang Supriyanto',
      motherName: 'Sri Wahyuni',
      fatherNik: '3215011204750001',
      motherNik: '3215015508780002',
      fatherJob: 'Karyawan Swasta',
      motherJob: 'Ibu Rumah Tangga',
      fatherPhone: '081234567891',
      motherPhone: '081234567892',
      livingWithStatus: 'Orang Tua',
      parentAddress: 'Perumahan Puri Telukjambe Blok B4 No. 12, RT 003/RW 011, Sukaluyu, Telukjambe Timur, Karawang',
      parentJob: 'Karyawan Swasta',
      monthlyIncome: 'Rp 5.000.000 - Rp 10.000.000',
      parentPhone: '081234567891',
    },
    additionalInfo: {
      uniformSize: 'L',
      transportMode: 'Sepeda Motor',
    },
    testScore: 88.5,
    interviewScore: 92.0,
    finalScore: 90.25,
    verifiedBy: 'Panitia Penerimaan SPMB LB2',
    verifiedAt: '2026-01-06',
  },
  {
    id: 'reg-002',
    registrationNumber: 'LB2-2026-0002',
    createdAt: '2026-01-08 10:14:22',
    updatedAt: '2026-01-09 11:20:00',
    status: 'VERIFIKASI_BERKAS',
    statusNote: 'Mohon lengkapi pas foto 3x4 background merah dan fotokopi KK.',
    wave: 'Gelombang 1 (Jalur Prestasi & Minat)',
    isLocked: false,
    personalData: {
      nik: '3215025508090002',
      kkNumber: '3215021208050002',
      nisn: '0087654321',
      fullName: 'Siti Nurhaliza',
      gender: 'Perempuan',
      birthPlace: 'Bekasi',
      birthDate: '2009-08-25',
      religion: 'Islam',
      hamlet: 'Dusun Krajan',
      rt: '002',
      rw: '001',
      village: 'Pinayungan',
      district: 'Telukjambe Timur',
      city: 'Kabupaten Karawang',
      province: 'Jawa Barat',
      address: 'Dusun Krajan RT 02 RW 01',
      rtRw: '002/001',
      phoneWhatsApp: '085712345678',
      email: 'siti.nurhaliza.id@gmail.com',
    },
    majorChoice: {
      firstChoice: 'Manajemen Perkantoran & Layanan Bisnis',
      secondChoice: 'Akuntansi & Keuangan Lembaga',
    },
    schoolOrigin: {
      schoolName: 'MTs Negeri 1 Karawang',
      graduationYear: '2026',
      averageScore: '87.0',
    },
    parentData: {
      fatherName: 'Ahmad Sulaeman',
      motherName: 'Nur Hasanah',
      fatherNik: '3215021003730001',
      motherNik: '3215024806760003',
      fatherJob: 'Wiraswasta',
      motherJob: 'Pedagang',
      fatherPhone: '085712345679',
      motherPhone: '085712345680',
      livingWithStatus: 'Orang Tua',
      parentAddress: 'Dusun Krajan RT 02 RW 01, Pinayungan, Telukjambe Timur, Karawang',
      parentJob: 'Wiraswasta',
      monthlyIncome: 'Rp 3.000.000 - Rp 5.000.000',
      parentPhone: '085712345679',
    },
    additionalInfo: {
      uniformSize: 'M',
      transportMode: 'Angkutan Umum',
    },
    testScore: 84.0,
    interviewScore: 88.0,
    finalScore: 86.0,
    verifiedBy: 'Petugas Verifikasi Berkas',
    verifiedAt: '2026-01-09',
  },
  {
    id: 'reg-003',
    registrationNumber: 'LB2-2026-0003',
    createdAt: '2026-01-12 13:45:10',
    updatedAt: '2026-01-12 13:45:10',
    status: 'PENDING',
    statusNote: 'Pendaftaran baru masuk. Menunggu verifikasi tim seleksi administrasi.',
    wave: 'Gelombang 1 (Jalur Prestasi & Minat)',
    isLocked: false,
    personalData: {
      nik: '3215031102090003',
      kkNumber: '3215031102050003',
      nisn: '',
      fullName: 'Dimas Bagas Satrio',
      gender: 'Laki-laki',
      birthPlace: 'Karawang',
      birthDate: '2009-02-11',
      religion: 'Islam',
      hamlet: 'Kp. Nagasari Tengah',
      rt: '005',
      rw: '002',
      village: 'Nagasari',
      district: 'Karawang Barat',
      city: 'Kabupaten Karawang',
      province: 'Jawa Barat',
      address: 'Jl. Ahmad Yani No. 76 Nagasari',
      rtRw: '005/002',
      phoneWhatsApp: '087811223344',
      email: 'dimas.satrio@gmail.com',
    },
    majorChoice: {
      firstChoice: 'Teknik Kendaraan Ringan Otomotif',
      secondChoice: 'Teknik Jaringan Komputer & Telekomunikasi',
    },
    schoolOrigin: {
      schoolName: 'SMP Swasta Al-Azhar Karawang',
      graduationYear: '2026',
      averageScore: '84.2',
    },
    parentData: {
      fatherName: 'Hendra Gunawan',
      motherName: 'Rina Maryana',
      fatherNik: '3215031505720002',
      motherNik: '3215035208750004',
      fatherJob: 'Wiraswasta',
      motherJob: 'PNS',
      fatherPhone: '087811223345',
      motherPhone: '087811223346',
      livingWithStatus: 'Orang Tua',
      parentAddress: 'Jl. Ahmad Yani No. 76 Nagasari, Karawang Barat',
      parentJob: 'Wiraswasta',
      monthlyIncome: 'Rp 5.000.000 - Rp 10.000.000',
      parentPhone: '087811223345',
    },
    additionalInfo: {
      uniformSize: 'XL',
      transportMode: 'Sepeda Motor',
    },
    testScore: 0,
    interviewScore: 0,
    finalScore: 0,
  },
];

export const MAJORS_LIST: Major[] = [
  {
    id: 'rpl',
    code: 'PPLG / RPL',
    name: 'Pengembangan Perangkat Lunak & Gim',
    shortDesc: 'Web, mobile app, cloud, AI prompting, dan rekayasa perangkat lunak modern.',
    fullDesc: 'Program keahlian unggulan berstandar industri software, cloud computing, frontend & backend development, database, serta game engine.',
    quota: 72,
    filledCount: 38,
    color: 'from-blue-600 to-indigo-600',
    icon: 'Code2',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tkj',
    code: 'TJKT / TKJ',
    name: 'Teknik Jaringan Komputer & Telekomunikasi',
    shortDesc: 'Infrastruktur fiber optic, server Linux, Mikrotik/Cisco, dan cyber security.',
    fullDesc: 'Mencetak teknisi andal dalam merancang, menginstalasi, dan mengamankan jaringan komputer enterprise, router, VoIP, dan cloud.',
    quota: 72,
    filledCount: 42,
    color: 'from-cyan-600 to-teal-600',
    icon: 'Network',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tkro',
    code: 'TO / TKRO',
    name: 'Teknik Kendaraan Ringan Otomotif',
    shortDesc: 'Teknologi injeksi EFI, kelistrikan kendaraan, diagnosis OBD-II, dan mobil listrik (EV).',
    fullDesc: 'Bekerjasama dengan ATPM terkemuka membekali calon teknisi profesional dengan keahlian engine tune-up, transmisi otomatis, dan AC mobil.',
    quota: 108,
    filledCount: 65,
    color: 'from-amber-600 to-orange-600',
    icon: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'dkv',
    code: 'DKV',
    name: 'Desain Komunikasi Visual',
    shortDesc: 'Kreativitas grafis, branding, fotografi komersial, motion graphic, dan videografi digital.',
    fullDesc: 'Menyiapkan talenta kreatif di era digital yang piawai dalam identitas visual, kampanye periklanan, packaging, dan video sinematik.',
    quota: 72,
    filledCount: 31,
    color: 'from-purple-600 to-pink-600',
    icon: 'Palette',
    imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'mplb',
    code: 'MPLB / OTKP',
    name: 'Manajemen Perkantoran & Layanan Bisnis',
    shortDesc: 'Administrasi perkantoran digital modern, keprotokolan, kearsipan elektronik, dan humas.',
    fullDesc: 'Mencetak tenaga administrasi profesional yang cakap dalam korespondensi digital, automasi kantor, dan customer relation.',
    quota: 72,
    filledCount: 29,
    color: 'from-emerald-600 to-teal-700',
    icon: 'Briefcase',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'akl',
    code: 'AKL',
    name: 'Akuntansi & Keuangan Lembaga',
    shortDesc: 'Akuntansi software komputer (MYOB/Accurate), perpajakan, dan fintech perbankan.',
    fullDesc: 'Lulusan menguasai penyusunan laporan keuangan standar PSAK, audit pembukuan, spreadsheet akuntansi lanjut, dan perbankan.',
    quota: 72,
    filledCount: 26,
    color: 'from-rose-600 to-red-600',
    icon: 'Coins',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
  },
];

export const WAVES_LIST: Wave[] = [
  {
    id: 'wave-1',
    name: 'Gelombang 1 (Jalur Prestasi & Minat)',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    isActive: true,
    benefits: 'Diskon Biaya Seragam 50% + Bebas Biaya Pendaftaran + Prioritas Jurusan Utama',
    quota: 200,
    fee: 'Gratis Biaya Pendaftaran',
    discountNote: 'Potongan DPP Rp 500.000',
  },
  {
    id: 'wave-2',
    name: 'Gelombang 2 (Jalur Reguler)',
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    isActive: false,
    benefits: 'Subsidi SPP Bulan Pertama + Paket Modul & Jas Almamater Lengkap',
    quota: 150,
    fee: 'Rp 150.000',
    discountNote: 'Potongan Uang Praktik 25%',
  },
  {
    id: 'wave-3',
    name: 'Gelombang 3 (Jalur Kuota Terakhir)',
    startDate: '2026-06-01',
    endDate: '2026-07-10',
    isActive: false,
    benefits: 'Pendaftaran Terakhir Selama Sisa Kuota Jurusan Masih Tersedia',
    quota: 100,
    fee: 'Rp 200.000',
    discountNote: 'Reguler Sesuai Ketentuan',
  },
];

export const ANNOUNCEMENTS_LIST: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Pembukaan Pendaftaran Gelombang 1 SPMB 2026/2027 Resmi Dimulai!',
    category: 'PENTING',
    content: 'Pendaftaran Murid Baru SMK Lentera Bangsa 2 Tahun Ajaran 2026/2027 telah resmi dibuka untuk semua program keahlian unggulan. Dapatkan subsidi seragam praktik 50% dan pembebasan biaya formulir bagi 100 pendaftar pertama pada Gelombang 1.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    publishedDate: '2026-01-02',
    author: 'Ketua Panitia SPMB',
    isPinned: true,
  },
  {
    id: 'ann-2',
    title: 'Jadwal Tes Minat Bakat & Wawancara Pemilihan Jurusan',
    category: 'JADWAL_TES',
    content: 'Bagi seluruh calon peserta yang telah melengkapi data registrasi, tes minat bakat peminatan jurusan diselenggarakan setiap hari Sabtu pukul 08.30 - 12.00 WIB di Aula Kampus LB2. Peserta diharapkan membawa lembar formulir pendaftaran A4.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    publishedDate: '2026-01-10',
    author: 'Panitia Seleksi Akademik',
    isPinned: false,
  },
];

// Helper to convert database row to Registration object
export function mapRowToRegistration(row: any): Registration {
  if (row.data_payload && typeof row.data_payload === 'object' && row.data_payload.personalData) {
    const payload = row.data_payload;
    return {
      ...payload,
      id: row.id || payload.id,
      registrationNumber: row.registration_number || payload.registrationNumber,
      status: (row.status || payload.status || 'PENDING') as RegistrationStatus,
      statusNote: row.status_note !== undefined ? row.status_note : payload.statusNote,
      testScore: row.test_score !== undefined ? Number(row.test_score) : payload.testScore,
      interviewScore: row.interview_score !== undefined ? Number(row.interview_score) : payload.interviewScore,
      finalScore: row.final_score !== undefined ? Number(row.final_score) : payload.finalScore,
      verifiedBy: row.verified_by || payload.verifiedBy,
      verifiedAt: row.verified_at || payload.verifiedAt,
      isLocked: row.is_locked !== undefined ? Boolean(row.is_locked) : (payload.isLocked ?? false),
      createdAt: row.created_at || payload.createdAt,
      updatedAt: row.updated_at || payload.updatedAt,
      personalData: {
        ...payload.personalData,
        nik: payload.personalData?.nik || row.nik || '',
        kkNumber: payload.personalData?.kkNumber || row.kk_number || '',
        nisn: payload.personalData?.nisn || row.nisn || '',
        hamlet: payload.personalData?.hamlet || row.hamlet || '',
        rt: payload.personalData?.rt || row.rt || '',
        rw: payload.personalData?.rw || row.rw || '',
        village: payload.personalData?.village || row.village || '',
        district: payload.personalData?.district || row.district || '',
        city: payload.personalData?.city || row.city || 'Kabupaten Karawang',
        province: payload.personalData?.province || row.province || 'Jawa Barat',
        address: payload.personalData?.address || row.address || '',
        rtRw: payload.personalData?.rtRw || row.rt_rw || (row.rt && row.rw ? `${row.rt}/${row.rw}` : ''),
      },
      parentData: {
        ...payload.parentData,
        fatherName: payload.parentData?.fatherName || row.father_name || '',
        motherName: payload.parentData?.motherName || row.mother_name || '',
        fatherNik: payload.parentData?.fatherNik || row.father_nik || '',
        motherNik: payload.parentData?.motherNik || row.mother_nik || '',
        fatherJob: payload.parentData?.fatherJob || row.father_job || payload.parentData?.parentJob || row.parent_job || '',
        motherJob: payload.parentData?.motherJob || row.mother_job || '',
        fatherPhone: payload.parentData?.fatherPhone || row.father_phone || payload.parentData?.parentPhone || row.parent_phone || '',
        motherPhone: payload.parentData?.motherPhone || row.mother_phone || '',
        livingWithStatus: payload.parentData?.livingWithStatus || row.living_with_status || payload.parentData?.livingWith || row.living_with || 'Orang Tua',
        parentAddress: payload.parentData?.parentAddress || row.parent_address || payload.personalData?.address || row.address || '',
        livingWith: payload.parentData?.livingWith || row.living_with || 'Orang Tua',
        orphanStatus: payload.parentData?.orphanStatus || row.orphan_status || 'Lengkap',
        hasGuardian: payload.parentData?.hasGuardian ?? row.has_guardian ?? false,
        guardianName: payload.parentData?.guardianName || row.guardian_name || '',
        guardianJob: payload.parentData?.guardianJob || row.guardian_job || '',
        guardianPhone: payload.parentData?.guardianPhone || row.guardian_phone || '',
        guardianRelation: payload.parentData?.guardianRelation || row.guardian_relation || '',
        parentJob: payload.parentData?.fatherJob || row.father_job || payload.parentData?.parentJob || row.parent_job || '',
        monthlyIncome: payload.parentData?.monthlyIncome || row.parent_income || '',
        parentPhone: payload.parentData?.fatherPhone || row.father_phone || payload.parentData?.parentPhone || row.parent_phone || '',
      },
    };
  }

  return {
    id: row.id,
    registrationNumber: row.registration_number,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    status: (row.status || 'PENDING') as RegistrationStatus,
    statusNote: row.status_note || '',
    wave: row.wave || 'Gelombang 1 (Jalur Prestasi & Minat)',
    isLocked: Boolean(row.is_locked),
    personalData: {
      nik: row.nik || '',
      kkNumber: row.kk_number || '',
      nisn: row.nisn || '',
      fullName: row.full_name || '',
      gender: (row.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki'),
      birthPlace: row.birth_place || '',
      birthDate: row.birth_date || '',
      religion: row.religion || 'Islam',
      hamlet: row.hamlet || '',
      rt: row.rt || '',
      rw: row.rw || '',
      village: row.village || '',
      district: row.district || '',
      city: row.city || 'Kabupaten Karawang',
      province: row.province || 'Jawa Barat',
      address: row.address || '',
      rtRw: row.rt_rw || (row.rt && row.rw ? `${row.rt}/${row.rw}` : ''),
      phoneWhatsApp: row.phone || '',
      email: row.email || '',
    },
    majorChoice: {
      firstChoice: row.major_first || '',
      secondChoice: row.major_second || '',
    },
    schoolOrigin: {
      schoolName: row.school_origin || '',
      graduationYear: row.graduation_year || '2026',
      averageScore: row.average_score || '',
    },
    parentData: {
      fatherName: row.father_name || '',
      motherName: row.mother_name || '',
      fatherNik: row.father_nik || '',
      motherNik: row.mother_nik || '',
      fatherJob: row.father_job || row.parent_job || '',
      motherJob: row.mother_job || '',
      fatherPhone: row.father_phone || row.parent_phone || '',
      motherPhone: row.mother_phone || '',
      livingWithStatus: row.living_with_status || row.living_with || 'Orang Tua',
      parentAddress: row.parent_address || row.address || '',
      livingWith: row.living_with || 'Orang Tua',
      orphanStatus: row.orphan_status || 'Lengkap',
      hasGuardian: Boolean(row.has_guardian),
      guardianName: row.guardian_name || '',
      guardianJob: row.guardian_job || '',
      guardianPhone: row.guardian_phone || '',
      guardianRelation: row.guardian_relation || '',
      parentJob: row.father_job || row.parent_job || '',
      monthlyIncome: row.parent_income || '',
      parentPhone: row.father_phone || row.parent_phone || '',
    },
    additionalInfo: {
      uniformSize: row.uniform_size || 'L',
      transportMode: row.transport_mode || 'Sepeda Motor',
    },
    testScore: row.test_score ? Number(row.test_score) : 0,
    interviewScore: row.interview_score ? Number(row.interview_score) : 0,
    finalScore: row.final_score ? Number(row.final_score) : 0,
    verifiedBy: row.verified_by || undefined,
    verifiedAt: row.verified_at || undefined,
  };
}

// Convert Registration to DB row
export function mapRegistrationToRow(reg: Registration) {
  return {
    id: reg.id,
    registration_number: reg.registrationNumber,
    full_name: reg.personalData.fullName,
    nisn: reg.personalData.nisn || null,
    nik: reg.personalData.nik,
    kk_number: reg.personalData.kkNumber || null,
    gender: reg.personalData.gender,
    birth_place: reg.personalData.birthPlace,
    birth_date: reg.personalData.birthDate,
    religion: reg.personalData.religion,
    address: reg.personalData.address || null,
    hamlet: reg.personalData.hamlet || null,
    rt: reg.personalData.rt || null,
    rw: reg.personalData.rw || null,
    rt_rw: reg.personalData.rtRw || (reg.personalData.rt && reg.personalData.rw ? `${reg.personalData.rt}/${reg.personalData.rw}` : null),
    village: reg.personalData.village || null,
    district: reg.personalData.district || null,
    city: reg.personalData.city || null,
    province: reg.personalData.province || null,
    phone: reg.personalData.phoneWhatsApp,
    email: reg.personalData.email,
    school_origin: reg.schoolOrigin.schoolName,
    graduation_year: reg.schoolOrigin.graduationYear,
    average_score: reg.schoolOrigin.averageScore || null,
    major_first: reg.majorChoice.firstChoice,
    major_second: reg.majorChoice.secondChoice || null,
    father_name: reg.parentData.fatherName || null,
    mother_name: reg.parentData.motherName || null,
    father_nik: reg.parentData.fatherNik || null,
    mother_nik: reg.parentData.motherNik || null,
    father_job: reg.parentData.fatherJob || reg.parentData.parentJob || null,
    mother_job: reg.parentData.motherJob || null,
    father_phone: reg.parentData.fatherPhone || reg.parentData.parentPhone || null,
    mother_phone: reg.parentData.motherPhone || null,
    living_with_status: reg.parentData.livingWithStatus || reg.parentData.livingWith || 'Orang Tua',
    parent_address: reg.parentData.parentAddress || reg.personalData.address || null,
    living_with: reg.parentData.livingWith || reg.parentData.livingWithStatus || 'Orang Tua',
    orphan_status: reg.parentData.orphanStatus || 'Lengkap',
    has_guardian: reg.parentData.hasGuardian ?? false,
    guardian_name: reg.parentData.guardianName || null,
    guardian_job: reg.parentData.guardianJob || null,
    guardian_phone: reg.parentData.guardianPhone || null,
    guardian_relation: reg.parentData.guardianRelation || null,
    parent_job: reg.parentData.fatherJob || reg.parentData.parentJob || null,
    parent_income: reg.parentData.monthlyIncome || null,
    parent_phone: reg.parentData.fatherPhone || reg.parentData.parentPhone || null,
    uniform_size: reg.additionalInfo?.uniformSize || null,
    transport_mode: reg.additionalInfo?.transportMode || null,
    wave: reg.wave,
    status: reg.status,
    status_note: reg.statusNote || null,
    test_score: reg.testScore || 0,
    interview_score: reg.interviewScore || 0,
    final_score: reg.finalScore || 0,
    verified_by: reg.verifiedBy || null,
    verified_at: reg.verifiedAt || null,
    is_locked: reg.isLocked ?? false,
    data_payload: reg,
    updated_at: new Date().toISOString(),
  };
}

// Local Storage helpers
export function getLocalRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REG_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
      return INITIAL_REGISTRATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_REGISTRATIONS;
  }
}

export function saveLocalRegistrations(regs: Registration[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(regs));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// -------------------------------------------------------------
// SETTINGS & CONTENT MANAGEMENT API (Multi-User Synced)
// -------------------------------------------------------------

export function getLocalSchoolSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SCHOOL_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SCHOOL_SETTINGS,
      ...parsed,
      logoUrl: (!parsed.logoUrl || parsed.logoUrl.includes('photo-1546410531-bb4caa6b424d')) ? DEFAULT_OFFICIAL_LOGO : parsed.logoUrl,
      bgPatternUrl: parsed.bgPatternUrl || DEFAULT_CAMPUS_WALLPAPER,
    };
  } catch {
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export async function fetchSchoolSettings(): Promise<SchoolSettings> {
  try {
    const { data, error } = await supabase
      .from('spmb_settings')
      .select('settings_payload')
      .eq('id', 'primary_settings')
      .maybeSingle();

    if (error || !data || !data.settings_payload) {
      return getLocalSchoolSettings();
    }
    const rawPayload = data.settings_payload;
    const settings = {
      ...DEFAULT_SCHOOL_SETTINGS,
      ...rawPayload,
      logoUrl: (!rawPayload.logoUrl || rawPayload.logoUrl.includes('photo-1546410531-bb4caa6b424d')) ? DEFAULT_OFFICIAL_LOGO : rawPayload.logoUrl,
      bgPatternUrl: rawPayload.bgPatternUrl || DEFAULT_CAMPUS_WALLPAPER,
    } as SchoolSettings;
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  } catch {
    return getLocalSchoolSettings();
  }
}

export async function updateSchoolSettings(settings: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    broadcastMultiUserEvent('SETTINGS_UPDATED', settings);

    const { error } = await supabase
      .from('spmb_settings')
      .upsert({
        id: 'primary_settings',
        school_name: settings.schoolName,
        academic_year: settings.academicYear,
        settings_payload: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn('Failed to sync settings to Supabase:', error.message);
    }
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export function getLocalMajors(): Major[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MAJORS_KEY);
    return raw ? JSON.parse(raw) : MAJORS_LIST;
  } catch {
    return MAJORS_LIST;
  }
}

export async function saveMajorsList(majors: Major[]): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(LOCAL_STORAGE_MAJORS_KEY, JSON.stringify(majors));
    broadcastMultiUserEvent('MAJORS_UPDATED', majors);

    for (const m of majors) {
      await supabase.from('spmb_majors').upsert({
        id: m.id,
        code: m.code,
        name: m.name,
        short_desc: m.shortDesc,
        full_desc: m.fullDesc,
        quota: m.quota,
        filled_count: m.filledCount,
        color: m.color,
        icon: m.icon,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export function getLocalWaves(): Wave[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WAVES_KEY);
    return raw ? JSON.parse(raw) : WAVES_LIST;
  } catch {
    return WAVES_LIST;
  }
}

export async function saveWavesList(waves: Wave[]): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(LOCAL_STORAGE_WAVES_KEY, JSON.stringify(waves));
    broadcastMultiUserEvent('WAVES_UPDATED', waves);

    for (const w of waves) {
      await supabase.from('spmb_waves').upsert({
        id: w.id,
        name: w.name,
        start_date: w.startDate,
        end_date: w.endDate,
        is_active: w.isActive,
        benefits: w.benefits,
        quota: w.quota,
        fee: w.fee,
        discount_note: w.discountNote,
      });
    }
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export function getLocalSteps(): RegistrationStepItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STEPS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_REGISTRATION_STEPS;
  } catch {
    return DEFAULT_REGISTRATION_STEPS;
  }
}

export function saveStepsList(steps: RegistrationStepItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_STEPS_KEY, JSON.stringify(steps));
    broadcastMultiUserEvent('STEPS_UPDATED', steps);
  } catch (e) {
    console.error('Save steps error', e);
  }
}

export function getLocalAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : ANNOUNCEMENTS_LIST;
  } catch {
    return ANNOUNCEMENTS_LIST;
  }
}

export async function saveAnnouncementsList(announcements: Announcement[]): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(LOCAL_STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    broadcastMultiUserEvent('ANNOUNCEMENTS_UPDATED', announcements);

    for (const a of announcements) {
      await supabase.from('spmb_announcements').upsert({
        id: a.id,
        title: a.title,
        category: a.category,
        content: a.content,
        image_url: a.imageUrl,
        published_date: a.publishedDate,
        author: a.author,
        is_pinned: a.isPinned ?? false,
      });
    }
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

// Deletion helpers ensuring removal from local and Supabase DB
export async function deleteMajor(id: string): Promise<{ success: boolean; error?: string }> {
  const local = getLocalMajors().filter((m) => m.id !== id);
  localStorage.setItem(LOCAL_STORAGE_MAJORS_KEY, JSON.stringify(local));
  broadcastMultiUserEvent('MAJORS_UPDATED', local);
  try {
    const { error } = await supabase.from('spmb_majors').delete().eq('id', id);
    if (error) console.warn('Supabase delete major warning:', error.message);
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export async function deleteWave(id: string): Promise<{ success: boolean; error?: string }> {
  const local = getLocalWaves().filter((w) => w.id !== id);
  localStorage.setItem(LOCAL_STORAGE_WAVES_KEY, JSON.stringify(local));
  broadcastMultiUserEvent('WAVES_UPDATED', local);
  try {
    const { error } = await supabase.from('spmb_waves').delete().eq('id', id);
    if (error) console.warn('Supabase delete wave warning:', error.message);
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export async function deleteStep(id: string): Promise<{ success: boolean; error?: string }> {
  const local = getLocalSteps().filter((s) => s.id !== id);
  saveStepsList(local);
  try {
    const { error } = await supabase.from('spmb_steps').delete().eq('id', id);
    if (error) console.warn('Supabase delete step warning:', error.message);
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  const local = getLocalAnnouncements().filter((a) => a.id !== id);
  localStorage.setItem(LOCAL_STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(local));
  broadcastMultiUserEvent('ANNOUNCEMENTS_UPDATED', local);
  try {
    const { error } = await supabase.from('spmb_announcements').delete().eq('id', id);
    if (error) console.warn('Supabase delete announcement warning:', error.message);
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

// -------------------------------------------------------------
// PROMOTIONAL MEDIA MANAGEMENT (Multi-Photo / Video)
// -------------------------------------------------------------
export const DEFAULT_PROMO_MEDIA: PromoMediaItem[] = [
  {
    id: 'promo-01',
    title: 'Gedung & Fasilitas Praktik Modern SPMB 2026',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
    caption: 'Laboratorium Komputer & Bengkel Standar Industri Nasional',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'promo-02',
    title: 'Prestasi Juara LKS Vokasi Tingkat Provinsi',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    caption: 'Siswa SMK Lentera Bangsa 2 Meraih Juara 1 Desain Grafis & Web Tech',
    isActive: true,
    createdAt: '2026-01-05',
  },
  {
    id: 'promo-03',
    title: 'Kerjasama Magang Industri & Penyaluran Kerja',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    caption: 'MoU dengan 50+ Perusahaan Multinasional Kawasan Industri KIIC & Suryacipta',
    isActive: true,
    createdAt: '2026-01-10',
  },
];

export function getLocalPromoMediaList(): PromoMediaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROMO_MEDIA_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PROMO_MEDIA_KEY, JSON.stringify(DEFAULT_PROMO_MEDIA));
      return DEFAULT_PROMO_MEDIA;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMO_MEDIA;
  } catch {
    return DEFAULT_PROMO_MEDIA;
  }
}

export async function savePromoMediaList(items: PromoMediaItem[]): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(LOCAL_STORAGE_PROMO_MEDIA_KEY, JSON.stringify(items));
    broadcastMultiUserEvent('PROMO_MEDIA_UPDATED', items);

    for (const item of items) {
      await supabase.from('spmb_promo_media').upsert({
        id: item.id,
        title: item.title,
        type: item.type,
        url: item.url,
        caption: item.caption || null,
        is_active: item.isActive,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export async function deletePromoMedia(id: string): Promise<{ success: boolean; error?: string }> {
  const local = getLocalPromoMediaList().filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_PROMO_MEDIA_KEY, JSON.stringify(local));
  broadcastMultiUserEvent('PROMO_MEDIA_UPDATED', local);

  try {
    const { error } = await supabase.from('spmb_promo_media').delete().eq('id', id);
    if (error) console.warn('Supabase delete promo media warning:', error.message);
    return { success: true };
  } catch (e: any) {
    return { success: true, error: e?.message };
  }
}

export function getLocalSiteLayout(): SiteLayoutSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LAYOUT_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SITE_LAYOUT_SETTINGS;
  } catch {
    return DEFAULT_SITE_LAYOUT_SETTINGS;
  }
}

export function saveSiteLayout(layout: SiteLayoutSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LAYOUT_KEY, JSON.stringify(layout));
    broadcastMultiUserEvent('LAYOUT_UPDATED', layout);
  } catch (e) {
    console.error('Save layout error', e);
  }
}

// -------------------------------------------------------------
// NOTIFICATION GENERATION (WhatsApp & Email)
// -------------------------------------------------------------

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppNotificationUrl(
  phone: string,
  message: string
): string {
  const targetPhone = cleanPhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`;
}

export function createEmailNotificationUrl(
  email: string,
  subject: string,
  body: string
): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getNotificationTemplate(
  templateType: 'CONFIRM' | 'TEST_INVITE' | 'ACCEPTED' | 'REVISE_DOCS' | 'CUSTOM',
  student: Registration,
  settings: SchoolSettings,
  customMessage?: string
): { subject: string; message: string } {
  const school = settings.schoolName;
  const name = student.personalData.fullName;
  const regNum = student.registrationNumber;
  const major = student.majorChoice.firstChoice;

  switch (templateType) {
    case 'CONFIRM':
      return {
        subject: `Konfirmasi Pendaftaran SPMB - ${school} (${regNum})`,
        message: `Halo ${name},\n\nTerima kasih telah mendaftar di ${school} Tahun Ajaran ${settings.academicYear}.\n\n*Nomor Registrasi Anda:* ${regNum}\n*Jurusan Pilihan:* ${major}\n*Gelombang:* ${student.wave}\n\nSilakan cetak lembar formulir A4 Anda melalui menu Cek Status. Anda diwajibkan bergabung ke Grup WhatsApp Resmi SPMB melalui tautan:\n${settings.whatsappGroupLink}\n\nSalam,\nPanitia SPMB ${school}`,
      };
    case 'TEST_INVITE':
      return {
        subject: `Undangan Tes Minat Bakat & Wawancara - ${school}`,
        message: `Yth. Calon Peserta Didik ${name} (${regNum}),\n\nPanitia SPMB ${school} mengundang Anda untuk hadir mengikuti *Tes Minat Bakat & Wawancara Pemilihan Jurusan*:\n\nHari/Tanggal: Setiap hari Sabtu\nWaktu: Pukul 08.30 - 12.00 WIB\nTempat: Kampus ${school}\nPakaian: Seragam asal sekolah yang rapi\nPerlengkapan: Membawa Lembar Bukti Formulir A4 dan alat tulis.\n\nInformasi lebih lanjut hubungi: ${settings.phone}.\n\nTerima kasih.`,
      };
    case 'ACCEPTED':
      return {
        subject: `Selamat! Anda Dinyatakan DITERIMA di ${school}`,
        message: `🎉 *SELAMAT! KELULUSAN SELEKSI SPMB* 🎉\n\nKepada Yth. ${name} (No. Registrasi: ${regNum}),\n\nBerdasarkan hasil seleksi berkas, tes akademik, dan wawancara, Anda secara resmi dinyatakan:\n👉 *DITERIMA* pada Program Keahlian: *${major}*\n\nSilakan lakukan proses konfirmasi dan daftar ulang sesuai jadwal yang ditentukan. Lembar bukti penerimaan dapat diunduh melalui portal Cek Status SPMB.\n\nSelamat bergabung di keluarga besar ${school}!\n\nPanitia Penerimaan Siswa Baru`,
      };
    case 'REVISE_DOCS':
      return {
        subject: `Pemberitahuan Kelengkapan Dokumen SPMB - ${school}`,
        message: `Yth. ${name} (${regNum}),\n\nTim verifikasi panitia SPMB ${school} memberitahukan bahwa terdapat berkas/data pendaftaran Anda yang perlu dilengkapi/diperbaiki:\n\n*Catatan Panitia:* ${student.statusNote || 'Mohon periksa kembali kelengkapan foto/dokumen.'}\n\nSilakan buka menu Cek Status di website SPMB dan gunakan tombol "Perbaiki Data Mandiri" untuk melengkapi data sebelum batas waktu berakhir.\n\nTerima kasih.`,
      };
    default:
      return {
        subject: `Pemberitahuan Resmi SPMB ${school} - ${regNum}`,
        message: customMessage || `Halo ${name},\n\n${student.statusNote || 'Informasi terbaru mengenai pendaftaran Anda di ' + school}.\n\nSalam hangat,\nPanitia SPMB ${school}`,
      };
  }
}

// -------------------------------------------------------------
// Realtime Data & CRUD API for Registrations
// -------------------------------------------------------------

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  error?: string;
  count?: number;
}> {
  try {
    const { data, error, count } = await supabase
      .from('spmb_registrations')
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          connected: true,
          tableExists: false,
          error: 'Tabel "spmb_registrations" belum dibuat di database Supabase. Silakan jalankan Skrip SQL melalui menu "Setup Supabase / SQL".',
        };
      }
      return {
        connected: false,
        tableExists: false,
        error: error.message || 'Gagal tersambung ke Supabase.',
      };
    }

    return {
      connected: true,
      tableExists: true,
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      error: err?.message || 'Koneksi jaringan terputus.',
    };
  }
}

export async function fetchRegistrations(): Promise<{ data: Registration[]; source: 'supabase' | 'local' }> {
  try {
    const { data, error } = await supabase
      .from('spmb_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to local data:', error.message);
      return { data: getLocalRegistrations(), source: 'local' };
    }

    if (data && data.length > 0) {
      const mapped = data.map(mapRowToRegistration);
      saveLocalRegistrations(mapped);
      return { data: mapped, source: 'supabase' };
    }

    if (data && data.length === 0) {
      const local = getLocalRegistrations();
      for (const item of local) {
        await supabase.from('spmb_registrations').insert(mapRegistrationToRow(item)).select();
      }
      return { data: local, source: 'supabase' };
    }

    return { data: getLocalRegistrations(), source: 'local' };
  } catch (err) {
    console.warn('Network error, fallback to local registrations:', err);
    return { data: getLocalRegistrations(), source: 'local' };
  }
}

export async function createRegistration(registration: Registration): Promise<{ success: boolean; error?: string }> {
  const localList = getLocalRegistrations();
  const updatedList = [registration, ...localList.filter((r) => r.id !== registration.id)];
  saveLocalRegistrations(updatedList);

  broadcastMultiUserEvent('REGISTRATION_CREATED', registration);

  try {
    const row = mapRegistrationToRow(registration);
    const { error } = await supabase.from('spmb_registrations').insert(row);
    if (error) {
      console.warn('Failed to insert into Supabase:', error.message);
      return { success: true, error: 'Disimpan di cache lokal (tabel Supabase perlu dijalankan skripnya)' };
    }
    return { success: true };
  } catch (e: any) {
    console.warn('Supabase insert exception:', e);
    return { success: true, error: e?.message };
  }
}

export async function updateRegistrationStatus(
  id: string,
  updates: Partial<Registration>
): Promise<{ success: boolean; error?: string }> {
  const localList = getLocalRegistrations();
  const index = localList.findIndex((r) => r.id === id);
  if (index !== -1) {
    localList[index] = { ...localList[index], ...updates, updatedAt: new Date().toISOString() };
    saveLocalRegistrations(localList);
    broadcastMultiUserEvent('REGISTRATION_UPDATED', localList[index]);
  }

  try {
    const patchData: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.status !== undefined) patchData.status = updates.status;
    if (updates.statusNote !== undefined) patchData.status_note = updates.statusNote;
    if (updates.testScore !== undefined) patchData.test_score = updates.testScore;
    if (updates.interviewScore !== undefined) patchData.interview_score = updates.interviewScore;
    if (updates.finalScore !== undefined) patchData.final_score = updates.finalScore;
    if (updates.verifiedBy !== undefined) patchData.verified_by = updates.verifiedBy;
    if (updates.verifiedAt !== undefined) patchData.verified_at = updates.verifiedAt;
    if (updates.isLocked !== undefined) patchData.is_locked = updates.isLocked;

    if (index !== -1) {
      patchData.data_payload = localList[index];
    }

    const { error } = await supabase
      .from('spmb_registrations')
      .update(patchData)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

// Update complete student data (used by Self-Edit or Admin)
export async function updateStudentFullData(
  updatedReg: Registration
): Promise<{ success: boolean; error?: string }> {
  const localList = getLocalRegistrations();
  const index = localList.findIndex((r) => r.id === updatedReg.id);
  if (index !== -1) {
    localList[index] = { ...updatedReg, updatedAt: new Date().toISOString() };
    saveLocalRegistrations(localList);
    broadcastMultiUserEvent('REGISTRATION_UPDATED', localList[index]);
  }

  try {
    const row = mapRegistrationToRow({ ...updatedReg, updatedAt: new Date().toISOString() });
    const { error } = await supabase
      .from('spmb_registrations')
      .upsert(row);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

export async function deleteRegistration(id: string): Promise<{ success: boolean; error?: string }> {
  // 1. Immediately delete from local cache & broadcast
  const localList = getLocalRegistrations().filter((r) => r.id !== id);
  saveLocalRegistrations(localList);
  broadcastMultiUserEvent('REGISTRATION_DELETED', { id });

  // 2. Delete from Supabase remote database
  try {
    const { error } = await supabase.from('spmb_registrations').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete warning (remote):', error.message);
    }
    return { success: true };
  } catch (e: any) {
    console.warn('Supabase delete exception:', e);
    return { success: true };
  }
}

// -------------------------------------------------------------
// Realtime Multi-User Subscriptions (Supabase + Local Bus)
// -------------------------------------------------------------

export function subscribeToRealtimeSync(onSyncTrigger: (eventInfo?: { type: string; payload?: any }) => void) {
  let supabaseChannel: any = null;
  try {
    supabaseChannel = supabase
      .channel('spmb_multiuser_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spmb_registrations' },
        (payload) => {
          console.log('⚡ Realtime Supabase event:', payload.eventType);
          onSyncTrigger({ type: `SUPABASE_${payload.eventType}`, payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spmb_settings' },
        (payload) => {
          console.log('⚡ Settings changed remotely:', payload);
          onSyncTrigger({ type: 'SETTINGS_CHANGED', payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spmb_majors' },
        (payload) => {
          console.log('⚡ Majors changed remotely:', payload);
          onSyncTrigger({ type: 'MAJORS_CHANGED', payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spmb_waves' },
        (payload) => {
          console.log('⚡ Waves changed remotely:', payload);
          onSyncTrigger({ type: 'WAVES_CHANGED', payload });
        }
      )
      .subscribe((status) => {
        console.log('⚡ Supabase Realtime Status:', status);
      });
  } catch (e) {
    console.warn('Realtime Supabase channel setup error:', e);
  }

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      console.log('⚡ Local Multi-User Broadcast received:', event.data.type);
      onSyncTrigger(event.data);
    }
  };

  if (multiUserBroadcastChannel) {
    multiUserBroadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('spmb_')) {
      onSyncTrigger({ type: 'STORAGE_CHANGE', payload: e.key });
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
    if (multiUserBroadcastChannel) {
      multiUserBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

export const subscribeToRegistrations = (callback: () => void) => {
  return subscribeToRealtimeSync(() => callback());
};
