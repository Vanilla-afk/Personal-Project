import { useRef, useState } from "react";
import "./App.css";

import Camera from "./components/Camera";
import PhotoEditor from "./components/PhotoEditor";
import PhotoBooth from "./components/PhotoBooth";
import Gallery from "./components/Gallery";

import { savePhoto } from "./utils/photoStorage";

function App() {
  const [showCamera, setShowCamera] =
    useState(false);

  const [showEditor, setShowEditor] =
    useState(false);

  const [showBooth, setShowBooth] =
    useState(false);

  const [showGallery, setShowGallery] =
    useState(false);

  const [showModeSelector, setShowModeSelector] =
    useState(false);

  const [capturedPhoto, setCapturedPhoto] =
    useState(null);

  const fileInputRef = useRef(null);

  // =========================
  // SINGLE PHOTO
  // =========================

  function handleCapture(image) {
    setCapturedPhoto(image);
    setShowCamera(false);
    setShowEditor(true);
  }

  function handleRetake() {
    setCapturedPhoto(null);
    setShowEditor(false);
    setShowCamera(true);
  }

  // =========================
  // SAVE SINGLE PHOTO
  // =========================

  async function handleSavePhoto(image) {
    try {
      await savePhoto({
        image: image,
        type: "photo",
      });

      console.log(
        "Photo saved to My Photos."
      );
    } catch (error) {
      console.error(
        "Failed to save photo:",
        error
      );

      alert(
        "The photo could not be saved to My Photos."
      );
    }
  }

  // =========================
  // SAVE PHOTO STRIP
  // =========================

  async function handleSaveStrip(image) {
    try {
      await savePhoto({
        image: image,
        type: "strip",
      });

      console.log(
        "Photo strip saved to My Photos."
      );
    } catch (error) {
      console.error(
        "Failed to save photo strip:",
        error
      );

      alert(
        "The photo strip could not be saved to My Photos."
      );
    }
  }

  // =========================
  // UPLOAD PHOTO
  // =========================

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setCapturedPhoto(reader.result);
      setShowEditor(true);
    };

    reader.onerror = () => {
      alert(
        "Something went wrong while reading the image."
      );
    };

    reader.readAsDataURL(file);

    // Allows selecting the same file again later
    event.target.value = "";
  }

  // =========================
  // MY PHOTOS
  // =========================

  if (showGallery) {
    return (
      <Gallery
        onClose={() =>
          setShowGallery(false)
        }
      />
    );
  }

  // =========================
  // PHOTO EDITOR
  // =========================

  if (showEditor && capturedPhoto) {
    return (
      <PhotoEditor
        image={capturedPhoto}
        onBack={() => {
          setShowEditor(false);
          setCapturedPhoto(null);
        }}
        onSave={async (editedImage) => {
          await handleSavePhoto(
            editedImage
          );

          setShowEditor(false);
          setCapturedPhoto(null);
        }}
      />
    );
  }

  // =========================
  // SINGLE CAMERA
  // =========================

  if (showCamera) {
    return (
      <Camera
        onClose={() =>
          setShowCamera(false)
        }
        onCapture={handleCapture}
      />
    );
  }

  // =========================
  // PHOTO BOOTH
  // =========================

  if (showBooth) {
    return (
      <PhotoBooth
        onClose={() =>
          setShowBooth(false)
        }
        onSave={handleSaveStrip}
      />
    );
  }

  // =========================
  // HOME
  // =========================

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          SnapStrip
        </div>

        <nav>
          <button
            className="nav-button"
            onClick={() =>
              setShowGallery(true)
            }
          >
            My Photos
          </button>
        </nav>
      </header>

      <main className="hero">
        <section className="hero-content">
          <p className="eyebrow">
            YOUR PERSONAL PHOTOBOOTH
          </p>

          <h1>
            Capture the moment.
            <br />
            Make it yours.
          </h1>

          <p className="description">
            Take photos, customize them,
            and create your own photobooth
            memories right in your browser.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-button"
              onClick={() =>
                setShowModeSelector(true)
              }
            >
              Take a Photo
            </button>

            <button
              className="secondary-button"
              onClick={handleUploadClick}
            >
              Upload a Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        </section>

        <section className="preview">
          <div className="photo-card">
            <div className="photo-placeholder">
              <span>📸</span>

              <p>
                Your memories start here.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* MODE SELECTOR */}

      {showModeSelector && (
        <div
          className="mode-overlay"
          onClick={() =>
            setShowModeSelector(false)
          }
        >
          <div
            className="mode-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="mode-close"
              onClick={() =>
                setShowModeSelector(false)
              }
            >
              ×
            </button>

            <p className="mode-eyebrow">
              CHOOSE YOUR MODE
            </p>

            <h2>
              What do you want to create?
            </h2>

            <div className="mode-options">

              {/* SINGLE PHOTO */}

              <button
                className="mode-card"
                onClick={() => {
                  setShowModeSelector(false);
                  setShowCamera(true);
                }}
              >
                <div className="mode-icon">
                  📷
                </div>

                <div>
                  <h3>
                    Single Photo
                  </h3>

                  <p>
                    Take one photo and
                    customize it.
                  </p>
                </div>
              </button>

              {/* PHOTO STRIP */}

              <button
                className="mode-card"
                onClick={() => {
                  setShowModeSelector(false);
                  setShowBooth(true);
                }}
              >
                <div className="mode-icon">
                  🎞️
                </div>

                <div>
                  <h3>
                    4-Photo Strip
                  </h3>

                  <p>
                    Take four photos and
                    create a photobooth
                    strip.
                  </p>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

      <footer>
        <p>
          SnapStrip • A personal photobooth
          project
        </p>
      </footer>
    </div>
  );
}

export default App;