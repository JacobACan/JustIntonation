import { Key } from "@/constants/keys";
import { JIMIDINote, Note } from "@/constants/notes";
import {
  defaultScalesQuizSettings,
  ScalesQuizSettings,
} from "@/constants/scalesQuizSettings";
import { SkipReview } from "@/constants/settings";
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
            Math.floor(
              Math.random() * c.context.settings.questionKeys.length,
            )
          ],
        previousKey: undefined,
        questionTime: 0,
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
            actions: "correctGuess",
          },
          {
            target: ScalesQuizState.VIEWING_RESULTS,
            guard: (stmch) =>
              (stmch.context.settings.skipReviewOn === SkipReview.Both ||
                stmch.context.settings.skipReviewOn === SkipReview.Correct) &&
              stmch.context.questionContext.questionNumber >=
                stmch.context.settings.numberOfQuestions - 1,
            actions: "correctGuess",
          },
          {
            target: ScalesQuizState.REVIEWING,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.None,
          },
        ],
        [ScalesQuizEvent.INCORRECT_GUESS]: [
          {
            target: ScalesQuizState.REVIEWING,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.None ||
              stmch.context.settings.skipReviewOn === SkipReview.Correct,
            actions: assign({
              questionContext: ({ context, event }) => ({
                ...context.questionContext,
                melodyWrongIndex: (event as IncorrectGuessEvent).wrongIndex,
                melodyWrongNote: (event as IncorrectGuessEvent).wrongNote,
              }),
            }),
          },
          {
            target: ScalesQuizState.PLAYING_QUESTION,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.Both &&
              stmch.context.questionContext.questionNumber <
                stmch.context.settings.numberOfQuestions - 1,
          },
          {
            target: ScalesQuizState.VIEWING_RESULTS,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn === SkipReview.Both &&
              stmch.context.questionContext.questionNumber >=
                stmch.context.settings.numberOfQuestions - 1,
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
