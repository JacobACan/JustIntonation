import { ValueOf } from "next/dist/shared/lib/constants";
import { Note, NoteFile } from "../constants/notes";

export const noteToNoteFile = (note: ValueOf<Note>): NoteFile => {
  const noteFileKey = note as keyof typeof NoteFile;
  if (NoteFile[noteFileKey]) {
    return NoteFile[noteFileKey];
  }
  throw new Error(`No NoteFile found for note: ${note}`);
};

export const noteFileToNote = (noteFile: ValueOf<NoteFile>): ValueOf<Note> => {
  const noteKey = noteFile.toString().split(".")[0] as keyof typeof Note;
  if (Note[noteKey]) {
    return Note[noteKey];
  }
  throw new Error(`No Note found for noteFile: ${noteFile}`);
};
