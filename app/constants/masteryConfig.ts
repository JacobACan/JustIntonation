import { JIMIDINote } from "./notes";

// Mastery thresholds
export const MASTERY_WINDOW_SIZE = 15;
export const MASTERY_THRESHOLD = 0.8;
export const MIN_ATTEMPTS_FOR_MASTERY = 10;
export const MAX_ACTIVE_PAIRS = 3;
export const MAX_ACTIVE_SEQUENCES = 3;
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

// Generic sequence record for tracking mastery of N-note melody sequences
export interface SequenceRecord {
  sequence: string; // comma-joined semitone offsets e.g. "0,7,4"
  attempts: number;
  rollingWindow: boolean[];
}

export interface KeyMasteryData {
  pairs: Record<string, DegreePairRecord>; // keyed by "from->to" e.g. "0->7"
  // Per-level sequence tracking: level 2 = triples, level 3 = quads, etc.
  // Level 1 (pairs) uses the `pairs` field above for backwards compatibility
  levelSequences: Record<number, Record<string, SequenceRecord>>;
  unlockedMelodyLength: number; // starts at 2
  melodyMasteryLevels: Record<number, number[] | null>; // level -> includedDegrees when passed, null if not passed
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
  sequenceKey: string | undefined; // comma-joined degree sequence for level 2+ tracking
}
