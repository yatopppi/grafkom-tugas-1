const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2", { alpha: true });

if (!gl) {
    throw new Error("WebGL2 tidak tersedia.");
}

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

// 1. Data Objek
const DESIGN_WIDTH = 736;
const DESIGN_HEIGHT = 940;
const CRAYON_STRENGTH = 0.72; 

const COLORS = {
    outline: "#805333",
    body: "#fffefa",
    cream: "#fbefce",
    red: "#ed3029",
    yellow: "#ffce05",
    orange: "#ff941d",
    foot: "#ffbb05",
    blue: "#7bcce9",
    cloud: "#d7f0fb",
    pink: "#f38ba6",
    grass: "#78c83f",
    leaf: "#61bd35",
    eggOutline: "#d29b58",
};

// M = mulai, L = garis, C = kurva Bézier kubik, Z = tutup bentuk.
const PATHS = {
    cloudLeft: [
        ["M", 101, 137],
        ["C", 111, 90, 150, 70, 181, 109],
        ["C", 213, 77, 247, 77, 257, 121],
        ["C", 287, 104, 318, 122, 313, 151],
        ["C", 315, 177, 282, 190, 251, 178],
        ["C", 240, 209, 204, 225, 175, 194],
        ["C", 145, 222, 110, 214, 102, 181],
        ["C", 75, 197, 43, 182, 49, 156],
        ["C", 53, 135, 77, 123, 101, 137], ["Z"],
    ],
    cloudRight: [
        ["M", 531, 367],
        ["C", 534, 330, 574, 311, 596, 350],
        ["C", 621, 326, 650, 330, 661, 361],
        ["C", 686, 349, 703, 371, 693, 390],
        ["C", 682, 413, 659, 414, 641, 401],
        ["C", 625, 429, 591, 437, 570, 411],
        ["C", 550, 425, 534, 417, 529, 402],
        ["C", 505, 418, 487, 399, 492, 382],
        ["C", 496, 366, 515, 356, 531, 367], ["Z"],
    ],
    comb: [
        ["M", 218, 328],
        ["C", 205, 312, 203, 292, 215, 268],
        ["C", 232, 238, 261, 238, 276, 277],
        ["C", 279, 246, 293, 227, 313, 230],
        ["C", 337, 231, 345, 250, 346, 276],
        ["C", 369, 246, 396, 249, 407, 271],
        ["C", 418, 292, 407, 330, 386, 356],
        ["C", 329, 332, 269, 326, 218, 328], ["Z"],
    ],
    tail: [
        ["M", 550, 530],
        ["C", 572, 494, 602, 460, 619, 471],
        ["C", 650, 489, 619, 522, 597, 542],
        ["C", 625, 523, 665, 507, 675, 528],
        ["C", 692, 550, 662, 570, 634, 580],
        ["C", 663, 567, 686, 578, 686, 598],
        ["C", 685, 624, 646, 630, 587, 623],
        ["L", 550, 530], ["Z"],
    ],
    body: [
        ["M", 155, 397],
        ["C", 178, 352, 222, 319, 267, 315],
        ["C", 322, 302, 374, 330, 407, 379],
        ["C", 432, 415, 444, 455, 450, 500],
        ["C", 509, 501, 557, 518, 582, 555],
        ["C", 607, 591, 605, 643, 585, 690],
        ["C", 564, 751, 516, 779, 427, 787],
        ["C", 338, 799, 243, 780, 182, 744],
        ["C", 138, 719, 119, 675, 117, 624],
        ["C", 115, 585, 131, 548, 145, 520],
        ["C", 152, 492, 154, 472, 160, 455],
        ["C", 169, 438, 168, 418, 155, 397], ["Z"],
    ],
    wattle: [
        ["M", 145, 463],
        ["C", 125, 472, 95, 495, 93, 520],
        ["C", 88, 544, 105, 556, 119, 546],
        ["C", 131, 538, 137, 525, 142, 514],
        ["C", 141, 537, 150, 553, 168, 552],
        ["C", 187, 552, 199, 539, 196, 521],
        ["C", 191, 497, 166, 473, 153, 467],
        ["C", 150, 465, 147, 463, 145, 463], ["Z"],
    ],
    beak: [
        ["M", 157, 399],
        ["C", 135, 400, 109, 408, 84, 420],
        ["C", 97, 442, 126, 459, 157, 462],
        ["C", 171, 442, 170, 419, 157, 399], ["Z"],
    ],
    wing: [
        ["M", 313, 602],
        ["C", 309, 640, 337, 678, 370, 691],
        ["C", 397, 705, 427, 690, 431, 672],
        ["C", 456, 699, 479, 687, 489, 670],
        ["C", 498, 656, 486, 647, 480, 643],
        ["C", 508, 656, 531, 651, 540, 635],
        ["C", 553, 616, 531, 594, 498, 594],
    ],
};

// Format setiap vertex: x, y, r, g, b, a, kekuatan tekstur.
const shapeVertices = [];

function colorRGBA(hex, alpha = 1) {
    return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
        alpha,
    ];
}

function addTriangle(a, b, c, color, texture = 1) {
    for (const p of [a, b, c]) {
        shapeVertices.push(p[0], p[1], ...color, texture);
    }
}

function samplePath(commands) {
    const points = [];
    let current = [0, 0];

    for (const command of commands) {
        const [type, ...v] = command;
        if (type === "M" || type === "L") {
            current = [v[0], v[1]];
            points.push(current);
        } else if (type === "C") {
            const start = current;
            const length = Math.hypot(v[0] - start[0], v[1] - start[1])
                + Math.hypot(v[2] - v[0], v[3] - v[1])
                + Math.hypot(v[4] - v[2], v[5] - v[3]);
            const steps = Math.max(8, Math.ceil(length / 5));

            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const s = 1 - t;
                points.push([
                    s*s*s*start[0] + 3*s*s*t*v[0] + 3*s*t*t*v[2] + t*t*t*v[4],
                    s*s*s*start[1] + 3*s*s*t*v[1] + 3*s*t*t*v[3] + t*t*t*v[5],
                ]);
            }
            current = [v[4], v[5]];
        }
    }

    return points.filter((p, i) => i === 0
        || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 0.001);
}

function cross(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function fillShape(input, hex, alpha = 1, texture = 1) {
    const points = input.slice();
    if (Math.hypot(points[0][0] - points.at(-1)[0], points[0][1] - points.at(-1)[1]) < 0.001) {
        points.pop();
    }
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        area += a[0] * b[1] - b[0] * a[1];
    }
    if (area < 0) points.reverse();

    const indices = points.map((_, i) => i);
    const color = colorRGBA(hex, alpha);
    while (indices.length > 3) {
        let clipped = false;
        for (let i = 0; i < indices.length; i++) {
            const a = indices[(i + indices.length - 1) % indices.length];
            const b = indices[i];
            const c = indices[(i + 1) % indices.length];
            if (cross(points[a], points[b], points[c]) <= 0.00001) continue;

            const containsPoint = indices.some(j => j !== a && j !== b && j !== c
                && cross(points[a], points[b], points[j]) >= -0.00001
                && cross(points[b], points[c], points[j]) >= -0.00001
                && cross(points[c], points[a], points[j]) >= -0.00001);
            if (containsPoint) continue;

            addTriangle(points[a], points[b], points[c], color, texture);
            indices.splice(i, 1);
            clipped = true;
            break;
        }
        if (!clipped) throw new Error("Kontur tidak dapat ditriangulasi. Periksa titik yang berpotongan.");
    }
    if (indices.length === 3) {
        addTriangle(points[indices[0]], points[indices[1]], points[indices[2]], color, texture);
    }
}

function ellipsePoints(cx, cy, rx, ry, rotation = 0, roughness = 0.008) {
    const points = [];
    for (let i = 0; i < 100; i++) {
        const a = i / 100 * Math.PI * 2;
        const r = 1 + roughness * Math.sin(a * 7 + cx);
        const x = Math.cos(a) * rx * r;
        const y = Math.sin(a) * ry * r;
        points.push([
            cx + x * Math.cos(rotation) - y * Math.sin(rotation),
            cy + x * Math.sin(rotation) + y * Math.cos(rotation),
        ]);
    }
    return points;
}

function ellipse(cx, cy, rx, ry, hex, rotation = 0, texture = 1, alpha = 1) {
    const points = ellipsePoints(cx, cy, rx, ry, rotation);
    const color = colorRGBA(hex, alpha);
    for (let i = 0; i < points.length; i++) {
        addTriangle([cx, cy], points[i], points[(i + 1) % points.length], color, texture);
    }
}

function stroke(points, width, hex, closed = false, texture = 1, alpha = 1) {
    const color = colorRGBA(hex, alpha);
    const n = points.length;
    const edges = [];
    for (let i = 0; i < n; i++) {
        const previous = points[closed ? (i + n - 1) % n : Math.max(0, i - 1)];
        const next = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        const dx = next[0] - previous[0], dy = next[1] - previous[1];
        const length = Math.hypot(dx, dy) || 1;
        const radius = width * 0.5 * (1 + 0.075 * Math.sin(i * 1.63));
        const nx = -dy / length * radius, ny = dx / length * radius;
        edges.push([
            [points[i][0] + nx, points[i][1] + ny],
            [points[i][0] - nx, points[i][1] - ny],
        ]);
    }
    for (let i = 0; i < (closed ? n : n - 1); i++) {
        const j = (i + 1) % n;
        addTriangle(edges[i][0], edges[i][1], edges[j][0], color, texture);
        addTriangle(edges[i][1], edges[j][1], edges[j][0], color, texture);
    }
    if (!closed) {
        for (const p of [points[0], points[n - 1]]) {
            ellipse(p[0], p[1], width / 2, width / 2, hex, 0, texture, alpha);
        }
    }
}

function paintPath(commands, fill, outline = null, width = 7, texture = 1) {
    const points = samplePath(commands);
    if (fill) fillShape(points, fill, 1, texture);
    if (outline) stroke(points, width, outline, commands.at(-1)[0] === "Z", texture);
    return points;
}

function curve(commands, width, color, texture = 1, alpha = 1) {
    stroke(samplePath(commands), width, color, false, texture, alpha);
}

// A. Dua awan biru.
paintPath(PATHS.cloudLeft, COLORS.cloud, COLORS.blue, 8, 1.3);
paintPath(PATHS.cloudRight, COLORS.cloud, COLORS.blue, 7, 1.3);
curve([["M", 106, 153], ["C", 101, 166, 101, 175, 106, 185]], 5, COLORS.blue, 1.2, 0.75);
curve([["M", 186, 116], ["C", 176, 130, 168, 142, 163, 155]], 5, COLORS.blue, 1.2, 0.70);
curve([["M", 174, 192], ["C", 179, 180, 186, 166, 195, 157]], 5, COLORS.blue, 1.2, 0.65);
curve([["M", 258, 135], ["C", 256, 151, 252, 166, 247, 178]], 5, COLORS.blue, 1.2, 0.65);
curve([["M", 539, 377], ["C", 534, 389, 537, 400, 544, 407]], 4, COLORS.blue, 1.2, 0.60);
curve([["M", 600, 352], ["C", 594, 364, 589, 375, 586, 386]], 4, COLORS.blue, 1.2, 0.55);
curve([["M", 659, 366], ["C", 654, 381, 646, 392, 641, 403]], 4, COLORS.blue, 1.2, 0.65);

// B. Matahari dan sembilan garis sinarnya.
const sunRays = [
    [[582, 51], [586, 75]], [[655, 61], [645, 83]],
    [[690, 122], [708, 116]], [[690, 189], [708, 195]],[[660, 238], [675, 256]], 
    [[600, 255], [605, 277]], [[537, 244], [528, 264]],
    [[503, 207], [478, 218]], [[497, 146], [471, 141]],
    [[525, 96], [509, 77]],
];
sunRays.forEach(points => stroke(points, 10, COLORS.yellow, false, 1));
ellipse(596, 167, 73, 66, COLORS.yellow, 0.1, 0.85);
stroke(ellipsePoints(596, 167, 73, 66, 0.1), 7, "#f3c209", true, 1.1);

// C. Rumput
const grassBlades = [
    [61,899,47,890], [79,901,61,893], [95,898,87,877], [128,901,120,876],
    [142,899,146,873], [157,898,179,877], [175,900,191,873], [186,895,180,866],
    [199,898,193,856], [210,897,211,859], [224,900,216,874], [237,900,229,863],
    [252,899,242,878], [272,900,264,880], [284,899,299,879], [304,900,315,874],
    [319,897,333,864], [334,899,342,874], [351,901,371,876], [372,899,384,879],
    [390,898,410,876], [409,900,423,876], [426,899,438,876], [441,899,455,868],
    [458,899,475,869], [472,900,487,875], [487,900,506,875], [504,900,515,886],
    [527,900,541,886], [547,902,562,886], [563,903,577,891], [586,901,599,886],
    [603,902,621,891], [625,900,641,883], [645,901,665,884], [665,901,681,884],
    [685,899,705,883],
];
grassBlades.forEach(([x, y, tx, ty], i) => {
    stroke([[x, y], [tx, ty]], 8 + i % 4, i % 3 ? COLORS.grass : "#8cd047", false, 1.35);
});

// D. Bunga merah
curve([["M", 123, 902], ["C", 116, 876, 111, 839, 106, 801]], 8, COLORS.leaf, 1.1);
paintPath([
    ["M", 113, 888], ["C", 87, 859, 63, 848, 47, 856],
    ["C", 47, 875, 85, 888, 113, 888], ["Z"],
], COLORS.leaf);
paintPath([
    ["M", 122, 883], ["C", 132, 852, 158, 838, 173, 838],
    ["C", 169, 864, 144, 881, 122, 883], ["Z"],
], COLORS.leaf);
paintPath([
    ["M", 108, 902], ["C", 84, 887, 62, 881, 46, 886],
    ["C", 55, 903, 84, 912, 108, 902], ["Z"],
], "#7acb3c");
const petals = [[101,774,13,20,-0.12], [132,784,22,12,-0.65],
    [133,816,23,13,0.45], [93,822,21,13,-0.7], [78,796,19,13,0.05]];
petals.forEach(([x,y,rx,ry,angle]) => ellipse(x,y,rx,ry,COLORS.red,angle,1.1));
ellipse(108,798,15,16,COLORS.yellow,-0.2,0.8);

// E. Kaki, ekor, dan jengger.
const feet = [
    [[283,780],[292,850]], [[237,849],[272,842],[325,847]],
    [[289,847],[260,873]], [[293,849],[302,876]],
    [[408,782],[417,852]], [[362,856],[397,847],[455,852]],
    [[414,852],[383,876]], [[417,852],[426,879]],
];
feet.forEach(points => stroke(points, 12, COLORS.foot, false, 1.1));
paintPath(PATHS.tail, COLORS.orange, "#f28b1e", 7, 0.95);
curve([["M",579,558],["C",600,550,617,536,637,532]], 5, "#ef821a");
curve([["M",590,592],["C",614,583,641,579,659,583]], 5, "#ec7e1a");
curve([["M",573,527],["C",593,497,604,485,618,481]], 3, "#ffe4a4", 1, 0.8);
curve([["M",614,547],["C",638,530,654,525,666,530]], 3, "#ffe4a4", 1, 0.8);
curve([["M",621,608],["C",645,594,660,590,672,594]], 3, "#ffe4a4", 1, 0.8);
paintPath(PATHS.comb, COLORS.red, "#de342b", 6, 1.05);
curve([["M",274,278],["C",272,291,274,304,277,311]], 5, "#d72e25", 1, 0.6);
curve([["M",347,276],["C",341,290,336,302,336,314]], 4, "#d72e25", 1, 0.6);

// F. Siluet badan putih dengan outline cokelat.
paintPath(PATHS.body, COLORS.body, COLORS.outline, 10, 0.75);

// Arsiran krem di leher, perut, dan sayap.
const creamStrokes = [
    [["M",365,356],["C",382,403,415,446,434,492]],
    [["M",372,368],["C",385,397,400,418,410,435]],
    [["M",390,396],["C",408,424,424,457,429,478]],
    [["M",148,554],["C",131,609,143,667,173,699]],
    [["M",159,555],["C",162,585,151,618,157,641]],
    [["M",180,676],["C",188,711,208,736,235,746]],
    [["M",204,683],["C",216,720,224,737,250,753]],
    [["M",236,716],["C",254,749,265,760,290,770]],
    [["M",330,614],["C",335,634,345,650,359,660]],
    [["M",344,606],["C",350,632,363,647,376,656]],
    [["M",462,529],["C",489,531,514,544,534,559]],
    [["M",499,543],["C",526,554,548,569,557,589]],
    [["M",552,642],["C",547,686,523,721,501,737]],
    [["M",566,647],["C",566,676,547,708,530,724]],
    [["M",510,693],["C",499,722,478,746,455,754]],
    [["M",484,706],["C",479,726,463,741,441,754]],
    [["M",335,743],["C",353,759,376,768,399,769]],
    [["M",365,728],["C",379,748,397,756,421,757]],
];
creamStrokes.forEach((path,i) => curve(path, 6 + i % 5, COLORS.cream, 1.5, 0.6));

// G. Sayap, paruh, pial merah, mata, dan pipi.
paintPath(PATHS.wing, null, COLORS.outline, 8, 0.85);
paintPath(PATHS.wattle, COLORS.red, "#e43228", 5, 1.1);
curve([["M",139,482],["C",123,501,111,519,108,532]], 3, "#ffad95", 1, 0.65);
curve([["M",156,492],["C",159,512,161,531,170,537]], 3, "#ffad95", 1, 0.65);
paintPath(PATHS.beak, COLORS.yellow, "#f5ad07", 7, 0.9);
curve([["M",92,424],["C",113,422,136,412,154,407]], 3, "#ffe87c", 1, 0.8);
ellipse(240,424,16,23,"#20201c",0.12,0.24);
ellipse(285,465,37,28,COLORS.pink,-0.25,1.05);

// H. Dua telur di kanan bawah
function drawEgg(cx, cy, rx, ry, rotation, fill) {
    const eggPath = [
        ["M",0,-1], ["C",0.55,-1.05,0.91,-0.35,1,0.2],
        ["C",1.11,0.79,0.60,1,-0.02,1],
        ["C",-0.68,1,-1.1,0.70,-0.98,0.13],
        ["C",-0.87,-0.39,-0.48,-1.01,0,-1], ["Z"],
    ];
    function transform([x,y]) {
        return [cx+x*rx*Math.cos(rotation)-y*ry*Math.sin(rotation),
            cy+x*rx*Math.sin(rotation)+y*ry*Math.cos(rotation)];
    }
    const points = samplePath(eggPath).map(transform);
    fillShape(points,fill,1,1.0);
    stroke(points,8,COLORS.eggOutline,true,1.0);
    const highlight = samplePath([
        ["M",-0.67,0.3],["C",-0.72,-0.26,-0.41,-0.73,-0.12,-0.8],
    ]).map(transform);
    stroke(highlight,5,"#fff8db",false,1.1,0.85);
}
drawEgg(556,832,39,48,0.62,"#f5bc6b");
drawEgg(639,852,40,46,0.77,"#fae8b8");

const shapeData = new Float32Array(shapeVertices);
const VERTEX_COUNT = shapeData.length / 7;

// 2. Shaders
const shapeVertexShaderSource = `#version 300 es
in vec2 a_position;
in vec4 a_color;
in float a_texture;
uniform vec2 u_resolution;

out vec2 v_position;
out vec4 v_color;
out float v_texture;

void main() {
    vec2 position = a_position / u_resolution;
    vec2 clipSpace = position * 2.0 - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    v_position = a_position;
    v_color = a_color;
    v_texture = a_texture;
}
`;

const shapeFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_position;
in vec4 v_color;
in float v_texture;
uniform float u_crayon;
out vec4 outColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    float grain = hash(floor(v_position * 1.5));
    float patches = hash(floor(v_position * 0.47));
    float flecks = smoothstep(0.73, 0.99, grain) * 0.65;
    float paper = smoothstep(0.88, 1.0, patches) * 0.18;
    float amount = clamp((flecks + paper) * v_texture * u_crayon, 0.0, 0.9);
    vec3 color = mix(v_color.rgb, vec3(1.0), amount);
    outColor = vec4(color, v_color.a);
}
`;

const shapeVertexShader = createShader(gl, gl.VERTEX_SHADER, shapeVertexShaderSource);
const shapeFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shapeFragmentShaderSource);
const shapeProgram = createProgram(gl, shapeVertexShader, shapeFragmentShader);

// 3. Setup Buffer & Attribute Locations
const shapeBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
gl.bufferData(gl.ARRAY_BUFFER, shapeData, gl.STATIC_DRAW);

const shapePositionLocation = gl.getAttribLocation(shapeProgram, "a_position");
const shapeColorLocation = gl.getAttribLocation(shapeProgram, "a_color");
const shapeTextureLocation = gl.getAttribLocation(shapeProgram, "a_texture");
const resolutionLocation = gl.getUniformLocation(shapeProgram, "u_resolution");
const crayonLocation = gl.getUniformLocation(shapeProgram, "u_crayon");

// 4. Render
function drawScene() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = canvas.clientWidth || DESIGN_WIDTH;
    const width = Math.max(1, Math.round(displayWidth * pixelRatio));
    const height = Math.max(1, Math.round(width * DESIGN_HEIGHT / DESIGN_WIDTH));
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(shapeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);

    gl.enableVertexAttribArray(shapePositionLocation);
    gl.vertexAttribPointer(shapePositionLocation, 2, gl.FLOAT, false, 7 * 4, 0);

    gl.enableVertexAttribArray(shapeColorLocation);
    gl.vertexAttribPointer(shapeColorLocation, 4, gl.FLOAT, false, 7 * 4, 2 * 4);

    gl.enableVertexAttribArray(shapeTextureLocation);
    gl.vertexAttribPointer(shapeTextureLocation, 1, gl.FLOAT, false, 7 * 4, 6 * 4);

    gl.uniform2f(resolutionLocation, DESIGN_WIDTH, DESIGN_HEIGHT);
    gl.uniform1f(crayonLocation, CRAYON_STRENGTH);
    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
}

drawScene();
window.addEventListener("resize", drawScene);
if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(drawScene);
    resizeObserver.observe(canvas);
}
