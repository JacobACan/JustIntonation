"use client";

import { useContext } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRegion(
  region: { start: number; end: number } | null,
): string {
  if (!region) return "Full track";
  return `${formatDuration(region.start)} - ${formatDuration(region.end)}`;
}

export default function RecordingsList() {
  const service = useContext(TranscribeMachineContext);
  const recordings = useSelector(
    service!,
    (state) => state.context.recordings,
  );

  if (recordings.length === 0) return null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <h3 className="text-xs font-bold text-[var(--foreground2)]">
        Recordings
      </h3>
      <div className="flex flex-col gap-2">
        {recordings.map((recording, index) => (
          <div
            key={recording.id}
            className="flex items-center gap-4 rounded border border-[var(--middleground1)]/20 px-4 py-3"
          >
            <span className="text-xs text-[var(--middleground1)]">
              Take {index + 1}
            </span>
            <span className="text-xs text-[var(--middleground1)]/60">
              {formatDuration(recording.duration)}
            </span>
            <span className="text-xs text-[var(--middleground1)]/40">
              {formatRegion(recording.region)}
            </span>
            <audio
              src={recording.objectUrl}
              controls
              className="ml-auto h-8 flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
