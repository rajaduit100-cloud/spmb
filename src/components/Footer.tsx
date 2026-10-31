import React from 'react';
import { GraduationCap, MapPin, Phone, Mail, Globe, Database, ShieldCheck } from 'lucide-react';
import { DEFAULT_SCHOOL_SETTINGS, DEFAULT_OFFICIAL_LOGO } from '../lib/supabase';

interface FooterProps {
  onOpenSupabaseModal: () => void;
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSupabaseModal, onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 no-print mt-12 relative">
      {/* Top Tricolor Ribbon (Biru, Merah, Kuning) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-rose-600 to-amber-400 absolute top-0 left-0 right-0" />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: School Identity with Official Crest Logo */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-3 text-white">
              <img
                src={DEFAULT_OFFICIAL_LOGO}
                alt="Logo SMK Lentera Bangsa 2"
                className="w-11 h-11 rounded-xl object-contain bg-white p-0.5 border-2 border-amber-400 shadow-md"
              />
              <div>
                <span className="font-heading font-black text-base text-white tracking-tight block">
                  SMK LENTERA BANGSA 2
                </span>
                <span className="text-[10px] text-amber-300 font-bold block">
                  Unggul &bull; Berkarakter &bull; Siap Kerja
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Mencetak generasi unggul, berkarakter, mandiri, dan berdaya saing global melalui pendidikan vokasi terstandar industri teknologi terdepan.
            </p>
            <div className="pt-2">
              <span className="inline-block bg-slate-800 text-amber-300 px-2.5 py-1 rounded text-[10px] font-bold border border-slate-700">
                {DEFAULT_SCHOOL_SETTINGS.accreditation}
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Layanan Pendaftaran
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('formulir')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Formulir Pendaftaran Online
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cek-status')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Cek Status & Cetak Lembar A4
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('jurusan')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Daftar Program Keahlian
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pengumuman')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Jadwal & Pengumuman Seleksi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Portal Panitia SPMB
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Sekretariat & Kontak */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Sekretariat SPMB LB2
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{DEFAULT_SCHOOL_SETTINGS.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{DEFAULT_SCHOOL_SETTINGS.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{DEFAULT_SCHOOL_SETTINGS.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{DEFAULT_SCHOOL_SETTINGS.website}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Informasi & Jam Layanan SPMB */}
          <div className="space-y-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                Jam Layanan Sekretariat
              </h4>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                BUKA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Pelayanan pendaftaran langsung, konsultasi peminatan jurusan, dan verifikasi berkas fisik dilayani di Ruang Panitia SPMB:
            </p>
            <div className="space-y-1 text-[10.5px] text-slate-300 border-t border-slate-700/60 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Senin - Jumat</span>
                <strong className="text-white">08:00 - 15:30 WIB</strong>
              </div>
              <div className="flex justify-between">
                <span>Sabtu</span>
                <strong className="text-white">08:00 - 13:00 WIB</strong>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Minggu & Tgl Merah</span>
                <strong>Libur (Online 24 Jam)</strong>
              </div>
            </div>
            <div className="pt-1">
              <button
                onClick={() => onNavigate('formulir')}
                className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
              >
                Daftar Online Sekarang
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>&copy; 2026 Panitia SPMB SMK Lentera Bangsa 2. Hak Cipta Dilindungi Undang-Undang.</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Sistem Penerimaan Murid Baru Online &bull; Terakreditasi Unggul
          </div>
        </div>
      </div>
    </footer>
  );
};
