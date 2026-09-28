import { Mat3 } from "./matrix3.js";

const vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;
out vec2 v_localPosition;

void main() {
  vec3 position = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_localPosition = a_position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_localPosition;
uniform vec4 u_color;
uniform float u_texture;
out vec4 outColor;

float randomNoise(vec2 position) {
  return fract(sin(dot(position, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 textureCoordinate = floor(v_localPosition * 650.0);
  float noise = randomNoise(textureCoordinate + floor(gl_FragCoord.xy * 0.12));
  float colorVariation = (noise - 0.5) * 0.14 * u_texture;
  float whiteFleck = smoothstep(0.88, 1.0, noise) * 0.38 * u_texture;
  
  vec3 color = u_color.rgb + colorVariation;
  color = mix(color, vec3(1.0), whiteFleck);
  
  outColor = vec4(clamp(color, 0.0, 1.0), u_color.a);
}
`;

function degToRad(degree) {
  return (degree * Math.PI) / 180;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader gagal dikompilasi:\n" + info);
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
    throw new Error("Program gagal di-link:\n" + info);
  }
  return program;
}

export function createRenderer2D(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!gl) throw new Error("WebGL2 tidak tersedia.");

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  const colorLocation = gl.getUniformLocation(program, "u_color");
  const textureLocation = gl.getUniformLocation(program, "u_texture");

  function createMesh(positions) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return { buffer, vertexCount: positions.length / 2 };
  }

  function createCircleMesh(segments = 64) {
    const positions = [];
    for (let index = 0; index < segments; index++) {
      const angleA = (index / segments) * Math.PI * 2;
      const angleB = ((index + 1) / segments) * Math.PI * 2;
      positions.push(0, 0, Math.cos(angleA), Math.sin(angleA), Math.cos(angleB), Math.sin(angleB));
    }
    return createMesh(new Float32Array(positions));
  }

  function createStarMesh(pointCount, innerRadius = 0.42) {
    const positions = [];
    const totalPoints = pointCount * 2;
    for (let index = 0; index < totalPoints; index++) {
      const angleA = (index / totalPoints) * Math.PI * 2;
      const angleB = ((index + 1) / totalPoints) * Math.PI * 2;
      const radiusA = index % 2 === 0 ? 1 : innerRadius;
      const radiusB = (index + 1) % 2 === 0 ? 1 : innerRadius;
      positions.push(0, 0, Math.cos(angleA) * radiusA, Math.sin(angleA) * radiusA, Math.cos(angleB) * radiusB, Math.sin(angleB) * radiusB);
    }
    return createMesh(new Float32Array(positions));
  }

  function createPolygonMesh(points) {
    if (!Array.isArray(points) || points.length < 3) throw new Error("Polygon minimal memiliki 3 titik.");
    const positions = [];
    let cx = 0, cy = 0;
    
    for (const [x, y] of points) { cx += x; cy += y; }
    cx /= points.length; cy /= points.length;

    for (let i = 0; i < points.length; i++) {
      const current = points[i], next = points[(i + 1) % points.length];
      positions.push(cx, cy, current[0], current[1], next[0], next[1]);
    }
    return createMesh(new Float32Array(positions));
  }

  function createArcMesh({ radiusX, radiusY, thickness, startAngle, endAngle, segments }) {
    const positions = [];
    const start = degToRad(startAngle), end = degToRad(endAngle);
    const outerRadiusX = radiusX + thickness / 2, outerRadiusY = radiusY + thickness / 2;
    const innerRadiusX = Math.max(0.001, radiusX - thickness / 2), innerRadiusY = Math.max(0.001, radiusY - thickness / 2);

    for (let index = 0; index < segments; index++) {
      const angleA = start + (end - start) * (index / segments);
      const angleB = start + (end - start) * ((index + 1) / segments);

      const outerA = [Math.cos(angleA) * outerRadiusX, Math.sin(angleA) * outerRadiusY];
      const innerA = [Math.cos(angleA) * innerRadiusX, Math.sin(angleA) * innerRadiusY];
      const outerB = [Math.cos(angleB) * outerRadiusX, Math.sin(angleB) * outerRadiusY];
      const innerB = [Math.cos(angleB) * innerRadiusX, Math.sin(angleB) * innerRadiusY];

      positions.push(
        outerA[0], outerA[1], innerA[0], innerA[1], outerB[0], outerB[1],
        innerA[0], innerA[1], innerB[0], innerB[1], outerB[0], outerB[1]
      );
    }
    return createMesh(new Float32Array(positions));
  }

  const squareMesh = createMesh(new Float32Array([
    -0.5, -0.5,  
    0.5, -0.5,  
    0.5,  0.5,
    -0.5, -0.5,  
    0.5,  0.5, 
    -0.5,  0.5,
  ]));

  const triangleMesh = createMesh(new Float32Array([
    -0.5, -0.5,  
    0.5, -0.5,  
    0.0,  0.5,
  ]));

  const circleMesh = createCircleMesh(72);
  const starMesh = createStarMesh(5, 0.43);
  const starMesh4 = createStarMesh(4, 0.46);
  const arcMeshCache = new Map();
  const scene = [];

  function createObject(mesh, { x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, color = [1, 1, 1, 1], texture = 0.12 } = {}) {
    return { mesh, x, y, scaleX, scaleY, rotation, color: new Float32Array(color), texture };
  }

  function group({ x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1 } = {}) {
    const children = [];
    return {
      x, y, rotation, scaleX, scaleY, children,
      add(...objects) { children.push(...objects); return this; },
    };
  }

  function rectangle({ x = 0, y = 0, width = 1, height = 1, rotation = 0, color, texture = 0.12 } = {}) {
    return createObject(squareMesh, { x, y, scaleX: width, scaleY: height, rotation, color, texture });
  }

  function triangle({ x = 0, y = 0, width = 1, height = 1, rotation = 0, color, texture = 0.12 } = {}) {
    return createObject(triangleMesh, { x, y, scaleX: width, scaleY: height, rotation, color, texture });
  }

  function polygon({ points, x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, color, texture = 0.12 } = {}) {
    return createObject(createPolygonMesh(points), { x, y, scaleX, scaleY, rotation, color, texture });
  }

  function circle({ x = 0, y = 0, radius = 0.5, color, texture = 0.12 } = {}) {
    return createObject(circleMesh, { x, y, scaleX: radius, scaleY: radius, color, texture });
  }

  function ellipse({ x = 0, y = 0, radiusX = 0.5, radiusY = 0.25, rotation = 0, color, texture = 0.12 } = {}) {
    return createObject(circleMesh, { x, y, scaleX: radiusX, scaleY: radiusY, rotation, color, texture });
  }

  function star({ x = 0, y = 0, radius = 0.5, rotation = 0, color, texture = 0.12 } = {}) {
    return createObject(starMesh, { x, y, scaleX: radius, scaleY: radius, rotation, color, texture });
  }

  function star4({ x = 0, y = 0, radius = 0.5, rotation = 0, color, texture = 0.12 } = {}) {
    return createObject(starMesh4, { x, y, scaleX: radius, scaleY: radius, rotation, color, texture });
  }

  function arc({ x = 0, y = 0, radiusX = 0.5, radiusY = 0.25, thickness = 0.02, startAngle = 0, endAngle = 180, rotation = 0, color, texture = 0.05, segments } = {}) {
    const angleRange = Math.abs(endAngle - startAngle);
    const actualSegments = segments ?? Math.max(12, Math.ceil((angleRange / 360) * 80));
    const cacheKey = `${radiusX}:${radiusY}:${thickness}:${startAngle}:${endAngle}:${actualSegments}`;

    let mesh = arcMeshCache.get(cacheKey);
    if (!mesh) {
      mesh = createArcMesh({ radiusX, radiusY, thickness, startAngle, endAngle, segments: actualSegments });
      arcMeshCache.set(cacheKey, mesh);
    }
    return createObject(mesh, { x, y, rotation, color, texture });
  }

  function ring({ x = 0, y = 0, radiusX = 0.5, radiusY = 0.25, thickness = 0.02, rotation = 0, color, texture = 0.05, segments = 80 } = {}) {
    return arc({ x, y, radiusX, radiusY, thickness, startAngle: 0, endAngle: 360, rotation, color, texture, segments });
  }

  function createModelMatrix(object) {
    const translation = Mat3.translation(object.x, object.y);
    const rotation = Mat3.rotation(degToRad(object.rotation));
    const scaling = Mat3.scaling(object.scaleX, object.scaleY);
    return Mat3.multiply(translation, Mat3.multiply(rotation, scaling));
  }

  function drawObject(object, parentMatrix) {
    const worldMatrix = Mat3.multiply(parentMatrix, createModelMatrix(object));

    if (object.mesh) {
      gl.bindBuffer(gl.ARRAY_BUFFER, object.mesh.buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix3fv(matrixLocation, false, worldMatrix);
      gl.uniform4fv(colorLocation, object.color);
      gl.uniform1f(textureLocation, object.texture);
      gl.drawArrays(gl.TRIANGLES, 0, object.mesh.vertexCount);
    }

    if (object.children) {
      for (const child of object.children) drawObject(child, worldMatrix);
    }
  }

  function add(...objects) {
    scene.push(...objects);
  }

  function resizeCanvasToDisplaySize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
    const displayHeight = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  function render() {
    resizeCanvasToDisplaySize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);

    const aspectCorrection = Mat3.scaling(1, canvas.width / canvas.height);
    for (const object of scene) drawObject(object, aspectCorrection);
  }

  function start(update = () => {}) {
    let startedAt = performance.now();
    let lastTime = startedAt;
    let animationFrameId = null;

    function frame(time) {
      const seconds = (time - startedAt) * 0.001;
      const deltaTime = Math.min(Math.max((time - lastTime) * 0.001, 0), 0.05);
      lastTime = time;

      update(seconds, deltaTime);
      render();
      animationFrameId = requestAnimationFrame(frame);
    }

    animationFrameId = requestAnimationFrame(frame);

    return {
      reset() {
        startedAt = performance.now();
        lastTime = startedAt;
      },
      stop() {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      },
    };
  }

  return {
    group, rectangle, triangle, polygon, circle, ellipse, star, star4, arc, ring,
    createMesh, createObject, add, render, start,
  };
}