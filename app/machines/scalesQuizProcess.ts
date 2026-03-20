import { Key } from "@/constants/keys";
import {
  SCALES_MASTERY_STORAGE_KEY,
  DEGREE_MASTERY_STORAGE_KEY,
} from "@/constants/masteryConfig";
import { JIMIDINote, Note } from "@/constants/notes";
import {
  defaultScalesQuizSettings,
  ScalesQuizMode,
  ScalesQuizSettings,
} from "@/constants/scalesQuizSettings";
import { SkipReview } from "@/constants/settings";
import {
  loadMasteryStore,
  recordResult,
  saveMasteryStore,
  loadDegreeMasteryStore,
  recordDegreeResult,
  saveDegreeMasteryStore,
  createDegreeFinalTestQueue,
} from "@/lib/mastery";
import { playScalesQuizQuestion } from "@/lib/scalesQuizActors";
import {
  beginLearningPhaseAudio,
  playMelody,
  playNote,
  stopLearningPhaseAudio,
} from "@/lib/webAudio";
import { noteToNoteFile } from "@/lib/notes";
import { assign, fromPromise, setup } from "xstate";

export enum ScalesQuizEvent {
  START = "start",
  CONTINUE = "continue",
  REPLAY = "replay",
  CHANGE_SETTINGS = "change settings",
  CORRECT_GUESS = "correct guess",
  INCORRECT_GUESS = "incorrect guess",
  MELODY_NOTE_CORRECT = "melody note correct",
  UPDATE_SETTING = "update setting",
}

export enum ScalesQuizState {
  CONFIGURING = "configuring",
  IDLE = "idle",
  PLAYING_QUESTION = "playing question",
  GUESSING = "guessing",
  REVIEWING = "reviewing",
  VIEWING_RESULTS = "viewing results",
  WAITING_FOR_GUESS = "waiting for guess",
  REPLAYING_QUESTION = "replaying question",
}

type UpdateSettingEvent = {
  type: ScalesQuizEvent.UPDATE_SETTING;
  settings?: Partial<ScalesQuizSettings>;
};

type IncorrectGuessEvent = {
  type: ScalesQuizEvent.INCORRECT_GUESS;
  wrongIndex?: number;
  wrongNote?: Note;
};

export type ScalesQuizEvents =
  | { type: ScalesQuizEvent.START }
  | { type: ScalesQuizEvent.CONTINUE }
  | { type: ScalesQuizEvent.REPLAY }
  | { type: ScalesQuizEvent.CHANGE_SETTINGS }
  | { type: ScalesQuizEvent.CORRECT_GUESS }
  | IncorrectGuessEvent
  | { type: ScalesQuizEvent.MELODY_NOTE_CORRECT }
  | UpdateSettingEvent;

export interface ScalesQuestionContext {
  currentMelody: JIMIDINote[] | undefined;
  expectedAnswer: Note | undefined;
  expectedDegree: number | undefined; // semitone offset for degree mode
  userAnswer: Note | undefined;
  melodyProgress: number; // how many melody notes the user has played correctly so far
  melodyWrongIndex: number | undefined; // index in melody where the user played wrong
  melodyWrongNote: Note | undefined; // the wrong note the user played
  questionNumber: number;
  questionsCorrect: number;
  currentKey: Key;
  previousKey: Key | undefined;
  questionTime: number;
  numberOfReplays: number;
  isReplaying: boolean;
  currentDegreePairs: [number, number][] | undefined;
  finalTestActive: boolean;
  finalTestQueue: string[]; // items remaining to test (degree semitones or pair keys)
  finalTestProgress: number; // correct in current run
  finalTestTotal: number; // total items in the test
}

const defaultQuestionContext: ScalesQuestionContext = {
  currentMelody: undefined,
  expectedAnswer: undefined,
  expectedDegree: undefined,
  userAnswer: undefined,
  melodyProgress: 0,
  melodyWrongIndex: undefined,
  melodyWrongNote: undefined,
  questionNumber: 0,
  questionsCorrect: 0,
  currentKey: Key.C,
  previousKey: undefined,
  questionTime: 0,
  numberOfReplays: 0,
  isReplaying: false,
  currentDegreePairs: undefined,
  finalTestActive: false,
  finalTestQueue: [],
  finalTestProgress: 0,
  finalTestTotal: 0,
};

export interface ScalesQuizContext {
  settings: ScalesQuizSettings;
  questionContext: ScalesQuestionContext;
}

export const scalesQuizMachine = setup({
  types: {
    context: {} as ScalesQuizContext,
    events: {} as ScalesQuizEvents,
  },
  actors: {
    playQuestion: fromPromise(
      async ({ input }: { input: ScalesQuizContext }) => {
        return playScalesQuizQuestion(input);
      },
    ),
    replayQuestion: fromPromise(
      async ({ input }: { input: ScalesQuizContext }) => {
        if (input.questionContext.currentMelody) {
          await playMelody(input.questionContext.currentMelody);
        }
      },
    ),
  },
  actions: {
    stopLearningPhaseAudio: () => {
      stopLearningPhaseAudio();
    },
    initializeQuiz: (c) => {
      beginLearningPhaseAudio();
      c.context.questionContext = {
        currentMelody: undefined,
        expectedAnswer: undefined,
        expectedDegree: undefined,
        userAnswer: undefined,
        melodyProgress: 0,
        melodyWrongIndex: undefined,
        melodyWrongNote: undefined,
        questionNumber: 0,
        numberOfReplays: 0,
        isReplaying: false,
        questionsCorrect: 0,
        currentKey:
          c.context.settings.questionKeys[
            Math.floor(Math.random() * c.context.settings.questionKeys.length)
          ],
        previousKey: undefined,
        questionTime: 0,
        currentDegreePairs: undefined,
        finalTestActive: false,
        finalTestQueue: [],
        finalTestProgress: 0,
        finalTestTotal: 0,
      };
    },
    replayQuestion: (c) => {
      if (c.context.questionContext.currentMelody) {
        playMelody(c.context.questionContext.currentMelody);
      } else if (c.context.questionContext.expectedAnswer) {
        playNote(noteToNoteFile(c.context.questionContext.expectedAnswer));
      }
      c.context.questionContext.numberOfReplays++;
    },
    correctGuess: (c) => {
      c.context.questionContext.questionsCorrect++;
    },
    recordMasteryCorrect: (c) => {
      if (!c.context.settings.masteryMode) return;
      if (c.context.questionContext.currentDegreePairs) {
        // Melody mastery
        const store = loadMasteryStore(SCALES_MASTERY_STORAGE_KEY);
        const updated = recordResult(
          store,
          c.context.questionContext.currentKey,
          c.context.questionContext.currentDegreePairs,
          true,
          c.context.settings.includedDegrees,
        );
        saveMasteryStore(SCALES_MASTERY_STORAGE_KEY, updated);
      } else if (
        c.context.settings.quizMode === ScalesQuizMode.Degree &&
        c.context.questionContext.expectedDegree !== undefined
      ) {
        // Degree mastery
        const store = loadDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY);
        const updated = recordDegreeResult(
          store,
          c.context.questionContext.currentKey,
          c.context.questionContext.expectedDegree,
          true,
        );

        // Final test progress
        const qc = c.context.questionContext;
        if (qc.finalTestActive && qc.finalTestQueue.length > 0) {
          qc.finalTestQueue = qc.finalTestQueue.slice(1);
          qc.finalTestProgress++;
          // Check if final test is complete
          if (qc.finalTestQueue.length === 0) {
            const keyData = updated.keys[qc.currentKey] ?? {
              degrees: {},
              fullyMasteredWith: null,
              consecutiveReviewErrors: 0,
            };
            keyData.fullyMasteredWith = [...c.context.settings.includedDegrees];
            keyData.consecutiveReviewErrors = 0;
            updated.keys[qc.currentKey] = keyData;
            qc.finalTestActive = false;
          }
        }

        saveDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY, updated);
      }
    },
    recordMasteryIncorrect: (c) => {
      if (!c.context.settings.masteryMode) return;
      if (c.context.questionContext.currentDegreePairs) {
        // Melody mastery
        const store = loadMasteryStore(SCALES_MASTERY_STORAGE_KEY);
        const updated = recordResult(
          store,
          c.context.questionContext.currentKey,
          c.context.questionContext.currentDegreePairs,
          false,
          c.context.settings.includedDegrees,
        );
        saveMasteryStore(SCALES_MASTERY_STORAGE_KEY, updated);
      } else if (
        c.context.settings.quizMode === ScalesQuizMode.Degree &&
        c.context.questionContext.expectedDegree !== undefined
      ) {
        // Degree mastery
        const store = loadDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY);
        const updated = recordDegreeResult(
          store,
          c.context.questionContext.currentKey,
          c.context.questionContext.expectedDegree,
          false,
        );

        // Final test: one wrong resets everything
        const qc = c.context.questionContext;
        if (qc.finalTestActive) {
          qc.finalTestQueue = createDegreeFinalTestQueue(
            c.context.settings.includedDegrees,
          );
          qc.finalTestProgress = 0;
        }

        saveDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY, updated);
      }
    },
  },
  delays: {
    answerTime: (ctx) =>
      ctx.context.settings.timeToAnswerQuestion +
      ctx.context.questionContext.questionTime * 2,
  },
}).createMachine({
  id: "scalesQuizMachine",
  context: {
    settings: defaultScalesQuizSettings,
    questionContext: defaultQuestionContext,
  },
  initial: ScalesQuizState.CONFIGURING,
  states: {
    [ScalesQuizState.CONFIGURING]: {
      entry: "stopLearningPhaseAudio",
      on: {
        [ScalesQuizEvent.START]: {
          target: ScalesQuizState.IDLE,
          actions: "initializeQuiz",
        },
        [ScalesQuizEvent.UPDATE_SETTING]: {
          actions: assign({
            settings: (c) => ({
              ...c.context.settings,
              ...c.event.settings,
            }),
          }),
          target: ScalesQuizState.CONFIGURING,
        },
      },
    },
    [ScalesQuizState.IDLE]: {
      on: {
        [ScalesQuizEvent.START]: {
          target: ScalesQuizState.PLAYING_QUESTION,
        },
        [ScalesQuizEvent.CHANGE_SETTINGS]: {
          target: ScalesQuizState.CONFIGURING,
        },
      },
    },
    [ScalesQuizState.PLAYING_QUESTION]: {
      on: {
        [ScalesQuizEvent.CHANGE_SETTINGS]: {
          target: ScalesQuizState.CONFIGURING,
        },
        [ScalesQuizEvent.CONTINUE]: {
          target: ScalesQuizState.GUESSING,
        },
      },
      invoke: {
        id: "playQuestion",
        src: "playQuestion",
        input: (stateMachine) => stateMachine.context,
        onDone: { target: ScalesQuizState.GUESSING },
      },
    },
    [ScalesQuizState.GUESSING]: {
      initial: ScalesQuizState.WAITING_FOR_GUESS,
      after: {
        answerTime: {
          target: ScalesQuizState.REVIEWING,
        },
      },
      entry: (s) => {
        s.context.questionContext.numberOfReplays = 0;
        s.context.questionContext.melodyProgress = 0;
        s.context.questionContext.melodyWrongIndex = undefined;
        s.context.questionContext.melodyWrongNote = undefined;
      },
      on: {
        [ScalesQuizEvent.MELODY_NOTE_CORRECT]: {
          actions: assign({
            questionContext: ({ context }) => ({
              ...context.questionContext,
              melodyProgress: context.questionContext.melodyProgress + 1,
            }),
          }),
        },
        [ScalesQuizEvent.CORRECT_GUESS]: [
          {
            target: ScalesQuizState.PLAYING_QUESTION,
            guard: (stmch) =>
              (stmch.context.settings.skipReviewOn === SkipReview.Both ||
                stmch.context.settings.skipReviewOn === SkipReview.Correct) &&
              stmch.context.questionContext.questionNumber <
                stmch.context.settings.numberOfQuestions - 1,
            actions: ["correctGuess", "recordMasteryCorrect"],
          },
          {
            target: ScalesQuizState.VIEWING_RESULTS,
            guard: (stmch) =>
              (stmch.context.settings.skipReviewOn === SkipReview.Both ||
                stmch.context.settings.skipReviewOn === SkipReview.Correct) &&
              stmch.context.questionContext.questionNumber >=
                stmch.context.settings.numberOfQuestions - 1,
            actions: ["correctGuess", "recordMasteryCorrect"],
          },
          {
            target: ScalesQuizState.REVIEWING,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.None,
            actions: ["correctGuess", "recordMasteryCorrect"],
          },
        ],
        [ScalesQuizEvent.INCORRECT_GUESS]: [
          {
            target: ScalesQuizState.REVIEWING,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.None ||
              stmch.context.settings.skipReviewOn === SkipReview.Correct,
            actions: [
              "recordMasteryIncorrect",
              assign({
                questionContext: ({ context, event }) => ({
                  ...context.questionContext,
                  melodyWrongIndex: (event as IncorrectGuessEvent).wrongIndex,
                  melodyWrongNote: (event as IncorrectGuessEvent).wrongNote,
                }),
              }),
            ],
          },
          {
            target: ScalesQuizState.PLAYING_QUESTION,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.Both &&
              stmch.context.questionContext.questionNumber <
                stmch.context.settings.numberOfQuestions - 1,
            actions: "recordMasteryIncorrect",
          },
          {
            target: ScalesQuizState.VIEWING_RESULTS,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.Both &&
              stmch.context.questionContext.questionNumber >=
                stmch.context.settings.numberOfQuestions - 1,
            actions: "recordMasteryIncorrect",
          },
        ],
        [ScalesQuizEvent.CHANGE_SETTINGS]: {
          target: ScalesQuizState.CONFIGURING,
        },
      },
      exit: (c) => {
        c.context.questionContext.questionNumber++;
      },
      states: {
        [ScalesQuizState.REPLAYING_QUESTION]: {
          invoke: {
            src: "replayQuestion",
            input: (s) => s.context,
            onDone: { target: ScalesQuizState.WAITING_FOR_GUESS },
          },
          entry: (s) => {
            s.context.questionContext.numberOfReplays++;
            s.context.questionContext.isReplaying = true;
          },
          exit: (s) => {
            s.context.questionContext.isReplaying = false;
          },
        },
        [ScalesQuizState.WAITING_FOR_GUESS]: {
          on: {
            [ScalesQuizEvent.REPLAY]: {
              target: ScalesQuizState.REPLAYING_QUESTION,
            },
          },
        },
      },
    },
    [ScalesQuizState.REVIEWING]: {
      entry: (s) => {
        // Reset melody progress so user can replay the full melody in review
        s.context.questionContext.melodyProgress = 0;
      },
      on: {
        [ScalesQuizEvent.MELODY_NOTE_CORRECT]: {
          actions: assign({
            questionContext: ({ context }) => ({
              ...context.questionContext,
              melodyProgress: context.questionContext.melodyProgress + 1,
            }),
          }),
        },
        [ScalesQuizEvent.CONTINUE]: [
          {
            target: ScalesQuizState.VIEWING_RESULTS,
            guard: (c) =>
              c.context.settings.numberOfQuestions ===
              c.context.questionContext.questionNumber,
          },
          {
            target: ScalesQuizState.PLAYING_QUESTION,
            guard: (c) =>
              c.context.questionContext.questionNumber <=
              c.context.settings.numberOfQuestions,
          },
        ],
        [ScalesQuizEvent.CORRECT_GUESS]: [
          {
            target: ScalesQuizState.VIEWING_RESULTS,
            guard: (c) =>
              c.context.settings.numberOfQuestions ===
              c.context.questionContext.questionNumber,
          },
          {
            target: ScalesQuizState.PLAYING_QUESTION,
            guard: (c) =>
              c.context.questionContext.questionNumber <=
              c.context.settings.numberOfQuestions,
          },
        ],
        [ScalesQuizEvent.CHANGE_SETTINGS]: {
          target: ScalesQuizState.CONFIGURING,
        },
        [ScalesQuizEvent.REPLAY]: {
          actions: [
            "replayQuestion",
            assign({
              questionContext: ({ context }) => ({
                ...context.questionContext,
                numberOfReplays: context.questionContext.numberOfReplays + 1,
              }),
            }),
          ],
          reenter: true,
        },
      },
    },
    [ScalesQuizState.VIEWING_RESULTS]: {
      on: {
        [ScalesQuizEvent.CONTINUE]: {
          target: ScalesQuizState.PLAYING_QUESTION,
          actions: "initializeQuiz",
        },
        [ScalesQuizEvent.CHANGE_SETTINGS]: {
          target: ScalesQuizState.CONFIGURING,
        },
      },
      entry: "stopLearningPhaseAudio",
    },
  },
});
