# Tugas 1 Alternate — Template WebGL 2D

Template ini hanya menggunakan konsep yang dibahas pada Praktikum 2 dan 3.

## Materi yang digunakan

- WebGL2 context dan viewport;
- vertex shader dan fragment shader;
- `Float32Array`;
- buffer, attribute, uniform, dan `gl.drawArrays()`;
- primitive `gl.TRIANGLES`;
- local coordinate;
- Model Matrix 3×3;
- translation, rotation, dan scaling;
- parent–child dengan perkalian matrix (Praktikum 3, bagian 57 dan 62);
- `requestAnimationFrame()` dan delta time;
- input keyboard untuk reset.

## Struktur

- `main.js`: bagian yang diedit untuk menentukan objek dan animasi.
- `renderer2d.js`: setup WebGL dan fungsi praktis untuk rectangle, triangle, dan circle.
- `matrix3.js`: operasi matrix 3×3 dari materi Praktikum 3.
- `index.html`: canvas dan gambar referensi.
- `style.css`: tampilan halaman.

## Bagian yang perlu diedit

Gunakan pola berikut di `main.js`:

```js
const kotak = renderer.rectangle({
  x: -0.4,
  y: 0,
  width: 0.4,
  height: 0.3,
  rotation: 0,
  color: [1, 0.2, 0.2, 1],
});

renderer.add(kotak);
```

Aturan nilainya:

- `x` dan `y`: NDC dari `-1` sampai `+1`;
- `width`, `height`, dan `radius`: ukuran relatif terhadap NDC;
- `rotation`: derajat;
- `color`: RGBA dengan nilai `0` sampai `1`.

## Membuat objek gabungan dengan grup

```js
const benda = renderer.group({
  x: 0.2,
  y: 0.3,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
});

const badan = renderer.rectangle({
  x: 0,
  y: 0,
  width: 0.3,
  height: 0.5,
  color: [1, 0.2, 0.2, 1],
});

const jendela = renderer.circle({
  x: 0,
  y: 0.1,
  radius: 0.06,
  color: [0.2, 0.7, 1, 1],
});

benda.add(badan, jendela);
renderer.add(benda);
```

`badan` dan `jendela` menggunakan posisi lokal terhadap pusat `benda`. Dengan transform di atas, pusat jendela berada di `(0.2, 0.4)` pada dunia. Ubah `benda.x`, `benda.y`, `benda.rotation`, `benda.scaleX`, atau `benda.scaleY` agar seluruh bagian bergerak bersama. Ubah `jendela.y` untuk menggeser jendela di dalam benda.

Pivot rotasi dan skala grup berada di local origin `(0, 0)`. Rotasi memakai derajat. Urutan `add()` menentukan lapisan: objek terakhir digambar di atas objek sebelumnya. Tambahkan grup ke renderer satu kali; anggotanya cukup ditambahkan ke grup agar tidak digambar dua kali.

Grup dapat berisi grup lain dengan cara yang sama: `benda.add(grupLain)`. Setiap anggota hanya boleh memiliki satu parent dan grup tidak boleh berisi dirinya sendiri atau grup leluhurnya.

Untuk membuat banyak benda sejenis, bungkus pembuatan grup dan bagian-bagiannya dalam fungsi, lalu panggil fungsi tersebut untuk setiap benda. Setiap panggilan membuat grup dan transform baru; mesh primitive tetap dipakai ulang oleh renderer.

Konsep matrix berasal dari Praktikum 3, bagian 57 dan 62:

```text
Model = Translation × Rotation × Scaling
World anggota = World grup × Local anggota
```

## Membuat animasi

```js
const posisiAwalY = kotak.y;

renderer.start((seconds) => {
  kotak.y = posisiAwalY + Math.sin(seconds * 2) * 0.25;
});
```

Di balik API sederhana tersebut, `renderer2d.js` tetap menjalankan alur yang dipelajari:

```text
Local vertex
→ Float32Array
→ GPU buffer
→ attribute
→ vertex shader
→ Model Matrix
→ gl.drawArrays
→ canvas
```

Jalankan project melalui local server karena JavaScript menggunakan module.
