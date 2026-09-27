// Primitif WebGL: titik dihitung dari rumus, lalu dikirim sebagai segitiga.
const vertices = [];
let transform = p => p;
const TAU = Math.PI * 2;
const rgba = (hex, alpha = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(alpha);
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

export const getShapeData = () => new Float32Array(vertices);

export function group({ x = 0, y = 0, scale = 1, rotation = 0 }, draw) {
    const parent = transform, cos = Math.cos(rotation), sin = Math.sin(rotation);
    transform = ([px, py]) => parent([x + scale * (px * cos - py * sin), y + scale * (px * sin + py * cos)]);
    try { draw(); } finally { transform = parent; }
}

function triangle(a, b, c, color, texture) {
    for (const p of [a, b, c]) vertices.push(...transform(p), ...color, texture);
}

// Sampel kurva parametrik; jumlah segmen dapat disesuaikan dengan ukuran objek.
export function parametric(fn, segments = 48, start = 0, end = TAU, closed = true) {
    return Array.from({ length: segments + (closed ? 0 : 1) }, (_, i) => fn(start + (end - start) * i / segments));
}

export function oval(x, y, rx, ry, rotation = 0, segments = 40) {
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    return parametric(t => [x + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin,
        y + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos], segments);
}

export function ellipse(x, y, rx, ry, fill, rotation = 0, outline = null, width = 6, segments = 40) {
    const points = oval(x, y, rx, ry, rotation, segments), color = rgba(fill);
    points.forEach((p, i) => triangle([x, y], p, points[(i + 1) % points.length], color, 1));
    if (outline) line(points, width, outline, true);
}

export function line(points, width, hex, closed = false, texture = 1, alpha = 1) {
    const color = rgba(hex, alpha), n = points.length;
    const edges = points.map((p, i) => {
        const a = points[closed ? (i + n - 1) % n : Math.max(0, i - 1)];
        const b = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy) || 1;
        const r = width / 2;
        return [[p[0] - dy / length * r, p[1] + dx / length * r],
            [p[0] + dy / length * r, p[1] - dx / length * r]];
    });
    for (let i = 0; i < n - (closed ? 0 : 1); i++) {
        const j = (i + 1) % n;
        triangle(edges[i][0], edges[i][1], edges[j][0], color, texture);
        triangle(edges[i][1], edges[j][1], edges[j][0], color, texture);
    }
    // Delapan segmen cukup untuk ujung garis kecil; tidak perlu 100 titik.
    if (!closed) for (const p of [points[0], points.at(-1)]) {
        const cap = oval(...p, width / 2, width / 2, 0, 8);
        cap.forEach((q, i) => triangle(p, q, cap[(i + 1) % cap.length], color, texture));
    }
}

// Kurva Catmull–Rom: cukup titik yang dilalui, tanpa menulis kontrol Bézier.
export function smooth(anchors, closed = false, steps = 8) {
    const n = anchors.length, points = [];
    const at = i => anchors[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    for (let i = 0; i < n - (closed ? 0 : 1); i++) {
        const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
        for (let j = 0; j < steps; j++) {
            const t = j / steps;
            points.push([0, 1].map(k => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t
                + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t
                + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t)));
        }
    }
    if (!closed) points.push(anchors.at(-1));
    return points;
}

// Ear clipping untuk siluet cekung, misalnya badan ayam dan awan.
export function shape(points, fill, outline = null, width = 6, texture = 1) {
    if (fill) {
        const ring = points.slice(), color = rgba(fill);
        const area = ring.reduce((sum, a, i) => {
            const b = ring[(i + 1) % ring.length];
            return sum + a[0] * b[1] - b[0] * a[1];
        }, 0);
        if (area < 0) ring.reverse();
        while (ring.length > 3) {
            const ear = ring.findIndex((b, i) => {
                const a = ring[(i + ring.length - 1) % ring.length], c = ring[(i + 1) % ring.length];
                return cross(a, b, c) > 0 && !ring.some(p => p !== a && p !== b && p !== c
                    && cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0);
            });
            if (ear < 0) throw new Error("Siluet berpotongan; periksa titik penuntunnya.");
            triangle(ring[(ear + ring.length - 1) % ring.length], ring[ear], ring[(ear + 1) % ring.length], color, texture);
            ring.splice(ear, 1);
        }
        triangle(...ring, color, texture);
    }
    if (outline) line(points, width, outline, true, texture);
}
