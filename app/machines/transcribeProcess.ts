import { Marker, Recording, Region, WaveformPeak } from "@/types/transcribe";
import { DEFAULT_PLAYBACK_RATE } from "@/constants/transcribeSettings";
import { assign, fromPromise, setup } from "xstate";
import { decodeAudioFile, computeWaveformPeaks } from "@/lib/transcribeActors";

export enum TranscribeEvent {
  LOAD_FILE = "LOAD_FILE",
  SET_SPEED = "SET_SPEED",
  SEEK = "SEEK",
  DROP_MARKER = "DROP_MARKER",
  DELETE_MARKER = "DELETE_MARKER",
  MOVE_MARKER = "MOVE_MARKER",
  RENAME_MARKER = "RENAME_MARKER",
  SELECT_REGION = "SELECT_REGION",
  SELECT_MARKER_SECTION = "SELECT_MARKER_SECTION",
  CLEAR_LOOP = "CLEAR_LOOP",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  SAVE_RECORDING = "SAVE_RECORDING",
  DISCARD_RECORDING = "DISCARD_RECORDING",
  UPDATE_TIME = "UPDATE_TIME",
  SET_TRANSCRIPTION_VOLUME = "SET_TRANSCRIPTION_VOLUME",
  SET_SYNC_OFFSET = "SET_SYNC_OFFSET",
  RESTORE = "RESTORE",
  RESET = "RESET",
}

export enum TranscribeState {
  IDLE = "idle",
  LOADING = "loading",
  ERROR = "error",
  READY = "ready",
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

type RenameMarkerEvent = {
  type: TranscribeEvent.RENAME_MARKER;
  id: string;
  label: string;
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

type SetTranscriptionVolumeEvent = {
  type: TranscribeEvent.SET_TRANSCRIPTION_VOLUME;
  volume: number;
};

type SetSyncOffsetEvent = {
  type: TranscribeEvent.SET_SYNC_OFFSET;
  offsetMs: number;
};

type RestoreEvent = {
  type: TranscribeEvent.RESTORE;
  context: Partial<TranscribeContext>;
};

export type TranscribeEvents =
  | LoadFileEvent
  | SetSpeedEvent
  | SeekEvent
  | DropMarkerEvent
  | DeleteMarkerEvent
  | MoveMarkerEvent
  | RenameMarkerEvent
  | SelectRegionEvent
  | SelectMarkerSectionEvent
  | { type: TranscribeEvent.CLEAR_LOOP }
  | { type: TranscribeEvent.START_RECORDING }
  | { type: TranscribeEvent.STOP_RECORDING }
  | SaveRecordingEvent
  | { type: TranscribeEvent.DISCARD_RECORDING }
  | UpdateTimeEvent
  | SetTranscriptionVolumeEvent
  | SetSyncOffsetEvent
  | RestoreEvent
  | { type: TranscribeEvent.RESET };

export interface TranscribeContext {
  audioBuffer: AudioBuffer | null;
  fileUrl: string;
  waveformPeaks: WaveformPeak[];
  duration: number;
  currentTime: number;
  playbackRate: number;
  markers: Marker[];
  loopRegion: Region | null;
  isLooping: boolean;
  recordings: Recording[];
  transcriptionVolume: number;
  syncOffsetMs: number;
  fileName: string;
  errorMessage: string;
}

const defaultContext: TranscribeContext = {
  audioBuffer: null,
  fileUrl: "",
  waveformPeaks: [],
  duration: 0,
  currentTime: 0,
  playbackRate: DEFAULT_PLAYBACK_RATE,
  markers: [],
  loopRegion: null,
  isLooping: false,
  recordings: [],
  transcriptionVolume: 0.2,
  syncOffsetMs: 0,
  fileName: "",
  errorMessage: "",
};

export const transcribeMachine = setup({
  types: {
    context: {} as TranscribeContext,
    events: {} as TranscribeEvents,
  },
  actors: {
    decodeAudio: fromPromise(async ({ input }: { input: { file: File } }) => {
      const { audioBuffer, fileUrl } = await decodeAudioFile(input.file);
      const waveformPeaks = computeWaveformPeaks(audioBuffer);
      return { audioBuffer, fileUrl, waveformPeaks };
    }),
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
    [TranscribeEvent.SET_TRANSCRIPTION_VOLUME]: {
      actions: assign({
        transcriptionVolume: ({ event }) =>
          (event as SetTranscriptionVolumeEvent).volume,
      }),
    },
    [TranscribeEvent.SET_SYNC_OFFSET]: {
      actions: assign({
        syncOffsetMs: ({ event }) => (event as SetSyncOffsetEvent).offsetMs,
      }),
    },
    [TranscribeEvent.UPDATE_TIME]: {
      actions: assign({
        currentTime: ({ event }) => (event as UpdateTimeEvent).time,
      }),
    },
    [TranscribeEvent.SEEK]: {
      actions: assign({
        currentTime: ({ event }) => (event as SeekEvent).time,
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
    [TranscribeEvent.RENAME_MARKER]: {
      actions: assign({
        markers: ({ context, event }) => {
          const e = event as RenameMarkerEvent;
          return context.markers.map((m) =>
            m.id === e.id ? { ...m, label: e.label } : m,
          );
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
        loopRegion: ({ event }) => (event as SelectMarkerSectionEvent).region,
        isLooping: true,
      }),
    },
    [TranscribeEvent.CLEAR_LOOP]: {
      actions: assign({
        loopRegion: () => null,
        isLooping: false,
      }),
    },
    [TranscribeEvent.SAVE_RECORDING]: {
      actions: assign({
        recordings: ({ context, event }) => {
          const newRec = (event as SaveRecordingEvent).recording;
          // Replace existing recording for the same region (one per section)
          if (newRec.region) {
            const filtered = context.recordings.filter(
              (r) =>
                !r.region ||
                Math.abs(r.region.start - newRec.region!.start) > 0.5 ||
                Math.abs(r.region.end - newRec.region!.end) > 0.5,
            );
            return [...filtered, newRec];
          }
          return [...context.recordings, newRec];
        },
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
        [TranscribeEvent.RESTORE]: {
          target: TranscribeState.READY,
          actions: assign(({ event }) => {
            const e = event as RestoreEvent;
            return { ...defaultContext, ...e.context };
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
            fileUrl: ({ event }) => event.output.fileUrl,
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
