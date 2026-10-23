import type { RoomToneController } from "../lib/roomTone";
import type { TvNavigation } from "../lib/useTvNavigation";
import { Glyph } from "./Glyph";

interface RemoteProps {
  navigation: TvNavigation;
  sound: RoomToneController;
  onBack: () => void;
  disabled?: boolean;
}

export function Remote({ navigation, sound, onBack, disabled }: RemoteProps) {
  return (
    <div className={`remote ${disabled ? "is-disabled" : ""}`} aria-label="Fire TV remote">
      <div className="remote__head">
        <span className="section-label section-label--inline">
          <span>Remote</span>
        </span>
        <span className="mono">D-pad</span>
      </div>

      <div className="remote__pad">
        <button
          type="button"
          className="remote__btn remote__btn--up"
          data-tv-action
          onClick={() => navigation.move(-1)}
          aria-label="Move up"
          disabled={disabled}
        >
          <Glyph name="up" size={16} />
        </button>
        <button
          type="button"
          className="remote__btn remote__btn--left"
          data-tv-action
          onClick={() => navigation.move(-1)}
          aria-label="Move left"
          disabled={disabled}
        >
          <Glyph name="left" size={16} />
        </button>
        <button
          type="button"
          className="remote__select"
          data-tv-action
          onClick={() => navigation.select()}
          aria-label="Select the focused action"
          disabled={disabled}
        >
          <span>OK</span>
        </button>
        <button
          type="button"
          className="remote__btn remote__btn--right"
          data-tv-action
          onClick={() => navigation.move(1)}
          aria-label="Move right"
          disabled={disabled}
        >
          <Glyph name="right" size={16} />
        </button>
        <button
          type="button"
          className="remote__btn remote__btn--down"
          data-tv-action
          onClick={() => navigation.move(1)}
          aria-label="Move down"
          disabled={disabled}
        >
          <Glyph name="down" size={16} />
        </button>
      </div>

      <div className="remote__row">
        <button
          type="button"
          className="remote__pill"
          data-tv-action
          onClick={onBack}
          disabled={disabled}
        >
          <Glyph name="back" size={14} />
          Back
        </button>
        <button
          type="button"
          className="remote__pill"
          data-tv-action
          onClick={sound.toggle}
          aria-pressed={sound.enabled}
        >
          <Glyph name={sound.enabled ? "sound" : "mute"} size={14} />
          {sound.enabled ? "Sound" : "Muted"}
        </button>
      </div>

      <p className="remote__hint">Keyboard mirrors the remote while this panel has focus.</p>
    </div>
  );
}
