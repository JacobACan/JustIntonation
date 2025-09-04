import { Key } from "./keys";

export enum cadenceFiles {
  A4 = "A4.ogg",
  Ab4 = "Ab4.ogg",
  B4 = "B4.ogg",
  Bb4 = "Bb4.ogg",
  C4 = "C4.ogg",
  D4 = "D4.ogg",
  Db4 = "Db4.ogg",
  E4 = "E4.ogg",
  Eb4 = "Eb4.ogg",
  F4 = "F4.ogg",
  G4 = "G4.ogg",
  Gb4 = "Gb4.ogg",
}

export const keyToCadence: { [key in Key]: cadenceFiles } = {
  [Key.A]: cadenceFiles.A4,
  [Key.B]: cadenceFiles.B4,
  [Key.Bb]: cadenceFiles.Bb4,
  [Key.C]: cadenceFiles.C4,
  [Key.D]: cadenceFiles.D4,
  [Key.Db]: cadenceFiles.Db4,
  [Key.E]: cadenceFiles.E4,
  [Key.Eb]: cadenceFiles.Eb4,
  [Key.F]: cadenceFiles.F4,
  [Key.G]: cadenceFiles.G4,
  [Key.Gb]: cadenceFiles.Gb4,
};
