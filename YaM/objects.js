import { group, parametric, ellipse, line, smooth, shape } from "./geometry.js";
export { getShapeData } from "./geometry.js";

const PI = Math.PI, TAU = PI * 2;
const COLORS = {
    outline: "#805333", body: "#fffefa", cream: "#fbefce", red: "#ed3029",
    yellow: "#ffce05", orange: "#ff941d", foot: "#ffbb05", blue: "#7bcce9",
    cloud: "#d7f0fb", pink: "#f38ba6", grass: "#78c83f", leaf: "#61bd35",
    eggOutline: "#d29b58",
};

// Acak dengan seed: rumput tetap sama setiap halaman dimuat.
function random(seed) {
    return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

// Satu rumus kipas elips dipakai untuk jengger, ekor, pial, dan kelopak.
function petals({ x = 0, y = 0, count, length, width, start, end, fill, outline = fill }) {
    for (let i = 0; i < count; i++) {
        const angle = start + (end - start) * (count === 1 ? 0.5 : i / (count - 1));
        ellipse(x + Math.cos(angle) * length / 2, y + Math.sin(angle) * length / 2,
            length / 2, width / 2, fill, angle, outline);
    }
}

export function drawCloud({ x, y, width = 270, height = 120, lobes = 6, puff = 0.4,
    scale = 1, rotation = 0, fill = COLORS.cloud, outline = COLORS.blue }) {
    group({ x, y, scale, rotation }, () => {
        // Kontur luar gabungan bulatan; tiap tonjolan berasal dari lingkaran.
        const centers = parametric(t => [(1 - puff) * Math.cos(t), (1 - puff) * Math.sin(t)], lobes);
        const points = parametric(t => {
            const dx = Math.cos(t), dy = Math.sin(t);
            const radius = Math.max(...centers.map(([cx, cy]) => {
                const projection = cx * dx + cy * dy;
                return projection + Math.sqrt(Math.max(0, puff * puff - cx * cx - cy * cy + projection * projection));
            }));
            return [width / 2 * dx * radius, height / 2 * dy * radius];
        }, lobes * 12);
        shape(points, fill, outline, 7, 1.3);
    });
}

export function drawSun({ x, y, radius = 70, rays = 10, rayLength = 23, scale = 1,
    rotation = 0, color = COLORS.yellow }) {
    group({ x, y, scale, rotation }, () => {
        for (let i = 0; i < rays; i++) {
            const angle = TAU * i / rays, near = radius * 1.3, far = near + rayLength;
            line([near, far].map(r => [r * Math.cos(angle), r * Math.sin(angle)]), 9, color);
        }
        ellipse(0, 0, radius, radius, color, 0, color);
    });
}

export function drawGrass({ x, y, width = 650, height = 30, count = 40, seed = 12,
    scale = 1, color = COLORS.grass }) {
    const rand = random(seed);
    group({ x, y, scale }, () => {
        for (let i = 0; i < count; i++) {
            const base = width * (i / Math.max(1, count - 1) - 0.5);
            const tip = [base + (rand() - 0.3) * height, -height * (0.5 + rand())];
            line([[base, 0], tip], 8, color, false, 1.35);
        }
    });
}

export function drawFlower({ x, y, scale = 1, height = 105, radius = 43, petalCount = 5,
    petalColor = COLORS.red, centerColor = COLORS.yellow, leafColor = COLORS.leaf }) {
    group({ x, y, scale }, () => {
        line([[0, 0], [height * 0.15, height]], 8, leafColor);
        for (const side of [-1, 1]) {
            ellipse(side * radius / 2, height * 0.7, radius * 0.7, radius / 4,
                leafColor, -side * PI / 5);
        }
        petals({ count: petalCount, length: radius, width: radius * 0.55,
            start: -PI / 2, end: -PI / 2 + TAU * (1 - 1 / petalCount), fill: petalColor });
        ellipse(0, 0, radius / 3, radius / 3, centerColor);
    });
}

export function drawChicken({ x, y, scale = 1, rotation = 0, width = 480, height = 480,
    combCount = 3, tailCount = 3, colors = {} }) {
    const c = { ...COLORS, ...colors }, w = width, h = height;
    const sized = points => points.map(([px, py]) => [px * w, py * h]);
    group({ x, y, scale, rotation }, () => {
        // Dua kaki, masing-masing tiga jari, dihitung dari lebar dan tinggi badan.
        for (const side of [-1, 1]) {
            const hip = [side * w * 0.13, h * 0.47], ankle = [hip[0] + w * 0.02, h * 0.63];
            line([hip, ankle], 12, c.foot);
            for (let i = 0; i < 3; i++) {
                const a = i * PI / 2;
                line([ankle, [ankle[0] + Math.cos(a) * w * 0.1,
                    ankle[1] + Math.sin(a) * h * 0.06]], 12, c.foot);
            }
        }
        petals({ x: w * 0.46, y: h * 0.12, count: tailCount, length: w * 0.24,
            width: h * 0.1, start: -PI * 0.4, end: 0, fill: c.orange });
        petals({ x: -w * 0.08, y: -h * 0.43, count: combCount, length: h * 0.23,
            width: w * 0.14, start: -PI * 0.78, end: -PI * 0.22, fill: c.red });

        // Hanya 11 titik penuntun untuk siluet khas ayam; kelengkungan dihitung otomatis.
        const body = smooth(sized([
            [-0.4, -0.32], [-0.17, -0.49], [0.1, -0.4], [0.21, -0.11],
            [0.44, 0], [0.5, 0.22], [0.34, 0.44], [-0.04, 0.5],
            [-0.38, 0.38], [-0.49, 0.16], [-0.41, -0.08],
        ]), true);
        shape(body, c.body, c.outline, 10, 0.75);

        // Arsiran mengikuti kontur; tidak ada daftar garis arsiran satu per satu.
        for (let i = 0; i < body.length - 3; i += 5) {
            if (body[i][1] < -h * 0.05 && body[i][0] < 0) continue;
            const hatch = body.slice(i, i + 4).map(([px, py]) => [px * 0.9, py * 0.9]);
            line(hatch, 7, c.cream, false, 1.5, 0.6);
        }
        line(smooth(sized([
            [-0.08, 0.11], [-0.02, 0.26], [0.11, 0.3], [0.17, 0.24],
            [0.25, 0.28], [0.3, 0.22], [0.27, 0.19], [0.38, 0.19],
            [0.4, 0.13], [0.31, 0.09],
        ])), 8, c.outline);

        petals({ x: -w * 0.42, y: -h * 0.18, count: 2, length: h * 0.18,
            width: w * 0.1, start: PI * 0.35, end: PI * 0.65, fill: c.red });
        shape(smooth(sized([[-0.56, -0.27], [-0.4, -0.32], [-0.4, -0.18]]), true), c.yellow, c.foot);
        ellipse(-w * 0.23, -h * 0.26, w * 0.033, h * 0.048, "#20201c");
        ellipse(-w * 0.135, -h * 0.177, w * 0.077, h * 0.058, c.pink, -PI / 12);
    });
}

export function drawEgg({ x, y, rx = 40, ry = 48, rotation = 0, scale = 1,
    fill = "#fae8b8", outline = COLORS.eggOutline }) {
    group({ x, y, scale, rotation }, () => {
        const egg = t => [rx * Math.cos(t) * (1 + 0.18 * Math.sin(t)), ry * Math.sin(t)];
        shape(parametric(egg, 40), fill, outline, 8);
        const highlight = parametric(t => egg(t).map(v => v * 0.8), 12, PI, PI * 1.5, false);
        line(highlight, 5, "#fff8db", false, 1.1, 0.85);
    });
}
