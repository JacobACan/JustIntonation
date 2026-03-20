import { JIMIDINote } from "./notes";

// Mastery thresholds
export const MASTERY_WINDOW_SIZE = 15;
export const MASTERY_THRESHOLD = 0.8;
export const MIN_ATTEMPTS_FOR_MASTERY = 10;
export const MAX_ACTIVE_PAIRS = 3;
export const PAIRS_TO_UNLOCK_NEXT_LENGTH = 6;
export const FULL_MASTERY_REGRESSION_THRESHOLD = 10; // wrong answers to lose full mastery

// localStorage keys
export const SCALES_MASTERY_STORAGE_KEY = "melodyMastery_scales";
export const DEGREE_MASTERY_STORAGE_KEY = "degreeMastery_scales";

// Degree mastery
export const MAX_ACTIVE_DEGREES = 3;

export interface DegreePairRecord {
  from: number; // semitone offset (0-11)
  to: number; // semitone offset (0-11)
  attempts: number;
  rollingWindow: boolean[]; // last MASTERY_WINDOW_SIZE results
}

export interface KeyMasteryData {
  pairs: Record<string, DegreePairRecord>; // keyed by "from->to" e.g. "0->7"
  unlockedMelodyLength: number; // starts at 2
  melodyMasteryLevels: Record<number, boolean>; // level (melody length) -> completed
  consecutiveReviewErrors: number; // tracks regression after full mastery
}

export interface MasteryStore {
  version: 1;
  keys: Record<string, KeyMasteryData>; // keyed by Key enum value
}

// --- Degree mastery types ---

export interface DegreeRecord {
  degree: number; // semitone offset (0-11)
  attempts: number;
  rollingWindow: boolean[];
}

export interface KeyDegreeMasteryData {
  degrees: Record<string, DegreeRecord>; // keyed by semitone string e.g. "7"
  fullyMasteredWith: number[] | null; // the includedDegrees when full mastery was earned, null if not mastered
  consecutiveReviewErrors: number; // tracks regression after full mastery
}

export interface DegreeMasteryStore {
  version: 1;
  keys: Record<string, KeyDegreeMasteryData>;
}

// --- Melody mastery result ---

export interface MasteryMelodyResult {
  melody: JIMIDINote[];
  degreePairs: [number, number][];
}
