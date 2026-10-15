// =====================================================
// Face tracking (MediaPipe Face Landmarker)
// -----------------------------------------------------
// The library is loaded lazily (dynamic import) the first time a
// sticker is chosen, so it never slows down the normal app start.
// The WASM runtime and the model are fetched from CDNs at runtime.
// =====================================================

/* global __MP_VERSION__ */
// Injected at build time from vite.config.js
const MP_VERSION = __MP_VERSION__;

const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise = null;
let landmarkerReady = false;

export function isFaceModelLoaded() {
  return landmarkerReady;
}

export function getFaceLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    const { FaceLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );

    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);

    const create = (delegate) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numFaces: 3,
      });

    let landmarker;

    try {
      landmarker = await create("GPU");
    } catch {
      // Some devices have no usable GPU delegate
      landmarker = await create("CPU");
    }

    landmarkerReady = true;
    return landmarker;
  })().catch((error) => {
    // Allow retrying later
    landmarkerPromise = null;
    throw error;
  });

  return landmarkerPromise;
}

// -----------------------------------------------------
// Landmarks -> a small "face" description in pixels
// -----------------------------------------------------

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function faceFromLandmarks(lm, width, height) {
  const p = (i) => ({ x: lm[i].x * width, y: lm[i].y * height });

  // Eye centres (average of each eye's corners)
  let eyeA = mid(p(33), p(133));
  let eyeB = mid(p(362), p(263));

  // eyeL is always the one with the smaller x in the image
  const eyeL = eyeA.x <= eyeB.x ? eyeA : eyeB;
  const eyeR = eyeA.x <= eyeB.x ? eyeB : eyeA;

  const eyeCenter = mid(eyeL, eyeR);
  const dx = eyeR.x - eyeL.x;
  const dy = eyeR.y - eyeL.y;

  const eyeDist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const forehead = p(10);
  const chin = p(152);

  return {
    eyeL,
    eyeR,
    eyeCenter,
    eyeDist,
    angle,
    forehead,
    chin,
    nose: p(1),
    mouth: mid(p(13), p(14)),
    mouthL: p(61),
    mouthR: p(291),
    cheekL: p(205),
    cheekR: p(425),
    faceH: Math.hypot(forehead.x - chin.x, forehead.y - chin.y),
  };
}

// -----------------------------------------------------
// Smoothing (reduces jitter between frames)
// -----------------------------------------------------

function lerpValue(a, b, t) {
  if (typeof a === "number" && typeof b === "number") {
    return a + (b - a) * t;
  }

  if (a && b && typeof a === "object") {
    const out = {};
    for (const key of Object.keys(b)) {
      out[key] = lerpValue(a[key], b[key], t);
    }
    return out;
  }

  return b;
}

export function smoothFaces(previous, next, t = 0.55) {
  if (previous.length !== next.length) return next;

  return next.map((face, i) => lerpValue(previous[i], face, t));
}
