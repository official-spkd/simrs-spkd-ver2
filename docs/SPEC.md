# SPEC — Rincian Halaman MVP SIMRS SPKD (transkripsi dari PDF, 13 Okt 2026)

Alur inti: Pendaftaran (Loket + APM) → Poliklinik + EMR SOAP → Kasir (invoice). 44 halaman (KL-07 ditunda).
Pola semua halaman: worklist → workspace → aksi dalam modal → konfirmasi → toast + badge status.
Kolom **Aksi** = tombol yang harus ada. **Validasi** = aturan yang ditegakkan (di prototipe: di action `useDb`).
Serah terima antar role HANYA lewat status kunjungan: `terdaftar → dilayani → selesai → lunas`, cabang `dibatalkan` (hanya dari terdaftar). Status antrean poli, SEP, tagihan, Satu Sehat = badge terpisah.
Setiap simpan: tulis DB lokal dulu lalu antrekan kirim ke Satu Sehat (outbox). Gangguan Satu Sehat/BPJS tidak pernah menghentikan loket/poli/kasir.

Patient Banner (nama, No. RM, NIK, umur/JK, alergi, penjamin) wajib tampil di: FO-04/05, KL-02..KL-06, KS-02..KS-04.

## Role & halaman
- Front Office: FO-01..FO-09 harian; FO-10 Jadwal & Kuota (baca), FO-11 Monitor Antrean Poli.
- Dokter/Perawat (SATU akun bersama): KL-01..KL-06; baca KL-08, FO-04.
- Kasir: KS-01..KS-05; baca FO-04 ringkas.
- Management: MG-01..MG-03, FO-11 (baca).
- IT/Superadmin: IT-01..IT-07, baca semua halaman.
- Pasien via APM: APM-01..APM-07. Display TV: VWR-01, VWR-02.

## Global
- GL-01 Login: username, password, logo RS, indikator koneksi DB & Satu Sehat (hijau/merah). Aksi: Masuk; lupa password (ke IT). Login tercatat audit (siapa, kapan, IP); role tidak aktif ditolak.
- GL-02 App Shell: sidebar per role, omnibox Ctrl+K, lonceng, badge Satu Sehat, profil, breadcrumb, beranda per role = ringkasan hari ini (FO: antrean & kunjungan; Dokter: pasien menunggu; Kasir: tagihan belum bayar; Manajemen: KPI; IT: status integrasi).

## Front Office
**FO-01 Worklist Pendaftaran** — Omnibox besar "Cari NIK / No. BPJS / No. RM / Nama" + tombol "+ Pasien Baru"; panel kiri: antrean loket (nomor sedang dipanggil, sisa antrean, tombol Panggil berikutnya/Lewati); panel kanan: tabel kunjungan hari ini (No. antrean poli, RM, nama, poli, dokter, penjamin, status kunjungan, antrean poli, badge Satu Sehat, aksi Detail/Audit); kartu "Reservasi menunggu check-in". Aksi: Cari, Pasien Baru, Panggil berikutnya, buka detail kunjungan (klik baris), filter poli/status. Status: terdaftar → dilayani → selesai → lunas; dibatalkan. Info: "Menunggu poli merupakan status antrean, bukan status kunjungan."
**FO-02 Cari Pasien (modal)** — SUDAH ADA: components/PatientSearchModal.vue. Input + tipe (NIK/BPJS/RM/Nama); hasil: RM, nama, tgl lahir, NIK tersamar, penjamin terakhir, kunjungan terakhir; "tidak ditemukan → daftarkan baru". NIK 16 digit; hasil dicatat audit.
**FO-03 Form Pasien Baru** — Tab Demografi: NIK*, nama*, tgl lahir*, JK*, tempat lahir, agama, pendidikan, pekerjaan, status kawin, golongan darah; Tab Kontak: No. HP*, email, alamat KTP*, alamat domisili; Tab Penanggung jawab: nama*, hubungan*, No. HP*; Tab Penjamin: default Umum / BPJS (No. kartu) / Asuransi (nama + No. polis); alergi (teks). Aksi: Simpan; Simpan & Buat Kunjungan (→ FO-05). Validasi: NIK unik (409 bila sudah ada, tampilkan RM pemilik); No. RM otomatis; cek duplikat nama+tgl lahir.
**FO-04 Detail Pasien & Riwayat** — Patient Banner; tab Demografi/Kontak/Penjamin/Penanggung jawab (edit); tab Riwayat Kunjungan (tanggal, poli, dokter, diagnosis utama, status bayar); tab Dokumen (lampiran EMR, invoice). Aksi: Edit data, + Kunjungan, + Reservasi, cetak kartu pasien. Perubahan identitas tercatat audit; dokter/kasir HANYA BACA.
**FO-05 Form Kunjungan (wizard 4 langkah)** — ① Penjamin (Umum/BPJS/Asuransi; BPJS/Asuransi buka panel FO-06) ② Poli & Dokter (hanya poli aktif hari ini; dokter berjadwal; sisa kuota "8/15"; dokter penuh dinonaktifkan) ③ Keterangan (jenis kunjungan baru/kontrol, keluhan singkat, penanggung jawab, centang persetujuan umum, unggah/catat dokumen administratif: surat rujukan FKTP atau surat kontrol bila kontrol) ④ Ringkasan + preview nomor antrean "PD-012". Aksi: Lanjut/Kembali, Daftarkan, Daftarkan & Cetak (tiket 80 mm). Validasi: kuota dikunci atomik saat Daftarkan (409 bila habis); satu kunjungan aktif per pasien per poli per hari; persetujuan umum wajib.
**FO-06 Panel Penjamin & SEP** — BPJS: No. kartu/NIK → Cek kepesertaan (status aktif, kelas, tersamar), No. rujukan / No. surat kontrol diketik manual + lampiran dokumen administratif, tombol Buat SEP; Asuransi: nama asuransi, No. polis, plafon; chip status SEP: Menunggu / Terbit / Ditolak / Gagal kirim. Aksi: Cek kepesertaan, Buat SEP, Kirim ulang SEP, Cetak SEP. SEP dibuat pending saat registrasi, dikirim worker (stub VClaim); poli TIDAK diblokir SEP pending.
**FO-07 Pemanggilan Antrean Loket** — Pilih loket (Loket 1/2/…); kartu besar nomor sedang dipanggil; daftar menunggu (nomor, kanal asal loket/APM/reservasi, jam ambil); sisa antrean; tombol besar Panggil berikutnya, Panggil ulang, Lewati, Selesai; klik nomor → buka detail pendaftaran. Aksi: Panggil, Panggil ulang, Lewati, Selesai, Ambil nomor manual. Dua loket tidak bisa memanggil nomor yang sama (lock); setiap aksi masuk log antrean dan dipancarkan ke VWR-01 real-time.
**FO-08 Daftar Reservasi** — Tabel reservasi hari ini & ke depan: kode booking, pasien, poli, dokter, tanggal, kanal (loket/APM), status (booked/check-in/batal/no-show); form + Reservasi (pasien, poli, dokter, tanggal maks. 30 hari). Aksi: Tambah, Check-in (hari H → terbit nomor antrean), Jadwal ulang, Batalkan. Satu reservasi per pasien per poli per tanggal; kuota sesi ikut terpotong saat reservasi dibuat.
**FO-09 Batal Kunjungan (modal + audit)** — alasan (dropdown: permintaan pasien / kesalahan petugas / dokter tidak praktik / lainnya), keterangan wajib ≥ 10 karakter, pihak yang meminta, nama petugas (otomatis). Aksi: Batalkan, Tutup. Hanya status terdaftar/menunggu poli; kuota dilepas; SEP dibatalkan; masuk MG-03 & IT-06.
**FO-10 Jadwal & Kuota Dokter (baca)** — Grid minggu × dokter per poli: jam praktik, kuota total, terisi (loket/APM/reservasi), sisa; sel cuti ditandai. Filter poli/hari. FO hanya baca (ubah di IT-03). Kuota satu sumber untuk semua kanal.
**FO-11 Monitor Antrean Poli** — Kolom per poli: Menunggu / Dipanggil / Dilayani / Selesai / Dilewati dengan nomor dan waktu tunggu. Filter poli; refresh otomatis. Baca saja (FO & manajemen).

## APM (Anjungan Pendaftaran Mandiri)
UI layar penuh, huruf ≥ 20 px, target sentuh ≥ 64 px, keyboard/keypad di layar, kembali ke APM-01 setelah 90 detik tanpa sentuhan. Layout: `kiosk`. Tanpa login. Header putih: logo + "RS SPKD · Pendaftaran Mandiri" + "APM-0x · Langkah n · …" + jam & tanggal; footer: privasi + perangkat terdaftar + data demo.
- APM-01 Idle: logo RS, jam, "Sentuh layar untuk mulai". Perangkat harus terdaftar (IT-07).
- APM-02 Menu Utama: dua tombol besar Pasien Lama / Pasien Baru; tombol kecil Panggil petugas (maks 1×/60 detik); tombol "Ambil nomor loket" (mencetak nomor antrean loket A-xxx).
- APM-03 Identifikasi: keypad besar: NIK (16 digit), No. RM, atau No. BPJS (13 digit) diketik; tidak ada scan barcode. Lanjut, Hapus. Rate limit per perangkat; NIK tidak ditemukan → tawarkan daftar baru atau ke loket.
- APM-04 Konfirmasi Identitas: "Apakah ini data Anda?" nama tersamar (BU** SAN****), tgl-bulan lahir, foto bila ada. Ya / Bukan saya. Token identifikasi sekali pakai 180 detik.
- APM-05 Form Pasien Baru (ringkas): NIK*, nama*, tgl lahir*, JK*, No. HP*, alamat*; penjamin Umum atau BPJS (ketik No. BPJS; Asuransi diarahkan ke loket). Simpan & lanjut. NIK duplikat → "sudah terdaftar, gunakan Pasien Lama"; No. RM dibangkitkan dan dicetak.
- APM-06 Pilih Poli & Dokter: kartu poli (ikon + nama); setelah pilih: daftar dokter hari ini + sisa kuota + jam praktik; kuota habis = kartu abu-abu. Pilih, Kembali. Kuota diambil atomik dari sumber sama dengan loket.
- APM-07 Hasil & Cetak: nomor antrean raksasa "AN-007", poli, dokter, lokasi ruang, perkiraan panggil; status cetak. Cetak ulang, Selesai. Kunjungan tercatat status terdaftar + task check-in; BPJS: SEP dibuat menunggu seperti di loket; tiket 80 mm.

## Display VWR (perangkat TV, layout `tv`, tanpa login)
- VWR-01 Display Loket: panel besar "Sedang dipanggil: A-012 → Loket 2"; daftar 5 nomor berikutnya; jam; running text. Menerima event panggil real-time (di prototipe: `db.lastCall` tersinkron antar tab via localStorage), suara Bahasa Indonesia (speechSynthesis `id-ID`), replay bila koneksi putus; TANPA nama pasien.
- VWR-02 Display Poli: kolom per poli: nomor dipanggil + ruang + nama dokter; nomor berikutnya. Sumber event dari KL-01.
- Perlu tombol "Aktifkan suara" (browser butuh interaksi pengguna). Display terikat ke papan tertentu (bukan parameter URL).

## Klinis Poliklinik (Dokter/Perawat — satu akun)
**KL-01 Worklist Poli** — Filter poli & dokter (default: unit penugasan user); tabel: nomor antrean, nama, umur/JK, penjamin, jam daftar, waktu tunggu, flag alergi, status (menunggu/dipanggil/vital selesai/diperiksa/selesai); ubin ringkasan: menunggu, dilayani, selesai. Aksi: Panggil pasien (→ VWR-02), Mulai periksa (→ KL-02), Lewati, Panggil ulang. Hanya pasien poli/dokter sendiri; panggil pertama = task poli mulai.
**KL-02 Workspace Pasien** — Patient Banner tetap; tab: [Vital & Pengkajian] [SOAP] [Resep & Tindakan] [Surat] [Riwayat] [Lampiran]; indikator kelengkapan (vital ✓, SOAP ✓, diagnosis ✓). Aksi: pindah tab, Tutup kunjungan. Kunjungan harus berstatus dilayani. Tab "Surat" = KL-07 ditunda (tampilkan catatan: surat rujukan/kontrol dicatat sebagai dokumen administratif saat pendaftaran; penerbitan SKDP otomatis menyusul).
**KL-03 Vital Sign & Pengkajian Awal** — TD, nadi, RR, suhu, SpO2, TB, BB (BMI otomatis), kesadaran, skala nyeri, risiko jatuh (ya/tidak), keluhan utama, riwayat alergi (perbarui banner). Aksi: Simpan; Lanjut ke SOAP. Nilai abnormal ditandai merah; tersimpan berversi (koreksi = versi baru beralasan). Simpan → antrean "vital selesai"; alergi baru langsung merah di banner.
**KL-04 Editor SOAP + Lampiran** — Dua kolom: kiri riwayat SOAP kunjungan lama (baca); kanan SOAP hari ini: S keluhan (teks), O terisi otomatis dari vital + teks pemeriksaan fisik, A diagnosis utama + sekunder (autocomplete ICD-10) + teks asesmen, P rencana (teks) + tombol Tambah resep, Tambah tindakan, pilihan tindak lanjut (pulang / kontrol / rujuk rawat inap-ICU [dicatat saja di MVP]); area unggah lampiran PDF/JPG/PNG maks. 10 MB (dicatat sebagai dokumen). Aksi: Simpan draf (otomatis tiap 4 detik), Tanda tangani & kunci. Minimal 1 diagnosis utama (tepat satu) sebelum tanda tangan; setelah ditandatangani hanya bisa addendum.
**KL-05 Order Resep & Tindakan** — Modal 2 tab: Resep: cari obat (master obat), dosis, aturan pakai, jumlah, racikan/non-racikan, catatan; Tindakan: cari tindakan (master tarif), jumlah, pelaksana; keduanya tampil sebagai daftar di tab Resep & Tindakan. Aksi: Tambah, Hapus, Kirim. Setiap baris membentuk billable event ke kasir (harga dari tarif per penjamin); obat di MVP = catatan resep (tanpa farmasi).
**KL-06 Tutup Kunjungan (modal)** — ringkasan diagnosis & tindakan; kondisi pulang (sembuh/membaik/tetap); cara pulang (pulang, kontrol ulang, rujuk RS lain, rawat inap); tanggal kontrol (bila kontrol) dicatat dan membuat reservasi di FO-08; SKDP tidak diterbitkan. Aksi: Tutup kunjungan, Batal. Blokir bila belum ada diagnosis utama atau SOAP belum ditandatangani; status → selesai; tagihan dikirim ke KS-01; event ke Satu Sehat.
**KL-07** Ditunda (tidak dibangun).
**KL-08 Riwayat Kunjungan Pasien** — Timeline: tanggal, poli, dokter, diagnosis, SOAP (baca), lampiran. Buka detail. Baca saja.

## Kasir
**KS-01 Worklist Tagihan** — Tab: Siap bayar (kunjungan selesai), Menunggu klinis (masih di poli), Lunas hari ini; kolom: No. kunjungan, pasien, poli, penjamin (badge), total sementara, jam selesai. Aksi: buka tagihan, cari pasien. Hanya status selesai yang bisa difinalkan.
**KS-02 Detail Tagihan** — Patient Banner; accordion kategori: Administrasi/karcis, Konsultasi dokter, Tindakan, Obat/resep, Lainnya; tiap baris: sumber (siapa, kapan), tarif, qty, subtotal; panel skema bayar: Tunai / BPJS / Asuransi (plafon dan selisih diketik manual) → pembagian: ditanggung penjamin, dibayar pasien, selisih; tambah item manual beralasan; diskon beralasan. Aksi: Ubah skema, Tambah item, Finalkan tagihan (→ nomor INV). Finalisasi membekukan baris; BPJS: porsi pasien Rp 0 kecuali selisih/naik kelas; item manual wajib alasan ≥ 15 karakter.
**KS-03 Pembayaran** — Sisa tagihan besar; metode: Tunai (uang diterima → kembalian otomatis), QRIS (QR dinamis + polling status, simulasi gateway), Virtual Account (nomor VA + tombol "simulasi bayar" di staging), multi-payment (gabungan). Aksi: Bayar, Batalkan QR, Cetak. Nominal dihitung ulang server; lunas → status kunjungan lunas, nomor kwitansi KW-….
**KS-04 Invoice & Kwitansi** — Preview: identitas RS, pasien, kunjungan, rincian, penjamin, total, metode & waktu bayar, kasir; barcode nomor INV. Aksi: Cetak (window.print), Unduh PDF (print), Kirim WA (ditunda/disabled). Nomor INV/KW dari layanan penomoran; cetak tercatat audit.
**KS-05 Rekap Penerimaan Shift** — Tabel per kasir per shift: jumlah transaksi, tunai, QRIS, VA, total; tombol tutup shift. Aksi: Tutup shift, Ekspor (CSV). Shift yang ditutup tidak bisa diubah. (Kasir & Manajemen.)

## Manajemen
**MG-01 Dashboard Operasional** — Kartu KPI hari ini: kunjungan terdaftar, per kanal (loket/APM/reservasi), per penjamin, pasien sedang di poli, rata-rata waktu tunggu loket & poli, pendapatan hari ini, kunjungan dibatalkan, status kirim Satu Sehat (terkirim/antrian/gagal); tabel ringkas kunjungan 7 hari per poli (TANPA grafik). Aksi: pilih rentang (hari/minggu/bulan), buka laporan.
**MG-02 Laporan Kunjungan & Pendaftaran** — Filter tanggal, poli, dokter, penjamin, kanal; tabel kunjungan + ringkasan per poli/dokter; pasien baru vs lama; tabel saja. Ekspor Excel (CSV)/PDF (print).
**MG-03 Laporan Pembatalan** — Tabel: tanggal, pasien, poli, alasan, pihak peminta, petugas pembatal, jam. Ekspor; buka detail audit (IT-06).

## IT / Superadmin
**IT-01 User & Role (RBAC)** — Tabel user (nama, username, role, unit/poli, status aktif, login terakhir); form user; matriks role × modul (lihat/input/edit/hapus/verifikasi) untuk 5 role. Aksi: tambah/nonaktifkan user, reset password, ubah matriks. Dokter wajib dipetakan ke poli & data nakes (SIP/STR).
**IT-02 Master Poli & Dokter** — Poli: kode prefix antrean (PD, AN, …), nama, ruang, aktif; Dokter: nama, spesialisasi, poli, SIP/STR, IHS (Satu Sehat). CRUD. Prefix dipakai penomoran antrean.
**IT-03 Master Jadwal & Kuota** — Template jadwal mingguan per dokter: hari, jam mulai-selesai, kuota total, porsi JKN/non-JKN; catat cuti + dokter pengganti; sesi harian dibangkitkan otomatis 30 hari ke depan. CRUD, catat cuti. Kuota tidak boleh di bawah jumlah yang sudah terisi.
**IT-04 Master Tarif & Penjamin** — Tarif per layanan (karcis, konsultasi, tindakan, obat) × penjamin dengan tanggal berlaku; daftar penjamin (Umum, BPJS, Asuransi sebagai satu kategori; plafon/selisih diisi manual di kasir). CRUD, versi tarif. Tagihan final tidak berubah saat tarif berubah.
**IT-05 Status Integrasi & Antrian Kirim** — Kartu kesehatan endpoint: Satu Sehat, BPJS VClaim/Antrol (stub), token expiry; tabel antrian kirim (outbox): waktu, modul, resource (Patient/Encounter/Condition/…), status (antrian/terkirim/gagal), percobaan ke-n; daftar gagal (DLQ). Aksi: kirim ulang satu/massal, lihat payload, toggle mode mock/produksi. Wujud "dual storage": data selalu tersimpan lokal, pengiriman di sini. Backoff 1/2/4/8/16 menit, 5×, lalu DLQ + notifikasi IT.
**IT-06 Audit Trail** — Tabel: waktu, user, role, aksi (login, buat pasien, ubah identitas, batal kunjungan, finalkan tagihan, cetak), objek, alasan, IP. Filter, ekspor. Append-only (tanpa tombol hapus/ubah). IT & Manajemen.
**IT-07 Perangkat Terdaftar (APM, Display)** — Daftar perangkat: nama, unit, loket/poli terikat, status online, kode pendaftaran sekali pakai. Daftarkan, cabut. Display terikat ke papan antrean tertentu, bukan parameter URL.

## Keputusan tim
Satu akun Dokter & Perawat. APM BPJS: No. BPJS diketik, tanpa scan. SKDP tidak diterbitkan di MVP. Lampiran SOAP PDF/JPG/PNG maks 10 MB. Skema asuransi di kasir: plafon & selisih manual. Laporan: tabel + ekspor Excel saja, tanpa grafik. Nomor antrean: prefix kode poli (PD-001), reset harian; antrean loket prefix A.

## Figma (fileKey m6yc6ntAQMdAFn0eFcoBNZ) — node id per halaman
GL-01 12:6022 · GL-02 15:17059 · FO-01 12:6059 · FO-02 15:17246 · FO-03 12:6273 · FO-04 15:17414 · FO-05 12:6469 · FO-06 15:17657 · FO-07 15:17836 · FO-08 15:18000 · FO-09 15:18198 · FO-10 15:18335 · FO-11 15:18482
APM-01 15:18658 · APM-02 15:18672 · APM-03 15:18706 · APM-04 15:18778 · APM-05 15:18809 · APM-06 20:29191 · APM-07 20:29236 · VWR-01 20:29276 · VWR-02 20:29305
KL-01 20:29363 · KL-02 20:29552 · KL-03 12:6652 · KL-04 12:6817 · KL-05 12:6978 · KL-06 12:7169 · KL-08 20:29693
KS-01 20:29816 · KS-02 12:7319 · KS-03 12:7512 · KS-04 12:7643 · KS-05 20:29988
MG-01 20:30146 · MG-02 20:30358 · MG-03 20:30599
IT-01 20:30715 · IT-02 20:30937 · IT-03 20:31122 · IT-04 20:31366 · IT-05 20:31578 · IT-06 20:31767 · IT-07 20:31921
Gaya visual: sidebar navy #0b3558, aksen teal #0b8f95, latar #f1f6f8, kartu putih radius 10, font Inter, badge status berwarna. Sudah ada di assets/css/main.css.
