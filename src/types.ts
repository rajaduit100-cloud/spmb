export type RegistrationStatus = 
  | 'PENDING' 
  | 'VERIFIKASI_BERKAS' 
  | 'DITERIMA' 
  | 'CADANGAN' 
  | 'DITOLAK';

export type AdminRole = 'SUPER_ADMIN' | 'OPERATOR';

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface PersonalData {
  nik: string; // Nomor NIK Calon Siswa (16 digit) - Terpisah
  kkNumber: string; // Nomor Kartu Keluarga (KK) (16 digit) - Terpisah
  nisn?: string; // Nomor Induk Siswa Nasional (NISN) - Opsional
  fullName: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthPlace: string;
  birthDate: string;
  religion: string;
  
  // Pemisahan Kolom Alamat Lengkap
  hamlet?: string; // Kampung / Dusun
  rt?: string; // RT
  rw?: string; // RW
  village?: string; // Kelurahan / Desa
  district?: string; // Kecamatan
  city?: string; // Kabupaten / Kota
  province?: string; // Provinsi
  address?: string; // Jalan / Detail Alamat Tempat Tinggal
  rtRw?: string; // Kompatibilitas legacy
  
  phoneWhatsApp: string;
  email: string;
}

export interface MajorChoice {
  firstChoice: string;
  secondChoice?: string;
}

export interface SchoolOrigin {
  schoolName: string;
  graduationYear: string;
  averageScore?: string;
}

export interface ParentData {
  // 10 Struktur Kolom Baru Data Orang Tua / Wali:
  fatherName: string; // 1. Nama Ayah/Wali
  motherName: string; // 2. Nama Ibu/Wali
  fatherNik?: string; // 3. NIK Ayah/Wali
  motherNik?: string; // 4. NIK Ibu/Wali
  fatherJob?: string; // 5. Pekerjaan Ayah/Wali
  motherJob?: string; // 6. Pekerjaan Ibu/Wali
  fatherPhone?: string; // 7. Nomor Telepon/WA Ayah/Wali
  motherPhone?: string; // 8. Nomor Telepon/WA Ibu/Wali
  livingWithStatus?: string; // 9. Status Tinggal Bersama (Orang Tua / Wali)
  parentAddress?: string; // 10. Alamat Orang Tua/Wali

  // Kompatibilitas data lama / legacy
  livingWith?: 'Orang Tua' | 'Wali' | 'Asrama' | 'Sendiri';
  orphanStatus?: 'Lengkap' | 'Yatim' | 'Piatu' | 'Yatim Piatu';
  hasGuardian?: boolean;
  guardianName?: string;
  guardianJob?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  parentJob?: string;
  monthlyIncome?: string;
  parentPhone?: string;
}

export interface PromoMediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'youtube';
  url: string;
  caption?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdditionalInfo {
  uniformSize?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
  transportMode?: string;
  specialNeeds?: string;
  notes?: string;
}

export interface Registration {
  id: string;
  registrationNumber: string;
  createdAt: string;
  updatedAt?: string;
  status: RegistrationStatus;
  statusNote?: string;
  wave: string;
  personalData: PersonalData;
  majorChoice: MajorChoice;
  schoolOrigin: SchoolOrigin;
  parentData: ParentData;
  additionalInfo?: AdditionalInfo;
  
  // Scoring & Verification
  testScore?: number;
  interviewScore?: number;
  finalScore?: number;
  verifiedBy?: string;
  verifiedAt?: string;
  isLocked?: boolean; // Dikunci oleh admin agar pendaftar tidak dapat mengedit lagi
}

export interface Major {
  id: string;
  code: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  quota: number;
  filledCount: number;
  color?: string;
  icon?: string;
  imageUrl?: string;
}

export interface Wave {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  benefits: string;
  quota: number;
  fee: string;
  discountNote?: string;
}

export interface RegistrationStepItem {
  id: string;
  step: string;
  title: string;
  desc: string;
  icon: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'PENTING' | 'JADWAL_TES' | 'PENGUMUMAN_KELULUSAN' | 'INFO_DAFTAR_ULANG';
  content: string;
  imageUrl?: string;
  publishedDate: string;
  author: string;
  isPinned?: boolean;
  isActive?: boolean;
}

export interface SchoolSettings {
  schoolName: string;
  schoolTagline: string;
  academicYear: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  website: string;
  npsn: string;
  accreditation: string;
  headmasterName: string;
  headmasterNip?: string;
  committeeHeadName: string;
  announcementTicker: string;
  // New features
  whatsappGroupLink: string; // Link Grup WhatsApp wajib
  logoUrl?: string; // Foto profil / logo aplikasi
  bgPatternUrl?: string; // Gambar background aplikasi
  promoMediaUrl?: string; // Banner foto / video promosi di Hero Section
  promoMediaType?: 'image' | 'video' | 'youtube'; // Tipe media promosi
  promoMediaList?: PromoMediaItem[]; // Daftar foto/media promosi lengkap (multi-foto)
}

export interface SiteLayoutSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  showAnnouncements: boolean;
  showMajorsSection: boolean;
  showWavesSection: boolean;
  showStepsSection: boolean;
  showStats: boolean;
  announcementTickerActive: boolean;
  themeStyle?: 'modern-blue' | 'emerald-fresh' | 'dark-slate' | 'royal-indigo';
}
