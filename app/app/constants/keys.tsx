import { Note } from "./notes";

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

export interface NoteWeight {
  note: Note;
  weight: 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;
}
