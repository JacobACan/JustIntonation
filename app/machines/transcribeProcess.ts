import { Marker, Recording, Region, WaveformPeak } from "@/types/transcribe";
import { DEFAULT_PLAYBACK_RATE } from "@/constants/transcribeSettings";
import { assign, fromPromise, setup } from "xstate";
import { decodeAudioFile, computeWaveformPeaks } from "@/lib/transcribeActors";

export enum TranscribeEvent {
  LOAD_FILE = "LOAD_FILE",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  STOP = "STOP",
  PLAYBACK_ENDED = "PLAYBACK_ENDED",
  SET_SPEED = "SET_SPEED",
  SEEK = "SEEK",
  DROP_MARKER = "DROP_MARKER",
  DELETE_MARKER = "DELETE_MARKER",
  MOVE_MARKER = "MOVE_MARKER",
  SELECT_REGION = "SELECT_REGION",
  SELECT_MARKER_SECTION = "SELECT_MARKER_SECTION",
  CLEAR_LOOP = "CLEAR_LOOP",
  TOGGLE_LOOP = "TOGGLE_LOOP",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  SAVE_RECORDING = "SAVE_RECORDING",
  DISCARD_RECORDING = "DISCARD_RECORDING",
  UPDATE_TIME = "UPDATE_TIME",
  RESET = "RESET",
}

export enum TranscribeState {
  IDLE = "idle",
  LOADING = "loading",
  ERROR = "error",
  READY = "ready",
  // Playback substates
  STOPPED = "stopped",
  PLAYING = "playing",
  PAUSED = "paused",
  // Recording substates
  RECORDING_IDLE = "recording_idle",
  RECORDING = "recording",
  RECORDING_REVIEWING = "recording_reviewing",
}

type LoadFileEvent = {
  type: TranscribeEvent.LOAD_FILE;
  file: File;
};

type SetSpeedEvent = {
  type: TranscribeEvent.SET_SPEED;
  rate: number;
};

type SeekEvent = {
  type: TranscribeEvent.SEEK;
  time: number;
};

type DropMarkerEvent = {
  type: TranscribeEvent.DROP_MARKER;
  time: number;
};

type DeleteMarkerEvent = {
  type: TranscribeEvent.DELETE_MARKER;
  id: string;
};

type MoveMarkerEvent = {
  type: TranscribeEvent.MOVE_MARKER;
  id: string;
  time: number;
};

type SelectRegionEvent = {
  type: TranscribeEvent.SELECT_REGION;
  region: Region;
};

type SelectMarkerSectionEvent = {
  type: TranscribeEvent.SELECT_MARKER_SECTION;
  region: Region;
};

type SaveRecordingEvent = {
  type: TranscribeEvent.SAVE_RECORDING;
  recording: Recording;
};

type UpdateTimeEvent = {
  type: TranscribeEvent.UPDATE_TIME;
  time: number;
};

export type TranscribeEvents =
  | LoadFileEvent
  | { type: TranscribeEvent.PLAY }
  | { type: TranscribeEvent.PAUSE }
  | { type: TranscribeEvent.STOP }
  | { type: TranscribeEvent.PLAYBACK_ENDED }
  | SetSpeedEvent
  | SeekEvent
  | DropMarkerEvent
  | DeleteMarkerEvent
  | MoveMarkerEvent
  | SelectRegionEvent
  | SelectMarkerSectionEvent
  | { type: TranscribeEvent.CLEAR_LOOP }
  | { type: TranscribeEvent.TOGGLE_LOOP }
  | { type: TranscribeEvent.START_RECORDING }
  | { type: TranscribeEvent.STOP_RECORDING }
  | SaveRecordingEvent
  | { type: TranscribeEvent.DISCARD_RECORDING }
  | UpdateTimeEvent
  | { type: TranscribeEvent.RESET };

export interface TranscribeContext {
  audioBuffer: AudioBuffer | null;
  waveformPeaks: WaveformPeak[];
  duration: number;
  currentTime: number;
  playbackRate: number;
  markers: Marker[];
  loopRegion: Region | null;
  isLooping: boolean;
  recordings: Recording[];
  fileName: string;
  errorMessage: string;
}

const defaultContext: TranscribeContext = {
  audioBuffer: null,
  waveformPeaks: [],
  duration: 0,
  currentTime: 0,
  playbackRate: DEFAULT_PLAYBACK_RATE,
  markers: [],
  loopRegion: null,
  isLooping: false,
  recordings: [],
  fileName: "",
  errorMessage: "",
};

export const transcribeMachine = setup({
  types: {
    context: {} as TranscribeContext,
    events: {} as TranscribeEvents,
  },
  actors: {
    decodeAudio: fromPromise(
      async ({ input }: { input: { file: File } }) => {
        const audioBuffer = await decodeAudioFile(input.file);
        const waveformPeaks = computeWaveformPeaks(audioBuffer);
        return { audioBuffer, waveformPeaks };
      },
    ),
  },
}).createMachine({
  id: "transcribeMachine",
  context: defaultContext,
  initial: TranscribeState.IDLE,
  on: {
    [TranscribeEvent.SET_SPEED]: {
      actions: assign({
        playbackRate: ({ event }) => (event as SetSpeedEvent).rate,
      }),
    },
    [TranscribeEvent.UPDATE_TIME]: {
      actions: assign({
        currentTime: ({ event }) => (event as UpdateTimeEvent).time,
      }),
    },
    [TranscribeEvent.DROP_MARKER]: {
      actions: assign({
        markers: ({ context, event }) => {
          const e = event as DropMarkerEvent;
          const newMarker: Marker = {
            id: crypto.randomUUID(),
            time: e.time,
            label: `M${context.markers.length + 1}`,
          };
          return [...context.markers, newMarker].sort(
            (a, b) => a.time - b.time,
          );
        },
      }),
    },
    [TranscribeEvent.DELETE_MARKER]: {
      actions: assign({
        markers: ({ context, event }) => {
          const e = event as DeleteMarkerEvent;
          return context.markers.filter((m) => m.id !== e.id);
        },
      }),
    },
    [TranscribeEvent.MOVE_MARKER]: {
      actions: assign({
        markers: ({ context, event }) => {
          const e = event as MoveMarkerEvent;
          return context.markers
            .map((m) => (m.id === e.id ? { ...m, time: e.time } : m))
            .sort((a, b) => a.time - b.time);
        },
      }),
    },
    [TranscribeEvent.SELECT_REGION]: {
      actions: assign({
        loopRegion: ({ event }) => (event as SelectRegionEvent).region,
        isLooping: true,
      }),
    },
    [TranscribeEvent.SELECT_MARKER_SECTION]: {
      actions: assign({
        loopRegion: ({ event }) =>
          (event as SelectMarkerSectionEvent).region,
        isLooping: true,
      }),
    },
    [TranscribeEvent.CLEAR_LOOP]: {
      actions: assign({
        loopRegion: () => null,
        isLooping: false,
      }),
    },
    [TranscribeEvent.TOGGLE_LOOP]: {
      actions: assign({
        isLooping: ({ context }) => !context.isLooping,
      }),
    },
  },
  states: {
    [TranscribeState.IDLE]: {
      on: {
        [TranscribeEvent.LOAD_FILE]: {
          target: TranscribeState.LOADING,
          actions: assign({
            fileName: ({ event }) => (event as LoadFileEvent).file.name,
            errorMessage: () => "",
          }),
        },
      },
    },
    [TranscribeState.LOADING]: {
      invoke: {
        id: "decodeAudio",
        src: "decodeAudio",
        input: ({ event }) => ({
          file: (event as LoadFileEvent).file,
        }),
        onDone: {
          target: TranscribeState.READY,
          actions: assign({
            audioBuffer: ({ event }) => event.output.audioBuffer,
            waveformPeaks: ({ event }) => event.output.waveformPeaks,
            duration: ({ event }) => event.output.audioBuffer.duration,
          }),
        },
        onError: {
          target: TranscribeState.ERROR,
          actions: assign({
            errorMessage: () => "Failed to decode audio file",
          }),
        },
      },
    },
    [TranscribeState.ERROR]: {
      on: {
        [TranscribeEvent.RESET]: {
          target: TranscribeState.IDLE,
          actions: assign(defaultContext),
        },
        [TranscribeEvent.LOAD_FILE]: {
          target: TranscribeState.LOADING,
          actions: assign({
            fileName: ({ event }) => (event as LoadFileEvent).file.name,
            errorMessage: () => "",
          }),
        },
      },
    },
    [TranscribeState.READY]: {
      type: "parallel",
      on: {
        [TranscribeEvent.RESET]: {
          target: TranscribeState.IDLE,
          actions: assign(defaultContext),
        },
      },
      states: {
        playback: {
          initial: TranscribeState.STOPPED,
          states: {
            [TranscribeState.STOPPED]: {
              entry: assign({ currentTime: () => 0 }),
              on: {
                [TranscribeEvent.PLAY]: {
                  target: TranscribeState.PLAYING,
                },
                [TranscribeEvent.SEEK]: {
                  actions: assign({
                    currentTime: ({ event }) => (event as SeekEvent).time,
                  }),
                },
              },
            },
            [TranscribeState.PLAYING]: {
              on: {
                [TranscribeEvent.PAUSE]: {
                  target: TranscribeState.PAUSED,
                },
                [TranscribeEvent.STOP]: {
                  target: TranscribeState.STOPPED,
                },
                [TranscribeEvent.PLAYBACK_ENDED]: {
                  target: TranscribeState.STOPPED,
                },
                [TranscribeEvent.SEEK]: {
                  actions: assign({
                    currentTime: ({ event }) => (event as SeekEvent).time,
                  }),
                },
              },
            },
            [TranscribeState.PAUSED]: {
              on: {
                [TranscribeEvent.PLAY]: {
                  target: TranscribeState.PLAYING,
                },
                [TranscribeEvent.STOP]: {
                  target: TranscribeState.STOPPED,
                },
                [TranscribeEvent.SEEK]: {
                  actions: assign({
                    currentTime: ({ event }) => (event as SeekEvent).time,
                  }),
                },
              },
            },
          },
        },
        recording: {
          initial: TranscribeState.RECORDING_IDLE,
          states: {
            [TranscribeState.RECORDING_IDLE]: {
              on: {
                [TranscribeEvent.START_RECORDING]: {
                  target: TranscribeState.RECORDING,
                },
              },
            },
            [TranscribeState.RECORDING]: {
              on: {
                [TranscribeEvent.STOP_RECORDING]: {
                  target: TranscribeState.RECORDING_REVIEWING,
                },
              },
            },
            [TranscribeState.RECORDING_REVIEWING]: {
              on: {
                [TranscribeEvent.SAVE_RECORDING]: {
                  target: TranscribeState.RECORDING_IDLE,
                  actions: assign({
                    recordings: ({ context, event }) => [
                      ...context.recordings,
                      (event as SaveRecordingEvent).recording,
                    ],
                  }),
                },
                [TranscribeEvent.DISCARD_RECORDING]: {
                  target: TranscribeState.RECORDING_IDLE,
                },
              },
            },
          },
        },
      },
    },
  },
});
