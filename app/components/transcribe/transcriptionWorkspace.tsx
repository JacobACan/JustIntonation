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
import { TranscribeEvent, TranscribeState } from "@/machines/transcribeProcess";
import { WaveformPeak } from "@/types/transcribe";
import { AudioRecorder, padRecordingToLength } from "@/lib/mediaRecorder";
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
}: TranscriptionWorkspaceProps) {
  const service = useContext(TranscribeMachineContext);

  const recordings = useSelector(service!, (state) => state.context.recordings);
  const markers = useSelector(service!, (state) => state.context.markers);
  const audioDuration = useSelector(
    service!,
    (state) => state.context.duration,
  );
  const loopRegion = useSelector(service!, (state) => state.context.loopRegion);

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
    const paddedUrl =
      paddedBlob === recording.blob
        ? recording.objectUrl
        : URL.createObjectURL(paddedBlob);

    // Auto-save (replaces existing recording for this section)
    setSaveStatus("saving");
    service?.send({
      type: TranscribeEvent.SAVE_RECORDING,
      recording: {
        id: crypto.randomUUID(),
        blob: paddedBlob,
        objectUrl: paddedUrl,
        createdAt: Date.now(),
        region: loopRegion,
        duration: targetDuration,
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
    ctx.fillStyle = "#deb887";

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
      canvasCtx.strokeStyle = "#fff5e1";
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "KeyT" && loopRegion) {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, loopRegion, startRecording, stopRecording]);

  const sectionLabel = loopRegion
    ? getSectionLabel(loopRegion, markers, audioDuration)
    : "No region selected";

  return (
    <div className="flex w-full max-w-3xl flex-col">
      {/* Controls bar */}
      <div
        className="flex items-center gap-4 rounded-t-lg border border-b-0 border-[var(--middleground1)]/10 px-4 py-2"
      >
        {/* Play/pause button for transcription (same as Space — plays both tracks) */}
        <button
          onClick={onTogglePlayback}
          disabled={!currentRecording || !loopRegion}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--middleground1)]/30 text-[var(--middleground1)] transition-colors hover:cursor-pointer hover:border-[var(--middleground1)] active:bg-[var(--middleground1)]/10 disabled:opacity-30 disabled:hover:cursor-default"
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
          Transcription for {sectionLabel}
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
      </div>

      {/* Waveform panel */}
      <div
        ref={containerRef}
        className="relative rounded-b-lg border border-[var(--middleground1)]/10"
        style={{ height: `${WAVEFORM_HEIGHT}px` }}
      >
        {!loopRegion && !isRecording && (
          <div
            className="flex items-center justify-center text-xs text-[var(--middleground1)]/30"
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

        {!isRecording && !hasLivePeaks && loopRegion && peaks && (
          <>
            <canvas
              ref={waveformCanvasRef}
              className="absolute top-0 left-0 w-full"
              style={{ height: `${WAVEFORM_HEIGHT}px` }}
            />
            <canvas
              ref={cursorCanvasRef}
              className="absolute top-0 left-0 w-full cursor-pointer"
              style={{ height: `${WAVEFORM_HEIGHT}px` }}
              onClick={handleWaveformClick}
            />
          </>
        )}

        {!isRecording && !hasLivePeaks && loopRegion && !peaks && (
          <div
            className="flex items-center justify-center text-xs text-[var(--middleground1)]/30"
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
