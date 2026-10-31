import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Layout, 
  BookOpen, 
  Calendar, 
  Bell, 
  Users, 
  Check, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  Eye, 
  Sparkles,
  Image as ImageIcon,
  Video,
  MessageCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Upload,
  Loader2,
  X,
  FileText,
  Key,
  UserCheck,
  UserX
} from 'lucide-react';
import { 
  SchoolSettings, 
  Major, 
  Wave, 
  Announcement, 
  AdminUser, 
  SiteLayoutSettings,
  RegistrationStepItem,
  PromoMediaItem
} from '../types';
import { 
  updateSchoolSettings, 
  saveMajorsList, 
  deleteMajor,
  saveWavesList, 
  deleteWave,
  saveAnnouncementsList, 
  deleteAnnouncement,
  saveSiteLayout,
  getLocalSteps,
  saveStepsList,
  deleteStep,
  DEFAULT_REGISTRATION_STEPS,
  uploadFileToSupabaseStorage,
  getLocalPromoMediaList,
  savePromoMediaList,
  deletePromoMedia,
  getLocalAdminUsers,
  saveAdminUsers,
  deleteAdminUser,
  DEFAULT_OFFICIAL_LOGO,
  DEFAULT_CAMPUS_WALLPAPER
} from '../lib/supabase';

interface ContentManagementProps {
  currentUser: AdminUser;
  settings: SchoolSettings;
  layoutSettings: SiteLayoutSettings;
  majors: Major[];
  waves: Wave[];
  announcements: Announcement[];
  onRefreshAll: () => void;
}

export const ContentManagement: React.FC<ContentManagementProps> = ({
  currentUser,
  settings: initialSettings,
  layoutSettings: initialLayout,
  majors: initialMajors,
  waves: initialWaves,
  announcements: initialAnnouncements,
  onRefreshAll,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const [subTab, setSubTab] = useState<'settings' | 'promo' | 'majors' | 'waves_steps' | 'announcements' | 'users'>('settings');
  
  // Local editable states
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(initialSettings);
  const [layout, setLayout] = useState<SiteLayoutSettings>(initialLayout);
  const [majorsList, setMajorsList] = useState<Major[]>(initialMajors);
  const [wavesList, setWavesList] = useState<Wave[]>(initialWaves);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(initialAnnouncements);
  const [stepsList, setStepsList] = useState<RegistrationStepItem[]>(() => getLocalSteps());
  const [promoMediaList, setPromoMediaList] = useState<PromoMediaItem[]>(() => getLocalPromoMediaList());
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>(() => getLocalAdminUsers());

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Hidden File Inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  const annFileInputRef = useRef<HTMLInputElement>(null);
  const majorFileInputRef = useRef<HTMLInputElement>(null);
  const editMajorFileInputRef = useRef<HTMLInputElement>(null);

  // ===================== MAJORS FORM & EDIT MODAL =====================
  const [isAddingMajor, setIsAddingMajor] = useState<boolean>(false);
  const [newMajorName, setNewMajorName] = useState('');
  const [newMajorCode, setNewMajorCode] = useState('');
  const [newMajorShortDesc, setNewMajorShortDesc] = useState('');
  const [newMajorFullDesc, setNewMajorFullDesc] = useState('');
  const [newMajorQuota, setNewMajorQuota] = useState(72);
  const [newMajorImage, setNewMajorImage] = useState('');
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // ===================== WAVES FORM & EDIT MODAL =====================
  const [isAddingWave, setIsAddingWave] = useState<boolean>(false);
  const [newWaveName, setNewWaveName] = useState('');
  const [newWaveStart, setNewWaveStart] = useState('2026-07-01');
  const [newWaveEnd, setNewWaveEnd] = useState('2026-07-31');
  const [newWaveBenefits, setNewWaveBenefits] = useState('');
  const [newWaveQuota, setNewWaveQuota] = useState(100);
  const [newWaveFee, setNewWaveFee] = useState('Gratis Biaya Pendaftaran');
  const [editingWave, setEditingWave] = useState<Wave | null>(null);

  // ===================== STEPS FORM & EDIT MODAL =====================
  const [isAddingStep, setIsAddingStep] = useState<boolean>(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');
  const [editingStep, setEditingStep] = useState<RegistrationStepItem | null>(null);

  // ===================== ANNOUNCEMENTS FORM & EDIT MODAL =====================
  const [isAddingAnn, setIsAddingAnn] = useState<boolean>(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'PENTING' | 'JADWAL_TES' | 'PENGUMUMAN_KELULUSAN' | 'INFO_DAFTAR_ULANG'>('PENTING');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnImage, setNewAnnImage] = useState('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80');
  const [newAnnPinned, setNewAnnPinned] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // ===================== PROMO MEDIA FORM & EDIT MODAL =====================
  const [isAddingPromo, setIsAddingPromo] = useState<boolean>(false);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoType, setNewPromoType] = useState<'image' | 'video' | 'youtube'>('image');
  const [newPromoUrl, setNewPromoUrl] = useState('');
  const [newPromoCaption, setNewPromoCaption] = useState('');
  const [editingPromo, setEditingPromo] = useState<PromoMediaItem | null>(null);

  // ===================== ADMIN / OPERATOR USERS MANAGEMENT =====================
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'SUPER_ADMIN' | 'OPERATOR'>('OPERATOR');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const showToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Generic direct file upload handler using uploadFileToSupabaseStorage
  const handleDirectFileUpload = async (
    file: File,
    folder: 'branding' | 'promotions' | 'announcements' | 'majors',
    targetKey: string,
    onSuccess: (url: string) => void
  ) => {
    setUploadingTarget(targetKey);
    const result = await uploadFileToSupabaseStorage(file, folder);
    setUploadingTarget(null);

    if (result.success && result.url) {
      onSuccess(result.url);
      showToast('File gambar berhasil diunggah!');
    } else {
      alert(`Gagal mengunggah file: ${result.error || 'Terjadi kesalahan sistem'}`);
    }
  };

  // 1. Save Settings & Layout
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSaving(true);

    await updateSchoolSettings(schoolSettings);
    saveSiteLayout(layout);
    setIsSaving(false);
    showToast('Pengaturan aplikasi, branding, dan link Grup WhatsApp berhasil disimpan!');
    onRefreshAll();
  };

  // 2. Program Keahlian / Majors CRUD
  const handleCreateMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajorName.trim() || !newMajorCode.trim()) return;

    const newId = `major-${Date.now()}`;
    const newMajor: Major = {
      id: newId,
      code: newMajorCode.toUpperCase(),
      name: newMajorName,
      shortDesc: newMajorShortDesc || newMajorName,
      fullDesc: newMajorFullDesc || newMajorShortDesc || newMajorName,
      quota: newMajorQuota,
      filledCount: 0,
      color: 'from-blue-600 to-indigo-600',
      icon: 'BookOpen',
      imageUrl: newMajorImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    };

    const updated = [...majorsList, newMajor];
    setMajorsList(updated);
    await saveMajorsList(updated);
    setIsAddingMajor(false);
    setNewMajorName('');
    setNewMajorCode('');
    setNewMajorShortDesc('');
    setNewMajorFullDesc('');
    setNewMajorImage('');
    showToast(`Jurusan baru "${newMajor.name}" berhasil ditambahkan!`);
    onRefreshAll();
  };

  const handleUpdateMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMajor) return;
    const updated = majorsList.map((m) => (m.id === editingMajor.id ? editingMajor : m));
    setMajorsList(updated);
    await saveMajorsList(updated);
    setEditingMajor(null);
    showToast(`Jurusan "${editingMajor.name}" berhasil diperbarui!`);
    onRefreshAll();
  };

  const handleDeleteMajor = async (id: string, name: string) => {
    if (!isSuperAdmin) return;
    if (window.confirm(`Yakin ingin menghapus program keahlian "${name}"? Data akan dihapus secara permanen.`)) {
      const updated = majorsList.filter((m) => m.id !== id);
      setMajorsList(updated);
      await deleteMajor(id);
      showToast(`Jurusan "${name}" telah berhasil dihapus.`);
      onRefreshAll();
    }
  };

  // 3. Gelombang CRUD
  const handleCreateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaveName.trim()) return;

    const newWave: Wave = {
      id: `wave-${Date.now()}`,
      name: newWaveName,
      startDate: newWaveStart,
      endDate: newWaveEnd,
      isActive: false,
      benefits: newWaveBenefits || 'Sesuai ketentuan reguler.',
      quota: newWaveQuota,
      fee: newWaveFee,
    };

    const updated = [...wavesList, newWave];
    setWavesList(updated);
    await saveWavesList(updated);
    setIsAddingWave(false);
    setNewWaveName('');
    setNewWaveBenefits('');
    showToast(`Gelombang baru "${newWave.name}" berhasil ditambahkan!`);
    onRefreshAll();
  };

  const handleUpdateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWave) return;
    const updated = wavesList.map((w) => (w.id === editingWave.id ? editingWave : w));
    setWavesList(updated);
    await saveWavesList(updated);
    setEditingWave(null);
    showToast(`Data "${editingWave.name}" berhasil diperbarui!`);
    onRefreshAll();
  };

  const handleDeleteWave = async (id: string, name: string) => {
    if (!isSuperAdmin) return;
    if (window.confirm(`Yakin ingin menghapus gelombang "${name}"?`)) {
      const updated = wavesList.filter((w) => w.id !== id);
      setWavesList(updated);
      await deleteWave(id);
      showToast('Gelombang pendaftaran telah berhasil dihapus.');
      onRefreshAll();
    }
  };

  const handleToggleWaveActive = async (id: string) => {
    const updated = wavesList.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w));
    setWavesList(updated);
    await saveWavesList(updated);
    onRefreshAll();
  };

  // 4. Alur Pendaftaran Steps CRUD
  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep: RegistrationStepItem = {
      id: `step-${Date.now()}`,
      step: String(stepsList.length + 1).padStart(2, '0'),
      title: newStepTitle,
      desc: newStepDesc,
      icon: 'FileText',
    };

    const updated = [...stepsList, newStep];
    setStepsList(updated);
    saveStepsList(updated);
    setIsAddingStep(false);
    setNewStepTitle('');
    setNewStepDesc('');
    showToast(`Tahapan "${newStep.title}" berhasil ditambahkan!`);
    onRefreshAll();
  };

  const handleUpdateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;
    const updated = stepsList.map((s) => (s.id === editingStep.id ? editingStep : s));
    setStepsList(updated);
    saveStepsList(updated);
    setEditingStep(null);
    showToast('Tahapan alur pendaftaran berhasil diperbarui!');
    onRefreshAll();
  };

  const handleDeleteStep = async (id: string, title: string) => {
    if (!isSuperAdmin) return;
    if (window.confirm(`Hapus langkah alur "${title}"?`)) {
      const updated = stepsList.filter((s) => s.id !== id);
      // Re-number remaining steps
      const renumbered = updated.map((s, idx) => ({ ...s, step: String(idx + 1).padStart(2, '0') }));
      setStepsList(renumbered);
      await deleteStep(id);
      saveStepsList(renumbered);
      showToast('Langkah alur pendaftaran berhasil dihapus.');
      onRefreshAll();
    }
  };

  // 5. Announcements CRUD
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !newAnnTitle.trim()) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle,
      category: newAnnCategory,
      content: newAnnContent,
      imageUrl: newAnnImage,
      publishedDate: new Date().toISOString().split('T')[0],
      author: currentUser.name,
      isPinned: newAnnPinned,
      isActive: true,
    };

    const updated = [newAnn, ...announcementsList];
    setAnnouncementsList(updated);
    await saveAnnouncementsList(updated);
    setIsAddingAnn(false);
    setNewAnnTitle('');
    setNewAnnContent('');
    showToast('Pengumuman / agenda baru berhasil diterbitkan!');
    onRefreshAll();
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;
    const updated = announcementsList.map((a) => (a.id === editingAnn.id ? editingAnn : a));
    setAnnouncementsList(updated);
    await saveAnnouncementsList(updated);
    setEditingAnn(null);
    showToast('Pengumuman berhasil diperbarui!');
    onRefreshAll();
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!isSuperAdmin) return;
    if (window.confirm(`Hapus pengumuman "${title}"?`)) {
      const updated = announcementsList.filter((a) => a.id !== id);
      setAnnouncementsList(updated);
      await deleteAnnouncement(id);
      showToast('Pengumuman berhasil dihapus.');
      onRefreshAll();
    }
  };

  // 6. Promotional Media CRUD
  const handleCreatePromoMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoTitle.trim() || !newPromoUrl.trim()) return;

    const newItem: PromoMediaItem = {
      id: `promo-${Date.now()}`,
      title: newPromoTitle,
      type: newPromoType,
      url: newPromoUrl,
      caption: newPromoCaption,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...promoMediaList, newItem];
    setPromoMediaList(updated);
    await savePromoMediaList(updated);
    setIsAddingPromo(false);
    setNewPromoTitle('');
    setNewPromoUrl('');
    setNewPromoCaption('');
    showToast('Media promosi baru berhasil ditambahkan!');
    onRefreshAll();
  };

  const handleUpdatePromoMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    const updated = promoMediaList.map((p) => (p.id === editingPromo.id ? editingPromo : p));
    setPromoMediaList(updated);
    await savePromoMediaList(updated);
    setEditingPromo(null);
    showToast('Media promosi berhasil diperbarui!');
    onRefreshAll();
  };

  const handleDeletePromoMedia = async (id: string, title: string) => {
    if (!isSuperAdmin) return;
    if (window.confirm(`Hapus media promosi "${title}"?`)) {
      const updated = promoMediaList.filter((p) => p.id !== id);
      setPromoMediaList(updated);
      await deletePromoMedia(id);
      showToast('Media promosi telah dihapus.');
      onRefreshAll();
    }
  };

  const handleTogglePromoActive = async (id: string) => {
    const updated = promoMediaList.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    setPromoMediaList(updated);
    await savePromoMediaList(updated);
    onRefreshAll();
  };

  // 7. Admin / Operator Users CRUD
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) return;

    // Check duplicate username
    if (adminUsersList.some((u) => u.username.toLowerCase() === newUserUsername.toLowerCase().trim())) {
      alert(`Username "${newUserUsername}" sudah digunakan. Gunakan username lain.`);
      return;
    }

    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      username: newUserUsername.toLowerCase().trim(),
      password: newUserPassword.trim(),
      name: newUserName.trim(),
      role: newUserRole,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...adminUsersList, newUser];
    setAdminUsersList(updated);
    await saveAdminUsers(updated);
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    showToast(`Akun ${newUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator'} "${newUser.name}" berhasil dibuat!`);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updated = adminUsersList.map((u) => (u.id === editingUser.id ? editingUser : u));
    setAdminUsersList(updated);
    await saveAdminUsers(updated);
    setEditingUser(null);
    showToast(`Akun "${editingUser.name}" berhasil diperbarui!`);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isSuperAdmin) return;
    if (id === currentUser.id || name.toLowerCase() === 'admin') {
      alert('Tidak dapat menghapus akun Admin Utama yang sedang aktif digunakan.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus akun operator "${name}"? Pengguna tidak akan dapat login kembali.`)) {
      const updated = adminUsersList.filter((u) => u.id !== id);
      setAdminUsersList(updated);
      await deleteAdminUser(id);
      showToast(`Akun operator "${name}" telah dihapus.`);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold">Akses Dibatasi untuk Admin Bayangan (Operator)</h3>
        <p className="text-xs text-amber-800 max-w-lg mx-auto leading-relaxed">
          Akun Anda memiliki hak akses <strong>Operator / Moderator</strong> yang khusus ditujukan untuk operasional harian (verifikasi pendaftar, input nilai tes & wawancara, cetak formulir A4, dan ekspor data). Manajemen pengaturan sistem dan perubahan tata letak aplikasi hanya dapat diakses oleh <strong>Admin Utama (Super Admin)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'settings', label: 'Pengaturan & Branding', icon: Settings },
          { id: 'promo', label: 'Media Promosi Hero', icon: Video },
          { id: 'majors', label: 'Program Keahlian', icon: BookOpen },
          { id: 'waves_steps', label: 'Gelombang & Alur SPMB', icon: Calendar },
          { id: 'announcements', label: 'Pengumuman & Agenda', icon: Bell },
          { id: 'users', label: 'Admin & Hak Akses', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================
          1. PENGATURAN APLIKASI & BRANDING (DIRECT UPLOAD FOR LOGO & BACKGROUND)
          ======================================================================== */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
              Pengaturan Aplikasi & Branding
            </span>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Identitas Sekolah, Direct File Upload Logo/Wallpaper & Link WhatsApp Grup
            </h3>
            <p className="text-xs text-slate-500">
              Admin dapat mengunggah file logo & background secara langsung (PNG, JPG) serta mengatur nomor hotline dan link grup WhatsApp pendaftar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LINK GRUP WA WAJIB */}
            <div className="md:col-span-2 bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                Link Grup WhatsApp Resmi (Wajib Bagi Pendaftar Baru)
              </label>
              <input
                type="url"
                value={schoolSettings.whatsappGroupLink}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, whatsappGroupLink: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 bg-white text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <span className="text-[11px] text-emerald-800 block">
                Tautan ini akan langsung muncul dan diwajibkan bagi calon siswa setelah selesai menyimpan formulir pendaftaran.
              </span>
            </div>

            {/* BRANDING: DIRECT FILE UPLOAD LOGO SEKOLAH */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Foto Profil Aplikasi (Logo Sekolah)
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">PNG / JPG</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  {schoolSettings.logoUrl ? (
                    <img src={schoolSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center px-1">Tanpa Logo</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleDirectFileUpload(file, 'branding', 'logo', (url) => {
                          setSchoolSettings({ ...schoolSettings, logoUrl: url });
                        });
                      }
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingTarget === 'logo'}
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {uploadingTarget === 'logo' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Upload Logo (PNG/JPG)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSchoolSettings({ ...schoolSettings, logoUrl: DEFAULT_OFFICIAL_LOGO })}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                      title="Terapkan Logo Vektor Resmi SMK Lentera Bangsa 2"
                    >
                      Pakai Logo Resmi (Vektor)
                    </button>

                    {schoolSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSchoolSettings({ ...schoolSettings, logoUrl: '' })}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Disarankan format PNG transparan proporsi 1:1 (kotak/lingkaran) atau gunakan Logo Resmi Vektor.
                  </span>
                </div>
              </div>
            </div>

            {/* BRANDING: DIRECT FILE UPLOAD BACKGROUND WALLPAPER */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  Gambar Latar Belakang (Background Wallpaper)
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">PNG / JPG</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="w-20 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  {schoolSettings.bgPatternUrl ? (
                    <img src={schoolSettings.bgPatternUrl} alt="Background" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center px-1">Default Mesh</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleDirectFileUpload(file, 'branding', 'bg', (url) => {
                          setSchoolSettings({ ...schoolSettings, bgPatternUrl: url });
                        });
                      }
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingTarget === 'bg'}
                      onClick={() => bgInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {uploadingTarget === 'bg' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Upload Background (PNG/JPG)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSchoolSettings({ ...schoolSettings, bgPatternUrl: DEFAULT_CAMPUS_WALLPAPER })}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                      title="Gunakan Wallpaper Kampus Sekolah Modern"
                    >
                      Pakai Wallpaper Kampus
                    </button>

                    {schoolSettings.bgPatternUrl && (
                      <button
                        type="button"
                        onClick={() => setSchoolSettings({ ...schoolSettings, bgPatternUrl: '' })}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Hapus Background Kustom (Kembali ke Mesh)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Foto gedung sekolah atau ilustrasi beresolusi tinggi (lanskap).
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah Resmi</label>
              <input
                type="text"
                value={schoolSettings.schoolName}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
              <input
                type="text"
                value={schoolSettings.academicYear}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Visi Sekolah</label>
              <input
                type="text"
                value={schoolSettings.schoolTagline}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Teks Running Ticker (Pita Pengumuman Beranda)</label>
              <input
                type="text"
                value={schoolSettings.announcementTicker}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, announcementTicker: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-blue-900 bg-blue-50/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / Hotline</label>
              <input
                type="text"
                value={schoolSettings.phone}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Call Center</label>
              <input
                type="text"
                value={schoolSettings.whatsappNumber}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email SPMB</label>
              <input
                type="email"
                value={schoolSettings.email}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Website Resmi</label>
              <input
                type="url"
                value={schoolSettings.website}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, website: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={schoolSettings.headmasterName}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, headmasterName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ketua Panitia SPMB</label>
              <input
                type="text"
                value={schoolSettings.committeeHeadName}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, committeeHeadName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Kampus</label>
              <input
                type="text"
                value={schoolSettings.address}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan Aplikasi'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================
          2. UPLOAD MEDIA PROMOSI (MULTI-PHOTO CRUD & DIRECT UPLOAD)
          ======================================================================== */}
      {subTab === 'promo' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                Menu Upload Media Promosi
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Kelola Foto & Video Banner Promosi (Multi-Upload & Full CRUD)
              </h3>
              <p className="text-xs text-slate-500">
                Semua foto promosi yang diaktifkan akan tampil otomatis di Hero Section dashboard pendaftar.
              </p>
            </div>

            <button
              onClick={() => setIsAddingPromo(!isAddingPromo)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingPromo ? 'Batal Tambah' : 'Tambah Foto Promosi'}
            </button>
          </div>

          {/* Form Tambah Foto Promosi Baru */}
          {isAddingPromo && (
            <form onSubmit={handleCreatePromoMedia} className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-4">
              <h4 className="text-sm font-bold text-blue-950">Unggah Media Promosi Baru</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Media Promosi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gedung & Fasilitas Praktik Modern 2026"
                    value={newPromoTitle}
                    onChange={(e) => setNewPromoTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Media</label>
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="image">Foto / Gambar Banner (PNG, JPG)</option>
                    <option value="youtube">Video YouTube (Embed Link)</option>
                    <option value="video">Direct Video URL (.mp4)</option>
                  </select>
                </div>

                {newPromoType === 'image' ? (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Upload File Foto Langsung (PNG, JPG)</label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={promoFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDirectFileUpload(file, 'promotions', 'newPromo', (url) => {
                              setNewPromoUrl(url);
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingTarget === 'newPromo'}
                        onClick={() => promoFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {uploadingTarget === 'newPromo' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Mengunggah Foto...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Pilih Foto dari Komputer / HP
                          </>
                        )}
                      </button>

                      {newPromoUrl && (
                        <div className="flex items-center gap-2">
                          <img src={newPromoUrl} alt="Preview" className="w-12 h-10 object-cover rounded-lg border border-slate-200" />
                          <span className="text-[11px] text-emerald-700 font-medium">Foto siap disimpan</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Tautan Embed / URL Video</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/embed/..."
                      value={newPromoUrl}
                      onChange={(e) => setNewPromoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Keterangan / Caption Banner (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Deskripsi singkat yang tampil di bawah banner..."
                    value={newPromoCaption}
                    onChange={(e) => setNewPromoCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPromo(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newPromoUrl}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Simpan Foto Promosi
                </button>
              </div>
            </form>
          )}

          {/* Grid Foto Promosi Terdaftar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promoMediaList.map((promo) => (
              <div key={promo.id} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col justify-between">
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  {promo.type === 'image' ? (
                    <img src={promo.url} alt={promo.title} className="w-full h-full object-cover" />
                  ) : promo.type === 'youtube' ? (
                    <iframe src={promo.url} title={promo.title} className="w-full h-full" />
                  ) : (
                    <video src={promo.url} controls className="w-full h-full" />
                  )}

                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      promo.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {promo.isActive ? 'Tampil' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{promo.title}</h4>
                    {promo.caption && <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{promo.caption}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTogglePromoActive(promo.id)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer ${
                        promo.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {promo.isActive ? 'Sembunyikan' : 'Aktifkan'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPromo(promo)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit Media Promosi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePromoMedia(promo.id, promo.title)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus Media Promosi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Edit Foto Promosi */}
          {editingPromo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form onSubmit={handleUpdatePromoMedia} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Edit Media Promosi</h4>
                  <button type="button" onClick={() => setEditingPromo(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Judul Media</label>
                    <input
                      type="text"
                      value={editingPromo.title}
                      onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL / Link File</label>
                    <input
                      type="url"
                      value={editingPromo.url}
                      onChange={(e) => setEditingPromo({ ...editingPromo, url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Caption / Keterangan</label>
                    <input
                      type="text"
                      value={editingPromo.caption || ''}
                      onChange={(e) => setEditingPromo({ ...editingPromo, caption: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
                    <input
                      type="checkbox"
                      checked={editingPromo.isActive}
                      onChange={(e) => setEditingPromo({ ...editingPromo, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Tampilkan di Hero Section Beranda
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingPromo(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          3. PROGRAM KEAHLIAN / JURUSAN (FULL CRUD & EDIT MODAL & DIRECT UPLOAD)
          ======================================================================== */}
      {subTab === 'majors' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                Menu Program Keahlian
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Kelola Daftar Jurusan & Kuota Siswa (Full CRUD)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingMajor(!isAddingMajor)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingMajor ? 'Batal Tambah' : 'Tambah Jurusan Baru'}
              </button>
            </div>
          </div>

          {/* Form Tambah Jurusan Baru */}
          {isAddingMajor && (
            <form onSubmit={handleCreateMajor} className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
              <h4 className="text-sm font-bold text-blue-950">Formulir Tambah Program Keahlian Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Jurusan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Teknik Komputer & Jaringan"
                    value={newMajorName}
                    onChange={(e) => setNewMajorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Jurusan</label>
                  <input
                    type="text"
                    placeholder="Contoh: TKJ / TJKT"
                    value={newMajorCode}
                    onChange={(e) => setNewMajorCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kuota Penerimaan (Siswa)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newMajorQuota}
                    onChange={(e) => setNewMajorQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Foto Jurusan (Upload / URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={majorFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDirectFileUpload(file, 'majors', 'newMajor', (url) => {
                            setNewMajorImage(url);
                          });
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingTarget === 'newMajor'}
                      onClick={() => majorFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                    <input
                      type="url"
                      placeholder="https://... atau klik tombol Upload"
                      value={newMajorImage}
                      onChange={(e) => setNewMajorImage(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Lengkap Jurusan</label>
                  <textarea
                    rows={2}
                    placeholder="Jelaskan kompetensi, peluang kerja, dan prospek keahlian..."
                    value={newMajorFullDesc}
                    onChange={(e) => setNewMajorFullDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMajor(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Jurusan
                </button>
              </div>
            </form>
          )}

          {/* Grid Jurusan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {majorsList.map((major) => (
              <div key={major.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                      {major.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                        Kuota: {major.quota} Siswa
                      </span>
                      <button
                        onClick={() => setEditingMajor(major)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                        title="Edit Jurusan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMajor(major.id, major.name)}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                        title="Hapus Jurusan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{major.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{major.fullDesc}</p>
                </div>

                {major.imageUrl && (
                  <div className="mt-2 h-20 w-full rounded-lg overflow-hidden border border-slate-200">
                    <img src={major.imageUrl} alt={major.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Modal Edit Program Keahlian */}
          {editingMajor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form onSubmit={handleUpdateMajor} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Edit Program Keahlian</h4>
                  <button type="button" onClick={() => setEditingMajor(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Jurusan</label>
                    <input
                      type="text"
                      value={editingMajor.name}
                      onChange={(e) => setEditingMajor({ ...editingMajor, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kode Jurusan</label>
                      <input
                        type="text"
                        value={editingMajor.code}
                        onChange={(e) => setEditingMajor({ ...editingMajor, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kuota (Siswa)</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={editingMajor.quota}
                        onChange={(e) => setEditingMajor({ ...editingMajor, quota: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Foto Jurusan (Upload / URL)</label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={editMajorFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDirectFileUpload(file, 'majors', 'editMajor', (url) => {
                              setEditingMajor({ ...editingMajor, imageUrl: url });
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingTarget === 'editMajor'}
                        onClick={() => editMajorFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Foto
                      </button>
                      <input
                        type="url"
                        value={editingMajor.imageUrl || ''}
                        onChange={(e) => setEditingMajor({ ...editingMajor, imageUrl: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Lengkap Jurusan</label>
                    <textarea
                      rows={3}
                      value={editingMajor.fullDesc}
                      onChange={(e) => setEditingMajor({ ...editingMajor, fullDesc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingMajor(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          4. PENENTUAN GELOMBANG & ALUR PENDAFTARAN (FULL CRUD)
          ======================================================================== */}
      {subTab === 'waves_steps' && (
        <div className="space-y-6">
          {/* GELOMBANG PENDAFTARAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                  Penentuan Gelombang SPMB
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Status Buka / Tutup & Periode Gelombang (Gelombang 1, 2, dst)
                </h3>
              </div>
              <button
                onClick={() => setIsAddingWave(!isAddingWave)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingWave ? 'Batal' : 'Tambah Gelombang'}
              </button>
            </div>

            {/* Form Tambah Gelombang */}
            {isAddingWave && (
              <form onSubmit={handleCreateWave} className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <h4 className="text-xs font-bold text-blue-900">Tambah Gelombang Pendaftaran Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Nama Gelombang</label>
                    <input
                      type="text"
                      placeholder="Contoh: Gelombang 4 (Jalur Tambahan)"
                      value={newWaveName}
                      onChange={(e) => setNewWaveName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Biaya Pendaftaran</label>
                    <input
                      type="text"
                      placeholder="Contoh: Rp 150.000 / Gratis"
                      value={newWaveFee}
                      onChange={(e) => setNewWaveFee(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={newWaveStart}
                      onChange={(e) => setNewWaveStart(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={newWaveEnd}
                      onChange={(e) => setNewWaveEnd(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">Benefit & Potongan</label>
                    <input
                      type="text"
                      placeholder="Diskon DPP / Seragam Gratis..."
                      value={newWaveBenefits}
                      onChange={(e) => setNewWaveBenefits(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Simpan Gelombang
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {wavesList.map((wave) => (
                <div key={wave.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{wave.name}</h4>
                      {wave.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Aktif / Dibuka
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Nonaktif / Ditutup
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Periode: {wave.startDate} s/d {wave.endDate} &bull; Biaya: {wave.fee}
                    </p>
                    <p className="text-xs text-slate-700">{wave.benefits}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleWaveActive(wave.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        wave.isActive
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {wave.isActive ? 'Tutup Gelombang' : 'Buka Gelombang'}
                    </button>
                    <button
                      onClick={() => setEditingWave(wave)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Edit Gelombang"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWave(wave.id, wave.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus Gelombang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Edit Gelombang */}
          {editingWave && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form onSubmit={handleUpdateWave} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Edit Gelombang SPMB</h4>
                  <button type="button" onClick={() => setEditingWave(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Gelombang</label>
                    <input
                      type="text"
                      value={editingWave.name}
                      onChange={(e) => setEditingWave({ ...editingWave, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={editingWave.startDate}
                        onChange={(e) => setEditingWave({ ...editingWave, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={editingWave.endDate}
                        onChange={(e) => setEditingWave({ ...editingWave, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Biaya Pendaftaran</label>
                      <input
                        type="text"
                        value={editingWave.fee}
                        onChange={(e) => setEditingWave({ ...editingWave, fee: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kuota Gelombang</label>
                      <input
                        type="number"
                        value={editingWave.quota || 100}
                        onChange={(e) => setEditingWave({ ...editingWave, quota: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Benefit & Potongan</label>
                    <textarea
                      rows={2}
                      value={editingWave.benefits || ''}
                      onChange={(e) => setEditingWave({ ...editingWave, benefits: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingWave(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ALUR PENDAFTARAN TAHAPAN (FULL CRUD) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                  Alur Pendaftaran Praktis & Cepat
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Kelola Tahapan Alur Pendaftaran (Tambah, Edit, Hapus)
                </h3>
              </div>
              <button
                onClick={() => setIsAddingStep(!isAddingStep)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingStep ? 'Batal' : 'Tambah Langkah'}
              </button>
            </div>

            {/* Form Tambah Langkah Baru */}
            {isAddingStep && (
              <form onSubmit={handleCreateStep} className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <h4 className="text-xs font-bold text-blue-900">Tambah Langkah Alur Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Judul Langkah</label>
                    <input
                      type="text"
                      placeholder="Contoh: Registrasi Ulang & Pengambilan Jas"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Deskripsi Singkat</label>
                    <input
                      type="text"
                      placeholder="Jelaskan apa yang harus dilakukan calon siswa..."
                      value={newStepDesc}
                      onChange={(e) => setNewStepDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Simpan Langkah
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stepsList.map((step) => (
                <div key={step.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-black text-sm text-blue-600">Langkah {step.step}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingStep(step)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                          title="Edit Langkah"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id, step.title)}
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                          title="Hapus Langkah"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                    <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Edit Langkah */}
          {editingStep && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form onSubmit={handleUpdateStep} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Edit Tahapan Alur</h4>
                  <button type="button" onClick={() => setEditingStep(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Judul Langkah</label>
                    <input
                      type="text"
                      value={editingStep.title}
                      onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={3}
                      value={editingStep.desc}
                      onChange={(e) => setEditingStep({ ...editingStep, desc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingStep(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          5. PENGUMUMAN & AGENDA SPMB (FULL CRUD & DIRECT UPLOAD)
          ======================================================================== */}
      {subTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                Menu Pengumuman & Agenda SPMB
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Kelola Informasi & Agenda Penting (Direct Upload Poster & CRUD)
              </h3>
            </div>
            <button
              onClick={() => setIsAddingAnn(!isAddingAnn)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingAnn ? 'Batal' : 'Buat Pengumuman Baru'}
            </button>
          </div>

          {/* Form Tambah Pengumuman */}
          {isAddingAnn && (
            <form onSubmit={handleCreateAnnouncement} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Formulir Terbitkan Pengumuman Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jadwal Tes Minat Bakat & Wawancara Gelombang 1"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Agenda</label>
                  <select
                    value={newAnnCategory}
                    onChange={(e) => setNewAnnCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="PENTING">PENTING (Utama)</option>
                    <option value="JADWAL_TES">JADWAL TES & WAWANCARA</option>
                    <option value="PENGUMUMAN_KELULUSAN">PENGUMUMAN KELULUSAN</option>
                    <option value="INFO_DAFTAR_ULANG">INFO DAFTAR ULANG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Upload Poster / Gambar (PNG, JPG)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={annFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDirectFileUpload(file, 'announcements', 'newAnn', (url) => {
                            setNewAnnImage(url);
                          });
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingTarget === 'newAnn'}
                      onClick={() => annFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {uploadingTarget === 'newAnn' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Upload File
                    </button>
                    <input
                      type="url"
                      placeholder="https://... atau klik tombol Upload"
                      value={newAnnImage}
                      onChange={(e) => setNewAnnImage(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Isi Konten Agenda & Pengumuman</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan detail agenda, waktu, tempat, dan instruksi bagi calon siswa..."
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnPinned}
                      onChange={(e) => setNewAnnPinned(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Sematkan di Paling Atas (Pin Pengumuman)
                  </label>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Terbitkan Pengumuman
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List Pengumuman */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Pengumuman & Agenda Aktif ({announcementsList.length})
            </h4>

            <div className="divide-y divide-slate-100">
              {announcementsList.map((ann) => (
                <div key={ann.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {ann.imageUrl && (
                      <img
                        src={ann.imageUrl}
                        alt=""
                        className="w-16 h-12 object-cover rounded-lg shrink-0 border border-slate-200"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {ann.category}
                        </span>
                        {ann.isPinned && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            Disematkan
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{ann.publishedDate}</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-0.5">{ann.title}</h5>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{ann.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingAnn(ann)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                      title="Edit Pengumuman"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Edit Pengumuman */}
          {editingAnn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form onSubmit={handleUpdateAnnouncement} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Edit Pengumuman / Agenda</h4>
                  <button type="button" onClick={() => setEditingAnn(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                    <input
                      type="text"
                      value={editingAnn.title}
                      onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Agenda</label>
                    <select
                      value={editingAnn.category}
                      onChange={(e) => setEditingAnn({ ...editingAnn, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    >
                      <option value="PENTING">PENTING (Utama)</option>
                      <option value="JADWAL_TES">JADWAL TES & WAWANCARA</option>
                      <option value="PENGUMUMAN_KELULUSAN">PENGUMUMAN KELULUSAN</option>
                      <option value="INFO_DAFTAR_ULANG">INFO DAFTAR ULANG</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Poster / Gambar</label>
                    <input
                      type="url"
                      value={editingAnn.imageUrl || ''}
                      onChange={(e) => setEditingAnn({ ...editingAnn, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Isi Konten</label>
                    <textarea
                      rows={3}
                      value={editingAnn.content}
                      onChange={(e) => setEditingAnn({ ...editingAnn, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingAnn.isPinned ?? false}
                      onChange={(e) => setEditingAnn({ ...editingAnn, isPinned: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Sematkan di Paling Atas (Pin)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingAnn(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          6. HAK AKSES & PENGGUNA SISTEM (FULL CRUD: TAMBAH, EDIT, HAPUS OPERATOR)
          ======================================================================== */}
      {subTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                Hak Akses & Pengguna Sistem
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Kelola Akun Admin Utama & Admin Bayangan (Operator)
              </h3>
              <p className="text-xs text-slate-500">
                Tambah atau nonaktifkan akun operator sekolah yang bertugas memverifikasi pendaftar dan mencetak formulir.
              </p>
            </div>

            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingUser ? 'Batal Tambah' : 'Tambah Akun Pengguna'}
            </button>
          </div>

          {/* Form Tambah User Baru */}
          {isAddingUser && (
            <form onSubmit={handleCreateUser} className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
              <h4 className="text-sm font-bold text-blue-950">Tambah Akun Pengguna / Operator Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Petugas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso, S.Kom."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    placeholder="Contoh: operator2"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password Akses</label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Hak Akses (Role)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="OPERATOR">Admin Bayangan (Operator Operasional Harian)</option>
                    <option value="SUPER_ADMIN">Admin Utama (Super Admin - Akses Penuh)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Buat Akun Sekarang
                </button>
              </div>
            </form>
          )}

          {/* Tabel Daftar Pengguna */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Nama Petugas</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role / Hak Akses</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminUsersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{usr.name}</td>
                    <td className="p-3 font-mono font-bold text-blue-700">{usr.username}</td>
                    <td className="p-3">
                      {usr.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          SUPER ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          OPERATOR
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Aktif
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(usr)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Edit Akun"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {usr.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Edit Akun Pengguna */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form onSubmit={handleUpdateUser} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Edit Akun Pengguna</h4>
                  <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().trim() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ubah Password</label>
                    <input
                      type="password"
                      placeholder="Masukkan password baru..."
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tingkat Hak Akses (Role)</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    >
                      <option value="OPERATOR">OPERATOR (Admin Bayangan - Khusus Operasional)</option>
                      <option value="SUPER_ADMIN">SUPER ADMIN (Admin Utama - Akses Penuh)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
