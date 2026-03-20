import { Key } from "./keys";
import { Interval } from "./intervals";
import { SkipReview } from "./settings";

export enum ScalesQuizMode {
  Degree = "Degree",
  Melody = "Melody",
}

export interface ScalesQuizSettings {
  quizMode: ScalesQuizMode;
  questionKeys: Key[];
  startingDegree: number; // 0-6, the mode/starting degree of the scale display
  octaves: 1 | 2; // number of octaves to display
  contextPhraseSpeed: number; // seconds per note in the key context phrase
  melodyLength: number;
  numberOfQuestions: number;
  timeToAnswerQuestion: number; // in milliseconds
  skipReviewOn: SkipReview;
  melodyIntervalMin: Interval;
  melodyIntervalMax: Interval;
  pianoSoundEnabled: boolean;
  includedDegrees: number[]; // semitone offsets from root (0-11) to include in degree mode
  playDegreeAudio: boolean; // in degree mode, play the target note as audio
  masteryMode: boolean; // progressive mastery tracking for melody and degree modes
  masteryReviewFrequency: number; // every Nth question reviews a mastered item (0 = never)
}

// All 12 chromatic degrees with labels
export const DEGREE_OPTIONS: { semitone: number; label: string }[] = [
  { semitone: 0, label: "1" },
  { semitone: 1, label: "b2" },
  { semitone: 2, label: "2" },
  { semitone: 3, label: "b3" },
  { semitone: 4, label: "3" },
  { semitone: 5, label: "4" },
  { semitone: 6, label: "b5" },
  { semitone: 7, label: "5" },
  { semitone: 8, label: "b6" },
  { semitone: 9, label: "6" },
  { semitone: 10, label: "b7" },
  { semitone: 11, label: "7" },
];

export const defaultScalesQuizSettings: ScalesQuizSettings = {
  quizMode: ScalesQuizMode.Degree,
  questionKeys: [Key.F], // Shape 6
  startingDegree: 0,
  octaves: 2,
  contextPhraseSpeed: 0.15,
  melodyLength: 4,
  numberOfQuestions: 10,
  timeToAnswerQuestion: 4000,
  skipReviewOn: SkipReview.Correct,
  melodyIntervalMin: Interval.HALF_STEP,
  melodyIntervalMax: Interval.PERFECT_FIFTH,
  pianoSoundEnabled: true,
  includedDegrees: [0, 2, 4, 5, 7, 9, 11], // major scale degrees by default
  playDegreeAudio: true,
  masteryMode: false,
  masteryReviewFrequency: 3, // review a mastered item every 3rd question
};
