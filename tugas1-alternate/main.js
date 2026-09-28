import { createRenderer2D } from "./renderer2d.js";

const canvas = document.getElementById("glCanvas");
const renderer = createRenderer2D(canvas);

// ============================================================
// EDIT DI SINI: tentukan bentuk, posisi, ukuran, rotasi, warna.
// Koordinat x dan y memakai NDC: -1 sampai +1.
// Rotasi memakai derajat. Warna memakai RGBA: 0 sampai 1.
// ============================================================

const kotak = renderer.rectangle({
  x: -0.4,
  y: 0,
  width: 0.4,
  height: 0.3,
  rotation: 0,
  color: [1, 0.2, 0.2, 1],
});

const bulat = renderer.circle({
  x: 0.4,
  y: 0,
  radius: 0.2,
  color: [0.2, 0.7, 1, 1],
});

const segitiga = renderer.triangle({
  x: -0.3,
  y: 1.45,
  width: 0.3,
  height: 0.3,
  rotation: 0,
  color: [1, 0.8, 0, 1],
});


// Bintang dan outline menjadi satu benda; posisi bagian memakai koordinat lokal.
const bintang1 = renderer.group({
  x: 0.8,
  y: 0.3,
  rotation: 20,
  scaleX: 0.7,
  scaleY: 0.7,
});

const bintang2 = renderer.group({
  x: 0.7,
  y: 0.5,
  rotation: 10,
  scaleX: 1,
  scaleY: 1,
});

const star1 = renderer.star({
  x: 0,
  y: 0,
  radius: 0.1,
  color: [1, 0.8, 0, 1],
});

const star2 = renderer.star({
  x:0,
  y:0,
  radius: 0.1,
  color: [0.6, 0.8, 0.89, 1],
});

const star_outline = renderer.star({
  x: 0,
  y: 0,
  radius: 0.14,
  color: [0, 0, 0, 1],
});


renderer.add(kotak, bulat);
bintang1.add(star_outline, star1);
bintang2.add(star_outline, star2);
renderer.add(bintang1);
renderer.add(bintang2);




// Contoh animasi wajib. Ganti objek atau rumus geraknya sesukamu.
const posisiAwalY = bulat.y;

const animation = renderer.start((seconds) => {
  bulat.y = posisiAwalY + Math.sin(seconds * 2) * 0.25;
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && !event.repeat) {
    bulat.y = posisiAwalY;
    animation.reset();
  }
});
