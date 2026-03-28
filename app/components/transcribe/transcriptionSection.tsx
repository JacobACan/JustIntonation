"use client";

import { useState, useCallback } from "react";
import { SectionGroup } from "@/types/transcribe";
import TranscriptionWaveform from "./transcriptionWaveform";

export default function TranscriptionSection({
  group,
  isExpanded,
  onToggle,
  onPlayStart,
  onPlayStop,
  isOriginalPlaying,
}: {
  group: SectionGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayStart: (label: string) => void;
  onPlayStop: () => void;
  isOriginalPlaying: boolean;
}) {
  const [selectedTakeIndex, setSelectedTakeIndex] = useState(0);
  const totalTakes = group.recordings.length;

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedTakeIndex((i) => Math.min(i + 1, totalTakes - 1));
    },
    [totalTakes],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedTakeIndex((i) => Math.max(i - 1, 0));
    },
    [],
  );

  const handlePlayStart = useCallback(() => {
    onPlayStart(group.label);
  }, [onPlayStart, group.label]);

  return (
    <div
      className={`rounded border transition-colors ${
        isExpanded
          ? "border-[var(--middleground1)]/20"
          : "border-transparent hover:border-[var(--middleground1)]/10"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:cursor-pointer"
      >
        <span className="text-xs font-bold text-[var(--foreground2)]">
          {group.label}
        </span>
        <div className="flex items-center gap-2">
          {totalTakes > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                disabled={selectedTakeIndex >= totalTakes - 1}
                className="text-xs text-[var(--middleground1)] transition-transform hover:scale-110 hover:cursor-pointer active:scale-95 disabled:opacity-30"
              >
                &lt;
              </button>
              <span className="text-xs text-[var(--middleground1)]/60">
                Take {totalTakes - selectedTakeIndex} of {totalTakes}
              </span>
              <button
                onClick={handleNext}
                disabled={selectedTakeIndex <= 0}
                className="text-xs text-[var(--middleground1)] transition-transform hover:scale-110 hover:cursor-pointer active:scale-95 disabled:opacity-30"
              >
                &gt;
              </button>
            </div>
          )}
          {totalTakes === 1 && (
            <span className="text-xs text-[var(--middleground1)]/40">
              1 take
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="2"
            className={`ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-3">
          <TranscriptionWaveform
            key={group.recordings[selectedTakeIndex].id}
            recording={group.recordings[selectedTakeIndex]}
            onPlayStart={handlePlayStart}
            onPlayStop={onPlayStop}
            isOriginalPlaying={isOriginalPlaying}
          />
        </div>
      )}
    </div>
  );
}
