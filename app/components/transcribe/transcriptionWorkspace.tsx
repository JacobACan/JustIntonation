"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { TranscribeEvent } from "@/machines/transcribeProcess";
import { WaveformPeak } from "@/types/transcribe";
import {
  AudioRecorder,
  padRecordingToLength,
  normalizeToReference,
} from "@/lib/mediaRecorder";
import { decodeRecordingBlob } from "@/lib/transcribeActors";
import { drawWaveform, drawTranscriptionCursor } from "@/lib/waveformRenderer";
import { audioContext as globalAudioContext } from "@/lib/webAudio";
import { getSectionLabel } from "@/lib/transcriptionGrouping";

const WAVEFORM_HEIGHT = 120;

interface TranscriptionWorkspaceProps {
  onSeekFromTranscription?: (regionTime: number) => void;
  referenceRegionTime?: number;
  regionDuration?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onTransHoldStart?: () => void;
  onTransHoldEnd?: () => void;
  onTogglePlayback?: () => void;
  isActive?: boolean;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  /** Ref that the parent can use to trigger stop recording externally */
  stopRecordingRef?: React.MutableRefObject<(() => void) | null>;
  /** Reference track audio buffer for normalization */
  referenceBuffer?: AudioBuffer | null;
}

export default function TranscriptionWorkspace({
  onSeekFromTranscription,
  referenceRegionTime,
  regionDuration: regionDurationProp,
  onRecordingStateChange,
  onTransHoldStart,
  onTransHoldEnd,
  onTogglePlayback,
  isActive,
  onRecordingStart,
  onRecordingStop,
  stopRecordingRef,
  referenceBuffer,
}: TranscriptionWorkspaceProps) {
  const service = useContext(TranscribeMachineContext);

  const recordings = useSelector(service!, (state) => state.context.recordings);
  const markers = useSelector(service!, (state) => state.context.markers);
  const audioDuration = useSelector(
    service!,
    (state) => state.context.duration,
  );
  const loopRegion = useSelector(service!, (state) => state.context.loopRegion);
  const transpose = useSelector(service!, (state) => state.context.transpose);
  const syncOffsetMs = useSelector(
    service!,
    (state) => state.context.syncOffsetMs,
  );

  // Recording state
  const recorderRef = useRef<AudioRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Save feedback
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // Waveform
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<WaveformPeak[] | null>(null);
  const [decodedDuration, setDecodedDuration] = useState(0);

  // Live recording waveform
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const liveAnimFrameRef = useRef<number | null>(null);
  const livePeaksRef = useRef<{ min: number; max: number }[]>([]);
  const [hasLivePeaks, setHasLivePeaks] = useState(false);

  // Find the recording for the current loop region
  const currentRecording = useMemo(() => {
    if (!loopRegion) return null;
    return (
      recordings.find(
        (r) =>
          r.region &&
          Math.abs(r.region.start - loopRegion.start) < 0.5 &&
          Math.abs(r.region.end - loopRegion.end) < 0.5,
      ) ?? null
    );
  }, [recordings, loopRegion]);

  // Reset state when section changes
  useEffect(() => {
    setHasLivePeaks(false);
    livePeaksRef.current = [];
    setPeaks(null);
  }, [loopRegion?.start, loopRegion?.end]);

  const regionDuration =
    regionDurationProp ??
    (loopRegion ? loopRegion.end - loopRegion.start : audioDuration);

  // Decode current recording for waveform display
  useEffect(() => {
    if (!currentRecording) {
      setPeaks(null);
      setDecodedDuration(0);
      return;
    }
    let cancelled = false;
    decodeRecordingBlob(currentRecording.id, currentRecording.blob)
      .then((result) => {
        if (!cancelled) {
          setPeaks(result.peaks);
          setDecodedDuration(result.duration);
          setHasLivePeaks(false);
          livePeaksRef.current = [];
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPeaks(null);
          setDecodedDuration(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentRecording?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw static waveform when peaks change
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !peaks) return;

    const width = container.clientWidth;
    canvas.width = width;
    canvas.height = WAVEFORM_HEIGHT;
    drawWaveform(canvas, peaks);
  }, [peaks]);

  // === RECORDING ===

  const startRecording = useCallback(async () => {
    if (!service) return;

    const recorder = new AudioRecorder();
    const granted = await recorder.requestPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setHasLivePeaks(true);
    livePeaksRef.current = [];
    onRecordingStateChange?.(true);
    onRecordingStart?.();
  }, [service, onRecordingStateChange, onRecordingStart]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    const recording = await recorderRef.current.stop(loopRegion);
    setIsRecording(false);
    onRecordingStateChange?.(false);
    onRecordingStop?.();

    // Pad recording to match region duration (silence fills the remainder)
    const targetDuration = loopRegion
      ? loopRegion.end - loopRegion.start
      : recording.duration;
    const paddedBlob = await padRecordingToLength(
      recording.blob,
      targetDuration,
    );
    // Normalize levels to match the reference track
    const normalizedBlob =
      referenceBuffer && loopRegion
        ? await normalizeToReference(paddedBlob, referenceBuffer, loopRegion)
        : paddedBlob;
    const finalUrl =
      normalizedBlob === recording.blob
        ? recording.objectUrl
        : URL.createObjectURL(normalizedBlob);

    // Auto-save (replaces existing recording for this section)
    setSaveStatus("saving");
    service?.send({
      type: TranscribeEvent.SAVE_RECORDING,
      recording: {
        id: crypto.randomUUID(),
        blob: normalizedBlob,
        objectUrl: finalUrl,
        createdAt: Date.now(),
        region: loopRegion,
        duration: targetDuration,
        recordedTranspose: transpose,
      },
    });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);

    recorderRef.current?.dispose();
    recorderRef.current = null;
  }, [loopRegion, service, onRecordingStateChange, onRecordingStop]);

  // Expose stopRecording to parent
  useEffect(() => {
    if (stopRecordingRef) stopRecordingRef.current = stopRecording;
    return () => {
      if (stopRecordingRef) stopRecordingRef.current = null;
    };
  }, [stopRecording, stopRecordingRef]);

  // Redraw the completed live waveform when not actively recording but still showing live peaks
  useEffect(() => {
    if (isRecording || !hasLivePeaks) return;
    const canvas = liveCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    canvas.width = width;
    canvas.height = WAVEFORM_HEIGHT;

    const livePeaks = livePeaksRef.current;
    if (livePeaks.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerY = WAVEFORM_HEIGHT / 2;
    const barWidth = width / livePeaks.length;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--waveform-color").trim() || "#deb887";

    for (let i = 0; i < livePeaks.length; i++) {
      const peak = livePeaks[i];
      if (!peak) continue;
      const x = i * barWidth;
      const minY = centerY + peak.min * centerY;
      const maxY = centerY + peak.max * centerY;
      const h = Math.max(maxY - minY, 1);
      ctx.fillRect(x, minY, Math.max(barWidth - 0.5, 1), h);
    }
  }, [isRecording, hasLivePeaks]);

  // Live waveform during recording
  useEffect(() => {
    if (!isRecording) {
      if (liveAnimFrameRef.current) {
        cancelAnimationFrame(liveAnimFrameRef.current);
        liveAnimFrameRef.current = null;
      }
      return;
    }

    const stream = recorderRef.current?.stream;
    if (!stream) return;

    if (globalAudioContext.state === "suspended") {
      globalAudioContext.resume();
    }
    const source = globalAudioContext.createMediaStreamSource(stream);
    const analyser = globalAudioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    const timeDomainData = new Float32Array(analyser.fftSize);
    const startTime = Date.now();
    const totalBars = containerRef.current?.clientWidth ?? 600;
    livePeaksRef.current = [];
    let lastBarIndex = -1;

    const draw = () => {
      const canvas = liveCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const width = container.clientWidth;
      canvas.width = width;
      canvas.height = WAVEFORM_HEIGHT;

      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) return;

      const elapsed = (Date.now() - startTime) / 1000;
      const progress = regionDuration > 0 ? elapsed / regionDuration : 0;
      const currentBarIndex = Math.min(
        Math.floor(progress * totalBars),
        totalBars - 1,
      );

      analyser.getFloatTimeDomainData(timeDomainData);
      let frameMin = 1;
      let frameMax = -1;
      for (let i = 0; i < timeDomainData.length; i++) {
        const s = timeDomainData[i];
        if (s < frameMin) frameMin = s;
        if (s > frameMax) frameMax = s;
      }

      for (let b = lastBarIndex + 1; b <= currentBarIndex; b++) {
        livePeaksRef.current[b] = { min: frameMin, max: frameMax };
      }
      if (livePeaksRef.current[currentBarIndex]) {
        const existing = livePeaksRef.current[currentBarIndex];
        livePeaksRef.current[currentBarIndex] = {
          min: Math.min(existing.min, frameMin),
          max: Math.max(existing.max, frameMax),
        };
      }
      lastBarIndex = currentBarIndex;

      canvasCtx.clearRect(0, 0, width, WAVEFORM_HEIGHT);
      const centerY = WAVEFORM_HEIGHT / 2;
      const barWidth = width / totalBars;
      canvasCtx.fillStyle = "#deb887";

      for (let i = 0; i < livePeaksRef.current.length; i++) {
        const peak = livePeaksRef.current[i];
        if (!peak) continue;
        const x = i * barWidth;
        const minY = centerY + peak.min * centerY;
        const maxY = centerY + peak.max * centerY;
        const h = Math.max(maxY - minY, 1);
        canvasCtx.fillRect(x, minY, Math.max(barWidth - 0.5, 1), h);
      }

      // Cursor at current position
      const cursorX = Math.min(progress, 1) * width;
      canvasCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--cursor-color").trim() || "#fff5e1";
      canvasCtx.lineWidth = 2;
      canvasCtx.beginPath();
      canvasCtx.moveTo(cursorX, 0);
      canvasCtx.lineTo(cursorX, WAVEFORM_HEIGHT);
      canvasCtx.stroke();

      // Auto-stop at 100%
      if (progress >= 1) {
        stopRecording();
        return;
      }

      liveAnimFrameRef.current = requestAnimationFrame(draw);
    };

    liveAnimFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (liveAnimFrameRef.current) {
        cancelAnimationFrame(liveAnimFrameRef.current);
      }
      source.disconnect();
    };
  }, [isRecording, regionDuration, stopRecording]);

  // Draw transcription cursor from reference position (engine drives position)
  useEffect(() => {
    if (!peaks || !decodedDuration) return;
    if (referenceRegionTime === undefined || regionDuration <= 0) return;

    const canvas = cursorCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = WAVEFORM_HEIGHT;
    const transcriptionTime =
      (referenceRegionTime / regionDuration) * decodedDuration;
    drawTranscriptionCursor(canvas, transcriptionTime, decodedDuration);
  }, [referenceRegionTime, peaks, decodedDuration, regionDuration]);

  // Click to seek in transcription waveform
  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (decodedDuration <= 0 || regionDuration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const transcriptionTime = (x / rect.width) * decodedDuration;

      // Convert to region time and notify parent (symmetric seek)
      if (onSeekFromTranscription) {
        const regionTime =
          (transcriptionTime / decodedDuration) * regionDuration;
        onSeekFromTranscription(regionTime);
      }
    },
    [decodedDuration, regionDuration, onSeekFromTranscription],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (liveAnimFrameRef.current)
        cancelAnimationFrame(liveAnimFrameRef.current);
      recorderRef.current?.dispose();
    };
  }, []);

  // T key to start/stop transcribing
  // Short press = toggle, hold = keydown starts / keyup stops
  const tKeyDownTimeRef = useRef<number | null>(null);
  const tKeyHeldRef = useRef(false);

  useEffect(() => {
    const HOLD_THRESHOLD = 300; // ms — shorter = tap toggle, longer = hold

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code !== "KeyT" || e.repeat || !loopRegion) return;
      e.preventDefault();

      if (isRecording) {
        // Second tap stops recording
        stopRecording();
        tKeyDownTimeRef.current = null;
      } else {
        // Start recording, track time to distinguish tap vs hold
        tKeyDownTimeRef.current = Date.now();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "KeyT" || tKeyDownTimeRef.current === null) return;

      const held = Date.now() - tKeyDownTimeRef.current;
      tKeyDownTimeRef.current = null;

      // If held long enough, stop on release
      if (held >= HOLD_THRESHOLD && isRecording) {
        stopRecording();
      }
      // If short tap, recording keeps running until next tap
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording, loopRegion, startRecording, stopRecording]);

  const sectionLabel = loopRegion
    ? "Transcription for " + getSectionLabel(loopRegion, markers, audioDuration)
    : "Transcription";

  return (
    <div className="flex w-full max-w-3xl flex-col">
      {/* Controls bar */}
      <div
        className="relative flex items-center gap-4 rounded-t-lg border border-b-0 border-[var(--surface-border)] px-4 py-2"
      >
        {/* Play/pause button for transcription (same as Space — plays both tracks) */}
        <button
          onPointerDown={onTransHoldStart}
          onPointerUp={onTransHoldEnd}
          onPointerLeave={onTransHoldEnd}
          disabled={!currentRecording || !loopRegion}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--surface-border-medium)] text-[var(--middleground1)] transition-colors hover:cursor-pointer hover:border-[var(--middleground1)] active:bg-[var(--surface-border)] disabled:opacity-30 disabled:hover:cursor-default"
          aria-label={isActive ? "Pause" : "Play"}
          title="Press down to play (2)"
        >
          {isActive ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <rect x="0" y="0" width="3.5" height="12" rx="0.5" />
              <rect x="6.5" y="0" width="3.5" height="12" rx="0.5" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <polygon points="0,0 10,6 0,12" />
            </svg>
          )}
        </button>
        <h3 className="text-xs font-bold text-[var(--foreground2)]">
          {sectionLabel}
        </h3>

        {saveStatus === "saved" && !isRecording && (
          <span className="text-xs text-green-400">Saved</span>
        )}

        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 text-xs text-red-400 transition-transform hover:scale-105 hover:cursor-pointer active:scale-95"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Stop
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={!loopRegion}
            className="text-xs text-[var(--middleground1)] transition-transform hover:scale-105 hover:cursor-pointer active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            Transcribe (T)
          </button>
        )}

        <div className="flex-1" />

        {/* Sync offset handle — centered on the bottom edge of this bar */}
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 translate-y-1/2"
        >
          {/* Tick marks every 100ms across ±2000ms range */}
          {Array.from({ length: 41 }, (_, i) => {
            const ms = (i - 20) * 100;
            const pct = ((ms + 2000) / 4000) * 100;
            const isCenter = ms === 0;
            const isMajor = ms % 500 === 0;
            return (
              <div
                key={ms}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pct}%` }}
              >
                <div
                  className={`w-px ${isCenter ? "h-3 bg-[var(--surface-border-medium)]" : isMajor ? "h-2 bg-[var(--surface-border)]" : "h-1.5 bg-[var(--surface-border)]"}`}
                />
              </div>
            );
          })}
          {/* Draggable handle */}
          <div
            className="bg-background1 pointer-events-auto absolute top-0 -translate-y-1/2 cursor-grab rounded-full border border-[var(--surface-border-medium)] transition-colors hover:border-[var(--surface-border-medium)] active:cursor-grabbing"
            style={{
              left: `${((syncOffsetMs + 2000) / 4000) * 100}%`,
              transform: "translateX(-50%)",
              width: "28px",
              height: "10px",
            }}
            title="Drag to adjust sync offset — double-click to reset"
            onDoubleClick={() => {
              service?.send({
                type: TranscribeEvent.SET_SYNC_OFFSET,
                offsetMs: 0,
              });
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const track = target.parentElement!;
              target.setPointerCapture(e.pointerId);

              const SNAP_THRESHOLD = 50;

              const onMove = (ev: PointerEvent) => {
                const rect = track.getBoundingClientRect();
                const x = Math.max(
                  0,
                  Math.min(ev.clientX - rect.left, rect.width),
                );
                const ratio = x / rect.width;
                let ms = Math.round(ratio * 4000 - 2000);
                ms = Math.max(-2000, Math.min(2000, ms));
                // Snap to 0 when close to center
                if (Math.abs(ms) <= 50) ms = 0;
                service?.send({
                  type: TranscribeEvent.SET_SYNC_OFFSET,
                  offsetMs: ms,
                });
              };
              const onUp = () => {
                target.removeEventListener("pointermove", onMove);
                target.removeEventListener("pointerup", onUp);
              };
              target.addEventListener("pointermove", onMove);
              target.addEventListener("pointerup", onUp);
            }}
          />
        </div>
      </div>

      {/* Waveform panel */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-b-lg border border-[var(--surface-border)]"
        style={{ height: `${WAVEFORM_HEIGHT}px` }}
      >
        {!loopRegion && !isRecording && (
          <div
            className="flex items-center justify-center text-xs text-[var(--text-tertiary)]"
            style={{ height: `${WAVEFORM_HEIGHT}px` }}
          >
            Select a region to start transcribing
          </div>
        )}

        {(isRecording || hasLivePeaks) && (
          <canvas
            ref={liveCanvasRef}
            className="absolute top-0 left-0 w-full"
            style={{ height: `${WAVEFORM_HEIGHT}px` }}
          />
        )}

        {!isRecording && !hasLivePeaks && loopRegion && peaks && (() => {
          // Compute pixel shift for sync offset visualization
          const containerWidth = containerRef.current?.clientWidth ?? 0;
          const shiftPx =
            decodedDuration > 0
              ? (syncOffsetMs / 1000 / decodedDuration) * containerWidth
              : 0;
          return (
            <>
              <canvas
                ref={waveformCanvasRef}
                className="absolute top-0 left-0 w-full transition-transform duration-150"
                style={{
                  height: `${WAVEFORM_HEIGHT}px`,
                  transform: `translateX(${shiftPx}px)`,
                }}
              />
              <canvas
                ref={cursorCanvasRef}
                className="absolute top-0 left-0 w-full cursor-pointer"
                style={{ height: `${WAVEFORM_HEIGHT}px` }}
                onClick={handleWaveformClick}
              />
            </>
          );
        })()}

        {!isRecording && !hasLivePeaks && loopRegion && !peaks && (
          <div
            className="flex items-center justify-center text-xs text-[var(--text-tertiary)]"
            style={{ height: `${WAVEFORM_HEIGHT}px` }}
          >
            Press T to transcribe this section
          </div>
        )}

        {isRecording && (
          <div className="absolute top-2 left-3 flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs text-red-400">Recording</span>
          </div>
        )}
      </div>

      {permissionDenied && (
        <p className="mt-2 text-center text-xs text-red-400">
          Microphone access denied
        </p>
      )}
    </div>
  );
}
