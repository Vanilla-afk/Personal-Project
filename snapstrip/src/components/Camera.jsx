import { useEffect, useRef, useState } from "react";
import "./Camera.css";

function Camera({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setCameraError("");
      setIsReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Your browser does not support camera access."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
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
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsReady(false);
  }

  function takePhoto() {
    if (!videoRef.current || !isReady || countdown !== null) {
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

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    // Keep the captured photo mirrored
    // so it matches the camera preview.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image = canvas.toDataURL("image/jpeg", 0.95);

    stopCamera();

    onCapture(image);
  }

  function handleClose() {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setCountdown(null);
    stopCamera();
    onClose();
  }

  return (
    <div className="camera-page">
      <header className="camera-header">
        <button
          className="camera-back"
          onClick={handleClose}
        >
          ← Back
        </button>

        <div className="camera-logo">
          SnapStrip
        </div>
      </header>

      <main className="camera-content">
        <div className="camera-container">
          {cameraError ? (
            <div className="camera-error">
              <div className="error-icon">📷</div>

              <h2>Camera unavailable</h2>

              <p>{cameraError}</p>

              <button
                className="retry-button"
                onClick={startCamera}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="camera-video"
                autoPlay
                playsInline
                muted
              />

              <div className="camera-overlay">
                <div className="camera-frame"></div>
              </div>

              {countdown !== null && (
                <div className="countdown">
                  {countdown}
                </div>
              )}
            </>
          )}
        </div>

        {!cameraError && (
          <div className="camera-controls">
            <p className="camera-tip">
              Position yourself inside the frame
            </p>

            <button
              className="capture-button"
              onClick={takePhoto}
              disabled={!isReady || countdown !== null}
              aria-label="Take photo"
            >
              <span></span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Camera;