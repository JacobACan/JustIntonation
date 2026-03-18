import { Key } from "./keys";
import { Interval } from "./intervals";
import { SkipReview } from "./settings";

export enum ScalesQuizMode {
  Melody = "Melody",
  Degree = "Degree",
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
}

export const defaultScalesQuizSettings: ScalesQuizSettings = {
  quizMode: ScalesQuizMode.Melody,
  questionKeys: [Key.C],
  startingDegree: 0,
  octaves: 1,
  contextPhraseSpeed: 0.15,
  melodyLength: 4,
  numberOfQuestions: 10,
  timeToAnswerQuestion: 8000,
  skipReviewOn: SkipReview.Correct,
  melodyIntervalMin: Interval.HALF_STEP,
  melodyIntervalMax: Interval.PERFECT_FIFTH,
  pianoSoundEnabled: true,
};
