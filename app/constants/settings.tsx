import { noteWeightsForScale } from "@/lib/key";
import { Key, NoteWeight } from "./keys";
import { Note } from "./notes";
import { Scale } from "./scale";

export enum LearningMode {
  Notes = "Notes",
  Melodies = "Melodies",
  Chords = "Chords",
}
export const LearningModeValues: LearningMode[] = Object.values(LearningMode);

export enum SkipReview {
  None,
  Correct,
  Both,
}

export interface Settings {
  questionRange: [Note, Note]; // The Range of notes that a musician is questioned on
  questionKeys: Key[]; // The keys that the questions are centered around
  questionScales: Scale[]; // The scales that the questions are centered around
  questionsInARow: number; // The number of questions answered correctly in a row to move on
  learningMode: LearningMode;
  chordSize: number; // If in chord mode, the size of the chords to be played
  showQuestionNotes: boolean;
  playCadence: boolean;
  cadenceVolume: number;
  numberOfQuestions: number;
  skipReviewOn: SkipReview;
  timeToAnswerQuestion: number; // in miliseconds
  melodyLength: number;
  pianoSoundMuted: boolean; // Whether to mute the sound from playing notes on the piano
  midiDevices: { [id: string]: { verified: boolean; id: string } };
}

export const defaultSettings: Settings = {
  questionRange: [Note.C4, Note.C5],
  questionKeys: [Key.C],
  questionScales: [Scale.major],
  questionsInARow: 30,
  learningMode: LearningMode.Notes,
  chordSize: 2,
  showQuestionNotes: true,
  playCadence: true,
  cadenceVolume: 0.8,
  numberOfQuestions: 5,
  skipReviewOn: SkipReview.Correct,
  timeToAnswerQuestion: 5000,
  melodyLength: 4,
  pianoSoundMuted: false,
  midiDevices: {},
};
