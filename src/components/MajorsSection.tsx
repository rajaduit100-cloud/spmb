import React from 'react';
import { 
  Code2, 
  Network, 
  Wrench, 
  Palette, 
  Briefcase, 
  Coins, 
  Users, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { MAJORS_LIST } from '../lib/supabase';
import { Major } from '../types';

interface MajorsSectionProps {
  majors?: Major[];
  onSelectMajorToRegister?: (majorName: string) => void;
}

export const MajorsSection: React.FC<MajorsSectionProps> = ({ 
  majors = MAJORS_LIST, 
  onSelectMajorToRegister 
}) => {
  const getMajorIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-6 h-6" />;
      case 'Network':
        return <Network className="w-6 h-6" />;
      case 'Wrench':
        return <Wrench className="w-6 h-6" />;
      case 'Palette':
        return <Palette className="w-6 h-6" />;
      case 'Briefcase':
        return <Briefcase className="w-6 h-6" />;
      case 'Coins':
        return <Coins className="w-6 h-6" />;
      default:
        return <Code2 className="w-6 h-6" />;
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-2">
          Kompetensi Keahlian Unggulan
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
          {majors.length} Program Keahlian Siap Kerja & Wirausaha
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          Kurikulum berbasis industri, sertifikasi BNSP berstandar nasional, dan kerjasama penyaluran magang/kerja ke lebih dari 50+ perusahaan terkemuka.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {majors.map((m) => {
          const filledPercentage = Math.round((m.filledCount / m.quota) * 100);
          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-blue-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center shadow-xs`}>
                    {getMajorIcon(m.icon)}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    {m.code}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {m.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {m.fullDesc}
                </p>

                {/* Quota Progress */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Sisa Kuota Penerimaan</span>
                    <span className="font-bold text-slate-800">
                      {m.filledCount} / {m.quota} Siswa
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.color || 'from-blue-600 to-indigo-600'}`}
                      style={{ width: `${Math.min(filledPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3">
                <button
                  onClick={() => onSelectMajorToRegister && onSelectMajorToRegister(m.name)}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 group-hover:border-blue-600"
                >
                  Pilih Jurusan Ini
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
