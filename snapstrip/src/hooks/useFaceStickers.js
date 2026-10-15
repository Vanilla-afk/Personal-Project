import { useEffect, useRef, useState } from "react";
import {
  faceFromLandmarks,
  getFaceLandmarker,
  isFaceModelLoaded,
  smoothFaces,
} from "../utils/faceTracking";
import { drawStickers } from "../utils/stickers";

/**
 * Tracks faces in a <video> and draws the chosen sticker onto an
 * overlay <canvas> (same size as the video frame).
 *
 * Returns:
 *  - facesRef: latest smoothed faces (used to bake stickers into photos)
 *  - status:   "idle" | "loading" | "ready" | "error"
 *  - faceFound: whether at least one face is currently detected
 */
export function useFaceStickers({ videoRef, canvasRef, stickerId, enabled }) {
  const facesRef = useRef([]);

  const [status, setStatus] = useState("idle");
  const [faceFound, setFaceFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const active = enabled && stickerId !== "none";

  useEffect(() => {
    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (!active) {
      facesRef.current = [];
      clearCanvas();
      return;
    }

    let cancelled = false;
    let frameId = 0;
    let lastVideoTime = -1;
    let found = false;

    (async () => {
      let landmarker;

      try {
        if (!isFaceModelLoaded()) setStatus("loading");
        landmarker = await getFaceLandmarker();
      } catch (error) {
        console.error("Face tracking failed to load:", error);
        if (!cancelled) setStatus("error");
        return;
      }

      if (cancelled) return;

      setStatus("ready");

      const loop = () => {
        frameId = requestAnimationFrame(loop);

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2 || !video.videoWidth) {
          return;
        }

        // Only run when there is a new video frame
        if (video.currentTime === lastVideoTime) return;
        lastVideoTime = video.currentTime;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        let result;

        try {
          result = landmarker.detectForVideo(video, performance.now());
        } catch {
          return;
        }

        const faces = (result.faceLandmarks || []).map((lm) =>
          faceFromLandmarks(lm, width, height)
        );

        facesRef.current = smoothFaces(facesRef.current, faces);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        // The overlay canvas is mirrored with CSS (like the video),
        // so we draw in plain video coordinates here.
        drawStickers(ctx, facesRef.current, stickerId, { mirror: false, width });

        const hasFace = faces.length > 0;

        if (hasFace !== found) {
          found = hasFace;
          setFaceFound(hasFace);
        }
      };

      loop();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [active, stickerId, videoRef, canvasRef, retryKey]);

  return {
    facesRef,
    status: active ? status : "idle",
    faceFound: active ? faceFound : false,
    retry: () => setRetryKey((k) => k + 1),
  };
}
