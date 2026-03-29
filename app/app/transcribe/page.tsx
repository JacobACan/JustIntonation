"use client";

import { useContext, useEffect, useCallback, useRef, useState } from "react";
import { useSelector } from "@xstate/react";
import {
  TranscribeMachineContext,
  TrackManagerContext,
} from "@/components/providers/transcribeProvider";
import { TranscribeEvent, TranscribeState } from "@/machines/transcribeProcess";
import type { DualTrackAudioEngine } from "@/lib/transcribeAudio";
import { decodeRecordingBlob } from "@/lib/transcribeActors";
import AudioSourceInput from "@/components/transcribe/audioSourceInput";
import WaveformDisplay from "@/components/transcribe/waveformDisplay";
import PlaybackControls from "@/components/transcribe/playbackControls";
import TranscriptionWorkspace from "@/components/transcribe/transcriptionWorkspace";
import KeybindsPanel from "@/components/transcribe/keybindsPanel";
import BackIcon from "@/components/icon/backIcon";
import { SPEED_PRESETS } from "@/constants/transcribeSettings";
import { Slider } from "@/components/ui/slider";
import { loadZoom, saveZoom } from "@/lib/transcribeStorage";

const NUDGE_FRACTION = 0.05; // nudge 5% of visible window

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  if (volume < 0.5) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export default function TranscribePage() {
  const service = useContext(TranscribeMachineContext);
  const engineRef = useRef<DualTrackAudioEngine | null>(null);
  const trackManager = useContext(TrackManagerContext);

  const [showKeybinds, setShowKeybinds] = useState(false);
  const [zoom, setZoomState] = useState(1);
  const setZoom = useCallback(
    (v: number | ((prev: number) => number)) => {
      setZoomState((prev) => {
        const next = typeof v === "function" ? v(prev) : v;
        if (trackManager.activeTrackId) {
          saveZoom(trackManager.activeTrackId, next);
        }
        return next;
      });
    },
    [trackManager.activeTrackId],
  );

  // Restore zoom when active track changes
  useEffect(() => {
    if (trackManager.activeTrackId) {
      setZoomState(loadZoom(trackManager.activeTrackId));
    } else {
      setZoomState(1);
    }
  }, [trackManager.activeTrackId]);

  // === IMPERATIVE PLAYBACK STATE ===
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const isPlayingRef = useRef(false);
  const key1HeldRef = useRef(false);
  const key2HeldRef = useRef(false);
  const snapBackPositionRef = useRef(0);
  const loopStartPositionRef = useRef(0);
  const animLoopRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const loopRegionRef = useRef<{ start: number; end: number } | null>(null);
  const syncOffsetMsRef = useRef(0);

  // Volume control hover state
  const [showVolume, setShowVolume] = useState(false);
  const volumeHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVolumeEnter = useCallback(() => {
    if (volumeHideTimeout.current) {
      clearTimeout(volumeHideTimeout.current);
      volumeHideTimeout.current = null;
    }
    setShowVolume(true);
  }, []);
  const handleVolumeLeave = useCallback(() => {
    volumeHideTimeout.current = setTimeout(() => setShowVolume(false), 300);
  }, []);

  // Reactive playing state for UI (mirrors isPlayingRef)
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  // Which tracks are currently active (audible) — refs for logic, state for UI
  const refActiveRef = useRef(false);
  const transActiveRef = useRef(false);
  const [refActive, _setRefActive] = useState(false);
  const [transActive, _setTransActive] = useState(false);
  const setRefActiveState = useCallback((v: boolean) => {
    refActiveRef.current = v;
    _setRefActive(v);
  }, []);
  const setTransActiveState = useCallback((v: boolean) => {
    transActiveRef.current = v;
    _setTransActive(v);
  }, []);

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
  const audioBuffer = useSelector(
    service!,
    (state) => state.context.audioBuffer,
  );
  const playbackRate = useSelector(
    service!,
    (state) => state.context.playbackRate,
  );
  const loopRegion = useSelector(service!, (state) => state.context.loopRegion);
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
  const recordings = useSelector(service!, (state) => state.context.recordings);
  const markers = useSelector(service!, (state) => state.context.markers);
  const transcriptionVolume = useSelector(
    service!,
    (state) => state.context.transcriptionVolume,
  );
  const syncOffsetMs = useSelector(
    service!,
    (state) => state.context.syncOffsetMs,
  );

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      service?.send({
        type: TranscribeEvent.SET_TRANSCRIPTION_VOLUME,
        volume: value[0] / 100,
      });
    },
    [service],
  );

  // Find recording for current loop region
  const currentRecordingId = useRef<string | null>(null);
  const currentRecording = loopRegion
    ? (recordings.find(
        (r) =>
          r.region &&
          Math.abs(r.region.start - loopRegion.start) < 0.5 &&
          Math.abs(r.region.end - loopRegion.end) < 0.5,
      ) ?? null)
    : null;

  // Initialize engine when audioBuffer is available
  useEffect(() => {
    if (!audioBuffer) return;
    let cancelled = false;

    import("@/lib/transcribeAudio")
      .then(({ DualTrackAudioEngine }) =>
        DualTrackAudioEngine.create(audioBuffer),
      )
      .then((engine) => {
        if (cancelled) {
          engine.dispose();
          return;
        }
        engine.setRate(playbackRate);
        engineRef.current = engine;
        setEngineReady(true);
      });

    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      currentRecordingId.current = null;
      setEngineReady(false);
    };
  }, [audioBuffer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync playback rate to engine
  useEffect(() => {
    engineRef.current?.setRate(playbackRate);
  }, [playbackRate]);

  // Load transcription audio buffer into engine when recording changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!currentRecording) {
      if (currentRecordingId.current !== null) {
        engine.unloadTranscription();
        currentRecordingId.current = null;
      }
      return;
    }

    if (currentRecording.id === currentRecordingId.current) return;

    let cancelled = false;
    decodeRecordingBlob(currentRecording.id, currentRecording.blob).then(
      (result) => {
        if (cancelled || !engineRef.current) return;
        engineRef.current.loadTranscription(result.audioBuffer);
        currentRecordingId.current = currentRecording.id;

        // If playing with trans active, start the new transcription in sync
        if (isPlayingRef.current && transActiveRef.current) {
          const lr = loopRegionRef.current;
          if (lr) {
            const refTime = engineRef.current.getCurrentRefTime();
            const regDur = lr.end - lr.start;
            const tDur = engineRef.current.getTransDuration();
            const offsetSec = syncOffsetMsRef.current / 1000;
            const tTime =
              regDur > 0
                ? ((refTime - lr.start) / regDur) * tDur - offsetSec
                : 0;
            engineRef.current.playTrans(Math.max(0, Math.min(tTime, tDur)));
          }
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [currentRecording?.id, engineReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep loopRegion ref in sync for animation loop closure
  useEffect(() => {
    loopRegionRef.current = loopRegion;
  }, [loopRegion]);

  useEffect(() => {
    syncOffsetMsRef.current = syncOffsetMs;
  }, [syncOffsetMs]);

  // Sync engine seek when machine currentTime changes while not playing
  useEffect(() => {
    if (!isPlayingRef.current) {
      const engine = engineRef.current;
      if (engine) {
        engine.seekRef(currentTime);
        // Symmetric: also sync transcription position
        if (loopRegion && engine.hasTranscription()) {
          const regDur = loopRegion.end - loopRegion.start;
          const tDur = engine.getTransDuration();
          if (regDur > 0) {
            const regionTime = currentTime - loopRegion.start;
            const offsetSec = syncOffsetMs / 1000;
            const mapped = (regionTime / regDur) * tDur - offsetSec;
            engine.seekTrans(Math.max(0, Math.min(mapped, tDur)));
          }
        }
      }
    }
  }, [currentTime, loopRegion]);

  // Compute reference position within the current region (for transcription cursor sync)
  const referenceRegionTime = loopRegion ? currentTime - loopRegion.start : 0;
  const regionDuration = loopRegion ? loopRegion.end - loopRegion.start : 0;

  // === PROPORTIONAL MAPPING HELPERS ===

  /** Convert reference time to transcription time */
  const refTimeToTransTime = useCallback(
    (refTime: number): number => {
      const engine = engineRef.current;
      if (!engine || !loopRegion || !engine.hasTranscription()) return 0;
      const regDur = loopRegion.end - loopRegion.start;
      const tDur = engine.getTransDuration();
      if (regDur <= 0) return 0;
      const regionTime = refTime - loopRegion.start;
      // Apply sync offset (positive = transcription starts later)
      const offsetSec = syncOffsetMs / 1000;
      const mapped = (regionTime / regDur) * tDur - offsetSec;
      return Math.max(0, Math.min(mapped, tDur));
    },
    [loopRegion, syncOffsetMs],
  );

  /** Convert transcription time to reference time */
  const transTimeToRefTime = useCallback(
    (transTime: number): number => {
      const engine = engineRef.current;
      if (!engine || !loopRegion) return 0;
      const regDur = loopRegion.end - loopRegion.start;
      const tDur = engine.getTransDuration();
      if (tDur <= 0) return loopRegion.start;
      return loopRegion.start + (transTime / tDur) * regDur;
    },
    [loopRegion],
  );

  // === ANIMATION LOOP ===
  const startAnimLoop = useCallback(() => {
    if (animLoopRef.current) cancelAnimationFrame(animLoopRef.current);
    const tick = () => {
      const engine = engineRef.current;
      if (!engine || !isPlayingRef.current) return;

      const time = engine.getCurrentRefTime();
      const lr = loopRegionRef.current;

      // Check loop boundary
      if (lr && time >= lr.end) {
        const loopTo = loopStartPositionRef.current;
        engine.seekRef(loopTo);
        // Re-start transcription in sync (playTrans always creates a new source,
        // even if the previous one ended naturally)
        if (engine.hasTranscription() && transActiveRef.current) {
          const regDur = lr.end - lr.start;
          const tDur = engine.getTransDuration();
          const offsetSec = syncOffsetMsRef.current / 1000;
          const tTime =
            regDur > 0 ? ((loopTo - lr.start) / regDur) * tDur - offsetSec : 0;
          engine.playTrans(Math.max(0, Math.min(tTime, tDur)));
        }
        service?.send({ type: TranscribeEvent.UPDATE_TIME, time: loopTo });
      } else {
        service?.send({ type: TranscribeEvent.UPDATE_TIME, time });
      }

      // Check end of file (no loop)
      if (!lr && time >= engine.getRefDuration()) {
        stopPlayback();
        return;
      }

      animLoopRef.current = requestAnimationFrame(tick);
    };
    animLoopRef.current = requestAnimationFrame(tick);
  }, [service]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAnimLoop = useCallback(() => {
    if (animLoopRef.current) {
      cancelAnimationFrame(animLoopRef.current);
      animLoopRef.current = null;
    }
  }, []);

  // === PLAY / STOP ===
  const startPlayback = useCallback(
    (refMuted: boolean, transMuted: boolean) => {
      const engine = engineRef.current;
      if (!engine || !service) return;

      // Save snap-back and loop-start positions
      snapBackPositionRef.current = currentTime;
      loopStartPositionRef.current = currentTime;

      // Clamp to loop region if outside
      let startTime = currentTime;
      if (loopRegion) {
        if (startTime < loopRegion.start || startTime >= loopRegion.end) {
          startTime = loopRegion.start;
          snapBackPositionRef.current = startTime;
          loopStartPositionRef.current = startTime;
        }
      }

      // Start reference
      if (!refMuted) {
        engine.playRef(startTime);
        engine.muteRef(false);
        setRefActiveState(true);
      } else {
        // Still play ref (for position tracking) but muted
        engine.playRef(startTime);
        engine.muteRef(true);
        setRefActiveState(false);
      }

      // Start transcription if available and loop region exists
      if (loopRegion && engine.hasTranscription()) {
        const tTime = refTimeToTransTime(startTime);
        engine.playTrans(tTime);
        engine.muteTrans(transMuted);
        setTransActiveState(!transMuted);
      } else {
        setTransActiveState(false);
      }

      isPlayingRef.current = true;
      setIsPlayingState(true);
      startAnimLoop();
    },
    [service, currentTime, loopRegion, refTimeToTransTime, startAnimLoop],
  );

  const stopPlayback = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.stopRef();
      engine.stopTrans();
      engine.muteRef(false);
      engine.muteTrans(false);
    }

    isPlayingRef.current = false;
    setIsPlayingState(false);
    setRefActiveState(false);
    setTransActiveState(false);
    stopAnimLoop();

    // Snap back
    const snapTo = snapBackPositionRef.current;
    engine?.seekRef(snapTo);
    service?.send({ type: TranscribeEvent.SEEK, time: snapTo });
    key1HeldRef.current = false;
    key2HeldRef.current = false;
  }, [service, stopAnimLoop]);

  // === SEEKING (symmetric — syncs both tracks) ===
  const seekBoth = useCallback(
    (
      refTime: number,
      options?: {
        updateSnapBack?: boolean;
        isSection?: boolean;
        sectionStart?: number;
      },
    ) => {
      const engine = engineRef.current;
      if (!engine || !service) return;

      // Update snap-back based on rules
      if (isPlayingRef.current) {
        if (options?.isSection) {
          snapBackPositionRef.current = options.sectionStart ?? refTime;
          loopStartPositionRef.current = options.sectionStart ?? refTime;
        } else if (options?.updateSnapBack !== false) {
          snapBackPositionRef.current = refTime;
        }
      }

      engine.seekRef(refTime);
      service.send({ type: TranscribeEvent.SEEK, time: refTime });

      // Sync transcription proportionally — use playTrans during playback
      // so a new source is created even if the previous one ended naturally
      if (loopRegion && engine.hasTranscription()) {
        const tTime = refTimeToTransTime(refTime);
        if (isPlayingRef.current && transActiveRef.current) {
          engine.playTrans(tTime);
        } else {
          engine.seekTrans(tTime);
        }
      }
    },
    [service, loopRegion, refTimeToTransTime],
  );

  /** Seek initiated from transcription waveform click */
  const handleSeekFromTranscription = useCallback(
    (regionTime: number) => {
      if (!loopRegion) return;
      const absoluteTime = loopRegion.start + regionTime;
      seekBoth(absoluteTime);
    },
    [loopRegion, seekBoth],
  );

  // === HOLD-TO-PLAY BUTTON HANDLERS (mirror hold 1/2 keys) ===

  const handleRefHoldStart = useCallback(() => {
    if (isRecordingRef.current) return;
    if (!isPlayingRef.current) {
      key1HeldRef.current = true;
      startPlayback(false, true);
    } else {
      key1HeldRef.current = true;
      engineRef.current?.muteRef(false);
      refActiveRef.current = true;
    }
  }, [startPlayback]);

  const handleRefHoldEnd = useCallback(() => {
    key1HeldRef.current = false;
    if (isPlayingRef.current) {
      if (key2HeldRef.current) {
        engineRef.current?.muteRef(true);
        setRefActiveState(false);
      } else {
        stopPlayback();
      }
    }
  }, [stopPlayback]);

  const handleTransHoldStart = useCallback(() => {
    if (isRecordingRef.current) return;
    const engine = engineRef.current;
    if (!engine) return;

    if (!isPlayingRef.current) {
      if (loopRegion && engine.hasTranscription()) {
        key2HeldRef.current = true;
        startPlayback(true, false);
      }
    } else {
      key2HeldRef.current = true;
      if (engine.hasTranscription() && loopRegion) {
        const refTime = engine.getCurrentRefTime();
        const tTime = refTimeToTransTime(refTime);
        engine.playTrans(tTime);
        engine.muteTrans(false);
        setTransActiveState(true);
      }
    }
  }, [startPlayback, loopRegion, refTimeToTransTime]);

  const handleTransHoldEnd = useCallback(() => {
    key2HeldRef.current = false;
    if (isPlayingRef.current) {
      if (key1HeldRef.current) {
        engineRef.current?.muteTrans(true);
        setTransActiveState(false);
      } else {
        stopPlayback();
      }
    }
  }, [stopPlayback]);

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!service) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Space: play both / pause (snap back)
      if (e.code === "Space") {
        e.preventDefault();
        // Space stops recording if active
        if (isRecordingRef.current) {
          stopRecordingRef.current?.();
          return;
        }
        if (isPlayingRef.current) {
          stopPlayback();
        } else {
          startPlayback(false, false);
        }
      }

      // Hold 1: reference track (disabled during recording)
      if (e.code === "Digit1" && !e.repeat && !isRecordingRef.current) {
        e.preventDefault();
        if (!isPlayingRef.current) {
          key1HeldRef.current = true;
          startPlayback(false, true); // ref unmuted, trans muted
        } else {
          // Already playing — unmute reference
          key1HeldRef.current = true;
          engineRef.current?.muteRef(false);
          setRefActiveState(true);
        }
      }

      // Hold 2: transcription track (disabled during recording)
      if (e.code === "Digit2" && !e.repeat && !isRecordingRef.current) {
        e.preventDefault();
        const engine = engineRef.current;
        if (!engine) return;

        if (!isPlayingRef.current) {
          // Only start if there's a transcription to play
          if (loopRegion && engine.hasTranscription()) {
            key2HeldRef.current = true;
            startPlayback(true, false); // ref muted, trans unmuted
          }
        } else {
          // Already playing — join transcription in sync
          key2HeldRef.current = true;
          if (engine.hasTranscription() && loopRegion) {
            const refTime = engine.getCurrentRefTime();
            const tTime = refTimeToTransTime(refTime);
            engine.playTrans(tTime);
            engine.muteTrans(false);
            setTransActiveState(true);
          }
        }
      }

      // M: drop marker
      if (e.code === "KeyM" && isReady) {
        e.preventDefault();
        const time = engineRef.current?.getCurrentRefTime() ?? currentTime;
        service.send({ type: TranscribeEvent.DROP_MARKER, time });
      }

      // Escape: clear loop (does NOT stop playback)
      if (e.code === "Escape") {
        service.send({ type: TranscribeEvent.CLEAR_LOOP });
      }

      // J: slow down one step
      if (e.code === "KeyJ" && isReady) {
        e.preventDefault();
        const idx = SPEED_PRESETS.indexOf(
          playbackRate as (typeof SPEED_PRESETS)[number],
        );
        const curIdx = idx >= 0 ? idx : SPEED_PRESETS.indexOf(1.0);
        if (curIdx > 0) {
          service.send({
            type: TranscribeEvent.SET_SPEED,
            rate: SPEED_PRESETS[curIdx - 1],
          });
        }
      }

      // L: speed up one step
      if (e.code === "KeyL" && isReady) {
        e.preventDefault();
        const idx = SPEED_PRESETS.indexOf(
          playbackRate as (typeof SPEED_PRESETS)[number],
        );
        const curIdx = idx >= 0 ? idx : SPEED_PRESETS.indexOf(1.0);
        if (curIdx < SPEED_PRESETS.length - 1) {
          service.send({
            type: TranscribeEvent.SET_SPEED,
            rate: SPEED_PRESETS[curIdx + 1],
          });
        }
      }

      // K: stop playback and reset speed to 1x
      if (e.code === "KeyK" && isReady) {
        e.preventDefault();
        if (isRecordingRef.current) {
          stopRecordingRef.current?.();
        }
        if (isPlayingRef.current) {
          stopPlayback();
        }
        service.send({ type: TranscribeEvent.SET_SPEED, rate: 1.0 });
      }

      // Shift + Left/Right arrow: move to previous/next marker section
      if (
        e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.code === "ArrowLeft" || e.code === "ArrowRight") &&
        isReady &&
        markers.length > 0
      ) {
        e.preventDefault();
        const sorted = [...markers].sort((a, b) => a.time - b.time);
        // Build section boundaries: [0, m1, m2, ..., mn, duration]
        const boundaries = [0, ...sorted.map((m) => m.time), duration];

        // Find which section the current loopRegion or playhead is in
        const refTime = loopRegion ? loopRegion.start : currentTime;
        let currentIdx = 0;
        for (let i = 0; i < boundaries.length - 1; i++) {
          if (refTime >= boundaries[i] - 0.01 && refTime < boundaries[i + 1]) {
            currentIdx = i;
            break;
          }
        }

        const nextIdx =
          e.code === "ArrowRight"
            ? Math.min(currentIdx + 1, boundaries.length - 2)
            : Math.max(currentIdx - 1, 0);

        const newRegion = {
          start: boundaries[nextIdx],
          end: boundaries[nextIdx + 1],
        };
        service.send({
          type: TranscribeEvent.SELECT_MARKER_SECTION,
          region: newRegion,
        });
        service.send({ type: TranscribeEvent.SEEK, time: newRegion.start });
        seekBoth(newRegion.start, {
          isSection: true,
          sectionStart: newRegion.start,
        });
      }

      // Ctrl/Cmd + Left/Right arrow: nudge playhead
      if ((e.ctrlKey || e.metaKey) && e.code === "ArrowLeft" && isReady) {
        e.preventDefault();
        const visibleDuration = duration / zoom;
        const nudge = visibleDuration * NUDGE_FRACTION;
        const time = engineRef.current?.getCurrentRefTime() ?? currentTime;
        const minBound = loopRegion ? loopRegion.start : 0;
        const newTime = Math.max(minBound, time - nudge);
        // Nudge does NOT update snap-back
        const engine = engineRef.current;
        if (engine) {
          engine.seekRef(newTime);
          if (loopRegion && engine.hasTranscription()) {
            engine.seekTrans(refTimeToTransTime(newTime));
          }
        }
        service.send({ type: TranscribeEvent.SEEK, time: newTime });
      }

      if ((e.ctrlKey || e.metaKey) && e.code === "ArrowRight" && isReady) {
        e.preventDefault();
        const visibleDuration = duration / zoom;
        const nudge = visibleDuration * NUDGE_FRACTION;
        const time = engineRef.current?.getCurrentRefTime() ?? currentTime;
        const maxBound = loopRegion ? loopRegion.end : duration;
        const newTime = Math.min(maxBound, time + nudge);
        const engine = engineRef.current;
        if (engine) {
          engine.seekRef(newTime);
          if (loopRegion && engine.hasTranscription()) {
            engine.seekTrans(refTimeToTransTime(newTime));
          }
        }
        service.send({ type: TranscribeEvent.SEEK, time: newTime });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Digit1") {
        key1HeldRef.current = false;
        if (isPlayingRef.current) {
          if (key2HeldRef.current) {
            // Just mute reference, transcription keeps going
            engineRef.current?.muteRef(true);
            setRefActiveState(false);
          } else {
            stopPlayback();
          }
        }
      }

      if (e.code === "Digit2") {
        key2HeldRef.current = false;
        if (isPlayingRef.current) {
          if (key1HeldRef.current) {
            // Just mute transcription, reference keeps going
            engineRef.current?.muteTrans(true);
            setTransActiveState(false);
          } else {
            stopPlayback();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    service,
    isReady,
    currentTime,
    duration,
    zoom,
    loopRegion,
    markers,
    playbackRate,
    startPlayback,
    stopPlayback,
    seekBoth,
    refTimeToTransTime,
  ]);

  const handleReset = useCallback(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
    currentRecordingId.current = null;
    service?.send({ type: TranscribeEvent.RESET });
  }, [service]);

  // Handle seek from waveform click (syncs engine + transcription)
  const handleWaveformSeek = useCallback(
    (
      time: number,
      options?: { isSection?: boolean; sectionStart?: number },
    ) => {
      seekBoth(time, {
        updateSnapBack: true,
        isSection: options?.isSection,
        sectionStart: options?.sectionStart,
      });
    },
    [seekBoth],
  );

  // Notify recording state to disable hold keys
  const handleTogglePlayback = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecordingRef.current?.();
      return;
    }
    if (isPlayingRef.current) {
      stopPlayback();
    } else {
      startPlayback(false, false);
    }
  }, [startPlayback, stopPlayback]);

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    isRecordingRef.current = recording;
  }, []);

  // Start reference at 30% volume when recording begins
  const handleRecordingStart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !service) return;

    // Always start from the beginning of the section
    const startTime = loopRegion ? loopRegion.start : currentTime;
    engine.playRef(startTime);
    engine.setRefVolume(transcriptionVolume);
    setRefActiveState(true);
    isPlayingRef.current = true;
    snapBackPositionRef.current = startTime;
    loopStartPositionRef.current = startTime;
    service.send({ type: TranscribeEvent.SEEK, time: startTime });
    startAnimLoop();
  }, [
    service,
    currentTime,
    loopRegion,
    transcriptionVolume,
    startAnimLoop,
    setRefActiveState,
  ]);

  // Stop reference when recording ends
  const handleRecordingStop = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.stopRef();
      engine.muteRef(false); // reset to full volume
    }
    isPlayingRef.current = false;
    setIsPlayingState(false);
    setRefActiveState(false);
    stopAnimLoop();

    // Snap back
    const snapTo = snapBackPositionRef.current;
    engine?.seekRef(snapTo);
    service?.send({ type: TranscribeEvent.SEEK, time: snapTo });
  }, [service, stopAnimLoop, setRefActiveState]);

  return (
    <div className="bg-background1 flex h-screen flex-col items-center overflow-hidden px-4 pt-8 pb-24">
      {/* Keybinds side panel */}
      <KeybindsPanel
        open={showKeybinds}
        onClose={() => setShowKeybinds(false)}
      />

      {/* Header */}
      <div className="mb-8 flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={() => (window.location.href = "/")}
          className="transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
          aria-label="Back to home"
        >
          <BackIcon height={30} width={30} />
        </button>
        <h1 className="text-lg font-bold text-[var(--foreground2)]">
          Transcribe
        </h1>
        <button
          onClick={() => setShowKeybinds((prev) => !prev)}
          className="text-xs text-[var(--text-secondary)] transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
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

      {/* Always show Reference Track + Transcription Track */}
      <div className="flex w-full flex-col items-center gap-6">
        <div className="w-full max-w-3xl">
          {/* Reference Track control bar */}
          <div className="flex items-center gap-4 rounded-t-lg border border-b-0 border-[var(--surface-border)] px-4 py-2">
            {/* Hold-to-play button for reference */}
            <button
              onPointerDown={handleRefHoldStart}
              onPointerUp={handleRefHoldEnd}
              onPointerLeave={handleRefHoldEnd}
              disabled={!isReady}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--surface-border-medium)] text-[var(--middleground1)] transition-colors hover:cursor-pointer hover:border-[var(--middleground1)] active:bg-[var(--surface-border)] disabled:opacity-30 disabled:hover:cursor-default"
              aria-label={
                refActive ? "Playing reference" : "Press down to play reference"
              }
              title="Press down to play (1)"
            >
              {refActive ? (
                <svg
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="currentColor"
                >
                  <rect x="0" y="0" width="3.5" height="12" rx="0.5" />
                  <rect x="6.5" y="0" width="3.5" height="12" rx="0.5" />
                </svg>
              ) : (
                <svg
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="currentColor"
                >
                  <polygon points="0,0 10,6 0,12" />
                </svg>
              )}
            </button>
            {/* Track navigation */}
            {trackManager.tracks.length > 1 && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={trackManager.prevTrack}
                  disabled={trackManager.activeTrackIndex <= 0}
                  className="flex h-5 w-5 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--middleground1)] disabled:opacity-20"
                  aria-label="Previous track"
                >
                  <svg
                    width="8"
                    height="10"
                    viewBox="0 0 8 10"
                    fill="currentColor"
                  >
                    <polygon points="8,0 0,5 8,10" />
                  </svg>
                </button>
                <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
                  {trackManager.activeTrackIndex + 1}/
                  {trackManager.tracks.length}
                </span>
                <button
                  onClick={trackManager.nextTrack}
                  disabled={
                    trackManager.activeTrackIndex >=
                    trackManager.tracks.length - 1
                  }
                  className="flex h-5 w-5 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--middleground1)] disabled:opacity-20"
                  aria-label="Next track"
                >
                  <svg
                    width="8"
                    height="10"
                    viewBox="0 0 8 10"
                    fill="currentColor"
                  >
                    <polygon points="0,0 8,5 0,10" />
                  </svg>
                </button>
              </div>
            )}
            <h3 className="shrink-0 text-xs font-bold text-[var(--foreground2)]">
              {fileName || "Reference"}
            </h3>
            {/* Ref volume during transcription — T label + icon with expanding slider */}
            {isReady && (
              <div
                className="relative flex shrink-0 items-center"
                onMouseEnter={handleVolumeEnter}
                onMouseLeave={handleVolumeLeave}
              >
                <span className="mr-0.5 text-xs font-bold text-[var(--text-tertiary)]">
                  T
                </span>
                <div
                  className="flex h-5 w-5 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--middleground1)]"
                  title="Volume during transcription"
                >
                  <VolumeIcon volume={transcriptionVolume} />
                </div>
                <div
                  className="flex h-5 items-center gap-2 overflow-hidden transition-all duration-200 ease-out"
                  style={{
                    width: showVolume ? "130px" : "0px",
                    opacity: showVolume ? 1 : 0,
                  }}
                >
                  <Slider
                    value={[Math.round(transcriptionVolume * 100)]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={handleVolumeChange}
                    className="ml-2 w-20"
                  />
                  <span className="w-8 shrink-0 text-xs text-[var(--middleground1)]">
                    {Math.round(transcriptionVolume * 100)}%
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1" />
            {/* Add / Remove track */}
            <div className="flex items-center gap-1">
              <button
                onClick={trackManager.prepareNewTrack}
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
                aria-label="Add reference track"
                title="Add track"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="6" y1="1" x2="6" y2="11" />
                  <line x1="1" y1="6" x2="11" y2="6" />
                </svg>
              </button>
              {trackManager.tracks.length > 0 && isReady && (
                <button
                  onClick={trackManager.removeCurrentTrack}
                  className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:cursor-pointer hover:text-red-400"
                  aria-label="Remove current track"
                  title="Remove track"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="1" y1="1" x2="9" y2="9" />
                    <line x1="9" y1="1" x2="1" y2="9" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Reference Track waveform area */}
          {isReady ? (
            <div className="relative">
              <WaveformDisplay
                zoom={zoom}
                onZoomChange={setZoom}
                onSeek={handleWaveformSeek}
              />
              {/* Zoom controls overlaid on waveform */}
              <div className="absolute top-2 right-3 z-10 flex items-center gap-1.5 rounded border border-[var(--surface-border)] bg-[var(--background)]/40 px-1.5 py-0.5 backdrop-blur-sm">
                <button
                  onClick={() =>
                    setZoom((z) => Math.max(1, z * (1 - 0.15 * 3)))
                  }
                  disabled={zoom <= 1}
                  className="flex h-4 w-4 items-center justify-center rounded text-xs text-[var(--middleground1)] transition-transform hover:scale-110 hover:cursor-pointer active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="text-xs text-[var(--text-secondary)] transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
                >
                  {zoom === 1 ? "1x" : `${zoom.toFixed(1)}x`}
                </button>
                <button
                  onClick={() =>
                    setZoom((z) => Math.min(50, z * (1 + 0.15 * 3)))
                  }
                  disabled={zoom >= 50}
                  className="flex h-4 w-4 items-center justify-center rounded text-xs text-[var(--middleground1)] transition-transform hover:scale-110 hover:cursor-pointer active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          ) : trackManager.activeTrackId && (isIdle || isLoading) ? (
            /* Loading skeleton while restoring from storage */
            <div
              className="flex items-center justify-center rounded-b-lg border border-[var(--surface-border)]"
              style={{ height: "160px" }}
            >
              <div className="flex w-full flex-col gap-2 px-6">
                <div className="flex items-end gap-px">
                  {Array.from({ length: 60 }, (_, i) => {
                    const h = 8 + Math.sin(i * 0.4) * 20 + Math.random() * 15;
                    return (
                      <div
                        key={i}
                        className="flex-1 animate-pulse rounded-sm bg-[var(--surface-border)]"
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 20}ms`,
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-center text-xs text-[var(--text-tertiary)]">
                  Loading track...
                </p>
              </div>
            </div>
          ) : (
            <AudioSourceInput />
          )}

          {/* Loading / Error overlays */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--surface-border-medium)] border-t-[var(--middleground1)]" />
              <p className="ml-3 text-xs text-[var(--middleground1)]">
                Decoding {fileName}...
              </p>
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center gap-3 py-4">
              <p className="text-xs text-red-400">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="rounded border border-[var(--surface-border-medium)] px-3 py-1 text-xs text-[var(--middleground1)] transition-transform hover:scale-105 hover:cursor-pointer active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <PlaybackControls
          isPlaying={isPlayingState}
          onTogglePlayback={handleTogglePlayback}
        />
        <TranscriptionWorkspace
          referenceRegionTime={referenceRegionTime}
          regionDuration={regionDuration}
          onSeekFromTranscription={handleSeekFromTranscription}
          onRecordingStateChange={handleRecordingStateChange}
          onTransHoldStart={handleTransHoldStart}
          onTransHoldEnd={handleTransHoldEnd}
          onTogglePlayback={handleTogglePlayback}
          isActive={transActive}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          stopRecordingRef={stopRecordingRef}
          referenceBuffer={audioBuffer}
        />
      </div>
    </div>
  );
}
