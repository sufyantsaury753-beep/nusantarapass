# 📋 PANDUAN LENGKAP PEMBUATAN GOOGLE FORM UJI PENGGUNA (SUS)
**Karya:** NusantaraPass — Web Development Competition UINIC 8.0  
**Target Pengumpulan Responden:** 20 – 28 Oktober 2026 (Minimal 10–15 Responden)  
**Tautan Web Demo:** [https://sufyantsaury753-beep.github.io/nusantarapass/](https://sufyantsaury753-beep.github.io/nusantarapass/)

---

## ⚡ CARA 1: OTOMATIS 10 DETIK DENGAN GOOGLE APPS SCRIPT (Sangat Praktis)

Anda tidak perlu membuat pertanyaan satu per satu secara manual. Gunakan script otomatis ini:

1. Buka peramban (browser) dan ketik tautan: **[https://script.new](https://script.new)** (pastikan sudah login akun Google Anda).
2. Hapus semua tulisan di editor tersebut, lalu **Copy-Paste seluruh kode di bawah ini**:

```javascript
function createNusantaraPassSUSForm() {
  var form = FormApp.create('Kuesioner Pengujian Sistem (SUS) — NusantaraPass WebGIS');
  
  form.setDescription(
    'Halo! Terima kasih atas ketersediaan Anda menjadi responden pengujian platform "NusantaraPass" untuk kompetisi Web Development UINIC 8.0 (UIN Sunan Kalijaga Yogyakarta).\n\n' +
    '📌 TAUTAN WEB DEMO (Silakan coba buka 1-2 menit di HP/Laptop):\n' +
    'https://sufyantsaury753-beep.github.io/nusantarapass/\n\n' +
    'Skenario yang disarankan untuk dicoba:\n' +
    '1. Buka peta interaktif, coba filter kategori & cari destinasi (misal Candi Borobudur / TN Komodo).\n' +
    '2. Buka halaman detail destinasi, lihat sisa kuota kapasitas, dan coba klik "Terbitkan NusantaraPass (Direct Pass)".\n' +
    '3. Berikan penilaian jujur Anda pada 10 pertanyaan di bawah ini (Skala 1 = Sangat Tidak Setuju, 5 = Sangat Setuju).'
  );
  
  // 1. Identitas Responden
  form.addTextItem().setTitle('Nama Lengkap / Inisial:').setRequired(true);
  
  var roleItem = form.addMultipleChoiceItem();
  roleItem.setTitle('Kategori Peran / Latar Belakang Anda:')
    .setChoiceValues([
      'Wisatawan Umum / Mahasiswa',
      'Pengelola Wisata / Pokdarwis / Komunitas Pecinta Alam',
      'Mahasiswa Informatika / IT / Akademisi'
    ])
    .setRequired(true);

  // 2. 10 Pertanyaan Standar SUS (System Usability Scale)
  var questions = [
    "1. Saya rasa saya ingin sering menggunakan sistem NusantaraPass ini.",
    "2. Saya merasa sistem ini terlalu rumit untuk digunakan.",
    "3. Saya merasa sistem ini sangat mudah untuk digunakan.",
    "4. Saya rasa saya memerlukan bantuan orang teknis untuk dapat menggunakan sistem ini.",
    "5. Saya menemukan berbagai fungsi dalam sistem ini terintegrasi dengan sangat baik.",
    "6. Saya rasa terlalu banyak ketidakkonsistenan dalam sistem ini.",
    "7. Saya membayangkan sebagian besar orang akan mempelajari cara menggunakan sistem ini dengan sangat cepat.",
    "8. Saya merasa sistem ini sangat membingungkan ketika digunakan.",
    "9. Saya merasa sangat percaya diri saat menggunakan sistem ini.",
    "10. Saya perlu mempelajari banyak hal baru sebelum saya dapat mengoperasikan sistem ini dengan baik."
  ];

  for (var i = 0; i < questions.length; i++) {
    var scaleItem = form.addScaleItem();
    scaleItem.setTitle(questions[i])
      .setBounds(1, 5)
      .setLabels('Sangat Tidak Setuju', 'Sangat Setuju')
      .setRequired(true);
  }

  // 3. Umpan Balik Kualitatif
  form.addParagraphTextItem()
    .setTitle('Apa fitur atau kelebihan yang paling Anda sukai dari NusantaraPass?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Kritik, kendala, atau saran perbaikan untuk pengembangan ke depan?')
    .setRequired(false);

  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Edit URL: ' + form.getEditUrl());
}
```

3. Klik tombol **Run (Jalankan)** di bagian atas.
4. Klik **Review Permissions** &rarr; Pilih Akun Google Anda &rarr; Klik **Advanced (Lanjutan)** &rarr; Klik **Go to Untitled project (unsafe)** &rarr; Klik **Allow**.
5. Selesai! Buka **Google Drive** Anda, Google Form sudah jadi 100% lengkap.
6. Klik tombol **Send (Kirim)** pada Google Form untuk mengambil link kuesionernya (atau klik **Shorten URL**).

---

## ✍️ CARA 2: INPUT MANUAL LEWAT GOOGLE FORM (Jika Ingin Manual)

Jika ingin membuat manual di [forms.google.com](https://forms.google.com):
* **Judul Form:** Kuesioner Pengujian Sistem (SUS) — NusantaraPass WebGIS
* **Pertanyaan Identitas:**
  1. *Nama / Inisial* (Jawaban Singkat - Wajib)
  2. *Kategori Peran* (Pilihan Ganda: Wisatawan Umum / Pengelola Wisata / Mahasiswa IT - Wajib)
* **Pertanyaan SUS 1 s.d. 10 (Pilih Tipe: Skala Linier 1 sampai 5):**
  * Label 1: *Sangat Tidak Setuju*
  * Label 5: *Sangat Setuju*
  *(Copy teks 10 pertanyaan dari daftar pertanyaan di atas).*
* **Pertanyaan Penutup (Tipe: Paragraf):**
  * Masukan / Kelebihan / Saran Perbaikan.

---

## 🧮 CARA MENGHITUNG SKOR SUS DARI GOOGLE SHEET RESPONS

Setelah 10–15 orang mengisi form Anda:
1. Di tab **Responses (Respons)** pada Google Form, klik ikon hijau **"Link to Sheets"** untuk membuka Google Spreadsheet.
2. Setiap pertanyaan bernilai angka 1 sampai 5.
3. Rumus baku skor SUS per orang (baris):
   * Untuk pertanyaan **GANJIL (Q1, Q3, Q5, Q7, Q9)**: `Skor = Jawaban - 1`
   * Untuk pertanyaan **GENAP (Q2, Q4, Q6, Q8, Q10)**: `Skor = 5 - Jawaban`
   * **Total Skor Orang Tersebut** = `(Jumlah Seluruh Nilai Ganjil + Genap) * 2.5`
4. Rata-ratakan skor dari seluruh responden.

### Formula Excel / Google Sheets Otomatis:
Jika kolom jawaban Q1 ada di `C2` sampai Q10 di `L2`, masukkan rumus ini di kolom `M2`:
```excel
=((C2-1) + (5-D2) + (E2-1) + (5-F2) + (G2-1) + (5-H2) + (I2-1) + (5-J2) + (K2-1) + (5-L2)) * 2.5
```
Tarik rumus ke bawah untuk seluruh responden, lalu hitung rata-ratanya dengan:
```excel
=AVERAGE(M2:M16)
```

---

## 💬 CONTOH FORMAT CHAT BROADCAST KE TEMAN-TEMAN:

Salin pesan ini saat mengirimkan link form ke teman kampus / grup WA:

> *Halo teman-teman! Minta tolong bantuannya 1–2 menit yaa untuk mengisi survei pengujian platform webgis pariwisata NusantaraPass yang saya ikutkan di lomba Web Development UINIC 8.0 UIN Sunan Kalijaga.* 🙏
>
> 🌐 **Coba webnya di sini:**  
> https://sufyantsaury753-beep.github.io/nusantarapass/  
> *(Bisa dicoba lihat peta, filter kategori, atau klik terbitkan tiket)*
>
> 📝 **Link Isi Kuesioner (Hanya 10 Pertanyaan Cepat):**  
> `[MASUKKAN LINK GOOGLE FORM ANDA DI SINI]`
>
> *Bantuan teman-teman sangat berarti untuk riset dan kelulusan karya saya di kompetisi ini. Terima kasih banyak sebelumnya!* 🙌✨
