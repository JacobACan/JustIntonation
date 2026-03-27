"use client";

import { useContext, useEffect, useCallback, useRef, useState } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import {
  TranscribeEvent,
  TranscribeState,
} from "@/machines/transcribeProcess";
import { TranscribePlaybackEngine } from "@/lib/transcribeAudio";
import AudioSourceInput from "@/components/transcribe/audioSourceInput";
import WaveformDisplay from "@/components/transcribe/waveformDisplay";
import PlaybackControls from "@/components/transcribe/playbackControls";
import MarkerList from "@/components/transcribe/markerList";
import RecordingControls from "@/components/transcribe/recordingControls";
import RecordingsList from "@/components/transcribe/recordingsList";
import KeybindsPanel from "@/components/transcribe/keybindsPanel";

const NUDGE_FRACTION = 0.1; // nudge 10% of visible window

export default function TranscribePage() {
  const service = useContext(TranscribeMachineContext);
  const engineRef = useRef<TranscribePlaybackEngine | null>(null);

  const [showKeybinds, setShowKeybinds] = useState(false);
  const [zoom, setZoom] = useState(1);

  const isIdle = useSelector(service!, (state) =>
    state.matches(TranscribeState.IDLE),
  );
  const isLoading = useSelector(service!, (state) =>
    state.matches(TranscribeState.LOADING),
  );
  const isError = useSelector(service!, (state) =>
    state.matches(TranscribeState.ERROR),
  );
  const isReady = useSelector(service!, (state) =>
    state.matches(TranscribeState.READY),
  );
  const isPlaying = useSelector(service!, (state) =>
    state.matches({
      [TranscribeState.READY]: { playback: TranscribeState.PLAYING },
    }),
  );
  const fileUrl = useSelector(service!, (state) => state.context.fileUrl);
  const playbackRate = useSelector(
    service!,
    (state) => state.context.playbackRate,
  );
  const loopRegion = useSelector(
    service!,
    (state) => state.context.loopRegion,
  );
  const isLooping = useSelector(service!, (state) => state.context.isLooping);
  const duration = useSelector(service!, (state) => state.context.duration);
  const currentTime = useSelector(
    service!,
    (state) => state.context.currentTime,
  );
  const fileName = useSelector(service!, (state) => state.context.fileName);
  const errorMessage = useSelector(
    service!,
    (state) => state.context.errorMessage,
  );

  // Initialize engine when file URL is ready
  useEffect(() => {
    if (fileUrl && !engineRef.current) {
      const engine = new TranscribePlaybackEngine(fileUrl);
      engine.setOnTimeUpdate((time) => {
        service?.send({ type: TranscribeEvent.UPDATE_TIME, time });
      });
      engine.setOnPlaybackEnded(() => {
        service?.send({ type: TranscribeEvent.PLAYBACK_ENDED });
      });
      engineRef.current = engine;
    }

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [fileUrl, service]);

  // Effect 1: Play or pause engine when isPlaying changes.
  // This is the ONLY effect that calls engine.play() or engine.pause().
  // Reads all playback intent from closure (always fresh from this render).
  // No cascading events — never sends events back to the machine.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Sync loop state to engine BEFORE playing, so play() sees current values.
    engine.setLoopRegion(loopRegion);
    engine.setLooping(isLooping);

    if (isPlaying) {
      engine.play(currentTime);
    } else {
      engine.pause();
    }
  }, [isPlaying]);

  // Effect 2: Seek engine when currentTime changes.
  // When paused: any SEEK event should move the engine.
  // When playing: only move engine if time jumped (user SEEK, not UPDATE_TIME).
  //
  // CRITICAL: This must NOT run on the same render that isPlaying changes,
  // because Effect 1 may have repositioned the audio (e.g., to loop start)
  // and this effect would overwrite it with the stale machine currentTime.
  // We use a ref to track isPlaying transitions and skip one cycle.
  const prevIsPlayingRef = useRef(isPlaying);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // If isPlaying just changed, Effect 1 owns the audio position — skip.
    if (prevIsPlayingRef.current !== isPlaying) {
      prevIsPlayingRef.current = isPlaying;
      return;
    }

    if (!isPlaying) {
      engine.seek(currentTime);
    } else {
      // During playback, UPDATE_TIME events track the engine (~60fps).
      // A user SEEK will jump discontinuously. Detect that.
      const delta = Math.abs(currentTime - engine.getCurrentTime());
      if (delta > 0.25) {
        engine.seek(currentTime);
      }
    }
  }, [currentTime, isPlaying]);

  // Effect 3: Sync playback rate
  useEffect(() => {
    engineRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Effect 4: Sync loop region to engine
  useEffect(() => {
    engineRef.current?.setLoopRegion(loopRegion);
    engineRef.current?.setLooping(isLooping);
  }, [loopRegion, isLooping]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!service) return;
      // Don't capture when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) {
          service.send({ type: TranscribeEvent.PAUSE });
        } else {
          service.send({ type: TranscribeEvent.PLAY });
        }
      }

      if (e.code === "KeyM" && isReady) {
        e.preventDefault();
        const time = engineRef.current?.getCurrentTime() ?? currentTime;
        service.send({ type: TranscribeEvent.DROP_MARKER, time });
      }

      if (e.code === "Escape") {
        service.send({ type: TranscribeEvent.CLEAR_LOOP });
      }

      // Ctrl + Left/Right arrow: nudge playhead by fraction of visible window
      if ((e.ctrlKey || e.metaKey) && e.code === "ArrowLeft" && isReady) {
        e.preventDefault();
        const visibleDuration = duration / zoom;
        const nudge = visibleDuration * NUDGE_FRACTION;
        const time = engineRef.current?.getCurrentTime() ?? currentTime;
        const newTime = Math.max(0, time - nudge);
        engineRef.current?.seek(newTime);
        service.send({ type: TranscribeEvent.SEEK, time: newTime });
      }

      if ((e.ctrlKey || e.metaKey) && e.code === "ArrowRight" && isReady) {
        e.preventDefault();
        const visibleDuration = duration / zoom;
        const nudge = visibleDuration * NUDGE_FRACTION;
        const time = engineRef.current?.getCurrentTime() ?? currentTime;
        const dur = engineRef.current?.duration ?? duration;
        const newTime = Math.min(dur, time + nudge);
        engineRef.current?.seek(newTime);
        service.send({ type: TranscribeEvent.SEEK, time: newTime });
      }
    },
    [service, isPlaying, isReady, currentTime, duration, zoom],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleReset = useCallback(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
    service?.send({ type: TranscribeEvent.RESET });
  }, [service]);

  return (
    <div className="bg-background1 flex min-h-screen flex-col items-center px-4 pt-8 pb-24">
      {/* Keybinds side panel */}
      <KeybindsPanel
        open={showKeybinds}
        onClose={() => setShowKeybinds(false)}
      />

      {/* Header */}
      <div className="mb-8 flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={() => (window.location.href = "/")}
          className="text-xs text-[var(--middleground1)]/60 transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
        >
          Back
        </button>
        <h1 className="text-lg font-bold text-[var(--foreground2)]">
          Transcribe
        </h1>
        <button
          onClick={() => setShowKeybinds((prev) => !prev)}
          className="text-xs text-[var(--middleground1)]/60 transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
          aria-label="Toggle keybinds panel"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01" />
            <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
            <path d="M8 16h8" />
          </svg>
        </button>
      </div>

      {/* Idle — file upload */}
      {isIdle && <AudioSourceInput />}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--middleground1)]/20 border-t-[var(--middleground1)]" />
          <p className="text-xs text-[var(--middleground1)]">
            Decoding {fileName}...
          </p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-400">{errorMessage}</p>
          <button
            onClick={handleReset}
            className="rounded border border-[var(--middleground1)]/40 px-4 py-2 text-xs text-[var(--middleground1)] transition-transform hover:scale-105 hover:cursor-pointer active:scale-95"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Ready — main workspace */}
      {isReady && (
        <div className="flex w-full flex-col items-center gap-6">
          {/* File name + reset */}
          <div className="flex w-full max-w-3xl items-center justify-between">
            <p className="text-xs text-[var(--middleground1)]/60">
              {fileName}
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-[var(--middleground1)]/40 transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
            >
              Load different file
            </button>
          </div>

          <WaveformDisplay zoom={zoom} onZoomChange={setZoom} />
          <PlaybackControls />
          <MarkerList />
          <RecordingControls />
          <RecordingsList />
        </div>
      )}
    </div>
  );
}
