"use client";

import { useContext, useCallback } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { TranscribeEvent } from "@/machines/transcribeProcess";

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export default function MarkerList() {
  const service = useContext(TranscribeMachineContext);
  const markers = useSelector(service!, (state) => state.context.markers);

  const handleDelete = useCallback(
    (id: string) => {
      if (!service) return;
      service.send({ type: TranscribeEvent.DELETE_MARKER, id });
    },
    [service],
  );

  const handleSeek = useCallback(
    (time: number) => {
      if (!service) return;
      service.send({ type: TranscribeEvent.SEEK, time });
    },
    [service],
  );

  if (markers.length === 0) {
    return (
      <div className="w-full max-w-3xl">
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          Press M to drop markers during playback
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <h3 className="text-xs font-bold text-[var(--foreground2)]">Markers</h3>
      <div className="flex flex-wrap gap-2">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="flex items-center gap-2 rounded border border-[var(--surface-border-medium)] px-3 py-1.5"
          >
            <button
              onClick={() => handleSeek(marker.time)}
              className="text-xs text-[var(--middleground1)] transition-colors hover:cursor-pointer hover:text-[var(--foreground2)]"
            >
              {marker.label}
            </button>
            <span className="text-xs text-[var(--text-secondary)]">
              {formatTimestamp(marker.time)}
            </span>
            <button
              onClick={() => handleDelete(marker.id)}
              className="ml-1 text-xs text-[var(--text-tertiary)] transition-colors hover:cursor-pointer hover:text-[var(--foreground2)]"
              aria-label={`Delete marker ${marker.label}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
