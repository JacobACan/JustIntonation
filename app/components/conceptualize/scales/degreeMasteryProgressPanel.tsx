"use client";

import { useMemo, useState } from "react";
import { Key } from "@/constants/keys";
import { DEGREE_OPTIONS } from "@/constants/scalesQuizSettings";
import {
  DegreeRecord,
  DEGREE_MASTERY_STORAGE_KEY,
} from "@/constants/masteryConfig";
import {
  loadDegreeMasteryStore,
  isDegreeMastered,
  isFullyMasteredForDegrees,
  getActiveDegrees,
  getMasteredDegrees,
  allDegreesIndividuallyMastered,
} from "@/lib/mastery";
import ArrowLeftIcon from "@/components/icon/arrowLeft";
import ArrowRightIcon from "@/components/icon/arrowRight";

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

const degreeLabel = (semitone: number): string =>
  DEGREE_OPTIONS.find((d) => d.semitone === semitone)?.label ?? `${semitone}`;

const accuracy = (record: DegreeRecord): number => {
  if (record.rollingWindow.length === 0) return 0;
  return (
    record.rollingWindow.filter(Boolean).length / record.rollingWindow.length
  );
};

const accuracyPercent = (record: DegreeRecord): string =>
  `${Math.round(accuracy(record) * 100)}%`;

interface DegreeMasteryProgressPanelProps {
  currentKey: Key;
  questionKeys: Key[];
  includedDegrees: number[];
  refreshKey?: number;
  onResetShape?: (key: Key) => void;
  finalTestActive?: boolean;
  finalTestProgress?: number;
  finalTestTotal?: number;
}

export default function DegreeMasteryProgressPanel({
  currentKey,
  questionKeys,
  includedDegrees,
  refreshKey,
  onResetShape,
  finalTestActive,
  finalTestProgress,
  finalTestTotal,
}: DegreeMasteryProgressPanelProps) {
  const [viewIndex, setViewIndex] = useState(() =>
    Math.max(0, questionKeys.indexOf(currentKey)),
  );

  const viewKey = questionKeys[viewIndex] ?? currentKey;
  const hasMultipleKeys = questionKeys.length > 1;

  const store = useMemo(
    () => loadDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewKey, includedDegrees, refreshKey],
  );

  const keyData = store.keys[viewKey] ?? { degrees: {} };

  const activeDegrees = getActiveDegrees(keyData, includedDegrees);
  const masteredDegrees = getMasteredDegrees(keyData, includedDegrees);
  const activeSet = new Set(activeDegrees);
  const masteredSet = new Set(masteredDegrees);

  const upcoming = includedDegrees.filter(
    (d) => !activeSet.has(d) && !masteredSet.has(d),
  );

  const masteredCount = masteredDegrees.length;
  const totalDegrees = includedDegrees.length;

  const goLeft = () =>
    setViewIndex((i) => (i - 1 + questionKeys.length) % questionKeys.length);
  const goRight = () => setViewIndex((i) => (i + 1) % questionKeys.length);

  return (
    <div className="space-y-4 text-xs">
      {/* Key selector header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          {hasMultipleKeys && (
            <button
              onClick={goLeft}
              className="flex h-5 w-5 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
            >
              <ArrowLeftIcon />
            </button>
          )}
          <h4 className="flex-1 text-center text-sm font-bold">
            {shapeLabel(viewKey)}
            {viewKey === currentKey && hasMultipleKeys && (
              <span className="ml-1 text-[0.6rem] font-normal opacity-50">
                (current)
              </span>
            )}
          </h4>
          {hasMultipleKeys && (
            <button
              onClick={goRight}
              className="flex h-5 w-5 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
            >
              <ArrowRightIcon />
            </button>
          )}
        </div>
        {hasMultipleKeys && (
          <div className="flex justify-center gap-1">
            {questionKeys.map((k, i) => (
              <button
                key={k}
                onClick={() => setViewIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === viewIndex
                    ? "bg-[var(--foreground)]"
                    : "bg-[var(--middleground2)]"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fully mastered badge */}
      {isFullyMasteredForDegrees(keyData, includedDegrees) && (
        <div className="rounded bg-[#4ade80]/20 p-2 text-center">
          <span className="text-sm font-bold text-[#4ade80]">
            Fully Mastered
          </span>
        </div>
      )}

      {/* Final test mode — replaces normal view */}
      {finalTestActive && viewKey === currentKey ? (
        <div>
          <h4 className="mb-2 text-sm font-bold">Final Test</h4>
          <p className="mb-2 opacity-60">Get every degree correct in a row</p>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--middleground2)]">
              <div
                className="h-full rounded-full bg-[#60a5fa] transition-all"
                style={{
                  width: `${(finalTestTotal ?? 0) > 0 ? ((finalTestProgress ?? 0) / (finalTestTotal ?? 1)) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="font-bold">
              {finalTestProgress ?? 0}/{finalTestTotal ?? 0}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Overall progress */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--middleground2)]">
                <div
                  className="h-full rounded-full bg-[#4ade80] transition-all"
                  style={{
                    width: `${totalDegrees > 0 ? (masteredCount / totalDegrees) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="font-bold">
                {masteredCount}/{totalDegrees} degrees
              </span>
            </div>
          </div>

          {/* Currently practicing */}
          {activeDegrees.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-bold">Practicing</h4>
              <div className="space-y-2">
                {activeDegrees.map((d) => {
                  const k = String(d);
                  const record = keyData.degrees[k];
                  const attempts = record?.rollingWindow.length ?? 0;

                  return (
                    <div key={k}>
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="font-bold">{degreeLabel(d)}</span>
                        <span className="opacity-60">
                          {record ? accuracyPercent(record) : "0%"}
                          {attempts > 0 && ` (${attempts} recent)`}
                        </span>
                      </div>
                      <div className="flex gap-px">
                        {record?.rollingWindow.map((correct, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-sm ${correct ? "bg-[#4ade80]" : "bg-[#f87171]"}`}
                          />
                        )) ?? null}
                        {Array.from({
                          length: Math.max(0, 10 - attempts),
                        }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="h-1.5 flex-1 rounded-sm bg-[var(--middleground2)]"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mastered */}
          {masteredDegrees.length > 0 && (
            <div>
              <h4 className="mb-1 text-sm font-bold">Mastered</h4>
              <div className="flex flex-wrap gap-1">
                {masteredDegrees.map((d) => {
                  const record = keyData.degrees[String(d)];
                  return (
                    <span
                      key={d}
                      className="rounded bg-[#4ade80]/20 px-1.5 py-0.5 text-[#4ade80]"
                      title={
                        record ? `${accuracyPercent(record)} accuracy` : ""
                      }
                    >
                      {degreeLabel(d)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Up next */}
          {upcoming.length > 0 && (
            <div>
              <h4 className="mb-1 text-sm font-bold">Up Next</h4>
              <div className="flex flex-wrap gap-1">
                {upcoming.slice(0, 5).map((d) => (
                  <span
                    key={d}
                    className="rounded bg-[var(--middleground2)] px-1.5 py-0.5 text-[var(--middleground1)]"
                  >
                    {degreeLabel(d)}
                  </span>
                ))}
                {upcoming.length > 5 && (
                  <span className="px-1.5 py-0.5 opacity-40">
                    +{upcoming.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {onResetShape && (
        <ResetCurrentShapeButton onReset={() => onResetShape(viewKey)} />
      )}
    </div>
  );
}

function ResetCurrentShapeButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="mt-3 flex gap-1">
        <button
          onClick={() => {
            onReset();
            setConfirming(false);
          }}
          className="rounded bg-[#e06060] px-2 py-1 text-xs font-bold text-white transition-colors hover:bg-[#d04040]"
        >
          Confirm reset?
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
    <button
      onClick={() => setConfirming(true)}
      className="mt-3 rounded bg-[#f4a0a0] px-2 py-1 text-xs font-bold text-[#5c1a1a] transition-colors hover:bg-[#e88080]"
    >
      Reset Learning Progress
    </button>
  );
}
