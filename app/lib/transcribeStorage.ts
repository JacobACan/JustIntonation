import { Marker, Recording, Region } from "@/types/transcribe";

const DB_NAME = "transcribe-storage";
const DB_VERSION = 1;
const AUDIO_STORE = "audio-files";
const RECORDINGS_STORE = "recordings";
const LS_TRACK_LIST = "transcribe-track-list";
const LS_TRACK_PREFIX = "transcribe-track-";

// === IndexedDB helpers ===

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
      if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
        db.createObjectStore(RECORDINGS_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbPut(store: string, key: string, value: unknown): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbDelete(store: string, key: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

// === Track list ===

export interface TrackListEntry {
  id: string;
  fileName: string;
}

export interface TrackList {
  tracks: TrackListEntry[];
  activeTrackId: string | null;
}

export function loadTrackList(): TrackList {
  try {
    const raw = localStorage.getItem(LS_TRACK_LIST);
    if (!raw) return { tracks: [], activeTrackId: null };
    return JSON.parse(raw);
  } catch {
    return { tracks: [], activeTrackId: null };
  }
}

export function saveTrackList(list: TrackList): void {
  try {
    localStorage.setItem(LS_TRACK_LIST, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// === Per-track settings (localStorage) ===

export interface TrackSettings {
  playbackRate: number;
  transpose: number;
  transcriptionVolume: number;
  syncOffsetMs: number;
  markers: Marker[];
  loopRegion: Region | null;
  isLooping: boolean;
  fileName: string;
  duration: number;
  currentTime: number;
  zoom: number;
  recordingMeta: Array<{
    id: string;
    createdAt: number;
    region: Region | null;
    duration: number;
    recordedTranspose: number;
  }>;
}

export function saveTrackSettings(
  trackId: string,
  settings: TrackSettings,
): void {
  try {
    localStorage.setItem(LS_TRACK_PREFIX + trackId, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadTrackSettings(trackId: string): TrackSettings | null {
  try {
    const raw = localStorage.getItem(LS_TRACK_PREFIX + trackId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearTrackSettings(trackId: string): void {
  try {
    localStorage.removeItem(LS_TRACK_PREFIX + trackId);
  } catch {
    // ignore
  }
}

// === Zoom (saved per-track) ===

export function saveZoom(trackId: string, zoom: number): void {
  const settings = loadTrackSettings(trackId);
  if (settings) {
    settings.zoom = zoom;
    saveTrackSettings(trackId, settings);
  }
}

export function loadZoom(trackId: string): number {
  return loadTrackSettings(trackId)?.zoom ?? 1;
}

// === Audio file persistence (IndexedDB, keyed by track ID) ===

export async function saveAudioFile(
  trackId: string,
  file: File,
): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  await idbPut(AUDIO_STORE, trackId, {
    buffer: arrayBuffer,
    name: file.name,
    type: file.type,
  });
}

export async function loadAudioFile(trackId: string): Promise<File | null> {
  const data = await idbGet<{
    buffer: ArrayBuffer;
    name: string;
    type: string;
  }>(AUDIO_STORE, trackId);
  if (!data) return null;
  return new File([data.buffer], data.name, { type: data.type });
}

export async function clearAudioFile(trackId: string): Promise<void> {
  await idbDelete(AUDIO_STORE, trackId);
}

// === Recording persistence (IndexedDB) ===

export async function saveRecording(recording: Recording): Promise<void> {
  const arrayBuffer = await recording.blob.arrayBuffer();
  await idbPut(RECORDINGS_STORE, recording.id, {
    id: recording.id,
    buffer: arrayBuffer,
    mimeType: recording.blob.type,
    createdAt: recording.createdAt,
    region: recording.region,
    duration: recording.duration,
    recordedTranspose: recording.recordedTranspose ?? 0,
  });
}

export async function loadRecording(id: string): Promise<Recording | null> {
  const data = await idbGet<{
    id: string;
    buffer: ArrayBuffer;
    mimeType: string;
    createdAt: number;
    region: Region | null;
    duration: number;
    recordedTranspose?: number;
  }>(RECORDINGS_STORE, id);
  if (!data) return null;
  const blob = new Blob([data.buffer], { type: data.mimeType });
  return {
    id: data.id,
    blob,
    objectUrl: URL.createObjectURL(blob),
    createdAt: data.createdAt,
    region: data.region,
    duration: data.duration,
    recordedTranspose: data.recordedTranspose ?? 0,
  };
}

export async function loadAllRecordings(ids: string[]): Promise<Recording[]> {
  const results = await Promise.all(ids.map(loadRecording));
  return results.filter((r): r is Recording => r !== null);
}

export async function deleteRecording(id: string): Promise<void> {
  await idbDelete(RECORDINGS_STORE, id);
}

// === Track lifecycle ===

export function addTrack(fileName: string): string {
  const id = crypto.randomUUID();
  const list = loadTrackList();
  list.tracks.push({ id, fileName });
  list.activeTrackId = id;
  saveTrackList(list);
  return id;
}

export async function removeTrack(trackId: string): Promise<void> {
  const list = loadTrackList();

  // Delete per-track data
  clearTrackSettings(trackId);
  await clearAudioFile(trackId);

  // Delete recordings for this track
  const settings = loadTrackSettings(trackId);
  if (settings) {
    for (const rec of settings.recordingMeta) {
      await deleteRecording(rec.id);
    }
  }

  // Remove from list
  list.tracks = list.tracks.filter((t) => t.id !== trackId);
  if (list.activeTrackId === trackId) {
    list.activeTrackId = list.tracks[0]?.id ?? null;
  }
  saveTrackList(list);
}

export function setActiveTrack(trackId: string): void {
  const list = loadTrackList();
  list.activeTrackId = trackId;
  saveTrackList(list);
}

// === Migration: convert old single-track storage to new format ===

export function migrateIfNeeded(): void {
  // Check if old format exists
  const oldKey = "transcribe-settings";
  try {
    const raw = localStorage.getItem(oldKey);
    if (!raw) return;
    const old = JSON.parse(raw);
    if (!old.hasAudioFile) {
      localStorage.removeItem(oldKey);
      return;
    }

    // Already migrated if track list exists
    const list = loadTrackList();
    if (list.tracks.length > 0) {
      localStorage.removeItem(oldKey);
      return;
    }

    // Create a track from old data
    const id = crypto.randomUUID();
    saveTrackSettings(id, {
      playbackRate: old.playbackRate ?? 1,
      transpose: old.transpose ?? 0,
      transcriptionVolume: old.transcriptionVolume ?? 0.2,
      syncOffsetMs: old.syncOffsetMs ?? 0,
      markers: old.markers ?? [],
      loopRegion: old.loopRegion ?? null,
      isLooping: old.isLooping ?? false,
      fileName: old.fileName ?? "Untitled",
      duration: old.duration ?? 0,
      currentTime: old.currentTime ?? 0,
      zoom: old.zoom ?? 1,
      recordingMeta: old.recordingMeta ?? [],
    });
    saveTrackList({
      tracks: [{ id, fileName: old.fileName ?? "Untitled" }],
      activeTrackId: id,
    });

    // Migrate audio file in IndexedDB (rename key "reference" → track id)
    // This is async but we fire-and-forget since the old key still works for loading
    openDB().then((db) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.get("reference");
      req.onsuccess = () => {
        if (req.result) {
          store.put(req.result, id);
          store.delete("reference");
        }
      };
    });

    localStorage.removeItem(oldKey);
  } catch {
    // ignore migration errors
  }
}
