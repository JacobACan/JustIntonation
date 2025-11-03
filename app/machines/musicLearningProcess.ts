import { JIMIDINote, Note } from "@/constants/notes";
import {
  defaultSettings,
  LearningMode,
  Settings,
  SkipReview,
} from "@/constants/settings";
import { playMusicContext, playQuestion } from "@/lib/learningProcessActors";
import { noteToNoteFile } from "@/lib/notes";
import {
  beginLearningPhaseAudio,
  playChord,
  playMelody,
  playNote,
  stopLearningPhaseAudio,
} from "@/lib/webAudio";
import { assign, fromPromise, setup } from "xstate";

export enum MusicLearnerEvent {
  START = "start",
  CONTINUE = "continue",
  REPLAY = "replay",
  CHANGE_LEARNING_APPROACH = "change learning approach",
  CORRECT_GUESS = "correct guess",
  INCORRECT_GUESS = "incorrect guess",
  UPDATE_SETTING = "update setting",
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

type UpdateSettingEvent<K extends keyof Settings = keyof Settings> = {
  type: MusicLearnerEvent.UPDATE_SETTING;
  key?: K;
  value?: Settings[K];
};

export type MusicLearnerEvents =
  | { type: MusicLearnerEvent.START }
  | { type: MusicLearnerEvent.CONTINUE }
  | { type: MusicLearnerEvent.REPLAY }
  | { type: MusicLearnerEvent.CHANGE_LEARNING_APPROACH }
  | { type: MusicLearnerEvent.CORRECT_GUESS }
  | { type: MusicLearnerEvent.INCORRECT_GUESS }
  | UpdateSettingEvent;

export interface QuestionContext {
  currentNote: Note | undefined;
  currentChord: Note[] | undefined;
  currentMelody: JIMIDINote[] | undefined;
  questionNumber: number;
  numberOfReplays: number;
}

const defautQuestionContext: QuestionContext = {
  currentNote: undefined,
  currentChord: undefined,
  currentMelody: undefined,
  questionNumber: 0,
  numberOfReplays: 0,
};

export interface MusicLearnerContext {
  settings: Settings;
  questionContext: QuestionContext;
}

export const musicLearner = setup({
  types: {
    context: {} as MusicLearnerContext,
    events: {} as MusicLearnerEvents,
  },
  actors: {
    playMusicContext: fromPromise(
      async ({ input }: { input: MusicLearnerContext }) => {
        return await playMusicContext(input);
      }
    ),
    playQuestion: fromPromise(
      async ({ input }: { input: MusicLearnerContext }) => {
        return await playQuestion(input);
      }
    ),
    replayQuestion: fromPromise(
      async ({ input }: { input: MusicLearnerContext }) => {
        switch (input.settings.learningMode) {
          case LearningMode.Notes:
            if (input.questionContext.currentNote)
              playNote(noteToNoteFile(input.questionContext.currentNote));
            break;
          case LearningMode.Chords:
            if (input.questionContext.currentChord)
              playChord(input.questionContext.currentChord);
            break;
          case LearningMode.Melodies:
            if (input.questionContext.currentMelody)
              playMelody(input.questionContext.currentMelody);
            break;
        }
        return;
      }
    ),
  },
  actions: {
    stopLearningPhaseAudio: () => {
      stopLearningPhaseAudio();
    },
    initializeLearningPhase: (c) => {
      beginLearningPhaseAudio();
      c.context.questionContext = {
        currentChord: undefined,
        currentMelody: undefined,
        currentNote: undefined,
        questionNumber: 0,
        numberOfReplays: 0,
      };
    },
  },
  delays: {
    answerTime: (ctx) => ctx.context.settings.timeToAnswerQuestion,
  },
}).createMachine({
  id: "musicLearningMachine",
  context: {
    settings: defaultSettings,
    questionContext: defautQuestionContext,
  },
  initial: MusicLearnerState.SELECTING_LEARNING_APPROACH,
  states: {
    [MusicLearnerState.SELECTING_LEARNING_APPROACH]: {
      entry: "stopLearningPhaseAudio",
      on: {
        [MusicLearnerEvent.START]: {
          target: "idle",
          actions: "initializeLearningPhase",
        },
        [MusicLearnerEvent.UPDATE_SETTING]: {
          actions: assign({
            settings: (c) => {
              return {
                ...c.context.settings,
                [c.event.key as keyof Settings]: c.event.value,
              };
            },
          }),
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
        },
      },
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
          actions: "stopLearningPhaseAudio",
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
      entry: (s) => (s.context.questionContext.numberOfReplays = 0),
      on: {
        [MusicLearnerEvent.CORRECT_GUESS]: [
          {
            target: MusicLearnerState.PLAYING_NEW_QUESTION,
            guard: (stmch) =>
              (stmch.context.settings.skipReviewOn == SkipReview.Both ||
                stmch.context.settings.skipReviewOn == SkipReview.Correct) &&
              stmch.context.questionContext.questionNumber <
                stmch.context.settings.numberOfQuestions - 1,
          },
          {
            target: MusicLearnerState.VIEWING_RESULTS,
            guard: (stmch) =>
              (stmch.context.settings.skipReviewOn == SkipReview.Both ||
                stmch.context.settings.skipReviewOn == SkipReview.Correct) &&
              stmch.context.questionContext.questionNumber >=
                stmch.context.settings.numberOfQuestions - 1,
          },
          {
            target: MusicLearnerState.REVIEWING,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn == SkipReview.None,
          },
        ],
        [MusicLearnerEvent.INCORRECT_GUESS]: [
          { target: MusicLearnerState.REVIEWING },
          {
            target: MusicLearnerState.PLAYING_NEW_QUESTION,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn == SkipReview.Both &&
              stmch.context.questionContext.questionNumber <
                stmch.context.settings.numberOfQuestions - 1,
          },
          {
            target: MusicLearnerState.VIEWING_RESULTS,
            guard: (stmch) =>
              stmch.context.settings.skipReviewOn == SkipReview.Both &&
              stmch.context.questionContext.questionNumber >=
                stmch.context.settings.numberOfQuestions - 1,
          },
        ],
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
        },
      },
      exit: (c) => {
        c.context.questionContext.questionNumber++;
      },
      states: {
        [MusicLearnerState.REPLAYING_QUESTION]: {
          invoke: {
            src: "replayQuestion",
            input: (s) => s.context,
            onDone: { target: MusicLearnerState.WAITING_FOR_GUESS },
          },
          entry: (s) => s.context.questionContext.numberOfReplays++,
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
              c.context.settings.numberOfQuestions ==
              c.context.questionContext.questionNumber,
          },
          {
            target: MusicLearnerState.PLAYING_NEW_QUESTION,
            guard: (c) =>
              c.context.questionContext.questionNumber <=
              c.context.settings.numberOfQuestions,
          },
        ],
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
        },
      },
    },
    [MusicLearnerState.VIEWING_RESULTS]: {
      on: {
        [MusicLearnerEvent.CONTINUE]: {
          target: MusicLearnerState.PLAYING_MUSIC_CONTEXT,
          actions: "initializeLearningPhase",
        },
        [MusicLearnerEvent.CHANGE_LEARNING_APPROACH]: {
          target: MusicLearnerState.SELECTING_LEARNING_APPROACH,
        },
      },
      entry: "stopLearningPhaseAudio",
    },
  },
});
