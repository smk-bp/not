# Fitur Download Rekap dari Google Sheet

## Deskripsi
Menambahkan tombol di halaman admin untuk download PDF berisi **semua data dari Google Sheet** (bukan hanya data lokal `localStorage`).

## Cara Implementasi

### 1. Tambahkan Tombol di HTML (`ppdb.html`)

Cari bagian `<div class="admin-controls">` dan ubah menjadi:

```html
<div class="admin-controls">
  <button class="btn btn-success" id="refreshDataBtn">
    <i class="fas fa-sync-alt"></i> Refresh Data
  </button>
  <button class="btn btn-warning" id="downloadPDFBtn">
    <i class="fas fa-file-pdf"></i> Download PDF
  </button>
  <button class="btn btn-info" id="downloadSheetPDFBtn">
    <i class="fas fa-download"></i> Download Rekap Sheet
  </button>
</div>
```

**Catatan:** Jika tombol ketiga tidak muncul dengan warna biru, tambahkan CSS di `web.css`:
```css
.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(23, 162, 184, 0.3);
}
```

---

### 2. Tambahkan Fungsi di `web.js`

Tambahkan kode berikut di akhir `web.js` (sebelum closing):

```javascript
// ===== FITUR DOWNLOAD REKAP DARI GOOGLE SHEET =====

// Tombol download rekap dari sheet
const downloadSheetPDFBtn = document.getElementById('downloadSheetPDFBtn');
if (downloadSheetPDFBtn) {
  downloadSheetPDFBtn.addEventListener('click', async function() {
    downloadSheetPDFBtn.disabled = true;
    downloadSheetPDFBtn.textContent = 'Mengambil data...';
    
    try {
      const sheetData = await fetchDataFromSheet();
      if (!sheetData || sheetData.length === 0) {
        alert('Tidak ada data di Sheet atau Server tidak dapat diakses. Pastikan Apps Script sudah di-deploy.');
        return;
      }
      
      // Generate PDF dari data sheet
      generatePDFFromSheet(sheetData);
      alert('Download rekap Sheet berhasil!');
    } catch (err) {
      console.error('Error mengunduh rekap Sheet:', err);
      alert('Gagal mengunduh rekap Sheet. Error: ' + err.message);
    } finally {
      downloadSheetPDFBtn.disabled = false;
      downloadSheetPDFBtn.textContent = '📥 Download Rekap Sheet';
    }
  });
}

// Fungsi: Fetch data dari Google Sheet via Apps Script
async function fetchDataFromSheet(timeoutMs = 10000) {
  if (!SCRIPT_URL) throw new Error('SCRIPT_URL tidak dikonfigurasi');
  
  const url = SCRIPT_URL + '?action=getAll';
  
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
      
      // Handle berbagai format response
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.data)) return json.data;
      
      // Cari properti yang berisi array
      for (const key in json) {
        if (Array.isArray(json[key])) return json[key];
      }
      
      throw new Error('Response tidak berisi array data');
    } else {
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (fetchErr) {
    console.warn('Fetch JSON gagal, coba JSONP:', fetchErr);
    
    // Attempt 2: JSONP fallback
    return fetchViaJSONP(url, timeoutMs);
  }
}

// Fallback JSONP untuk bypass CORS
function fetchViaJSONP(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    let timeoutHandle = null;
    let scriptTag = null;
    
    window[callbackName] = function(data) {
      cleanup();
      resolve(data);
    };
    
    function cleanup() {
      clearTimeout(timeoutHandle);
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
      delete window[callbackName];
    }
    
    scriptTag = document.createElement('script');
    scriptTag.src = url + '&callback=' + callbackName;
    scriptTag.onerror = () => {
      cleanup();
      reject(new Error('JSONP script load error'));
    };
    document.head.appendChild(scriptTag);
    
    timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, timeoutMs);
  });
}

// Fungsi: Generate PDF dari data Sheet dengan format yang lebih lengkap
function generatePDFFromSheet(sheetData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(67, 97, 238);
  doc.text('REKAP DATA PENDAFTAR SPMB', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('SMK BINA PUTERA BOGOR', 105, 22, { align: 'center' });
  doc.text('Tahun Ajaran 2026/2027', 105, 28, { align: 'center' });
  
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
  
  // Normalize dan prepare data untuk tabel
  const tableData = [];
  const headers = ['No', 'Nama', 'Asal Sekolah', 'Jurusan', 'No. HP', 'Tanggal Daftar'];
  
  sheetData.forEach((item, idx) => {
    const nama = item.nama || item.nama_lengkap || item.name || '-';
    const sekolah = item.asal_sekolah || item.asal || item.school || '-';
    const jurusan = item.jurusan_dipilih || item.jurusan || item.major || '-';
    const hp = item.no_hp || item.hp || item.phone || item.telepon || '-';
    const tanggal = item.timestamp || item.tanggal || item.date || '-';
    
    tableData.push([
      idx + 1,
      String(nama).substring(0, 25),
      String(sekolah).substring(0, 20),
      String(jurusan).substring(0, 20),
      String(hp).substring(0, 15),
      String(tanggal).substring(0, 20)
    ]);
  });
  
  // Buat tabel
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 42,
    margin: { left: 10, right: 10 },
    headStyles: {
      fillColor: [67, 97, 238],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 40
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250]
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 }
    }
  });
  
  // Footer
  const pageCount = doc.internal.getPages().length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }
  
  // Download
  const filename = `Rekap_SPMB_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ===== END FITUR DOWNLOAD SHEET =====
```

---

## Langkah Persiapan Google Apps Script

Jika belum, deploy Apps Script yang mengembalikan data Sheet:

1. Buka https://script.google.com
2. Buat proyek baru
3. Ganti isi dengan:

```javascript
const SPREADSHEET_ID = '1Zt1Rmj6oTf4VJ9yAQvSgPR-ZxDVoJMx377sH94pVifs';
const SHEET_NAME = 'PPDB 2026 DATA'; // sesuaikan nama sheet

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return jsonResponse({ error: 'Sheet tidak ditemukan' }, e);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse([], e);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    const result = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
    
    return jsonResponse(result, e);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, e);
  }
}

function jsonResponse(payload, e) {
  const callback = e && e.parameter && e.parameter.callback;
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Deploy → New Deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copy URL dan pasang ke `web.js` line 21:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/1Zt1Rmj6oTf4VJ9yAQvSgPR-ZxDVoJMx377sH94pVifs/exec';
   ```

---

## Testing

1. Buka `ppdb.html` → Login Admin
2. Tombol "📥 Download Rekap Sheet" muncul di samping tombol "Download PDF"
3. Klik tombol → akan fetch data dari Sheet dan generate PDF
4. File PDF unduh dengan data lengkap dari Sheet

---

## Troubleshooting

- **"Tidak ada data di Sheet"** → Apps Script belum di-deploy atau SPREADSHEET_ID salah
- **Tombol tidak muncul** → Pastikan HTML sudah diubah (tombol downloadSheetPDFBtn)
- **PDF kosong** → Check Console untuk error, pastikan Sheet punya data & header

