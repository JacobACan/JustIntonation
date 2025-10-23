import {
  defaultSettings,
  LearningMode,
  Settings,
  SkipReview,
} from "@/components/providers/settingsProvider";
import { fromPromise, setup } from "xstate";

export enum MusicLearnerEvent {
  START = "start",
  CONTINUE = "cont",
  CHOOSE_MODE = "chsemode",
  CHANGE_LEARNING_APPROACH = "chnglrnapprch",
  CORRECT_GUESS = "crctgs",
  INCORRECT_GUESS = "incrctgs",
}

export enum MusicLearnerState {
  SELECTING_LEARNING_APPROACH = "slapp",
  PLAYING_MUSIC_CONTEXT = "plymsccntx",
  PLAYING_QUESTION = "plynqstn",
  GUESSING = "gsing",
  REVIEWING = "rvwing",
  VIEWING_RESULTS = "vwingrslts",
}

export type MusicLearnerEvents =
  | { type: MusicLearnerEvent.START }
  | { type: MusicLearnerEvent.CONTINUE }
  | { type: MusicLearnerEvent.CHOOSE_MODE }
  | { type: MusicLearnerEvent.CHANGE_LEARNING_APPROACH }
  | { type: MusicLearnerEvent.CORRECT_GUESS }
  | { type: MusicLearnerEvent.INCORRECT_GUESS };

export const musicLearner = setup({
  types: {
    context: {} as Settings,
    events: {} as MusicLearnerEvents,
  },
  actors: {
    playMusicContext: fromPromise(async ({ input }: { input: Settings }) => {
      switch (input.learningMode) {
        case LearningMode.Notes:
          break;
        case LearningMode.Chords:
          break;
        case LearningMode.Melodies:
          break;
      }
      return;
    }),
    playQuestion: fromPromise(async ({ input }: { input: Settings }) => {
      switch (input.learningMode) {
        case LearningMode.Notes:
          break;
        case LearningMode.Chords:
          break;
        case LearningMode.Melodies:
          break;
      }
      return;
    }),
  },
  actions: {
    stopAllAudio: () => {},
  },
  delays: {
    timeToAnswer: (stateMachine) => stateMachine.context.timeToAnswerQuestion,
  },
  guards: {},
}).createMachine({
  id: "musicLearningMachine",
  context: defaultSettings,
  initial: MusicLearnerState.SELECTING_LEARNING_APPROACH,
  states: {
    [MusicLearnerState.SELECTING_LEARNING_APPROACH]: {
      on: { [MusicLearnerEvent.CHOOSE_MODE]: { target: "idle" } },
    },
    idle: {
      on: {
        [MusicLearnerEvent.START]: {
          target: MusicLearnerState.PLAYING_MUSIC_CONTEXT,
        },
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
        },
      },
    },
    [MusicLearnerState.PLAYING_MUSIC_CONTEXT]: {
      on: {
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
          actions: "stopAllAudio",
        },
      },
      invoke: {
        id: "playMusicContext",
        src: "playMusicContext",
        input: (stateMachine) => stateMachine.context,
        onDone: { target: MusicLearnerState.PLAYING_QUESTION },
      },
    },
    [MusicLearnerState.PLAYING_QUESTION]: {
      on: {
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
          actions: "stopAllAudio",
        },
      },
      invoke: {
        id: "playQuestion",
        src: "playQuestion",
        input: (stateMachine) => stateMachine.context,
        onDone: { target: MusicLearnerState.GUESSING },
      },
    },
    [MusicLearnerState.GUESSING]: {
      after: { timeToAnswer: { target: MusicLearnerState.REVIEWING } },
      on: {
        [MusicLearnerEvent.CORRECT_GUESS]: [
          {
            target: MusicLearnerState.PLAYING_QUESTION,
            guard: (stmch) =>
              stmch.context.skipReviewOn == SkipReview.Both ||
              stmch.context.skipReviewOn == SkipReview.Correct,
          },
          {
            target: MusicLearnerState.REVIEWING,
            guard: (stmch) => stmch.context.skipReviewOn == SkipReview.None,
          },
        ],
        [MusicLearnerEvent.INCORRECT_GUESS]: [
          { target: MusicLearnerState.REVIEWING },
          {
            target: MusicLearnerState.PLAYING_QUESTION,
            guard: (stmch) => stmch.context.skipReviewOn == SkipReview.Both,
          },
        ],
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
          actions: "stopAllAudio",
        },
      },
      exit: (c) => {
        c.context.questionNumber++;
      },
    },
    [MusicLearnerState.REVIEWING]: {
      on: {
        [MusicLearnerEvent.CONTINUE]: [
          {
            target: MusicLearnerState.VIEWING_RESULTS,
            guard: (c) =>
              c.context.numberOfQuestions == c.context.questionNumber,
            actions: "stopAllAudio",
          },
          {
            target: MusicLearnerState.PLAYING_QUESTION,
            guard: (c) =>
              c.context.numberOfQuestions <= c.context.questionNumber,
          },
        ],
        on: {
          CHANGE_LEARNING_APPROACH: {
            target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
            actions: "stopAllAudio",
          },
        },
      },
    },
    veiwingResults: {
      on: {
        [MusicLearnerEvent.CONTINUE]: {
          target: MusicLearnerState.PLAYING_MUSIC_CONTEXT,
        },
      },
      entry: "stopAllAudio",
    },
  },
});
