export interface Marker {
  id: string;
  time: number; // seconds from audio start
  label: string; // user-editable, defaults to "M1", "M2", etc.
}

export interface Region {
  start: number; // seconds
  end: number; // seconds
}

export interface Recording {
  id: string;
  blob: Blob;
  objectUrl: string;
  createdAt: number;
  region: Region | null; // section that was looping during recording
  duration: number; // seconds
}

export interface WaveformPeak {
  min: number;
  max: number;
}
