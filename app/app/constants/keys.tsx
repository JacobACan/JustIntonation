import { midiNotesValues, midiToNote, Note, noteToMidi } from "./notes";

export enum Key {
  A = "A",
  Bb = "Bb",
  B = "B",
  C = "C",
  Db = "Db",
  D = "D",
  Eb = "Eb",
  E = "E",
  F = "F",
  Gb = "Gb",
  G = "G",
}

const WHOLE_STEP = 2;
const HALF_STEP = 1;

const keyToMidi = {
  [Key.C]: noteToMidi[Note.C1],
  [Key.Db]: noteToMidi[Note.Db1],
  [Key.D]: noteToMidi[Note.D1],
  [Key.Eb]: noteToMidi[Note.Eb1],
  [Key.E]: noteToMidi[Note.E1],
  [Key.F]: noteToMidi[Note.F1],
  [Key.Gb]: noteToMidi[Note.Gb1],
  [Key.G]: noteToMidi[Note.G1],
  [Key.A]: noteToMidi[Note.A0],
  [Key.Bb]: noteToMidi[Note.Bb0],
  [Key.B]: noteToMidi[Note.B0],
};

export enum Scale {
  major = "major",
  minor = "minor",
  harmonicMinor = "harmonicMinor",
  melodicMinor = "melodicMinor",
}

const scaleToInterval = {
  [Scale.major]: [
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
  ],
  [Scale.minor]: [
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
  ],
  [Scale.harmonicMinor]: [
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP + HALF_STEP,
    HALF_STEP,
  ],
  [Scale.melodicMinor]: [
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
  ],
};

export interface NoteWeight {
  note: Note;
  weight: 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;
}

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
