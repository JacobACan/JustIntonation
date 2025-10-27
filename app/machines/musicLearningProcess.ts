import {
  defaultSettings,
  LearningMode,
  Settings,
  SkipReview,
} from "@/components/providers/settingsProvider";
import {
  ActorRef,
  ActorRefFrom,
  assign,
  fromPromise,
  setup,
  transition,
} from "xstate";

export enum MusicLearnerEvent {
  START = "start",
  CONTINUE = "continue",
  REPLAY = "replay",
  CHANGE_LEARNING_APPROACH = "change learning approach",
  CORRECT_GUESS = "correct guess",
  INCORRECT_GUESS = "incorrect guess",
}

export enum MusicLearnerState {
  IDLE = "idle",
  SELECTING_LEARNING_APPROACH = "select learning approach",
  PLAYING_MUSIC_CONTEXT = "playing music context",
  PLAYING_NEW_QUESTION = "playing question",
  GUESSING = "guessing",
  REVIEWING = "reviewing",
  VIEWING_RESULTS = "viewing results",
  WAITING_FOR_GUESS = "waiting for guess",
  REPLAYING_QUESTION = "replaying question",
}

export type MusicLearnerEvents =
  | { type: MusicLearnerEvent.START }
  | { type: MusicLearnerEvent.CONTINUE }
  | { type: MusicLearnerEvent.REPLAY }
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
    replayQuestion: fromPromise(async ({ input }: { input: Settings }) => {
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
    answerTime: (ctx) => ctx.context.timeToAnswerQuestion,
  },
}).createMachine({
  id: "musicLearningMachine",
  context: defaultSettings,
  initial: MusicLearnerState.SELECTING_LEARNING_APPROACH,
  states: {
    [MusicLearnerState.SELECTING_LEARNING_APPROACH]: {
      on: { [MusicLearnerEvent.START]: { target: "idle" } },
    },
    [MusicLearnerState.IDLE]: {
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
        onDone: { target: MusicLearnerState.PLAYING_NEW_QUESTION },
      },
    },
    [MusicLearnerState.PLAYING_NEW_QUESTION]: {
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
      initial: MusicLearnerState.WAITING_FOR_GUESS,
      after: {
        answerTime: {
          target: MusicLearnerState.REVIEWING,
        },
      },
      on: {
        [MusicLearnerEvent.CORRECT_GUESS]: [
          {
            target: MusicLearnerState.PLAYING_NEW_QUESTION,
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
            target: MusicLearnerState.PLAYING_NEW_QUESTION,
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
        console.log(
          `Question ${c.context.questionNumber} / ${c.context.numberOfQuestions}`
        );
      },
      states: {
        [MusicLearnerState.REPLAYING_QUESTION]: {
          on: {
            [MusicLearnerEvent.REPLAY]: {
              target: MusicLearnerState.REPLAYING_QUESTION,
            },
          },
          invoke: {
            src: "replayQuestion",
            input: (s) => s.context,
            onDone: { target: MusicLearnerState.WAITING_FOR_GUESS },
          },
        },
        [MusicLearnerState.WAITING_FOR_GUESS]: {
          on: {
            [MusicLearnerEvent.REPLAY]: {
              target: MusicLearnerState.REPLAYING_QUESTION,
            },
          },
        },
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
            target: MusicLearnerState.PLAYING_NEW_QUESTION,
            guard: (c) =>
              c.context.questionNumber <= c.context.numberOfQuestions,
          },
        ],
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
          actions: "stopAllAudio",
        },
      },
    },
    [MusicLearnerState.VIEWING_RESULTS]: {
      on: {
        [MusicLearnerEvent.CONTINUE]: {
          target: MusicLearnerState.PLAYING_MUSIC_CONTEXT,
        },
      },
      entry: "stopAllAudio",
    },
  },
});
