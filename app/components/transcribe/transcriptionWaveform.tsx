"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Recording, WaveformPeak } from "@/types/transcribe";
import { decodeRecordingBlob } from "@/lib/transcribeActors";
import { drawWaveform, drawTranscriptionCursor } from "@/lib/waveformRenderer";

const WAVEFORM_HEIGHT = 80;

export default function TranscriptionWaveform({
  recording,
  onPlayStart,
  onPlayStop,
  isOriginalPlaying,
}: {
  recording: Recording;
  onPlayStart: () => void;
  onPlayStop: () => void;
  isOriginalPlaying: boolean;
}) {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [peaks, setPeaks] = useState<WaveformPeak[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [decodeFailed, setDecodeFailed] = useState(false);

  // Decode blob to peaks
  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    setDecodeFailed(false);

    decodeRecordingBlob(recording.id, recording.blob)
      .then((result) => {
        if (!cancelled) setPeaks(result.peaks);
      })
      .catch(() => {
        if (!cancelled) setDecodeFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [recording.id, recording.blob]);

  // Create audio element
  useEffect(() => {
    const audio = new Audio(recording.objectUrl);
    audio.preservesPitch = true;
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      stopCursorLoop();
      onPlayStop();
    });

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [recording.objectUrl, onPlayStop]);

  // Stop transcription playback if original starts playing
  useEffect(() => {
    if (isOriginalPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      stopCursorLoop();
      onPlayStop();
    }
  }, [isOriginalPlaying, isPlaying, onPlayStop]);

  // Draw static waveform
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !peaks) return;

    const width = container.clientWidth;
    canvas.width = width;
    canvas.height = WAVEFORM_HEIGHT;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${WAVEFORM_HEIGHT}px`;

    drawWaveform(canvas, peaks);
  }, [peaks]);

  // Cursor animation loop
  const startCursorLoop = useCallback(() => {
    stopCursorLoop();
    const tick = () => {
      const canvas = cursorCanvasRef.current;
      const audio = audioRef.current;
      if (!canvas || !audio) return;

      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = WAVEFORM_HEIGHT;
      }

      drawTranscriptionCursor(canvas, audio.currentTime, audio.duration || recording.duration);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [recording.duration]);

  const stopCursorLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCursorLoop();
  }, [stopCursorLoop]);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      stopCursorLoop();
      onPlayStop();
    } else {
      onPlayStart();
      audio.play().catch(() => {});
      setIsPlaying(true);
      startCursorLoop();
    }
  }, [isPlaying, onPlayStart, onPlayStop, startCursorLoop, stopCursorLoop]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = cursorCanvasRef.current;
      const audio = audioRef.current;
      if (!canvas || !audio) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / rect.width) * (audio.duration || recording.duration);
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || recording.duration));
    },
    [recording.duration],
  );

  if (decodeFailed) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--surface-border-medium)] transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--middleground1)" stroke="none">
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
        <p className="text-xs text-[var(--text-tertiary)]">Could not load waveform</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Play/pause button */}
      <button
        onClick={handlePlayPause}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--surface-border-medium)] transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
        aria-label={isPlaying ? "Pause transcription" : "Play transcription"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--middleground1)" stroke="none">
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

      {/* Waveform */}
      <div ref={containerRef} className="relative flex-1">
        {!peaks && (
          <div
            className="flex items-center justify-center rounded bg-[var(--background2)]"
            style={{ height: `${WAVEFORM_HEIGHT}px` }}
          >
            <div className="h-4 w-4 animate-spin rounded-full border border-[var(--surface-border-medium)] border-t-[var(--middleground1)]" />
          </div>
        )}
        {peaks && (
          <>
            <canvas
              ref={waveformCanvasRef}
              className="w-full rounded"
              style={{ height: `${WAVEFORM_HEIGHT}px` }}
            />
            <canvas
              ref={cursorCanvasRef}
              className="absolute top-0 left-0 w-full cursor-pointer rounded"
              style={{ height: `${WAVEFORM_HEIGHT}px` }}
              onClick={handleCanvasClick}
            />
          </>
        )}
      </div>
    </div>
  );
}
