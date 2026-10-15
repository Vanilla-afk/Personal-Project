import { useState } from "react";
import FilterBar from "./FilterBar";
import { STICKERS } from "../utils/stickers";
import "./EffectsBar.css";

function EffectsBar({
  filter,
  onFilterChange,
  sticker,
  onStickerChange,
  disabled = false,
  trackingStatus = "idle",
  faceFound = false,
  onRetry,
}) {
  const [tab, setTab] = useState("filters");

  let hint = "";

  if (sticker !== "none") {
    if (trackingStatus === "loading") {
      hint = "Loading face tracking…";
    } else if (trackingStatus === "error") {
      hint = "error";
    } else if (trackingStatus === "ready" && !faceFound) {
      hint = "Show your face to the camera 👀";
    }
  }

  return (
    <div className="fx">
      <div className="fx-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "filters"}
          className={tab === "filters" ? "fx-tab active" : "fx-tab"}
          onClick={() => setTab("filters")}
        >
          🎨 Filters
        </button>

        <button
          role="tab"
          aria-selected={tab === "stickers"}
          className={tab === "stickers" ? "fx-tab active" : "fx-tab"}
          onClick={() => setTab("stickers")}
        >
          ✨ Stickers
          {sticker !== "none" && <span className="fx-dot" />}
        </button>
      </div>

      {tab === "filters" ? (
        <FilterBar
          active={filter}
          onChange={onFilterChange}
          disabled={disabled}
        />
      ) : (
        <div className="filter-bar" role="listbox" aria-label="Face stickers">
          {STICKERS.map((item, index) => (
            <button
              key={item.id}
              role="option"
              aria-selected={sticker === item.id}
              className={
                sticker === item.id ? "filter-chip active" : "filter-chip"
              }
              style={{ "--i": index }}
              onClick={() => onStickerChange(item.id)}
              disabled={disabled}
            >
              <span className="sticker-swatch">{item.icon}</span>
              <span className="filter-name">{item.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="fx-hint" aria-live="polite">
        {hint === "error" ? (
          <>
            Face tracking couldn't load.{" "}
            <button className="fx-retry" onClick={onRetry}>
              Try again
            </button>
          </>
        ) : (
          hint
        )}
      </div>
    </div>
  );
}

export default EffectsBar;
