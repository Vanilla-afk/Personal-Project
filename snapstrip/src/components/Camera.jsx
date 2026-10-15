import { useEffect, useRef, useState } from "react";
import EffectsBar from "./EffectsBar";
import { useFaceStickers } from "../hooks/useFaceStickers";
import { drawStickers } from "../utils/stickers";
import {
  drawFilteredFrame,
  filterToCss,
  getFilter,
  vignetteCss,
} from "../utils/cameraFilters";
import "./Camera.css";

function Camera({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const stickerCanvasRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState("original");
  const [activeSticker, setActiveSticker] = useState("none");
  const [flash, setFlash] = useState(false);

  const filter = getFilter(activeFilter);

  const { facesRef, status, faceFound, retry } = useFaceStickers({
    videoRef,
    canvasRef: stickerCanvasRef,
    stickerId: activeSticker,
    enabled: isReady && !cameraError,
  });

  useEffect(() => {
    startCamera();

    return () => {
      clearInterval(countdownTimerRef.current);
      clearTimeout(flashTimerRef.current);
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setCameraError("");
      setIsReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Your browser does not support camera access.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsReady(true);
    } catch (error) {
      console.error(error);
      setIsReady(false);
      setCameraError(
        "We couldn't access your camera. Please allow camera permission and try again."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsReady(false);
  }

  function takePhoto() {
    if (!videoRef.current || !isReady || countdown !== null || flash) {
      return;
    }

    let number = 3;
    setCountdown(number);

    countdownTimerRef.current = setInterval(() => {
      number -= 1;

      if (number > 0) {
        setCountdown(number);
      } else {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdown(null);
        captureImage();
      }
    }, 1000);
  }

  function captureImage() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Draw the frame with the selected filter baked in
    const canvas = drawFilteredFrame(
      document.createElement("canvas"),
      video,
      video.videoWidth,
      video.videoHeight,
      activeFilter,
      { mirror: true }
    );

    // Bake the face sticker on top of the filtered photo
    if (activeSticker !== "none") {
      drawStickers(
        canvas.getContext("2d"),
        facesRef.current,
        activeSticker,
        { mirror: true }
      );
    }

    const image = canvas.toDataURL("image/jpeg", 0.95);

    // Let the flash animation play before moving on
    setFlash(true);

    flashTimerRef.current = setTimeout(() => {
      stopCamera();
      onCapture(image);
    }, 380);
  }

  function handleClose() {
    clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = null;
    clearTimeout(flashTimerRef.current);

    setCountdown(null);
    stopCamera();
    onClose();
  }

  const busy = countdown !== null || flash;

  return (
    <div className="camera-page">
      <header className="camera-header">
        <button className="camera-back" onClick={handleClose}>
          ← Back
        </button>

        <div className="camera-logo">SnapStrip</div>

        <div className="camera-header-spacer" />
      </header>

      <main className="camera-content">
        <div className={`camera-container ${flash ? "is-flashing" : ""}`}>
          {cameraError ? (
            <div className="camera-error">
              <div className="error-icon">📷</div>
              <h2>Camera unavailable</h2>
              <p>{cameraError}</p>
              <button className="retry-button" onClick={startCamera}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {!isReady && (
                <div className="camera-loading">
                  <span className="camera-spinner" />
                  <p>Starting camera…</p>
                </div>
              )}

              <video
                ref={videoRef}
                className="camera-video"
                style={{ filter: filterToCss(filter) }}
                autoPlay
                playsInline
                muted
              />

              {/* Filter overlays (match what is drawn on capture) */}
              {filter.tint && (
                <div
                  className="camera-fx"
                  style={{ background: filter.tint }}
                />
              )}

              {filter.vignette && (
                <div
                  className="camera-fx"
                  style={{ background: vignetteCss(filter.vignette) }}
                />
              )}

              <canvas
                ref={stickerCanvasRef}
                className="camera-stickers"
              />

              <div className="camera-overlay">
                <div className="camera-frame">
                  <i /><i /><i /><i />
                </div>
              </div>

              {countdown !== null && (
                <div className="countdown" key={countdown}>
                  <span>{countdown}</span>
                </div>
              )}

              {flash && <div className="shutter-flash" />}
            </>
          )}
        </div>

        {!cameraError && (
          <>
            <EffectsBar
              filter={activeFilter}
              onFilterChange={setActiveFilter}
              sticker={activeSticker}
              onStickerChange={setActiveSticker}
              disabled={flash}
              trackingStatus={status}
              faceFound={faceFound}
              onRetry={retry}
            />

            <div className="camera-controls">
              <p className="camera-tip">
                {countdown !== null
                  ? "Hold still…"
                  : `${filter.name} filter${
                      activeSticker !== "none" ? " + sticker" : ""
                    } · position yourself inside the frame`}
              </p>

              <button
                className={`capture-button ${
                  countdown !== null ? "counting" : ""
                }`}
                onClick={takePhoto}
                disabled={!isReady || busy}
                aria-label="Take photo"
              >
                <span></span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Camera;
