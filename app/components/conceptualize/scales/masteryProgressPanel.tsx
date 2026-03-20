"use client";

import { useMemo, useState } from "react";
import { Key } from "@/constants/keys";
import { DEGREE_OPTIONS } from "@/constants/scalesQuizSettings";
import {
  DegreePairRecord,
  SCALES_MASTERY_STORAGE_KEY,
  PAIRS_TO_UNLOCK_NEXT_LENGTH,
} from "@/constants/masteryConfig";
import {
  loadMasteryStore,
  isPairMastered,
  getActivePairs,
  getMasteredPairs,
  generatePairOrder,
  getUnlockedMelodyLength,
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

const pairLabel = (from: number, to: number): string =>
  `${degreeLabel(from)}\u2192${degreeLabel(to)}`;

const accuracy = (record: DegreePairRecord): number => {
  if (record.rollingWindow.length === 0) return 0;
  return (
    record.rollingWindow.filter(Boolean).length / record.rollingWindow.length
  );
};

const accuracyPercent = (record: DegreePairRecord): string =>
  `${Math.round(accuracy(record) * 100)}%`;

interface MasteryProgressPanelProps {
  currentKey: Key;
  questionKeys: Key[];
  includedDegrees: number[];
  /** Refresh trigger — pass questionNumber or similar to force recalc after answers */
  refreshKey?: number;
  onResetShape?: (key: Key) => void;
}

export default function MasteryProgressPanel({
  currentKey,
  questionKeys,
  includedDegrees,
  refreshKey,
  onResetShape,
}: MasteryProgressPanelProps) {
  const [viewIndex, setViewIndex] = useState(() =>
    Math.max(0, questionKeys.indexOf(currentKey)),
  );

  const viewKey = questionKeys[viewIndex] ?? currentKey;
  const hasMultipleKeys = questionKeys.length > 1;

  const store = useMemo(
    () => loadMasteryStore(SCALES_MASTERY_STORAGE_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewKey, includedDegrees, refreshKey],
  );

  const keyData = store.keys[viewKey] ?? {
    pairs: {},
    unlockedMelodyLength: 2,
  };

  const allPairsOrder = generatePairOrder(includedDegrees);
  const activePairs = getActivePairs(keyData, includedDegrees);
  const masteredPairs = getMasteredPairs(keyData, includedDegrees);
  const activeSet = new Set(activePairs.map(([f, t]) => `${f}->${t}`));
  const masteredSet = new Set(masteredPairs.map(([f, t]) => `${f}->${t}`));

  const upcoming = allPairsOrder
    .filter((p) => {
      const k = `${p[0]}->${p[1]}`;
      return !activeSet.has(k) && !masteredSet.has(k);
    })
    .slice(0, 5);

  const masteredCount = masteredPairs.length;
  const totalPairs = allPairsOrder.length;
  const melodyLength = getUnlockedMelodyLength(keyData, includedDegrees);

  const threshold = Math.min(PAIRS_TO_UNLOCK_NEXT_LENGTH, totalPairs);
  const pairsInCurrentTier = threshold > 0 ? masteredCount % threshold : 0;
  const pairsUntilNextLength =
    threshold > 0 ? threshold - pairsInCurrentTier : 0;

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

      {/* Overall progress */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--middleground2)]">
            <div
              className="h-full rounded-full bg-[#4ade80] transition-all"
              style={{
                width: `${totalPairs > 0 ? (masteredCount / totalPairs) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="font-bold">
            {masteredCount}/{totalPairs}
          </span>
        </div>
      </div>

      {/* Melody length status */}
      <div>
        <h4 className="mb-1 text-sm font-bold">
          Melody Length: {melodyLength} notes
        </h4>
        {pairsUntilNextLength > 0 && masteredCount < totalPairs && (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--middleground2)]">
                <div
                  className="h-full rounded-full bg-[#60a5fa] transition-all"
                  style={{
                    width: `${(pairsInCurrentTier / threshold) * 100}%`,
                  }}
                />
              </div>
              <span className="opacity-60">
                {pairsInCurrentTier}/{threshold}
              </span>
            </div>
            <p className="opacity-60">
              {pairsUntilNextLength} more mastered to unlock {melodyLength + 1}
              -note melodies
            </p>
          </div>
        )}
      </div>

      {/* Currently practicing */}
      {activePairs.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-bold">Practicing</h4>
          <div className="space-y-2">
            {activePairs.map(([f, t]) => {
              const k = `${f}->${t}`;
              const record = keyData.pairs[k];
              const attempts = record?.rollingWindow.length ?? 0;

              return (
                <div key={k}>
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="font-bold">{pairLabel(f, t)}</span>
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
      {masteredPairs.length > 0 && (
        <div>
          <h4 className="mb-1 text-sm font-bold">Mastered</h4>
          <div className="flex flex-wrap gap-1">
            {masteredPairs.map(([f, t]) => {
              const k = `${f}->${t}`;
              const record = keyData.pairs[k];
              return (
                <span
                  key={k}
                  className="rounded bg-[#4ade80]/20 px-1.5 py-0.5 text-[#4ade80]"
                  title={record ? `${accuracyPercent(record)} accuracy` : ""}
                >
                  {pairLabel(f, t)}
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
            {upcoming.map(([f, t]) => (
              <span
                key={`${f}->${t}`}
                className="rounded bg-[var(--middleground2)] px-1.5 py-0.5 text-[var(--middleground1)]"
              >
                {pairLabel(f, t)}
              </span>
            ))}
            {upcoming.length <
              totalPairs - masteredCount - activePairs.length && (
              <span className="px-1.5 py-0.5 opacity-40">
                +
                {totalPairs -
                  masteredCount -
                  activePairs.length -
                  upcoming.length}{" "}
                more
              </span>
            )}
          </div>
        </div>
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
