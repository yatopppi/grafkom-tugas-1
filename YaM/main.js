import { drawCloud, drawSun, drawGrass, drawFlower, drawChicken, drawEgg, getShapeData } from "./objects.js";

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

// Ukuran kanvas dan susunan adegan. Detail bentuk ada di objects.js.
const DESIGN_WIDTH = 736;
const DESIGN_HEIGHT = 940;
const CRAYON_STRENGTH = 0.72;

// Komposisi adegan: setiap entri bisa dipindah, diubah ukuran, atau dipakai ulang.
drawCloud({ x: 182, y: 150, width: 270, height: 120 });
drawCloud({ x: 593, y: 380, width: 205, height: 90 });
drawSun({ x: 596, y: 167 });
drawGrass({ x: 368, y: 900 });
drawFlower({ x: 108, y: 798 });
drawChicken({ x: 350, y: 550 });
drawEgg({ x: 556, y: 832, rx: 39, ry: 48, rotation: 0.62, fill: "#f5bc6b" });
drawEgg({ x: 639, y: 852, rx: 40, ry: 46, rotation: 0.77, fill: "#fae8b8" });

// Contoh variasi (tambahkan sebelum getShapeData):
// drawChicken({ x: 500, y: 560, scale: 0.5, tailCount: 4, colors: { red: "#d84848" } });
// drawSun({ x: 100, y: 100, radius: 40, rays: 12 });
// drawGrass({ x: 300, y: 900, width: 400, count: 25, seed: 8 });

const shapeData = getShapeData();
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
