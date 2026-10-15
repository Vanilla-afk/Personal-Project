// =====================================================
// Face stickers
// -----------------------------------------------------
// Stickers are drawn with canvas paths (not emoji) so they look
// the same on every device and scale/rotate with the face.
//
// Every draw function works in "face units": 1 unit = the distance
// between the eyes, and the canvas is rotated to follow head tilt.
// =====================================================

export const STICKERS = [
  { id: "none", name: "None", icon: "🚫" },
  { id: "sunglasses", name: "Shades", icon: "🕶️" },
  { id: "hearts", name: "Hearts", icon: "😍" },
  { id: "crown", name: "Crown", icon: "👑" },
  { id: "bunny", name: "Bunny", icon: "🐰" },
  { id: "cat", name: "Cat", icon: "🐱" },
  { id: "flowers", name: "Flowers", icon: "🌸" },
  { id: "party", name: "Party", icon: "🥳" },
  { id: "mustache", name: "Stache", icon: "🥸" },
  { id: "blush", name: "Blush", icon: "😊" },
];

// ---------- helpers ----------

// Move/rotate/scale the canvas into the face's coordinate system
function at(ctx, point, angle, unit, draw) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  ctx.scale(unit, unit);
  draw();
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heartPath(ctx, x, y, size) {
  const t = size / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + t * 0.95);
  ctx.bezierCurveTo(x - t * 1.4, y + t * 0.05, x - t * 0.95, y - t * 0.95, x, y - t * 0.4);
  ctx.bezierCurveTo(x + t * 0.95, y - t * 0.95, x + t * 1.4, y + t * 0.05, x, y + t * 0.95);
  ctx.closePath();
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

const lerpPoint = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

// ---------- individual stickers ----------

function sunglasses(ctx, face) {
  at(ctx, face.eyeCenter, face.angle, face.eyeDist, () => {
    const lens = (cx) => {
      roundedRect(ctx, cx - 0.4, -0.22, 0.8, 0.52, 0.2);
    };

    // Arms + bridge
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 0.07;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-0.9, -0.05);
    ctx.lineTo(-1.2, -0.12);
    ctx.moveTo(0.9, -0.05);
    ctx.lineTo(1.2, -0.12);
    ctx.moveTo(-0.12, -0.08);
    ctx.quadraticCurveTo(0, -0.18, 0.12, -0.08);
    ctx.stroke();

    [-0.5, 0.5].forEach((cx) => {
      const g = ctx.createLinearGradient(cx - 0.4, -0.2, cx + 0.4, 0.3);
      g.addColorStop(0, "#3a3a44");
      g.addColorStop(1, "#050507");

      lens(cx);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 0.07;
      ctx.strokeStyle = "#111";
      ctx.stroke();

      // Shine
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.moveTo(cx - 0.25, -0.05);
      ctx.lineTo(cx - 0.05, -0.15);
      ctx.stroke();
    });
  });
}

function heartGlasses(ctx, face) {
  at(ctx, face.eyeCenter, face.angle, face.eyeDist, () => {
    [-0.5, 0.5].forEach((cx) => {
      heartPath(ctx, cx, 0.02, 0.95);
      const g = ctx.createRadialGradient(cx - 0.1, -0.12, 0.03, cx, 0.02, 0.55);
      g.addColorStop(0, "#ff7a9c");
      g.addColorStop(1, "#e0124d");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 0.05;
      ctx.strokeStyle = "#8d0a30";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(cx - 0.2, -0.13, 0.07, 0.04, -0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function crown(ctx, face) {
  at(ctx, face.forehead, face.angle, face.eyeDist, () => {
    const g = ctx.createLinearGradient(0, -0.8, 0, 0.1);
    g.addColorStop(0, "#ffe27a");
    g.addColorStop(1, "#d99a12");

    ctx.beginPath();
    ctx.moveTo(-0.75, 0.08);
    ctx.lineTo(-0.82, -0.6);
    ctx.lineTo(-0.4, -0.28);
    ctx.lineTo(0, -0.85);
    ctx.lineTo(0.4, -0.28);
    ctx.lineTo(0.82, -0.6);
    ctx.lineTo(0.75, 0.08);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 0.04;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#8a5a00";
    ctx.stroke();

    // Band
    ctx.fillStyle = "rgba(138,90,0,0.35)";
    ctx.fillRect(-0.75, -0.08, 1.5, 0.16);

    // Jewels
    [
      [-0.82, -0.6, "#ff3d6e"],
      [0, -0.85, "#3db2ff"],
      [0.82, -0.6, "#ff3d6e"],
    ].forEach(([x, y, color]) => {
      ctx.beginPath();
      ctx.arc(x, y, 0.07, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 0.02;
      ctx.stroke();
    });

    [-0.4, 0, 0.4].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, 0, 0.05, 0, Math.PI * 2);
      ctx.fillStyle = "#fff6c9";
      ctx.fill();
    });
  });
}

function bunny(ctx, face) {
  at(ctx, face.forehead, face.angle, face.eyeDist, () => {
    [-1, 1].forEach((side) => {
      const x = side * 0.42;

      ctx.save();
      ctx.translate(x, -0.55);
      ctx.rotate(side * 0.18);

      ctx.beginPath();
      ctx.ellipse(0, 0, 0.2, 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.lineWidth = 0.04;
      ctx.strokeStyle = "#f4a8c4";
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0.05, 0.1, 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffb6cf";
      ctx.fill();

      ctx.restore();
    });
  });
}

function cat(ctx, face) {
  // Ears
  at(ctx, face.forehead, face.angle, face.eyeDist, () => {
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side * 0.88, 0.15);
      ctx.lineTo(side * 0.78, -0.62);
      ctx.lineTo(side * 0.25, -0.02);
      ctx.closePath();
      ctx.fillStyle = "#3d3d45";
      ctx.fill();
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.04;
      ctx.strokeStyle = "#222";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(side * 0.76, 0.05);
      ctx.lineTo(side * 0.72, -0.4);
      ctx.lineTo(side * 0.38, -0.02);
      ctx.closePath();
      ctx.fillStyle = "#ff9fba";
      ctx.fill();
    });
  });

  // Nose + whiskers
  at(ctx, face.nose, face.angle, face.eyeDist, () => {
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.06);
    ctx.lineTo(0.1, -0.06);
    ctx.lineTo(0, 0.07);
    ctx.closePath();
    ctx.fillStyle = "#ff7fa3";
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 0.03;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 0.04 * face.eyeDist;

    [-1, 1].forEach((side) => {
      [-0.08, 0.04, 0.16].forEach((dy, i) => {
        ctx.beginPath();
        ctx.moveTo(side * 0.32, 0.02 + dy * 0.6);
        ctx.lineTo(side * 1.05, -0.08 + dy + (i - 1) * 0.06);
        ctx.stroke();
      });
    });
  });
}

function flowers(ctx, face) {
  at(ctx, face.forehead, face.angle, face.eyeDist, () => {
    const colors = ["#ff8fb1", "#ffd166", "#ffffff", "#9be7ff", "#c7a6ff"];
    const count = 9;

    // Leaves
    ctx.fillStyle = "#4caf6a";
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1;
      const x = t * 1.0 + 0.06;
      const y = 0.12 - 0.35 * (1 - t * t);
      ctx.beginPath();
      ctx.ellipse(x, y + 0.08, 0.12, 0.05, t * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1;
      const x = t * 1.0;
      const y = 0.12 - 0.35 * (1 - t * t);
      const r = i % 2 ? 0.1 : 0.13;

      ctx.fillStyle = colors[i % colors.length];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = "#ffb703";
      ctx.fill();
    }
  });
}

function party(ctx, face) {
  at(ctx, face.forehead, face.angle, face.eyeDist, () => {
    ctx.save();
    ctx.rotate(0.12);

    ctx.beginPath();
    ctx.moveTo(-0.5, 0.1);
    ctx.lineTo(0.5, 0.1);
    ctx.lineTo(0, -1.25);
    ctx.closePath();

    const g = ctx.createLinearGradient(-0.5, 0, 0.5, 0);
    g.addColorStop(0, "#ff5fa2");
    g.addColorStop(1, "#7a5cff");
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 0.1;
    for (let i = -2; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-0.7, -1.3 + i * 0.32);
      ctx.lineTo(0.7, -1.0 + i * 0.32);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, -1.27, 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd84a";
    ctx.fill();

    ctx.restore();
  });
}

function mustache(ctx, face) {
  const point = lerpPoint(face.nose, face.mouth, 0.55);

  at(ctx, point, face.angle, face.eyeDist, () => {
    ctx.fillStyle = "#35200f";
    ctx.beginPath();
    ctx.moveTo(0, -0.04);
    // right side
    ctx.bezierCurveTo(0.12, -0.16, 0.38, -0.16, 0.5, -0.04);
    ctx.bezierCurveTo(0.6, 0.05, 0.7, 0.0, 0.72, -0.12);
    ctx.bezierCurveTo(0.8, 0.1, 0.62, 0.22, 0.42, 0.14);
    ctx.bezierCurveTo(0.26, 0.08, 0.12, 0.1, 0, 0.08);
    // left side (mirror)
    ctx.bezierCurveTo(-0.12, 0.1, -0.26, 0.08, -0.42, 0.14);
    ctx.bezierCurveTo(-0.62, 0.22, -0.8, 0.1, -0.72, -0.12);
    ctx.bezierCurveTo(-0.7, 0.0, -0.6, 0.05, -0.5, -0.04);
    ctx.bezierCurveTo(-0.38, -0.16, -0.12, -0.16, 0, -0.04);
    ctx.closePath();
    ctx.fill();
  });
}

function blush(ctx, face) {
  [face.cheekL, face.cheekR].forEach((cheek) => {
    at(ctx, cheek, face.angle, face.eyeDist, () => {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.32);
      g.addColorStop(0, "rgba(255,90,130,0.6)");
      g.addColorStop(1, "rgba(255,90,130,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.36, 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  at(ctx, face.eyeCenter, face.angle, face.eyeDist, () => {
    star(ctx, -0.95, -0.5, 0.1, "rgba(255,255,255,0.95)");
    star(ctx, 0.98, -0.42, 0.07, "rgba(255,230,140,0.95)");
    star(ctx, -1.1, -0.22, 0.05, "rgba(255,230,140,0.95)");
  });
}

const DRAWERS = {
  sunglasses,
  hearts: heartGlasses,
  crown,
  bunny,
  cat,
  flowers,
  party,
  mustache,
  blush,
};

/**
 * Draw a sticker on every detected face.
 * Set `mirror` to flip horizontally (used when baking into the
 * mirrored captured photo).
 */
export function drawStickers(ctx, faces, stickerId, { mirror = false } = {}) {
  const draw = DRAWERS[stickerId];

  if (!draw || !faces?.length) return;

  ctx.save();

  if (mirror) {
    ctx.translate(ctx.canvas.width, 0);
    ctx.scale(-1, 1);
  }

  faces.forEach((face) => draw(ctx, face));

  ctx.restore();
}
