import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  ArrowRight, 
  UserCheck, 
  Award,
  Edit,
  Lock,
  MessageCircle,
  ExternalLink,
  FileText,
  Save,
  X
} from 'lucide-react';
import { Registration, SchoolSettings } from '../types';
import { A4RegistrationSheet } from './A4RegistrationSheet';
import { updateStudentFullData, DEFAULT_SCHOOL_SETTINGS } from '../lib/supabase';

interface CheckStatusProps {
  registrations: Registration[];
  onBackToHome?: () => void;
  schoolSettings?: SchoolSettings;
  onRefreshRegistrations?: () => void;
}

export const CheckStatus: React.FC<CheckStatusProps> = ({ 
  registrations, 
  onBackToHome,
  schoolSettings = DEFAULT_SCHOOL_SETTINGS,
  onRefreshRegistrations
}) => {
  const [keyword, setKeyword] = useState<string>('');
  const [searched, setSearched] = useState<boolean>(false);
  const [foundStudent, setFoundStudent] = useState<Registration | null>(null);
  const [showA4Print, setShowA4Print] = useState<boolean>(false);
  const [printBlankMode, setPrintBlankMode] = useState<boolean>(false);

  // Self Edit State
  const [isEditingMandiri, setIsEditingMandiri] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Registration | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    const term = keyword.trim().toLowerCase();
    const result = registrations.find(
      (r) =>
        r.registrationNumber.toLowerCase() === term ||
        (r.personalData.nisn && r.personalData.nisn.toLowerCase() === term) ||
        r.personalData.nik.toLowerCase() === term ||
        (r.personalData.kkNumber && r.personalData.kkNumber.toLowerCase() === term) ||
        r.personalData.fullName.toLowerCase().includes(term)
    );

    setSearched(true);
    setFoundStudent(result || null);
    setShowA4Print(false);
  };

  const handleStartSelfEdit = () => {
    if (!foundStudent) return;
    if (foundStudent.isLocked || foundStudent.status === 'DITERIMA') {
      alert('Data pendaftaran Anda telah diverifikasi dan dikunci oleh panitia sehingga tidak dapat diubah lagi.');
      return;
    }
    setEditFormData(JSON.parse(JSON.stringify(foundStudent)));
    setIsEditingMandiri(true);
    setEditSuccessMsg('');
  };

  const handleSaveSelfEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    setIsSavingEdit(true);
    const res = await updateStudentFullData(editFormData);
    setIsSavingEdit(false);

    if (res.success) {
      setFoundStudent(editFormData);
      setIsEditingMandiri(false);
      setEditSuccessMsg('Data pendaftaran berhasil diperbarui secara mandiri!');
      setTimeout(() => setEditSuccessMsg(''), 4000);
      if (onRefreshRegistrations) onRefreshRegistrations();
    } else {
      alert('Gagal menyimpan perubahan: ' + (res.error || 'Terjadi kesalahan jaringan'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DITERIMA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            DITERIMA SELEKSI
          </span>
        );
      case 'VERIFIKASI_BERKAS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            VERIFIKASI BERKAS
          </span>
        );
      case 'CADANGAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            STATUS CADANGAN
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            TIDAK LOLOS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            PENDING (MENUNGGU VERIFIKASI)
          </span>
        );
    }
  };

  if (showA4Print) {
    return (
      <A4RegistrationSheet
        registration={foundStudent}
        onBack={() => setShowA4Print(false)}
        showControls={true}
        defaultBlank={printBlankMode}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Search Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-2">
          Layanan Mandiri Pendaftar
        </span>
        <h2 className="text-2xl font-black text-slate-900 font-heading mb-2">
          Cek Status Pendaftaran & Perbaikan Data Mandiri
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-6">
          Masukkan Nomor Registrasi resmi (contoh: <code className="font-mono text-blue-700 font-bold">LB2-2026-0001</code>), NIK, atau Nomor KK Anda.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Nomor Registrasi / NIK / No. KK"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Cek Status
          </button>
        </form>

        {/* Quick Action to print blank form */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-500">Butuh blanko formulir kosong untuk pendaftaran manual?</span>
          <button
            onClick={() => {
              setPrintBlankMode(true);
              setShowA4Print(true);
            }}
            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Blanko Formulir Kosong (A4)
          </button>
        </div>
      </div>

      {/* Edit Success Notification */}
      {editSuccessMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{editSuccessMsg}</span>
        </div>
      )}

      {/* Result View */}
      {searched && (
        <div>
          {foundStudent ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {foundStudent.personalData.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase">
                      {foundStudent.personalData.fullName}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono">
                      No. Reg: {foundStudent.registrationNumber} &bull; NIK: {foundStudent.personalData.nik}
                      {foundStudent.personalData.kkNumber && ` • KK: ${foundStudent.personalData.kkNumber}`}
                    </p>
                  </div>
                </div>

                <div>{getStatusBadge(foundStudent.status)}</div>
              </div>

              <div className="p-6 space-y-5">
                {/* Status Note Alert */}
                {foundStudent.statusNote && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 flex items-start gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-blue-900 font-bold mb-0.5">Catatan Tim Panitia SPMB:</strong>
                      <span>{foundStudent.statusNote}</span>
                    </div>
                  </div>
                )}

                {/* WhatsApp Group Mandatory Invite */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">
                        Grup WhatsApp Resmi Pendaftar SPMB
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Pastikan Anda telah bergabung untuk mendapatkan jadwal seleksi dan panggilan resmi.
                      </p>
                    </div>
                  </div>
                  <a
                    href={schoolSettings.whatsappGroupLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
                  >
                    Masuk Grup WA
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Score Section if available */}
                {(foundStudent.finalScore ?? 0) > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      Hasil Seleksi Akademik & Wawancara
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Tes Tulis</span>
                        <span className="text-sm font-bold font-mono text-slate-800">
                          {foundStudent.testScore ?? 0}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Wawancara</span>
                        <span className="text-sm font-bold font-mono text-slate-800">
                          {foundStudent.interviewScore ?? 0}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Nilai Akhir</span>
                        <span className="text-sm font-bold font-mono text-blue-700">
                          {foundStudent.finalScore ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Pilihan Program Keahlian & Asal Sekolah
                    </span>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Pilihan 1 (Utama):</span>
                      <strong className="text-slate-900">{foundStudent.majorChoice.firstChoice}</strong>
                    </div>
                    {foundStudent.majorChoice.secondChoice && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Pilihan 2 (Alternatif):</span>
                        <span className="text-slate-700">{foundStudent.majorChoice.secondChoice}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 block text-[10px]">SMP/MTs Asal:</span>
                      <strong className="text-slate-900">{foundStudent.schoolOrigin.schoolName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Gelombang Pendaftaran:</span>
                      <span className="text-slate-700 font-semibold">{foundStudent.wave}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Identitas & Kontak Siswa
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">No. Kartu Keluarga (KK):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {foundStudent.personalData.kkNumber || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">NIK Calon Siswa:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {foundStudent.personalData.nik}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">No. WhatsApp Calon Siswa:</span>
                      <span className="font-mono text-slate-800">{foundStudent.personalData.phoneWhatsApp}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Alamat Domisili:</span>
                      <span className="text-slate-800 leading-tight block">
                        {foundStudent.personalData.address}
                        {foundStudent.personalData.hamlet && `, Dsn/Kp. ${foundStudent.personalData.hamlet}`}
                        {(foundStudent.personalData.rt || foundStudent.personalData.rw) && ` (RT ${foundStudent.personalData.rt || '-'}/RW ${foundStudent.personalData.rw || '-'})`}
                        {foundStudent.personalData.village && `, Desa ${foundStudent.personalData.village}`}
                        {foundStudent.personalData.district && `, Kec. ${foundStudent.personalData.district}`}
                        {foundStudent.personalData.province && `, Prov. ${foundStudent.personalData.province}`}
                      </span>
                    </div>
                  </div>

                  {/* Data Orang Tua / Wali 10 Bidang Ringkas */}
                  <div className="sm:col-span-2 border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                      Data Orang Tua / Wali
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Ayah / Wali:</span>
                        <strong className="text-slate-900">{foundStudent.parentData.fatherName || '-'}</strong>
                        <span className="text-slate-600 block text-[10px]">
                          NIK: {foundStudent.parentData.fatherNik || '-'} &bull; Pekerjaan: {foundStudent.parentData.fatherJob || '-'}
                        </span>
                        <span className="text-slate-600 block text-[10px] font-mono">
                          Kontak: {foundStudent.parentData.fatherPhone || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Ibu / Wali:</span>
                        <strong className="text-slate-900">{foundStudent.parentData.motherName || '-'}</strong>
                        <span className="text-slate-600 block text-[10px]">
                          NIK: {foundStudent.parentData.motherNik || '-'} &bull; Pekerjaan: {foundStudent.parentData.motherJob || '-'}
                        </span>
                        <span className="text-slate-600 block text-[10px] font-mono">
                          Kontak: {foundStudent.parentData.motherPhone || '-'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-slate-200 text-[10.5px] text-slate-700 flex flex-wrap gap-4">
                      <span><strong>Status Tinggal Bersama:</strong> {foundStudent.parentData.livingWithStatus || foundStudent.parentData.livingWith || 'Orang Tua'}</span>
                      {foundStudent.parentData.parentAddress && (
                        <span><strong>Alamat Ortu:</strong> {foundStudent.parentData.parentAddress}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Self Edit & Print A4 */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div>
                    {foundStudent.isLocked || foundStudent.status === 'DITERIMA' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Data Terkunci (Sudah diverifikasi panitia)
                      </span>
                    ) : (
                      <button
                        onClick={handleStartSelfEdit}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-700" />
                        Perbaiki Data Mandiri
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPrintBlankMode(true);
                        setShowA4Print(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      title="Cetak Blanko Kosong"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Blanko Kosong
                    </button>

                    <button
                      onClick={() => {
                        setPrintBlankMode(false);
                        setShowA4Print(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Formulir A4 Terisi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Data Pendaftar Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Tidak ada data yang cocok dengan kata kunci "{keyword}". Pastikan nomor registrasi, NIK, atau No. KK yang dimasukkan sudah benar.
              </p>
              <button
                onClick={() => setKeyword('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cari Ulang
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Perbaikan Data Mandiri oleh Siswa */}
      {isEditingMandiri && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Perbaikan Data Pendaftaran Mandiri
                </h3>
                <p className="text-xs text-slate-500">
                  {editFormData.personalData.fullName} &bull; No. Reg: {editFormData.registrationNumber}
                </p>
              </div>
              <button
                onClick={() => setIsEditingMandiri(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSelfEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editFormData.personalData.fullName}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, fullName: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold uppercase text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={editFormData.personalData.kkNumber || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, kkNumber: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK Calon Siswa</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={editFormData.personalData.nik}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, nik: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (Opsional)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editFormData.personalData.nisn || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, nisn: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    value={editFormData.personalData.phoneWhatsApp}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, phoneWhatsApp: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Jalan / Komplek / No. Rumah</label>
                  <textarea
                    rows={2}
                    value={editFormData.personalData.address}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, address: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kampung / Dusun</label>
                  <input
                    type="text"
                    value={editFormData.personalData.hamlet || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, hamlet: e.target.value }
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
                      value={editFormData.personalData.rt || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        personalData: { ...editFormData.personalData, rt: e.target.value.replace(/\D/g, '') }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">RW</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editFormData.personalData.rw || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        personalData: { ...editFormData.personalData, rw: e.target.value.replace(/\D/g, '') }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan</label>
                  <input
                    type="text"
                    value={editFormData.personalData.village || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, village: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={editFormData.personalData.district || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, district: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={editFormData.personalData.province || 'Jawa Barat'}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      personalData: { ...editFormData.personalData, province: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama SMP/MTs Asal</label>
                  <input
                    type="text"
                    value={editFormData.schoolOrigin.schoolName}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      schoolOrigin: { ...editFormData.schoolOrigin, schoolName: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>

                {/* 10 Bidang Orang Tua */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wide">
                    Data Orang Tua / Wali (10 Bidang Data)
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">1. Nama Ayah/Wali</label>
                  <input
                    type="text"
                    value={editFormData.parentData.fatherName}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, fatherName: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">2. Nama Ibu/Wali</label>
                  <input
                    type="text"
                    value={editFormData.parentData.motherName}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, motherName: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">3. NIK Ayah/Wali</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={editFormData.parentData.fatherNik || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, fatherNik: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4. NIK Ibu/Wali</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={editFormData.parentData.motherNik || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, motherNik: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">5. Pekerjaan Ayah/Wali</label>
                  <input
                    type="text"
                    value={editFormData.parentData.fatherJob || editFormData.parentData.parentJob || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, fatherJob: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">6. Pekerjaan Ibu/Wali</label>
                  <input
                    type="text"
                    value={editFormData.parentData.motherJob || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, motherJob: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">7. No. Telp/WA Ayah/Wali</label>
                  <input
                    type="tel"
                    value={editFormData.parentData.fatherPhone || editFormData.parentData.parentPhone || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, fatherPhone: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">8. No. Telp/WA Ibu/Wali</label>
                  <input
                    type="tel"
                    value={editFormData.parentData.motherPhone || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, motherPhone: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">9. Status Tinggal Bersama</label>
                  <select
                    value={editFormData.parentData.livingWithStatus || editFormData.parentData.livingWith || 'Orang Tua'}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, livingWithStatus: e.target.value, livingWith: e.target.value as any }
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
                    value={editFormData.parentData.parentAddress || ''}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      parentData: { ...editFormData.parentData, parentAddress: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMandiri(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
