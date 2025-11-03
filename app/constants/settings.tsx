import { noteWeightsForScale } from "@/lib/key";
import { Key, NoteWeight } from "./keys";
import { Note } from "./notes";
import { Scale } from "./scale";

export enum LearningMode {
  Notes = "Notes",
  Chords = "Chords",
  Melodies = "Melodies",
}

export enum SkipReview {
  None,
  Correct,
  Both,
}

export interface Settings {
  questionRange: [Note, Note]; // The Range of notes that a musician is questioned on
  questionKey: Key; // The key that the questions are centered around
  questionScale: Scale; // The scale that the questions are centered around
  questionNoteWeights: NoteWeight[]; // The notes that the musician is questioned on.  If the weight is higher, the note is more likely to be chosen.
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
}

export const defaultSettings: Settings = {
  questionRange: [Note.C4, Note.C5],
  questionKey: Key.C,
  questionScale: Scale.major,
  questionNoteWeights: noteWeightsForScale(Key.C, Scale.major),
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
};
