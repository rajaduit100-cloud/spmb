/**
 * Rekapan Hasil Pendaftaran, Export Excel (.xlsx), Print/PDF Rekapan,
 * & Integrasi Google Sheets API v4 (Firebase Google OAuth Client-Side)
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';
import firebaseConfig from '../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
SCOPES.forEach(scope => googleProvider.addScope(scope));
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory ONLY access token caching (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken = null;
let currentGoogleUser = null;
let authInitialized = false;

export function initGoogleSheetsAuth(onChange) {
  if (authInitialized) return;
  authInitialized = true;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentGoogleUser = user;
      if (!cachedAccessToken && !isSigningIn) {
        if (typeof onChange === 'function') onChange({ user, accessToken: null });
      } else {
        if (typeof onChange === 'function') onChange({ user, accessToken: cachedAccessToken });
      }
    } else {
      currentGoogleUser = null;
      cachedAccessToken = null;
      if (typeof onChange === 'function') onChange({ user: null, accessToken: null });
    }
  });
}

export async function googleSheetsSignIn() {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential || !credential.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Sheets. Pastikan popup diizinkan.');
    }
    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function googleSheetsSignOut() {
  cachedAccessToken = null;
  currentGoogleUser = null;
  await signOut(auth);
}

export function getGoogleAuthState() {
  return {
    user: currentGoogleUser,
    accessToken: cachedAccessToken,
    isConnected: !!(currentGoogleUser && cachedAccessToken)
  };
}

export function clearCachedGoogleToken() {
  cachedAccessToken = null;
}

export function extractSpreadsheetId(input) {
  const val = String(input || '').trim();
  if (!val) return '';
  const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return val.replace(/[^a-zA-Z0-9-_]/g, '');
}

/**
 * Susun dataset rekapan yang 100% selaras dengan kolom Form Builder (appState.formFields)
 */
export function buildRekapDataset(pendaftarList, formFields, jurusanList, filters = {}) {
  const search = (filters.search || '').toLowerCase().trim();
  const jurusanFilter = filters.jurusan || '';
  const gelombangFilter = filters.gelombang || '';
  const statusFilter = filters.status || '';

  let filtered = [...(pendaftarList || [])];
  if (search) {
    filtered = filtered.filter(p =>
      (p.nama || '').toLowerCase().includes(search) ||
      (p.kode || '').toLowerCase().includes(search) ||
      (p.nisn || '').toLowerCase().includes(search) ||
      (p.nik || '').toLowerCase().includes(search) ||
      (p.asal_sekolah || '').toLowerCase().includes(search)
    );
  }
  if (jurusanFilter) {
    filtered = filtered.filter(p => p.jurusan === jurusanFilter);
  }
  if (gelombangFilter) {
    filtered = filtered.filter(p => p.gelombang === gelombangFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter(p => p.status === statusFilter);
  }

  // Susun urutan field sesuai bagian formulir (A, B, C, D)
  const sectionOrder = { jalur: 1, siswa: 2, ortu: 3, tambahan: 4 };
  const orderedFields = [...(formFields || [])].sort((a, b) => {
    const sa = sectionOrder[a.section] || 9;
    const sb = sectionOrder[b.section] || 9;
    if (sa !== sb) return sa - sb;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const headers = [
    'No',
    'Kode Pendaftaran',
    ...orderedFields.map(f => f.label),
    'Status Seleksi',
    'Catatan Panitia',
    'Tanggal Daftar'
  ];

  const rows = filtered.map((p, idx) => {
    const fData = p.formData || p.form_data || {};
    const fieldValues = orderedFields.map(f => {
      let val = fData[f.id];
      if ((val === undefined || val === null || val === '') && p[f.id] !== undefined) {
        val = p[f.id];
      }
      return val != null && String(val).trim() !== '' ? String(val).trim() : '-';
    });

    const tglDaftar = p.created_at
      ? new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';

    return [
      idx + 1,
      String(p.kode || '-'),
      ...fieldValues,
      String(p.status || 'Pending'),
      String(p.catatan || '-'),
      tglDaftar
    ];
  });

  // Ringkasan per Jurusan
  const summaryRows = (jurusanList || []).map((j, idx) => {
    const inJur = filtered.filter(p => p.jurusan === j.nama);
    const kuota = parseInt(j.kuota, 10) || 0;
    const total = inJur.length;
    return [
      idx + 1,
      j.kode || '-',
      j.nama,
      kuota,
      total,
      inJur.filter(p => p.status === 'Diterima').length,
      inJur.filter(p => p.status === 'Diverifikasi').length,
      inJur.filter(p => p.status === 'Pending').length,
      inJur.filter(p => p.status === 'Ditolak').length,
      Math.max(0, kuota - total)
    ];
  });

  // Tambah baris pendaftar dengan jurusan di luar daftar aktif jika ada
  const knownJurNames = new Set((jurusanList || []).map(j => j.nama));
  const otherJur = filtered.filter(p => !knownJurNames.has(p.jurusan));
  if (otherJur.length > 0) {
    summaryRows.push([
      summaryRows.length + 1,
      'LAINNYA',
      'Jurusan Lainnya / Sudah Dihapus',
      0,
      otherJur.length,
      otherJur.filter(p => p.status === 'Diterima').length,
      otherJur.filter(p => p.status === 'Diverifikasi').length,
      otherJur.filter(p => p.status === 'Pending').length,
      otherJur.filter(p => p.status === 'Ditolak').length,
      0
    ]);
  }

  return {
    filtered,
    orderedFields,
    headers,
    rows,
    summaryHeaders: [
      'No',
      'Kode Jurusan',
      'Nama Program Keahlian',
      'Kuota',
      'Total Pendaftar',
      'Diterima',
      'Diverifikasi',
      'Pending',
      'Ditolak',
      'Sisa Kuota'
    ],
    summaryRows,
    statusColumnIndex: 2 + orderedFields.length // 0-based index of 'Status Seleksi'
  };
}

/**
 * Ekspor file Excel (.xlsx) rapi dengan 2 sheet + autofit lebar kolom + proteksi leading zero
 */
export function exportRekapToXlsx({ dataset, settings }) {
  const schoolName = settings?.nama_sekolah || 'SMK Lentera Bangsa 2';
  const exportedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const sheet1Data = [
    [`REKAPAN HASIL PENDAFTARAN SPMB - ${schoolName.toUpperCase()}`],
    [`Tahun Pelajaran 2026/2027 | Diekspor pada: ${exportedAt} | Total Peserta: ${dataset.rows.length}`],
    [],
    dataset.headers,
    ...dataset.rows
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(1, dataset.headers.length - 1) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(1, dataset.headers.length - 1) } }
  ];

  // Pastikan seluruh data teks (terutama NISN/NIK/HP) tersimpan sebagai string agar nol di depan tidak hilang
  const range1 = XLSX.utils.decode_range(ws1['!ref']);
  for (let R = 4; R <= range1.e.r; R++) {
    for (let C = 1; C <= range1.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws1[addr] && ws1[addr].v != null) {
        ws1[addr].t = 's';
        ws1[addr].v = String(ws1[addr].v);
      }
    }
  }

  // Hitung lebar kolom otomatis (mulai dari row header + data)
  ws1['!cols'] = dataset.headers.map((h, colIdx) => {
    let maxLen = String(h).length;
    dataset.rows.forEach(r => {
      const cellLen = String(r[colIdx] == null ? '' : r[colIdx]).length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(48, Math.max(colIdx === 0 ? 5 : 13, maxLen + 3)) };
  });

  // Sheet 2: Ringkasan Statistik per Jurusan
  const totalKuota = dataset.summaryRows.reduce((s, r) => s + (Number(r[3]) || 0), 0);
  const totalPnd = dataset.summaryRows.reduce((s, r) => s + (Number(r[4]) || 0), 0);
  const totalDiterima = dataset.summaryRows.reduce((s, r) => s + (Number(r[5]) || 0), 0);
  const totalVerif = dataset.summaryRows.reduce((s, r) => s + (Number(r[6]) || 0), 0);
  const totalPending = dataset.summaryRows.reduce((s, r) => s + (Number(r[7]) || 0), 0);
  const totalDitolak = dataset.summaryRows.reduce((s, r) => s + (Number(r[8]) || 0), 0);
  const totalSisa = dataset.summaryRows.reduce((s, r) => s + (Number(r[9]) || 0), 0);

  const sheet2Data = [
    [`RINGKASAN STATISTIK PER PROGRAM KEAHLIAN - ${schoolName.toUpperCase()}`],
    [`Tahun Pelajaran 2026/2027 | Diperbarui: ${exportedAt}`],
    [],
    dataset.summaryHeaders,
    ...dataset.summaryRows,
    ['', '', 'TOTAL KESELURUHAN', totalKuota, totalPnd, totalDiterima, totalVerif, totalPending, totalDitolak, totalSisa]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: dataset.summaryHeaders.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: dataset.summaryHeaders.length - 1 } }
  ];
  ws2['!cols'] = dataset.summaryHeaders.map((h, colIdx) => {
    let maxLen = String(h).length;
    dataset.summaryRows.forEach(r => {
      const len = String(r[colIdx] == null ? '' : r[colIdx]).length;
      if (len > maxLen) maxLen = len;
    });
    return { wch: Math.min(42, Math.max(colIdx === 0 ? 5 : 12, maxLen + 4)) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Rekapan Pendaftar');
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Statistik');

  const dateTag = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Rekapan_Hasil_SPMB_${schoolName.replace(/\s+/g, '_')}_${dateTag}.xlsx`);
}

/**
 * Helper panggilan REST Google Sheets API v4
 */
async function sheetsApiFetch(url, accessToken, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { error: { message: text } };
  }
  if (!res.ok) {
    if (res.status === 401) {
      clearCachedGoogleToken();
    }
    const errMsg = json?.error?.message || `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }
  return json;
}

/**
 * Buat Google Sheet baru yang sudah terstruktur rapi
 */
export async function createGoogleSpreadsheet({ accessToken, settings, dataset }) {
  const schoolName = settings?.nama_sekolah || 'SMK Lentera Bangsa 2';
  const createBody = {
    properties: {
      title: `Rekapan Hasil SPMB - ${schoolName} (2026/2027)`
    },
    sheets: [
      { properties: { title: 'Rekapan Pendaftar', index: 0, gridProperties: { frozenRowCount: 4, frozenColumnCount: 3 } } },
      { properties: { title: 'Ringkasan Statistik', index: 1, gridProperties: { frozenRowCount: 4 } } }
    ]
  };

  const created = await sheetsApiFetch('https://sheets.googleapis.com/v4/spreadsheets', accessToken, {
    method: 'POST',
    body: JSON.stringify(createBody)
  });

  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  await writeAndFormatGoogleSheet({ accessToken, spreadsheetId, settings, dataset });

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: created.properties?.title || `Rekapan Hasil SPMB - ${schoolName}`
  };
}

/**
 * Tulis ulang & format Google Sheet yang sudah ada (tanpa hardcode "Sheet1")
 */
export async function writeAndFormatGoogleSheet({ accessToken, spreadsheetId, settings, dataset }) {
  const schoolName = settings?.nama_sekolah || 'SMK Lentera Bangsa 2';
  const syncedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  // 1. Cek metadata spreadsheet agar tidak mengasumsikan "Sheet1"
  const meta = await sheetsApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties`,
    accessToken
  );

  const existingSheets = meta.sheets || [];
  let rekapanSheet = existingSheets.find(s => s.properties?.title === 'Rekapan Pendaftar');
  let ringkasanSheet = existingSheets.find(s => s.properties?.title === 'Ringkasan Statistik');

  const addSheetRequests = [];
  if (!rekapanSheet) {
    addSheetRequests.push({ addSheet: { properties: { title: 'Rekapan Pendaftar', index: 0 } } });
  }
  if (!ringkasanSheet) {
    addSheetRequests.push({ addSheet: { properties: { title: 'Ringkasan Statistik', index: 1 } } });
  }

  if (addSheetRequests.length > 0) {
    const addedRes = await sheetsApiFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      accessToken,
      { method: 'POST', body: JSON.stringify({ requests: addSheetRequests }) }
    );
    (addedRes.replies || []).forEach(r => {
      if (r.addSheet?.properties?.title === 'Rekapan Pendaftar') rekapanSheet = { properties: r.addSheet.properties };
      if (r.addSheet?.properties?.title === 'Ringkasan Statistik') ringkasanSheet = { properties: r.addSheet.properties };
    });
  }

  const rekapanSheetId = rekapanSheet.properties.sheetId;
  const ringkasanSheetId = ringkasanSheet.properties.sheetId;

  // 2. Bersihkan isi lama pada kedua tab
  await Promise.all([
    sheetsApiFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent("'Rekapan Pendaftar'!A1:ZZ5000")}:clear`,
      accessToken,
      { method: 'POST', body: '{}' }
    ),
    sheetsApiFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent("'Ringkasan Statistik'!A1:Z1000")}:clear`,
      accessToken,
      { method: 'POST', body: '{}' }
    )
  ]);

  // 3. Susun nilai Sheet 1 & Sheet 2
  const sheet1Values = [
    [`REKAPAN HASIL PENDAFTARAN SPMB - ${schoolName.toUpperCase()}`],
    [`Tahun Pelajaran 2026/2027 · Disinkronkan: ${syncedAt} · Total Data: ${dataset.rows.length} Calon Siswa`],
    [],
    dataset.headers,
    ...dataset.rows
  ];

  const totalKuota = dataset.summaryRows.reduce((s, r) => s + (Number(r[3]) || 0), 0);
  const totalPnd = dataset.summaryRows.reduce((s, r) => s + (Number(r[4]) || 0), 0);
  const totalDiterima = dataset.summaryRows.reduce((s, r) => s + (Number(r[5]) || 0), 0);
  const totalVerif = dataset.summaryRows.reduce((s, r) => s + (Number(r[6]) || 0), 0);
  const totalPending = dataset.summaryRows.reduce((s, r) => s + (Number(r[7]) || 0), 0);
  const totalDitolak = dataset.summaryRows.reduce((s, r) => s + (Number(r[8]) || 0), 0);
  const totalSisa = dataset.summaryRows.reduce((s, r) => s + (Number(r[9]) || 0), 0);

  const sheet2Values = [
    [`RINGKASAN STATISTIK PENDAFTARAN - ${schoolName.toUpperCase()}`],
    [`Tahun Pelajaran 2026/2027 · Disinkronkan: ${syncedAt}`],
    [],
    dataset.summaryHeaders,
    ...dataset.summaryRows,
    ['', '', 'TOTAL KESELURUHAN', totalKuota, totalPnd, totalDiterima, totalVerif, totalPending, totalDitolak, totalSisa]
  ];

  await sheetsApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [
          { range: "'Rekapan Pendaftar'!A1", values: sheet1Values },
          { range: "'Ringkasan Statistik'!A1", values: sheet2Values }
        ]
      })
    }
  );

  // 4. Terapkan formatting profesional (merge banner, freeze header, warna header, border, zebra, badge status, auto-resize)
  const colCount1 = dataset.headers.length;
  const rowCount1 = sheet1Values.length;
  const colCount2 = dataset.summaryHeaders.length;
  const rowCount2 = sheet2Values.length;

  const thinBorder = { style: 'SOLID', width: 1, color: { red: 0.79, green: 0.83, blue: 0.88 } };
  const requests = [
    // Reset merges dulu agar aman saat kolom berubah
    {
      unmergeCells: {
        range: { sheetId: rekapanSheetId, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: Math.max(colCount1, 40) }
      }
    },
    {
      unmergeCells: {
        range: { sheetId: ringkasanSheetId, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: Math.max(colCount2, 15) }
      }
    },
    // Freeze rows & cols
    {
      updateSheetProperties: {
        properties: { sheetId: rekapanSheetId, gridProperties: { frozenRowCount: 4, frozenColumnCount: Math.min(3, colCount1) } },
        fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
      }
    },
    {
      updateSheetProperties: {
        properties: { sheetId: ringkasanSheetId, gridProperties: { frozenRowCount: 4 } },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    // Merge judul & subjudul Sheet 1
    { mergeCells: { range: { sheetId: rekapanSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount1 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: rekapanSheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: colCount1 }, mergeType: 'MERGE_ALL' } },
    // Merge judul & subjudul Sheet 2
    { mergeCells: { range: { sheetId: ringkasanSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount2 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId: ringkasanSheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: colCount2 }, mergeType: 'MERGE_ALL' } },
    // Format Row 1 Banner Sheet 1 & 2 (Deep Blue #0C4A6E)
    ...[rekapanSheetId, ringkasanSheetId].map((sid, i) => ({
      repeatCell: {
        range: { sheetId: sid, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: i === 0 ? colCount1 : colCount2 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.047, green: 0.290, blue: 0.431 },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 12, bold: true }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
      }
    })),
    // Format Row 2 Subjudul Sheet 1 & 2
    ...[rekapanSheetId, ringkasanSheetId].map((sid, i) => ({
      repeatCell: {
        range: { sheetId: sid, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: i === 0 ? colCount1 : colCount2 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.945, green: 0.961, blue: 0.976 },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
            textFormat: { foregroundColor: { red: 0.20, green: 0.25, blue: 0.33 }, fontSize: 9, italic: true }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)'
      }
    })),
    // Format Header Tabel Row 4 (Emerald #065F46)
    ...[rekapanSheetId, ringkasanSheetId].map((sid, i) => ({
      repeatCell: {
        range: { sheetId: sid, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: i === 0 ? colCount1 : colCount2 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.024, green: 0.373, blue: 0.275 },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10, bold: true }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)'
      }
    })),
    // Tinggi baris judul & header
    { updateDimensionProperties: { range: { sheetId: rekapanSheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 34 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: rekapanSheetId, dimension: 'ROWS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 32 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: ringkasanSheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 34 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: ringkasanSheetId, dimension: 'ROWS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 32 }, fields: 'pixelSize' } },
    // Border tabel penuh
    {
      updateBorders: {
        range: { sheetId: rekapanSheetId, startRowIndex: 3, endRowIndex: rowCount1, startColumnIndex: 0, endColumnIndex: colCount1 },
        top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, innerHorizontal: thinBorder, innerVertical: thinBorder
      }
    },
    {
      updateBorders: {
        range: { sheetId: ringkasanSheetId, startRowIndex: 3, endRowIndex: rowCount2, startColumnIndex: 0, endColumnIndex: colCount2 },
        top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, innerHorizontal: thinBorder, innerVertical: thinBorder
      }
    }
  ];

  // Zebra striping & Status highlighting untuk baris data Sheet 1
  for (let r = 4; r < rowCount1; r++) {
    const isEven = (r - 4) % 2 === 1;
    requests.push({
      repeatCell: {
        range: { sheetId: rekapanSheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 0, endColumnIndex: colCount1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: isEven ? { red: 0.973, green: 0.980, blue: 0.988 } : { red: 1, green: 1, blue: 1 },
            verticalAlignment: 'MIDDLE',
            textFormat: { fontSize: 10, foregroundColor: { red: 0.06, green: 0.09, blue: 0.16 } }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,verticalAlignment,textFormat)'
      }
    });

    const statusVal = dataset.rows[r - 4]?.[dataset.statusColumnIndex];
    let bg = null;
    let fg = null;
    if (statusVal === 'Diterima') {
      bg = { red: 0.863, green: 0.988, blue: 0.906 };
      fg = { red: 0.086, green: 0.396, blue: 0.204 };
    } else if (statusVal === 'Diverifikasi') {
      bg = { red: 0.859, green: 0.918, blue: 0.996 };
      fg = { red: 0.118, green: 0.251, blue: 0.686 };
    } else if (statusVal === 'Ditolak') {
      bg = { red: 0.996, green: 0.886, blue: 0.886 };
      fg = { red: 0.600, green: 0.106, blue: 0.106 };
    } else {
      bg = { red: 0.996, green: 0.953, blue: 0.780 };
      fg = { red: 0.573, green: 0.251, blue: 0.055 };
    }
    requests.push({
      repeatCell: {
        range: {
          sheetId: rekapanSheetId,
          startRowIndex: r,
          endRowIndex: r + 1,
          startColumnIndex: dataset.statusColumnIndex,
          endColumnIndex: dataset.statusColumnIndex + 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: bg,
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 10, foregroundColor: fg }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)'
      }
    });
  }

  // Baris TOTAL KESELURUHAN di Sheet 2
  requests.push({
    repeatCell: {
      range: { sheetId: ringkasanSheetId, startRowIndex: rowCount2 - 1, endRowIndex: rowCount2, startColumnIndex: 0, endColumnIndex: colCount2 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.925, green: 0.992, blue: 0.961 },
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.024, green: 0.306, blue: 0.231 } }
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }
  });

  // Auto-resize seluruh kolom
  requests.push(
    { autoResizeDimensions: { dimensions: { sheetId: rekapanSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: colCount1 } } },
    { autoResizeDimensions: { dimensions: { sheetId: ringkasanSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: colCount2 } } }
  );

  await sheetsApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    accessToken,
    { method: 'POST', body: JSON.stringify({ requests }) }
  );

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: meta.properties?.title || `Rekapan Hasil SPMB - ${schoolName}`
  };
}
