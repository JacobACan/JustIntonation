import { Note } from "./notes";

export enum Key {
  Ab = "Ab",
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

export const KeyToFrequency: { [key: string]: number } = {
  [Key.C]: 261.63,
  [Key.Db]: 277.18,
  [Key.D]: 293.66,
  [Key.Eb]: 311.13,
  [Key.E]: 329.63,
  [Key.F]: 349.23,
  [Key.B]: 246.94,
  [Key.Bb]: 233.08,
  [Key.A]: 220.0,
  [Key.Ab]: 207.65,
  [Key.G]: 196.0,
  [Key.Gb]: 185.0,
};

export interface NoteWeight {
  note: Note;
  weight: 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;
}
