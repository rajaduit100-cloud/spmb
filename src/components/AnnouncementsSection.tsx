import React from 'react';
import { Calendar, Bell, ChevronRight, Pin } from 'lucide-react';
import { ANNOUNCEMENTS_LIST } from '../lib/supabase';
import { Announcement } from '../types';

interface AnnouncementsSectionProps {
  announcements?: Announcement[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({
  announcements = ANNOUNCEMENTS_LIST,
}) => {
  return (
    <div className="py-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Papan Informasi Resmi
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Pengumuman & Agenda SPMB 2026/2027
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Dikelola langsung oleh Panitia Penerimaan Siswa Baru
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            {ann.imageUrl && (
              <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                <img
                  src={ann.imageUrl}
                  alt={ann.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {ann.isPinned && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow-xs">
                    <Pin className="w-3 h-3 fill-slate-950" />
                    PENTING / UTAMA
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  {ann.category}
                </span>
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-2 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ann.publishedDate}</span>
                  <span>&bull;</span>
                  <span>Oleh: {ann.author}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {ann.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
