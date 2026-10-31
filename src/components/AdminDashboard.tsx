import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  Search, 
  Filter, 
  Download, 
  Database, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  ShieldAlert,
  Radio, 
  Eye,
  FileSpreadsheet,
  LogOut,
  SlidersHorizontal,
  Layout,
  Lock,
  Unlock,
  MessageSquare,
  Send,
  Mail,
  Copy,
  ExternalLink,
  FileText
} from 'lucide-react';
import { 
  Registration, 
  RegistrationStatus, 
  AdminUser, 
  SchoolSettings, 
  Major, 
  Wave, 
  Announcement, 
  SiteLayoutSettings 
} from '../types';
import { 
  updateRegistrationStatus, 
  deleteRegistration,
  createWhatsAppNotificationUrl,
  createEmailNotificationUrl,
  getNotificationTemplate
} from '../lib/supabase';
import { A4RegistrationSheet } from './A4RegistrationSheet';
import { ContentManagement } from './ContentManagement';

interface AdminDashboardProps {
  currentUser: AdminUser;
  onLogout: () => void;
  registrations: Registration[];
  onRefresh: () => void;
  isRealtimeConnected: boolean;
  onOpenSupabaseModal: () => void;
  settings: SchoolSettings;
  layoutSettings: SiteLayoutSettings;
  majors: Major[];
  waves: Wave[];
  announcements: Announcement[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  registrations,
  onRefresh,
  isRealtimeConnected,
  onOpenSupabaseModal,
  settings,
  layoutSettings,
  majors,
  waves,
  announcements,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const [activeAdminTab, setActiveAdminTab] = useState<'pendaftar' | 'konten'>('pendaftar');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [majorFilter, setMajorFilter] = useState<string>('ALL');
  const [selectedStudentForA4, setSelectedStudentForA4] = useState<Registration | null>(null);
  const [isPrintingBlankA4, setIsPrintingBlankA4] = useState<boolean>(false);

  // Notification Modal State
  const [selectedStudentForNotification, setSelectedStudentForNotification] = useState<Registration | null>(null);
  const [notifTemplate, setNotifTemplate] = useState<'CONFIRM' | 'TEST_INVITE' | 'ACCEPTED' | 'REVISE_DOCS' | 'CUSTOM'>('CONFIRM');
  const [notifSubject, setNotifSubject] = useState<string>('');
  const [notifBody, setNotifBody] = useState<string>('');
  const [copiedNotif, setCopiedNotif] = useState<boolean>(false);

  const [editingStudent, setEditingStudent] = useState<Registration | null>(null);
  const [editTab, setEditTab] = useState<'status' | 'biodata' | 'alamat' | 'ortu_jurusan'>('status');
  const [editForm, setEditForm] = useState<Registration | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [dashboardToast, setDashboardToast] = useState<string>('');

  // Confirmation Modal Delete State
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string; regNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setDashboardToast(msg);
    setTimeout(() => setDashboardToast(''), 3500);
  };

  // Statistics
  const totalCount = registrations.length;
  const acceptedCount = registrations.filter((r) => r.status === 'DITERIMA').length;
  const verifiedCount = registrations.filter((r) => r.status === 'VERIFIKASI_BERKAS').length;
  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;
  const reserveCount = registrations.filter((r) => r.status === 'CADANGAN').length;

  // Filtered List
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.personalData.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.personalData.nisn && reg.personalData.nisn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      reg.schoolOrigin.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;
    const matchesMajor = majorFilter === 'ALL' || reg.majorChoice.firstChoice === majorFilter;

    return matchesSearch && matchesStatus && matchesMajor;
  });

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredRegistrations.map((r, index) => ({
      'No.': index + 1,
      'No. Registrasi': r.registrationNumber,
      'Tanggal Daftar': r.createdAt.split('T')[0],
      'Nama Calon Siswa': r.personalData.fullName,
      'No. Kartu Keluarga (KK)': r.personalData.kkNumber || '-',
      'NIK Calon Siswa': r.personalData.nik,
      'NISN': r.personalData.nisn || '-',
      'Jenis Kelamin': r.personalData.gender,
      'Tempat Lahir': r.personalData.birthPlace,
      'Tanggal Lahir': r.personalData.birthDate,
      'Agama': r.personalData.religion || 'Islam',
      'No. WhatsApp Siswa': r.personalData.phoneWhatsApp,
      'Email Siswa': r.personalData.email || '-',
      // Pemisahan Kolom Alamat Lengkap
      'Kampung / Dusun': r.personalData.hamlet || '-',
      'RT': r.personalData.rt || '-',
      'RW': r.personalData.rw || '-',
      'Desa / Kelurahan': r.personalData.village || '-',
      'Kecamatan': r.personalData.district || '-',
      'Kabupaten / Kota': r.personalData.city || '-',
      'Provinsi': r.personalData.province || '-',
      'Alamat Jalan': r.personalData.address || '-',
      // Jurusan & Asal Sekolah
      'Pilihan 1 (Utama)': r.majorChoice.firstChoice,
      'Pilihan 2 (Alternatif)': r.majorChoice.secondChoice || '-',
      'Asal SMP/MTs': r.schoolOrigin.schoolName,
      'Tahun Lulus': r.schoolOrigin.graduationYear || '-',
      'Rata-rata Rapor': r.schoolOrigin.averageScore || '-',
      // Data Orang Tua / Wali (10 Kolom Lengkap)
      '1. Nama Ayah/Wali': r.parentData.fatherName || '-',
      '2. Nama Ibu/Wali': r.parentData.motherName || '-',
      '3. NIK Ayah/Wali': r.parentData.fatherNik || '-',
      '4. NIK Ibu/Wali': r.parentData.motherNik || '-',
      '5. Pekerjaan Ayah/Wali': r.parentData.fatherJob || r.parentData.parentJob || '-',
      '6. Pekerjaan Ibu/Wali': r.parentData.motherJob || '-',
      '7. No. Telp/WA Ayah/Wali': r.parentData.fatherPhone || r.parentData.parentPhone || '-',
      '8. No. Telp/WA Ibu/Wali': r.parentData.motherPhone || '-',
      '9. Status Tinggal Bersama': r.parentData.livingWithStatus || r.parentData.livingWith || '-',
      '10. Alamat Orang Tua/Wali': r.parentData.parentAddress || '-',
      // Status & Seleksi
      'Gelombang': r.wave,
      'Status Verifikasi': r.status,
      'Status Kunci': r.isLocked ? 'Terkunci' : 'Terbuka',
      'Nilai Tes Tulis': r.testScore ?? 0,
      'Nilai Wawancara': r.interviewScore ?? 0,
      'Nilai Akhir': r.finalScore ?? 0,
      'Catatan Panitia': r.statusNote || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftar_SPMB_2026');
    XLSX.writeFile(workbook, `Data_Pendaftar_SPMB_LB2_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenEditModal = (student: Registration) => {
    setEditingStudent(student);
    setEditForm(JSON.parse(JSON.stringify(student))); // Deep copy
    setEditTab('status');
  };

  const handleSaveStudentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setIsUpdating(true);
    const testScore = editForm.testScore ?? 0;
    const interviewScore = editForm.interviewScore ?? 0;
    const finalScore = Number(((testScore * 0.5) + (interviewScore * 0.5)).toFixed(2));

    const updatedData: Registration = {
      ...editForm,
      testScore,
      interviewScore,
      finalScore,
      verifiedBy: `${currentUser.name} (${currentUser.role === 'SUPER_ADMIN' ? 'Admin Utama' : 'Operator'})`,
      verifiedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    const res = await import('../lib/supabase').then(m => m.updateStudentFullData(updatedData));
    setIsUpdating(false);

    if (res.success) {
      showToast(`Data pendaftar "${updatedData.personalData.fullName}" berhasil diperbarui!`);
      setEditingStudent(null);
      setEditForm(null);
      onRefresh();
    } else {
      alert(`Gagal menyimpan perubahan: ${res.error || 'Terjadi kesalahan sistem'}`);
    }
  };

  const handleToggleLock = async (student: Registration) => {
    const nextLockedState = !student.isLocked;
    await updateRegistrationStatus(student.id, {
      isLocked: nextLockedState,
    });
    showToast(nextLockedState ? 'Data pendaftar dikunci' : 'Kunci pendaftar dibuka');
    onRefresh();
  };

  const handleOpenNotificationModal = (student: Registration) => {
    setSelectedStudentForNotification(student);
    setNotifTemplate('CONFIRM');
    const tmpl = getNotificationTemplate('CONFIRM', student, settings);
    setNotifSubject(tmpl.subject);
    setNotifBody(tmpl.message);
    setCopiedNotif(false);
  };

  const handleSelectNotificationTemplate = (type: 'CONFIRM' | 'TEST_INVITE' | 'ACCEPTED' | 'REVISE_DOCS' | 'CUSTOM') => {
    if (!selectedStudentForNotification) return;
    setNotifTemplate(type);
    const tmpl = getNotificationTemplate(type, selectedStudentForNotification, settings);
    setNotifSubject(tmpl.subject);
    setNotifBody(tmpl.message);
  };

  const handleCopyNotificationMessage = () => {
    navigator.clipboard.writeText(notifBody);
    setCopiedNotif(true);
    setTimeout(() => setCopiedNotif(false), 3000);
  };

  const handleDeleteClick = (id: string, name: string, regNumber: string) => {
    setStudentToDelete({ id, name, regNumber });
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRegistration(studentToDelete.id);
      showToast(`Data pendaftar "${studentToDelete.name}" berhasil dihapus.`);
      setStudentToDelete(null);
      onRefresh();
    } catch (e: any) {
      showToast('Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isPrintingBlankA4) {
    return (
      <A4RegistrationSheet
        defaultBlank={true}
        onBack={() => setIsPrintingBlankA4(false)}
        showControls={true}
      />
    );
  }

  if (selectedStudentForA4) {
    return (
      <A4RegistrationSheet
        registration={selectedStudentForA4}
        onBack={() => setSelectedStudentForA4(null)}
        showControls={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {dashboardToast && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dashboardToast}</span>
        </div>
      )}

      {/* Top Banner with User Profile, Realtime Status & Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Portal Manajemen SPMB 2026/2027
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Supabase Realtime Live
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Masuk sebagai: <strong className="text-slate-800">{currentUser.name}</strong></span>
            <span>&bull;</span>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                ADMIN UTAMA (HAK AKSES PENUH)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                ADMIN BAYANGAN (OPERATOR OPERASIONAL)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSupabaseModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-700"
            title="Kelola Skema SQL & Database Supabase"
          >
            <Database className="w-4 h-4 text-blue-400" />
            Kelola Skema SQL & Server
          </button>

          <button
            onClick={() => setIsPrintingBlankA4(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-300"
            title="Cetak Blanko Formulir Kosong Format A4"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Blanko Formulir Kosong (A4)
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel (.xlsx)
          </button>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Refresh Data Realtime"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200"
            title="Keluar Sesi Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </div>

      {/* Admin Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAdminTab('pendaftar')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'pendaftar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Data & Verifikasi Pendaftar ({totalCount})
        </button>

        <button
          onClick={() => {
            if (!isSuperAdmin) {
              alert('Akses Terbatas: Menu Pengaturan Konten & Tata Letak Web hanya dapat diakses oleh Admin Utama (Super Admin).');
              return;
            }
            setActiveAdminTab('konten');
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminTab === 'konten'
              ? 'bg-blue-600 text-white shadow-xs'
              : isSuperAdmin
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80'
          }`}
        >
          <Layout className="w-4 h-4" />
          Manajemen Konten & Tata Letak Web
          {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
        </button>
      </div>

      {/* TAB 1: DATA & VERIFIKASI PENDAFTAR */}
      {activeAdminTab === 'pendaftar' && (
        <div className="space-y-6">
          {/* Statistics Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Pendaftar
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalCount}</div>
              <span className="text-[10px] text-slate-400">Semua Gelombang</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Diterima
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{acceptedCount}</div>
              <span className="text-[10px] text-slate-400">Lolos Seleksi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                Verifikasi Berkas
              </span>
              <div className="text-2xl font-black text-blue-700 font-mono mt-1">{verifiedCount}</div>
              <span className="text-[10px] text-slate-400">Pemeriksaan Dokumen</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                Pending
              </span>
              <div className="text-2xl font-black text-slate-700 font-mono mt-1">{pendingCount}</div>
              <span className="text-[10px] text-slate-400">Pendaftar Baru</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                Cadangan
              </span>
              <div className="text-2xl font-black text-amber-700 font-mono mt-1">{reserveCount}</div>
              <span className="text-[10px] text-slate-400">Menunggu Kuota</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari Nama, No. Reg, NISN, SMP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="DITERIMA">DITERIMA</option>
                <option value="VERIFIKASI_BERKAS">VERIFIKASI BERKAS</option>
                <option value="PENDING">PENDING</option>
                <option value="CADANGAN">CADANGAN</option>
                <option value="DITOLAK">DITOLAK</option>
              </select>

              <select
                value={majorFilter}
                onChange={(e) => setMajorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Jurusan</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registrations Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="p-3 pl-4">No. Registrasi</th>
                    <th className="p-3">Nama Lengkap & NISN</th>
                    <th className="p-3">Jurusan Pilihan</th>
                    <th className="p-3">Asal Sekolah</th>
                    <th className="p-3">Status Seleksi</th>
                    <th className="p-3">Nilai Akhir</th>
                    <th className="p-3 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-800">
                          {reg.registrationNumber}
                          <span className="block text-[10px] font-normal text-slate-400">
                            {reg.createdAt.split('T')[0]}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 uppercase">
                            {reg.personalData.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            NISN: {reg.personalData.nisn} &bull; {reg.personalData.phoneWhatsApp}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block">
                            {reg.majorChoice.firstChoice}
                          </span>
                          {reg.majorChoice.secondChoice && (
                            <span className="text-[10px] text-slate-400 block">
                              Alt: {reg.majorChoice.secondChoice}
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="text-slate-800">{reg.schoolOrigin.schoolName}</span>
                          <span className="block text-[10px] text-slate-400">
                            Rata-rata: {reg.schoolOrigin.averageScore || '-'}
                          </span>
                        </td>

                        <td className="p-3">
                          {reg.status === 'DITERIMA' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              DITERIMA
                            </span>
                          )}
                          {reg.status === 'VERIFIKASI_BERKAS' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3" />
                              VERIFIKASI
                            </span>
                          )}
                          {reg.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              <Clock className="w-3 h-3" />
                              PENDING
                            </span>
                          )}
                          {reg.status === 'CADANGAN' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" />
                              CADANGAN
                            </span>
                          )}
                          {reg.status === 'DITOLAK' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              TIDAK LOLOS
                            </span>
                          )}

                          {reg.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-1 block w-fit">
                              <Lock className="w-2.5 h-2.5" /> Terkunci
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1 block w-fit">
                              <Unlock className="w-2.5 h-2.5" /> Terbuka
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700">
                          {reg.finalScore && reg.finalScore > 0 ? (
                            <span className="text-blue-700">{reg.finalScore}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Lock / Unlock Data */}
                            <button
                              onClick={() => handleToggleLock(reg)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                reg.isLocked
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title={reg.isLocked ? 'Data Terkunci (Klik untuk Buka Kunci Akses Siswa)' : 'Data Terbuka (Klik untuk Kunci Data)'}
                            >
                              {reg.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            {/* Kirim Notifikasi WA / Email */}
                            <button
                              onClick={() => handleOpenNotificationModal(reg)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                              title="Kirim Notifikasi WhatsApp & Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Cetak A4 */}
                            <button
                              onClick={() => setSelectedStudentForA4(reg)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                              title="Cetak Lembar A4 Terisi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Status & Nilai (Accessible by both Admin & Operator) */}
                            <button
                              onClick={() => handleOpenEditModal(reg)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-300"
                              title="Update Verifikasi & Input Nilai"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete (dengan Modal Konfirmasi Aman) */}
                            <button
                              onClick={() => handleDeleteClick(reg.id, reg.personalData.fullName, reg.registrationNumber)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer border border-rose-200"
                              title="Hapus Data Pendaftar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada data pendaftar yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN KONTEN & TATA LETAK WEB (Super Admin Only) */}
      {activeAdminTab === 'konten' && (
        <ContentManagement
          currentUser={currentUser}
          settings={settings}
          layoutSettings={layoutSettings}
          majors={majors}
          waves={waves}
          announcements={announcements}
          onRefreshAll={onRefresh}
        />
      )}

      {/* Modal Komprehensif: Update Status & Edit Seluruh Data Pendaftar */}
      {editingStudent && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Koreksi Data Pendaftar & Nilai Seleksi
                  </h3>
                  <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {editForm.registrationNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {editForm.personalData.fullName} &bull; Gelombang: {editForm.wave}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-bold shrink-0">
              {[
                { id: 'status', label: '1. Status & Nilai' },
                { id: 'biodata', label: '2. Biodata Siswa' },
                { id: 'alamat', label: '3. Alamat Lengkap' },
                { id: 'ortu_jurusan', label: '4. Ortu & Jurusan' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    editTab === t.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveStudentUpdate} className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* TAB 1: STATUS, NILAI & CATATAN */}
              {editTab === 'status' && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status Penerimaan Siswa
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as RegistrationStatus })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                    >
                      <option value="DITERIMA">DITERIMA (Lolos Seleksi)</option>
                      <option value="VERIFIKASI_BERKAS">VERIFIKASI BERKAS (Pemeriksaan Dokumen)</option>
                      <option value="PENDING">PENDING (Menunggu Seleksi)</option>
                      <option value="CADANGAN">CADANGAN (Daftar Tunggu Kuota)</option>
                      <option value="DITOLAK">DITOLAK (Tidak Memenuhi Syarat)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nilai Tes Tulis (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={editForm.testScore ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, testScore: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nilai Wawancara (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={editForm.interviewScore ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, interviewScore: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Catatan Resmi Panitia (Tampil saat Siswa Cek Status)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Selamat Anda diterima di Jurusan TKJ. Silakan hadir daftar ulang pada..."
                      value={editForm.statusNote || ''}
                      onChange={(e) => setEditForm({ ...editForm, statusNote: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="editIsLocked"
                      checked={editForm.isLocked ?? false}
                      onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="editIsLocked" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Kunci Data Pendaftar (Cegah edit mandiri oleh calon siswa)
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: BIODATA CALON SISWA */}
              {editTab === 'biodata' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap (Sesuai Ijazah)</label>
                    <input
                      type="text"
                      value={editForm.personalData.fullName}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, fullName: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={editForm.personalData.kkNumber || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, kkNumber: e.target.value.replace(/\D/g, '') }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIK Siswa (16 Digit)</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={editForm.personalData.nik}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, nik: e.target.value.replace(/\D/g, '') }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit, Opsional)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editForm.personalData.nisn || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, nisn: e.target.value.replace(/\D/g, '') }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={editForm.personalData.gender}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, gender: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={editForm.personalData.birthPlace}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, birthPlace: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={editForm.personalData.birthDate}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, birthDate: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Agama</label>
                    <select
                      value={editForm.personalData.religion}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, religion: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen Protestan">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Calon Siswa</label>
                    <input
                      type="text"
                      value={editForm.personalData.phoneWhatsApp}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, phoneWhatsApp: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ALAMAT LENGKAP */}
              {editTab === 'alamat' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Jalan / Komplek / No. Rumah</label>
                    <textarea
                      rows={2}
                      value={editForm.personalData.address}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, address: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kampung / Dusun</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kp. Kaum Karawang"
                      value={editForm.personalData.hamlet || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, hamlet: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">RT</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="001"
                        value={editForm.personalData.rt || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          personalData: { ...editForm.personalData, rt: e.target.value.replace(/\D/g, '') }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">RW</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="002"
                        value={editForm.personalData.rw || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          personalData: { ...editForm.personalData, rw: e.target.value.replace(/\D/g, '') }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Sukaharja"
                      value={editForm.personalData.village || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, village: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Telukjambe Timur"
                      value={editForm.personalData.district || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, district: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                    <input
                      type="text"
                      value={editForm.personalData.city || 'Kabupaten Karawang'}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                    <input
                      type="text"
                      value={editForm.personalData.province || 'Jawa Barat'}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        personalData: { ...editForm.personalData, province: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: ORANG TUA / WALI & JURUSAN */}
              {editTab === 'ortu_jurusan' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Jurusan Pilihan 1 (Utama)</label>
                      <select
                        value={editForm.majorChoice.firstChoice}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          majorChoice: { ...editForm.majorChoice, firstChoice: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      >
                        {majors.map((m) => (
                          <option key={m.id} value={m.name}>{m.code} - {m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Jurusan Pilihan 2 (Alternatif)</label>
                      <select
                        value={editForm.majorChoice.secondChoice || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          majorChoice: { ...editForm.majorChoice, secondChoice: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      >
                        <option value="">-- Tidak Memilih --</option>
                        {majors.map((m) => (
                          <option key={m.id} value={m.name}>{m.code} - {m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Asal SMP / MTs</label>
                      <input
                        type="text"
                        value={editForm.schoolOrigin.schoolName}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          schoolOrigin: { ...editForm.schoolOrigin, schoolName: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Rata-rata Nilai Rapor</label>
                      <input
                        type="text"
                        value={editForm.schoolOrigin.averageScore || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          schoolOrigin: { ...editForm.schoolOrigin, averageScore: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wide">
                      Data Orang Tua / Wali & Kelengkapan (10 Bidang Resmi)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">1. Nama Ayah/Wali</label>
                        <input
                          type="text"
                          value={editForm.parentData.fatherName}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, fatherName: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">2. Nama Ibu/Wali</label>
                        <input
                          type="text"
                          value={editForm.parentData.motherName}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, motherName: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">3. NIK Ayah/Wali</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={editForm.parentData.fatherNik || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, fatherNik: e.target.value.replace(/\D/g, '') }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">4. NIK Ibu/Wali</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={editForm.parentData.motherNik || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, motherNik: e.target.value.replace(/\D/g, '') }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">5. Pekerjaan Ayah/Wali</label>
                        <input
                          type="text"
                          value={editForm.parentData.fatherJob || editForm.parentData.parentJob || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, fatherJob: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">6. Pekerjaan Ibu/Wali</label>
                        <input
                          type="text"
                          value={editForm.parentData.motherJob || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, motherJob: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">7. No. Telepon/WA Ayah/Wali</label>
                        <input
                          type="tel"
                          value={editForm.parentData.fatherPhone || editForm.parentData.parentPhone || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, fatherPhone: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">8. No. Telepon/WA Ibu/Wali</label>
                        <input
                          type="tel"
                          value={editForm.parentData.motherPhone || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, motherPhone: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">9. Status Tinggal Bersama</label>
                        <select
                          value={editForm.parentData.livingWithStatus || editForm.parentData.livingWith || 'Orang Tua'}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, livingWithStatus: e.target.value, livingWith: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        >
                          <option value="Orang Tua">Orang Tua</option>
                          <option value="Wali">Wali Siswa</option>
                          <option value="Asrama">Asrama</option>
                          <option value="Kost">Kost Mandiri</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">10. Alamat Orang Tua/Wali</label>
                        <input
                          type="text"
                          placeholder="Alamat domisili orang tua / wali"
                          value={editForm.parentData.parentAddress || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            parentData: { ...editForm.parentData, parentAddress: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setEditForm(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Seluruh Data Pendaftar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kirim Notifikasi WhatsApp & Email */}
      {selectedStudentForNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kirim Notifikasi ke Pendaftar
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudentForNotification.personalData.fullName} &bull; {selectedStudentForNotification.registrationNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForNotification(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Template Notifikasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CONFIRM', label: 'Konfirmasi Pendaftaran' },
                    { id: 'TEST_INVITE', label: 'Undangan Tes & Wawancara' },
                    { id: 'ACCEPTED', label: 'Pengumuman DITERIMA' },
                    { id: 'REVISE_DOCS', label: 'Revisi / Berkas Kurang' },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectNotificationTemplate(tmpl.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                        notifTemplate === tmpl.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subjek Pesan (Email)
                </label>
                <input
                  type="text"
                  value={notifSubject}
                  onChange={(e) => setNotifSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Pesan Notifikasi (Dapat diedit bebas)
                </label>
                <textarea
                  rows={6}
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Recipient Details Preview */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nomor WhatsApp Siswa:</span>
                  <strong className="text-slate-800 font-mono">
                    {selectedStudentForNotification.personalData.phoneWhatsApp}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email Siswa:</span>
                  <strong className="text-slate-800 font-mono">
                    {selectedStudentForNotification.personalData.email || '-'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCopyNotificationMessage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedNotif ? 'Tersalin!' : 'Salin Pesan'}
                </button>

                <div className="flex items-center gap-2">
                  {selectedStudentForNotification.personalData.email && (
                    <a
                      href={createEmailNotificationUrl(
                        selectedStudentForNotification.personalData.email,
                        notifSubject,
                        notifBody
                      )}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Kirim Email
                    </a>
                  )}

                  <a
                    href={createWhatsAppNotificationUrl(
                      selectedStudentForNotification.personalData.phoneWhatsApp,
                      notifBody
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Kirim ke WhatsApp
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal: Hapus Data Pendaftar */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6 text-rose-600 animate-pulse" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Konfirmasi Hapus Data Pendaftar
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data calon siswa:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center my-2">
                <p className="text-sm font-bold text-slate-900">{studentToDelete.name}</p>
                <p className="text-xs font-mono text-blue-600 font-semibold">{studentToDelete.regNumber}</p>
              </div>
              <p className="text-[11px] text-rose-600 font-medium">
                Peringatan: Data yang dihapus tidak dapat dipulihkan kembali dari sistem & database Supabase.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
