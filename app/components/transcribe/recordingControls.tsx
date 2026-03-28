"use client";

import { useContext, useCallback, useRef, useState } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { TranscribeEvent, TranscribeState } from "@/machines/transcribeProcess";
import { AudioRecorder } from "@/lib/mediaRecorder";

export default function RecordingControls() {
  const service = useContext(TranscribeMachineContext);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const isRecording = useSelector(service!, (state) =>
    state.matches({
      [TranscribeState.READY]: {
        recording: TranscribeState.RECORDING,
      },
    }),
  );
  const isReviewing = useSelector(service!, (state) =>
    state.matches({
      [TranscribeState.READY]: {
        recording: TranscribeState.RECORDING_REVIEWING,
      },
    }),
  );
  const loopRegion = useSelector(service!, (state) => state.context.loopRegion);

  const pendingRecordingRef = useRef<{
    objectUrl: string;
    blob: Blob;
    duration: number;
  } | null>(null);

  const handleStartRecording = useCallback(async () => {
    if (!service) return;

    const recorder = new AudioRecorder();
    const granted = await recorder.requestPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }

    recorderRef.current = recorder;
    recorder.start();
    service.send({ type: TranscribeEvent.START_RECORDING });
  }, [service]);

  const handleStopRecording = useCallback(async () => {
    if (!service || !recorderRef.current) return;

    const recording = await recorderRef.current.stop(loopRegion);
    pendingRecordingRef.current = {
      objectUrl: recording.objectUrl,
      blob: recording.blob,
      duration: recording.duration,
    };

    service.send({ type: TranscribeEvent.STOP_RECORDING });
  }, [service, loopRegion]);

  const handleSave = useCallback(() => {
    if (!service || !pendingRecordingRef.current) return;

    service.send({
      type: TranscribeEvent.SAVE_RECORDING,
      recording: {
        id: crypto.randomUUID(),
        blob: pendingRecordingRef.current.blob,
        objectUrl: pendingRecordingRef.current.objectUrl,
        createdAt: Date.now(),
        region: loopRegion,
        duration: pendingRecordingRef.current.duration,
      },
    });

    recorderRef.current?.dispose();
    recorderRef.current = null;
    pendingRecordingRef.current = null;
  }, [service, loopRegion]);

  const handleDiscard = useCallback(() => {
    if (!service) return;

    if (pendingRecordingRef.current) {
      URL.revokeObjectURL(pendingRecordingRef.current.objectUrl);
    }

    service.send({ type: TranscribeEvent.DISCARD_RECORDING });
    recorderRef.current?.dispose();
    recorderRef.current = null;
    pendingRecordingRef.current = null;
  }, [service]);

  if (permissionDenied) {
    return (
      <div className="w-full max-w-3xl text-center">
        <p className="text-xs text-red-400">
          Microphone access denied. Please allow microphone access to record.
        </p>
      </div>
    );
  }

  if (isReviewing && pendingRecordingRef.current) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-4">
        <audio
          src={pendingRecordingRef.current.objectUrl}
          controls
          className="w-full max-w-md"
        />
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="rounded border border-[var(--middleground1)]/40 px-4 py-2 text-xs text-[var(--middleground1)] transition-transform hover:scale-105 hover:cursor-pointer hover:border-[var(--middleground1)] active:scale-95"
          >
            Save
          </button>
          <button
            onClick={handleDiscard}
            className="rounded border border-[var(--middleground1)]/20 px-4 py-2 text-xs text-[var(--middleground1)]/60 transition-transform hover:scale-105 hover:cursor-pointer hover:text-[var(--middleground1)] active:scale-95"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl justify-center">
      {isRecording ? (
        <button
          onClick={handleStopRecording}
          className="flex items-center gap-2 rounded border border-red-400/40 px-6 py-3 text-sm text-red-400 transition-transform hover:scale-105 hover:cursor-pointer hover:border-red-400 active:scale-95"
        >
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500" />
          Stop Recording
        </button>
      ) : (
        <button
          onClick={handleStartRecording}
          className="flex items-center gap-2 rounded border border-[var(--middleground1)]/40 px-6 py-3 text-sm text-[var(--middleground1)] transition-transform hover:scale-105 hover:cursor-pointer hover:border-[var(--middleground1)] active:scale-95"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Transcribe
        </button>
      )}
    </div>
  );
}
