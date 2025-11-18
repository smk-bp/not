// Full application JavaScript (moved from ppdb.html)
// Guarded back-to-top button (may exist in other pages)
const toTopBtn = document.getElementById("toTopBtn");
if (toTopBtn) {
  window.addEventListener('scroll', () => {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      toTopBtn.style.display = "block";
    } else {
      toTopBtn.style.display = "none";
    }
  });

  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Ganti URL Google Apps Script untuk penyimpanan database
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwpkVsItNbJ0A4SmL793E_XTs3FYF_O7IW7G0kadAmkQscXmHfVvJis5odDImEnwxunxA/exec';

// Data untuk simulasi (dalam aplikasi nyata, data akan diambil dari Google Sheets)
let pendaftarData = JSON.parse(localStorage.getItem('spmbData')) || [];

// Elemen DOM
const loginPage = document.getElementById('loginPage');
const userPage = document.getElementById('userPage');
const adminPage = document.getElementById('adminPage');

const loginOptions = document.querySelectorAll('.login-option');
const userLoginForm = document.getElementById('userLoginForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const userLoginBtn = document.getElementById('userLoginBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');

const spmbForm = document.getElementById('spmbForm');
const successMessage = document.getElementById('successMessage');
const loadingIndicator = document.getElementById('loadingIndicator');
const submitButton = document.getElementById('submitButton');

const refreshDataBtn = document.getElementById('refreshDataBtn');
const pendaftarTableBody = document.getElementById('pendaftarTableBody');
const dataCount = document.getElementById('dataCount');
const totalPendaftar = document.getElementById('totalPendaftar');
const pendaftarHariIni = document.getElementById('pendaftarHariIni');

// Event Listeners untuk login options
if (loginOptions) {
  loginOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Hapus kelas active dari semua options
      loginOptions.forEach(opt => opt.classList.remove('active'));
      // Tambahkan kelas active ke option yang diklik
      this.classList.add('active');

      const role = this.getAttribute('data-role');
      if (role === 'user') {
        userLoginForm.classList.add('active');
        adminLoginForm.classList.remove('active');
      } else if (role === 'admin') {
        userLoginForm.classList.remove('active');
        adminLoginForm.classList.add('active');
      }
    });
  });
}

// Login sebagai User
if (userLoginBtn) {
  userLoginBtn.addEventListener('click', function() {
    const userName = document.getElementById('userName').value;
    const userEmail = document.getElementById('userEmail').value;

    if (!userName || !userEmail) {
      alert('Harap isi nama dan email untuk melanjutkan.');
      return;
    }

    // Tampilkan halaman user
    showUserPage();
  });
}

// Login sebagai Admin
if (adminLoginBtn) {
  adminLoginBtn.addEventListener('click', function() {
    const adminUsername = document.getElementById('adminUsername').value;
    const adminPassword = document.getElementById('adminPassword').value;

    // Untuk demo, kita gunakan username dan password sederhana
    if (adminUsername === 'adminppdb' && adminPassword === 'smk2026') {
      // Tampilkan halaman admin
      showAdminPage();
    } else {
      alert('Username atau password salah!');
    }
  });
}

// Fungsi untuk menampilkan halaman login
function showLoginPage() {
  if (loginPage) loginPage.style.display = 'block';
  if (userPage) userPage.style.display = 'none';
  if (adminPage) adminPage.style.display = 'none';
}

// Fungsi untuk menampilkan halaman user
function showUserPage() {
  if (loginPage) loginPage.style.display = 'none';
  if (userPage) userPage.style.display = 'block';
  if (adminPage) adminPage.style.display = 'none';
}

// Fungsi untuk menampilkan halaman admin
function showAdminPage() {
  if (loginPage) loginPage.style.display = 'none';
  if (userPage) userPage.style.display = 'none';
  if (adminPage) adminPage.style.display = 'block';

  // Muat data pendaftar
  loadPendaftarData();
}

// Cek status login saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  showLoginPage();
});

// Form Pendaftaran
if (spmbForm) {
  spmbForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validasi form
    if (!validateForm()) {
      return;
    }

    // Tampilkan loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (submitButton) submitButton.disabled = true;
    if (successMessage) successMessage.style.display = 'none';

    // Ambil data dari form
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Tambahkan timestamp
    data.timestamp = new Date().toLocaleString('id-ID');
    data.id = Date.now(); // ID unik

    // Simpan data ke Google Apps Script
    sendToGoogleSheets(data);
  });
}

function validateForm() {
  const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = '#f72585';
    } else {
      field.style.borderColor = '#e9ecef';
    }
  });

  // Validasi checkbox persetujuan
  const agreement = document.getElementById('setuju');
  if (agreement && !agreement.checked) {
    isValid = false;
    agreement.parentElement.style.color = '#f72585';
  } else if (agreement) {
    agreement.parentElement.style.color = '';
  }

  return isValid;
}

function sendToGoogleSheets(data) {
  // Membuat FormData untuk dikirim
  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }

  // Mengirim data ke Google Apps Script
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(result => {
    console.log('Sukses mengirim ke Google Sheets:', result);

    // Simpan data ke localStorage sebagai backup
    saveToLocalStorage(data);

    // Sembunyikan loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (submitButton) submitButton.disabled = false;

    // Tampilkan pesan sukses
    if (successMessage) successMessage.style.display = 'block';

    // Reset form
    if (spmbForm) spmbForm.reset();

    // Scroll ke pesan sukses
    if (successMessage) successMessage.scrollIntoView({ behavior: 'smooth' });
  })
  .catch(error => {
    console.error('Error mengirim ke Google Sheets:', error);

    // Sembunyikan loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (submitButton) submitButton.disabled = false;

    // Tetap tampilkan pesan sukses meskipun ada error
    if (successMessage) successMessage.style.display = 'block';

    // Simpan data ke localStorage sebagai backup
    saveToLocalStorage(data);

    // Reset form
    if (spmbForm) spmbForm.reset();

    // Scroll ke pesan sukses
    if (successMessage) successMessage.scrollIntoView({ behavior: 'smooth' });
  });
}

function saveToLocalStorage(data) {
  // Tambah data baru
  pendaftarData.push(data);

  // Simpan kembali ke localStorage
  localStorage.setItem('spmbData', JSON.stringify(pendaftarData));

  console.log('Data disimpan di localStorage:', data);
}

// Fungsi untuk memuat data pendaftar (Admin)
// Fungsi untuk memuat data pendaftar (Admin)
async function loadPendaftarData() {
  // Try to fetch data from server (Google Sheets via Apps Script)
  let dataFromServer = null;
  try {
    dataFromServer = await fetchAllDataFromServer(20000).catch(() => null);
  } catch (err) {
    console.warn('Error fetching server data:', err);
    dataFromServer = null;
  }

  if (Array.isArray(dataFromServer) && dataFromServer.length > 0) {
    // Normalize server data keys to expected keys used in the UI
    pendaftarData = dataFromServer.map((row, idx) => {
      // helper to find a field in row by matching key substrings
      const find = (...candidates) => {
        for (const cand of candidates) {
          // direct match
          if (row.hasOwnProperty(cand)) return row[cand];
        }
        // case-insensitive substring match
        const keys = Object.keys(row);
        for (const cand of candidates) {
          const lc = cand.toLowerCase();
          for (const k of keys) {
            if (k.toLowerCase().includes(lc)) return row[k];
          }
        }
        return undefined;
      };

      const nama = find('nama', 'nama_lengkap', 'name', 'full_name') || '-';
      const asal_sekolah = find('asal_sekolah', 'asal', 'asal sekolah', 'school') || '-';
      const jurusan_dipilih = find('jurusan_dipilih', 'jurusan', 'major') || '-';
      const no_hp = find('no_hp', 'hp', 'no. hp', 'phone', 'telephone') || find('telepon') || '-';
      const timestamp = find('timestamp', 'tanggal', 'date', 'waktu', 'tanggal daftar') || '';
      const id = row.id || row.ID || Date.now() + idx;

      return {
        id,
        nama,
        asal_sekolah,
        jurusan_dipilih,
        no_hp,
        timestamp
      };
    });

    // Save backup to localStorage
    try { localStorage.setItem('spmbData', JSON.stringify(pendaftarData)); } catch (e) { console.warn('Could not save backup to localStorage', e); }
  } else {
    // fallback to localStorage
    pendaftarData = JSON.parse(localStorage.getItem('spmbData')) || [];
  }

  // Update statistik
  if (totalPendaftar) totalPendaftar.textContent = pendaftarData.length;

  // Hitung pendaftar hari ini
  const today = new Date().toLocaleDateString('id-ID');
  const todayCount = pendaftarData.filter(item => {
    return item.timestamp && item.timestamp.includes && item.timestamp.includes(today);
  }).length;
  if (pendaftarHariIni) pendaftarHariIni.textContent = todayCount;

  // Update tabel
  updatePendaftarTable();
}

function updatePendaftarTable() {
  if (!pendaftarTableBody) return;
  pendaftarTableBody.innerHTML = '';

  if (pendaftarData.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="6" style="text-align: center; padding: 30px;">Belum ada data pendaftar</td>`;
    pendaftarTableBody.appendChild(row);
    if (dataCount) dataCount.textContent = 'Menampilkan 0 data';
    return;
  }

  // Urutkan data berdasarkan ID (timestamp) terbaru
  const sortedData = [...pendaftarData].sort((a, b) => b.id - a.id);

  sortedData.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.nama || '-'}</td>
      <td>${item.asal_sekolah || '-'}</td>
      <td>${item.jurusan_dipilih || '-'}</td>
      <td>${item.no_hp || '-'}</td>
      <td>${item.timestamp || '-'}</td>
    `;
    pendaftarTableBody.appendChild(row);
  });

  if (dataCount) dataCount.textContent = `Menampilkan ${pendaftarData.length} data`;
}

// Event listener untuk refresh data
if (refreshDataBtn) {
  refreshDataBtn.addEventListener('click', function() {
    loadPendaftarData();
  });
}

// Fungsi untuk menghasilkan PDF
// Helper: coba ambil semua data dari server (Google Apps Script) dengan timeout
// Strategi: coba fetch biasa (JSON). Jika gagal (CORS atau error), coba fallback ke JSONP (script tag dengan callback).
async function fetchAllDataFromServer(timeoutMs = 20000) {
  // Use the unified auto-detect fetch which supports both Apps Script exec and direct Google Sheets links.
  return await fetchDataFromSheetAuto(timeoutMs);
}

// Generate PDF dari array data yang diberikan
function generatePDF(dataArray) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('DATA PENDAFTAR SPMB', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('SMK BINA PUTERA BOGOR', 105, 22, { align: 'center' });
  doc.text('TAHUN AJARAN 2026/2027', 105, 29, { align: 'center' });

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${currentDate}`, 14, 40);

  const tableData = [];
  const headers = ['No', 'Nama Lengkap', 'Asal Sekolah', 'Jurusan', 'No. HP', 'Tanggal Daftar'];

  // Pastikan dataArray diurutkan berdasarkan id (jika ada) atau waktu
  const sorted = Array.isArray(dataArray) ? [...dataArray] : [];
  if (sorted.length && sorted[0].id !== undefined) {
    sorted.sort((a, b) => a.id - b.id); // dari awal ke akhir
  }

  sorted.forEach((item, index) => {
    tableData.push([
      index + 1,
      item.nama || '-',
      item.asal_sekolah || '-',
      item.jurusan_dipilih || '-',
      item.no_hp || '-',
      item.timestamp || '-'
    ]);
  });

  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 45 }
  });

  doc.save(`Data_Pendaftar_SMB_${new Date().toISOString().slice(0,10)}.pdf`);
}

// Reset border color ketika user mulai mengetik
document.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('input', function() {
    this.style.borderColor = '#e9ecef';
  });
});

// ===== FITUR DOWNLOAD REKAP DARI GOOGLE SHEET =====

// Tombol download rekap dari sheet
const downloadSheetPDFBtn = document.getElementById('downloadSheetPDFBtn');
if (downloadSheetPDFBtn) {
  downloadSheetPDFBtn.addEventListener('click', async function() {
    downloadSheetPDFBtn.disabled = true;
    const originalText = downloadSheetPDFBtn.innerHTML;
    downloadSheetPDFBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengambil data...';
    
    try {
      const sheetData = await fetchDataFromSheetAuto();
      if (!sheetData || sheetData.length === 0) {
        alert('Tidak ada data di Sheet atau Server tidak dapat diakses. Pastikan Apps Script sudah di-deploy dan SCRIPT_URL benar.');
        return;
      }
      
      // Generate PDF dari data sheet
      generatePDFFromSheet(sheetData);
      alert('Download rekap Sheet berhasil! Total data: ' + sheetData.length);
    } catch (err) {
      console.error('Error mengunduh rekap Sheet:', err);
      alert('Gagal mengunduh rekap Sheet.\n\nError: ' + err.message + '\n\nPastikan Apps Script sudah di-deploy.');
    } finally {
      downloadSheetPDFBtn.disabled = false;
      downloadSheetPDFBtn.innerHTML = originalText;
    }
  });
}

// Fungsi: Fetch data dari Google Sheet via Apps Script
async function fetchDataFromSheet(timeoutMs = 10000) {
  if (!SCRIPT_URL || SCRIPT_URL.length < 10) {
    throw new Error('SCRIPT_URL tidak dikonfigurasi dengan benar');
  }
  
  const url = SCRIPT_URL + '?action=getAll';
  console.log('Fetching from:', url);
  
  try {
    // Attempt 1: Fetch JSON biasa
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const json = await response.json();
      console.log('Data dari server:', json);
      
      // Handle berbagai format response
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.data)) return json.data;
      if (json && Array.isArray(json.records)) return json.records;
      
      // Cari properti yang berisi array
      for (const key in json) {
        if (Array.isArray(json[key]) && json[key].length > 0) return json[key];
      }
      
      throw new Error('Response tidak berisi array data yang valid');
    } else {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  } catch (fetchErr) {
    console.warn('Fetch JSON gagal, coba JSONP:', fetchErr.message);
    
    // Attempt 2: JSONP fallback
    return fetchViaJSONP(url, timeoutMs);
  }
}

// Fallback JSONP untuk bypass CORS
function fetchViaJSONP(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    let timeoutHandle = null;
    let scriptTag = null;
    let resolved = false;
    
    window[callbackName] = function(data) {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.log('JSONP callback data:', data);
        resolve(data);
      }
    };
    
    function cleanup() {
      clearTimeout(timeoutHandle);
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
      try { delete window[callbackName]; } catch(e) {}
    }
    
    scriptTag = document.createElement('script');
    scriptTag.src = url + '&callback=' + callbackName;
    scriptTag.onerror = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('JSONP script load error atau timeout'));
      }
    };
    document.head.appendChild(scriptTag);
    console.log('JSONP request:', scriptTag.src);
    
    timeoutHandle = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('JSONP timeout setelah ' + timeoutMs + 'ms'));
      }
    }, timeoutMs);
  });
}

// Fungsi: Generate PDF dari data Sheet dengan format yang lebih lengkap
function generatePDFFromSheet(sheetData) {
  console.log('generatePDFFromSheet called with data:', sheetData);
  console.log('Data length:', sheetData ? sheetData.length : 0);
  
  // Validasi data
  if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
    alert('Tidak ada data untuk di-generate PDF. Data yang diterima: ' + JSON.stringify(sheetData));
    console.error('Data kosong atau tidak valid:', sheetData);
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode untuk lebih banyak kolom
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(67, 97, 238);
  doc.text('REKAP DATA PENDAFTAR SPMB', 148, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('SMK BINA PUTERA BOGOR', 148, 22, { align: 'center' });
  doc.text('Tahun Ajaran 2026/2027', 148, 28, { align: 'center' });
  
  // Tanggal cetak
  const now = new Date();
  const printDate = now.toLocaleDateString('id-ID', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak: ${printDate} | Total Data: ${sheetData.length}`, 14, 36);
  
  // Auto-generate headers dari kolom sheet (skip Timestamp dan Setuju untuk clarity)
  const columnsToSkip = ['Timestamp', 'Setuju'];
  let headers = [];
  let columnKeys = [];
  
  if (sheetData.length > 0) {
    const firstRow = sheetData[0];
    columnKeys = Object.keys(firstRow).filter(k => !columnsToSkip.includes(k));
    headers = columnKeys.map((k, idx) => `${idx + 1}`); // Nomor urut kolom
  }
  
  console.log('Column keys:', columnKeys);
  console.log('Headers:', headers);
  
  // Prepare table data dengan SEMUA kolom
  const tableData = [];
  console.log('Processing ' + sheetData.length + ' rows...');
  sheetData.forEach((item, idx) => {
    const row = columnKeys.map(key => {
      let val = item[key];
      // Handle Google Visualization Date format: Date(2025,10,14,20,22,28)
      if (typeof val === 'string' && val.startsWith('Date(')) {
        // Extract year, month, day dari Date(YYYY,M,D,...)
        const match = val.match(/Date\((\d+),(\d+),(\d+)/);
        if (match) {
          const year = match[1];
          const month = String(parseInt(match[2]) + 1).padStart(2, '0'); // bulan dimulai dari 0
          const day = String(match[3]).padStart(2, '0');
          val = `${day}/${month}/${year}`;
        }
      }
      return String(val || '').substring(0, 20); // Batasi 20 char
    });
    tableData.push(row);
  });
  
  // Buat tabel dengan ALL columns
  doc.autoTable({
    head: [columnKeys.map((k, idx) => {
      // Shorten column headers untuk fit
      const short = k.length > 12 ? k.substring(0, 10) + '.' : k;
      return short;
    })],
    body: tableData,
    startY: 42,
    margin: { left: 8, right: 8 },
    headStyles: {
      fillColor: [67, 97, 238],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 40
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250]
    }
  });
  
  // Footer dengan proper page count handling
  try {
    const pageCount = doc.internal.getPages().length;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Halaman ${i} dari ${pageCount}`, 148, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
  } catch (err) {
    console.warn('Error adding footer page numbers:', err);
  }
  
  // Download
  const filename = `Rekap_SPMB_Lengkap_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  console.log('PDF generated:', filename, 'with', columnKeys.length, 'columns');
}

// Helper tambahan: fetch dengan deteksi apakah SCRIPT_URL adalah link Google Sheets
async function fetchDataFromSheetAuto(timeoutMs = 20000) {
  // Jika SCRIPT_URL menunjuk ke google spreadsheet (docs.google.com/spreadsheets/d/...),
  // gunakan gviz endpoint atau CSV export. Jika tidak, fallback ke fetchDataFromSheet (Apps Script).
  try {
    const isSpreadsheetUrl = /docs\.google\.com\/spreadsheets\/d\//i.test(SCRIPT_URL);
    if (!isSpreadsheetUrl) {
      // gunakan fungsi yang sudah ada (Apps Script)
      return await fetchDataFromSheet(timeoutMs);
    }

    // extract spreadsheet id and gid
    const idMatch = SCRIPT_URL.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = SCRIPT_URL.match(/[?&]gid=(\d+)/);
    const sheetId = idMatch ? idMatch[1] : null;
    const gid = gidMatch ? gidMatch[1] : '0';
    if (!sheetId) throw new Error('Tidak dapat mengekstrak spreadsheet ID dari SCRIPT_URL');

    // 1) coba gviz
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    try {
      console.log('Attempting gviz fetch from:', gvizUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(gvizUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res && res.ok) {
        const text = await res.text();
        console.log('gviz response received, length:', text.length);
        const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\)/);
        const jsonText = m ? m[1] : text;
        const obj = JSON.parse(jsonText);
        if (obj && obj.table) {
          const cols = obj.table.cols.map(c => (c && (c.label || c.id)) || '');
          const rows = obj.table.rows || [];
          console.log('gviz columns:', cols);
          console.log('gviz rows count:', rows.length);
          const data = rows.map(r => {
            const out = {};
            (r.c || []).forEach((cell, idx) => {
              out[cols[idx] || `col_${idx}`] = cell ? (cell.v !== undefined ? cell.v : '') : '';
            });
            return out;
          });
          console.log('gviz data parsed, returning:', data.length, 'rows');
          return data;
        }
      }
    } catch (err) {
      console.warn('gviz fetch failed:', err && err.message);
    }

    // 2) coba CSV export
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    try {
      console.log('Attempting CSV fetch from:', csvUrl);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), timeoutMs);
      const res2 = await fetch(csvUrl, { method: 'GET', signal: controller2.signal });
      clearTimeout(timeoutId2);
      if (res2 && res2.ok) {
        const csvText = await res2.text();
        console.log('CSV response received, length:', csvText.length);
        const parsed = parseCSV(csvText);
        console.log('CSV data parsed, returning:', parsed.length, 'rows');
        if (parsed && parsed.length) return parsed;
      }
    } catch (err) {
      console.warn('CSV fetch failed:', err && err.message);
    }

    throw new Error('Gagal mengambil data dari Google Sheets via gviz/csv. Pastikan spreadsheet di-share publik: buka Sheet → Share → "Anyone with the link" (Viewer).');
  } catch (err) {
    // Throw error dari gviz/csv (informasi lebih jelas untuk user)
    throw err;
  }
}

// Simple CSV parser untuk fallback
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return [];
  const headers = parseCSVRow(lines[0]);
  const rows = lines.slice(1).map(parseCSVRow);
  return rows.map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i] || `col_${i}`] = r[i] !== undefined ? r[i] : '';
    }
    return obj;
  });
}

function parseCSVRow(rowText) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < rowText.length; i++) {
    const ch = rowText[i];
    if (ch === '"') {
      if (inQuotes && rowText[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else { cur += ch; }
  }
  result.push(cur);
  return result;
}

// ===== END FITUR DOWNLOAD SHEET =====

