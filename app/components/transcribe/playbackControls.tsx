"use client";

import { useCallback, useContext } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import {
  TranscribeEvent,
  TranscribeState,
} from "@/machines/transcribeProcess";
import { SPEED_PRESETS } from "@/constants/transcribeSettings";
import { Slider } from "@/components/ui/slider";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaybackControls() {
  const service = useContext(TranscribeMachineContext);

  const currentTime = useSelector(
    service!,
    (state) => state.context.currentTime,
  );
  const duration = useSelector(service!, (state) => state.context.duration);
  const playbackRate = useSelector(
    service!,
    (state) => state.context.playbackRate,
  );
  const isLooping = useSelector(service!, (state) => state.context.isLooping);
  const loopRegion = useSelector(
    service!,
    (state) => state.context.loopRegion,
  );
  const isPlaying = useSelector(service!, (state) =>
    state.matches({ [TranscribeState.READY]: { playback: TranscribeState.PLAYING } }),
  );
  const handlePlayPause = useCallback(() => {
    if (!service) return;
    if (isPlaying) {
      service.send({ type: TranscribeEvent.PAUSE });
    } else {
      service.send({ type: TranscribeEvent.PLAY });
    }
  }, [service, isPlaying]);

  const handleStop = useCallback(() => {
    if (!service) return;
    service.send({ type: TranscribeEvent.STOP });
  }, [service]);

  const handleSpeedChange = useCallback(
    (value: number[]) => {
      if (!service) return;
      const rate = SPEED_PRESETS[value[0]];
      service.send({ type: TranscribeEvent.SET_SPEED, rate });
    },
    [service],
  );

  const currentSpeedIndex = SPEED_PRESETS.indexOf(
    playbackRate as (typeof SPEED_PRESETS)[number],
  );
  const speedIndex = currentSpeedIndex >= 0 ? currentSpeedIndex : 3; // default to 1.0x

  const handleToggleLoop = useCallback(() => {
    if (!service) return;
    if (isLooping) {
      service.send({ type: TranscribeEvent.CLEAR_LOOP });
    } else {
      service.send({ type: TranscribeEvent.TOGGLE_LOOP });
    }
  }, [service, isLooping]);

  return (
    <div className="fixed bottom-0 left-0 z-20 w-full border-t border-[var(--middleground1)]/10 bg-[var(--background)] px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {/* Time + Transport + Speed in a compact row */}
        <div className="flex items-center gap-6">
          {/* Time display */}
          <span className="w-16 text-xs text-[var(--middleground1)]">
            {formatTime(currentTime)}
          </span>

          {/* Transport controls */}
          <div className="flex items-center gap-4">
            {/* Stop */}
            <button
              onClick={handleStop}
              className="flex items-center justify-center transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
              aria-label="Stop"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="var(--middleground1)"
                stroke="none"
              >
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="flex items-center justify-center transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="var(--middleground1)"
                stroke="none"
              >
                {isPlaying ? (
                  <>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </>
                ) : (
                  <polygon points="7,4 20,12 7,20" />
                )}
              </svg>
            </button>

            {/* Loop toggle */}
            <button
              onClick={handleToggleLoop}
              className={`flex items-center justify-center transition-transform hover:scale-110 hover:cursor-pointer active:scale-95 ${
                isLooping && loopRegion ? "opacity-100" : "opacity-40"
              }`}
              aria-label={isLooping ? "Disable loop" : "Enable loop"}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--middleground1)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>

          {/* Speed control */}
          <div className="flex flex-1 items-center gap-3">
            <span className="text-xs text-[var(--middleground1)]/60">
              Speed
            </span>
            <Slider
              value={[speedIndex]}
              min={0}
              max={SPEED_PRESETS.length - 1}
              step={1}
              onValueChange={handleSpeedChange}
              className="flex-1"
            />
            <span className="w-10 text-xs text-[var(--middleground1)]">
              {playbackRate}x
            </span>
          </div>

          {/* Duration */}
          <span className="w-16 text-right text-xs text-[var(--middleground1)]/60">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
