export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

export const DEFAULT_PLAYBACK_RATE = 1.0;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/x-m4a",
];

export const ACCEPTED_AUDIO_EXTENSIONS = ".mp3,.wav,.m4a,.webm,.ogg,.mp4";

export const MARKERS_STORAGE_PREFIX = "transcribe-markers-";

export const WAVEFORM_SAMPLES = 2000;

export const MARKER_SNAP_THRESHOLD_PX = 8;
