"use client";

import { useContext, useState } from "react";
import { ScalesQuizSettingsContext } from "@/components/providers/scalesQuizSettingsProvider";
import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { ScalesQuizEvent } from "@/machines/scalesQuizProcess";
import { Slider } from "@/components/ui/slider";
import { ScalesQuizMode } from "@/constants/scalesQuizSettings";
import ShapeSelector from "./shapeSelector";
import ScalesMidiSelector from "./scalesMidiSelector";
import PlayIcon from "@/components/icon/playIcon";
import { SettingsIcon } from "@/components/icon/settingsIcon";
import clsx from "clsx";

const MODE_LABELS = ["1 Ion", "2 Dor", "3 Phr", "4 Lyd", "5 Mix", "6 Aeo", "7 Loc"];

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
                <h3 className="text-sm font-bold">Starting Degree (Mode)</h3>
                <div className="mt-1 flex gap-1">
                  {MODE_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => updateSettings("startingDegree", i)}
                      className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                        settings.startingDegree === i
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold">
                  Context Phrase Speed: {Math.round(settings.contextPhraseSpeed * 1000)}ms
                </h3>
                <Slider
                  value={[settings.contextPhraseSpeed * 1000]}
                  min={50}
                  max={500}
                  onValueChange={([val]) =>
                    updateSettings("contextPhraseSpeed", val / 1000)
                  }
                />
              </div>

              {settings.quizMode === ScalesQuizMode.Melody && (
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
                    updateSettings("pianoSoundEnabled", !settings.pianoSoundEnabled)
                  }
                  className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                    settings.pianoSoundEnabled
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--middleground2)] text-[var(--middleground1)]"
                  }`}
                >
                  MIDI Sound: {settings.pianoSoundEnabled ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main area — Shape selector */}
      <div className="flex h-lvh flex-col items-center justify-center gap-6 text-center">
        <h2 className="text-lg font-bold">Scales Quiz</h2>
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
        <p className="text-sm text-[var(--middleground1)]">
          {settings.quizMode === ScalesQuizMode.Melody
            ? "Identify the first note of a melody"
            : "Play the scale degree shown on screen"}
        </p>
        <ScalesMidiSelector />
        <ShapeSelector />
        <button
          className="flex items-center justify-center"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
          }}
          onClick={() =>
            scalesQuizActor.send({ type: ScalesQuizEvent.START })
          }
        >
          <PlayIcon />
        </button>
      </div>
    </div>
  );
}
