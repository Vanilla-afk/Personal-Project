import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./PhotoEditor.css";

function PhotoEditor({ image, onBack, onSave }) {
  const [activeFilter, setActiveFilter] =
    useState("original");

  const [activeFrame, setActiveFrame] =
    useState("none");

  const [brightness, setBrightness] =
    useState(100);

  const [contrast, setContrast] =
    useState(100);

  const [saturation, setSaturation] =
    useState(100);

  const [text, setText] =
    useState("");

  const [textColor, setTextColor] =
    useState("#ffffff");

  const [textSize, setTextSize] =
    useState(40);

  const [textX, setTextX] =
    useState(50);

  const [textY, setTextY] =
    useState(85);

  const [stickers, setStickers] =
    useState([]);

  const [dragging, setDragging] =
    useState(null);

  const editorPhotoRef =
    useRef(null);

  const filters = {
    original: "",
    grayscale: "grayscale(100%)",
    sepia: "sepia(80%)",
    vintage:
      "sepia(30%) contrast(110%) saturate(80%)",
    cool:
      "saturate(80%) hue-rotate(15deg)",
  };

  const frames = {
    none: {
      name: "None",
      className: "",
    },

    classic: {
      name: "Classic",
      className: "frame-classic",
    },

    black: {
      name: "Black",
      className: "frame-black",
    },

    polaroid: {
      name: "Polaroid",
      className: "frame-polaroid",
    },

    rounded: {
      name: "Rounded",
      className: "frame-rounded",
    },

    film: {
      name: "Film",
      className: "frame-film",
    },
  };

  const stickerList = [
    "❤️",
    "⭐",
    "✨",
    "🌸",
    "🎀",
    "🦋",
    "☀️",
    "📸",
    "💕",
    "🔥",
    "🌈",
    "😎",
  ];

  const imageStyle = useMemo(() => {
    const filter = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
      filters[activeFilter],
    ]
      .filter(Boolean)
      .join(" ");

    return {
      filter,
    };
  }, [
    brightness,
    contrast,
    saturation,
    activeFilter,
  ]);

  // =========================
  // STICKERS
  // =========================

  function addSticker(sticker) {
    const newSticker = {
      id:
        Date.now() +
        Math.random(),

      emoji: sticker,

      size: 60,

      x: 50,

      y: 50,
    };

    setStickers((current) => [
      ...current,
      newSticker,
    ]);
  }

  function removeSticker(id) {
    setStickers((current) =>
      current.filter(
        (sticker) =>
          sticker.id !== id
      )
    );
  }

  function updateSticker(
    id,
    property,
    value
  ) {
    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === id
          ? {
              ...sticker,
              [property]:
                Number(value),
            }
          : sticker
      )
    );
  }

  // =========================
  // DRAGGING
  // =========================

  function startDrag(
    event,
    type,
    id = null
  ) {
    event.preventDefault();
    event.stopPropagation();

    setDragging({
      type,
      id,
    });

    document.body.style.userSelect =
      "none";
  }

  function stopDrag() {
    setDragging(null);

    document.body.style.userSelect =
      "";
  }

  useEffect(() => {
    if (!dragging) {
      return;
    }

    function handlePointerMove(event) {
      const wrapper =
        editorPhotoRef.current;

      if (!wrapper) {
        return;
      }

      const rect =
        wrapper.getBoundingClientRect();

      let x =
        ((event.clientX -
          rect.left) /
          rect.width) *
        100;

      let y =
        ((event.clientY -
          rect.top) /
          rect.height) *
        100;

      x = Math.max(
        5,
        Math.min(95, x)
      );

      y = Math.max(
        5,
        Math.min(95, y)
      );

      if (
        dragging.type === "text"
      ) {
        setTextX(x);
        setTextY(y);
      }

      if (
        dragging.type ===
        "sticker"
      ) {
        setStickers((current) =>
          current.map(
            (sticker) =>
              sticker.id ===
              dragging.id
                ? {
                    ...sticker,
                    x,
                    y,
                  }
                : sticker
          )
        );
      }
    }

    function handlePointerUp() {
      stopDrag();
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerUp
      );
    };
  }, [dragging]);

  // =========================
  // RESET
  // =========================

  function resetAdjustments() {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setActiveFilter("original");
  }

  function resetText() {
    setText("");
    setTextColor("#ffffff");
    setTextSize(40);
    setTextX(50);
    setTextY(85);
  }

  // =========================
  // SAVE
  // =========================

  function savePhoto() {
    const img =
      new Image();

    img.onload = () => {
      const canvas =
        document.createElement(
          "canvas"
        );

      const context =
        canvas.getContext("2d");

      const frame =
        activeFrame;

      const borderSize =
        frame === "none"
          ? 0
          : frame === "classic"
            ? 50
            : frame === "black"
              ? 35
              : frame === "polaroid"
                ? 60
                : frame === "rounded"
                  ? 25
                  : 45;

      canvas.width =
        img.naturalWidth +
        borderSize * 2;

      canvas.height =
        img.naturalHeight +
        borderSize * 2;

      if (
        frame === "classic" ||
        frame === "polaroid" ||
        frame === "rounded"
      ) {
        context.fillStyle =
          "#ffffff";
      }

      if (
        frame === "black" ||
        frame === "film"
      ) {
        context.fillStyle =
          "#111111";
      }

      if (frame !== "none") {
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      const filter = [
        `brightness(${brightness}%)`,
        `contrast(${contrast}%)`,
        `saturate(${saturation}%)`,
        filters[activeFilter],
      ]
        .filter(Boolean)
        .join(" ");

      context.filter = filter;

      if (
        frame === "rounded"
      ) {
        context.save();

        const radius = 40;

        context.beginPath();

        context.roundRect(
          borderSize,
          borderSize,
          img.naturalWidth,
          img.naturalHeight,
          radius
        );

        context.clip();

        context.drawImage(
          img,
          borderSize,
          borderSize,
          img.naturalWidth,
          img.naturalHeight
        );

        context.restore();
      } else {
        context.drawImage(
          img,
          borderSize,
          borderSize,
          img.naturalWidth,
          img.naturalHeight
        );
      }

      context.filter = "none";

      // FILM FRAME
      if (frame === "film") {
        context.fillStyle =
          "#111111";

        const holeSize = 18;
        const holeGap = 28;

        for (
          let y = 10;
          y <
          canvas.height - 10;
          y += holeGap
        ) {
          context.fillRect(
            8,
            y,
            holeSize,
            holeSize
          );

          context.fillRect(
            canvas.width -
              holeSize -
              8,
            y,
            holeSize,
            holeSize
          );
        }
      }

      // TEXT
      if (
        text.trim() !== ""
      ) {
        context.fillStyle =
          textColor;

        context.font =
          `700 ${textSize}px Arial, sans-serif`;

        context.textAlign =
          "center";

        context.textBaseline =
          "middle";

        const photoX =
          borderSize +
          (img.naturalWidth *
            textX) /
            100;

        const photoY =
          borderSize +
          (img.naturalHeight *
            textY) /
            100;

        context.shadowColor =
          "rgba(0, 0, 0, 0.5)";

        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        context.fillText(
          text,
          photoX,
          photoY
        );

        context.shadowColor =
          "transparent";

        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
      }

      // STICKERS
      stickers.forEach(
        (sticker) => {
          const stickerX =
            borderSize +
            (img.naturalWidth *
              sticker.x) /
              100;

          const stickerY =
            borderSize +
            (img.naturalHeight *
              sticker.y) /
              100;

          context.font =
            `${sticker.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;

          context.textAlign =
            "center";

          context.textBaseline =
            "middle";

          context.fillText(
            sticker.emoji,
            stickerX,
            stickerY
          );
        }
      );

      const editedImage =
        canvas.toDataURL(
          "image/jpeg",
          0.95
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        editedImage;

      link.download =
        `snapstrip-${Date.now()}.jpg`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      onSave(editedImage);
    };

    img.src = image;
  }

  return (
    <div className="editor-page">
      <header className="editor-header">
        <button
          className="editor-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="editor-logo">
          SnapStrip
        </div>

        <button
          className="save-button"
          onClick={savePhoto}
        >
          Save Photo
        </button>
      </header>

      <main className="editor-content">

        {/* PHOTO PREVIEW */}

        <section className="editor-preview">
          <div
            ref={editorPhotoRef}
            className={`editor-photo-wrapper ${frames[activeFrame].className}`}
          >
            <img
              src={image}
              alt="Captured"
              className="editor-photo"
              style={imageStyle}
              draggable="false"
            />

            {/* TEXT */}

            {text.trim() !== "" && (
              <div
                className={`editor-text-preview ${
                  dragging?.type ===
                  "text"
                    ? "dragging"
                    : ""
                }`}
                style={{
                  color: textColor,
                  fontSize: `${textSize}px`,
                  left: `${textX}%`,
                  top: `${textY}%`,
                }}
                onPointerDown={(
                  event
                ) =>
                  startDrag(
                    event,
                    "text"
                  )
                }
              >
                {text}
              </div>
            )}

            {/* STICKERS */}

            {stickers.map(
              (sticker) => (
                <div
                  key={sticker.id}
                  className={`editor-sticker-preview ${
                    dragging?.type ===
                      "sticker" &&
                    dragging?.id ===
                      sticker.id
                      ? "dragging"
                      : ""
                  }`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    fontSize: `${sticker.size}px`,
                  }}
                  onPointerDown={(
                    event
                  ) =>
                    startDrag(
                      event,
                      "sticker",
                      sticker.id
                    )
                  }
                >
                  {sticker.emoji}
                </div>
              )
            )}
          </div>

          <p className="drag-hint">
            Drag text and stickers directly
            on the photo.
          </p>
        </section>

        {/* TOOLS */}

        <section className="editor-tools">

          {/* FILTERS */}

          <div className="tool-section">
            <div className="section-title">
              Filters
            </div>

            <div className="filter-list">
              {Object.keys(
                filters
              ).map((filter) => (
                <button
                  key={filter}
                  className={
                    activeFilter ===
                    filter
                      ? "filter-button active"
                      : "filter-button"
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                >
                  <div className="filter-preview">
                    <img
                      src={image}
                      alt=""
                      style={{
                        filter:
                          filters[
                            filter
                          ],
                      }}
                    />
                  </div>

                  <span>
                    {filter
                      .charAt(0)
                      .toUpperCase() +
                      filter.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* FRAMES */}

          <div className="tool-section">
            <div className="section-title">
              Frames
            </div>

            <div className="frame-list">
              {Object.entries(
                frames
              ).map(
                ([key, frame]) => (
                  <button
                    key={key}
                    className={
                      activeFrame ===
                      key
                        ? "frame-button active"
                        : "frame-button"
                    }
                    onClick={() =>
                      setActiveFrame(
                        key
                      )
                    }
                  >
                    <div
                      className={`frame-preview ${frame.className}`}
                    >
                      <img
                        src={image}
                        alt=""
                      />
                    </div>

                    <span>
                      {frame.name}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* TEXT */}

          <div className="tool-section">
            <div className="section-title">
              Text
            </div>

            <div className="text-editor">
              <input
                type="text"
                className="text-input"
                placeholder="Type something..."
                value={text}
                onChange={(event) =>
                  setText(
                    event.target.value
                  )
                }
                maxLength={50}
              />

              <div className="text-options">
                <label>
                  <span>
                    Color
                  </span>

                  <input
                    type="color"
                    value={
                      textColor
                    }
                    onChange={(
                      event
                    ) =>
                      setTextColor(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Size
                    <strong>
                      {textSize}
                    </strong>
                  </span>

                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={
                      textSize
                    }
                    onChange={(
                      event
                    ) =>
                      setTextSize(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Horizontal
                    <strong>
                      {Math.round(
                        textX
                      )}
                      %
                    </strong>
                  </span>

                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={
                      textX
                    }
                    onChange={(
                      event
                    ) =>
                      setTextX(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Vertical
                    <strong>
                      {Math.round(
                        textY
                      )}
                      %
                    </strong>
                  </span>

                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={
                      textY
                    }
                    onChange={(
                      event
                    ) =>
                      setTextY(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>
              </div>

              <button
                className="reset-button"
                onClick={resetText}
              >
                Remove Text
              </button>
            </div>
          </div>

          {/* STICKERS */}

          <div className="tool-section">
            <div className="section-title">
              Stickers
            </div>

            <div className="sticker-list">
              {stickerList.map(
                (sticker) => (
                  <button
                    key={sticker}
                    className="sticker-button"
                    onClick={() =>
                      addSticker(
                        sticker
                      )
                    }
                  >
                    {sticker}
                  </button>
                )
              )}
            </div>

            {stickers.length >
              0 && (
              <div className="sticker-controls">
                {stickers.map(
                  (
                    sticker,
                    index
                  ) => (
                    <div
                      className="sticker-control"
                      key={
                        sticker.id
                      }
                    >
                      <div className="sticker-control-header">
                        <span>
                          {
                            sticker.emoji
                          }{" "}
                          Sticker{" "}
                          {index +
                            1}
                        </span>

                        <button
                          onClick={() =>
                            removeSticker(
                              sticker.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>

                      <label>
                        <span>
                          Size
                          <strong>
                            {
                              sticker.size
                            }
                          </strong>
                        </span>

                        <input
                          type="range"
                          min="25"
                          max="150"
                          value={
                            sticker.size
                          }
                          onChange={(
                            event
                          ) =>
                            updateSticker(
                              sticker.id,
                              "size",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Horizontal
                          <strong>
                            {Math.round(
                              sticker.x
                            )}
                            %
                          </strong>
                        </span>

                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={
                            sticker.x
                          }
                          onChange={(
                            event
                          ) =>
                            updateSticker(
                              sticker.id,
                              "x",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Vertical
                          <strong>
                            {Math.round(
                              sticker.y
                            )}
                            %
                          </strong>
                        </span>

                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={
                            sticker.y
                          }
                          onChange={(
                            event
                          ) =>
                            updateSticker(
                              sticker.id,
                              "y",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </label>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ADJUSTMENTS */}

          <div className="tool-section">
            <div className="section-title">
              Adjustments
            </div>

            <div className="adjustments">
              <label>
                <span>
                  Brightness
                  <strong>
                    {brightness}
                  </strong>
                </span>

                <input
                  type="range"
                  min="50"
                  max="150"
                  value={
                    brightness
                  }
                  onChange={(
                    event
                  ) =>
                    setBrightness(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Contrast
                  <strong>
                    {contrast}
                  </strong>
                </span>

                <input
                  type="range"
                  min="50"
                  max="150"
                  value={
                    contrast
                  }
                  onChange={(
                    event
                  ) =>
                    setContrast(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Saturation
                  <strong>
                    {saturation}
                  </strong>
                </span>

                <input
                  type="range"
                  min="0"
                  max="200"
                  value={
                    saturation
                  }
                  onChange={(
                    event
                  ) =>
                    setSaturation(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                />
              </label>
            </div>

            <button
              className="reset-button"
              onClick={
                resetAdjustments
              }
            >
              Reset
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}

export default PhotoEditor;