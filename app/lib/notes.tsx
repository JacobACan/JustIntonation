import { ValueOf } from "next/dist/shared/lib/constants";
import { Note, NoteFile } from "../constants/notes";
import { noteToMidi } from "../constants/midi";
import { OCTAVE } from "../constants/intervals";

export const noteToNoteFile = (note: ValueOf<Note>): NoteFile => {
  const noteFileKey = note as keyof typeof NoteFile;
  if (NoteFile[noteFileKey]) {
    return NoteFile[noteFileKey];
  }
  return NoteFile.null;
};

export const noteFileToNote = (noteFile: ValueOf<NoteFile>): ValueOf<Note> => {
  const noteKey = noteFile.toString().split(".")[0] as keyof typeof Note;
  if (Note[noteKey]) {
    return Note[noteKey];
  }
  throw new Error(`No Note found for noteFile: ${noteFile}`);
};

export const isNoteToBeAddedPlayableBy1Hand = (
  randomNote: Note,
  selectedNotes: Note[],
) => {
  return selectedNotes.every((n) => {
    const curSelectedNoteMidi = noteToMidi[n];
    const randomNoteMidi = noteToMidi[randomNote];
    const min = curSelectedNoteMidi - OCTAVE;
    const max = curSelectedNoteMidi + OCTAVE;
    // Human hand comfortably spreads an octave accross a keyboard and cannot play 2 of the same note at the same time
    return (
      randomNoteMidi >= min &&
      randomNoteMidi <= max &&
      randomNoteMidi != curSelectedNoteMidi
    );
  });
};
