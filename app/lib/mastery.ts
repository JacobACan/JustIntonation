import { Key } from "@/constants/keys";
import {
  DegreeRecord,
  DegreeMasteryStore,
  DegreePairRecord,
  FULL_MASTERY_REGRESSION_THRESHOLD,
  KeyDegreeMasteryData,
  KeyMasteryData,
  MasteryMelodyResult,
  MasteryStore,
  MASTERY_THRESHOLD,
  MASTERY_WINDOW_SIZE,
  MAX_ACTIVE_DEGREES,
  MAX_ACTIVE_PAIRS,
  MAX_ACTIVE_SEQUENCES,
  MIN_ATTEMPTS_FOR_MASTERY,
  PAIRS_TO_UNLOCK_NEXT_LENGTH,
  SequenceRecord,
} from "@/constants/masteryConfig";
import { keyToMidi, midiNotesValues, noteToMidi } from "@/constants/midi";
import { Duration, JIMIDINote, midiToNote } from "@/constants/notes";
import { getScaleDisplayRange } from "./key";
import { Scale } from "@/constants/scale";

// --- Storage ---

export const loadMasteryStore = (storageKey: string): MasteryStore => {
  if (typeof window === "undefined") return { version: 1, keys: {} };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as MasteryStore;
  } catch {
    // Corrupted data — start fresh
  }
  return { version: 1, keys: {} };
};

export const saveMasteryStore = (
  storageKey: string,
  store: MasteryStore,
): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(store));
};

// --- Pair helpers ---

const pairKey = (from: number, to: number): string => `${from}->${to}`;

export const isPairMastered = (record: DegreePairRecord): boolean =>
  record.rollingWindow.length >= MIN_ATTEMPTS_FOR_MASTERY &&
  record.rollingWindow.filter(Boolean).length / record.rollingWindow.length >=
    MASTERY_THRESHOLD;

/**
 * Generate all possible degree pairs from included degrees,
 * sorted by semitone distance (closest intervals first).
 */
export const generatePairOrder = (
  includedDegrees: number[],
): [number, number][] => {
  const pairs: [number, number][] = [];
  for (const from of includedDegrees) {
    for (const to of includedDegrees) {
      if (from !== to) pairs.push([from, to]);
    }
  }
  pairs.sort((a, b) => {
    const distA = Math.min(Math.abs(a[0] - a[1]), 12 - Math.abs(a[0] - a[1]));
    const distB = Math.min(Math.abs(b[0] - b[1]), 12 - Math.abs(b[0] - b[1]));
    if (distA !== distB) return distA - distB;
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
  return pairs;
};

const getOrCreateKeyMastery = (
  store: MasteryStore,
  key: Key,
): KeyMasteryData => {
  if (!store.keys[key]) {
    store.keys[key] = {
      pairs: {},
      levelSequences: {},
      unlockedMelodyLength: 2,
      melodyMasteryLevels: {},
      consecutiveReviewErrors: 0,
    };
  }
  // Backfill fields that may be missing from old localStorage data
  const data = store.keys[key];
  if (!data.melodyMasteryLevels) data.melodyMasteryLevels = {};
  if (!data.levelSequences) data.levelSequences = {};
  if (data.consecutiveReviewErrors === undefined)
    data.consecutiveReviewErrors = 0;
  return data;
};

const getOrCreatePairRecord = (
  keyMastery: KeyMasteryData,
  from: number,
  to: number,
): DegreePairRecord => {
  const k = pairKey(from, to);
  if (!keyMastery.pairs[k]) {
    keyMastery.pairs[k] = { from, to, attempts: 0, rollingWindow: [] };
  }
  return keyMastery.pairs[k];
};

/**
 * Returns up to MAX_ACTIVE_PAIRS pairs to practice.
 * Priority: started-but-not-mastered (including regressed), then next unstarted from order.
 */
export const getActivePairs = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
): [number, number][] => {
  const order = generatePairOrder(includedDegrees);
  const degreeSet = new Set(includedDegrees);

  // Pairs that have been started but not mastered (using currently-included degrees)
  const inProgress: [number, number][] = [];
  for (const [k, record] of Object.entries(keyMastery.pairs)) {
    if (
      record.attempts > 0 &&
      !isPairMastered(record) &&
      degreeSet.has(record.from) &&
      degreeSet.has(record.to)
    ) {
      inProgress.push([record.from, record.to]);
    }
  }

  const active: [number, number][] = inProgress.slice(0, MAX_ACTIVE_PAIRS);

  if (active.length < MAX_ACTIVE_PAIRS) {
    // Fill with next unstarted pairs from the order
    const activeSet = new Set(active.map(([f, t]) => pairKey(f, t)));
    const masteredSet = new Set(
      Object.entries(keyMastery.pairs)
        .filter(([, r]) => isPairMastered(r))
        .map(([k]) => k),
    );

    for (const [from, to] of order) {
      if (active.length >= MAX_ACTIVE_PAIRS) break;
      const k = pairKey(from, to);
      if (!activeSet.has(k) && !masteredSet.has(k)) {
        active.push([from, to]);
        activeSet.add(k);
      }
    }
  }

  return active;
};

/**
 * Get all mastered pairs that use only currently-included degrees.
 */
export const getMasteredPairs = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
): [number, number][] => {
  const degreeSet = new Set(includedDegrees);
  const mastered: [number, number][] = [];
  for (const record of Object.values(keyMastery.pairs)) {
    if (
      isPairMastered(record) &&
      degreeSet.has(record.from) &&
      degreeSet.has(record.to)
    ) {
      mastered.push([record.from, record.to]);
    }
  }
  return mastered;
};

// --- Result recording ---

export const recordResult = (
  store: MasteryStore,
  key: Key,
  pairs: [number, number][],
  correct: boolean,
  includedDegrees: number[],
): MasteryStore => {
  const updated = { ...store, keys: { ...store.keys } };
  const keyMastery = getOrCreateKeyMastery(updated, key);

  for (const [from, to] of pairs) {
    const record = getOrCreatePairRecord(keyMastery, from, to);
    record.attempts++;
    record.rollingWindow.push(correct);
    if (record.rollingWindow.length > MASTERY_WINDOW_SIZE) {
      record.rollingWindow.shift();
    }
  }

  // Check length unlock
  keyMastery.unlockedMelodyLength = getUnlockedMelodyLength(
    keyMastery,
    includedDegrees,
  );

  return updated;
};

/**
 * Compute the unlocked melody length based on completed mastery levels.
 * Length N+1 only unlocks after the level N final test is passed.
 * Level 1 = length 2 (pairs), Level 2 = length 3 (triples), etc.
 */
/**
 * Check if a melody mastery level is complete for the current included degrees.
 * A level is only valid if every currently-included degree was part of the set when it was passed.
 */
export const isLevelCompleteForDegrees = (
  keyMastery: KeyMasteryData,
  level: number,
  includedDegrees: number[],
): boolean => {
  const levels = keyMastery.melodyMasteryLevels ?? {};
  const passedWith = levels[level];
  if (!passedWith || !Array.isArray(passedWith)) return false;
  const passedSet = new Set(passedWith);
  return includedDegrees.every((d) => passedSet.has(d));
};

export const getUnlockedMelodyLength = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
): number => {
  let length = 2; // always start at 2
  // Each completed level unlocks the next length, but only if valid for current degrees
  while (isLevelCompleteForDegrees(keyMastery, length - 1, includedDegrees)) {
    length++;
  }
  return length;
};

// --- Melody generation ---

/**
 * Get MIDI note candidates for a specific semitone offset within a range.
 */
const getNotesForDegree = (
  key: Key,
  semitoneOffset: number,
  rangeMin: number,
  rangeMax: number,
): number[] => {
  const rootPitchClass = keyToMidi[key] % 12;
  const targetPitchClass = (rootPitchClass + semitoneOffset) % 12;
  const notes: number[] = [];

  for (let midi = rangeMin; midi <= rangeMax; midi++) {
    if (midi % 12 === targetPitchClass && midiToNote[midi]) {
      notes.push(midi);
    }
  }
  return notes;
};

/**
 * Pick a random note for a degree that satisfies interval constraints from a previous note.
 * Returns undefined if no valid note exists.
 */
const pickNoteForDegree = (
  key: Key,
  semitoneOffset: number,
  rangeMin: number,
  rangeMax: number,
  previousMidi: number | undefined,
  minInterval: number,
  maxInterval: number,
): number | undefined => {
  let candidates = getNotesForDegree(key, semitoneOffset, rangeMin, rangeMax);

  if (previousMidi !== undefined) {
    candidates = candidates.filter((midi) => {
      const interval = Math.abs(midi - previousMidi);
      return interval >= minInterval && interval <= maxInterval;
    });
  }

  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

const randomDuration = (): number =>
  [Duration.QuarterNote, Duration.EigthNote, Duration.SixteenthNote][
    Math.floor(Math.random() * 3)
  ];

/**
 * Generate a melody from a specific sequence of degree semitone offsets.
 * Used for final test where the exact degree sequence is predetermined.
 */
export const getNextMasteryMelodyFromDegrees = (
  key: Key,
  degrees: number[],
  startingDegree: number,
  octaves: 1 | 2,
  minInterval: number,
  maxInterval: number,
): MasteryMelodyResult => {
  const [rangeStart, rangeEnd] = getScaleDisplayRange(
    key,
    Scale.major,
    startingDegree,
    octaves,
  );
  const rangeMin = noteToMidi[rangeStart];
  const rangeMax = noteToMidi[rangeEnd];

  const melody: JIMIDINote[] = [];
  const degreePairs: [number, number][] = [];
  let lastMidi: number | undefined;

  for (let i = 0; i < degrees.length; i++) {
    const midi = pickNoteForDegree(
      key,
      degrees[i],
      rangeMin,
      rangeMax,
      lastMidi,
      minInterval,
      maxInterval,
    );

    if (midi === undefined) {
      // Fallback: pick without interval constraints
      const notes = getNotesForDegree(key, degrees[i], rangeMin, rangeMax);
      if (notes.length === 0) break;
      const fallback = notes[Math.floor(Math.random() * notes.length)];
      melody.push({
        secondsSinceLastNote: i === 0 ? 0 : randomDuration(),
        note: fallback,
        channel: 1,
        on: true,
        velocity: 1,
      });
      if (i > 0) degreePairs.push([degrees[i - 1], degrees[i]]);
      lastMidi = fallback;
    } else {
      melody.push({
        secondsSinceLastNote: i === 0 ? 0 : randomDuration(),
        note: midi,
        channel: 1,
        on: true,
        velocity: 1,
      });
      if (i > 0) degreePairs.push([degrees[i - 1], degrees[i]]);
      lastMidi = midi;
    }
  }

  const sequenceKey = degrees.length > 2 ? degrees.join(",") : undefined;
  return { melody, degreePairs, sequenceKey };
};

export const getNextMasteryMelody = (
  key: Key,
  includedDegrees: number[],
  startingDegree: number,
  octaves: 1 | 2,
  store: MasteryStore,
  minInterval: number,
  maxInterval: number,
  reviewMastered: boolean = false,
): MasteryMelodyResult => {
  const keyMastery = getOrCreateKeyMastery(store, key);
  const masteredPairsForReview = getMasteredPairs(keyMastery, includedDegrees);
  const activePairs =
    reviewMastered && masteredPairsForReview.length > 0
      ? masteredPairsForReview
      : getActivePairs(keyMastery, includedDegrees);
  const melodyLength = getUnlockedMelodyLength(keyMastery, includedDegrees);

  const [rangeStart, rangeEnd] = getScaleDisplayRange(
    key,
    Scale.major,
    startingDegree,
    octaves,
  );
  const rangeMin = noteToMidi[rangeStart];
  const rangeMax = noteToMidi[rangeEnd];

  const melody: JIMIDINote[] = [];
  const degreePairs: [number, number][] = [];

  if (melodyLength === 2 || activePairs.length === 0) {
    // Simple 2-note melody from one active pair
    const pair =
      activePairs.length > 0
        ? activePairs[Math.floor(Math.random() * activePairs.length)]
        : [includedDegrees[0], includedDegrees[1] ?? includedDegrees[0]];

    const firstMidi = pickNoteForDegree(
      key,
      pair[0],
      rangeMin,
      rangeMax,
      undefined,
      minInterval,
      maxInterval,
    );
    const secondMidi = pickNoteForDegree(
      key,
      pair[1],
      rangeMin,
      rangeMax,
      firstMidi,
      minInterval,
      maxInterval,
    );

    if (firstMidi !== undefined && secondMidi !== undefined) {
      melody.push({
        secondsSinceLastNote: 0,
        note: firstMidi,
        channel: 1,
        on: true,
        velocity: 1,
      });
      melody.push({
        secondsSinceLastNote: randomDuration(),
        note: secondMidi,
        channel: 1,
        on: true,
        velocity: 1,
      });
      degreePairs.push([pair[0], pair[1]]);
    }
  } else {
    // Length 3+: chain mastered pair → active pairs
    const masteredPairs = getMasteredPairs(keyMastery, includedDegrees);

    // Start with a mastered pair if available, otherwise an active pair
    const startPair =
      masteredPairs.length > 0
        ? masteredPairs[Math.floor(Math.random() * masteredPairs.length)]
        : activePairs[0];

    const firstMidi = pickNoteForDegree(
      key,
      startPair[0],
      rangeMin,
      rangeMax,
      undefined,
      minInterval,
      maxInterval,
    );
    const secondMidi = pickNoteForDegree(
      key,
      startPair[1],
      rangeMin,
      rangeMax,
      firstMidi,
      minInterval,
      maxInterval,
    );

    if (firstMidi !== undefined && secondMidi !== undefined) {
      melody.push({
        secondsSinceLastNote: 0,
        note: firstMidi,
        channel: 1,
        on: true,
        velocity: 1,
      });
      melody.push({
        secondsSinceLastNote: randomDuration(),
        note: secondMidi,
        channel: 1,
        on: true,
        velocity: 1,
      });
      degreePairs.push([startPair[0], startPair[1]]);

      let lastDegree = startPair[1];
      let lastMidi = secondMidi;

      // Chain additional notes
      for (let i = 2; i < melodyLength; i++) {
        // Find an active pair whose `from` matches lastDegree
        let nextPair = activePairs.find(([f]) => f === lastDegree);

        // If no chaining pair, pick any active pair and use its `to` degree
        if (!nextPair) {
          nextPair =
            activePairs[Math.floor(Math.random() * activePairs.length)];
        }

        const nextDegree = nextPair[1];
        const nextMidi = pickNoteForDegree(
          key,
          nextDegree,
          rangeMin,
          rangeMax,
          lastMidi,
          minInterval,
          maxInterval,
        );

        if (nextMidi !== undefined) {
          melody.push({
            secondsSinceLastNote: randomDuration(),
            note: nextMidi,
            channel: 1,
            on: true,
            velocity: 1,
          });
          degreePairs.push([lastDegree, nextDegree]);
          lastDegree = nextDegree;
          lastMidi = nextMidi;
        } else {
          // Can't find a valid note — stop building the melody
          break;
        }
      }
    }
  }

  // Fallback: if melody generation failed, generate a simple 2-note melody
  // using the first two included degrees without interval constraints
  if (melody.length < 2 && includedDegrees.length >= 2) {
    const deg1Notes = getNotesForDegree(
      key,
      includedDegrees[0],
      rangeMin,
      rangeMax,
    );
    const deg2Notes = getNotesForDegree(
      key,
      includedDegrees[1],
      rangeMin,
      rangeMax,
    );
    if (deg1Notes.length > 0 && deg2Notes.length > 0) {
      melody.length = 0;
      degreePairs.length = 0;
      melody.push({
        secondsSinceLastNote: 0,
        note: deg1Notes[Math.floor(Math.random() * deg1Notes.length)],
        channel: 1,
        on: true,
        velocity: 1,
      });
      melody.push({
        secondsSinceLastNote: randomDuration(),
        note: deg2Notes[Math.floor(Math.random() * deg2Notes.length)],
        channel: 1,
        on: true,
        velocity: 1,
      });
      degreePairs.push([includedDegrees[0], includedDegrees[1]]);
    }
  }

  // Compute sequence key from the degree pairs
  const sequenceDegrees: number[] = [];
  if (degreePairs.length > 0) {
    sequenceDegrees.push(degreePairs[0][0]);
    for (const [, to] of degreePairs) {
      sequenceDegrees.push(to);
    }
  }
  const sequenceKey =
    sequenceDegrees.length > 2 ? sequenceDegrees.join(",") : undefined;

  return { melody, degreePairs, sequenceKey };
};

// =============================================
// SEQUENCE MASTERY (level 2+ melody tracking)
// =============================================

export const isSequenceMastered = (record: SequenceRecord): boolean =>
  record.rollingWindow.length >= MIN_ATTEMPTS_FOR_MASTERY &&
  record.rollingWindow.filter(Boolean).length / record.rollingWindow.length >=
    MASTERY_THRESHOLD;

/**
 * Get all possible sequences for a given level (melody length).
 * Level 2 = length 3 sequences, level 3 = length 4, etc.
 */
export const getAllSequencesForLevel = (
  includedDegrees: number[],
  level: number,
): string[] => {
  const melodyLength = level + 1;
  const sequences: string[] = [];
  const generate = (current: number[]) => {
    if (current.length === melodyLength) {
      sequences.push(current.join(","));
      return;
    }
    for (const d of includedDegrees) {
      if (current.length === 0 || d !== current[current.length - 1]) {
        generate([...current, d]);
      }
    }
  };
  generate([]);
  return sequences;
};

export const getActiveSequences = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
  level: number,
): string[] => {
  const levelData = keyMastery.levelSequences[level] ?? {};
  const allSeqs = getAllSequencesForLevel(includedDegrees, level);
  const allSet = new Set(allSeqs);

  // In-progress: started but not mastered
  const inProgress: string[] = [];
  for (const [key, record] of Object.entries(levelData)) {
    if (record.attempts > 0 && !isSequenceMastered(record) && allSet.has(key)) {
      inProgress.push(key);
    }
  }

  const active = inProgress.slice(0, MAX_ACTIVE_SEQUENCES);

  if (active.length < MAX_ACTIVE_SEQUENCES) {
    const activeSet = new Set(active);
    const masteredSet = new Set(
      Object.entries(levelData)
        .filter(([k, r]) => isSequenceMastered(r) && allSet.has(k))
        .map(([k]) => k),
    );

    // Fill with random unstarted sequences
    const unstarted = allSeqs.filter(
      (s) => !activeSet.has(s) && !masteredSet.has(s) && !levelData[s],
    );
    for (let i = unstarted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unstarted[i], unstarted[j]] = [unstarted[j], unstarted[i]];
    }
    for (const s of unstarted) {
      if (active.length >= MAX_ACTIVE_SEQUENCES) break;
      active.push(s);
    }
  }

  return active;
};

export const getMasteredSequences = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
  level: number,
): string[] => {
  const levelData = keyMastery.levelSequences[level] ?? {};
  const allSet = new Set(getAllSequencesForLevel(includedDegrees, level));
  return Object.entries(levelData)
    .filter(([k, r]) => isSequenceMastered(r) && allSet.has(k))
    .map(([k]) => k);
};

export const allSequencesMasteredAtLevel = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
  level: number,
): boolean => {
  const allSeqs = getAllSequencesForLevel(includedDegrees, level);
  const mastered = getMasteredSequences(keyMastery, includedDegrees, level);
  return mastered.length >= allSeqs.length && allSeqs.length > 0;
};

export const recordSequenceResult = (
  store: MasteryStore,
  key: Key,
  sequenceKey: string,
  level: number,
  correct: boolean,
): MasteryStore => {
  const updated = { ...store, keys: { ...store.keys } };
  const keyMastery = getOrCreateKeyMastery(updated, key);

  if (!keyMastery.levelSequences[level]) {
    keyMastery.levelSequences[level] = {};
  }
  const levelData = keyMastery.levelSequences[level];

  if (!levelData[sequenceKey]) {
    levelData[sequenceKey] = {
      sequence: sequenceKey,
      attempts: 0,
      rollingWindow: [],
    };
  }
  const record = levelData[sequenceKey];
  record.attempts++;
  record.rollingWindow.push(correct);
  if (record.rollingWindow.length > MASTERY_WINDOW_SIZE) {
    record.rollingWindow.shift();
  }

  return updated;
};

// =============================================
// DEGREE MASTERY (single degree tracking)
// =============================================

export const loadDegreeMasteryStore = (
  storageKey: string,
): DegreeMasteryStore => {
  if (typeof window === "undefined") return { version: 1, keys: {} };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as DegreeMasteryStore;
  } catch {
    // Corrupted data — start fresh
  }
  return { version: 1, keys: {} };
};

export const saveDegreeMasteryStore = (
  storageKey: string,
  store: DegreeMasteryStore,
): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(store));
};

export const isDegreeMastered = (record: DegreeRecord): boolean =>
  record.rollingWindow.length >= MIN_ATTEMPTS_FOR_MASTERY &&
  record.rollingWindow.filter(Boolean).length / record.rollingWindow.length >=
    MASTERY_THRESHOLD;

/**
 * Check if full mastery is valid for the current included degrees.
 * Full mastery only counts if every currently-included degree was part of the mastered set.
 */
export const isFullyMasteredForDegrees = (
  keyMastery: KeyDegreeMasteryData,
  includedDegrees: number[],
): boolean => {
  if (!keyMastery.fullyMasteredWith) return false;
  const masteredSet = new Set(keyMastery.fullyMasteredWith);
  return includedDegrees.every((d) => masteredSet.has(d));
};

const getOrCreateKeyDegreeMastery = (
  store: DegreeMasteryStore,
  key: Key,
): KeyDegreeMasteryData => {
  if (!store.keys[key]) {
    store.keys[key] = {
      degrees: {},
      fullyMasteredWith: null,
      consecutiveReviewErrors: 0,
    };
  }
  // Backfill fields that may be missing from old localStorage data
  const data = store.keys[key];
  if (data.fullyMasteredWith === undefined) data.fullyMasteredWith = null;
  if (data.consecutiveReviewErrors === undefined)
    data.consecutiveReviewErrors = 0;
  return data;
};

const getOrCreateDegreeRecord = (
  keyMastery: KeyDegreeMasteryData,
  degree: number,
): DegreeRecord => {
  const k = String(degree);
  if (!keyMastery.degrees[k]) {
    keyMastery.degrees[k] = { degree, attempts: 0, rollingWindow: [] };
  }
  return keyMastery.degrees[k];
};

/**
 * Returns active degrees to practice.
 * Pool max: 2 if no degrees mastered yet, 3 once any is mastered.
 * Priority: in-progress first, then random unstarted.
 */
export const getActiveDegrees = (
  keyMastery: KeyDegreeMasteryData,
  includedDegrees: number[],
): number[] => {
  const degreeSet = new Set(includedDegrees);
  const masteredCount = getMasteredDegrees(keyMastery, includedDegrees).length;
  const poolMax = masteredCount > 0 ? MAX_ACTIVE_DEGREES : 2;

  // In-progress: started but not mastered
  const inProgress: number[] = [];
  for (const [, record] of Object.entries(keyMastery.degrees)) {
    if (
      record.attempts > 0 &&
      !isDegreeMastered(record) &&
      degreeSet.has(record.degree)
    ) {
      inProgress.push(record.degree);
    }
  }

  const active = inProgress.slice(0, poolMax);

  if (active.length < poolMax) {
    // Fill with random unstarted degrees
    const activeSet = new Set(active);
    const masteredSet = new Set(
      Object.values(keyMastery.degrees)
        .filter((r) => isDegreeMastered(r) && degreeSet.has(r.degree))
        .map((r) => r.degree),
    );

    const unstarted = includedDegrees.filter(
      (d) => !activeSet.has(d) && !masteredSet.has(d),
    );

    // Shuffle unstarted for random selection
    for (let i = unstarted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unstarted[i], unstarted[j]] = [unstarted[j], unstarted[i]];
    }

    for (const d of unstarted) {
      if (active.length >= poolMax) break;
      active.push(d);
    }
  }

  return active;
};

export const getMasteredDegrees = (
  keyMastery: KeyDegreeMasteryData,
  includedDegrees: number[],
): number[] => {
  const degreeSet = new Set(includedDegrees);
  return Object.values(keyMastery.degrees)
    .filter((r) => isDegreeMastered(r) && degreeSet.has(r.degree))
    .map((r) => r.degree);
};

export const recordDegreeResult = (
  store: DegreeMasteryStore,
  key: Key,
  degree: number,
  correct: boolean,
): DegreeMasteryStore => {
  const updated = { ...store, keys: { ...store.keys } };
  const keyMastery = getOrCreateKeyDegreeMastery(updated, key);
  const record = getOrCreateDegreeRecord(keyMastery, degree);

  record.attempts++;
  record.rollingWindow.push(correct);
  if (record.rollingWindow.length > MASTERY_WINDOW_SIZE) {
    record.rollingWindow.shift();
  }

  // Check full mastery regression
  if (keyMastery.fullyMasteredWith && !correct) {
    keyMastery.consecutiveReviewErrors++;
    if (
      keyMastery.consecutiveReviewErrors >= FULL_MASTERY_REGRESSION_THRESHOLD
    ) {
      keyMastery.fullyMasteredWith = null;
      keyMastery.consecutiveReviewErrors = 0;
    }
  } else if (correct) {
    keyMastery.consecutiveReviewErrors = 0;
  }

  return updated;
};

// =============================================
// FINAL TEST LOGIC
// =============================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Check if all included degrees are individually mastered (ready for degree final test).
 */
export const allDegreesIndividuallyMastered = (
  keyMastery: KeyDegreeMasteryData,
  includedDegrees: number[],
): boolean => {
  const mastered = getMasteredDegrees(keyMastery, includedDegrees);
  return (
    mastered.length >= includedDegrees.length && includedDegrees.length > 0
  );
};

/**
 * Check if the degree final test should start automatically.
 */
export const shouldStartDegreeFinalTest = (
  keyMastery: KeyDegreeMasteryData,
  includedDegrees: number[],
): boolean =>
  !isFullyMasteredForDegrees(keyMastery, includedDegrees) &&
  allDegreesIndividuallyMastered(keyMastery, includedDegrees);

/**
 * Create a shuffled queue of all included degrees for the final test.
 */
export const createDegreeFinalTestQueue = (
  includedDegrees: number[],
): string[] => shuffle(includedDegrees).map(String);

/**
 * Check if all pairs are individually mastered for a melody mastery level.
 */
export const allPairsIndividuallyMastered = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
): boolean => {
  const allPairs = generatePairOrder(includedDegrees);
  const mastered = getMasteredPairs(keyMastery, includedDegrees);
  return mastered.length >= allPairs.length && allPairs.length > 0;
};

/**
 * Check if a melody final test at a given level should start.
 */
export const shouldStartMelodyFinalTest = (
  keyMastery: KeyMasteryData,
  includedDegrees: number[],
  level: number,
): boolean => {
  if (isLevelCompleteForDegrees(keyMastery, level, includedDegrees))
    return false; // already completed for current degrees

  if (level === 1) {
    return allPairsIndividuallyMastered(keyMastery, includedDegrees);
  } else {
    return allSequencesMasteredAtLevel(keyMastery, includedDegrees, level);
  }
};

/**
 * Generate all permutations of included degrees at a given melody length.
 * For level 1 (length 2): all pairs. For level 2 (length 3): all triples, etc.
 */
export const createMelodyFinalTestQueue = (
  includedDegrees: number[],
  melodyLength: number,
): string[] => {
  const permutations: string[] = [];

  const generate = (current: number[]) => {
    if (current.length === melodyLength) {
      permutations.push(current.join(","));
      return;
    }
    for (const d of includedDegrees) {
      if (current.length === 0 || d !== current[current.length - 1]) {
        generate([...current, d]);
      }
    }
  };

  generate([]);
  return shuffle(permutations);
};

/**
 * Get the current melody mastery level being worked on.
 * Returns the lowest uncompleted level starting from 1 (pairs = length 2).
 */
export const getCurrentMelodyMasteryLevel = (
  keyMastery: KeyMasteryData,
  includedDegrees?: number[],
): number => {
  let level = 1;
  if (includedDegrees) {
    while (isLevelCompleteForDegrees(keyMastery, level, includedDegrees))
      level++;
  } else {
    // Fallback: check any truthy value (backwards compat)
    const levels = keyMastery.melodyMasteryLevels ?? {};
    while (levels[level]) level++;
  }
  return level;
};

/**
 * Record melody full mastery regression.
 */
export const recordMelodyReviewResult = (
  keyMastery: KeyMasteryData,
  correct: boolean,
): void => {
  const hasAnyLevel = Object.values(keyMastery.melodyMasteryLevels ?? {}).some(
    (v) => v !== null && v !== undefined,
  );
  if (!hasAnyLevel) return;

  if (!correct) {
    keyMastery.consecutiveReviewErrors =
      (keyMastery.consecutiveReviewErrors ?? 0) + 1;
    if (
      keyMastery.consecutiveReviewErrors >= FULL_MASTERY_REGRESSION_THRESHOLD
    ) {
      // Revoke highest completed level
      const levels = keyMastery.melodyMasteryLevels ?? {};
      const completedLevels = Object.keys(levels)
        .map(Number)
        .filter((l) => levels[l] !== null && levels[l] !== undefined)
        .sort((a, b) => b - a);
      if (completedLevels.length > 0) {
        levels[completedLevels[0]] = null;
      }
      keyMastery.consecutiveReviewErrors = 0;
    }
  } else {
    keyMastery.consecutiveReviewErrors = 0;
  }
};
