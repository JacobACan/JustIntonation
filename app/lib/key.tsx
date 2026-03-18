import { Key, NoteWeight } from "../constants/keys";
import { keyToMidi, midiNotesValues, noteToMidi } from "../constants/midi";
import { midiToNote, Note } from "../constants/notes";
import { Scale, scaleToInterval } from "../constants/scale";

/**
 * Given a parent key and a starting degree (mode), returns the Key
 * corresponding to the root note of that mode.
 * E.g. key=C, startingDegree=2 (Phrygian) → E
 */
export const getModeRootKey = (key: Key, scale: Scale, startingDegree: number): Key => {
  const intervals = scaleToInterval[scale];
  // Sum intervals from root to the starting degree to get semitone offset
  let semitoneOffset = 0;
  for (let i = 0; i < startingDegree; i++) {
    semitoneOffset += intervals[i % intervals.length];
  }
  // Get the root midi value and add offset, then map to a Key
  const rootMidi = keyToMidi[key];
  const modeRootPitchClass = (rootMidi + semitoneOffset) % 12;

  const pitchClassToKey: { [pc: number]: Key } = {};
  for (const k of Object.values(Key)) {
    pitchClassToKey[keyToMidi[k] % 12] = k;
  }
  return pitchClassToKey[modeRootPitchClass] ?? key;
};

export const noteWeightsForScaleDegrees = (
  key: Key,
  scale: Scale,
  degrees: number[],
): NoteWeight[] => {
  const allWeights = noteWeightsForScale(key, scale);
  const scaleLength = scaleToInterval[scale].length;

  const selectedMidiValues = new Set<number>();
  let degreeIndex = 0;

  for (const nw of allWeights) {
    if (nw.weight > 0) {
      if (degrees.includes(degreeIndex % scaleLength)) {
        selectedMidiValues.add(noteToMidi[nw.note]);
      }
      degreeIndex++;
    }
  }

  return allWeights.map((nw) => ({
    note: nw.note,
    weight: selectedMidiValues.has(noteToMidi[nw.note])
      ? (1 as const)
      : (0 as const),
  }));
};

/**
 * Computes the display range for the piano based on a key, starting degree, and octave count.
 * Returns [firstNote, lastNote] where both are scale degrees in the given key.
 * The starting degree selects which mode of the scale to begin on.
 * Anchors around octave 4.
 */
export const getScaleDisplayRange = (
  key: Key,
  scale: Scale,
  startingDegree: number,
  octaves: 1 | 2,
): [Note, Note] => {
  const allWeights = noteWeightsForScale(key, scale);
  const scaleNotes = allWeights
    .filter((nw) => nw.weight > 0)
    .map((nw) => nw.note);

  // Find the starting degree note closest to octave 4 (midi ~60)
  const scaleLength = scaleToInterval[scale].length;
  const targetMidi = 60; // C4 area

  let bestStartIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < scaleNotes.length; i++) {
    if (i % scaleLength === startingDegree) {
      const dist = Math.abs(noteToMidi[scaleNotes[i]] - targetMidi);
      if (dist < bestDist) {
        bestDist = dist;
        bestStartIdx = i;
      }
    }
  }

  // The end note is the same degree, octaves * scaleLength steps later
  const endIdx = bestStartIdx + octaves * scaleLength;
  const clampedEnd = Math.min(endIdx, scaleNotes.length - 1);

  return [scaleNotes[bestStartIdx], scaleNotes[clampedEnd]];
};

export const noteWeightsForScale = (key: Key, scale: Scale): NoteWeight[] => {
  const noteWeights: NoteWeight[] = midiNotesValues.map((midiValue) => ({
    note: midiToNote[midiValue],
    weight: 0,
  }));
  const scaleIntervals = scaleToInterval[scale];
  let i = 0;
  let j = 0;
  // Loop through all notes from A0 to C8
  while (
    i < noteWeights.length &&
    noteToMidi[noteWeights[i].note] < noteToMidi[Note.C8]
  ) {
    const currentNoteMidiValue = noteToMidi[noteWeights[i].note];
    // Starting from the key, apply the scale intervals
    if (currentNoteMidiValue >= keyToMidi[key]) {
      // Set weight to 1 for notes in the scale
      noteWeights[i] = { note: midiToNote[currentNoteMidiValue], weight: 1 };
      // Move to the next note in the scale
      i += scaleIntervals[j];
      // Loop through scale intervals
      j = (j + 1) % scaleIntervals.length;
    } else {
      // Reach the first note of the scale
      i++;
    }
  }
  return noteWeights;
};
