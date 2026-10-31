import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  Phone, 
  Mail, 
  BookOpen, 
  AlertCircle,
  MessageCircle,
  FileText,
  Copy,
  ExternalLink,
  Share2,
  MapPin,
  Home,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Registration, PersonalData, MajorChoice, SchoolOrigin, ParentData, AdditionalInfo, SchoolSettings, Major } from '../types';
import { MAJORS_LIST, WAVES_LIST, createRegistration, DEFAULT_SCHOOL_SETTINGS } from '../lib/supabase';
import { A4RegistrationSheet } from './A4RegistrationSheet';
import { ShareRegistrationModal } from './ShareRegistrationModal';

interface RegistrationFormProps {
  onSuccessRegistered?: (registration: Registration) => void;
  onOpenCheckStatus?: () => void;
  schoolSettings?: SchoolSettings;
  majors?: Major[];
  onOpenShareModal?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccessRegistered,
  onOpenCheckStatus,
  schoolSettings = DEFAULT_SCHOOL_SETTINGS,
  majors = MAJORS_LIST,
  onOpenShareModal,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<Registration | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedRegNum, setCopiedRegNum] = useState<boolean>(false);
  const [isShareModalLocalOpen, setIsShareModalLocalOpen] = useState<boolean>(false);
  const [showBlankA4Modal, setShowBlankA4Modal] = useState<boolean>(false);

  // Form State
  const [wave, setWave] = useState<string>('Gelombang 1 (Jalur Prestasi & Minat)');
  const [majorChoice, setMajorChoice] = useState<MajorChoice>({
    firstChoice: majors[0]?.name || MAJORS_LIST[0].name,
    secondChoice: majors[1]?.name || MAJORS_LIST[1].name,
  });

  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: '',
    kkNumber: '', // Nomor Kartu Keluarga (KK) - Terpisah
    nik: '', // Nomor NIK Calon Siswa (16 digit) - Terpisah
    nisn: '', // NISN Opsional
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '2009-05-15',
    religion: 'Islam',
    hamlet: '', // Kampung / Dusun
    rt: '', // RT
    rw: '', // RW
    village: '', // Desa / Kelurahan
    district: '', // Kecamatan
    city: 'Kabupaten Karawang',
    province: 'Jawa Barat',
    address: '',
    rtRw: '',
    phoneWhatsApp: '',
    email: '',
  });

  const [schoolOrigin, setSchoolOrigin] = useState<SchoolOrigin>({
    schoolName: '',
    graduationYear: '2026',
    averageScore: '85.5',
  });

  const [parentData, setParentData] = useState<ParentData>({
    fatherName: '', // 1. Nama Ayah/Wali
    motherName: '', // 2. Nama Ibu/Wali
    fatherNik: '', // 3. NIK Ayah/Wali
    motherNik: '', // 4. NIK Ibu/Wali
    fatherJob: 'Karyawan Swasta', // 5. Pekerjaan Ayah/Wali
    motherJob: 'Ibu Rumah Tangga', // 6. Pekerjaan Ibu/Wali
    fatherPhone: '', // 7. Nomor Telepon/WA Ayah/Wali
    motherPhone: '', // 8. Nomor Telepon/WA Ibu/Wali
    livingWithStatus: 'Orang Tua', // 9. Status Tinggal Bersama (Orang Tua / Wali)
    parentAddress: '', // 10. Alamat Orang Tua/Wali
  });

  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    uniformSize: 'L',
    transportMode: 'Sepeda Motor',
  });

  // Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage('');
    if (step === 1) {
      if (!majorChoice.firstChoice) {
        setErrorMessage('Silakan pilih Jurusan Prioritas Utama.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!personalData.fullName.trim()) {
        setErrorMessage('Nama Lengkap wajib diisi sesuai Ijazah SMP/MTs.');
        return false;
      }
      if (!personalData.kkNumber?.trim()) {
        setErrorMessage('Nomor Kartu Keluarga (KK) wajib diisi.');
        return false;
      }
      if (!personalData.nik.trim()) {
        setErrorMessage('NIK (Nomor Induk Kependudukan) wajib diisi.');
        return false;
      }
      if (!personalData.phoneWhatsApp.trim()) {
        setErrorMessage('Nomor WhatsApp aktif wajib diisi untuk koordinasi panitia.');
        return false;
      }
      if (!personalData.birthPlace.trim()) {
        setErrorMessage('Tempat lahir wajib diisi.');
        return false;
      }
      if (!personalData.address?.trim()) {
        setErrorMessage('Alamat domisili lengkap wajib diisi.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!schoolOrigin.schoolName.trim()) {
        setErrorMessage('Nama Asal Sekolah (SMP/MTs) wajib diisi.');
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (!parentData.fatherName.trim() && !parentData.motherName.trim()) {
        setErrorMessage('Silakan isi sekurang-kurangnya nama salah satu orang tua/wali.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setErrorMessage('');

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const regNum = `LB2-2026-${randomNum}`;
    const newId = `reg-${Date.now()}`;

    const newRegistration: Registration = {
      id: newId,
      registrationNumber: regNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'PENDING',
      statusNote: 'Pendaftaran online berhasil diterima. Menunggu verifikasi tim panitia SPMB.',
      wave,
      isLocked: false,
      personalData,
      majorChoice,
      schoolOrigin,
      parentData,
      additionalInfo,
      testScore: 0,
      interviewScore: 0,
      finalScore: 0,
    };

    await createRegistration(newRegistration);
    setIsSubmitting(false);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}

    setSubmittedData(newRegistration);
    if (onSuccessRegistered) {
      onSuccessRegistered(newRegistration);
    }
  };

  const handleCopyRegNum = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedRegNum(true);
    setTimeout(() => setCopiedRegNum(false), 2500);
  };

  // If already submitted, show Success Screen with MANDATORY WHATSAPP GROUP REDIRECT + A4 Sheet Preview!
  if (submittedData) {
    return (
      <div className="space-y-6">
        {/* Mandatory WhatsApp Group & Success Alert Card */}
        <div className="no-print max-w-4xl mx-auto space-y-4">
          {/* WA GROUP CALLOUT (SESUAI INSTRUKSI 5) */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-emerald-500">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase bg-white text-emerald-800 px-2.5 py-0.5 rounded-full inline-block mb-1 shadow-xs">
                  TAHAP WAJIB PENDAFTAR BARU
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-heading text-white">
                  Wajib Bergabung ke Grup WhatsApp Resmi SPMB 2026/2027
                </h3>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl leading-relaxed">
                  Semua koordinasi jadwal tes seleksi, informasi seragam, jadwal wawancara, dan pengumuman kelulusan akan diumumkan melalui grup resmi ini.
                </p>
              </div>
            </div>

            <a
              href={schoolSettings.whatsappGroupLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-xl transition-all shrink-0 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              Gabung Grup WhatsApp Sekarang
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Success Summary Banner */}
          <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 text-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                  Pendaftaran Anda Berhasil Diterima
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    No. Registrasi: <span className="font-mono text-blue-700">{submittedData.registrationNumber}</span>
                  </h3>
                  <button
                    onClick={() => handleCopyRegNum(submittedData.registrationNumber)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Salin No. Registrasi"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedRegNum && <span className="text-[10px] text-emerald-600 font-bold">Tersalin!</span>}
                </div>
                <p className="text-xs text-slate-500">
                  Simpan nomor registrasi untuk cek status, cetak ulang, atau perbaikan data mandiri.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Formulir A4
              </button>
              <button
                onClick={() => {
                  setSubmittedData(null);
                  setCurrentStep(1);
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Daftar Siswa Baru Lain
              </button>
            </div>
          </div>
        </div>

        {/* The Exact A4 Registration Sheet Component */}
        <A4RegistrationSheet registration={submittedData} showControls={false} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Header Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Formulir Pendaftaran Online {schoolSettings.academicYear}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {schoolSettings.schoolName}
            </h2>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs font-semibold text-slate-500 block">Langkah {currentStep} dari 4</span>
            <span className="text-xs font-bold text-slate-800">
              {currentStep === 1 && 'Pilihan Jurusan & Gelombang'}
              {currentStep === 2 && 'Data Pribadi & KK'}
              {currentStep === 3 && 'Asal Sekolah'}
              {currentStep === 4 && 'Data Orang Tua & Review'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, label: 'Jurusan', icon: BookOpen },
            { step: 2, label: 'Data Pribadi & KK', icon: User },
            { step: 3, label: 'Asal Sekolah', icon: GraduationCap },
            { step: 4, label: 'Orang Tua', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <div
                key={item.step}
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-white text-blue-700'
                      : isCompleted
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.step}
                </div>
                <span className="hidden md:inline truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error notification if validation fails */}
      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
        {/* STEP 1: PILIHAN JURUSAN & GELOMBANG */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Pilihan Jurusan & Gelombang Pendaftaran
              </h3>
              <p className="text-xs text-slate-500">
                Pilih program keahlian yang paling sesuai dengan bakat dan cita-cita Anda.
              </p>
            </div>

            {/* Pilihan Gelombang */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Gelombang Pendaftaran Aktif
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {WAVES_LIST.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setWave(w.name)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      wave === w.name
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{w.name.split(' (')[0]}</span>
                      {w.isActive && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          Dibuka
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{w.benefits}</p>
                    <div className="mt-2 text-xs font-bold text-blue-700">{w.fee}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pilihan Jurusan 1 & 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pilihan Ke-1 (Prioritas Utama) <span className="text-rose-600">*</span>
                </label>
                <select
                  value={majorChoice.firstChoice}
                  onChange={(e) => setMajorChoice({ ...majorChoice, firstChoice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-slate-50/50"
                  required
                >
                  {majors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Jurusan yang menjadi prioritas utama penempatan kelas dan seleksi.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pilihan Ke-2 (Alternatif / Cadangan)
                </label>
                <select
                  value={majorChoice.secondChoice}
                  onChange={(e) => setMajorChoice({ ...majorChoice, secondChoice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-slate-50/50"
                >
                  <option value="">-- Tidak Memilih Alternatif --</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Opsi alternatif bila kuota pilihan pertama telah terpenuhi.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATA PRIBADI CALON SISWA & NOMOR KK */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Data Pribadi & Kartu Keluarga
              </h3>
              <p className="text-xs text-slate-500">
                Isi identitas diri calon siswa sesuai yang tertera pada Kartu Keluarga (KK) & Akta Kelahiran.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai Ijazah SMP) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  value={personalData.fullName}
                  onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase font-semibold"
                  required
                />
              </div>

              {/* INPUT BARU: NOMOR KARTU KELUARGA (KK) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Kartu Keluarga (KK) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit Nomor Kartu Keluarga"
                  value={personalData.kkNumber || ''}
                  onChange={(e) => setPersonalData({ ...personalData, kkNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIK Calon Siswa (Di Kartu Keluarga) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit nomor NIK siswa"
                  value={personalData.nik}
                  onChange={(e) => setPersonalData({ ...personalData, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  required
                />
              </div>

              {/* NISN: DIUBAH MENJADI TIDAK WAJIB (OPSIONAL) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NISN (Nomor Induk Siswa Nasional) <span className="text-slate-400 font-normal text-[11px]">(Opsional / Tidak Wajib)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="10 digit nomor NISN (kosongkan jika belum ada)"
                  value={personalData.nisn || ''}
                  onChange={(e) => setPersonalData({ ...personalData, nisn: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                  Bagi lulusan yang belum memiliki NISN resmi dapat mengosongkan kolom ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Lahir <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Karawang"
                  value={personalData.birthPlace}
                  onChange={(e) => setPersonalData({ ...personalData, birthPlace: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={personalData.birthDate}
                  onChange={(e) => setPersonalData({ ...personalData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['Laki-laki', 'Perempuan'].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setPersonalData({ ...personalData, gender: g as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        personalData.gender === g
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agama
                </label>
                <select
                  value={personalData.religion}
                  onChange={(e) => setPersonalData({ ...personalData, religion: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. WhatsApp Aktif <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={personalData.phoneWhatsApp}
                    onChange={(e) => setPersonalData({ ...personalData, phoneWhatsApp: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Siswa
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="Contoh: nama@gmail.com"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Pemisahan Kolom Alamat Tempat Tinggal Lengkap
                  </span>
                </div>
              </div>

              {/* Pemisahan Kolom Alamat: Kampung / Dusun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kampung / Dusun <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dusun Krajan / Kp. Kaum"
                  value={personalData.hamlet || ''}
                  onChange={(e) => setPersonalData({ ...personalData, hamlet: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {/* Pemisahan Kolom: RT & RW Terpisah */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RT <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Contoh: 003"
                    value={personalData.rt || ''}
                    onChange={(e) => setPersonalData({ ...personalData, rt: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RW <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Contoh: 011"
                    value={personalData.rw || ''}
                    onChange={(e) => setPersonalData({ ...personalData, rw: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              {/* Pemisahan Kolom: Desa / Kelurahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desa / Kelurahan <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sukaluyu / Pinayungan"
                  value={personalData.village || ''}
                  onChange={(e) => setPersonalData({ ...personalData, village: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {/* Pemisahan Kolom: Kecamatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Telukjambe Timur"
                  value={personalData.district || ''}
                  onChange={(e) => setPersonalData({ ...personalData, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {/* Pemisahan Kolom: Kabupaten / Kota */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kabupaten / Kota <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kabupaten Karawang"
                  value={personalData.city || 'Kabupaten Karawang'}
                  onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {/* Pemisahan Kolom: Provinsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jawa Barat"
                  value={personalData.province || 'Jawa Barat'}
                  onChange={(e) => setPersonalData({ ...personalData, province: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {/* Jalan / Nomor Rumah / Alamat Tambahan */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jalan / Komplek / No. Rumah (Opsional / Detail)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Raya Telukjambe Blok B4 No. 12"
                  value={personalData.address || ''}
                  onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ASAL SEKOLAH */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Data Asal Sekolah (SMP / MTs)
              </h3>
              <p className="text-xs text-slate-500">
                Informasi riwayat pendidikan tingkat menengah pertama calon siswa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Asal SMP / MTs <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SMP Negeri 1 Karawang Barat"
                  value={schoolOrigin.schoolName}
                  onChange={(e) => setSchoolOrigin({ ...schoolOrigin, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Kelulusan
                </label>
                <select
                  value={schoolOrigin.graduationYear}
                  onChange={(e) => setSchoolOrigin({ ...schoolOrigin, graduationYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="2026">2026 (Lulusan Tahun Ini)</option>
                  <option value="2025">2025 (Lulusan Tahun Lalu)</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Rata-rata Rapor (Skala 0 - 100)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 87.5"
                  value={schoolOrigin.averageScore}
                  onChange={(e) => setSchoolOrigin({ ...schoolOrigin, averageScore: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PEMBAHARUAN SECTION DATA ORANG TUA / WALI & KELENGKAPAN (10 STRUKTUR KOLOM BARU) */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Data Orang Tua / Wali & Kelengkapan
                </h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  10 Kolom Standar Resmi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lengkapi identitas penanggung jawab siswa (Orang Tua / Wali) sesuai dokumen resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Nama Ayah/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Nama Ayah / Wali <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Ayah / Wali"
                  value={parentData.fatherName}
                  onChange={(e) => setParentData({ ...parentData, fatherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  required
                />
              </div>

              {/* 2. Nama Ibu/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Nama Ibu / Wali <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Ibu / Wali"
                  value={parentData.motherName}
                  onChange={(e) => setParentData({ ...parentData, motherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  required
                />
              </div>

              {/* 3. NIK Ayah/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. NIK Ayah / Wali
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit NIK Ayah/Wali"
                  value={parentData.fatherNik || ''}
                  onChange={(e) => setParentData({ ...parentData, fatherNik: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              {/* 4. NIK Ibu/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. NIK Ibu / Wali
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit NIK Ibu/Wali"
                  value={parentData.motherNik || ''}
                  onChange={(e) => setParentData({ ...parentData, motherNik: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              {/* 5. Pekerjaan Ayah/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  5. Pekerjaan Ayah / Wali
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Karyawan Swasta / Wiraswasta / PNS"
                  value={parentData.fatherJob || ''}
                  onChange={(e) => setParentData({ ...parentData, fatherJob: e.target.value, parentJob: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* 6. Pekerjaan Ibu/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6. Pekerjaan Ibu / Wali
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu Rumah Tangga / Karyawan / Pedagang"
                  value={parentData.motherJob || ''}
                  onChange={(e) => setParentData({ ...parentData, motherJob: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* 7. Nomor Telepon/WA Ayah/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  7. Nomor Telepon / WA Ayah / Wali
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567891"
                  value={parentData.fatherPhone || ''}
                  onChange={(e) => setParentData({ ...parentData, fatherPhone: e.target.value, parentPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              {/* 8. Nomor Telepon/WA Ibu/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  8. Nomor Telepon / WA Ibu / Wali
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 085712345680"
                  value={parentData.motherPhone || ''}
                  onChange={(e) => setParentData({ ...parentData, motherPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              {/* 9. Status Tinggal Bersama (Orang Tua / Wali) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  9. Status Tinggal Bersama (Orang Tua / Wali) <span className="text-rose-600">*</span>
                </label>
                <select
                  value={parentData.livingWithStatus || 'Orang Tua'}
                  onChange={(e) => setParentData({ ...parentData, livingWithStatus: e.target.value, livingWith: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  required
                >
                  <option value="Orang Tua">Tinggal Bersama Orang Tua Kandung</option>
                  <option value="Wali">Tinggal Bersama Wali / Kerabat</option>
                  <option value="Asrama">Tinggal di Asrama / Pesantren</option>
                  <option value="Sendiri / Kost">Tinggal Sendiri / Kost</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* 10. Alamat Orang Tua/Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  10. Alamat Orang Tua / Wali
                </label>
                <input
                  type="text"
                  placeholder="Alamat lengkap orang tua/wali (atau tulis 'Sama dengan siswa')"
                  value={parentData.parentAddress || ''}
                  onChange={(e) => setParentData({ ...parentData, parentAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Kelengkapan Seragam & Transportasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ukuran Jas & Seragam Praktik
                </label>
                <div className="grid grid-cols-5 gap-2 mt-1">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => setAdditionalInfo({ ...additionalInfo, uniformSize: sz as any })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        additionalInfo?.uniformSize === sz
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rencana Transportasi ke Sekolah
                </label>
                <select
                  value={additionalInfo?.transportMode}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, transportMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Sepeda Motor">Sepeda Motor Sendiri / Bonceng</option>
                  <option value="Angkutan Umum">Angkutan Umum / Elf</option>
                  <option value="Jalan Kaki">Jalan Kaki</option>
                  <option value="Antar Jemput">Antar Jemput Orang Tua</option>
                </select>
              </div>
            </div>

            {/* Pernyataan Hukum */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  defaultChecked
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  Saya menyatakan bahwa seluruh data (termasuk No. KK & NIK) adalah sah dan benar. Setelah mendaftar, saya siap bergabung ke Grup WhatsApp Resmi SPMB untuk koordinasi tahapan seleksi.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Lanjutkan
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Kirim Pendaftaran & Masuk Grup WA'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
