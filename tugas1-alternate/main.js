import { createRenderer2D } from "./renderer2d.js";

const canvas = document.getElementById("glCanvas");
const renderer = createRenderer2D(canvas);

const COLORS = {
  black: [0.08, 0.075, 0.065, 1],
  yellow: [1.0, 0.93, 0.02, 1],
  cyan: [0.25, 0.86, 0.82, 1],
  blue: [0.08, 0.64, 0.91, 1],
  planetBlue: [0.12, 0.68, 0.91, 1],
  red: [0.96, 0.22, 0.28, 1],
  orange: [1.0, 0.66, 0.16, 1],
  darkOrange: [0.78, 0.23, 0.12, 1],
  white: [1, 1, 1, 1],
};

const STAR_DATA = [
  { type: "star4", x: -0.37, y: 1.19, radius: 0.12, rotation: 0, scaleX: 0.95, scaleY: 1.08, color: COLORS.yellow },
  { type: "star", x: 0.67, y: 1.29, radius: 0.18, rotation: 82, scaleX: 0.94, scaleY: 1.05, color: COLORS.cyan },
  { type: "star", x: -0.71, y: 0.75, radius: 0.16, rotation: 96, scaleX: 0.96, scaleY: 1.05, color: COLORS.blue },
  { type: "star", x: 0.82, y: 0.58, radius: 0.13, rotation: 88, scaleX: 0.96, scaleY: 1.0, color: COLORS.yellow },
];

function createOutlinedStar({ type, x, y, radius, rotation, scaleX, scaleY, color }) {
  const starGroup = renderer.group({ x, y, rotation, scaleX, scaleY });
  const createStar = type === "star4" ? renderer.star4 : renderer.star;
  starGroup.add(
    createStar({ radius, color: COLORS.black }),
    createStar({ radius: Math.max(0.01, radius - 0.018), color})
  );
  return starGroup;
}

const stars = STAR_DATA.map(createOutlinedStar);

const planetBiru = renderer.group({ x: -0.58, y: -1.19, rotation: 18 });
planetBiru.add(
  renderer.ring({ radiusX: 0.34, radiusY: 0.105, thickness: 0.045, color: COLORS.black}),
  renderer.ring({ radiusX: 0.34, radiusY: 0.105, thickness: 0.023, color: COLORS.red}),
  renderer.circle({ radius: 0.22, color: COLORS.black}),
  renderer.circle({ radius: 0.19, color: COLORS.planetBlue}),
  renderer.arc({ x: -0.025, y: 0.02, radiusX: 0.135, radiusY: 0.135, thickness: 0.014, startAngle: 105, endAngle: 148, color: COLORS.white }),
  renderer.circle({ x: -0.11, y: 0.005, radius: 0.023, color: COLORS.black}),
  renderer.circle({ x: 0.10, y: 0.08, radius: 0.022, color: COLORS.black}),
  renderer.circle({ x: 0.05, y: -0.13, radius: 0.019, color: COLORS.black}),
  renderer.arc({ radiusX: 0.34, radiusY: 0.105, thickness: 0.045, startAngle: 188, endAngle: 354, color: COLORS.black}),
  renderer.arc({ radiusX: 0.34, radiusY: 0.105, thickness: 0.023, startAngle: 188, endAngle: 354, color: COLORS.red})
);

const planetOranye = renderer.group({ x: 0.54, y: -1.35, rotation: 15 });
planetOranye.add(
  renderer.ring({ radiusX: 0.34, radiusY: 0.10, thickness: 0.044, color: COLORS.black}),
  renderer.ring({ radiusX: 0.34, radiusY: 0.10, thickness: 0.020, color: COLORS.black}),
  renderer.circle({ radius: 0.22, color: COLORS.black}),
  renderer.circle({ radius: 0.19, color: COLORS.orange}),
  renderer.arc({ x: -0.025, y: 0.015, radiusX: 0.14, radiusY: 0.14, thickness: 0.014, startAngle: 105, endAngle: 150, color: COLORS.white}),
  renderer.circle({ x: 0.008, y: 0.17, radius: 0.021, color: COLORS.black}),
  renderer.circle({ x: 0.105, y: 0.08, radius: 0.026, color: COLORS.black}),
  renderer.circle({ x: -0.12, y: 0.035, radius: 0.022, color: COLORS.black}),
  renderer.circle({ x: -0.105, y: -0.13, radius: 0.023, color: COLORS.darkOrange}),
  renderer.circle({ x: 0.105, y: -0.125, radius: 0.025, color: COLORS.darkOrange}),
  renderer.arc({ x: 0, y: -0.005, radiusX: 0.060, radiusY: 0.060, thickness: 0.014, startAngle: 190, endAngle: 350, color: COLORS.black}),
  renderer.arc({ radiusX: 0.34, radiusY: 0.10, thickness: 0.044, startAngle: 188, endAngle: 354, color: COLORS.black}),
  renderer.arc({ radiusX: 0.34, radiusY: 0.10, thickness: 0.020, startAngle: 188, endAngle: 354, color: COLORS.black})
);

function createOutlinedPolygon({ points, x = 0, y = 0, rotation = 0, fillColor, innerScaleX = 0.90, innerScaleY = 0.90}) {
  const group = renderer.group({ x, y, rotation });
  group.add(
    renderer.polygon({ points, color: COLORS.black}),
    renderer.polygon({ points, scaleX: innerScaleX, scaleY: innerScaleY, color: fillColor})
  );
  return group;
}

function createOutlinedTriangle({ x, y, width, height, rotation, fillColor }) {
  const group = renderer.group({ x, y, rotation });
  group.add(
    renderer.triangle({ width, height, color: COLORS.black}),
    renderer.triangle({ width: width * 0.78, height: height * 0.82, color: fillColor })
  );
  return group;
}

const rocket = renderer.group({ x: 0, y: 0.13, rotation: 0 });

const leftFin = createOutlinedPolygon({
  x: -0.40, y: -0.28, fillColor: COLORS.red, innerScaleX: 0.86, innerScaleY: 0.88,
  points: [[0.14, 0.30], [-0.10, 0.16], [-0.23, -0.22], [-0.08, -0.25], [0.14, -0.05]],
});

const rightFin = createOutlinedPolygon({
  x: 0.40, y: -0.28, fillColor: COLORS.red, innerScaleX: 0.86, innerScaleY: 0.88,
  points: [[-0.14, 0.30], [0.10, 0.16], [0.23, -0.22], [0.08, -0.25], [-0.14, -0.05]],
});

const flameLeft = createOutlinedTriangle({ x: -0.13, y: -0.90, width: 0.23, height: 0.40, rotation: 170, fillColor: COLORS.yellow });
const flameCenter = createOutlinedTriangle({ x: 0, y: -0.94, width: 0.25, height: 0.48, rotation: 180, fillColor: COLORS.yellow });
const flameRight = createOutlinedTriangle({ x: 0.13, y: -0.90, width: 0.23, height: 0.40, rotation: 190, fillColor: COLORS.yellow });

const rocketBody = createOutlinedPolygon({
  fillColor: COLORS.white, innerScaleX: 0.94, innerScaleY: 0.965,
  points: [[0.00, 0.88], [-0.20, 0.65], [-0.36, 0.28], [-0.44, -0.34], [-0.30, -0.68], [0.30, -0.68], [0.44, -0.34], [0.36, 0.28], [0.20, 0.65]],
});

const rocketNose = createOutlinedPolygon({
  x: 0, y: 0.61, fillColor: COLORS.red, innerScaleX: 0.88, innerScaleY: 0.87,
  points: [[0.00, 0.27], [-0.27, -0.13], [0.27, -0.13]],
});

const rocketWindow = renderer.group({ x: 0, y: 0.18 });
rocketWindow.add(
  renderer.circle({ radius: 0.215, color: COLORS.black}),
  renderer.circle({ radius: 0.183, color: COLORS.cyan}),
  renderer.circle({ radius: 0.157, color: COLORS.black}),
  renderer.circle({ radius: 0.132, color: COLORS.blue}),
  renderer.arc({ x: -0.015, y: 0.01, radiusX: 0.095, radiusY: 0.095, thickness: 0.012, startAngle: 105, endAngle: 145, color: COLORS.white})
);

const centerFin = renderer.group({ x: 0, y: -0.37, rotation: -8 });
centerFin.add(
  renderer.ellipse({ radiusX: 0.075, radiusY: 0.27, color: COLORS.black}),
  renderer.ellipse({ radiusX: 0.050, radiusY: 0.235, color: COLORS.red })
);

const rocketBand = createOutlinedPolygon({
  x: 0, y: -0.69, fillColor: COLORS.blue, innerScaleX: 0.88, innerScaleY: 0.72,
  points: [[-0.31, 0.09], [0.31, 0.09], [0.23, -0.09], [-0.23, -0.09]],
});

rocket.add(leftFin, rightFin, flameLeft, flameCenter, flameRight, rocketBody, rocketNose, rocketWindow, centerFin, rocketBand);

renderer.add(...stars, rocket, planetBiru, planetOranye);
renderer.render();

// window.addEventListener("resize", () => renderer.render());

// function resetScene() {
//   STAR_DATA.forEach((data, index) => {
//     Object.assign(stars[index], { x: data.x, y: data.y, rotation: data.rotation, scaleX: data.scaleX, scaleY: data.scaleY });
//   });
//   Object.assign(planetBiru, { x: -0.58, y: -1.19, rotation: 18 });
//   Object.assign(planetOranye, { x: 0.54, y: -1.35, rotation: 15 });
//   renderer.render();
// }

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && !event.repeat) {
    // resetScene();
  }
});

function mouseToNDC(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2.0 - 1.0,
    y: 1.0 - ((event.clientY - rect.top) / rect.height) * 2.0,
  };
}

canvas.addEventListener("mousemove", (event) => {
  const point = mouseToNDC(event);
  const info = document.getElementById("info");
  if (info) info.textContent = `Mouse NDC: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
});