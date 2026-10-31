import React, { useState } from 'react';
import { 
  GraduationCap, 
  Menu, 
  X, 
  FileText, 
  Search, 
  LayoutDashboard, 
  Database, 
  Sparkles,
  PhoneCall,
  Lock,
  LogOut,
  Users,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Share2,
  Printer
} from 'lucide-react';
import { AdminUser, SchoolSettings } from '../types';
import { DEFAULT_OFFICIAL_LOGO } from '../lib/supabase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRealtimeConnected: boolean;
  onOpenSupabaseModal: () => void;
  currentUser: AdminUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  schoolSettings: SchoolSettings;
  onlineCount?: number;
  onOpenShareModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isRealtimeConnected,
  onOpenSupabaseModal,
  currentUser,
  onOpenLoginModal,
  onLogout,
  schoolSettings,
  onlineCount = 3,
  onOpenShareModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'formulir', label: 'Formulir Pendaftaran', highlight: true },
    { id: 'cek-status', label: 'Cek Status & Cetak A4' },
    { id: 'blanko-a4', label: 'Blanko Formulir A4' },
    { id: 'jurusan', label: 'Program Keahlian' },
    { id: 'pengumuman', label: 'Pengumuman' },
    { 
      id: 'admin', 
      label: currentUser ? (currentUser.role === 'SUPER_ADMIN' ? 'Dashboard Admin' : 'Portal Operator') : 'Portal Panitia',
      icon: Lock 
    },
  ];

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'admin' && !currentUser) {
      onOpenLoginModal();
      setMobileMenuOpen(false);
      return;
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      {/* Tri-Color Indonesian School Ribbon (Biru, Merah, Kuning) */}
      <div className="h-1 bg-gradient-to-r from-blue-700 via-rose-600 to-amber-400 w-full" />

      {/* Ticker / Announcement Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white text-[11px] py-1.5 px-4 font-medium flex items-center justify-between border-b border-blue-900/50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black px-2 py-0.5 rounded text-[9.5px] uppercase tracking-wider shadow-2xs">
              GELOMBANG 1 DIBUKA
            </span>
            <span className="truncate text-slate-200">
              {schoolSettings.announcementTicker || 'Penerimaan Murid Baru TP 2026/2027 • Diskon Biaya Seragam 50% untuk 100 Pendaftar Pertama!'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Live Multi-User Counter Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-User Live ({onlineCount} Aktif)</span>
            </div>

            {/* Quick Share Link in Topbar */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-colors cursor-pointer border border-amber-400/30"
                title="Bagikan Tautan Pendaftaran Online SPMB"
              >
                <Share2 className="w-3 h-3 text-amber-300" />
                <span>Bagikan Link</span>
              </button>
            )}

            {/* If admin is logged in, show quick Admin access */}
            {currentUser && onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer border border-rose-400/30"
                title="Panel Pengaturan Database Admin"
              >
                <Database className="w-3 h-3 text-rose-300" />
                <span>DB Admin</span>
              </button>
            )}

            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1 text-[10.5px] text-amber-300">
              <PhoneCall className="w-3 h-3" />
              Hotline: {schoolSettings.phone.split('/')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand with Crest Logo */}
        <div
          onClick={() => handleSelectTab('beranda')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative">
            <img
              src={schoolSettings.logoUrl || DEFAULT_OFFICIAL_LOGO}
              alt="Logo Sekolah"
              className="w-11 h-11 rounded-xl object-contain bg-white p-0.5 border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== DEFAULT_OFFICIAL_LOGO) {
                  target.src = DEFAULT_OFFICIAL_LOGO;
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                {schoolSettings.schoolName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-2xs">
                SPMB
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide flex items-center gap-1.5">
              <span>Penerimaan Murid Baru Online</span>
              <span className="text-rose-500 font-bold">&bull;</span>
              <span className="text-blue-700 font-bold">TP {schoolSettings.academicYear}</span>
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : item.highlight
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Button Right / User Login State */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Tombol Bagikan Pendaftaran Online */}
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer border border-amber-300"
              title="Bagikan Link Pendaftaran Online"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Bagikan Link</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                  {currentUser.name.split(' (')[0]}
                </span>
                <span className="text-[9.5px] font-semibold text-blue-700">
                  {currentUser.role === 'SUPER_ADMIN' ? 'Admin Utama' : 'Admin Bayangan'}
                </span>
              </div>

              <button
                onClick={() => handleSelectTab('admin')}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                title="Buka Dashboard"
              >
                {currentUser.name.charAt(0)}
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Keluar Sesi"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Login Admin
            </button>
          )}

          <button
            onClick={() => handleSelectTab('formulir')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Daftar Sekarang
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {!currentUser ? (
            <button
              onClick={onOpenLoginModal}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold"
              title="Login Admin"
            >
              <Lock className="w-4 h-4 text-slate-600" />
            </button>
          ) : (
            <button
              onClick={() => handleSelectTab('admin')}
              className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              {currentUser.name.charAt(0)}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-1.5 shadow-lg animate-in slide-in-from-top duration-200">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}

          {onOpenShareModal && (
            <button
              onClick={() => {
                onOpenShareModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3.5 text-xs font-bold text-center bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>Bagikan Pendaftaran Online</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            {!currentUser ? (
              <button
                onClick={() => {
                  onOpenLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
              >
                Login Admin
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-center bg-rose-50 text-rose-700 rounded-xl"
              >
                Keluar ({currentUser.username})
              </button>
            )}

            <button
              onClick={() => handleSelectTab('formulir')}
              className="flex-1 py-2 text-xs font-bold text-center bg-blue-600 text-white rounded-xl"
            >
              Daftar Online
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
