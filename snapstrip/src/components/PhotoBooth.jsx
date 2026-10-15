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
import { createGif } from "../utils/gifExport";
import "./PhotoBooth.css";

function PhotoBooth({ onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const finishTimerRef = useRef(null);
  const photosRef = useRef([]);
  const stickerCanvasRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState("original");
  const [activeSticker, setActiveSticker] = useState("none");
  const [flash, setFlash] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const [template, setTemplate] = useState("classic");
  const [background, setBackground] = useState("#ffffff");
  const [headerText, setHeaderText] = useState("SNAPSTRIP");
  const [footerText, setFooterText] = useState(
    "A memory worth keeping."
  );

  const { facesRef, status, faceFound, retry } = useFaceStickers({
    videoRef,
    canvasRef: stickerCanvasRef,
    stickerId: activeSticker,
    enabled: isReady && !cameraError && !isFinished,
  });

  // GIF export
  const [gifSpeed, setGifSpeed] = useState(700);
  const [gifBoomerang, setGifBoomerang] = useState(false);
  const [gifProgress, setGifProgress] = useState(null); // null = idle
  const [gifResult, setGifResult] = useState(null); // { url, size }

  const totalPhotos = 4;

  const templates = {
    classic: {
      name: "Classic",
      description: "Clean and simple",
    },
    minimal: {
      name: "Minimal",
      description: "Photo-focused",
    },
    polaroid: {
      name: "Polaroid",
      description: "Thick photo borders",
    },
    film: {
      name: "Film",
      description: "Retro film style",
    },
  };

  useEffect(() => {
  startCamera();

  return () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    clearTimeout(flashTimerRef.current);
    clearTimeout(finishTimerRef.current);

    stopCamera();
  };
}, []);

  // Re-attach the stream whenever the <video> element is (re)mounted,
  // e.g. after "Take Another Strip".
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isReady, isFinished]);

  async function startCamera() {
    try {
      setCameraError("");
      setIsReady(false);

      const stream =
        await navigator.mediaDevices.getUserMedia({
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

      setCameraError(
        "We couldn't access your camera. Please allow camera permission and try again."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    setIsReady(false);
  }

  function takePhoto() {
    if (!isReady || countdown !== null || flash) {
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
        capturePhoto();
      }
    }, 1000);
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0) return;

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

    setFlash(true);

    flashTimerRef.current = setTimeout(
      () => setFlash(false),
      450
    );

    const updatedPhotos = [...photosRef.current, image];

    photosRef.current = updatedPhotos;
    setPhotos(updatedPhotos);

    if (updatedPhotos.length === totalPhotos) {
      finishTimerRef.current = setTimeout(() => {
        stopCamera();
        setIsFinished(true);
      }, 800);
    }
  }

  function resetBooth() {
    stopCamera();

    photosRef.current = [];
    setPhotos([]);
    setIsFinished(false);
    setCountdown(null);

    startCamera();
  }

  function loadImages() {
    return Promise.all(
      photos.map(
        (photo) =>
          new Promise((resolve) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.src = photo;
          })
      )
    );
  }

  function drawCoverImage(
    context,
    image,
    x,
    y,
    width,
    height
  ) {
    const imageRatio =
      image.naturalWidth / image.naturalHeight;

    const boxRatio = width / height;

    let sourceWidth =
      image.naturalWidth;

    let sourceHeight =
      image.naturalHeight;

    let sourceX = 0;
    let sourceY = 0;

    if (imageRatio > boxRatio) {
      sourceWidth =
        image.naturalHeight * boxRatio;

      sourceX =
        (image.naturalWidth -
          sourceWidth) /
        2;
    } else {
      sourceHeight =
        image.naturalWidth / boxRatio;

      sourceY =
        (image.naturalHeight -
          sourceHeight) /
        2;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height
    );
  }

  async function makeGif() {
    if (photos.length !== totalPhotos || gifProgress !== null) {
      return;
    }

    setGifProgress(0);

    try {
      const blob = await createGif(photos, {
        delay: gifSpeed,
        boomerang: gifBoomerang,
        background: template === "film" ? "#111111" : background,
        footerText: footerText.trim(),
        dark: template === "film" || background === "#111111",
        onProgress: setGifProgress,
      });

      closeGif();

      setGifResult({
        url: URL.createObjectURL(blob),
        size: blob.size,
      });
    } catch (error) {
      console.error("GIF export failed:", error);
      alert("Sorry, the GIF could not be created.");
    } finally {
      setGifProgress(null);
    }
  }

  function closeGif() {
    setGifResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function downloadGif() {
    if (!gifResult) return;

    const link = document.createElement("a");

    link.href = gifResult.url;
    link.download = `snapstrip-${Date.now()}.gif`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadStrip() {
    if (photos.length !== totalPhotos) {
      return;
    }

    const images = await loadImages();

    createStrip(images);
  }

  function createStrip(images) {
    const photoWidth = 800;
    const photoHeight = 600;

    let padding = 35;
    let gap = 25;
    let headerHeight = 90;
    let footerHeight = 100;

    if (template === "minimal") {
      padding = 20;
      gap = 12;
      headerHeight = 45;
      footerHeight = 60;
    }

    if (template === "polaroid") {
      padding = 45;
      gap = 35;
      headerHeight = 110;
      footerHeight = 120;
    }

    if (template === "film") {
      padding = 50;
      gap = 30;
      headerHeight = 100;
      footerHeight = 100;
    }

    const canvasWidth =
      photoWidth + padding * 2;

    const canvasHeight =
      headerHeight +
      footerHeight +
      padding * 2 +
      photoHeight * totalPhotos +
      gap * (totalPhotos - 1);

    const canvas =
      document.createElement("canvas");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const context =
      canvas.getContext("2d");

    context.fillStyle = background;

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (template === "film") {
      context.fillStyle = "#111111";

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }

    if (headerText.trim() !== "") {
      context.fillStyle =
        template === "film"
          ? "#ffffff"
          : "#111111";

      context.font =
        template === "minimal"
          ? "700 28px Arial, sans-serif"
          : "700 38px Arial, sans-serif";

      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(
        headerText,
        canvas.width / 2,
        headerHeight / 2
      );
    }

    images.forEach((image, index) => {
      const x = padding;

      const y =
        headerHeight +
        padding +
        index *
          (photoHeight + gap);

      if (template === "film") {
        context.fillStyle = "#ffffff";

        context.fillRect(
          x - 12,
          y - 12,
          photoWidth + 24,
          photoHeight + 24
        );
      }

      if (template === "polaroid") {
        context.fillStyle = "#ffffff";

        context.fillRect(
          x - 20,
          y - 20,
          photoWidth + 40,
          photoHeight + 40
        );
      }

      drawCoverImage(
        context,
        image,
        x,
        y,
        photoWidth,
        photoHeight
      );
    });

    if (template === "film") {
      context.fillStyle = "#ffffff";

      const holeWidth = 28;
      const holeHeight = 18;
      const holeGap = 30;

      for (
        let y = 15;
        y < canvas.height - 15;
        y += holeGap
      ) {
        context.fillRect(
          10,
          y,
          holeWidth,
          holeHeight
        );

        context.fillRect(
          canvas.width -
            holeWidth -
            10,
          y,
          holeWidth,
          holeHeight
        );
      }
    }

    if (footerText.trim() !== "") {
      context.fillStyle =
        template === "film"
          ? "#ffffff"
          : "#555555";

      context.font =
        template === "minimal"
          ? "500 20px Arial, sans-serif"
          : "500 24px Arial, sans-serif";

      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(
        footerText,
        canvas.width / 2,
        canvas.height -
          footerHeight / 2
      );
    }

    const strip =
      canvas.toDataURL(
        "image/jpeg",
        0.95
      );

    const link =
      document.createElement("a");

    link.href = strip;

    link.download =
      `snapstrip-${template}-${Date.now()}.jpg`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }

  if (cameraError) {
    return (
      <div className="booth-page">
        <header className="booth-header">
          <button
            className="booth-back"
            onClick={onClose}
          >
            ← Back
          </button>

          <div className="booth-logo">
            SnapStrip
          </div>
        </header>

        <main className="booth-content">
          <div className="booth-error">
            <div className="booth-error-icon">
              📷
            </div>

            <h2>Camera unavailable</h2>

            <p>{cameraError}</p>

            <button
              className="booth-action-button"
              onClick={startCamera}
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="booth-page">
        <header className="booth-header">
          <button
            className="booth-back"
            onClick={onClose}
          >
            ← Back
          </button>

          <div className="booth-logo">
            SnapStrip
          </div>
        </header>

        <main className="booth-finished">
          <div className="finished-title">
            <p>YOUR PHOTO STRIP</p>

            <h1>
              Customize your memory.
            </h1>
          </div>

          <div className="customization-layout">

            <div className="strip-preview-area">
              <div
                className={`strip-preview ${template}`}
                style={{
                  backgroundColor:
                    template === "film"
                      ? "#111"
                      : background,
                }}
              >
                <div className="strip-header">
                  {headerText ||
                    "SNAPSTRIP"}
                </div>

                {photos.map(
                  (photo, index) => (
                    <div
                      className="strip-photo"
                      key={index}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${
                          index + 1
                        }`}
                      />
                    </div>
                  )
                )}

                <div className="strip-footer">
                  {footerText ||
                    "A memory worth keeping."}
                </div>
              </div>
            </div>

            <div className="customization-panel">

              <div className="customization-section">
                <div className="customization-title">
                  Template
                </div>

                <div className="template-list">
                  {Object.entries(
                    templates
                  ).map(
                    ([
                      key,
                      templateInfo,
                    ]) => (
                      <button
                        key={key}
                        className={
                          template === key
                            ? "template-button active"
                            : "template-button"
                        }
                        onClick={() =>
                          setTemplate(key)
                        }
                      >
                        <div className="template-mini-preview">
                          <div
                            className={`mini-strip ${key}`}
                          >
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>

                        <strong>
                          {
                            templateInfo.name
                          }
                        </strong>

                        <small>
                          {
                            templateInfo.description
                          }
                        </small>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="customization-section">
                <div className="customization-title">
                  Background
                </div>

                <div className="background-options">
                  {[
                    "#ffffff",
                    "#f5f5f5",
                    "#f7e9e9",
                    "#e9f2f7",
                    "#eee9f7",
                    "#e9f7ed",
                    "#111111",
                  ].map(
                    (color) => (
                      <button
                        key={color}
                        className={
                          background === color
                            ? "color-button active"
                            : "color-button"
                        }
                        style={{
                          backgroundColor:
                            color,
                        }}
                        onClick={() =>
                          setBackground(
                            color
                          )
                        }
                        aria-label={`Background ${color}`}
                      />
                    )
                  )}
                </div>

                {template ===
                  "film" && (
                  <p className="customization-note">
                    Film template uses a
                    black background.
                  </p>
                )}
              </div>

              <div className="customization-section">
                <div className="customization-title">
                  Header
                </div>

                <input
                  className="customization-input"
                  type="text"
                  value={headerText}
                  onChange={(event) =>
                    setHeaderText(
                      event.target.value
                    )
                  }
                  maxLength={25}
                  placeholder="SNAPSTRIP"
                />
              </div>

              <div className="customization-section">
                <div className="customization-title">
                  Footer
                </div>

                <input
                  className="customization-input"
                  type="text"
                  value={footerText}
                  onChange={(event) =>
                    setFooterText(
                      event.target.value
                    )
                  }
                  maxLength={40}
                  placeholder="A memory worth keeping."
                />
              </div>

              <div className="customization-section">
                <div className="customization-title">
                  Animated GIF
                </div>

                <div className="gif-options">
                  {[
                    ["Fast", 400],
                    ["Normal", 700],
                    ["Slow", 1100],
                  ].map(([label, ms]) => (
                    <button
                      key={label}
                      className={
                        gifSpeed === ms
                          ? "gif-chip active"
                          : "gif-chip"
                      }
                      onClick={() => setGifSpeed(ms)}
                    >
                      {label}
                    </button>
                  ))}

                  <button
                    className={
                      gifBoomerang
                        ? "gif-chip active"
                        : "gif-chip"
                    }
                    onClick={() =>
                      setGifBoomerang((v) => !v)
                    }
                    aria-pressed={gifBoomerang}
                  >
                    🔁 Boomerang
                  </button>
                </div>

                <button
                  className="booth-gif-button"
                  onClick={makeGif}
                  disabled={gifProgress !== null}
                >
                  {gifProgress !== null
                    ? `Creating GIF… ${Math.round(
                        gifProgress * 100
                      )}%`
                    : "🎞️ Create GIF"}
                </button>

                {gifProgress !== null && (
                  <div className="gif-progress">
                    <div
                      style={{
                        width: `${gifProgress * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="customization-actions">
                <button
                  className="booth-action-button"
                  onClick={downloadStrip}
                >
                  Download Strip
                </button>

                <button
                  className="booth-secondary-button"
                  onClick={resetBooth}
                >
                  Take Another Strip
                </button>
              </div>

            </div>
          </div>
        </main>

        {gifResult && (
          <div className="gif-overlay" onClick={closeGif}>
            <div
              className="gif-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="gif-close"
                onClick={closeGif}
                aria-label="Close"
              >
                ×
              </button>

              <p className="gif-eyebrow">YOUR GIF</p>

              <img
                src={gifResult.url}
                alt="Animated photo strip"
              />

              <p className="gif-size">
                {(gifResult.size / 1024 / 1024).toFixed(2)} MB
              </p>

              <div className="gif-actions">
                <button
                  className="booth-action-button"
                  onClick={downloadGif}
                >
                  Download GIF
                </button>

                <button
                  className="booth-secondary-button"
                  onClick={closeGif}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentPhoto =
    photos.length + 1;

  return (
    <div className="booth-page">
      <header className="booth-header">
        <button
          className="booth-back"
          onClick={onClose}
        >
          ← Back
        </button>

        <div className="booth-logo">
          SnapStrip
        </div>

        <div className="booth-counter">
          {currentPhoto} / {totalPhotos}
        </div>
      </header>

      <main className="booth-content">
        <div className="booth-title">
          <p>4-PHOTO BOOTH</p>

          <h1>
            Photo {currentPhoto} of{" "}
            {totalPhotos}
          </h1>
        </div>

        <div
          className={`booth-camera ${flash ? "is-flashing" : ""}`}
        >
          {!isReady && (
            <div className="booth-loading">
              <span className="booth-spinner" />
              <p>Starting camera…</p>
            </div>
          )}

          <video
            ref={videoRef}
            className="booth-video"
            style={{ filter: filterToCss(getFilter(activeFilter)) }}
            autoPlay
            playsInline
            muted
          />

          {getFilter(activeFilter).tint && (
            <div
              className="booth-fx"
              style={{
                background: getFilter(activeFilter).tint,
              }}
            />
          )}

          {getFilter(activeFilter).vignette && (
            <div
              className="booth-fx"
              style={{
                background: vignetteCss(
                  getFilter(activeFilter).vignette
                ),
              }}
            />
          )}

          <canvas
            ref={stickerCanvasRef}
            className="booth-stickers"
          />

          <div className="booth-overlay">
            <div className="booth-frame">
              <i /><i /><i /><i />
            </div>
          </div>

          {countdown !== null && (
            <div className="booth-countdown" key={countdown}>
              <span>{countdown}</span>
            </div>
          )}

          {flash && <div className="booth-flash" />}
        </div>

        <EffectsBar
          filter={activeFilter}
          onFilterChange={setActiveFilter}
          sticker={activeSticker}
          onStickerChange={setActiveSticker}
          disabled={countdown !== null || flash}
          trackingStatus={status}
          faceFound={faceFound}
          onRetry={retry}
        />

        <div className="booth-progress">
          {Array.from(
            { length: totalPhotos },
            (_, index) => (
              <div
                key={index}
                className={
                  index < photos.length
                    ? "progress-dot completed"
                    : index === photos.length
                      ? "progress-dot current"
                      : "progress-dot"
                }
              />
            )
          )}
        </div>

        {photos.length > 0 && (
          <div className="booth-thumbs">
            {photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Shot ${index + 1}`}
                style={{ "--i": index }}
              />
            ))}
          </div>
        )}

        <p className="booth-tip">
          Get ready! Your photo will be
          taken automatically after the
          countdown.
        </p>

        <button
          className={`booth-capture-button ${
            countdown !== null ? "counting" : ""
          }`}
          onClick={takePhoto}
          aria-label="Take photo"
          disabled={
            !isReady ||
            countdown !== null ||
            flash
          }
        >
          <span></span>
        </button>
      </main>
    </div>
  );
}

export default PhotoBooth;