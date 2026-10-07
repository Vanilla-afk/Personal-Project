import { useEffect, useState } from "react";
import "./Gallery.css";

import {
  getPhotos,
  deletePhoto,
} from "../utils/photoStorage";

function Gallery({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedPhoto, setSelectedPhoto] =
    useState(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const savedPhotos = await getPhotos();
      setPhotos(savedPhotos);
    } catch (error) {
      console.error(
        "Failed to load photos:",
        error
      );
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this photo?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePhoto(id);

      setPhotos((currentPhotos) =>
        currentPhotos.filter(
          (photo) => photo.id !== id
        )
      );

      if (
        selectedPhoto &&
        selectedPhoto.id === id
      ) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error(
        "Failed to delete photo:",
        error
      );
    }
  }

  function downloadPhoto(photo) {
    const link =
      document.createElement("a");

    link.href = photo.image;

    link.download =
      photo.type === "strip"
        ? `snapstrip-${photo.id}.jpg`
        : `snapphoto-${photo.id}.jpg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredPhotos = photos.filter(
    (photo) => {
      if (filter === "all") {
        return true;
      }

      return photo.type === filter;
    }
  );

  function formatDate(date) {
    return new Date(
      date
    ).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <button
          className="gallery-back"
          onClick={onClose}
        >
          ← Back
        </button>

        <div className="gallery-logo">
          SnapStrip
        </div>

        <div className="gallery-count">
          {photos.length}{" "}
          {photos.length === 1
            ? "memory"
            : "memories"}
        </div>
      </header>

      <main className="gallery-content">
        <section className="gallery-title">
          <p>YOUR MEMORIES</p>

          <h1>My Photos</h1>

          <p className="gallery-description">
            Your SnapStrip memories are stored
            locally in this browser.
          </p>
        </section>

        <div className="gallery-filters">
          <button
            className={
              filter === "all"
                ? "gallery-filter active"
                : "gallery-filter"
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </button>

          <button
            className={
              filter === "photo"
                ? "gallery-filter active"
                : "gallery-filter"
            }
            onClick={() =>
              setFilter("photo")
            }
          >
            Photos
          </button>

          <button
            className={
              filter === "strip"
                ? "gallery-filter active"
                : "gallery-filter"
            }
            onClick={() =>
              setFilter("strip")
            }
          >
            Strips
          </button>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="gallery-empty">
            <div className="empty-icon">
              📸
            </div>

            <h2>
              No memories yet
            </h2>

            <p>
              Take a photo or create a
              photobooth strip and it will
              appear here.
            </p>

            <button
              className="empty-button"
              onClick={onClose}
            >
              Create a Memory
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {filteredPhotos.map(
              (photo) => (
                <article
                  className="gallery-card"
                  key={photo.id}
                >
                  <button
                    className="gallery-image-button"
                    onClick={() =>
                      setSelectedPhoto(
                        photo
                      )
                    }
                  >
                    <img
                      src={photo.image}
                      alt="SnapStrip memory"
                    />

                    <div className="gallery-image-overlay">
                      View
                    </div>
                  </button>

                  <div className="gallery-card-info">
                    <div>
                      <span className="gallery-type">
                        {photo.type ===
                        "strip"
                          ? "4-PHOTO STRIP"
                          : "PHOTO"}
                      </span>

                      <p>
                        {formatDate(
                          photo.createdAt
                        )}
                      </p>
                    </div>

                    <div className="gallery-card-actions">
                      <button
                        onClick={() =>
                          downloadPhoto(
                            photo
                          )
                        }
                      >
                        Download
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDelete(
                            photo.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </main>

      {selectedPhoto && (
        <div
          className="photo-viewer-overlay"
          onClick={() =>
            setSelectedPhoto(null)
          }
        >
          <div
            className="photo-viewer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="viewer-close"
              onClick={() =>
                setSelectedPhoto(null)
              }
            >
              ×
            </button>

            <img
              src={selectedPhoto.image}
              alt="Selected SnapStrip memory"
            />

            <div className="viewer-actions">
              <button
                onClick={() =>
                  downloadPhoto(
                    selectedPhoto
                  )
                }
              >
                Download
              </button>

              <button
                className="delete-button"
                onClick={() =>
                  handleDelete(
                    selectedPhoto.id
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;