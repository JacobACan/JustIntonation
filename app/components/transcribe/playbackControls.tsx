"use client";

import { useCallback, useContext, useRef, useState } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { TranscribeEvent } from "@/machines/transcribeProcess";
import { SPEED_PRESETS } from "@/constants/transcribeSettings";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaybackControls({
  isPlaying,
  onTogglePlayback,
}: {
  isPlaying: boolean;
  onTogglePlayback: () => void;
}) {
  const service = useContext(TranscribeMachineContext);
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTime = useSelector(
    service!,
    (state) => state.context.currentTime,
  );
  const duration = useSelector(service!, (state) => state.context.duration);
  const playbackRate = useSelector(
    service!,
    (state) => state.context.playbackRate,
  );

  const setSpeed = useCallback(
    (rate: number) => {
      if (!service) return;
      service.send({ type: TranscribeEvent.SET_SPEED, rate });
    },
    [service],
  );

  const handleEnter = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    closeTimeout.current = setTimeout(() => setOpen(false), 200);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 z-20 w-full border-t border-[var(--middleground1)]/10 bg-[var(--background)] px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="flex items-center gap-6">
          {/* Time display */}
          {/* Play/Pause */}
          <button
            onClick={onTogglePlayback}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--middleground1)] transition-colors hover:cursor-pointer hover:text-[var(--foreground2)]"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="1" y="1" width="4" height="12" rx="1" />
                <rect x="9" y="1" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 12 14" fill="currentColor">
                <polygon points="0,0 12,7 0,14" />
              </svg>
            )}
          </button>

          <span className="w-16 text-xs text-[var(--middleground1)]">
            {formatTime(currentTime)}
          </span>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="h-1 w-full rounded-full bg-[var(--middleground1)]/10">
              <div
                className="h-1 rounded-full bg-[var(--middleground1)]/40 transition-[width] duration-100"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <span className="w-16 text-right text-xs text-[var(--middleground1)]/60">
            {formatTime(duration)}
          </span>

          {/* Speed dropdown (drops up) */}
          <div
            className="relative flex items-center"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded border border-[var(--middleground1)]/20 px-2.5 py-1 text-xs text-[var(--middleground1)] transition-colors hover:border-[var(--middleground1)]/40 hover:cursor-pointer"
            >
              {playbackRate}x
            </button>
            {open && (
              <div className="absolute bottom-full right-0 mb-1 rounded border border-[var(--middleground1)]/20 bg-[var(--background)] py-1 shadow-lg">
                {[...SPEED_PRESETS].reverse().map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeed(rate);
                      setOpen(false);
                    }}
                    className={`flex w-full px-4 py-1 text-xs transition-colors hover:bg-[var(--middleground1)]/10 ${
                      rate === playbackRate
                        ? "text-[var(--foreground2)]"
                        : "text-[var(--middleground1)]/70"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
