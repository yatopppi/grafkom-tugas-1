// "use strict";

// ==========================================
// 1. Inisialisasi Canvas & WebGL Context
// ==========================================
const canvas = document.getElementById("glCanvas");
// Catatan: kode asli menggunakan alpha: false
const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });

if (!gl) {
    throw new Error("WebGL2 tidak tersedia. Aktifkan akselerasi grafis atau gunakan browser yang mendukung WebGL2.");
}

// ==========================================
// 2. Fungsi Utilitas Shaders & Program
// ==========================================
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Shader compile error:\n" + info);
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("Program link error:\n" + info);
    }
    return program;
}

// ==========================================
// 3. Data Scene & Fungsi Geometri
// ==========================================
const SCENE = {
    paper: [[0, 30], [713, 68], [676, 901], [39, 943]],
    width: 700, height: 900,
    planets: [
        { name: "Jupiter", x: 127, y: 330, rx: 99, ry: 97, color: "#c88a4c" },
        { name: "Bumi", x: 387, y: 279, rx: 60, ry: 66, color: "#87b7ad" },
        { name: "Mars", x: 508, y: 304, rx: 27, ry: 28, color: "#b82f26" },
        { name: "Merkurius", x: 621, y: 323, rx: 17, ry: 18, color: "#2d211b" },
        { name: "Venus", x: 558, y: 561, rx: 36, ry: 35, color: "#df9752" },
        { name: "Uranus", x: 135, y: 691, rx: 57, ry: 53, color: "#4aafa6" },
        { name: "Neptunus", x: 198, y: 857, rx: 43, ry: 43, color: "#398d39" },
        { name: "Saturnus", x: 539, y: 800, rx: 62, ry: 54, color: "#b08b62" },
    ],
    sun: { x: 683, y: 92, rx: 165, ry: 145 },
    stars: [
        [296, 211, 17, -0.15], [98, 590, 21, 0.1], [428, 547, 20, 0.2],
        [639, 739, 20, -0.1], [330, 880, 19, 0.2], [77, 826, 15, 0.2],
    ],
    comets: [
        { head: [158, 198], tail: [145, 102], width: 13, bend: [154, 145] },
        { head: [294, 609], tail: [239, 565], width: 13, bend: [268, 580] },
        { head: [325, 789], tail: [373, 790], width: 8, bend: [349, 797] },
    ],
    spirals: [[272, 436, 13], [230, 714, 15], [386, 720, 11], [88, 897, 14]],
    orbits: [
        [[452, 57], [479, 228], [570, 344], [718, 344], 21],
        [[419, 55], [436, 262], [558, 411], [710, 409], 17],
        [[329, 55], [345, 290], [526, 454], [710, 472], 22],
        [[206, 51], [229, 351], [457, 588], [698, 598], 20],
        [[10, 35], [84, 373], [348, 697], [692, 704], 23],
        [[9, 420], [179, 670], [419, 829], [687, 808], 22],
        [[16, 595], [138, 755], [331, 851], [482, 912], 21],
        [[28, 745], [117, 827], [212, 885], [289, 932], 21],
    ],
};

const WHITE_DOTS = `
66,74 78,87 64,88 88,89 119,130 174,71 177,86 189,90
240,63 254,57 255,71 246,83 270,79 285,78 296,69 296,95
362,80 375,81 372,94 381,126 376,161 394,161 381,192 439,78
11,117 7,164 20,194 29,185 26,207 14,218 107,190 108,203
251,112 269,121 256,143 278,165 315,181 247,182 205,209
14,287 21,301 236,283 249,264 295,267 316,288 307,303 331,321
356,352 334,351 347,358 351,373 377,358 398,362 378,381
256,370 260,384 273,372 275,381 225,352 267,349
474,305 469,325 488,340 574,334 579,337 604,343 632,365
542,359 548,347 517,362 539,378 576,400 612,414 669,430
667,375 632,396 453,405 422,381 449,433 428,441 430,454
379,416 360,397 359,404 336,444 328,441 306,445 329,458
58,425 63,432 70,423 64,443 21,445 31,464 34,482 114,463
52,546 48,561 80,514 153,490 165,510 169,520 177,519 178,537
211,475 217,478 236,501 247,489 298,499 311,483 318,488
352,483 387,505 378,514 392,518 398,476 458,455 473,462
494,459 527,462 549,465 567,473 573,480 595,495 601,501
598,492 589,516 612,530 620,524 625,517 651,514 663,512
641,544 650,552 624,563 643,533 578,504 551,508 509,481
460,569 488,561 466,592 448,604 399,587 391,609 416,624
406,636 377,637 366,625 374,619 397,657 336,661 330,666
309,652 354,693 433,700 454,697 465,703 455,716 497,666
504,657 512,649 518,643 516,616 527,627 519,632 546,619
546,633 554,667 575,645 599,627 605,629 611,628 609,615
641,664 651,658 658,646 671,641 143,618 197,554 38,594
46,683 57,700 34,720 42,743 48,779 53,784 46,789
188,774 203,766 269,747 257,747 286,752 299,738 291,759
376,795 389,808 393,817 378,826 371,844 371,853 366,862
277,849 283,865 264,872 230,808 234,817 240,808 209,882
404,895 398,900 386,899 406,908 427,894 433,898 450,889
502,895 505,881 524,872 574,853 592,869 607,888 602,882
629,785 628,794 652,778 659,768 654,756 666,764 616,841
95,830 126,848 125,859 117,861 106,880 53,881 47,886
57,910 62,922 128,907 120,914 115,921 165,923 179,905
646,704 633,683 486,703 597,653 487,670 50,756 625,464
`;

const TAU = Math.PI * 2;
const white = "#f0eddb", yellow = "#f5d44f";

const vertices = [];
let vertexCount = 0;

function rgba(hex, alpha = 1) {
    return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255, alpha];
}
function vertex(point, color, material = 0) { vertices.push(...point, ...color, material); }
function triangle(a, b, c, color, material = 0) {
    vertex(a, color, material); vertex(b, color, material); vertex(c, color, material);
}
function fan(points, center, color) {
    for (let i = 0; i < points.length; i++) triangle(center, points[i], points[(i + 1) % points.length], color);
}
function ellipse(x, y, rx, ry, color, roughness = 0.008) {
    const points = [];
    for (let i = 0; i < 100; i++) {
        const a = i / 100 * TAU;
        const r = 1 + roughness * (Math.sin(a * 7 + x) + 0.5 * Math.sin(a * 13 + y));
        points.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]);
    }
    fan(points, [x, y], color);
}
function stroke(points, width, color, uneven = 0) {
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        const w = width / 2 * (1 + uneven * Math.sin(i * 0.72));
        const nx = -dy / len * w, ny = dx / len * w;
        const p = [a[0] + nx, a[1] + ny], q = [a[0] - nx, a[1] - ny];
        const r = [b[0] + nx, b[1] + ny], s = [b[0] - nx, b[1] - ny];
        triangle(p, q, r, color); triangle(q, s, r, color);
    }
}
function bezier(a, b, c, d, steps = 180) {
    return Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps, u = 1 - t;
        return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
            u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
    });
}
function local(p, x, y) { return [p.x + x * p.rx, p.y + y * p.ry]; }
function drawOrbit([a, b, c, d, width]) {
    const line = bezier(a, b, c, d);
    stroke(line, width + 3, rgba("#b7c5bb"), 0.055);
    stroke(line, width, rgba(white), 0.05);
    stroke(line.map(([x, y]) => [x - 2, y + 3]), 2.3, rgba("#ffffff", 0.36), 0.1);
}
function drawSun() {
    const s = SCENE.sun, points = [];
    for (let i = 0; i < 56; i++) {
        const a = i / 56 * TAU, tip = i % 4 === 0 ? 1.39 : i % 4 === 1 ? 1.05 : 1.0;
        points.push([s.x + Math.cos(a) * s.rx * tip, s.y + Math.sin(a) * s.ry * tip]);
    }
    fan(points, [s.x, s.y], rgba("#f5c83a"));
    for (let i = 0; i < 14; i++) {
        const a = i / 14 * TAU;
        stroke([[s.x + Math.cos(a) * s.rx * .9, s.y + Math.sin(a) * s.ry * .9], [s.x + Math.cos(a) * s.rx * 1.33, s.y + Math.sin(a) * s.ry * 1.33]], 5, rgba("#f9a539", .5));
    }
    ellipse(s.x, s.y, s.rx, s.ry, rgba("#ffca32"));
    for (let i = 0; i < 25; i++) {
        ellipse(707, 68, 151 - i * 4, 143 - i * 4, rgba(i > 18 ? "#f99032" : "#fcb839", .12), .004);
    }
}
function drawStar([x, y, radius, rotation]) {
    const points = [];
    for (let i = 0; i < 10; i++) {
        const a = i / 10 * TAU - Math.PI / 2 + rotation;
        const r = i % 2 ? radius * .32 : radius * (1 + .11 * Math.sin(i * 3 + x));
        points.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    fan(points, [x, y], rgba(yellow));
    stroke([[x - 2, y + radius * .68], [x, y], [x + radius * .12, y - radius * .7]], 1.7, rgba("#fff18a", .65));
}
function drawComet({ head: [x, y], tail: [tx, ty], bend: [bx, by], width }) {
    const dx = x - tx, dy = y - ty, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    const left = bezier([tx, ty], [bx - nx * 3, by - ny * 3], [x - nx * width, y - ny * width], [x, y], 35);
    const right = bezier([x, y], [x + nx * width, y + ny * width], [bx + nx * 3, by + ny * 3], [tx, ty], 35);
    fan([...left, ...right], [x - dx * .1, y - dy * .1], rgba("#d7bb35"));
    ellipse(x, y, width * .7, width * .85, rgba("#edc243"), .03);
    for (let j = -2; j <= 2; j++) {
        stroke(bezier([tx, ty], [bx + nx * j, by + ny * j], [x + nx * j * 2, y + ny * j * 2], [x + nx * j, y + ny * j], 32), 1.4, rgba(j % 2 ? "#ffe864" : "#f7a740", .85));
    }
}
function drawSpiral([x, y, r]) {
    const points = [];
    for (let i = 0; i <= 170; i++) {
        const t = i / 170, a = .3 + t * TAU * 1.8, radius = r * (.1 + .9 * t);
        points.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius]);
    }
    stroke(points, 3.4, rgba(white), .1);
}
function drawLand(p, points, center) {
    fan(points.map(([x, y]) => local(p, x, y)), local(p, ...center), rgba("#8eaa43"));
    points.forEach(([x, y], i) => {
        const c = local(p, ...center), edge = local(p, x * .97, y * .97);
        stroke([c, edge], 1.5, rgba(i % 2 ? "#c7bc59" : "#648b40", .62));
    });
}
function ringPoints(start, end) {
    const p = SCENE.planets.find(p => p.name === "Saturnus"), points = [];
    const rotation = -0.47;
    for (let i = 0; i <= 120; i++) {
        const a = start + (end - start) * i / 120, x = 18 * Math.cos(a), y = 88 * Math.sin(a);
        points.push([p.x + x * Math.cos(rotation) - y * Math.sin(rotation), p.y + x * Math.sin(rotation) + y * Math.cos(rotation)]);
    }
    return points;
}
function drawRing(start, end) {
    const path = ringPoints(start, end);
    stroke(path, 8, rgba("#d6b734"), .08);
    stroke(path, 4, rgba("#f6de51"), .08);
    stroke(path.map(([x, y]) => [x - 1.3, y]), 1.3, rgba("#f9ee9b", .8));
}
function drawPlanet(p) {
    if (p.name === "Saturnus") drawRing(Math.PI / 2, Math.PI * 1.5);
    ellipse(p.x, p.y, p.rx, p.ry, rgba(p.color));
    const edge = Array.from({ length: 141 }, (_, i) => {
        const a = i / 140 * TAU; return [p.x + Math.cos(a) * p.rx * .98, p.y + Math.sin(a) * p.ry * .98];
    });
    stroke(edge, 1.7, rgba("#d8c278", .30), .3);

    if (p.name === "Jupiter") {
        for (let j = 0; j < 39; j++) {
            const y = -.93 + j * 1.86 / 38, half = Math.sqrt(1 - y * y) * .96;
            const path = Array.from({ length: 45 }, (_, k) => local(p, -half + 2 * half * k / 44, y + .012 * Math.sin(k * .12 + j)));
            stroke(path, 2 + j % 4, rgba(["#ddad69", "#b45e36", "#ab8053", "#df9552"][j % 4], .65), .13);
        }
        ellipse(81, 305, 24, 32, rgba("#b52d29"), .04);
        ellipse(81, 307, 20, 27, rgba("#c0372c", .55), .03);
    } else if (p.name === "Bumi") {
        drawLand(p, [[-.43, -.89], [-.22, -.77], [-.26, -.61], [-.03, -.5], [-.17, -.38], [-.43, -.4], [-.53, -.56], [-.72, -.57], [-.56, -.71]], [-.38, -.58]);
        drawLand(p, [[-.24, -.57], [.03, -.52], [.14, -.62], [.35, -.6], [.48, -.44], [.36, -.23], [.47, -.1], [.44, .23], [.22, .32], [.07, .16], [-.07, .1], [-.16, .43], [-.34, .72], [-.48, .48], [-.42, .23], [-.54, .07], [-.37, -.08], [-.43, -.29]], [-.05, -.12]);
        drawLand(p, [[.87, .05], [.81, .4], [.59, .7], [.7, .45], [.72, .23]], [.73, .35]);
        [[.09, .74, .055], [.24, .82, .07], [-.13, .72, .04]].forEach(([x, y, r]) => {
            const pt = local(p, x, y); ellipse(...pt, p.rx * r, p.ry * r, rgba("#a5b343"), .09);
        });
    } else if (p.name === "Saturnus") {
        for (let j = 0; j < 12; j++) {
            const x = -.9 + j * .16, half = Math.sqrt(1 - x * x) * .94;
            const path = Array.from({ length: 60 }, (_, k) => {
                const y = -half + 2 * half * k / 59;
                return local(p, x + .12 * (y * y - half * half), y);
            });
            stroke(path, 3 + j % 3, rgba(j % 2 ? "#d0ac7c" : "#886447", .73), .1);
        }
        drawRing(-Math.PI / 2, Math.PI / 2);
    } else if (p.name === "Venus") {
        for (let j = 0; j < 13; j++) {
            const radius = 3 + j * 2.15, path = [];
            for (let i = 0; i <= 100; i++) {
                const a = i / 100 * TAU;
                path.push([p.x + Math.cos(a) * radius * .65 + 3 * Math.sin(a * 3 + j), p.y + Math.sin(a) * radius + 2 * Math.cos(a * 4 + j)]);
            }
            stroke(path, 1.7, rgba(j % 2 ? "#f2ce70" : "#c77245", .85), .1);
        }
    } else if (p.name === "Uranus" || p.name === "Neptunus") {
        for (let j = 0; j < 21; j++) {
            const x = -.88 + j * .088, half = Math.sqrt(1 - x * x) * .93;
            stroke([local(p, x, -half), local(p, x + .012, half)], 1.1, rgba(p.name === "Uranus" ? "#81c1b1" : "#7fa552", .3));
        }
        if (p.name === "Uranus") {
            for (let j = 0; j < 8; j++) {
                const y = -.7 + j * .2, half = Math.sqrt(1 - y * y) * .94;
                stroke([local(p, -half, y), local(p, half, y + .025)], 1.2, rgba("#b0cbbb", .2));
            }
        }
    } else if (p.name === "Mars") {
        const path = Array.from({ length: 70 }, (_, i) => {
            const a = 1.2 + i / 69 * 3; return [p.x + Math.cos(a) * p.rx * .9, p.y + Math.sin(a) * p.ry * .9];
        });
        stroke(path, 2, rgba("#8c352e", .65));
    }
}
function homography(source, target) {
    const rows = [];
    source.forEach(([x, y], i) => {
        const [u, v] = target[i];
        rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
        rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
    });
    for (let i = 0; i < 8; i++) {
        let pivot = i;
        for (let j = i + 1; j < 8; j++) if (Math.abs(rows[j][i]) > Math.abs(rows[pivot][i])) pivot = j;
        [rows[i], rows[pivot]] = [rows[pivot], rows[i]];
        const divisor = rows[i][i];
        for (let k = i; k < 9; k++) rows[i][k] /= divisor;
        for (let j = 0; j < 8; j++) if (j !== i) {
            const f = rows[j][i];
            for (let k = i; k < 9; k++) rows[j][k] -= f * rows[i][k];
        }
    }
    const h = rows.map(r => r[8]);
    return new Float32Array([h[0], h[3], h[6], h[1], h[4], h[7], h[2], h[5], 1]);
}

// Generate isi array "vertices" sebelum dimasukkan ke Buffer WebGL
function buildScene() {
    vertices.length = 0;
    const [a, b, c, d] = SCENE.paper;
    triangle(a, b, c, rgba("#15528b"), 1);
    triangle(a, c, d, rgba("#15528b"), 1);
    SCENE.orbits.forEach(drawOrbit);
    const dots = WHITE_DOTS.trim().split(/\s+/).map(pair => pair.split(",").map(Number));
    dots.forEach(([x, y], i) => {
        const r = 1.6 + (i * 13 % 11) * .21;
        ellipse(x, y, r, r * (.85 + (i % 4) * .12), rgba(white), .06);
    });
    drawSun();
    SCENE.comets.forEach(drawComet);
    SCENE.stars.forEach(drawStar);
    SCENE.spirals.forEach(drawSpiral);
    SCENE.planets.forEach(drawPlanet);
    vertexCount = vertices.length / 7;
}

buildScene();

// ==========================================
// 4. Shaders Source
// ==========================================
const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec4 a_color;
in float a_material;
uniform mat3 u_paper;
uniform vec2 u_design;
out vec2 v_position;
out vec4 v_color;
flat out int v_material;
void main() {
    vec3 p = u_paper * vec3(a_position, 1.0);
    gl_Position = vec4(2.0*p.x/u_design.x-p.z, p.z-2.0*p.y/u_design.y, 0.0, p.z);
    v_position = a_position;
    v_color = a_color;
    v_material = int(a_material);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_position;
in vec4 v_color;
flat in int v_material;
out vec4 outColor;
float grain(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main() {
    vec2 p = v_position;
    float noise = grain(floor(p*2.0)) - 0.5;
    vec3 color = v_color.rgb;
    if (v_material == 1) {
        vec2 delta = (p-vec2(715.0,48.0))*vec2(1.0,1.04);
        float r = length(delta), a = atan(delta.y,delta.x);
        float bands = sin(r*.029 + sin(a*2.0)*1.8)*.5+.5;
        vec3 dark = vec3(.025,.105,.29), light = vec3(.13,.46,.68);
        color = mix(dark, light, .25+.7*bands);
        color = mix(color, vec3(.35,.68,.77), .38*exp(-r/370.0));
        float brush = sin(r*1.6+sin(a*41.0)*2.0)*.026 + sin(r*.37+a*13.0)*.028;
        color += brush + noise*.065;
    } else {
        float brush = sin(p.x*.93+sin(p.y*.12)*1.5)*.008;
        color += noise*.065 + brush;
    }
    outColor = vec4(clamp(color,0.0,1.0),v_color.a);
}`;

// ==========================================
// 5. Setup Program, Buffers, & Attributes
// ==========================================
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Attribute: a_position
const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 28, 0);

// Attribute: a_color
const colorLocation = gl.getAttribLocation(program, "a_color");
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 28, 8);

// Attribute: a_material
const materialLocation = gl.getAttribLocation(program, "a_material");
gl.enableVertexAttribArray(materialLocation);
gl.vertexAttribPointer(materialLocation, 1, gl.FLOAT, false, 28, 24);

// Setup Uniforms & Blending
gl.useProgram(program);
const uPaperLocation = gl.getUniformLocation(program, "u_paper");
const uDesignLocation = gl.getUniformLocation(program, "u_design");

const paperMatrix = homography(SCENE.paper, [[0, 0], [SCENE.width, 0], [SCENE.width, SCENE.height], [0, SCENE.height]]);
gl.uniformMatrix3fv(uPaperLocation, false, paperMatrix);
gl.uniform2f(uDesignLocation, SCENE.width, SCENE.height);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// ==========================================
// 6. Render
// ==========================================
function drawScene() {
    if (!gl || gl.isContextLost()) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.round(width * SCENE.height / SCENE.width);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.02, 0.07, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

// ==========================================
// 7. Event Listeners & Inisiasi
// ==========================================
canvas.addEventListener("webglcontextlost", event => event.preventDefault());

if (window.ResizeObserver) {
    new ResizeObserver(drawScene).observe(canvas);
} else {
    window.addEventListener("resize", drawScene);
}

drawScene();