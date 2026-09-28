import { Mat3 } from "./matrix3.js";

const vertexShaderSource = `#version 300 es
in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  vec3 position = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

export function createRenderer2D(canvas) {
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    alert("WebGL2 tidak tersedia pada browser/perangkat ini.");
    throw new Error("WebGL2 tidak tersedia.");
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  const colorLocation = gl.getUniformLocation(program, "u_color");

  // create mesh function
  function createMesh(positions) {
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    return {
      buffer,
      vertexCount: positions.length / 2,
    };
  }

  // Lingkaran tetap dibuat dari kumpulan triangle seperti materi primitive.
  function createCircleMesh(segments) {
    const positions = [];

    for (let index = 0; index < segments; index++) {
      const angleA = index / segments * Math.PI * 2;
      const angleB = (index + 1) / segments * Math.PI * 2;

      positions.push(
        0, 0,
        Math.cos(angleA), Math.sin(angleA),
        Math.cos(angleB), Math.sin(angleB),
      );
    }

    return createMesh(new Float32Array(positions));
  }

  function createStarMesh(segments) {
    const positions = [];
    const outerRadius = 1;
    const innerRadius = 0.4;
    const totalSeg = segments*2;

    for(let index = 0; index < totalSeg; index++){
      const angleA = index/totalSeg * Math.PI * 2;
      const angleB = (index+1)/totalSeg * Math.PI * 2;

      const radiusA = index % 2 === 0 ? outerRadius : innerRadius;
      const radiusB = (index + 1) % 2 === 0 ? outerRadius : innerRadius;

      positions.push(
      0,0,
      Math.cos(angleA) * radiusA, Math.sin(angleA) * radiusA,
      Math.cos(angleB) * radiusB, Math.sin(angleB) * radiusB,
      );
    }

    return createMesh(new Float32Array(positions));
  }

  // Geometry selalu berada di local coordinate dan dapat dipakai ulang.
  const squareMesh = createMesh(new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.5, 0.5,

    -0.5, -0.5,
    0.5, 0.5,
    -0.5, 0.5,
  ]));

  const triangleMesh = createMesh(new Float32Array([
    -0.5, -0.5,
    0.5, -0.5,
    0.0, 0.5,
  ]));

  const circleMesh = createCircleMesh(40);
  const starMesh = createStarMesh(5);
  const scene = [];

  function createObject(mesh, {
    x = 0,
    y = 0,
    scaleX = 1,
    scaleY = 1,
    rotation = 0,
    color = [1, 1, 1, 1],
  } = {}) {
    return {
      mesh,
      x,
      y,
      scaleX,
      scaleY,
      rotation,
      color: new Float32Array(color),
    };
  }

  // Grup memiliki transform sendiri. Posisi anggota relatif terhadap grup.
  function group({
    x = 0,
    y = 0,
    rotation = 0,
    scaleX = 1,
    scaleY = 1,
  } = {}) {
    const children = [];
    return {
      x,
      y,
      rotation,
      scaleX,
      scaleY,
      children,
      add(...objects) {
        children.push(...objects);
        return this;
      },
    };
  }

  function rectangle({ x = 0, y = 0, width = 1, height = 1, rotation = 0, color } = {}) {
    return createObject(squareMesh, {
      x,
      y,
      scaleX: width,
      scaleY: height,
      rotation,
      color,
    });
  }

  function triangle({ x = 0, y = 0, width = 1, height = 1, rotation = 0, color } = {}) {
    return createObject(triangleMesh, {
      x,
      y,
      scaleX: width,
      scaleY: height,
      rotation,
      color,
    });
  }

  function circle({ x = 0, y = 0, radius = 0.5, color } = {}) {
    return createObject(circleMesh, {
      x,
      y,
      scaleX: radius,
      scaleY: radius,
      color,
    });
  }

  function star({ x = 0, y = 0, radius = 0.5, rotation = 0, color } = {}) {
    return createObject(starMesh, {
      x,
      y,
      scaleX: radius,
      scaleY: radius,
      rotation,
      color,
    });
  }


  function createModelMatrix(object) {
    const translation = Mat3.translation(object.x, object.y);
    const rotation = Mat3.rotation(degToRad(object.rotation));
    const scaling = Mat3.scaling(object.scaleX, object.scaleY);

    // T × R × S: vertex mengalami skala, lalu rotasi, lalu translasi.
    return Mat3.multiply(translation, Mat3.multiply(rotation, scaling));
  }

  function drawObject(object, parentMatrix) {
    // World anggota = World grup × Local anggota (Praktikum 3, bagian 57).
    const worldMatrix = Mat3.multiply(parentMatrix, createModelMatrix(object));

    if (object.mesh) {
      gl.bindBuffer(gl.ARRAY_BUFFER, object.mesh.buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix3fv(matrixLocation, false, worldMatrix);
      gl.uniform4fv(colorLocation, object.color);
      gl.drawArrays(gl.TRIANGLES, 0, object.mesh.vertexCount);
    }

    // Grup juga boleh berisi grup lain. Urutan add menentukan urutan gambar.
    if (object.children) {
      for (const child of object.children) {
        drawObject(child, worldMatrix);
      }
    }
  }

  function add(...objects) {
    scene.push(...objects);
  }

  function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    for (const object of scene) {
      drawObject(object, Mat3.identity());
    }
  }

  function start(update = () => {}) {
    let startedAt = performance.now();
    let lastTime = startedAt;

    function frame(time) {
      const seconds = (time - startedAt) * 0.001;
      const deltaTime = Math.min((time - lastTime) * 0.001, 0.05);
      lastTime = time;

      update(seconds, deltaTime);
      render();
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    return {
      reset() {
        startedAt = performance.now();
        lastTime = startedAt;
      },
    };
  }

  return {
    group,
    rectangle,
    triangle,
    circle,
    star,
    createMesh,
    createObject,
    add,
    render,
    start,
  };
}

function degToRad(degree) {
  return degree * Math.PI / 180;
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
