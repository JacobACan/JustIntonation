"use client";

import { useContext, useState } from "react";
import { ScalesQuizSettingsContext } from "@/components/providers/scalesQuizSettingsProvider";
import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { ScalesQuizEvent } from "@/machines/scalesQuizProcess";
import { Slider } from "@/components/ui/slider";
import {
  ScalesQuizMode,
  ScalesQuizSettings as ScalesQuizSettingsType,
  DEGREE_OPTIONS,
} from "@/constants/scalesQuizSettings";
import {
  SCALES_MASTERY_STORAGE_KEY,
  DEGREE_MASTERY_STORAGE_KEY,
} from "@/constants/masteryConfig";
import {
  loadMasteryStore,
  saveMasteryStore,
  getUnlockedMelodyLength,
  loadDegreeMasteryStore,
  saveDegreeMasteryStore,
} from "@/lib/mastery";
import { Key } from "@/constants/keys";

const ALL_KEYS: Key[] = [
  Key.C,
  Key.Db,
  Key.D,
  Key.Eb,
  Key.E,
  Key.F,
  Key.Gb,
  Key.G,
  Key.Ab,
  Key.A,
  Key.Bb,
  Key.B,
];

const shapeLabel = (key: Key): string => `Shape ${ALL_KEYS.indexOf(key) + 1}`;
import MasteryProgressPanel from "./masteryProgressPanel";
import DegreeMasteryProgressPanel from "./degreeMasteryProgressPanel";
import ShapeSelector from "./shapeSelector";
import ScalesMidiSelector from "./scalesMidiSelector";
import PlayIcon from "@/components/icon/playIcon";
import { SettingsIcon } from "@/components/icon/settingsIcon";
import clsx from "clsx";

const MODE_LABELS = [
  "1 Ion",
  "2 Dor",
  "3 Phr",
  "4 Lyd",
  "5 Mix",
  "6 Aeo",
  "7 Loc",
];

export default function ScalesQuizSettings() {
  const { settings, updateSettings } = useContext(ScalesQuizSettingsContext);
  const scalesQuizActor = useContext(ScalesQuizMachineContext);
  const [showExtraSettings, setExtraSettings] = useState(false);

  if (!scalesQuizActor) return null;

  return (
    <div className="overflow-hidden">
      <button
        className="absolute top-5 right-5 z-20"
        onClick={() => setExtraSettings(!showExtraSettings)}
      >
        <SettingsIcon
          className={clsx(
            "hover:stroke-primary h-[35px] w-[35px] hover:cursor-pointer",
            {
              "stroke-primary fill-primary": showExtraSettings,
              "fill-primary": !showExtraSettings,
            },
          )}
        />
      </button>

      {/* Left panel — Quiz Settings */}
      <section
        className={clsx(
          "pointer-events-none absolute left-0 h-[100vh] w-[30%] justify-items-center overflow-y-auto",
          { hidden: !showExtraSettings },
        )}
      >
        <div className="via-background to-background pointer-events-none absolute z-10 h-full w-full bg-gradient-to-l from-transparent via-10%"></div>
        <div className="pointer-events-auto absolute z-10 p-4">
          <div className="pt-10">
            <h1>Quiz Settings</h1>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-sm font-bold">Octaves</h3>
                <div className="mt-1 flex gap-1">
                  {([1, 2] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => updateSettings("octaves", n)}
                      className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                        settings.octaves === n
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold">Included Degrees</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {DEGREE_OPTIONS.map(({ semitone, label }) => {
                    const isActive =
                      settings.includedDegrees.includes(semitone);
                    return (
                      <button
                        key={semitone}
                        onClick={() => {
                          const current = settings.includedDegrees;
                          if (isActive) {
                            if (current.length <= 1) return;
                            updateSettings(
                              "includedDegrees",
                              current.filter((d) => d !== semitone),
                            );
                          } else {
                            updateSettings(
                              "includedDegrees",
                              [...current, semitone].sort((a, b) => a - b),
                            );
                          }
                        }}
                        className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-[var(--foreground)] text-[var(--background)]"
                            : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mastery toggle — both modes */}
              <div>
                <button
                  onClick={() =>
                    updateSettings("masteryMode", !settings.masteryMode)
                  }
                  className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                    settings.masteryMode
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                  }`}
                >
                  Mastery Mode: {settings.masteryMode ? "On" : "Off"}
                </button>
              </div>

              {/* Review frequency — only when mastery is on */}
              {settings.masteryMode && (
                <div>
                  <h3 className="text-sm font-bold">
                    Review Mastered: every{" "}
                    {settings.masteryReviewFrequency === 0
                      ? "never"
                      : `${settings.masteryReviewFrequency} questions`}
                  </h3>
                  <Slider
                    value={[settings.masteryReviewFrequency]}
                    min={0}
                    max={10}
                    onValueChange={([val]) =>
                      updateSettings("masteryReviewFrequency", val)
                    }
                  />
                </div>
              )}

              {/* Melody-specific: length display or slider */}
              {settings.quizMode === ScalesQuizMode.Melody && (
                <>
                  {settings.masteryMode ? (
                    <div>
                      <h3 className="text-sm font-bold">
                        Melody Length:{" "}
                        {(() => {
                          const store = loadMasteryStore(
                            SCALES_MASTERY_STORAGE_KEY,
                          );
                          const key = settings.questionKeys[0];
                          const keyData = key ? store.keys[key] : undefined;
                          return keyData
                            ? getUnlockedMelodyLength(
                                keyData,
                                settings.includedDegrees,
                              )
                            : 2;
                        })()}{" "}
                        notes (mastery)
                      </h3>
                      <ExpandableMasteryProgress settings={settings} />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-bold">
                        Melody Length: {settings.melodyLength}
                      </h3>
                      <Slider
                        min={2}
                        max={8}
                        defaultValue={[settings.melodyLength]}
                        onValueChange={([val]) =>
                          updateSettings("melodyLength", val)
                        }
                      />
                    </div>
                  )}
                </>
              )}

              {/* Degree-specific: mastery progress */}
              {settings.quizMode === ScalesQuizMode.Degree &&
                settings.masteryMode && (
                  <ExpandableDegreeMasteryProgress settings={settings} />
                )}

              <div>
                <h3 className="text-sm font-bold">
                  Time To Answer: {settings.timeToAnswerQuestion / 1000}s
                </h3>
                <Slider
                  value={[settings.timeToAnswerQuestion]}
                  min={2000}
                  max={15000}
                  onValueChange={([val]) =>
                    updateSettings("timeToAnswerQuestion", val)
                  }
                />
              </div>

              <div>
                <h3 className="text-sm font-bold">
                  Questions: {settings.numberOfQuestions}
                </h3>
                <Slider
                  min={5}
                  max={50}
                  defaultValue={[settings.numberOfQuestions]}
                  onValueChange={([val]) =>
                    updateSettings("numberOfQuestions", val)
                  }
                />
              </div>

              <div>
                <button
                  onClick={() =>
                    updateSettings(
                      "pianoSoundEnabled",
                      !settings.pianoSoundEnabled,
                    )
                  }
                  className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                    settings.pianoSoundEnabled
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                  }`}
                >
                  MIDI Sound: {settings.pianoSoundEnabled ? "On" : "Off"}
                </button>
                {settings.quizMode === ScalesQuizMode.Degree && (
                  <button
                    onClick={() =>
                      updateSettings(
                        "playDegreeAudio",
                        !settings.playDegreeAudio,
                      )
                    }
                    className={`ml-1 rounded px-3 py-1 text-xs font-bold transition-colors ${
                      settings.playDegreeAudio
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                    }`}
                  >
                    Degree Audio: {settings.playDegreeAudio ? "On" : "Off"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main area — Shape selector */}
      <div className="flex h-lvh flex-col items-center justify-center gap-6 text-center">
        <h2 className="text-lg font-bold">Conceptualize Diatonic Shapes</h2>
        <div className="flex gap-1">
          {Object.values(ScalesQuizMode).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings("quizMode", mode)}
              className={`rounded px-4 py-2 text-sm font-bold transition-colors ${
                settings.quizMode === mode
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--middleground2)] text-[var(--middleground1)]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <ScalesMidiSelector />
        <button
          className="flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
          }}
          onClick={() => scalesQuizActor.send({ type: ScalesQuizEvent.START })}
        >
          <PlayIcon />
        </button>
        <ShapeSelector />
      </div>
    </div>
  );
}

function ExpandableMasteryProgress({
  settings,
}: {
  settings: ScalesQuizSettingsType;
}) {
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const key = settings.questionKeys[0];
  if (!key) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-bold opacity-60 transition-opacity hover:opacity-100"
      >
        {expanded ? "Hide" : "View"} Learning Progress{" "}
        {expanded ? "\u25B2" : "\u25BC"}
      </button>
      {expanded && (
        <>
          <div className="mt-2 rounded border border-[var(--middleground2)] p-3">
            <MasteryProgressPanel
              currentKey={key}
              questionKeys={settings.questionKeys}
              includedDegrees={settings.includedDegrees}
              refreshKey={refreshKey}
              onResetShape={(k) => {
                const store = loadMasteryStore(SCALES_MASTERY_STORAGE_KEY);
                delete store.keys[k];
                saveMasteryStore(SCALES_MASTERY_STORAGE_KEY, store);
                setRefreshKey((r) => r + 1);
              }}
            />
          </div>
          <div className="mt-2">
            <ResetAllShapesButton
              quizMode={settings.quizMode}
              onReset={() => setRefreshKey((r) => r + 1)}
            />
          </div>
        </>
      )}
    </div>
  );
}

const resetBtnClass =
  "rounded px-2 py-1 text-xs font-bold transition-colors bg-[#f4a0a0] text-[#5c1a1a] hover:bg-[#e88080]";
const resetConfirmClass =
  "rounded px-2 py-1 text-xs font-bold transition-colors bg-[#e06060] text-white hover:bg-[#d04040]";

function ResetAllShapesButton({
  quizMode,
  onReset,
}: {
  quizMode: ScalesQuizMode;
  onReset?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    if (quizMode === ScalesQuizMode.Melody) {
      saveMasteryStore(SCALES_MASTERY_STORAGE_KEY, { version: 1, keys: {} });
    } else {
      saveDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY, {
        version: 1,
        keys: {},
      });
    }
    setConfirming(false);
    onReset?.();
  };

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button onClick={reset} className={resetConfirmClass}>
          Confirm reset all shapes?
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-1 text-xs font-bold opacity-60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className={resetBtnClass}>
      Reset Learning Progress for All Shapes
    </button>
  );
}

function ExpandableDegreeMasteryProgress({
  settings,
}: {
  settings: ScalesQuizSettingsType;
}) {
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const key = settings.questionKeys[0];
  if (!key) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-bold opacity-60 transition-opacity hover:opacity-100"
      >
        {expanded ? "Hide" : "View"} Learning Progress{" "}
        {expanded ? "\u25B2" : "\u25BC"}
      </button>
      {expanded && (
        <>
          <div className="mt-2 rounded border border-[var(--middleground2)] p-3">
            <DegreeMasteryProgressPanel
              currentKey={key}
              questionKeys={settings.questionKeys}
              includedDegrees={settings.includedDegrees}
              refreshKey={refreshKey}
              onResetShape={(k) => {
                const store = loadDegreeMasteryStore(
                  DEGREE_MASTERY_STORAGE_KEY,
                );
                delete store.keys[k];
                saveDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY, store);
                setRefreshKey((r) => r + 1);
              }}
            />
          </div>
          <div className="mt-2">
            <ResetAllShapesButton
              quizMode={settings.quizMode}
              onReset={() => setRefreshKey((r) => r + 1)}
            />
          </div>
        </>
      )}
    </div>
  );
}
