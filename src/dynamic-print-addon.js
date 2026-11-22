/**
 * Add-on Dinamis Cetak/Simpan Formulir & Blanko Formulir SPMB
 * Memastikan seluruh kolom dari Pengaturan Lengkap Isian Formulir Pendaftaran
 * (Bagian A, B, C, D, maupun bagian tambahan lain) tampil lengkap dan rapi
 * pada Bukti Pendaftaran (#printArea) dan Blanko Formulir (#blankoPrintArea),
 * tanpa mengubah kode inti yang sudah ada.
 */

const ADDON_STORAGE_KEYS = {
  FORM_FIELDS: 'spmb_data_form_fields_v4',
  GELOMBANG: 'spmb_data_gelombang_v4',
  JURUSAN: 'spmb_data_jurusan_v4',
  SETTINGS: 'spmb_data_settings_v4'
};

const FALLBACK_FORM_FIELDS = [
  { id: 'gelombang', section: 'jalur', label: 'Gelombang Pendaftaran', type: 'gelombang_select', required: true, placeholder: '-- Pilih Gelombang --', options: [] },
  { id: 'jurusan', section: 'jalur', label: 'Pilihan Program Keahlian (Jurusan)', type: 'jurusan_select', required: true, placeholder: '-- Pilih Program Keahlian --', options: [] },
  { id: 'nama', section: 'siswa', label: 'Nama Lengkap Calon Siswa', type: 'text', required: true, placeholder: 'Sesuai Akta Kelahiran / Ijazah SMP', options: [] },
  { id: 'nisn', section: 'siswa', label: 'NISN (10 Digit Angka)', type: 'text', required: true, placeholder: 'Contoh: 0071234567', options: [], pattern: '[0-9]{10}', maxlength: 10 },
  { id: 'nik', section: 'siswa', label: 'NIK (16 Digit Angka)', type: 'text', required: true, placeholder: 'Contoh: 3215012304070001', options: [], pattern: '[0-9]{16}', maxlength: 16 },
  { id: 'tempat_lahir', section: 'siswa', label: 'Tempat Lahir', type: 'text', required: true, placeholder: 'Contoh: Karawang', options: [] },
  { id: 'tanggal_lahir', section: 'siswa', label: 'Tanggal Lahir', type: 'date', required: true, placeholder: '', options: [] },
  { id: 'gender', section: 'siswa', label: 'Jenis Kelamin', type: 'select', required: true, placeholder: '-- Pilih Jenis Kelamin --', options: ['Laki-laki', 'Perempuan'] },
  { id: 'agama', section: 'siswa', label: 'Agama', type: 'select', required: true, placeholder: '-- Pilih Agama --', options: ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'] },
  { id: 'asal_sekolah', section: 'siswa', label: 'Asal Sekolah (SMP / MTs)', type: 'text', required: true, placeholder: 'Contoh: SMP Negeri 1 Klari', options: [] },
  { id: 'alamat', section: 'siswa', label: 'Alamat Lengkap Tempat Tinggal', type: 'textarea', required: true, placeholder: 'Dusun/Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kab', options: [] },
  { id: 'nama_ortu', section: 'ortu', label: 'Nama Orang Tua / Wali', type: 'text', required: true, placeholder: 'Contoh: Bpk. Bambang Sutrisno', options: [] },
  { id: 'pekerjaan_ortu', section: 'ortu', label: 'Pekerjaan Orang Tua / Wali', type: 'text', required: false, placeholder: 'Contoh: Karyawan Swasta / Wiraswasta', options: [] },
  { id: 'hp_ortu', section: 'ortu', label: 'No. WhatsApp / HP Orang Tua', type: 'tel', required: true, placeholder: 'Contoh: 081234567890', options: [] },
  { id: 'hp_siswa', section: 'ortu', label: 'No. WhatsApp Calon Siswa (Grup WA)', type: 'tel', required: true, placeholder: 'Contoh: 089876543210', options: [] },
  { id: 'ukuran_seragam', section: 'tambahan', label: 'Ukuran Seragam Sekolah', type: 'select', required: true, placeholder: '-- Pilih Ukuran Seragam --', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'prestasi', section: 'tambahan', label: 'Prestasi / Bakat Minat', type: 'text', required: false, placeholder: 'Contoh: Juara Futsal / Desain Poster / MTQ', options: [] }
];

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed != null ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr);
  }
}

function getActiveFormFields() {
  const fields = readLocalJson(ADDON_STORAGE_KEYS.FORM_FIELDS, FALLBACK_FORM_FIELDS);
  return Array.isArray(fields) ? fields : FALLBACK_FORM_FIELDS;
}

function getFieldValue(student, formData, field) {
  let val = formData[field.id];
  if ((val === undefined || val === null || String(val).trim() === '') && student[field.id] !== undefined) {
    val = student[field.id];
  }
  if (val === undefined || val === null || String(val).trim() === '') return '-';
  const str = String(val).trim();
  if (field.type === 'date') return formatTanggalIndo(str);
  return str;
}

function isWidePrintField(field, valueText = '') {
  return (
    field.id === 'nama' ||
    field.id === 'asal_sekolah' ||
    field.type === 'textarea' ||
    String(valueText).length > 48
  );
}

function isWideBlankoField(field) {
  const opts = Array.isArray(field.options) ? field.options : [];
  const optsLen = opts.join(' ').length;
  return (
    field.id === 'nama' ||
    field.id === 'nisn' ||
    field.id === 'nik' ||
    field.id === 'asal_sekolah' ||
    field.id === 'agama' ||
    field.type === 'textarea' ||
    opts.length > 3 ||
    optsLen > 32
  );
}

function buildBlankoCellMarkup(field) {
  if (field.id === 'nisn') {
    return Array.from({ length: 10 }, () => '<span class="char-box"></span>').join('');
  }
  if (field.id === 'nik') {
    return Array.from({ length: 16 }, () => '<span class="char-box"></span>').join('');
  }
  if (field.type === 'date') {
    return '<span class="char-box"></span><span class="char-box"></span> / <span class="char-box"></span><span class="char-box"></span> / <span class="char-box"></span><span class="char-box"></span><span class="char-box"></span><span class="char-box"></span> <span class="text-[6pt] text-slate-400">(Tgl/Bln/Thn)</span>';
  }
  if (field.type === 'gelombang_select') {
    const gelombang = readLocalJson(ADDON_STORAGE_KEYS.GELOMBANG, []);
    if (Array.isArray(gelombang) && gelombang.length > 0) {
      return gelombang.map(g => {
        const parts = String(g.nama || '').split(' ');
        const shortName = `${parts[0] || ''} ${parts[1] || ''}`.trim();
        return `<span class="inline-block mr-3"><span class="check-box"></span>${safeHtml(shortName || g.nama)}</span>`;
      }).join('');
    }
    return '<span class="blank-write-box"></span>';
  }
  if (field.type === 'jurusan_select') {
    const jurusan = readLocalJson(ADDON_STORAGE_KEYS.JURUSAN, []);
    if (Array.isArray(jurusan) && jurusan.length > 0) {
      return jurusan.map(j => `<span class="inline-block mr-3"><span class="check-box"></span><strong>${safeHtml(j.kode)}</strong> (${safeHtml(String(j.nama || '').replace(/\s*\([^)]*\)/, ''))})</span>`).join('');
    }
    return '<span class="blank-write-box"></span>';
  }
  if (Array.isArray(field.options) && field.options.length > 0) {
    return field.options.map(opt => `<span class="inline-block mr-2.5"><span class="check-box"></span>${safeHtml(opt)}</span>`).join('');
  }
  if (field.type === 'textarea') {
    return '<span class="blank-write-box" style="min-height: 26px;"></span>';
  }
  return '<span class="blank-write-box"></span>';
}

function buildPairedPrintRows(fields, student, formData, labelWidth = '22%', valWidth = '28%') {
  let html = '';
  let pairBuffer = [];

  const flushPair = () => {
    if (pairBuffer.length === 0) return;
    const f1 = pairBuffer[0];
    const f2 = pairBuffer[1];
    const v1 = getFieldValue(student, formData, f1);
    const mono1 = f1.id === 'nisn' || f1.id === 'nik' || f1.type === 'tel' || f1.type === 'number' ? 'font-mono' : '';

    if (f2) {
      const v2 = getFieldValue(student, formData, f2);
      const mono2 = f2.id === 'nisn' || f2.id === 'nik' || f2.type === 'tel' || f2.type === 'number' ? 'font-mono' : '';
      html += `
        <tr>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f1.label)}</td>
          <td style="width:${valWidth}" class="font-medium text-slate-900 ${mono1}">${safeHtml(v1)}</td>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f2.label)}</td>
          <td style="width:${valWidth}" class="font-medium text-slate-900 ${mono2}">${safeHtml(v2)}</td>
        </tr>
      `;
    } else {
      html += `
        <tr>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f1.label)}</td>
          <td colspan="3" class="font-medium text-slate-900 ${mono1}">${safeHtml(v1)}</td>
        </tr>
      `;
    }
    pairBuffer = [];
  };

  fields.forEach(f => {
    const val = getFieldValue(student, formData, f);
    if (isWidePrintField(f, val)) {
      flushPair();
      const extraClass = f.id === 'nama' ? 'font-extrabold uppercase text-[8.5pt]' : 'font-medium';
      html += `
        <tr>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f.label)}</td>
          <td colspan="3" class="text-slate-900 ${extraClass}">${safeHtml(val)}</td>
        </tr>
      `;
    } else {
      pairBuffer.push(f);
      if (pairBuffer.length === 2) flushPair();
    }
  });
  flushPair();
  return html;
}

function buildPairedBlankoRows(fields, labelWidth = '21%', valWidth = '29%') {
  let html = '';
  let pairBuffer = [];

  const flushPair = () => {
    if (pairBuffer.length === 0) return;
    const f1 = pairBuffer[0];
    const f2 = pairBuffer[1];
    if (f2) {
      html += `
        <tr>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f1.label)}</td>
          <td style="width:${valWidth}">${buildBlankoCellMarkup(f1)}</td>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f2.label)}</td>
          <td style="width:${valWidth}">${buildBlankoCellMarkup(f2)}</td>
        </tr>
      `;
    } else {
      html += `
        <tr>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f1.label)}</td>
          <td colspan="3">${buildBlankoCellMarkup(f1)}</td>
        </tr>
      `;
    }
    pairBuffer = [];
  };

  fields.forEach(f => {
    if (isWideBlankoField(f)) {
      flushPair();
      html += `
        <tr>
          <td style="width:${labelWidth}" class="font-bold text-slate-700 bg-slate-50/60">${safeHtml(f.label)}</td>
          <td colspan="3">${buildBlankoCellMarkup(f)}</td>
        </tr>
      `;
    } else {
      pairBuffer.push(f);
      if (pairBuffer.length === 2) flushPair();
    }
  });
  flushPair();
  return html;
}

function injectAddonStyles() {
  if (document.getElementById('dynamic-print-addon-styles')) return;
  const style = document.createElement('style');
  style.id = 'dynamic-print-addon-styles';
  style.textContent = `
    .a4-sheet.a4-compact {
      padding: 6mm 9.5mm;
      font-size: 7.4pt;
      line-height: 1.22;
    }
    .a4-sheet.a4-compact .mini-table {
      font-size: 7.2pt;
      margin-bottom: 3.5px;
    }
    .a4-sheet.a4-compact .mini-table th,
    .a4-sheet.a4-compact .mini-table td {
      padding: 2px 4.5px;
    }
    .a4-sheet.a4-compact .doc-textbox-muted {
      padding: 3px 6px;
    }

    .a4-sheet.a4-sheet-expanded {
      height: auto !important;
      min-height: 296mm !important;
      max-height: none !important;
      overflow: visible !important;
      display: block !important;
    }
    .a4-sheet.a4-sheet-expanded > div:last-child {
      margin-top: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .a4-sheet.a4-sheet-expanded .mini-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @media print {
      .a4-sheet.a4-sheet-expanded {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 210mm !important;
        height: auto !important;
        min-height: 296mm !important;
        max-height: none !important;
        overflow: visible !important;
      }
      #modalPrintCard:not(.hidden) #printArea.a4-sheet-expanded,
      #modalBlankoFormulir:not(.hidden) #blankoPrintArea.a4-sheet-expanded {
        position: absolute !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function fitA4SheetLayout(sheetEl) {
  if (!sheetEl) return;
  sheetEl.classList.remove('a4-compact', 'a4-sheet-expanded');

  requestAnimationFrame(() => {
    const overflowsDefault = sheetEl.scrollHeight > sheetEl.clientHeight + 2;
    if (!overflowsDefault) return;

    sheetEl.classList.add('a4-compact');
    const overflowsCompact = sheetEl.scrollHeight > sheetEl.clientHeight + 2;
    if (overflowsCompact) {
      sheetEl.classList.add('a4-sheet-expanded');
    }
  });
}

function enhancePrintCardModal(student) {
  if (!student) return;
  const printArea = document.getElementById('printArea');
  if (!printArea) return;

  const formFields = getActiveFormFields();
  const fd = student.formData || student.form_data || {};

  // 1. Bagian A: Jalur Pendaftaran + seluruh field custom di section 'jalur'
  const sectionATable = printArea.querySelector('table.mini-table');
  const sectionATbody = sectionATable ? sectionATable.querySelector('tbody') : null;
  if (sectionATbody) {
    sectionATbody.querySelectorAll('tr[data-addon-row="true"]').forEach(tr => tr.remove());

    const jalurFields = formFields.filter(f => f.section === 'jalur');
    const gelField = jalurFields.find(f => f.id === 'gelombang');
    const jurField = jalurFields.find(f => f.id === 'jurusan');

    const defaultRows = sectionATbody.querySelectorAll('tr');
    if (defaultRows[0]) {
      const labelEl = defaultRows[0].querySelector('td');
      if (labelEl && gelField) labelEl.innerText = gelField.label;
    }
    if (defaultRows[1]) {
      const labelEl = defaultRows[1].querySelector('td');
      if (labelEl && jurField) labelEl.innerText = jurField.label;
    }

    const extraJalurFields = jalurFields.filter(f => f.id !== 'gelombang' && f.id !== 'jurusan');
    if (extraJalurFields.length > 0) {
      const extraRowsHtml = buildPairedPrintRows(extraJalurFields, student, fd, '19%', '31%');
      const tempTable = document.createElement('tbody');
      tempTable.innerHTML = extraRowsHtml;
      Array.from(tempTable.children).forEach(tr => {
        tr.setAttribute('data-addon-row', 'true');
        sectionATbody.appendChild(tr);
      });
    }
  }

  // 2. Bagian B: Biodata Siswa
  const siswaFields = formFields.filter(f => f.section === 'siswa');
  const tbodySiswa = document.getElementById('printBiodataRows');
  if (tbodySiswa) {
    tbodySiswa.innerHTML = buildPairedPrintRows(siswaFields, student, fd, '22%', '28%');
  }

  // 3. Bagian C: Data Orang Tua / Wali & Kontak
  const ortuFields = formFields.filter(f => f.section === 'ortu');
  const tbodyOrtu = document.getElementById('printOrtuRows');
  if (tbodyOrtu) {
    tbodyOrtu.innerHTML = buildPairedPrintRows(ortuFields, student, fd, '22%', '28%');
  }

  // 4. Bagian D: Kelengkapan Administrasi Tambahan + section lain jika ada
  const knownSections = new Set(['jalur', 'siswa', 'ortu', 'tambahan']);
  const extraFields = formFields.filter(f => f.section === 'tambahan' || !knownSections.has(f.section));
  const tableExtra = document.getElementById('printExtraTable');
  const tbodyExtra = document.getElementById('printExtraRows');
  if (extraFields.length === 0) {
    if (tableExtra) tableExtra.classList.add('hidden');
  } else {
    if (tableExtra) tableExtra.classList.remove('hidden');
    if (tbodyExtra) {
      tbodyExtra.innerHTML = buildPairedPrintRows(extraFields, student, fd, '22%', '28%');
    }
  }

  fitA4SheetLayout(printArea);
}

function enhanceBlankoModal() {
  const blankoArea = document.getElementById('blankoPrintArea');
  if (!blankoArea) return;

  const formFields = getActiveFormFields();

  // 1. Bagian A: Pilihan Jalur & Jurusan + seluruh field custom di section 'jalur'
  const sectionATable = blankoArea.querySelector('table.mini-table');
  const sectionATbody = sectionATable ? sectionATable.querySelector('tbody') : null;
  if (sectionATbody) {
    sectionATbody.querySelectorAll('tr[data-addon-row="true"]').forEach(tr => tr.remove());

    const jalurFields = formFields.filter(f => f.section === 'jalur');
    const gelField = jalurFields.find(f => f.id === 'gelombang');
    const jurField = jalurFields.find(f => f.id === 'jurusan');

    const defaultRows = sectionATbody.querySelectorAll('tr');
    if (defaultRows[0]) {
      const labelCell = defaultRows[0].querySelector('td');
      if (gelField) {
        defaultRows[0].classList.remove('hidden');
        if (labelCell) labelCell.innerText = gelField.label;
      } else {
        defaultRows[0].classList.add('hidden');
      }
    }
    if (defaultRows[1]) {
      const labelCell = defaultRows[1].querySelector('td');
      if (jurField) {
        defaultRows[1].classList.remove('hidden');
        if (labelCell) labelCell.innerText = jurField.label;
      } else {
        defaultRows[1].classList.add('hidden');
      }
    }

    const extraJalurFields = jalurFields.filter(f => f.id !== 'gelombang' && f.id !== 'jurusan');
    extraJalurFields.forEach(f => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-addon-row', 'true');
      tr.innerHTML = `
        <td class="w-[26%] font-bold text-slate-700 bg-slate-50/60">${safeHtml(f.label)}</td>
        <td>${buildBlankoCellMarkup(f)}</td>
      `;
      sectionATbody.appendChild(tr);
    });
  }

  // 2. Bagian B: Identitas Diri Calon Peserta Didik
  const siswaFields = formFields.filter(f => f.section === 'siswa');
  const tbodySiswa = document.getElementById('blankoBiodataRows');
  if (tbodySiswa) {
    tbodySiswa.innerHTML = buildPairedBlankoRows(siswaFields, '21%', '29%');
  }

  // 3. Bagian C: Data Orang Tua / Wali & Kontak
  const ortuFields = formFields.filter(f => f.section === 'ortu');
  const tbodyOrtu = document.getElementById('blankoOrtuRows');
  if (tbodyOrtu) {
    tbodyOrtu.innerHTML = buildPairedBlankoRows(ortuFields, '21%', '29%');
  }

  // 4. Bagian D: Kelengkapan Administrasi Tambahan + section lain jika ada
  const knownSections = new Set(['jalur', 'siswa', 'ortu', 'tambahan']);
  const extraFields = formFields.filter(f => f.section === 'tambahan' || !knownSections.has(f.section));
  const tableExtra = document.getElementById('blankoExtraTable');
  const tbodyExtra = document.getElementById('blankoExtraRows');
  if (extraFields.length === 0) {
    if (tableExtra) tableExtra.classList.add('hidden');
  } else {
    if (tableExtra) tableExtra.classList.remove('hidden');
    if (tbodyExtra) {
      tbodyExtra.innerHTML = buildPairedBlankoRows(extraFields, '21%', '29%');
    }
  }

  fitA4SheetLayout(blankoArea);
}

function runExpandedPdfExport({ elementId, filename, btnId, defaultBtnHtml, successMsg, origFn }) {
  const element = document.getElementById(elementId);
  if (!element || !element.classList.contains('a4-sheet-expanded')) {
    return origFn();
  }

  const btn = document.getElementById(btnId);
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Menyusun PDF...';
  }

  const opt = {
    margin: [6, 0, 6, 0],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.doc-textbox-muted'] }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(() => {
      if (typeof window.showToast === 'function') {
        window.showToast(successMsg, 'success');
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = defaultBtnHtml;
      }
    }).catch(() => {
      window.print();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = defaultBtnHtml;
      }
    });
  } else {
    window.print();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = defaultBtnHtml;
    }
  }
}

function installDynamicPrintAddon() {
  if (window.__dynamicPrintAddonInstalled) return;
  if (typeof window.openPrintCardModal !== 'function' || typeof window.openBlankoFormulirModal !== 'function') {
    setTimeout(installDynamicPrintAddon, 50);
    return;
  }

  window.__dynamicPrintAddonInstalled = true;
  injectAddonStyles();

  const origOpenPrintCardModal = window.openPrintCardModal;
  window.openPrintCardModal = function(student) {
    origOpenPrintCardModal(student);
    enhancePrintCardModal(student);
  };

  const origOpenBlankoFormulirModal = window.openBlankoFormulirModal;
  window.openBlankoFormulirModal = function() {
    origOpenBlankoFormulirModal();
    enhanceBlankoModal();
  };

  if (typeof window.downloadBuktiPDF === 'function') {
    const origDownloadBuktiPDF = window.downloadBuktiPDF;
    window.downloadBuktiPDF = function() {
      const code = document.getElementById('printCode')?.innerText || 'Dokumen';
      runExpandedPdfExport({
        elementId: 'printArea',
        filename: `Bukti_Pendaftaran_SPMB_${code}.pdf`,
        btnId: 'btnDownloadPdf',
        defaultBtnHtml: `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download PDF (A4)</span>
        `,
        successMsg: 'Bukti Pendaftaran PDF berhasil diunduh.',
        origFn: origDownloadBuktiPDF
      });
    };
  }

  if (typeof window.downloadBlankoPDF === 'function') {
    const origDownloadBlankoPDF = window.downloadBlankoPDF;
    window.downloadBlankoPDF = function() {
      runExpandedPdfExport({
        elementId: 'blankoPrintArea',
        filename: 'Blanko_Formulir_Pendaftaran_SPMB_SMK_Lentera_Bangsa_2.pdf',
        btnId: 'btnDownloadBlankoPdf',
        defaultBtnHtml: `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download PDF Blanko</span>
        `,
        successMsg: 'Blanko Formulir PDF berhasil diunduh.',
        origFn: origDownloadBlankoPDF
      });
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installDynamicPrintAddon);
} else {
  installDynamicPrintAddon();
}
