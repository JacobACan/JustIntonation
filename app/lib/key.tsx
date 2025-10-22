import { Key, NoteWeight } from "../constants/keys";
import { keyToMidi, midiNotesValues, noteToMidi } from "../constants/midi";
import { midiToNote, Note } from "../constants/notes";
import { Scale, scaleToInterval } from "../constants/scale";

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
