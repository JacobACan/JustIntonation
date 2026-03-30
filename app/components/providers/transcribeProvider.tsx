"use client";

import {
  TranscribeEvent,
  TranscribeState,
  transcribeMachine,
} from "@/machines/transcribeProcess";
import { useActorRef, useSelector } from "@xstate/react";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { ActorRefFrom } from "xstate";
import {
  loadTrackList,
  saveTrackList,
  loadTrackSettings,
  saveTrackSettings,
  saveAudioFile,
  loadAudioFile,
  saveRecording,
  loadAllRecordings,
  removeTrack as removeTrackStorage,
  setActiveTrack,
  migrateIfNeeded,
  type TrackListEntry,
} from "@/lib/transcribeStorage";
import { decodeAudioFile, computeWaveformPeaks } from "@/lib/transcribeActors";

type TranscribeService = ActorRefFrom<typeof transcribeMachine>;

export interface TrackManager {
  tracks: TrackListEntry[];
  activeTrackId: string | null;
  activeTrackIndex: number;
  switchTrack: (trackId: string) => void;
  addTrack: (file: File) => void;
  prepareNewTrack: () => void;
  removeCurrentTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const TranscribeMachineContext = createContext<
  TranscribeService | undefined
>(undefined);

export const TrackManagerContext = createContext<TrackManager>({
  tracks: [],
  activeTrackId: null,
  activeTrackIndex: -1,
  switchTrack: () => {},
  addTrack: () => {},
  prepareNewTrack: () => {},
  removeCurrentTrack: () => {},
  nextTrack: () => {},
  prevTrack: () => {},
});

export default function TranscribeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const transcribeService = useActorRef(transcribeMachine);
  const restoredRef = useRef(false);
  const [tracks, setTracks] = useState<TrackListEntry[]>([]);
  const [activeTrackId, setActiveTrackIdState] = useState<string | null>(null);
  const activeTrackIdRef = useRef<string | null>(null);

  // Run migration on first mount
  useEffect(() => {
    migrateIfNeeded();
  }, []);

  // Restore active track on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const list = loadTrackList();
    setTracks(list.tracks);
    setActiveTrackIdState(list.activeTrackId);
    activeTrackIdRef.current = list.activeTrackId;

    if (list.activeTrackId) {
      restoreTrack(list.activeTrackId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreTrack = useCallback(
    async (trackId: string) => {
      const settings = loadTrackSettings(trackId);
      if (!settings) return;

      const file = await loadAudioFile(trackId);
      if (!file) return;

      try {
        const { audioBuffer, fileUrl } = await decodeAudioFile(file);
        const waveformPeaks = computeWaveformPeaks(audioBuffer);

        const recordingIds = settings.recordingMeta.map((r) => r.id);
        const recordings = await loadAllRecordings(recordingIds);

        transcribeService.send({
          type: TranscribeEvent.RESTORE,
          context: {
            audioBuffer,
            fileUrl,
            waveformPeaks,
            duration: audioBuffer.duration,
            fileName: settings.fileName,
            markers: settings.markers,
            loopRegion: settings.loopRegion,
            isLooping: settings.isLooping,
            recordings,
            playbackRate: settings.playbackRate,
            transpose: settings.transpose ?? 0,
            transcriptionVolume: settings.transcriptionVolume,
            syncOffsetMs: settings.syncOffsetMs,
            currentTime: settings.currentTime ?? 0,
          },
        });
      } catch {
        // Failed to decode — leave in idle state
      }
    },
    [transcribeService],
  );

  const saveCurrentTrack = useCallback(() => {
    const trackId = activeTrackIdRef.current;
    if (!trackId) return;

    const snapshot = transcribeService.getSnapshot();
    const ctx = snapshot.context;
    if (!ctx.audioBuffer) return;

    saveTrackSettings(trackId, {
      playbackRate: ctx.playbackRate,
      transpose: ctx.transpose,
      transcriptionVolume: ctx.transcriptionVolume,
      syncOffsetMs: ctx.syncOffsetMs,
      markers: ctx.markers,
      loopRegion: ctx.loopRegion,
      isLooping: ctx.isLooping,
      fileName: ctx.fileName,
      duration: ctx.duration,
      currentTime: ctx.currentTime,
      zoom: loadTrackSettings(trackId)?.zoom ?? 1,
      recordingMeta: ctx.recordings.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        region: r.region,
        duration: r.duration,
        recordedTranspose: r.recordedTranspose ?? 0,
      })),
    });

    for (const recording of ctx.recordings) {
      saveRecording(recording);
    }
  }, [transcribeService]);

  // Auto-save on context changes
  const context = useSelector(transcribeService, (state) => state.context);
  const isInReady = useSelector(transcribeService, (state) =>
    state.matches(TranscribeState.READY),
  );
  const prevContextRef = useRef(context);

  useEffect(() => {
    if (!isInReady || !activeTrackIdRef.current) return;
    if (context === prevContextRef.current) return;
    prevContextRef.current = context;
    saveCurrentTrack();
  }, [context, isInReady, saveCurrentTrack]);

  // Save audio file when first loaded
  const fileUrlRef = useRef("");
  useEffect(() => {
    if (
      context.fileUrl &&
      context.fileUrl !== fileUrlRef.current &&
      context.fileName &&
      activeTrackIdRef.current
    ) {
      fileUrlRef.current = context.fileUrl;
      fetch(context.fileUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], context.fileName, { type: blob.type });
          saveAudioFile(activeTrackIdRef.current!, file);
        })
        .catch(() => {});
    }
  }, [context.fileUrl, context.fileName]);

  // When a new file is loaded via LOAD_FILE (not restore), register the track
  const wasIdle = useRef(true);
  useEffect(() => {
    if (isInReady && wasIdle.current && !activeTrackIdRef.current) {
      // A new file was loaded from idle with no active track — create a track entry
      const id = crypto.randomUUID();
      const list = loadTrackList();
      list.tracks.push({ id, fileName: context.fileName });
      list.activeTrackId = id;
      saveTrackList(list);
      setTracks([...list.tracks]);
      setActiveTrackIdState(id);
      activeTrackIdRef.current = id;

      // Save settings and audio now — the auto-save and file-save effects
      // already ran this cycle with a null trackId, so they skipped.
      saveCurrentTrack();
      if (context.fileUrl) {
        fileUrlRef.current = context.fileUrl;
        fetch(context.fileUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], context.fileName, {
              type: blob.type,
            });
            saveAudioFile(id, file);
          })
          .catch(() => {});
      }
    }
    wasIdle.current = !isInReady;
  }, [isInReady, context.fileName, saveCurrentTrack, context.fileUrl]);

  // Save state when unmounting (navigating away)
  const saveCurrentTrackRef = useRef(saveCurrentTrack);
  saveCurrentTrackRef.current = saveCurrentTrack;
  useEffect(() => {
    return () => {
      saveCurrentTrackRef.current();
    };
  }, []);

  // === Track management functions ===

  const switchTrack = useCallback(
    (trackId: string) => {
      if (trackId === activeTrackIdRef.current) return;
      saveCurrentTrack();
      fileUrlRef.current = "";
      transcribeService.send({ type: TranscribeEvent.RESET });

      setActiveTrackIdState(trackId);
      activeTrackIdRef.current = trackId;
      setActiveTrack(trackId);

      // Small delay to let reset complete
      setTimeout(() => restoreTrack(trackId), 50);
    },
    [saveCurrentTrack, transcribeService, restoreTrack],
  );

  const prepareNewTrack = useCallback(() => {
    saveCurrentTrack();
    fileUrlRef.current = "";
    setActiveTrackIdState(null);
    activeTrackIdRef.current = null;
    transcribeService.send({ type: TranscribeEvent.RESET });
  }, [saveCurrentTrack, transcribeService]);

  const addTrackFn = useCallback(
    (file: File) => {
      // Save current track first
      saveCurrentTrack();
      fileUrlRef.current = "";

      // Create new track entry
      const id = crypto.randomUUID();
      const list = loadTrackList();
      list.tracks.push({ id, fileName: file.name });
      list.activeTrackId = id;
      saveTrackList(list);
      setTracks([...list.tracks]);
      setActiveTrackIdState(id);
      activeTrackIdRef.current = id;

      // Reset machine and load the new file
      transcribeService.send({ type: TranscribeEvent.RESET });
      setTimeout(() => {
        transcribeService.send({ type: TranscribeEvent.LOAD_FILE, file });
      }, 50);
    },
    [saveCurrentTrack, transcribeService],
  );

  const removeCurrentTrack = useCallback(async () => {
    const trackId = activeTrackIdRef.current;
    if (!trackId) return;

    await removeTrackStorage(trackId);
    const list = loadTrackList();
    setTracks([...list.tracks]);
    fileUrlRef.current = "";

    transcribeService.send({ type: TranscribeEvent.RESET });

    if (list.activeTrackId) {
      setActiveTrackIdState(list.activeTrackId);
      activeTrackIdRef.current = list.activeTrackId;
      setTimeout(() => restoreTrack(list.activeTrackId!), 50);
    } else {
      setActiveTrackIdState(null);
      activeTrackIdRef.current = null;
    }
  }, [transcribeService, restoreTrack]);

  const nextTrack = useCallback(() => {
    const list = loadTrackList();
    const idx = list.tracks.findIndex((t) => t.id === activeTrackIdRef.current);
    if (idx < list.tracks.length - 1) {
      switchTrack(list.tracks[idx + 1].id);
    }
  }, [switchTrack]);

  const prevTrack = useCallback(() => {
    const list = loadTrackList();
    const idx = list.tracks.findIndex((t) => t.id === activeTrackIdRef.current);
    if (idx > 0) {
      switchTrack(list.tracks[idx - 1].id);
    }
  }, [switchTrack]);

  const activeTrackIndex = tracks.findIndex((t) => t.id === activeTrackId);

  const trackManager: TrackManager = {
    tracks,
    activeTrackId,
    activeTrackIndex,
    switchTrack,
    addTrack: addTrackFn,
    prepareNewTrack,
    removeCurrentTrack,
    nextTrack,
    prevTrack,
  };

  return (
    <TrackManagerContext value={trackManager}>
      <TranscribeMachineContext value={transcribeService}>
        {children}
      </TranscribeMachineContext>
    </TrackManagerContext>
  );
}
