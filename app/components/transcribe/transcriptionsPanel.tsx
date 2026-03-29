"use client";

import { useContext, useState, useMemo, useCallback } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { groupRecordingsBySections } from "@/lib/transcriptionGrouping";
import TranscriptionSection from "./transcriptionSection";

export default function TranscriptionsPanel({
  onTranscriptionPlay,
  onTranscriptionStop,
  isOriginalPlaying,
}: {
  onTranscriptionPlay: (label: string) => void;
  onTranscriptionStop: () => void;
  isOriginalPlaying: boolean;
}) {
  const service = useContext(TranscribeMachineContext);
  const recordings = useSelector(
    service!,
    (state) => state.context.recordings,
  );
  const markers = useSelector(service!, (state) => state.context.markers);
  const duration = useSelector(service!, (state) => state.context.duration);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const groups = useMemo(
    () => groupRecordingsBySections(recordings, markers, duration),
    [recordings, markers, duration],
  );

  const handleToggle = useCallback(
    (index: number) => {
      setExpandedIndex((prev) => (prev === index ? null : index));
    },
    [],
  );

  if (recordings.length === 0) {
    return (
      <div className="w-full max-w-3xl">
        <h3 className="mb-2 text-xs font-bold text-[var(--foreground2)]">
          Your Transcriptions
        </h3>
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          Record a transcription to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-1">
      <h3 className="mb-1 text-xs font-bold text-[var(--foreground2)]">
        Your Transcriptions
      </h3>
      {groups.map((group, index) => (
        <TranscriptionSection
          key={`${group.label}-${group.region.start}`}
          group={group}
          isExpanded={expandedIndex === index}
          onToggle={() => handleToggle(index)}
          onPlayStart={onTranscriptionPlay}
          onPlayStop={onTranscriptionStop}
          isOriginalPlaying={isOriginalPlaying}
        />
      ))}
    </div>
  );
}
