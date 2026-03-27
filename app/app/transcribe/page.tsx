"use client";

import { useContext, useEffect, useCallback, useRef } from "react";
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

export default function TranscribePage() {
  const service = useContext(TranscribeMachineContext);
  const engineRef = useRef<TranscribePlaybackEngine | null>(null);

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
  const audioBuffer = useSelector(
    service!,
    (state) => state.context.audioBuffer,
  );
  const playbackRate = useSelector(
    service!,
    (state) => state.context.playbackRate,
  );
  const loopRegion = useSelector(
    service!,
    (state) => state.context.loopRegion,
  );
  const isLooping = useSelector(service!, (state) => state.context.isLooping);
  const currentTime = useSelector(
    service!,
    (state) => state.context.currentTime,
  );
  const fileName = useSelector(service!, (state) => state.context.fileName);
  const errorMessage = useSelector(
    service!,
    (state) => state.context.errorMessage,
  );

  // Initialize engine when audio buffer is ready
  useEffect(() => {
    if (audioBuffer && !engineRef.current) {
      const engine = new TranscribePlaybackEngine(audioBuffer);
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
  }, [audioBuffer, service]);

  // Sync playback state with engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (isPlaying) {
      engine.play(currentTime);
    } else {
      engine.pause();
    }
  }, [isPlaying]);

  // Sync playback rate
  useEffect(() => {
    engineRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Sync loop region
  useEffect(() => {
    engineRef.current?.setLoopRegion(loopRegion);
    engineRef.current?.setLooping(isLooping);
  }, [loopRegion, isLooping]);

  // Handle seek from state machine
  const lastSeekRef = useRef<number | null>(null);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Only seek engine when user explicitly seeks (not from time updates)
    if (lastSeekRef.current !== currentTime && !isPlaying) {
      engine.seek(currentTime);
    }
    lastSeekRef.current = currentTime;
  }, [currentTime, isPlaying]);

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
    },
    [service, isPlaying, isReady, currentTime],
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
    <div className="bg-background1 flex min-h-screen flex-col items-center px-4 py-8">
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
        <div className="w-8" />
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

          <WaveformDisplay />
          <PlaybackControls />
          <MarkerList />
          <RecordingControls />
          <RecordingsList />

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 flex gap-6 text-xs text-[var(--middleground1)]/30">
            <span>Space: Play/Pause</span>
            <span>M: Drop Marker</span>
            <span>Esc: Clear Loop</span>
          </div>
        </div>
      )}
    </div>
  );
}
