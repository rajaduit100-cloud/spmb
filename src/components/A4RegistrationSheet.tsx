import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Registration } from '../types';
import { Printer, ArrowLeft, Download, Info } from 'lucide-react';

interface A4RegistrationSheetProps {
  registration?: Registration | null;
  onBack?: () => void;
  showControls?: boolean;
  defaultBlank?: boolean;
}

export const A4RegistrationSheet: React.FC<A4RegistrationSheetProps> = ({
  registration,
  onBack,
  showControls = true,
  defaultBlank = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isBlank, setIsBlank] = useState<boolean>(defaultBlank || !registration);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const formatDateIndonesia = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const dynamicCreatedDate = formatDateIndonesia(registration?.createdAt);
  const dynamicCityDate = `Karawang, ${dynamicCreatedDate}`;

  // Generate Automatic QR Code for Verification
  useEffect(() => {
    const textToEncode = isBlank
      ? `LEMBAR BLANKO RESMI SPMB 2026/2027\nSMK LENTERA BANGSA 2 KARAWANG\nDokumen Arsip Fisik Pendaftaran Siswa Baru\nTanggal Cetak: ${dynamicCreatedDate}`
      : `DOKUMEN TERVERIFIKASI RESMI SPMB 2026/2027\nSMK LENTERA BANGSA 2 KARAWANG\nNo. Registrasi: ${registration?.registrationNumber || '-'}\nNama: ${registration?.personalData?.fullName || '-'}\nNIK: ${registration?.personalData?.nik || '-'}\nNo. KK: ${registration?.personalData?.kkNumber || '-'}\nJurusan: ${registration?.majorChoice?.firstChoice || '-'}\nStatus: ${registration?.status || 'TERDAFTAR'}\nTanggal: ${dynamicCreatedDate}\nSistem Validasi Panitia SPMB`;

    QRCode.toDataURL(textToEncode, {
      width: 85,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [isBlank, registration, dynamicCreatedDate]);

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Direct print failed, using download fallback:', err);
      handleDownloadHtmlPrint();
    }
  };

  // Self-Printing HTML / PDF Download Fallback
  const handleDownloadHtmlPrint = () => {
    if (!printRef.current) return;
    const sheetContent = printRef.current.outerHTML;
    const htmlDocument = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${isBlank ? 'Blanko_Formulir_SPMB_LB2_2026' : `Formulir_SPMB_${registration?.registrationNumber || '2026'}`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print { display: none !important; }
      .a4-sheet-container {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 10mm !important;
        border: none !important;
        box-shadow: none !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
    }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
  </style>
</head>
<body className="flex justify-center p-4">
  ${sheetContent}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isBlank
      ? 'Blanko_Formulir_SPMB_LB2_2026.html'
      : `Formulir_SPMB_${registration?.registrationNumber || 'Pendaftar'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const personalData = registration?.personalData;
  const majorChoice = registration?.majorChoice;
  const schoolOrigin = registration?.schoolOrigin;
  const parentData = registration?.parentData;

  const renderDigitBoxes = (count: number, filledValue?: string) => {
    const chars = filledValue ? filledValue.split('') : [];
    return (
      <div className="inline-flex gap-[1.5px] items-center">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="w-3.5 h-4 border border-slate-700 bg-white inline-flex items-center justify-center font-mono text-[9px] font-bold text-slate-900 rounded-[1px]"
          >
            {chars[i] || ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-100 min-h-screen">
      {/* Dynamic CSS Print Injection */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .a4-sheet-container {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Screen Controls Header */}
      {showControls && (
        <div className="no-print w-full max-w-[210mm] mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              )}
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isBlank ? 'Blanko Formulir Pendaftaran Kosong (A4)' : 'Formulir Pendaftaran Terisi (A4)'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Presisi Ukuran Kertas A4 (210mm x 297mm), Fit 1 Halaman Tanpa Overflow.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                <button
                  onClick={() => setIsBlank(false)}
                  disabled={!registration}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !isBlank
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${!registration ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Data Terisi
                </button>
                <button
                  onClick={() => setIsBlank(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isBlank
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Blanko Kosong
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer hover:shadow"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>

              <button
                onClick={handleDownloadHtmlPrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                Unduh File Cetak
              </button>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Petunjuk Cetak Presisi:</strong> Pada dialog pratinjau browser, set <em>Kertas: A4</em>, <em>Margin: None / Minimal</em>, dan centang <em>'Background Graphics'</em>.
            </span>
          </div>
        </div>
      )}

      {/* 
        A4 CONTAINER (Strict 210mm x 297mm)
      */}
      <div
        ref={printRef}
        className="a4-sheet-container bg-white text-slate-950 shadow-2xl border border-slate-300 w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm] box-border text-[9px] leading-tight font-sans mx-auto overflow-hidden flex flex-col justify-between"
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        <div>
          {/* Header Accent Line */}
          <div className="h-1 bg-gradient-to-r from-blue-700 via-rose-600 to-amber-400 w-full mb-2" />

          {/* HEADER FORMULIR */}
          <div className="border-b-2 border-slate-950 pb-2 flex flex-row items-center justify-between gap-2">
            <div className="text-left flex-1">
              <span className="text-[8px] tracking-wider font-extrabold uppercase text-slate-600 block">
                SISTEM PENERIMAAN MURID BARU (SPMB)
              </span>
              <h1 className="text-sm font-black uppercase tracking-tight text-slate-950">
                {isBlank ? 'BLANKO FORMULIR PENDAFTARAN PESERTA DIDIK BARU' : 'FORMULIR PENDAFTARAN PESERTA DIDIK BARU'}
              </h1>
              <p className="text-[10px] font-bold text-blue-900 mt-0.5">
                SMK LENTERA BANGSA 2 &bull; TAHUN AJARAN 2026/2027
              </p>
            </div>

            <div className="text-right border-l-2 border-slate-300 pl-3 shrink-0">
              <div className="text-[8px] font-medium text-slate-500">Tanggal Cetak:</div>
              <div className="text-[9.5px] font-bold text-slate-950">{dynamicCreatedDate}</div>
              <div className="mt-0.5 inline-block bg-slate-100 border border-slate-400 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-slate-950">
                {isBlank ? 'NO. REG: [ ......................... ]' : (registration?.registrationNumber || 'SPMB-2026-0000')}
              </div>
            </div>
          </div>

          {/* Status & Gelombang */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-300 px-2 py-1 rounded text-[8.5px] my-2">
            <div>
              <span className="text-slate-500 block text-[7.5px] font-bold">STATUS VERIFIKASI:</span>
              <span className="font-extrabold text-blue-950">
                {isBlank ? '[  ] TERVERIFIKASI   [  ] PENDING' : (registration?.status || 'TERDAFTAR')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[7.5px] font-bold">GELOMBANG:</span>
              <span className="font-bold text-slate-900">
                {isBlank ? 'Gelombang: [ ..................... ]' : (registration?.wave || 'Gelombang 1 (Reguler)')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[7.5px] font-bold">KODE DOKUMEN:</span>
              <span className="font-mono font-bold text-slate-700">SPMB-LB2/REG/2026</span>
            </div>
          </div>

          {/* I. DATA PRIBADI */}
          <div className="mb-2">
            <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[8.5px] uppercase tracking-wide flex items-center justify-between">
              <span>I. DATA PRIBADI CALON PESERTA DIDIK</span>
              <span className="text-[7.5px] font-normal opacity-85">Sesuai KK / Akta Kelahiran</span>
            </div>

            <div className="border border-t-0 border-slate-300 p-2 flex gap-2">
              <div className="flex-1 space-y-1 text-[8.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">Nama Lengkap</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? (
                    <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" />
                  ) : (
                    <strong className="flex-1 font-bold text-slate-950 uppercase truncate">
                      {personalData?.fullName || '-'}
                    </strong>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">Nomor Kartu Keluarga</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? (
                    <div className="flex items-center gap-1.5">
                      {renderDigitBoxes(16)}
                      <span className="text-[7px] text-slate-500 font-mono">(16 digit)</span>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-slate-950">
                      {personalData?.kkNumber || '-'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">NIK Calon Siswa</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? (
                    <div className="flex items-center gap-1.5">
                      {renderDigitBoxes(16)}
                      <span className="text-[7px] text-slate-500 font-mono">(16 digit)</span>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-slate-950">
                      {personalData?.nik || '-'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-28 font-semibold text-slate-700 shrink-0">NISN Siswa</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" />
                    ) : (
                      <span className="font-mono font-semibold text-slate-900">
                        {personalData?.nisn || '-'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-24 font-semibold text-slate-700 shrink-0">Tempat, Tgl Lahir</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" />
                    ) : (
                      <span className="text-slate-950 truncate">
                        {personalData?.birthPlace}, {formatDateIndonesia(personalData?.birthDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-28 font-semibold text-slate-700 shrink-0">Jenis Kelamin</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="text-slate-800">[ &nbsp; ] Laki-laki &nbsp;&nbsp; [ &nbsp; ] Perempuan</span>
                    ) : (
                      <span className="font-semibold text-slate-900">{personalData?.gender}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-24 font-semibold text-slate-700 shrink-0">Agama</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="text-slate-800">[ &nbsp; ] Islam &nbsp; [ &nbsp; ] Lainnya</span>
                    ) : (
                      <span className="text-slate-900">{personalData?.religion || 'Islam'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-28 font-semibold text-slate-700 shrink-0">No. WhatsApp/HP</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" />
                    ) : (
                      <span className="font-mono font-semibold text-slate-900">{personalData?.phoneWhatsApp || '-'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-24 font-semibold text-slate-700 shrink-0">Email Siswa</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" />
                    ) : (
                      <span className="text-slate-900 truncate">{personalData?.email || '-'}</span>
                    )}
                  </div>
                </div>

                <div className="pt-0.5 border-t border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-28 font-semibold text-slate-700 shrink-0">Alamat Lengkap</span>
                    <span className="text-slate-600">:</span>
                    {isBlank ? (
                      <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" />
                    ) : (
                      <span className="text-slate-950 truncate flex-1">{personalData?.address || '-'}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <div className="flex items-center gap-1">
                      <span className="w-28 font-semibold text-slate-700 shrink-0">Dusun/Kampung</span>
                      <span className="text-slate-600">:</span>
                      {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-900 truncate">{personalData?.hamlet || '-'}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700 shrink-0">RT/RW:</span>
                      {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="font-mono">{personalData?.rt || '-'}/{personalData?.rw || '-'}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700 shrink-0">Desa:</span>
                      {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-900 truncate">{personalData?.village || '-'}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kotak Pas Foto 3x4 */}
              <div className="w-[23mm] h-[30mm] border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-center p-1 shrink-0 rounded">
                <span className="text-[8px] font-bold text-slate-600 uppercase">PAS FOTO</span>
                <span className="text-[7.5px] text-slate-500 font-mono mt-0.5">3 x 4 cm</span>
              </div>
            </div>
          </div>

          {/* II. JURUSAN & III. ASAL SEKOLAH */}
          <div className="grid grid-cols-12 gap-2 mb-2">
            <div className="col-span-7">
              <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[8.5px] uppercase tracking-wide">
                II. PILIHAN PROGRAM KEAHLIAN
              </div>
              <div className="border border-t-0 border-slate-300 p-1.5 space-y-1 text-[8px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-blue-900 shrink-0">PILIHAN 1:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <strong className="text-slate-950 truncate flex-1">{majorChoice?.firstChoice || '-'}</strong>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 shrink-0">PILIHAN 2:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-800 truncate flex-1">{majorChoice?.secondChoice || '(Tidak Ada)'}</span>}
                </div>
              </div>
            </div>

            <div className="col-span-5">
              <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[8.5px] uppercase tracking-wide">
                III. ASAL SEKOLAH (SMP/MTs)
              </div>
              <div className="border border-t-0 border-slate-300 p-1.5 space-y-1 text-[8px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 shrink-0">Nama Sekolah:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <strong className="text-slate-950 truncate flex-1">{schoolOrigin?.schoolName || '-'}</strong>}
                </div>
                <div className="grid grid-cols-2 gap-1 pt-0.5 border-t border-slate-200">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 shrink-0">Tahun Lulus:</span>
                    {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span>{schoolOrigin?.graduationYear || '2026'}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 shrink-0">Rata Rapor:</span>
                    {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <strong className="text-blue-900 font-mono">{schoolOrigin?.averageScore || '85.0'}</strong>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* IV. DATA ORANG TUA / WALI */}
          <div className="mb-2">
            <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[8.5px] uppercase tracking-wide flex items-center justify-between">
              <span>IV. DATA ORANG TUA / WALI (10 BIDANG UTAMA)</span>
              <span className="text-[7.5px] font-normal opacity-85">
                {isBlank ? 'Tinggal Bersama: [  ] Orang Tua  [  ] Wali' : `Status Tinggal: ${parentData?.livingWithStatus || parentData?.livingWith || 'Orang Tua'}`}
              </span>
            </div>

            <div className="border border-t-0 border-slate-300 p-1.5 space-y-1 text-[8px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">1. Nama Ayah/Wali</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <strong className="text-slate-950 truncate flex-1">{parentData?.fatherName || '-'}</strong>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">2. Nama Ibu/Wali</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <strong className="text-slate-950 truncate flex-1">{parentData?.motherName || '-'}</strong>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">3. NIK Ayah/Wali</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="font-mono text-slate-900 truncate flex-1">{parentData?.fatherNik || '-'}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">4. NIK Ibu/Wali</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="font-mono text-slate-900 truncate flex-1">{parentData?.motherNik || '-'}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">5. Pekerjaan Ayah</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-900 truncate flex-1">{parentData?.fatherJob || '-'}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">6. Pekerjaan Ibu</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-900 truncate flex-1">{parentData?.motherJob || '-'}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">7. No. HP/WA Ayah</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="font-mono text-slate-900 truncate flex-1">{parentData?.fatherPhone || '-'}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">8. No. HP/WA Ibu</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="font-mono text-slate-900 truncate flex-1">{parentData?.motherPhone || '-'}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">9. Status Tinggal</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-900 truncate flex-1">{parentData?.livingWithStatus || parentData?.livingWith || 'Orang Tua'}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-28 font-semibold text-slate-700 shrink-0">10. Alamat Ortu</span>
                  <span className="text-slate-600">:</span>
                  {isBlank ? <span className="flex-1 border-b border-dotted border-slate-500 h-3 inline-block" /> : <span className="text-slate-950 truncate flex-1">{parentData?.parentAddress || personalData?.address || '-'}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* V. KELENGKAPAN BERKAS PERSYARATAN */}
          <div className="mb-2">
            <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[8.5px] uppercase tracking-wide">
              V. CHECK-LIST KELENGKAPAN BERKAS PERSYARATAN
            </div>
            <div className="border border-t-0 border-slate-300 p-1.5">
              <table className="w-full text-left text-[8px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100">
                    <th className="py-0.5 px-1 w-6 text-center">No</th>
                    <th className="py-0.5 px-1">Jenis Dokumen Persyaratan</th>
                    <th className="py-0.5 px-1 w-16 text-center">Status</th>
                    <th className="py-0.5 px-1 w-24 text-center">Petunjuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-0.5 px-1 text-center font-bold">1</td>
                    <td className="py-0.5 px-1">Fotokopi Kartu Keluarga (KK) & Akta Kelahiran</td>
                    <td className="py-0.5 px-1 text-center font-bold">{isBlank ? '[  ]' : 'ADA'}</td>
                    <td className="py-0.5 px-1 text-center text-slate-500">2 Lembar</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 text-center font-bold">2</td>
                    <td className="py-0.5 px-1">Fotokopi Ijazah / Surat Keterangan Lulus (SKL) SMP</td>
                    <td className="py-0.5 px-1 text-center font-bold">{isBlank ? '[  ]' : 'ADA'}</td>
                    <td className="py-0.5 px-1 text-center text-slate-500">Legalisir asli</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 text-center font-bold">3</td>
                    <td className="py-0.5 px-1">Pas Foto Berwarna Terbaru Ukuran 3x4 cm</td>
                    <td className="py-0.5 px-1 text-center font-bold">{isBlank ? '[  ]' : 'ADA'}</td>
                    <td className="py-0.5 px-1 text-center text-slate-500">3 Lembar</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 text-center font-bold">4</td>
                    <td className="py-0.5 px-1">Fotokopi KTP Orang Tua (Ayah & Ibu / Wali)</td>
                    <td className="py-0.5 px-1 text-center font-bold">{isBlank ? '[  ]' : 'ADA'}</td>
                    <td className="py-0.5 px-1 text-center text-slate-500">1 Lembar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER: PERNYATAAN & TANDA TANGAN */}
        <div>
          <div className="border-t border-slate-300 pt-1.5 flex items-end justify-between text-[8px]">
            {/* QR Code & Pernyataan */}
            <div className="w-1/2 space-y-1.5">
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="QR Code Verifikasi" className="w-16 h-16 shrink-0 border border-slate-300" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-900 block text-[8px]">VALIDASI DOKUMEN DIGITAL</span>
                  <p className="text-[7px] text-slate-600 leading-tight">
                    Scan QR Code ini untuk memverifikasi keaslian data pendaftaran siswa di Panitia SPMB SMK Lentera Bangsa 2.
                  </p>
                </div>
              </div>
              <p className="text-[7.5px] italic text-slate-600 leading-tight">
                * Pernyataan: Seluruh data yang tertera dalam formulir ini adalah benar dan sah sesuai dokumen asli yang dilampirkan.
              </p>
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="w-5/12 text-center space-y-8">
              <div>
                <p className="text-[8.5px] font-semibold text-slate-900">{dynamicCityDate}</p>
                <p className="text-[8.5px] text-slate-700">Calon Peserta Didik / Orang Tua Wali,</p>
              </div>
              <div className="pt-8">
                <p className="font-bold text-slate-950 uppercase border-b border-slate-950 inline-block px-4">
                  ( {isBlank ? '......................................................' : (personalData?.fullName || '.....................................')} )
                </p>
                <p className="text-[7.5px] text-slate-500 mt-0.5">Tanda Tangan & Nama Terang</p>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-[7px] text-slate-400 border-t border-slate-200 pt-1">
            Dicetak secara otomatis melalui Sistem SPMB Digital &bull; SMK Lentera Bangsa 2 Karawang
          </div>
        </div>
      </div>
    </div>
  );
};