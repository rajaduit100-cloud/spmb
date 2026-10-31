/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Search, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Database, 
  Radio, 
  Award,
  Calendar,
  FileText,
  PhoneCall,
  Lock,
  Zap,
  Activity
} from 'lucide-react';
import { 
  Registration, 
  AdminUser, 
  SchoolSettings, 
  Major, 
  Wave, 
  Announcement, 
  SiteLayoutSettings,
  RegistrationStepItem
} from './types';
import { 
  fetchRegistrations, 
  subscribeToRealtimeSync, 
  testSupabaseConnection,
  getAdminSession,
  saveAdminSession,
  fetchSchoolSettings,
  getLocalSchoolSettings,
  getLocalSiteLayout,
  getLocalMajors,
  getLocalWaves,
  getLocalAnnouncements,
  getLocalSteps,
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_OFFICIAL_LOGO
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RegistrationForm } from './components/RegistrationForm';
import { CheckStatus } from './components/CheckStatus';
import { AdminDashboard } from './components/AdminDashboard';
import { MajorsSection } from './components/MajorsSection';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ShareRegistrationModal } from './components/ShareRegistrationModal';
import { A4RegistrationSheet } from './components/A4RegistrationSheet';
import { Share2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('beranda');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => getAdminSession());

  // Dynamic Site Settings (Multi-user editable by Super Admin)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => getLocalSchoolSettings());
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettings>(() => getLocalSiteLayout());
  const [majorsList, setMajorsList] = useState<Major[]>(() => getLocalMajors());
  const [wavesList, setWavesList] = useState<Wave[]>(() => getLocalWaves());
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(() => getLocalAnnouncements());
  const [stepsList, setStepsList] = useState<RegistrationStepItem[]>(() => getLocalSteps());

  // Multi-User Presence & Realtime Sync Indicator
  const [onlineCount, setOnlineCount] = useState<number>(3);
  const [syncToastMsg, setSyncToastMsg] = useState<string>('');

  const showSyncToast = (msg: string) => {
    setSyncToastMsg(msg);
    setTimeout(() => setSyncToastMsg(''), 3500);
  };

  const getMediaEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  const getStepIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileText': return FileText;
      case 'Printer': return Printer;
      case 'Award': return Award;
      case 'CheckCircle2': return CheckCircle2;
      case 'Users': return Users;
      case 'BookOpen': return BookOpen;
      case 'GraduationCap': return GraduationCap;
      default: return CheckCircle2;
    }
  };

  // Load all registrations and configuration
  const loadAllData = async (silent = false) => {
    try {
      const { data } = await fetchRegistrations();
      setRegistrations(data);

      const settings = await fetchSchoolSettings();
      setSchoolSettings(settings);

      setMajorsList(getLocalMajors());
      setWavesList(getLocalWaves());
      setAnnouncementsList(getLocalAnnouncements());
      setStepsList(getLocalSteps());
      setLayoutSettings(getLocalSiteLayout());

      if (silent) {
        showSyncToast('⚡ Sinkronisasi Real-Time: Data terbaru otomatis disinkronkan!');
      }
      setIsLoading(false);
    } catch (e) {
      console.warn('Load error:', e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Check table connection
    testSupabaseConnection().then((res) => {
      setIsRealtimeConnected(res.connected);
    });

    // Setup Multi-User Realtime Synchronization (Supabase + Local BroadcastBus)
    const unsubscribe = subscribeToRealtimeSync((eventInfo) => {
      console.log('⚡ Realtime event received:', eventInfo?.type);
      loadAllData(true);
    });

    // Simulate multi-user presence jitter for natural counter (2 to 5 online users)
    const presenceTimer = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(2, Math.min(6, prev + delta));
      });
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(presenceTimer);
    };
  }, []);

  const handleSuccessLogin = (user: AdminUser) => {
    setCurrentUser(user);
    saveAdminSession(user);
    setActiveTab('admin');
    showSyncToast(`Selamat datang, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveAdminSession(null);
    setActiveTab('beranda');
    showSyncToast('Anda telah keluar dari sesi.');
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-amber-400 selection:text-slate-900"
      style={{
        backgroundImage: schoolSettings.bgPatternUrl
          ? `linear-gradient(to bottom, rgba(248, 250, 252, 0.86), rgba(241, 245, 249, 0.92)), url(${schoolSettings.bgPatternUrl})`
          : `radial-gradient(circle at 10% 15%, rgba(37, 99, 235, 0.08) 0%, transparent 40%),
             radial-gradient(circle at 90% 20%, rgba(225, 29, 72, 0.07) 0%, transparent 35%),
             radial-gradient(circle at 50% 85%, rgba(245, 158, 11, 0.08) 0%, transparent 45%),
             linear-gradient(to bottom, #f8fafc, #f1f5f9)`,
        backgroundSize: schoolSettings.bgPatternUrl ? 'cover' : '100% 100%',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      {/* Live Realtime Toast Notification */}
      {syncToastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
              MULTI-USER SYNC
            </span>
            <span className="text-xs font-semibold text-slate-100">{syncToastMsg}</span>
          </div>
        </div>
      )}

      {/* Navbar with Realtime status & Login Profile */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRealtimeConnected={isRealtimeConnected}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        schoolSettings={schoolSettings}
        onlineCount={onlineCount}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* TAB 1: BERANDA / HOME */}
        {activeTab === 'beranda' && (
          <div className="space-y-12">
            {/* HERO BANNER WITH PROMOTIONAL MEDIA SUPPORT & TRICOLOR ACCENTS */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-blue-800/40">
              {/* Top Tricolor Bar (Biru, Merah, Kuning) */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-rose-600 to-amber-400 shadow-sm" />

              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/3 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className={`relative z-10 grid grid-cols-1 ${schoolSettings.promoMediaUrl ? 'lg:grid-cols-12 gap-8 items-center' : 'max-w-3xl'}`}>
                <div className={schoolSettings.promoMediaUrl ? 'lg:col-span-7 space-y-5' : 'space-y-5'}>
                  {/* Tricolor Tag Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-600/30 text-blue-200 border border-blue-400/40 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Unggul
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600/30 text-rose-200 border border-rose-400/40 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Berkarakter
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Berprestasi
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{layoutSettings.heroBadgeText}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                      <span className="text-emerald-300">Live Sync</span>
                    </div>
                  </div>

                  {/* Logo Sekolah & Nama */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={schoolSettings.logoUrl || DEFAULT_OFFICIAL_LOGO}
                        alt="Logo Sekolah"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white p-1.5 border-2 border-amber-400 shadow-xl shadow-blue-950/50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== DEFAULT_OFFICIAL_LOGO) {
                            target.src = DEFAULT_OFFICIAL_LOGO;
                          }
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Server Supabase Aktif">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                        {schoolSettings.schoolName}
                      </h1>
                      <p className="text-xs sm:text-sm text-amber-300 font-bold uppercase tracking-wider mt-0.5">
                        Tahun Ajaran {schoolSettings.academicYear}
                      </p>
                    </div>
                  </div>

                  <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                    {schoolSettings.schoolTagline}. Sekolah Vokasi Unggulan Terakreditasi "{schoolSettings.accreditation.includes('A') ? 'A' : 'Unggul'}" dengan {majorsList.length} Program Keahlian Siap Kerja, Magang Industri, dan Kuliah.
                  </p>

                  {/* Call to Actions: Formulir, Cek Status, Blanko A4, & Bagikan Link */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setActiveTab('formulir')}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all cursor-pointer transform hover:-translate-y-0.5 border border-blue-400/30"
                    >
                      <FileText className="w-4 h-4 text-blue-200" />
                      Isi Formulir Pendaftaran Online
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTab('cek-status')}
                      className="inline-flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-xs sm:text-sm font-bold border border-rose-500/40 shadow-md shadow-rose-900/30 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300" />
                      Cek Status & Cetak Lembar A4
                    </button>

                    <button
                      onClick={() => setActiveTab('blanko-a4')}
                      className="inline-flex items-center gap-2 px-4 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs sm:text-sm font-bold border border-white/20 transition-all cursor-pointer"
                      title="Cetak Formulir Kosong A4 Standar Presisi 1 cm"
                    >
                      <FileText className="w-4 h-4 text-amber-300" />
                      Blanko Formulir Kosong (A4)
                    </button>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 transition-all cursor-pointer"
                      title="Bagikan Tautan Pendaftaran Online ke WhatsApp / Media Sosial"
                    >
                      <Share2 className="w-4 h-4" />
                      Bagikan Pendaftaran
                    </button>
                  </div>

                  {/* Highlights Feature Badges (Biru, Merah, Kuning, Hijau) */}
                  <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-white/10">
                    <div className="p-2.5 rounded-xl bg-white/5 border-t-2 border-blue-400">
                      <span className="text-blue-300 block text-[10px] uppercase font-bold">Akreditasi</span>
                      <strong className="text-white text-sm font-heading">{schoolSettings.accreditation}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border-t-2 border-rose-400">
                      <span className="text-rose-300 block text-[10px] uppercase font-bold">Total Kuota</span>
                      <strong className="text-white text-sm font-heading">
                        {majorsList.reduce((acc, curr) => acc + curr.quota, 0)} Siswa Baru
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border-t-2 border-amber-400">
                      <span className="text-amber-300 block text-[10px] uppercase font-bold">Jalur Masuk</span>
                      <strong className="text-white text-sm font-heading">Prestasi & Reguler</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border-t-2 border-emerald-400">
                      <span className="text-emerald-300 block text-[10px] uppercase font-bold">Sinkronisasi</span>
                      <strong className="text-emerald-400 text-sm font-heading flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        Multi-Guest Realtime
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Promotional Media Card */}
                {schoolSettings.promoMediaUrl && (
                  <div className="lg:col-span-5 flex flex-col items-center justify-center">
                    <div className="w-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40 backdrop-blur-xs relative group">
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-md shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Media Promosi SPMB
                      </div>
                      {schoolSettings.promoMediaType === 'video' ? (
                        <div className="relative aspect-video w-full">
                          <iframe
                            src={getMediaEmbedUrl(schoolSettings.promoMediaUrl)}
                            title="Video Promosi SPMB"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-video w-full overflow-hidden">
                          <img
                            src={schoolSettings.promoMediaUrl}
                            alt="Banner Promosi SPMB"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-blue-200/80 mt-2 text-center">
                      Jelajahi keunggulan & fasilitas {schoolSettings.schoolName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* JADWAL GELOMBANG AKTIF */}
            {layoutSettings.showWavesSection && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                      Jadwal & Kuota Penerimaan
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 font-heading">
                      Gelombang Pendaftaran {schoolSettings.academicYear}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500">
                    Daftar lebih awal untuk mengamankan kuota jurusan pilihan pertama.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {wavesList.map((w) => (
                    <div
                      key={w.id}
                      className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                        w.isActive
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 bg-slate-50/50 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900">{w.name}</span>
                          {w.isActive ? (
                            <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                              Sedang Dibuka
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                              Segera Dibuka
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mb-3 font-mono">
                          Periode: {w.startDate} s/d {w.endDate}
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mb-3 leading-relaxed">
                          <strong className="block text-blue-900 font-bold mb-1">Benefit Khusus:</strong>
                          {w.benefits}
                        </div>

                        <div className="text-xs font-bold text-slate-900">
                          Biaya Registrasi: <span className="text-blue-700">{w.fee}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => setActiveTab('formulir')}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            w.isActive
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {w.isActive ? 'Daftar di Gelombang Ini' : 'Lihat Informasi'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALUR PENDAFTARAN STEP-BY-STEP */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-2">
                  Tahapan Praktis & Cepat
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-heading">
                  4 Langkah Pendaftaran Murid Baru
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Proses pendaftaran dirancang mudah, paperless, dan dapat dilakukan dari rumah melalui HP atau laptop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stepsList.map((item) => {
                  const Icon = getStepIcon(item.icon);
                  return (
                    <div
                      key={item.id || item.step}
                      className="bg-slate-50 rounded-2xl p-5 border border-slate-200 relative overflow-hidden group hover:bg-blue-50/50 hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl font-black text-slate-300 group-hover:text-blue-300 transition-colors font-heading block">
                            {item.step}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEKSI JURUSAN & PROGRAM KEAHLIAN */}
            {layoutSettings.showMajorsSection && (
              <MajorsSection 
                majors={majorsList}
                onSelectMajorToRegister={() => setActiveTab('formulir')} 
              />
            )}

            {/* SEKSI PENGUMUMAN */}
            {layoutSettings.showAnnouncements && (
              <AnnouncementsSection announcements={announcementsList} />
            )}
          </div>
        )}

        {/* TAB 2: FORMULIR PENDAFTARAN */}
        {activeTab === 'formulir' && (
          <RegistrationForm
            schoolSettings={schoolSettings}
            majors={majorsList}
            onSuccessRegistered={(newReg) => {
              setRegistrations([newReg, ...registrations]);
            }}
            onOpenCheckStatus={() => setActiveTab('cek-status')}
          />
        )}

        {/* TAB 3: CEK STATUS & CETAK A4 */}
        {activeTab === 'cek-status' && (
          <CheckStatus
            registrations={registrations}
            schoolSettings={schoolSettings}
            onRefreshRegistrations={loadAllData}
            onBackToHome={() => setActiveTab('beranda')}
          />
        )}

        {/* TAB 4: BLANKO FORMULIR PENDAFTARAN KOSONG (A4) */}
        {activeTab === 'blanko-a4' && (
          <A4RegistrationSheet
            defaultBlank={true}
            onBack={() => setActiveTab('beranda')}
          />
        )}

        {/* TAB 5: JURUSAN LENGKAP */}
        {activeTab === 'jurusan' && (
          <div className="space-y-6">
            <MajorsSection 
              majors={majorsList}
              onSelectMajorToRegister={() => setActiveTab('formulir')} 
            />
          </div>
        )}

        {/* TAB 6: PENGUMUMAN */}
        {activeTab === 'pengumuman' && (
          <div className="space-y-6">
            <AnnouncementsSection announcements={announcementsList} />
          </div>
        )}

        {/* TAB 7: DASHBOARD ADMIN / PANITIA */}
        {activeTab === 'admin' && (
          currentUser ? (
            <AdminDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              registrations={registrations}
              onRefresh={loadAllData}
              isRealtimeConnected={isRealtimeConnected}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              settings={schoolSettings}
              layoutSettings={layoutSettings}
              majors={majorsList}
              waves={wavesList}
              announcements={announcementsList}
            />
          ) : (
            <div className="max-w-md mx-auto py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Otorisasi Panitia Diperlukan
              </h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Silakan masuk menggunakan akun <strong>Admin Utama</strong> (kredensial default: <code>admin</code> / <code>123lb2</code>) atau <strong>Admin Bayangan (Operator)</strong> untuk mengelola data pendaftar.
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Buka Menu Login Admin
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Share Registration Online Modal */}
      <ShareRegistrationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        schoolSettings={schoolSettings}
      />

      {/* Dedicated Supabase Connection & Schema Setup Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Admin Login Modal (Super Admin & Shadow Admin) */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccessLogin={handleSuccessLogin}
      />
    </div>
  );
}
