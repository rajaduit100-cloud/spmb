/**
 * SPMB SMK Lentera Bangsa 2 - Core Application Logic
 * Pure ES6+ Vanilla JavaScript with Complete Dynamic Form Builder,
 * Precise 1-Page A4 Micro-Table Layout, and Supabase DDL SQL Generator.
 */

// ================= 1. SUPABASE CLIENT & CONFIGURATION =================
const SUPABASE_URL = 'https://ttxjmrpnanfunegquefr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eGptcnBuYW5mdW5lZ3F1ZWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMTYwNzEsImV4cCI6MjEwOTg5MjA3MX0.84nwkZgnfOLABqbxp__UnOeWbSL7dQHcsOFfdRYGBS0';

let supabase = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {}
}

// ================= 2. STORAGE KEYS & SEED DATA =================
const STORAGE_KEYS = {
  ADMIN_SESSION: 'spmb_admin_session',
  PENDAFTAR: 'spmb_data_pendaftar_v4',
  GELOMBANG: 'spmb_data_gelombang_v4',
  PENGUMUMAN: 'spmb_data_pengumuman_v4',
  SETTINGS: 'spmb_data_settings_v4',
  BANNERS: 'spmb_data_banners_v4',
  JURUSAN: 'spmb_data_jurusan_v4',
  FORM_FIELDS: 'spmb_data_form_fields_v4'
};

const DEFAULT_SETTINGS = {
  nama_sekolah: 'SMK Lentera Bangsa 2',
  slogan: 'Cerdas, Terampil, Mandiri & Berakhlak Mulia',
  alamat: 'Jl. Raya Lentera Bangsa No. 02, Kec. Klari, Kab. Karawang, Jawa Barat 41371',
  wa: '0812-9876-5432',
  email: 'spmb@smklenterabangsa2.sch.id',
  logo_url: '/src/assets/images/logo_lentera_bangsa_1794320505470.jpg',
  nama_ketua_panitia: 'Drs. H. Mulyadi, M.Pd.',
  nip_ketua_panitia: 'NIP. 19740512 200212 1 004',
  wa_group_url: 'https://chat.whatsapp.com/GrupSPMBLenteraBangsa2'
};

const DEFAULT_JURUSAN = [
  {
    id: 'jur-1',
    kode: 'RPL',
    nama: 'Rekayasa Perangkat Lunak (RPL)',
    kuota: 72,
    deskripsi: 'Mempelajari pemrograman web modern, mobile application, database management, dan cloud computing dengan kurikulum standar industri IT.',
    prospek: 'Full-Stack Developer, Mobile Dev, Database Admin, UI/UX Designer',
    image_url: '/src/assets/images/banner_lab_komputer_1794320505489.jpg'
  },
  {
    id: 'jur-2',
    kode: 'TKJ',
    nama: 'Teknik Jaringan Komputer (TKJ)',
    kuota: 72,
    deskripsi: 'Penguasaan infrastruktur jaringan fiber optik, administrasi server Linux/Windows, mikrotik routerboard, dan keamanan cyber.',
    prospek: 'Network Engineer, System Administrator, Cyber Security Analyst',
    image_url: '/src/assets/images/banner_lab_komputer_1794320505489.jpg'
  },
  {
    id: 'jur-3',
    kode: 'DKV',
    nama: 'Desain Komunikasi Visual (DKV)',
    kuota: 72,
    deskripsi: 'Fokus keahlian desain grafis, ilustrasi digital, videografi, fotografi komersial, animasi 2D/3D, dan branding periklanan.',
    prospek: 'Creative Director, Graphic Designer, Video Editor, Content Creator',
    image_url: '/src/assets/images/banner_workshop_smk_1794320510643.jpg'
  },
  {
    id: 'jur-4',
    kode: 'TO',
    nama: 'Teknik Otomotif (TO)',
    kuota: 72,
    deskripsi: 'Pemeliharaan mesin kendaraan ringan, teknologi EFI / Hybrid, kelistrikan bodi, dan sistem transmisi otomatis modern.',
    prospek: 'Teknisi Bengkel Resmi (Astra/Daihatsu), Service Advisor, Modifikator',
    image_url: '/src/assets/images/banner_workshop_smk_1794320510643.jpg'
  },
  {
    id: 'jur-5',
    kode: 'MP',
    nama: 'Manajemen Perkantoran (MP)',
    kuota: 72,
    deskripsi: 'Administrasi bisnis digital, korespondensi kantor, tata kelola kearsipan digital, customer relation, dan otomasi perkantoran modern.',
    prospek: 'Staff Administrasi, Public Relations, Secretary, Office Executive',
    image_url: '/src/assets/images/hero_campus_smk_1794320504766.jpg'
  }
];

// Complete Dynamic Form Fields Configurable by Admin
const DEFAULT_FORM_FIELDS = [
  // Section A: Jalur & Jurusan
  { id: 'gelombang', section: 'jalur', label: 'Gelombang Pendaftaran', type: 'gelombang_select', required: true, placeholder: '-- Pilih Gelombang --', options: [] },
  { id: 'jurusan', section: 'jalur', label: 'Pilihan Program Keahlian (Jurusan)', type: 'jurusan_select', required: true, placeholder: '-- Pilih Program Keahlian --', options: [] },

  // Section B: Identitas Diri Calon Siswa
  { id: 'nama', section: 'siswa', label: 'Nama Lengkap Calon Siswa', type: 'text', required: true, placeholder: 'Sesuai Akta Kelahiran / Ijazah SMP', options: [] },
  { id: 'nisn', section: 'siswa', label: 'NISN (10 Digit Angka)', type: 'text', required: true, placeholder: 'Contoh: 0071234567', options: [], pattern: '[0-9]{10}', maxlength: 10 },
  { id: 'nik', section: 'siswa', label: 'NIK (16 Digit Angka)', type: 'text', required: true, placeholder: 'Contoh: 3215012304070001', options: [], pattern: '[0-9]{16}', maxlength: 16 },
  { id: 'tempat_lahir', section: 'siswa', label: 'Tempat Lahir', type: 'text', required: true, placeholder: 'Contoh: Karawang', options: [] },
  { id: 'tanggal_lahir', section: 'siswa', label: 'Tanggal Lahir', type: 'date', required: true, placeholder: '', options: [] },
  { id: 'gender', section: 'siswa', label: 'Jenis Kelamin', type: 'select', required: true, placeholder: '-- Pilih Jenis Kelamin --', options: ['Laki-laki', 'Perempuan'] },
  { id: 'agama', section: 'siswa', label: 'Agama', type: 'select', required: true, placeholder: '-- Pilih Agama --', options: ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'] },
  { id: 'asal_sekolah', section: 'siswa', label: 'Asal Sekolah (SMP / MTs)', type: 'text', required: true, placeholder: 'Contoh: SMP Negeri 1 Klari', options: [] },
  { id: 'alamat', section: 'siswa', label: 'Alamat Lengkap Tempat Tinggal', type: 'textarea', required: true, placeholder: 'Dusun/Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kab', options: [] },

  // Section C: Data Orang Tua & Kontak
  { id: 'nama_ortu', section: 'ortu', label: 'Nama Orang Tua / Wali', type: 'text', required: true, placeholder: 'Contoh: Bpk. Bambang Sutrisno', options: [] },
  { id: 'pekerjaan_ortu', section: 'ortu', label: 'Pekerjaan Orang Tua / Wali', type: 'text', required: false, placeholder: 'Contoh: Karyawan Swasta / Wiraswasta', options: [] },
  { id: 'hp_ortu', section: 'ortu', label: 'No. WhatsApp / HP Orang Tua', type: 'tel', required: true, placeholder: 'Contoh: 081234567890', options: [] },
  { id: 'hp_siswa', section: 'ortu', label: 'No. WhatsApp Calon Siswa (Grup WA)', type: 'tel', required: true, placeholder: 'Contoh: 089876543210', options: [] },

  // Section D: Kelengkapan Administrasi Tambahan
  { id: 'ukuran_seragam', section: 'tambahan', label: 'Ukuran Seragam Sekolah', type: 'select', required: true, placeholder: '-- Pilih Ukuran Seragam --', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'prestasi', section: 'tambahan', label: 'Prestasi / Bakat Minat', type: 'text', required: false, placeholder: 'Contoh: Juara Futsal / Desain Poster / MTQ', options: [] }
];

const DEFAULT_GELOMBANG = [
  {
    id: 'gel-1',
    nama: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
    mulai: '2026-01-05',
    selesai: '2026-03-31',
    kuota: 150,
    diskon: 'Potongan Biaya Sarana Pendidikan (DSP) 50%',
    status: 'Aktif'
  },
  {
    id: 'gel-2',
    nama: 'Gelombang 2 (Jalur Reguler)',
    mulai: '2026-04-01',
    selesai: '2026-06-25',
    kuota: 200,
    diskon: 'Potongan Biaya Sarana Pendidikan (DSP) 25%',
    status: 'Aktif'
  },
  {
    id: 'gel-3',
    nama: 'Gelombang 3 (Jalur Penutup / Cadangan)',
    mulai: '2026-07-01',
    selesai: '2026-07-18',
    kuota: 100,
    diskon: 'Sesuai Ketentuan Normal Panitia',
    status: 'Segera'
  }
];

const DEFAULT_PENGUMUMAN = [
  {
    id: 'ann-1',
    judul: 'Jadwal Tes Minat Bakat & Wawancara Gelombang 1',
    kategori: 'Jadwal',
    tanggal: '2026-03-15',
    isi: 'Diberitahukan kepada seluruh calon siswa pendaftar Gelombang 1 bahwa Tes Minat Bakat serta wawancara peminatan jurusan akan diselenggarakan secara luring bertahap di Kampus SMK Lentera Bangsa 2 mulai tanggal 15 s.d 20 Maret 2026. Harap membawa lembar bukti pendaftaran yang telah dicetak dan mengenakan seragam sekolah asal lengkap.'
  },
  {
    id: 'ann-2',
    judul: 'Beasiswa Penuh Bebas SPP 1 Tahun untuk Juara Kelas',
    kategori: 'Beasiswa',
    tanggal: '2026-02-20',
    isi: 'SMK Lentera Bangsa 2 memberikan apresiasi beasiswa bebas SPP selama 1 tahun penuh bagi calon siswa yang meraih peringkat 1 s.d 3 di SMP/MTs asal atau memiliki sertifikat juara minimal tingkat Kabupaten. Bukti piagam/rapor dapat dilampirkan saat verifikasi berkas.'
  },
  {
    id: 'ann-3',
    judul: 'Syarat Berkas Fisik yang Harus Dibawa Saat Verifikasi',
    kategori: 'Syarat',
    tanggal: '2026-02-10',
    isi: 'Calon siswa yang telah mendaftar online wajib membawa berkas: 1. Cetak Bukti Pendaftaran Online ber-QR Code. 2. Fotokopi Kartu Keluarga (2 rangkap). 3. Fotokopi Akta Kelahiran (2 rangkap). 4. Surat Keterangan Lulus/Surat Keterangan Berkelakuan Baik dari SMP/MTs. 5. Pas Foto 3x4 berwarna (3 lembar).'
  }
];

const DEFAULT_BANNERS = [
  {
    id: 'ban-1',
    judul: 'Penerimaan Murid Baru TP 2026/2027',
    deskripsi: 'Wujudkan cita-cita masa depan gemilang dengan pendidikan vokasi unggul dan siap kerja.',
    image_url: '/src/assets/images/hero_campus_smk_1794320504766.jpg',
    status: 'Aktif',
    urutan: 1
  },
  {
    id: 'ban-2',
    judul: 'Laboratorium Rekayasa Perangkat Lunak & Jaringan Komputer',
    deskripsi: 'Dilengkapi fasilitas workstation modern standar industri dan sertifikasi internasional.',
    image_url: '/src/assets/images/banner_lab_komputer_1794320505489.jpg',
    status: 'Aktif',
    urutan: 2
  },
  {
    id: 'ban-3',
    judul: 'Workshop Teknik Otomotif & Studio Multimedia DKV',
    deskripsi: 'Kerjasama resmi dengan industri otomotif terkemuka dan studio kreatif nasional.',
    image_url: '/src/assets/images/banner_workshop_smk_1794320510643.jpg',
    status: 'Aktif',
    urutan: 3
  }
];

const DEFAULT_PENDAFTAR = [
  {
    id: 'pnd-1',
    kode: 'LB2-2026-001',
    nama: 'Muhammad Rizky Pratama',
    nisn: '0071234567',
    nik: '3215012304070001',
    jurusan: 'Rekayasa Perangkat Lunak (RPL)',
    gelombang: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
    status: 'Diterima',
    catatan: 'Selamat! Calon siswa dinyatakan DITERIMA pada program keahlian RPL melalui Jalur Prestasi.',
    created_at: '2026-02-10T08:30:00Z',
    foto_url: '',
    formData: {
      gelombang: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
      jurusan: 'Rekayasa Perangkat Lunak (RPL)',
      nama: 'Muhammad Rizky Pratama',
      nisn: '0071234567',
      nik: '3215012304070001',
      tempat_lahir: 'Karawang',
      tanggal_lahir: '2008-04-23',
      gender: 'Laki-laki',
      agama: 'Islam',
      asal_sekolah: 'SMP Negeri 1 Klari',
      alamat: 'Dusun Krajan RT 02/01, Desa Cibalongsari, Kec. Klari, Kab. Karawang',
      nama_ortu: 'Bambang Sutrisno',
      pekerjaan_ortu: 'Wiraswasta',
      hp_ortu: '081288991122',
      hp_siswa: '089677889900',
      ukuran_seragam: 'L',
      prestasi: 'Juara 2 Futsal Kab. Karawang'
    }
  },
  {
    id: 'pnd-2',
    kode: 'LB2-2026-002',
    nama: 'Siti Nur Aisyah',
    nisn: '0082345678',
    nik: '3215015509080002',
    jurusan: 'Desain Komunikasi Visual (DKV)',
    gelombang: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
    status: 'Diverifikasi',
    catatan: 'Berkas pendaftaran telah diverifikasi. Menunggu jadwal tes wawancara minat bakat.',
    created_at: '2026-02-12T09:45:00Z',
    foto_url: '',
    formData: {
      gelombang: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
      jurusan: 'Desain Komunikasi Visual (DKV)',
      nama: 'Siti Nur Aisyah',
      nisn: '0082345678',
      nik: '3215015509080002',
      tempat_lahir: 'Bekasi',
      tanggal_lahir: '2008-09-15',
      gender: 'Perempuan',
      agama: 'Islam',
      asal_sekolah: 'MTs Negeri 2 Karawang',
      alamat: 'Perum Kosambi Baru Blok B3 No. 12, Klari, Karawang',
      nama_ortu: 'H. Suhendar',
      pekerjaan_ortu: 'PNS',
      hp_ortu: '081312345678',
      hp_siswa: '087812345678',
      ukuran_seragam: 'M',
      prestasi: 'Juara 1 Desain Poster SMP'
    }
  },
  {
    id: 'pnd-3',
    kode: 'LB2-2026-003',
    nama: 'Ahmad Fauzi Alfarizi',
    nisn: '0073456789',
    nik: '3215011001080003',
    jurusan: 'Teknik Jaringan Komputer (TKJ)',
    gelombang: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
    status: 'Diterima',
    catatan: 'Dinyatakan DITERIMA di jurusan TKJ. Harap segera menyelesaikan daftar ulang.',
    created_at: '2026-02-15T10:15:00Z',
    foto_url: '',
    formData: {
      gelombang: 'Gelombang 1 (Jalur Prestasi & Early Bird)',
      jurusan: 'Teknik Jaringan Komputer (TKJ)',
      nama: 'Ahmad Fauzi Alfarizi',
      nisn: '0073456789',
      nik: '3215011001080003',
      tempat_lahir: 'Karawang',
      tanggal_lahir: '2008-01-10',
      gender: 'Laki-laki',
      agama: 'Islam',
      asal_sekolah: 'SMP PGRI Klari',
      alamat: 'Jl. Raya Kosambi No. 45, Duren, Klari, Karawang',
      nama_ortu: 'Rahmat Hidayat',
      pekerjaan_ortu: 'Karyawan Swasta',
      hp_ortu: '085711223344',
      hp_siswa: '089533445566',
      ukuran_seragam: 'XL',
      prestasi: 'Olimpiade Komputer Tingkat Kabupaten'
    }
  }
];

function getLocalData(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalData(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

let appState = {
  settings: getLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  jurusan: getLocalData(STORAGE_KEYS.JURUSAN, DEFAULT_JURUSAN),
  formFields: getLocalData(STORAGE_KEYS.FORM_FIELDS, DEFAULT_FORM_FIELDS),
  banners: getLocalData(STORAGE_KEYS.BANNERS, DEFAULT_BANNERS),
  gelombang: getLocalData(STORAGE_KEYS.GELOMBANG, DEFAULT_GELOMBANG),
  pengumuman: getLocalData(STORAGE_KEYS.PENGUMUMAN, DEFAULT_PENGUMUMAN),
  pendaftar: getLocalData(STORAGE_KEYS.PENDAFTAR, DEFAULT_PENDAFTAR),
  currentSlideIndex: 0,
  sliderTimer: null,
  activeAdminTab: 'pendaftar',
  tempStudentPhoto: null,
  tempBannerPhoto: null,
  tempJurusanPhoto: null,
  lastRegisteredStudent: null
};

// ================= 3. TOAST NOTIFICATION SYSTEM =================
window.showToast = function(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg text-xs transition-all duration-300 transform translate-y-2 opacity-0 bg-white ${
    type === 'success' ? 'border-emerald-200 text-emerald-900 ring-1 ring-emerald-500/10' :
    type === 'error' ? 'border-rose-200 text-rose-900 ring-1 ring-rose-500/10' :
    type === 'warning' ? 'border-amber-200 text-amber-900 ring-1 ring-amber-500/10' :
    'border-primary-200 text-primary-900 ring-1 ring-primary-500/10'
  }`;

  const iconSvg = type === 'success' 
    ? '<svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
    : type === 'error'
    ? '<svg class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
    : '<svg class="w-4 h-4 text-primary-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 font-medium leading-relaxed">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 p-0.5">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ================= 4. IN-APP CONFIRMATION DELETE MODAL =================
function requestConfirmDelete(message, onConfirm) {
  const modal = document.getElementById('modalConfirmDelete');
  const msgEl = document.getElementById('confirmDeleteMessage');
  const btn = document.getElementById('btnExecuteDelete');
  if (!modal || !btn) return;

  if (msgEl) msgEl.innerText = message;
  btn.onclick = () => {
    closeConfirmDeleteModal();
    onConfirm();
  };
  modal.classList.remove('hidden');
}

window.closeConfirmDeleteModal = function() {
  const modal = document.getElementById('modalConfirmDelete');
  if (modal) modal.classList.add('hidden');
};

// ================= 5. FORM BUILDER: DYNAMIC FIELD CRUD & RENDERING =================
const SECTION_TITLES = {
  jalur: { code: 'A', title: 'Pilihan Jalur & Kompetensi Keahlian' },
  siswa: { code: 'B', title: 'Identitas Diri Calon Siswa' },
  ortu: { code: 'C', title: 'Data Orang Tua / Wali & Kontak' },
  tambahan: { code: 'D', title: 'Kelengkapan Administrasi Tambahan' }
};

function renderPublicRegistrationForm() {
  const container = document.getElementById('dynamicFormSectionsContainer');
  if (!container) return;

  const sections = ['jalur', 'siswa', 'ortu', 'tambahan'];
  
  container.innerHTML = sections.map(secKey => {
    const fieldsInSec = appState.formFields.filter(f => f.section === secKey);
    if (fieldsInSec.length === 0) return '';

    const secMeta = SECTION_TITLES[secKey];

    const fieldsMarkup = fieldsInSec.map(field => {
      // Special input: Gelombang Select
      if (field.type === 'gelombang_select') {
        return `
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">${field.label} ${field.required ? '<span class="text-rose-500">*</span>' : ''}</label>
            <select name="field_${field.id}" ${field.required ? 'required' : ''} class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">${field.placeholder || '-- Pilih Gelombang --'}</option>
              ${appState.gelombang.filter(g => g.status === 'Aktif').map(g => `<option value="${g.nama}">${g.nama}</option>`).join('')}
            </select>
          </div>
        `;
      }

      // Special input: Jurusan Select
      if (field.type === 'jurusan_select') {
        return `
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">${field.label} ${field.required ? '<span class="text-rose-500">*</span>' : ''}</label>
            <select name="field_${field.id}" ${field.required ? 'required' : ''} class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">${field.placeholder || '-- Pilih Program Keahlian --'}</option>
              ${appState.jurusan.map(j => `<option value="${j.nama}">${j.nama}</option>`).join('')}
            </select>
          </div>
        `;
      }

      // Dropdown Select
      if (field.type === 'select') {
        return `
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">${field.label} ${field.required ? '<span class="text-rose-500">*</span>' : ''}</label>
            <select name="field_${field.id}" ${field.required ? 'required' : ''} class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">${field.placeholder || '-- Pilih --'}</option>
              ${(field.options || []).map(opt => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('')}
            </select>
          </div>
        `;
      }

      // Textarea
      if (field.type === 'textarea') {
        return `
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">${field.label} ${field.required ? '<span class="text-rose-500">*</span>' : ''}</label>
            <textarea name="field_${field.id}" ${field.required ? 'required' : ''} rows="2" placeholder="${field.placeholder || ''}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
        `;
      }

      // Standard Inputs (text, date, number, tel)
      const isSpan2 = field.id === 'nama' || field.id === 'asal_sekolah';
      return `
        <div class="${isSpan2 ? 'sm:col-span-2' : ''}">
          <label class="block text-xs font-semibold text-slate-700 mb-1">${field.label} ${field.required ? '<span class="text-rose-500">*</span>' : ''}</label>
          <input type="${field.type}" name="field_${field.id}" ${field.required ? 'required' : ''} ${field.pattern ? `pattern="${field.pattern}"` : ''} ${field.maxlength ? `maxlength="${field.maxlength}"` : ''} placeholder="${field.placeholder || ''}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 ${field.type === 'tel' || field.id === 'nisn' || field.id === 'nik' ? 'font-mono' : ''}" />
        </div>
      `;
    }).join('');

    return `
      <div>
        <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-800 text-xs font-bold flex items-center justify-center">${secMeta.code}</span>
          <h3 class="text-base font-bold text-slate-900">${secMeta.title}</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${fieldsMarkup}
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminFormBuilder() {
  const container = document.getElementById('adminFormBuilderContainer');
  if (!container) return;

  const sections = ['jalur', 'siswa', 'ortu', 'tambahan'];

  container.innerHTML = sections.map(secKey => {
    const fieldsInSec = appState.formFields.filter(f => f.section === secKey);
    const secMeta = SECTION_TITLES[secKey];

    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-primary-800 text-white text-[10px] font-bold flex items-center justify-center">${secMeta.code}</span>
            <span class="font-bold text-xs text-slate-800 uppercase tracking-wider">${secMeta.title}</span>
            <span class="text-xs text-slate-400 font-mono">(${fieldsInSec.length} Kolom Isian)</span>
          </div>
          <button onclick="openAddFormFieldModal('${secKey}')" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Tambah ke Bagian Ini</span>
          </button>
        </div>

        <div class="divide-y divide-slate-100">
          ${fieldsInSec.length === 0 ? '<div class="p-4 text-xs text-slate-400 italic">Belum ada kolom isian pada bagian ini.</div>' : ''}
          ${fieldsInSec.map((field, idx) => `
            <div class="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-xs">
              <div class="flex items-center gap-3 min-w-0">
                <span class="font-mono text-slate-400 text-[11px] w-5">${idx + 1}.</span>
                <div>
                  <div class="font-bold text-slate-900 flex items-center gap-2">
                    <span>${field.label}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${field.required ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}">
                      ${field.required ? 'Wajib' : 'Opsional'}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    Tipe: <span class="font-mono font-semibold">${field.type}</span>
                    ${field.placeholder ? ` · Contoh: "${field.placeholder}"` : ''}
                    ${field.options && field.options.length ? ` · Pilihan: [${field.options.join(', ')}]` : ''}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="openEditFormFieldModal('${field.id}')" class="p-1.5 text-primary-700 hover:bg-primary-50 rounded" title="Ubah Isian">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
                <button onclick="confirmDeleteFormField('${field.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Hapus Isian">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

window.openAddFormFieldModal = function(defaultSection = 'siswa') {
  document.getElementById('formFieldId').value = '';
  document.getElementById('modalFormFieldTitle').innerText = 'Tambah Isian Formulir Baru';
  document.getElementById('formFieldLabel').value = '';
  document.getElementById('formFieldSection').value = defaultSection;
  document.getElementById('formFieldType').value = 'text';
  document.getElementById('formFieldRequired').value = 'true';
  document.getElementById('formFieldPlaceholder').value = '';
  document.getElementById('formFieldOptions').value = '';
  toggleFormFieldOptionsVisibility();
  document.getElementById('modalFormField').classList.remove('hidden');
};

window.openEditFormFieldModal = function(fieldId) {
  const f = appState.formFields.find(item => item.id === fieldId);
  if (!f) return;

  document.getElementById('formFieldId').value = f.id;
  document.getElementById('modalFormFieldTitle').innerText = 'Ubah Isian Formulir';
  document.getElementById('formFieldLabel').value = f.label;
  document.getElementById('formFieldSection').value = f.section || 'siswa';
  document.getElementById('formFieldType').value = f.type || 'text';
  document.getElementById('formFieldRequired').value = f.required ? 'true' : 'false';
  document.getElementById('formFieldPlaceholder').value = f.placeholder || '';
  document.getElementById('formFieldOptions').value = (f.options || []).join(', ');
  toggleFormFieldOptionsVisibility();
  document.getElementById('modalFormField').classList.remove('hidden');
};

window.closeFormFieldModal = function() {
  document.getElementById('modalFormField').classList.add('hidden');
};

window.toggleFormFieldOptionsVisibility = function() {
  const type = document.getElementById('formFieldType').value;
  const group = document.getElementById('formFieldOptionsGroup');
  if (type === 'select') {
    group.classList.remove('hidden');
  } else {
    group.classList.add('hidden');
  }
};

window.handleSaveFormField = function(event) {
  event.preventDefault();
  const id = document.getElementById('formFieldId').value || ('field_' + Date.now());
  const label = document.getElementById('formFieldLabel').value.trim();
  const section = document.getElementById('formFieldSection').value;
  const type = document.getElementById('formFieldType').value;
  const required = document.getElementById('formFieldRequired').value === 'true';
  const placeholder = document.getElementById('formFieldPlaceholder').value.trim();
  const optionsRaw = document.getElementById('formFieldOptions').value.trim();
  const options = optionsRaw ? optionsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const newField = { id, section, label, type, required, placeholder, options };

  const existingIdx = appState.formFields.findIndex(f => f.id === id);
  if (existingIdx !== -1) {
    appState.formFields[existingIdx] = newField;
  } else {
    appState.formFields.push(newField);
  }

  setLocalData(STORAGE_KEYS.FORM_FIELDS, appState.formFields);
  closeFormFieldModal();
  renderPublicRegistrationForm();
  renderAdminFormBuilder();
  window.showToast('Isian formulir berhasil diperbarui.', 'success');
};

window.confirmDeleteFormField = function(fieldId) {
  const f = appState.formFields.find(item => item.id === fieldId);
  requestConfirmDelete(`Hapus kolom isian "${f ? f.label : 'ini'}" dari formulir SPMB?`, () => {
    appState.formFields = appState.formFields.filter(item => item.id !== fieldId);
    setLocalData(STORAGE_KEYS.FORM_FIELDS, appState.formFields);
    renderPublicRegistrationForm();
    renderAdminFormBuilder();
    window.showToast('Kolom isian formulir telah dihapus.', 'info');
  });
};

// ================= 6. REGISTRATION SUBMISSION & WA REDIRECT =================
window.previewStudentPhoto = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    appState.tempStudentPhoto = e.target.result;
    const preview = document.getElementById('formFotoPreview');
    if (preview) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    }
    window.showToast('Foto calon siswa berhasil dimuat.', 'info');
  };
  reader.readAsDataURL(file);
};

window.handleRegistrationSubmit = async function(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('btnSubmitPendaftaran');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      <span>Menyimpan Pendaftaran...</span>
    `;
  }

  try {
    const formData = {};
    const form = document.getElementById('formPendaftaran');

    appState.formFields.forEach(f => {
      const el = form.querySelector(`[name="field_${f.id}"]`);
      if (el) {
        formData[f.id] = el.value.trim();
      }
    });

    const nama = formData.nama || 'Calon Siswa';
    const nisn = formData.nisn || '';
    const nik = formData.nik || '';
    const jurusan = formData.jurusan || 'Belum Dipilih';
    const gelombang = formData.gelombang || 'Gelombang 1';
    const asal_sekolah = formData.asal_sekolah || '-';

    // Duplicate check if NISN provided
    if (nisn) {
      const duplicate = appState.pendaftar.find(p => p.nisn === nisn);
      if (duplicate) {
        window.showToast(`NISN ${nisn} sudah terdaftar dengan kode ${duplicate.kode}.`, 'warning');
        window.openPrintCardModal(duplicate);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Kirim Pendaftaran Sekarang'; }
        return;
      }
    }

    const nextSeq = (appState.pendaftar.length + 1).toString().padStart(3, '0');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const kode = `LB2-2026-${nextSeq}${randomSuffix}`;

    const newPendaftar = {
      id: 'pnd-' + Date.now(),
      kode,
      nama,
      nisn,
      nik,
      jurusan,
      gelombang,
      asal_sekolah,
      status: 'Pending',
      catatan: 'Pendaftaran berhasil dikirim. Menunggu verifikasi berkas oleh panitia SPMB.',
      created_at: new Date().toISOString(),
      foto_url: appState.tempStudentPhoto || '',
      formData
    };

    appState.pendaftar.unshift(newPendaftar);
    setLocalData(STORAGE_KEYS.PENDAFTAR, appState.pendaftar);
    appState.lastRegisteredStudent = newPendaftar;

    // Reset Form
    form.reset();
    const photoPrev = document.getElementById('formFotoPreview');
    if (photoPrev) photoPrev.classList.add('hidden');
    appState.tempStudentPhoto = null;

    renderAdminCounters();
    renderAdminPendaftarTable();
    renderPublicStats();

    // Show WhatsApp Group Prompt Modal
    openSuccessRegistrationModal(newPendaftar);

  } catch (err) {
    window.showToast('Gagal mengirim pendaftaran: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        <span>Kirim Pendaftaran Sekarang</span>
      `;
    }
  }
};

function openSuccessRegistrationModal(student) {
  const modal = document.getElementById('modalSuccessRegistration');
  const codeEl = document.getElementById('successRegCode');
  const btnWa = document.getElementById('btnJoinWhatsAppGroup');
  if (!modal) return;

  if (codeEl) codeEl.innerText = student.kode;

  const waUrl = appState.settings.wa_group_url || 'https://chat.whatsapp.com/GrupSPMBLenteraBangsa2';
  if (btnWa) btnWa.href = waUrl;

  modal.classList.remove('hidden');
}

window.closeSuccessRegistrationModal = function() {
  const modal = document.getElementById('modalSuccessRegistration');
  if (modal) modal.classList.add('hidden');
};

window.openBuktiFromSuccessModal = function() {
  closeSuccessRegistrationModal();
  if (appState.lastRegisteredStudent) {
    window.openPrintCardModal(appState.lastRegisteredStudent);
  }
};

// ================= 7. BUKTI PENDAFTARAN & BLANKO PRINT (PRECISE 1-PAGE A4 MICRO-TABLES) =================
window.openPrintCardModalByKode = function(kode) {
  const student = appState.pendaftar.find(p => p.kode === kode);
  if (student) {
    window.closeCheckStatusModal();
    window.openPrintCardModal(student);
  }
};

window.openPrintCardModal = function(student) {
  const modal = document.getElementById('modalPrintCard');
  if (!modal || !student) return;

  const fd = student.formData || {};

  document.getElementById('printCode').innerText = student.kode;
  document.getElementById('printGelombang').innerText = student.gelombang || fd.gelombang || '-';
  document.getElementById('printJurusan').innerText = student.jurusan || fd.jurusan || '-';
  document.getElementById('printTanggalDaftar').innerText = formatDateIndo(student.created_at ? student.created_at.split('T')[0] : '');
  document.getElementById('printStatusBadge').innerHTML = getStatusBadgeHtml(student.status);
  document.getElementById('printSignatureStudent').innerText = `( ${student.nama} )`;

  // Chairman Info
  document.getElementById('printKetuaPanitiaName').innerText = appState.settings.nama_ketua_panitia || 'Drs. H. Mulyadi, M.Pd.';
  document.getElementById('printKetuaPanitiaNip').innerText = appState.settings.nip_ketua_panitia || '';
  document.getElementById('printDateString').innerText = formatDateIndo(new Date().toISOString().split('T')[0]);

  // Photo Box
  const photoImg = document.getElementById('printStudentPhoto');
  const photoPlaceholder = document.getElementById('printPhotoPlaceholder');
  if (student.foto_url) {
    photoImg.src = student.foto_url;
    photoImg.classList.remove('hidden');
    photoPlaceholder.classList.add('hidden');
  } else {
    photoImg.src = '';
    photoImg.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
  }

  // Dynamic QR Code for authenticity
  const qrContainer = document.getElementById('printQrCodeContainer');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    try {
      const verifyUrl = `${window.location.origin}/#status?kode=${encodeURIComponent(student.kode)}&nisn=${encodeURIComponent(student.nisn || '')}`;
      new window.QRCode(qrContainer, {
        text: verifyUrl,
        width: 60,
        height: 60,
        colorDark: '#0a192f',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } catch (e) {
      qrContainer.innerText = student.kode;
    }
  }

  // Dynamic Table B: Biodata Siswa
  const siswaFields = appState.formFields.filter(f => f.section === 'siswa');
  const tbodySiswa = document.getElementById('printBiodataRows');
  if (tbodySiswa) {
    tbodySiswa.innerHTML = siswaFields.map(f => {
      let val = fd[f.id] || student[f.id] || '-';
      if (f.type === 'date' && val !== '-') val = formatDateIndo(val);
      return `
        <tr>
          <td class="w-36 font-semibold text-slate-600">${f.label}</td>
          <td class="font-medium text-slate-900 ${f.id === 'nama' ? 'font-bold uppercase text-[9pt]' : ''}">${val}</td>
        </tr>
      `;
    }).join('');
  }

  // Dynamic Table C: Ortu & Kontak
  const ortuFields = appState.formFields.filter(f => f.section === 'ortu');
  const tbodyOrtu = document.getElementById('printOrtuRows');
  if (tbodyOrtu) {
    // 2 columns pairing for compact A4 single page fit
    let ortuRowsHtml = '';
    for (let i = 0; i < ortuFields.length; i += 2) {
      const f1 = ortuFields[i];
      const f2 = ortuFields[i + 1];
      const v1 = fd[f1.id] || '-';
      const v2 = f2 ? (fd[f2.id] || '-') : '-';
      ortuRowsHtml += `
        <tr>
          <td class="w-36 font-semibold text-slate-600">${f1.label}</td>
          <td class="font-medium text-slate-900">${v1}</td>
          ${f2 ? `
            <td class="w-36 font-semibold text-slate-600">${f2.label}</td>
            <td class="font-medium text-slate-900">${v2}</td>
          ` : '<td colspan="2"></td>'}
        </tr>
      `;
    }
    tbodyOrtu.innerHTML = ortuRowsHtml;
  }

  // Dynamic Table D: Administrasi Tambahan
  const extraFields = appState.formFields.filter(f => f.section === 'tambahan');
  const tableExtra = document.getElementById('printExtraTable');
  const tbodyExtra = document.getElementById('printExtraRows');
  if (extraFields.length === 0) {
    if (tableExtra) tableExtra.classList.add('hidden');
  } else {
    if (tableExtra) tableExtra.classList.remove('hidden');
    let extraRowsHtml = '';
    for (let i = 0; i < extraFields.length; i += 2) {
      const f1 = extraFields[i];
      const f2 = extraFields[i + 1];
      const v1 = fd[f1.id] || '-';
      const v2 = f2 ? (fd[f2.id] || '-') : '-';
      extraRowsHtml += `
        <tr>
          <td class="w-36 font-semibold text-slate-600">${f1.label}</td>
          <td class="font-medium text-slate-900">${v1}</td>
          ${f2 ? `
            <td class="w-36 font-semibold text-slate-600">${f2.label}</td>
            <td class="font-medium text-slate-900">${v2}</td>
          ` : '<td colspan="2"></td>'}
        </tr>
      `;
    }
    if (tbodyExtra) tbodyExtra.innerHTML = extraRowsHtml;
  }

  modal.classList.remove('hidden');
};

window.closePrintCardModal = function() {
  const modal = document.getElementById('modalPrintCard');
  if (modal) modal.classList.add('hidden');
};

window.downloadBuktiPDF = function() {
  const element = document.getElementById('printArea');
  const code = document.getElementById('printCode').innerText || 'Dokumen';
  const downloadBtn = document.getElementById('btnDownloadPdf');

  if (!element) return;
  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.innerText = 'Menyusun PDF A4...';
  }

  const opt = {
    margin: [6, 6, 6, 6],
    filename: `Bukti_Pendaftaran_SPMB_${code}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(() => {
      window.showToast('Bukti Pendaftaran PDF berhasil diunduh.', 'success');
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download PDF (A4)</span>
        `;
      }
    }).catch(() => {
      window.print();
      if (downloadBtn) downloadBtn.disabled = false;
    });
  } else {
    window.print();
    if (downloadBtn) downloadBtn.disabled = false;
  }
};

window.printBuktiNow = function() {
  window.print();
};

// ================= 8. BLANKO FORMULIR PENDAFTARAN KOSONG (PRECISE 1-PAGE A4) =================
window.openBlankoFormulirModal = function() {
  const modal = document.getElementById('modalBlankoFormulir');
  if (!modal) return;

  // Render Gelombang Options
  const gelombangRow = document.getElementById('blankoGelombangRow');
  if (gelombangRow) {
    gelombangRow.innerHTML = appState.gelombang.map(g => `[ &nbsp; ] ${g.nama.split(' ')[0]} ${g.nama.split(' ')[1] || ''}`).join('&nbsp;&nbsp;&nbsp;&nbsp;');
  }

  // Render Jurusan Options
  const jurusanRow = document.getElementById('blankoJurusanOptions');
  if (jurusanRow) {
    jurusanRow.innerHTML = ': ' + appState.jurusan.map(j => `[ &nbsp; ] ${j.kode}`).join('&nbsp;&nbsp;&nbsp;&nbsp;');
  }

  // Render Biodata Rows in Blanko
  const siswaFields = appState.formFields.filter(f => f.section === 'siswa');
  const tbodySiswa = document.getElementById('blankoBiodataRows');
  if (tbodySiswa) {
    tbodySiswa.innerHTML = siswaFields.map(f => {
      let fillType = ': ..................................................................................................................';
      if (f.id === 'nisn') fillType = ': [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ]';
      else if (f.id === 'nik') fillType = ': [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ]';
      else if (f.id === 'gender') fillType = ': [ &nbsp; ] Laki-laki &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Perempuan';
      else if (f.options && f.options.length) fillType = ': ' + f.options.map(opt => `[ &nbsp; ] ${opt}`).join(' &nbsp;&nbsp; ');
      return `
        <tr>
          <td class="w-40 font-semibold text-slate-600">${f.label}</td>
          <td class="text-slate-800">${fillType}</td>
        </tr>
      `;
    }).join('');
  }

  // Render Ortu Rows in Blanko
  const ortuFields = appState.formFields.filter(f => f.section === 'ortu');
  const tbodyOrtu = document.getElementById('blankoOrtuRows');
  if (tbodyOrtu) {
    tbodyOrtu.innerHTML = ortuFields.map(f => `
      <tr>
        <td class="w-40 font-semibold text-slate-600">${f.label}</td>
        <td class="text-slate-800">: ..................................................................................................................</td>
      </tr>
    `).join('');
  }

  // Render Extra Rows in Blanko
  const extraFields = appState.formFields.filter(f => f.section === 'tambahan');
  const tableExtra = document.getElementById('blankoExtraTable');
  const tbodyExtra = document.getElementById('blankoExtraRows');
  if (extraFields.length === 0) {
    if (tableExtra) tableExtra.classList.add('hidden');
  } else {
    if (tableExtra) tableExtra.classList.remove('hidden');
    if (tbodyExtra) {
      tbodyExtra.innerHTML = extraFields.map(f => {
        let fillType = ': ..................................................................................................................';
        if (f.options && f.options.length) fillType = ': ' + f.options.map(opt => `[ &nbsp; ] ${opt}`).join(' &nbsp;&nbsp; ');
        return `
          <tr>
            <td class="w-40 font-semibold text-slate-600">${f.label}</td>
            <td class="text-slate-800">${fillType}</td>
          </tr>
        `;
      }).join('');
    }
  }

  modal.classList.remove('hidden');
};

window.closeBlankoFormulirModal = function() {
  const modal = document.getElementById('modalBlankoFormulir');
  if (modal) modal.classList.add('hidden');
};

window.downloadBlankoPDF = function() {
  const element = document.getElementById('blankoPrintArea');
  const btn = document.getElementById('btnDownloadBlankoPdf');
  if (!element) return;

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Menyusun Blanko PDF...';
  }

  const opt = {
    margin: [6, 6, 6, 6],
    filename: `Blanko_Formulir_Pendaftaran_SPMB_SMK_Lentera_Bangsa_2.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(() => {
      window.showToast('Blanko Formulir berhasil diunduh.', 'success');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download PDF Blanko</span>
        `;
      }
    }).catch(() => {
      window.print();
      if (btn) btn.disabled = false;
    });
  } else {
    window.print();
    if (btn) btn.disabled = false;
  }
};

window.printBlankoNow = function() {
  window.print();
};

// ================= 9. SUPABASE SQL DDL SCRIPT & MODAL =================
const SUPABASE_DDL_SQL = `-- ========================================================
-- SKRIP SQL LENGKAP DATABASE SUPABASE
-- SPMB SMK LENTERA BANGSA 2
-- Eksekusi di Supabase Dashboard -> SQL Editor -> Run
-- ========================================================

-- 1. TABEL PENDAFTAR (CALON SISWA)
CREATE TABLE IF NOT EXISTS public.pendaftar (
  id TEXT PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  nisn TEXT,
  nik TEXT,
  jurusan TEXT NOT NULL,
  gelombang TEXT NOT NULL,
  asal_sekolah TEXT,
  status TEXT DEFAULT 'Pending',
  catatan TEXT,
  foto_url TEXT,
  form_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PROGRAM KEAHLIAN / JURUSAN
CREATE TABLE IF NOT EXISTS public.jurusan (
  id TEXT PRIMARY KEY,
  kode TEXT NOT NULL,
  nama TEXT NOT NULL,
  kuota INT DEFAULT 72,
  deskripsi TEXT,
  prospek TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL GELOMBANG PENDAFTARAN
CREATE TABLE IF NOT EXISTS public.gelombang (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  mulai DATE NOT NULL,
  selesai DATE NOT NULL,
  kuota INT DEFAULT 150,
  diskon TEXT,
  status TEXT DEFAULT 'Aktif'
);

-- 4. TABEL PENGUMUMAN & AGENDA SPMB
CREATE TABLE IF NOT EXISTS public.pengumuman (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  kategori TEXT DEFAULT 'Jadwal',
  tanggal DATE DEFAULT CURRENT_DATE,
  isi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL HERO BANNER PROMOSI
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  image_url TEXT NOT NULL,
  status TEXT DEFAULT 'Aktif',
  urutan INT DEFAULT 1
);

-- 6. TABEL PENGATURAN ISIAN FORMULIR (FORM BUILDER)
CREATE TABLE IF NOT EXISTS public.form_fields (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  required BOOLEAN DEFAULT true,
  placeholder TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  sort_order INT DEFAULT 1
);

-- 7. TABEL PENGATURAN IDENTITAS SEKOLAH & PANITIA
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  nama_sekolah TEXT NOT NULL,
  slogan TEXT,
  alamat TEXT,
  wa TEXT,
  email TEXT,
  logo_url TEXT,
  nama_ketua_panitia TEXT,
  nip_ketua_panitia TEXT,
  wa_group_url TEXT
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.pendaftar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurusan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gelombang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN AKSES UNTUK KUNCI ANON
CREATE POLICY "Allow anon all on pendaftar" ON public.pendaftar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on jurusan" ON public.jurusan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on gelombang" ON public.gelombang FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on pengumuman" ON public.pengumuman FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on form_fields" ON public.form_fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- AKTIFKAN SUPABASE REALTIME SUBSCRIPTION
ALTER PUBLICATION supabase_realtime ADD TABLE public.pendaftar;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jurusan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gelombang;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pengumuman;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_fields;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
`;

window.openSupabaseSqlModal = function() {
  const modal = document.getElementById('modalSupabaseSql');
  const codeEl = document.getElementById('supabaseSqlCodeBlock');
  if (modal && codeEl) {
    codeEl.innerText = SUPABASE_DDL_SQL.trim();
    modal.classList.remove('hidden');
  }
};

window.closeSupabaseSqlModal = function() {
  const modal = document.getElementById('modalSupabaseSql');
  if (modal) modal.classList.add('hidden');
};

window.copySupabaseSQLScript = function() {
  navigator.clipboard.writeText(SUPABASE_DDL_SQL.trim()).then(() => {
    window.showToast('Seluruh skrip SQL berhasil disalin! Siap di-paste ke Supabase SQL Editor.', 'success', 5000);
  }).catch(() => {
    window.showToast('Gagal menyalin otomatis. Harap salin teks secara manual.', 'warning');
  });
};

// ================= 10. CEK STATUS PENDAFTARAN =================
window.openCheckStatusModal = function() {
  const modal = document.getElementById('modalCheckStatus');
  const resultBox = document.getElementById('checkStatusResultBox');
  const input = document.getElementById('inputCheckCode');
  if (modal) {
    modal.classList.remove('hidden');
    if (resultBox) resultBox.classList.add('hidden');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  }
};

window.closeCheckStatusModal = function() {
  const modal = document.getElementById('modalCheckStatus');
  if (modal) modal.classList.add('hidden');
};

window.handleSearchStatus = function() {
  const input = document.getElementById('inputCheckCode');
  const resultBox = document.getElementById('checkStatusResultBox');
  if (!input || !resultBox) return;

  const query = input.value.trim().toLowerCase();
  if (!query) {
    window.showToast('Masukkan Kode Pendaftaran atau NISN', 'warning');
    return;
  }

  const student = appState.pendaftar.find(p => 
    p.kode.toLowerCase() === query || 
    (p.nisn && p.nisn.toLowerCase() === query)
  );

  resultBox.classList.remove('hidden');

  if (!student) {
    resultBox.innerHTML = `
      <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <div class="font-bold mb-1">Data Tidak Ditemukan!</div>
        <p>Kode Pendaftaran atau NISN "<strong>${query}</strong>" tidak terdaftar di sistem. Harap periksa kembali nomor Anda.</p>
      </div>
    `;
    return;
  }

  const statusBadge = getStatusBadgeHtml(student.status);

  resultBox.innerHTML = `
    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] text-slate-400 font-mono">Kode Pendaftaran</span>
          <div class="text-sm font-bold font-mono text-primary-900">${student.kode}</div>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div class="text-xs space-y-1 text-slate-700 border-t border-slate-200 pt-2">
        <div><strong>Nama:</strong> ${student.nama}</div>
        <div><strong>NISN:</strong> ${student.nisn || '-'}</div>
        <div><strong>Pilihan Jurusan:</strong> <span class="text-emerald-800 font-semibold">${student.jurusan}</span></div>
        <div><strong>Gelombang:</strong> ${student.gelombang}</div>
        <div><strong>Asal Sekolah:</strong> ${student.asal_sekolah || '-'}</div>
      </div>

      <div class="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
        <span class="font-semibold text-slate-800">Catatan Panitia:</span>
        <p class="mt-0.5 text-[11px] leading-relaxed">${student.catatan || 'Menunggu proses verifikasi berkas.'}</p>
      </div>

      <div class="pt-1 flex items-center justify-end gap-2">
        <button onclick="openPrintCardModalByKode('${student.kode}')" class="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          <span>Cetak Bukti Pendaftaran</span>
        </button>
      </div>
    </div>
  `;
};

function getStatusBadgeHtml(status) {
  if (status === 'Diterima') {
    return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ DITERIMA</span>';
  } else if (status === 'Diverifikasi') {
    return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 border border-primary-300">DIVERIFIKASI</span>';
  } else if (status === 'Ditolak') {
    return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">DITOLAK</span>';
  }
  return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">PENDING</span>';
}

// ================= 11. ADMIN AUTHENTICATION =================
window.handleAdminNavClick = function() {
  const session = getLocalData(STORAGE_KEYS.ADMIN_SESSION, null);
  if (session && session.isLoggedIn) {
    switchToAdminView();
  } else {
    openAdminLoginModal();
  }
};

window.openAdminLoginModal = function() {
  const modal = document.getElementById('modalAdminLogin');
  const uInput = document.getElementById('adminLoginUsername');
  const pInput = document.getElementById('adminLoginPassword');
  if (modal) {
    if (uInput) uInput.value = '';
    if (pInput) pInput.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => uInput && uInput.focus(), 100);
  }
};

window.closeAdminLoginModal = function() {
  const modal = document.getElementById('modalAdminLogin');
  if (modal) modal.classList.add('hidden');
};

window.togglePasswordVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
};

window.handleAdminLoginSubmit = function(event) {
  event.preventDefault();
  const username = document.getElementById('adminLoginUsername').value.trim();
  const password = document.getElementById('adminLoginPassword').value.trim();

  if (username === 'admin' && password === 'admin123') {
    const sessionData = {
      isLoggedIn: true,
      username: 'admin',
      loginAt: new Date().toISOString()
    };
    setLocalData(STORAGE_KEYS.ADMIN_SESSION, sessionData);
    closeAdminLoginModal();
    window.showToast('Login Berhasil. Selamat datang di Panel Admin SPMB.', 'success');
    switchToAdminView();
  } else {
    window.showToast('Username atau password salah! Akses ditolak.', 'error');
  }
};

window.handleAdminLogout = function() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  window.showToast('Anda telah keluar dari panel admin.', 'info');
  switchToPublicView();
};

function switchToAdminView() {
  document.getElementById('publicView').classList.add('hidden');
  document.getElementById('adminView').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAdminAll();
}

window.switchToPublicView = function() {
  document.getElementById('adminView').classList.add('hidden');
  document.getElementById('publicView').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAllViews();
};

// ================= 12. ADMIN NAVIGATION TABS =================
window.switchAdminTab = function(tabName) {
  appState.activeAdminTab = tabName;
  
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.remove('bg-primary-800', 'text-white');
    btn.classList.add('text-slate-600', 'hover:bg-slate-100');
  });
  const activeBtn = document.getElementById(`tabBtn-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    activeBtn.classList.add('bg-primary-800', 'text-white');
  }

  document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));
  const activeContent = document.getElementById(`tabContent-${tabName}`);
  if (activeContent) activeContent.classList.remove('hidden');

  renderAdminAll();
};

function renderAdminAll() {
  renderAdminCounters();
  renderAdminPendaftarTable();
  renderAdminFormBuilder();
  renderJurusanAll();
  renderAdminGelombangTable();
  renderAdminPengumumanTable();
  renderAdminBannerList();
}

function renderAdminCounters() {
  const total = appState.pendaftar.length;
  const pending = appState.pendaftar.filter(p => p.status === 'Pending').length;
  const verified = appState.pendaftar.filter(p => p.status === 'Diverifikasi').length;
  const accepted = appState.pendaftar.filter(p => p.status === 'Diterima').length;
  const rejected = appState.pendaftar.filter(p => p.status === 'Ditolak').length;

  const elTotal = document.getElementById('adminCountTotal');
  const elPending = document.getElementById('adminCountPending');
  const elVerified = document.getElementById('adminCountVerified');
  const elAccepted = document.getElementById('adminCountAccepted');
  const elRejected = document.getElementById('adminCountRejected');

  if (elTotal) elTotal.innerText = total;
  if (elPending) elPending.innerText = pending;
  if (elVerified) elVerified.innerText = verified;
  if (elAccepted) elAccepted.innerText = accepted;
  if (elRejected) elRejected.innerText = rejected;
}

window.handleAdminFilterChange = function() {
  renderAdminPendaftarTable();
};

function renderAdminPendaftarTable() {
  const tbody = document.getElementById('adminPendaftarTableBody');
  const emptyState = document.getElementById('adminPendaftarEmpty');
  if (!tbody) return;

  const searchQuery = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();
  const filterJurusan = document.getElementById('adminFilterJurusan')?.value || '';
  const filterStatus = document.getElementById('adminFilterStatus')?.value || '';

  let list = [...appState.pendaftar];

  if (searchQuery) {
    list = list.filter(p => 
      p.nama.toLowerCase().includes(searchQuery) ||
      p.kode.toLowerCase().includes(searchQuery) ||
      (p.nisn && p.nisn.includes(searchQuery)) ||
      (p.asal_sekolah && p.asal_sekolah.toLowerCase().includes(searchQuery))
    );
  }

  if (filterJurusan) {
    list = list.filter(p => p.jurusan === filterJurusan);
  }

  if (filterStatus) {
    list = list.filter(p => p.status === filterStatus);
  }

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = list.map((p, idx) => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-3 px-4 font-mono text-slate-500">${idx + 1}</td>
      <td class="py-3 px-4 font-mono font-bold text-primary-900">
        <div>${p.kode}</div>
        <div class="text-[10px] text-slate-400 font-normal">NISN: ${p.nisn || '-'}</div>
      </td>
      <td class="py-3 px-4">
        <div class="font-bold text-slate-900">${p.nama}</div>
        <div class="text-[11px] text-slate-500">${p.formData?.gender || p.gender || '-'} · ${p.formData?.hp_siswa || p.formData?.hp_ortu || '-'}</div>
      </td>
      <td class="py-3 px-4 font-medium text-emerald-800">${p.jurusan}</td>
      <td class="py-3 px-4 text-slate-600">${p.asal_sekolah || '-'}</td>
      <td class="py-3 px-4 text-[11px] text-slate-500">${p.gelombang ? p.gelombang.split(' ')[0] + ' ' + (p.gelombang.split(' ')[1] || '') : '-'}</td>
      <td class="py-3 px-4">
        <select onchange="handleAdminQuickStatusChange('${p.kode}', this.value)" class="text-[11px] font-bold px-2 py-1 rounded-md border ${
          p.status === 'Diterima' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
          p.status === 'Diverifikasi' ? 'bg-primary-50 text-primary-800 border-primary-300' :
          p.status === 'Ditolak' ? 'bg-rose-50 text-rose-800 border-rose-300' :
          'bg-amber-50 text-amber-800 border-amber-300'
        }">
          <option value="Pending" ${p.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Diverifikasi" ${p.status === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi</option>
          <option value="Diterima" ${p.status === 'Diterima' ? 'selected' : ''}>Diterima</option>
          <option value="Ditolak" ${p.status === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
        </select>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex items-center gap-1.5">
          <button onclick="openPrintCardModalByKode('${p.kode}')" class="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded" title="Cetak Bukti">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          </button>
          <button onclick="openEditPendaftarModal('${p.kode}')" class="p-1.5 text-slate-500 hover:text-primary-700 hover:bg-primary-50 rounded" title="Edit Data">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          <button onclick="confirmDeletePendaftar('${p.kode}')" class="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded" title="Hapus Siswa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.handleAdminQuickStatusChange = function(kode, newStatus) {
  const student = appState.pendaftar.find(p => p.kode === kode);
  if (!student) return;

  student.status = newStatus;
  if (newStatus === 'Diterima') {
    student.catatan = 'Selamat! Anda dinyatakan DITERIMA di SMK Lentera Bangsa 2.';
  } else if (newStatus === 'Ditolak') {
    student.catatan = 'Mohon maaf, Anda belum memenuhi kualifikasi seleksi periode ini.';
  } else if (newStatus === 'Diverifikasi') {
    student.catatan = 'Berkas pendaftaran telah diverifikasi oleh panitia.';
  }

  setLocalData(STORAGE_KEYS.PENDAFTAR, appState.pendaftar);
  renderAdminCounters();
  renderAdminPendaftarTable();
  window.showToast(`Status ${student.nama} diubah: ${newStatus}`, 'success');
};

window.openEditPendaftarModal = function(kode) {
  const student = appState.pendaftar.find(p => p.kode === kode);
  if (!student) return;

  document.getElementById('editPendaftarId').value = student.kode;
  document.getElementById('editPendaftarNama').value = student.nama;
  document.getElementById('editPendaftarNisn').value = student.nisn || '';
  document.getElementById('editPendaftarStatus').value = student.status;
  document.getElementById('editPendaftarJurusan').value = student.jurusan;
  document.getElementById('editPendaftarCatatan').value = student.catatan || '';

  document.getElementById('modalEditPendaftar').classList.remove('hidden');
};

window.closeEditPendaftarModal = function() {
  document.getElementById('modalEditPendaftar').classList.add('hidden');
};

window.handleSaveEditPendaftar = function(event) {
  event.preventDefault();
  const kode = document.getElementById('editPendaftarId').value;
  const student = appState.pendaftar.find(p => p.kode === kode);
  if (!student) return;

  student.nama = document.getElementById('editPendaftarNama').value.trim();
  student.nisn = document.getElementById('editPendaftarNisn').value.trim();
  student.status = document.getElementById('editPendaftarStatus').value;
  student.jurusan = document.getElementById('editPendaftarJurusan').value;
  student.catatan = document.getElementById('editPendaftarCatatan').value.trim();

  if (student.formData) {
    student.formData.nama = student.nama;
    student.formData.nisn = student.nisn;
    student.formData.jurusan = student.jurusan;
  }

  setLocalData(STORAGE_KEYS.PENDAFTAR, appState.pendaftar);
  closeEditPendaftarModal();
  renderAdminCounters();
  renderAdminPendaftarTable();
  window.showToast('Data calon siswa berhasil diperbarui.', 'success');
};

window.confirmDeletePendaftar = function(kode) {
  const student = appState.pendaftar.find(p => p.kode === kode);
  if (!student) return;

  requestConfirmDelete(`Hapus pendaftar ${student.nama} (${student.kode})?`, () => {
    appState.pendaftar = appState.pendaftar.filter(p => p.kode !== kode);
    setLocalData(STORAGE_KEYS.PENDAFTAR, appState.pendaftar);
    renderAdminCounters();
    renderAdminPendaftarTable();
    renderPublicStats();
    window.showToast('Data pendaftar telah dihapus.', 'info');
  });
};

window.openAddPendaftarModal = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  switchToPublicView();
  setTimeout(() => {
    window.location.hash = '#pendaftaran';
  }, 100);
};

window.exportPendaftarToCSV = function() {
  const data = appState.pendaftar;
  if (data.length === 0) {
    window.showToast('Tidak ada data pendaftar untuk diekspor.', 'warning');
    return;
  }

  const headers = ['No', 'Kode Registrasi', 'Nama Lengkap', 'NISN', 'Jurusan', 'Gelombang', 'Asal Sekolah', 'Status', 'Tanggal Daftar'];
  const rows = data.map((p, idx) => [
    idx + 1,
    `"${p.kode}"`,
    `"${(p.nama || '').replace(/"/g, '""')}"`,
    `'${p.nisn || ''}'`,
    `"${p.jurusan}"`,
    `"${p.gelombang}"`,
    `"${(p.asal_sekolah || '').replace(/"/g, '""')}"`,
    `"${p.status}"`,
    `"${p.created_at || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Data_Pendaftar_SPMB_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.showToast('Export Excel/CSV berhasil diunduh.', 'success');
};

// ================= 13. ADMIN: PROGRAM KEAHLIAN / JURUSAN CRUD =================
function renderJurusanAll() {
  const publicGrid = document.getElementById('publicJurusanGrid');
  const adminGrid = document.getElementById('adminJurusanGridContainer');
  const adminFilter = document.getElementById('adminFilterJurusan');
  const editFilter = document.getElementById('editPendaftarJurusan');
  const statTotal = document.getElementById('statTotalJurusan');

  const list = appState.jurusan;

  if (statTotal) statTotal.innerText = `${list.length} Program`;

  if (publicGrid) {
    publicGrid.innerHTML = list.map(j => `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
        <div class="h-44 bg-slate-100 overflow-hidden relative">
          <img src="${j.image_url}" alt="${j.nama}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
            <span class="text-white font-display font-bold text-lg">${j.nama}</span>
          </div>
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="text-xs text-slate-500 mb-2 font-mono">Kode: ${j.kode} · Kuota: ${j.kuota} Siswa</div>
            <p class="text-sm text-slate-600 line-clamp-3 mb-4">${j.deskripsi}</p>
            <div class="text-xs text-emerald-800 font-medium">Prospek Karir: ${j.prospek}</div>
          </div>
          <a href="#pendaftaran" onclick="selectJurusanInForm('${j.nama}')" class="mt-4 inline-flex items-center text-xs font-semibold text-primary-700 hover:text-primary-900">
            <span>Pilih Jurusan Ini</span>
            <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </a>
        </div>
      </div>
    `).join('');
  }

  if (adminFilter) {
    const cur = adminFilter.value;
    adminFilter.innerHTML = '<option value="">Semua Jurusan</option>' + list.map(j => `<option value="${j.nama}">${j.nama}</option>`).join('');
    if (cur) adminFilter.value = cur;
  }

  if (editFilter) {
    editFilter.innerHTML = list.map(j => `<option value="${j.nama}">${j.nama}</option>`).join('');
  }

  if (adminGrid) {
    adminGrid.innerHTML = list.map(j => `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <img src="${j.image_url}" alt="${j.nama}" class="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
            <div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800 font-mono">${j.kode}</span>
              <h4 class="font-bold text-slate-900 text-sm mt-1">${j.nama}</h4>
              <span class="text-xs text-slate-500 font-mono">Kuota: ${j.kuota} Siswa</span>
            </div>
          </div>
          <p class="text-xs text-slate-600 line-clamp-2 mb-2">${j.deskripsi}</p>
          <div class="text-[11px] text-emerald-800 font-medium">Karir: ${j.prospek}</div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onclick="openEditJurusanModal('${j.id}')" class="px-2.5 py-1.5 text-xs font-semibold text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span>Ubah</span>
          </button>
          <button onclick="confirmDeleteJurusan('${j.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded" title="Hapus Jurusan">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  }
}

window.selectJurusanInForm = function(namaJurusan) {
  const el = document.querySelector('[name="field_jurusan"]');
  if (el) el.value = namaJurusan;
};

window.openAddJurusanModal = function() {
  document.getElementById('jurusanFormId').value = '';
  document.getElementById('modalJurusanTitle').innerText = 'Tambah Program Keahlian Baru';
  document.getElementById('jurusanFormKode').value = '';
  document.getElementById('jurusanFormNama').value = '';
  document.getElementById('jurusanFormKuota').value = '72';
  document.getElementById('jurusanFormDeskripsi').value = '';
  document.getElementById('jurusanFormProspek').value = '';
  document.getElementById('jurusanFotoInput').value = '';
  const preview = document.getElementById('jurusanFotoPreview');
  preview.src = '';
  preview.classList.add('hidden');
  appState.tempJurusanPhoto = null;
  document.getElementById('modalJurusanForm').classList.remove('hidden');
};

window.openEditJurusanModal = function(id) {
  const j = appState.jurusan.find(item => item.id === id);
  if (!j) return;

  document.getElementById('jurusanFormId').value = j.id;
  document.getElementById('modalJurusanTitle').innerText = 'Ubah Program Keahlian';
  document.getElementById('jurusanFormKode').value = j.kode;
  document.getElementById('jurusanFormNama').value = j.nama;
  document.getElementById('jurusanFormKuota').value = j.kuota;
  document.getElementById('jurusanFormDeskripsi').value = j.deskripsi;
  document.getElementById('jurusanFormProspek').value = j.prospek;
  document.getElementById('jurusanFotoInput').value = '';
  const preview = document.getElementById('jurusanFotoPreview');
  preview.src = j.image_url;
  preview.classList.remove('hidden');
  appState.tempJurusanPhoto = j.image_url;
  document.getElementById('modalJurusanForm').classList.remove('hidden');
};

window.closeJurusanModal = function() {
  document.getElementById('modalJurusanForm').classList.add('hidden');
};

window.previewJurusanPhoto = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    appState.tempJurusanPhoto = e.target.result;
    const preview = document.getElementById('jurusanFotoPreview');
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    window.showToast('Foto jurusan berhasil dipilih.', 'info');
  };
  reader.readAsDataURL(file);
};

window.handleSaveJurusan = function(event) {
  event.preventDefault();
  const id = document.getElementById('jurusanFormId').value || ('jur-' + Date.now());
  const kode = document.getElementById('jurusanFormKode').value.trim().toUpperCase();
  const nama = document.getElementById('jurusanFormNama').value.trim();
  const kuota = parseInt(document.getElementById('jurusanFormKuota').value, 10) || 72;
  const deskripsi = document.getElementById('jurusanFormDeskripsi').value.trim();
  const prospek = document.getElementById('jurusanFormProspek').value.trim();

  let image_url = appState.tempJurusanPhoto;
  if (!image_url) {
    const existing = appState.jurusan.find(j => j.id === id);
    image_url = existing ? existing.image_url : '/src/assets/images/banner_lab_komputer_1794320505489.jpg';
  }

  const newJur = { id, kode, nama, kuota, deskripsi, prospek, image_url };
  const existingIdx = appState.jurusan.findIndex(j => j.id === id);
  if (existingIdx !== -1) {
    appState.jurusan[existingIdx] = newJur;
  } else {
    appState.jurusan.push(newJur);
  }

  setLocalData(STORAGE_KEYS.JURUSAN, appState.jurusan);
  closeJurusanModal();
  renderJurusanAll();
  renderPublicRegistrationForm();
  window.showToast('Program keahlian berhasil disimpan.', 'success');
};

window.confirmDeleteJurusan = function(id) {
  if (appState.jurusan.length <= 1) {
    window.showToast('Minimal harus ada 1 program keahlian.', 'warning');
    return;
  }
  const j = appState.jurusan.find(item => item.id === id);
  requestConfirmDelete(`Hapus program keahlian "${j ? j.nama : 'ini'}"?`, () => {
    appState.jurusan = appState.jurusan.filter(item => item.id !== id);
    setLocalData(STORAGE_KEYS.JURUSAN, appState.jurusan);
    renderJurusanAll();
    renderPublicRegistrationForm();
    window.showToast('Program keahlian telah dihapus.', 'info');
  });
};

// ================= 14. ADMIN: GELOMBANG, PENGUMUMAN & BANNER =================
function renderGelombangCards() {
  const container = document.getElementById('gelombangListContainer');
  if (!container) return;

  container.innerHTML = appState.gelombang.map(g => {
    const countOccupied = appState.pendaftar.filter(p => p.gelombang === g.nama).length;
    const kuota = parseInt(g.kuota, 10) || 100;
    const percent = Math.min(100, Math.round((countOccupied / kuota) * 100));
    const isAktif = g.status === 'Aktif';

    return `
      <div class="bg-white rounded-2xl border ${isAktif ? 'border-emerald-300 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200'} p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-lg">
        ${isAktif ? '<div class="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Dibuka</div>' : ''}
        
        <div>
          <div class="text-xs font-semibold text-slate-500 mb-1">Jalur Pendaftaran</div>
          <h3 class="text-lg font-bold font-display text-slate-900 mb-2">${g.nama}</h3>
          
          <div class="text-xs text-slate-600 space-y-1.5 mb-4">
            <div class="flex items-center gap-2">
              <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span>Periode: <strong>${formatDateIndo(g.mulai)} s.d ${formatDateIndo(g.selesai)}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="text-emerald-700 font-medium">${g.diskon || 'Biaya Reguler'}</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-slate-500 font-medium">Keterisian Kuota</span>
              <span class="font-mono font-bold text-slate-800">${countOccupied} / ${kuota} Siswa (${percent}%)</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ${percent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${percent}%"></div>
            </div>
          </div>
        </div>

        <div class="mt-6">
          ${isAktif ? `
            <a href="#pendaftaran" onclick="selectGelombangInForm('${g.nama}')" class="w-full py-2.5 text-xs font-bold text-center text-white bg-primary-800 hover:bg-primary-900 rounded-xl transition-colors block">
              Daftar di Gelombang Ini
            </a>
          ` : `
            <button disabled class="w-full py-2.5 text-xs font-semibold text-center text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed">
              ${g.status === 'Segera' ? 'Pendaftaran Segera Dibuka' : 'Pendaftaran Ditutup'}
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.selectGelombangInForm = function(namaGelombang) {
  const el = document.querySelector('[name="field_gelombang"]');
  if (el) el.value = namaGelombang;
};

function renderAdminGelombangTable() {
  const container = document.getElementById('adminGelombangTableContainer');
  if (!container) return;

  container.innerHTML = `
    <table class="w-full text-left text-xs">
      <thead class="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
        <tr>
          <th class="py-3 px-4">Nama Gelombang</th>
          <th class="py-3 px-4">Periode</th>
          <th class="py-3 px-4">Kuota</th>
          <th class="py-3 px-4">Diskon / Potongan</th>
          <th class="py-3 px-4">Status</th>
          <th class="py-3 px-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${appState.gelombang.map(g => {
          const countOccupied = appState.pendaftar.filter(p => p.gelombang === g.nama).length;
          return `
            <tr class="hover:bg-slate-50">
              <td class="py-3 px-4 font-bold text-slate-900">${g.nama}</td>
              <td class="py-3 px-4 text-slate-600 font-mono">${formatDateIndo(g.mulai)} s.d ${formatDateIndo(g.selesai)}</td>
              <td class="py-3 px-4 font-mono">${countOccupied} / ${g.kuota}</td>
              <td class="py-3 px-4 text-emerald-700 font-medium">${g.diskon || '-'}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${
                  g.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                  g.status === 'Segera' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-600'
                }">${g.status}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button onclick="openEditGelombangModal('${g.id}')" class="p-1 text-slate-500 hover:text-primary-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onclick="confirmDeleteGelombang('${g.id}')" class="p-1 text-slate-500 hover:text-rose-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

window.openAddGelombangModal = function() {
  document.getElementById('gelombangFormId').value = '';
  document.getElementById('modalGelombangTitle').innerText = 'Tambah Gelombang Baru';
  document.getElementById('gelombangFormNama').value = '';
  document.getElementById('gelombangFormMulai').value = '';
  document.getElementById('gelombangFormSelesai').value = '';
  document.getElementById('gelombangFormKuota').value = '150';
  document.getElementById('gelombangFormDiskon').value = '';
  document.getElementById('gelombangFormStatus').value = 'Aktif';
  document.getElementById('modalGelombangForm').classList.remove('hidden');
};

window.openEditGelombangModal = function(id) {
  const g = appState.gelombang.find(item => item.id === id);
  if (!g) return;

  document.getElementById('gelombangFormId').value = g.id;
  document.getElementById('modalGelombangTitle').innerText = 'Edit Gelombang';
  document.getElementById('gelombangFormNama').value = g.nama;
  document.getElementById('gelombangFormMulai').value = g.mulai;
  document.getElementById('gelombangFormSelesai').value = g.selesai;
  document.getElementById('gelombangFormKuota').value = g.kuota;
  document.getElementById('gelombangFormDiskon').value = g.diskon || '';
  document.getElementById('gelombangFormStatus').value = g.status;
  document.getElementById('modalGelombangForm').classList.remove('hidden');
};

window.closeGelombangModal = function() {
  document.getElementById('modalGelombangForm').classList.add('hidden');
};

window.handleSaveGelombang = function(event) {
  event.preventDefault();
  const id = document.getElementById('gelombangFormId').value || ('gel-' + Date.now());
  const nama = document.getElementById('gelombangFormNama').value.trim();
  const mulai = document.getElementById('gelombangFormMulai').value;
  const selesai = document.getElementById('gelombangFormSelesai').value;
  const kuota = parseInt(document.getElementById('gelombangFormKuota').value, 10) || 100;
  const diskon = document.getElementById('gelombangFormDiskon').value.trim();
  const status = document.getElementById('gelombangFormStatus').value;

  const newGel = { id, nama, mulai, selesai, kuota, diskon, status };
  const existingIdx = appState.gelombang.findIndex(g => g.id === id);
  if (existingIdx !== -1) {
    appState.gelombang[existingIdx] = newGel;
  } else {
    appState.gelombang.push(newGel);
  }

  setLocalData(STORAGE_KEYS.GELOMBANG, appState.gelombang);
  closeGelombangModal();
  renderGelombangCards();
  renderAdminGelombangTable();
  renderPublicRegistrationForm();
  window.showToast('Gelombang pendaftaran berhasil disimpan.', 'success');
};

window.confirmDeleteGelombang = function(id) {
  const g = appState.gelombang.find(item => item.id === id);
  requestConfirmDelete(`Hapus "${g ? g.nama : 'gelombang ini'}"?`, () => {
    appState.gelombang = appState.gelombang.filter(item => item.id !== id);
    setLocalData(STORAGE_KEYS.GELOMBANG, appState.gelombang);
    renderGelombangCards();
    renderAdminGelombangTable();
    renderPublicRegistrationForm();
    window.showToast('Gelombang berhasil dihapus.', 'info');
  });
};

function renderPengumumanCards() {
  const container = document.getElementById('pengumumanListContainer');
  if (!container) return;

  container.innerHTML = appState.pengumuman.map(ann => `
    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all">
      <div>
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${
            ann.kategori === 'Beasiswa' ? 'bg-emerald-100 text-emerald-800' :
            ann.kategori === 'Jadwal' ? 'bg-primary-100 text-primary-800' :
            'bg-amber-100 text-amber-800'
          }">${ann.kategori}</span>
          <span class="text-[11px] text-slate-400 font-mono">${formatDateIndo(ann.tanggal)}</span>
        </div>
        <h3 class="text-base font-bold text-slate-900 mb-2 leading-snug line-clamp-2">${ann.judul}</h3>
        <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">${ann.isi}</p>
      </div>

      <button onclick="openPengumumanDetail('${ann.id}')" class="text-xs font-semibold text-primary-700 hover:text-primary-900 inline-flex items-center gap-1">
        <span>Baca Selengkapnya</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </button>
    </div>
  `).join('');
}

function renderAdminPengumumanTable() {
  const container = document.getElementById('adminPengumumanTableContainer');
  if (!container) return;

  container.innerHTML = `
    <table class="w-full text-left text-xs">
      <thead class="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
        <tr>
          <th class="py-3 px-4">Judul</th>
          <th class="py-3 px-4">Kategori</th>
          <th class="py-3 px-4">Tanggal</th>
          <th class="py-3 px-4">Ringkasan</th>
          <th class="py-3 px-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${appState.pengumuman.map(a => `
          <tr class="hover:bg-slate-50">
            <td class="py-3 px-4 font-bold text-slate-900">${a.judul}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${a.kategori}</span>
            </td>
            <td class="py-3 px-4 font-mono text-slate-500">${formatDateIndo(a.tanggal)}</td>
            <td class="py-3 px-4 text-slate-600 max-w-xs truncate">${a.isi}</td>
            <td class="py-3 px-4 text-right">
              <div class="inline-flex items-center gap-1.5">
                <button onclick="openEditPengumumanModal('${a.id}')" class="p-1 text-slate-500 hover:text-primary-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="confirmDeletePengumuman('${a.id}')" class="p-1 text-slate-500 hover:text-rose-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

window.openAddPengumumanModal = function() {
  document.getElementById('pengumumanFormId').value = '';
  document.getElementById('modalPengumumanFormTitle').innerText = 'Tambah Pengumuman Baru';
  document.getElementById('pengumumanFormJudul').value = '';
  document.getElementById('pengumumanFormKategori').value = 'Jadwal';
  document.getElementById('pengumumanFormTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('pengumumanFormIsi').value = '';
  document.getElementById('modalPengumumanForm').classList.remove('hidden');
};

window.openEditPengumumanModal = function(id) {
  const a = appState.pengumuman.find(item => item.id === id);
  if (!a) return;

  document.getElementById('pengumumanFormId').value = a.id;
  document.getElementById('modalPengumumanFormTitle').innerText = 'Edit Pengumuman';
  document.getElementById('pengumumanFormJudul').value = a.judul;
  document.getElementById('pengumumanFormKategori').value = a.kategori;
  document.getElementById('pengumumanFormTanggal').value = a.tanggal;
  document.getElementById('pengumumanFormIsi').value = a.isi;
  document.getElementById('modalPengumumanForm').classList.remove('hidden');
};

window.closePengumumanFormModal = function() {
  document.getElementById('modalPengumumanForm').classList.add('hidden');
};

window.handleSavePengumuman = function(event) {
  event.preventDefault();
  const id = document.getElementById('pengumumanFormId').value || ('ann-' + Date.now());
  const judul = document.getElementById('pengumumanFormJudul').value.trim();
  const kategori = document.getElementById('pengumumanFormKategori').value;
  const tanggal = document.getElementById('pengumumanFormTanggal').value;
  const isi = document.getElementById('pengumumanFormIsi').value.trim();

  const newAnn = { id, judul, kategori, tanggal, isi };
  const existingIdx = appState.pengumuman.findIndex(a => a.id === id);
  if (existingIdx !== -1) {
    appState.pengumuman[existingIdx] = newAnn;
  } else {
    appState.pengumuman.unshift(newAnn);
  }

  setLocalData(STORAGE_KEYS.PENGUMUMAN, appState.pengumuman);
  closePengumumanFormModal();
  renderPengumumanCards();
  renderAdminPengumumanTable();
  window.showToast('Pengumuman berhasil dipublikasikan.', 'success');
};

window.confirmDeletePengumuman = function(id) {
  const a = appState.pengumuman.find(item => item.id === id);
  requestConfirmDelete(`Hapus pengumuman "${a ? a.judul : 'ini'}"?`, () => {
    appState.pengumuman = appState.pengumuman.filter(item => item.id !== id);
    setLocalData(STORAGE_KEYS.PENGUMUMAN, appState.pengumuman);
    renderPengumumanCards();
    renderAdminPengumumanTable();
    window.showToast('Pengumuman telah dihapus.', 'info');
  });
};

window.openPengumumanDetail = function(id) {
  const ann = appState.pengumuman.find(a => a.id === id);
  if (!ann) return;

  const modal = document.getElementById('modalPengumumanDetail');
  document.getElementById('pengumumanModalBadge').innerText = ann.kategori;
  document.getElementById('pengumumanModalTitle').innerText = ann.judul;
  document.getElementById('pengumumanModalDate').innerText = `Dipublikasikan pada: ${formatDateIndo(ann.tanggal)}`;
  document.getElementById('pengumumanModalBody').innerText = ann.isi;

  if (modal) modal.classList.remove('hidden');
};

window.closePengumumanModal = function() {
  const modal = document.getElementById('modalPengumumanDetail');
  if (modal) modal.classList.add('hidden');
};

// ================= 15. ADMIN: HERO BANNER CRUD =================
function renderHeroSlider() {
  const container = document.getElementById('heroSliderContainer');
  const indicators = document.getElementById('sliderIndicators');
  if (!container || !indicators) return;

  const activeBanners = appState.banners.filter(b => b.status === 'Aktif');
  if (activeBanners.length === 0 && appState.banners.length > 0) {
    activeBanners.push(appState.banners[0]);
  } else if (activeBanners.length === 0) {
    activeBanners.push(DEFAULT_BANNERS[0]);
  }

  if (appState.currentSlideIndex >= activeBanners.length) {
    appState.currentSlideIndex = 0;
  }

  container.innerHTML = activeBanners.map((banner, idx) => {
    const isCurrent = idx === appState.currentSlideIndex;
    return `
      <div class="absolute inset-0 transition-opacity duration-700 ease-in-out ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}">
        <img src="${banner.image_url}" alt="${banner.judul}" class="w-full h-full object-cover brightness-[0.45] select-none" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex items-center">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
            <div class="max-w-3xl">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 mb-4 backdrop-blur-sm">
                <span>SMK LENTERA BANGSA 2</span>
                <span>·</span>
                <span>TAHUN PELAJARAN 2026/2027</span>
              </div>
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight leading-tight sm:leading-snug mb-4">
                ${banner.judul}
              </h1>
              <p class="text-slate-200 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl font-light">
                ${banner.deskripsi}
              </p>
              <div class="flex flex-wrap items-center gap-3">
                <a href="#pendaftaran" class="px-6 py-3 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-all flex items-center gap-2">
                  <span>Daftar Calon Siswa Sekarang</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
                <button onclick="openCheckStatusModal()" class="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <span>Cek Status Pendaftaran</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  indicators.innerHTML = activeBanners.map((_, idx) => `
    <button onclick="goToSlide(${idx})" class="w-2.5 h-2.5 rounded-full transition-all ${idx === appState.currentSlideIndex ? 'w-8 bg-emerald-500' : 'bg-white/40 hover:bg-white/70'}" aria-label="Slide ${idx + 1}"></button>
  `).join('');

  startSliderAutoPlay();
}

function startSliderAutoPlay() {
  if (appState.sliderTimer) clearInterval(appState.sliderTimer);
  appState.sliderTimer = setInterval(() => {
    nextSlide();
  }, 6000);
}

window.nextSlide = function() {
  const activeBanners = appState.banners.filter(b => b.status === 'Aktif');
  if (activeBanners.length === 0) return;
  appState.currentSlideIndex = (appState.currentSlideIndex + 1) % activeBanners.length;
  renderHeroSlider();
};

window.prevSlide = function() {
  const activeBanners = appState.banners.filter(b => b.status === 'Aktif');
  if (activeBanners.length === 0) return;
  appState.currentSlideIndex = (appState.currentSlideIndex - 1 + activeBanners.length) % activeBanners.length;
  renderHeroSlider();
};

window.goToSlide = function(index) {
  appState.currentSlideIndex = index;
  renderHeroSlider();
};

function renderAdminBannerList() {
  const container = document.getElementById('adminBannerListContainer');
  if (!container) return;

  container.innerHTML = appState.banners.map((b, idx) => `
    <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all">
      <img src="${b.image_url}" alt="${b.judul}" class="w-full sm:w-28 h-20 object-cover rounded-lg border border-slate-200 shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-mono text-slate-400">Slide #${idx + 1}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">${b.status}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm truncate">${b.judul}</h4>
        <p class="text-xs text-slate-500 line-clamp-2">${b.deskripsi}</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button onclick="toggleBannerStatus('${b.id}')" class="px-2.5 py-1.5 text-xs font-semibold rounded border ${b.status === 'Aktif' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200'}">
          ${b.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button onclick="openEditBannerModal('${b.id}')" class="px-2.5 py-1.5 text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Ubah</span>
        </button>
        <button onclick="confirmDeleteBanner('${b.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded" title="Hapus Banner">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

window.openAddBannerModal = function() {
  document.getElementById('bannerFormId').value = '';
  document.getElementById('modalBannerTitle').innerText = 'Tambah Banner Baru';
  document.getElementById('bannerFormJudul').value = '';
  document.getElementById('bannerFormDeskripsi').value = '';
  document.getElementById('bannerFormStatus').value = 'Aktif';
  document.getElementById('bannerFotoInput').value = '';
  const preview = document.getElementById('bannerFotoPreview');
  preview.classList.add('hidden');
  preview.src = '';
  appState.tempBannerPhoto = null;
  document.getElementById('modalBannerForm').classList.remove('hidden');
};

window.openEditBannerModal = function(id) {
  const b = appState.banners.find(item => item.id === id);
  if (!b) return;

  document.getElementById('bannerFormId').value = b.id;
  document.getElementById('modalBannerTitle').innerText = 'Ubah Banner Promosi';
  document.getElementById('bannerFormJudul').value = b.judul;
  document.getElementById('bannerFormDeskripsi').value = b.deskripsi;
  document.getElementById('bannerFormStatus').value = b.status;
  document.getElementById('bannerFotoInput').value = '';
  const preview = document.getElementById('bannerFotoPreview');
  preview.src = b.image_url;
  preview.classList.remove('hidden');
  appState.tempBannerPhoto = b.image_url;
  document.getElementById('modalBannerForm').classList.remove('hidden');
};

window.closeBannerModal = function() {
  document.getElementById('modalBannerForm').classList.add('hidden');
};

window.previewBannerPhoto = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    appState.tempBannerPhoto = e.target.result;
    const preview = document.getElementById('bannerFotoPreview');
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    window.showToast('Foto banner berhasil dipilih.', 'info');
  };
  reader.readAsDataURL(file);
};

window.handleSaveBanner = function(event) {
  event.preventDefault();
  const id = document.getElementById('bannerFormId').value || ('ban-' + Date.now());
  const judul = document.getElementById('bannerFormJudul').value.trim();
  const deskripsi = document.getElementById('bannerFormDeskripsi').value.trim();
  const status = document.getElementById('bannerFormStatus').value;

  let image_url = appState.tempBannerPhoto;
  if (!image_url) {
    const existing = appState.banners.find(b => b.id === id);
    image_url = existing ? existing.image_url : '/src/assets/images/hero_campus_smk_1794320504766.jpg';
  }

  const newBanner = {
    id,
    judul,
    deskripsi,
    image_url,
    status,
    urutan: appState.banners.length + 1
  };

  const existingIdx = appState.banners.findIndex(b => b.id === id);
  if (existingIdx !== -1) {
    appState.banners[existingIdx] = newBanner;
  } else {
    appState.banners.push(newBanner);
  }

  setLocalData(STORAGE_KEYS.BANNERS, appState.banners);
  closeBannerModal();
  renderHeroSlider();
  renderAdminBannerList();
  window.showToast('Banner promosi berhasil disimpan.', 'success');
};

window.toggleBannerStatus = function(id) {
  const b = appState.banners.find(item => item.id === id);
  if (!b) return;
  b.status = b.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  setLocalData(STORAGE_KEYS.BANNERS, appState.banners);
  renderHeroSlider();
  renderAdminBannerList();
  window.showToast(`Status banner: ${b.status}`, 'info');
};

window.confirmDeleteBanner = function(id) {
  if (appState.banners.length <= 1) {
    window.showToast('Minimal harus ada 1 banner.', 'warning');
    return;
  }
  const banner = appState.banners.find(b => b.id === id);
  requestConfirmDelete(`Hapus banner promosi "${banner ? banner.judul : 'ini'}"?`, () => {
    appState.banners = appState.banners.filter(b => b.id !== id);
    setLocalData(STORAGE_KEYS.BANNERS, appState.banners);
    renderHeroSlider();
    renderAdminBannerList();
    window.showToast('Banner berhasil dihapus.', 'info');
  });
};

// ================= 16. ADMIN: IDENTITAS, KETUA PANITIA & LOGO =================
window.handleSaveSchoolSettings = function(event) {
  event.preventDefault();
  appState.settings.nama_sekolah = document.getElementById('settingNamaSekolah').value.trim();
  appState.settings.slogan = document.getElementById('settingSlogan').value.trim();
  appState.settings.alamat = document.getElementById('settingAlamat').value.trim();
  appState.settings.wa = document.getElementById('settingWa').value.trim();
  appState.settings.email = document.getElementById('settingEmail').value.trim();
  appState.settings.nama_ketua_panitia = document.getElementById('settingKetuaPanitia').value.trim();
  appState.settings.nip_ketua_panitia = document.getElementById('settingNipKetuaPanitia').value.trim();
  appState.settings.wa_group_url = document.getElementById('settingWaGroupUrl').value.trim();

  setLocalData(STORAGE_KEYS.SETTINGS, appState.settings);
  renderSchoolSettingsUI();
  window.showToast('Identitas sekolah & data panitia berhasil diperbarui.', 'success');
};

window.handleLogoUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    appState.settings.logo_url = e.target.result;
    setLocalData(STORAGE_KEYS.SETTINGS, appState.settings);
    renderSchoolSettingsUI();
    window.showToast('Logo sekolah berhasil diunggah.', 'success');
  };
  reader.readAsDataURL(file);
};

function renderSchoolSettingsUI() {
  const s = appState.settings;
  const headerLogo = document.getElementById('headerSchoolLogo');
  const footerLogo = document.getElementById('footerSchoolLogo');
  const adminLogoPrev = document.getElementById('adminLogoPreview');
  const footerTitle = document.getElementById('footerSchoolTitle');
  const footerDesc = document.getElementById('footerSchoolDesc');
  const footerAddress = document.getElementById('footerSchoolAddress');
  const footerWa = document.getElementById('footerSchoolWa');
  const footerEmail = document.getElementById('footerSchoolEmail');

  if (headerLogo && s.logo_url) headerLogo.src = s.logo_url;
  if (footerLogo && s.logo_url) footerLogo.src = s.logo_url;
  if (adminLogoPrev && s.logo_url) adminLogoPrev.src = s.logo_url;
  if (footerTitle) footerTitle.innerText = s.nama_sekolah;
  if (footerDesc) footerDesc.innerText = s.slogan;
  if (footerAddress) footerAddress.querySelector('span').innerText = s.alamat;
  if (footerWa) footerWa.innerText = `${s.wa} (Hotline SPMB)`;
  if (footerEmail) footerEmail.innerText = s.email;

  const inputNama = document.getElementById('settingNamaSekolah');
  const inputSlogan = document.getElementById('settingSlogan');
  const inputAlamat = document.getElementById('settingAlamat');
  const inputWa = document.getElementById('settingWa');
  const inputEmail = document.getElementById('settingEmail');
  const inputKetua = document.getElementById('settingKetuaPanitia');
  const inputNip = document.getElementById('settingNipKetuaPanitia');
  const inputWaGroup = document.getElementById('settingWaGroupUrl');

  if (inputNama) inputNama.value = s.nama_sekolah;
  if (inputSlogan) inputSlogan.value = s.slogan;
  if (inputAlamat) inputAlamat.value = s.alamat;
  if (inputWa) inputWa.value = s.wa;
  if (inputEmail) inputEmail.value = s.email;
  if (inputKetua) inputKetua.value = s.nama_ketua_panitia || 'Drs. H. Mulyadi, M.Pd.';
  if (inputNip) inputNip.value = s.nip_ketua_panitia || '';
  if (inputWaGroup) inputWaGroup.value = s.wa_group_url || '';

  const printKetua = document.getElementById('printKetuaPanitiaName');
  const printNip = document.getElementById('printKetuaPanitiaNip');
  if (printKetua) printKetua.innerText = s.nama_ketua_panitia || 'Drs. H. Mulyadi, M.Pd.';
  if (printNip) printNip.innerText = s.nip_ketua_panitia || '';
}

function renderPublicStats() {
  const statPendaftar = document.getElementById('statTotalPendaftar');
  const statGelombang = document.getElementById('statGelombangAktif');
  if (statPendaftar) {
    statPendaftar.innerText = `${appState.pendaftar.length}+`;
  }
  if (statGelombang) {
    const activeWave = appState.gelombang.find(g => g.status === 'Aktif');
    statGelombang.innerText = activeWave ? activeWave.nama.split(' ')[0] + ' ' + activeWave.nama.split(' ')[1] : 'Tutup';
  }
}

// ================= 17. UTILITY FUNCTIONS & INITIALIZATION =================
function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function renderAllViews() {
  renderSchoolSettingsUI();
  renderHeroSlider();
  renderGelombangCards();
  renderPengumumanCards();
  renderJurusanAll();
  renderPublicRegistrationForm();
  renderPublicStats();
  if (!document.getElementById('adminView').classList.contains('hidden')) {
    renderAdminAll();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAllViews();

  const hash = window.location.hash;
  if (hash.includes('status')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const kode = params.get('kode');
    if (kode) {
      setTimeout(() => {
        const input = document.getElementById('inputCheckCode');
        if (input) input.value = kode;
        openCheckStatusModal();
        handleSearchStatus();
      }, 300);
    }
  }
});
