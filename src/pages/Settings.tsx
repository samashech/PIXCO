import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Preview } from "../components/Preview";
import { games } from "../games/registry";
import {
  defaults,
  store,
  useStore,
  type Settings as SettingsType,
} from "../storage/store";
import { defaultMappings } from "../input/controls";
import type { Input } from "../games/engine/types";
import { synth } from "../audio/synth";
import { parseSettings } from "../storage/validation";
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="setting-row">
      <div>
        <b>{label}</b>
        <p>{description}</p>
      </div>
      <input
        className="toggle"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function Settings() {
  const { settings } = useStore();
  const [message, setMessage] = useState(""),
    [mapping, setMapping] = useState<Input | null>(null),
    [controller, setController] = useState("No controller connected"),
    [confirm, setConfirm] = useState<
      "scores" | "favorites" | "statistics" | null
    >(null);
  const file = useRef<HTMLInputElement>(null);
  const update = (values: Partial<SettingsType>) => store.settings(values);
  useEffect(() => {
    const poll = () => {
      try {
        const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
        setController(pad ? pad.id : "No controller connected");
      } catch {
        setController("Gamepad API unavailable — keyboard is ready");
      }
    };
    poll();
    const timer = setInterval(poll, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!mapping) return;
    const listen = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setMapping(null);
        return;
      }
      if (
        [
          "ShiftLeft",
          "ShiftRight",
          "ControlLeft",
          "ControlRight",
          "AltLeft",
          "AltRight",
          "MetaLeft",
          "MetaRight",
        ].includes(e.code)
      )
        return;
      const old = Object.entries(settings.mappings).find(
        ([input, code]) => code === e.code && input !== mapping,
      );
      if (old) {
        setMessage(
          `That key is already assigned to ${old[0]}. Choose another key.`,
        );
        return;
      }
      update({ mappings: { ...settings.mappings, [mapping]: e.code } });
      setMapping(null);
      setMessage("Control saved.");
    };
    window.addEventListener("keydown", listen, true);
    return () => window.removeEventListener("keydown", listen, true);
  }, [mapping, settings.mappings]);
  const exportSettings = () => {
    const blob = new Blob([JSON.stringify({ version: 1, settings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "brickbox-settings.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Settings exported.");
  };
  return (
    <div className="settings-page">
      <div className="settings-main">
        <section className="settings-panel">
          <div className="settings-title">
            <Icon name="SlidersHorizontal" />
            <h2>Display</h2>
            <span>THE LCD, YOUR WAY</span>
          </div>
          <div className="theme-picker">
            {(["green", "gray", "amber", "dark"] as const).map((theme) => (
              <button
                key={theme}
                className={settings.theme === theme ? "selected" : ""}
                onClick={() => update({ theme })}
              >
                <i className={`theme-swatch swatch-${theme}`}>▦</i>
                <span>
                  {theme === "green"
                    ? "Classic green"
                    : theme === "gray"
                      ? "Gray LCD"
                      : theme === "amber"
                        ? "Amber"
                        : "Dark LCD"}
                </span>
                {settings.theme === theme && <Icon name="Check" size={13} />}
              </button>
            ))}
          </div>
          <label className="setting-row">
            <div>
              <b>LCD effects</b>
              <p>Keep it clean, or add a little history.</p>
            </div>
            <select
              value={settings.effect}
              onChange={(e) =>
                update({ effect: e.target.value as SettingsType["effect"] })
              }
            >
              <option value="off">Off · clean pixels</option>
              <option value="classic">Classic · pixel grid</option>
              <option value="authentic">Authentic · subtle persistence</option>
            </select>
          </label>
          <label className="setting-row">
            <div>
              <b>Pixel detail</b>
              <p>Adjust the size of each pixel’s inner detail.</p>
            </div>
            <select
              value={settings.pixelSize}
              onChange={(e) => update({ pixelSize: Number(e.target.value) })}
            >
              <option value="6">Fine</option>
              <option value="8">Classic</option>
              <option value="10">Bold</option>
            </select>
          </label>
          <label className="setting-row">
            <div>
              <b>Screen scaling</b>
              <p>Preserve whole pixels or fill the available LCD.</p>
            </div>
            <select
              value={settings.screenScaling}
              onChange={(e) =>
                update({
                  screenScaling: e.target
                    .value as SettingsType["screenScaling"],
                })
              }
            >
              <option value="integer">Integer · crispest</option>
              <option value="fit">Fit to screen</option>
            </select>
          </label>
          <label className="setting-row">
            <div>
              <b>UI scale</b>
              <p>A little more room for your eyes.</p>
            </div>
            <select
              value={settings.uiScale}
              onChange={(e) => update({ uiScale: Number(e.target.value) })}
            >
              <option value="1">100%</option>
              <option value="1.1">110%</option>
              <option value="1.2">120%</option>
            </select>
          </label>
          <label className="setting-row">
            <div>
              <b>Library density</b>
              <p>Choose how much space your collection takes.</p>
            </div>
            <select
              value={settings.density}
              onChange={(e) =>
                update({ density: e.target.value as SettingsType["density"] })
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <Toggle
            label="Interface motion"
            description="Subtle card and button transitions."
            checked={settings.motion}
            onChange={(motion) => update({ motion })}
          />
        </section>
        <section className="settings-panel">
          <div className="settings-title">
            <Icon name="Volume2" />
            <h2>Sound</h2>
            <button className="text-button" onClick={() => synth.play("level")}>
              Test sound <Icon name="Play" size={12} />
            </button>
          </div>
          <Toggle
            label="Mute sound"
            description="All the nostalgia. None of the beeps."
            checked={settings.muted}
            onChange={(muted) => update({ muted })}
          />
          {(["master", "sfx"] as const).map((key) => (
            <label key={key} className="setting-row">
              <div>
                <b>{key === "master" ? "Master volume" : "Sound effects"}</b>
                <p>
                  {key === "master"
                    ? "The overall volume of your handheld."
                    : "Original, synthesized square-wave sounds."}
                </p>
              </div>
              <div className="range-control">
                <input
                  aria-label={
                    key === "master" ? "Master volume" : "Sound effects volume"
                  }
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings[key]}
                  onChange={(e) => update({ [key]: Number(e.target.value) })}
                />
                <span>{Math.round(settings[key] * 100)}%</span>
              </div>
            </label>
          ))}
        </section>
        <section className="settings-panel">
          <div className="settings-title">
            <Icon name="Keyboard" />
            <h2>Controls</h2>
            <button
              className="text-button"
              onClick={() => {
                update({ mappings: { ...defaultMappings } });
                setMessage("Default controls restored.");
              }}
            >
              Restore defaults
            </button>
          </div>
          <p className="settings-hint">
            Select a key, then press its replacement. Escape cancels.
          </p>
          <div className="mapping-grid">
            {(Object.entries(settings.mappings) as [Input, string][]).map(
              ([input, code]) => (
                <div className="mapping-item" key={input}>
                  <span>{input}</span>
                  <button
                    className={mapping === input ? "listening" : ""}
                    onClick={() => {
                      setMapping(input);
                      setMessage("");
                    }}
                    aria-label={`Remap ${input}`}
                  >
                    {mapping === input
                      ? "PRESS A KEY"
                      : code.replace("Key", "").replace("Arrow", "")}
                    {mapping !== input && <Icon name="Keyboard" size={12} />}
                  </button>
                </div>
              ),
            )}
          </div>
          <div className="controller-status">
            <Icon name="Gamepad2" />
            <div>
              <b>{controller}</b>
              <p>Connect a controller and press any button to wake it.</p>
            </div>
          </div>
          <div className="controller-mapping">
            <span>
              D-pad / left stick <b>MOVE</b>
            </span>
            <span>
              South / east <b>A / B</b>
            </span>
            <span>
              Start / select <b>PAUSE / MENU</b>
            </span>
          </div>
          <Toggle
            label="Swap controller A / B"
            description="For controllers with a different button layout."
            checked={settings.swapButtons}
            onChange={(swapButtons) => update({ swapButtons })}
          />
        </section>
        <section className="settings-panel">
          <div className="settings-title">
            <Icon name="Gamepad2" />
            <h2>Gameplay</h2>
          </div>
          <Toggle
            label="Auto-pause"
            description="Pause when you switch windows or hide the app."
            checked={settings.autoPause}
            onChange={(autoPause) => update({ autoPause })}
          />
          <Toggle
            label="Show game timer"
            description="Time flies. Keep an eye on it."
            checked={settings.timer}
            onChange={(timer) => update({ timer })}
          />
          <Toggle
            label="Show FPS"
            description="Display the measured frame rate on the LCD."
            checked={settings.fps}
            onChange={(fps) => update({ fps })}
          />
        </section>
        <section className="settings-panel">
          <div className="settings-title">
            <Icon name="Layers" />
            <h2>Your data</h2>
            <span>STAYS ON THIS DEVICE</span>
          </div>
          <p className="settings-hint">
            Scores, favorites, and history are saved locally. No account needed.
          </p>
          <div className="data-buttons">
            <button className="secondary-button" onClick={exportSettings}>
              Export settings <Icon name="ArrowUpRight" size={13} />
            </button>
            <button
              className="secondary-button"
              onClick={() => file.current?.click()}
            >
              Import settings <Icon name="ArrowDown" size={13} />
            </button>
            <input
              ref={file}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const uploaded = e.target.files?.[0];
                if (!uploaded) return;
                try {
                  if (uploaded.size > 100_000)
                    throw new Error("Settings file is too large.");
                  const parsed = parseSettings(await uploaded.text());
                  update(parsed);
                  setMessage("Settings imported. Make yourself at home.");
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Could not read settings.",
                  );
                }
                e.target.value = "";
              }}
            />
          </div>
          <div className="reset-buttons">
            {(["scores", "favorites", "statistics"] as const).map((kind) => (
              <button key={kind} onClick={() => setConfirm(kind)}>
                Reset {kind === "scores" ? "high scores" : kind}
              </button>
            ))}
          </div>
          {confirm && (
            <div className="confirm-reset">
              <span>Reset {confirm}? This cannot be undone.</span>
              <button
                onClick={() => {
                  store.reset(confirm);
                  setConfirm(null);
                  setMessage(`${confirm} reset.`);
                }}
              >
                Yes, reset
              </button>
              <button onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          )}
        </section>
        <p className="settings-message" role="status">
          {message}
        </p>
      </div>
      <aside className="settings-preview">
        <span className="eyebrow">A LITTLE PREVIEW</span>
        <Preview game={games[0]} />
        <h3>Looks like childhood.</h3>
        <p>
          A little sharper. A little more you.
          <br />
          Your display settings apply to every game.
        </p>
        <div>
          <Icon name="Check" size={13} /> CHANGES SAVE AUTOMATICALLY
        </div>
        <button
          className="text-button"
          onClick={() => {
            update({ ...defaults, mappings: { ...defaultMappings } });
            setMessage(
              "Default settings restored. Scores and favorites are unchanged.",
            );
          }}
        >
          Restore all default settings <Icon name="RotateCcw" size={13} />
        </button>
      </aside>
    </div>
  );
}
