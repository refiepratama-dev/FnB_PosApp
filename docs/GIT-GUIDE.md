# Panduan Git untuk Tim TemanPOS

Panduan ini untuk yang baru belajar Git. Ikuti urutannya setiap kali mengerjakan fitur.

## Aturan utama

1. **Jangan pernah kerja langsung di `main`.** `main` sudah dikunci, push langsung akan ditolak.
2. **1 fitur = 1 branch = 1 Pull Request (PR).**
3. Yang boleh merge ke `main` hanya **Refie**.
4. **Jangan commit file `.env`** (berisi key rahasia). Sudah otomatis diabaikan oleh `.gitignore`.

## Alur kerja setiap fitur

### 1. Update `main` di laptopmu dulu
```bash
git checkout main
git pull
```

### 2. Bikin branch baru
Nama branch: `feat/nama-fitur` untuk fitur, `fix/nama-bug` untuk perbaikan.
```bash
git checkout -b feat/kelola-produk
```

### 3. Kerjakan fitur, lalu cek
```bash
npm run typecheck
npx expo start
```
Pastikan tidak ada error dan sudah dicoba di HP/tablet.

### 4. Simpan perubahan (commit)
```bash
git add .
git commit -m "feat: tambah halaman kelola produk"
```
Awalan pesan commit:
| Awalan | Dipakai untuk |
|--------|---------------|
| `feat:` | Fitur baru |
| `fix:` | Perbaikan bug |
| `style:` | Ubah tampilan saja |
| `docs:` | Ubah dokumen |
| `chore:` | Lain-lain (library, config) |

Boleh commit berkali-kali selama mengerjakan fitur.

### 5. Kirim ke GitHub (push)
```bash
git push -u origin feat/kelola-produk
```
Push berikutnya di branch yang sama cukup `git push`.

### 6. Bikin Pull Request
1. Buka repo di GitHub, akan muncul tombol **Compare & pull request**. Klik.
2. Judul: jelaskan singkat fiturnya.
3. Isi: apa yang dikerjakan + screenshot dari HP/tablet.
4. Klik **Create pull request**, lalu kabari Refie.

### 7. Setelah PR di-merge Refie
```bash
git checkout main
git pull
git branch -d feat/kelola-produk
```
Lalu mulai lagi dari langkah 2 untuk fitur berikutnya.

## Masalah yang sering terjadi

**Lupa bikin branch, sudah terlanjur ubah file di `main`**
Belum commit? Langsung bikin branch, perubahanmu ikut pindah:
```bash
git checkout -b feat/nama-fitur
```

**Branch-ku ketinggalan `main` (ada update dari teman)**
```bash
git checkout main
git pull
git checkout feat/nama-fitur
git merge main
```

**Muncul konflik (conflict)**
Jangan panik dan jangan hapus apa pun. Buka file yang konflik di VS Code, pilih bagian yang benar
(*Accept Current / Incoming / Both*), simpan, lalu:
```bash
git add .
git commit -m "chore: selesaikan konflik"
```
Kalau bingung, tanya Refie dulu.

**Setelah `git pull` ada library baru**
Jalankan `npm install` sebelum `npx expo start`.
