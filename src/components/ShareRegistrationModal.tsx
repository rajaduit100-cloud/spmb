import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Send, 
  Download, 
  ExternalLink,
  QrCode,
  Globe,
  Sparkles
} from 'lucide-react';
import { SchoolSettings } from '../types';

interface ShareRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolSettings: SchoolSettings;
}

export const ShareRegistrationModal: React.FC<ShareRegistrationModalProps> = ({
  isOpen,
  onClose,
  schoolSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Generate public registration URL
  const getRegistrationUrl = () => {
    if (typeof window === 'undefined') return 'https://smklenterabangsa2.sch.id';
    const baseUrl = window.location.origin + window.location.pathname;
    return baseUrl;
  };

  const shareUrl = getRegistrationUrl();
  const shareTitle = `Pendaftaran Murid Baru ${schoolSettings.schoolName} TP ${schoolSettings.academicYear}`;
  const shareText = `Halo! Pendaftaran Murid Baru (SPMB) ${schoolSettings.schoolName} Tahun Ajaran ${schoolSettings.academicYear} telah resmi dibuka secara online. Daftar sekarang melalui link resmi berikut:\n\n${shareUrl}\n\n${schoolSettings.announcementTicker || 'Dapatkan subsidi seragam 50% untuk pendaftar awal!'}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.warn('QR Code share error:', err));

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        setCanNativeShare(true);
      }
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        console.warn('Share cancelled or failed', e);
      }
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Pendaftaran_SPMB_${schoolSettings.schoolName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading">
                Bagikan Pendaftaran Online
              </h3>
              <p className="text-xs text-blue-100">
                {schoolSettings.schoolName} &bull; TP {schoolSettings.academicYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Link Box with Copy Button */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Tautan Formulir Pendaftaran Online
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-2xl">
              <div className="pl-2 text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs font-mono font-semibold text-slate-800 focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Link
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] font-bold text-emerald-600 mt-1.5 animate-in fade-in">
                ✓ Link pendaftaran berhasil disalin ke clipboard! Siap dibagikan ke calon siswa & orang tua.
              </p>
            )}
          </div>

          {/* Quick Share Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Bagikan Cepat ke Media Sosial & Kontak
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all text-center gap-1.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all text-center gap-1.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 ml-0.5" />
                </div>
                <span className="text-xs font-bold">Telegram</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-all text-center gap-1.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform font-bold text-base">
                  f
                </div>
                <span className="text-xs font-bold">Facebook</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 transition-all text-center gap-1.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform font-bold text-sm">
                  𝕏
                </div>
                <span className="text-xs font-bold">Twitter / X</span>
              </a>
            </div>

            {/* Native Mobile Share Button */}
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Bagikan Melalui Menu Perangkat (Semua Aplikasi)
              </button>
            )}
          </div>

          {/* QR Code Section for Flyers, Banners & Display */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 bg-white border border-slate-300 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Pendaftaran SPMB" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">QR Code Pendaftaran Resmi</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pindai menggunakan kamera HP calon siswa untuk langsung membuka formulir pendaftaran.
                </p>
              </div>
              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-300" />
                Unduh Gambar QR (PNG)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
