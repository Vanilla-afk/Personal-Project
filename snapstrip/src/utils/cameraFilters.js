// =====================================================
// Shared camera filters
// -----------------------------------------------------
// Each filter is described with simple numeric params so the
// same definition can drive:
//   1. the live video preview (CSS `filter`)
//   2. the captured photo (canvas `ctx.filter`)
//   3. a pixel-based fallback for browsers (Safari/iOS) where
//      `ctx.filter` is not supported
// Optional `vignette` (0-1) and `tint` (rgba string) are drawn
// as overlays on both the preview and the captured image.
// =====================================================

export const CAMERA_FILTERS = [
  { id: "original", name: "Original", params: {} },
  {
    id: "noir",
    name: "Noir",
    params: { grayscale: 1, contrast: 1.25, brightness: 0.95 },
    vignette: 0.45,
  },
  { id: "sepia", name: "Sepia", params: { sepia: 0.8 } },
  {
    id: "vintage",
    name: "Vintage",
    params: { sepia: 0.3, contrast: 1.1, saturate: 0.8 },
    vignette: 0.35,
  },
  {
    id: "warm",
    name: "Warm",
    params: { sepia: 0.2, saturate: 1.25, brightness: 1.05, hue: -10 },
  },
  { id: "cool", name: "Cool", params: { saturate: 0.8, hue: 15 } },
  {
    id: "fade",
    name: "Fade",
    params: { contrast: 0.85, brightness: 1.1, saturate: 0.8 },
  },
  { id: "vivid", name: "Vivid", params: { contrast: 1.15, saturate: 1.5 } },
  {
    id: "dreamy",
    name: "Dreamy",
    params: { brightness: 1.1, contrast: 0.9, saturate: 1.2 },
    tint: "rgba(255, 150, 200, 0.16)",
  },
  {
    id: "sunset",
    name: "Sunset",
    params: { sepia: 0.25, saturate: 1.4, contrast: 1.05, hue: -15 },
    tint: "rgba(255, 120, 60, 0.14)",
    vignette: 0.3,
  },
];

export function getFilter(id) {
  return CAMERA_FILTERS.find((f) => f.id === id) || CAMERA_FILTERS[0];
}

// Build a CSS filter string from params
export function filterToCss(filter) {
  const p = filter?.params || {};
  const parts = [];

  if (p.brightness != null) parts.push(`brightness(${p.brightness})`);
  if (p.contrast != null) parts.push(`contrast(${p.contrast})`);
  if (p.saturate != null) parts.push(`saturate(${p.saturate})`);
  if (p.grayscale != null) parts.push(`grayscale(${p.grayscale})`);
  if (p.sepia != null) parts.push(`sepia(${p.sepia})`);
  if (p.hue != null) parts.push(`hue-rotate(${p.hue}deg)`);

  return parts.join(" ");
}

// Gradient used for the live preview vignette overlay
export function vignetteCss(strength = 0) {
  if (!strength) return "none";
  return `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`;
}

// -----------------------------------------------------
// Canvas drawing
// -----------------------------------------------------

let nativeFilterSupport = null;

function supportsCanvasFilter() {
  if (nativeFilterSupport !== null) return nativeFilterSupport;

  try {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.filter = "grayscale(1)";
    nativeFilterSupport = ctx.filter === "grayscale(1)";
  } catch {
    nativeFilterSupport = false;
  }

  return nativeFilterSupport;
}

function mul(m, r, g, b) {
  return [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ];
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// Fallback for browsers without ctx.filter (e.g. Safari / iOS).
// Uses the same colour matrices as the CSS Filter Effects spec.
function applyPixelFilter(ctx, width, height, p) {
  const {
    brightness = 1,
    contrast = 1,
    saturate = 1,
    grayscale = 0,
    sepia = 0,
    hue = 0,
  } = p;

  const s = saturate;
  const g = 1 - grayscale;
  const sp = 1 - sepia;
  const rad = (hue * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const satM = [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
  ];
  const grayM = [
    0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g,
    0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g,
    0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g,
  ];
  const sepM = [
    0.393 + 0.607 * sp, 0.769 - 0.769 * sp, 0.189 - 0.189 * sp,
    0.349 - 0.349 * sp, 0.686 + 0.314 * sp, 0.168 - 0.168 * sp,
    0.272 - 0.272 * sp, 0.534 - 0.534 * sp, 0.131 + 0.869 * sp,
  ];
  const hueM = [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072,
  ];

  const image = ctx.getImageData(0, 0, width, height);
  const d = image.data;

  for (let i = 0; i < d.length; i += 4) {
    let r = clamp(d[i] * brightness);
    let gr = clamp(d[i + 1] * brightness);
    let b = clamp(d[i + 2] * brightness);

    r = clamp((r - 127.5) * contrast + 127.5);
    gr = clamp((gr - 127.5) * contrast + 127.5);
    b = clamp((b - 127.5) * contrast + 127.5);

    [r, gr, b] = mul(satM, r, gr, b).map(clamp);
    [r, gr, b] = mul(grayM, r, gr, b).map(clamp);
    [r, gr, b] = mul(sepM, r, gr, b).map(clamp);
    [r, gr, b] = mul(hueM, r, gr, b).map(clamp);

    d[i] = r;
    d[i + 1] = gr;
    d[i + 2] = b;
  }

  ctx.putImageData(image, 0, 0);
}

function drawOverlays(ctx, width, height, filter) {
  if (filter.tint) {
    ctx.fillStyle = filter.tint;
    ctx.fillRect(0, 0, width, height);
  }

  if (filter.vignette) {
    const radius = Math.hypot(width, height) / 2;
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, radius * 0.55,
      width / 2, height / 2, radius
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${filter.vignette})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Draw a video frame (or image) onto a canvas with a filter applied.
 * Mirrors horizontally by default so the result matches the preview.
 */
export function drawFilteredFrame(
  canvas,
  source,
  width,
  height,
  filterId = "original",
  { mirror = true } = {}
) {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const filter = getFilter(filterId);
  const css = filterToCss(filter);
  const native = supportsCanvasFilter();

  ctx.save();

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  if (native && css) ctx.filter = css;

  ctx.drawImage(source, 0, 0, width, height);
  ctx.restore();

  if (!native && css) {
    applyPixelFilter(ctx, width, height, filter.params);
  }

  drawOverlays(ctx, width, height, filter);

  return canvas;
}
