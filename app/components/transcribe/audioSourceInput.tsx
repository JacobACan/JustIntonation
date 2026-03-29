"use client";

import { useCallback, useContext, useRef, useState } from "react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { TranscribeEvent } from "@/machines/transcribeProcess";
import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_TYPES,
} from "@/constants/transcribeSettings";

export default function AudioSourceInput() {
  const service = useContext(TranscribeMachineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!service) return;
      if (
        !ACCEPTED_AUDIO_TYPES.includes(file.type) &&
        !file.name.match(/\.(mp3|wav|m4a|webm|ogg|mp4)$/i)
      ) {
        return;
      }
      service.send({ type: TranscribeEvent.LOAD_FILE, file });
    },
    [service],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // Capture desktop audio as raw PCM → WAV to avoid codec artifacts
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);

  const startDesktopCapture = useCallback(async () => {
    try {
      // Must request video (browsers require it), but we only keep audio.
      // Disable all audio processing — echo cancellation causes phasing.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: true,
      });

      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Discard video immediately
      stream.getVideoTracks().forEach((t) => t.stop());
      const audioStream = new MediaStream(stream.getAudioTracks());
      streamRef.current = audioStream;

      // Capture raw PCM via AudioContext
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(audioStream);
      const processor = ctx.createScriptProcessor(4096, 2, 2);
      pcmChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        const left = e.inputBuffer.getChannelData(0);
        const right = e.inputBuffer.getChannelData(1);
        // Interleave L/R into a single buffer
        const interleaved = new Float32Array(left.length * 2);
        for (let i = 0; i < left.length; i++) {
          interleaved[i * 2] = left[i];
          interleaved[i * 2 + 1] = right[i];
        }
        pcmChunksRef.current.push(interleaved);
      };

      source.connect(processor);
      // Connect to a silent gain node (not destination) to avoid
      // feedback when capturing from the same browser
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      setIsCapturing(true);

      // Auto-stop if the user ends sharing from the browser UI
      audioStream.getAudioTracks()[0].onended = () => {
        stopDesktopCapture();
      };
    } catch {
      setIsCapturing(false);
    }
  }, [handleFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopDesktopCapture = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;

    // Merge PCM chunks
    const chunks = pcmChunksRef.current;
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const pcm = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      pcm.set(chunk, offset);
      offset += chunk.length;
    }
    pcmChunksRef.current = [];

    // Encode to WAV (stereo — data is already interleaved L/R)
    const numChannels = 2;
    const numSamples = pcm.length / numChannels;
    const bytesPerSample = 2;
    const dataSize = pcm.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeStr = (o: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);

    let pos = 44;
    for (let i = 0; i < pcm.length; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(pos, s * 0x7fff, true);
      pos += 2;
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const file = new File([blob], "desktop-audio.wav", { type: "audio/wav" });
    handleFile(file);

    // Cleanup
    ctx.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCapturing(false);
  }, [handleFile]);

  return (
    <>
      <div
        className={`flex rounded-b-lg border border-dashed transition-colors ${
          isDragging
            ? "border-[var(--middleground1)] bg-[var(--surface-border)]"
            : "border-[var(--surface-border-medium)]"
        }`}
        style={{ height: "160px" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* File upload area */}
        <div
          className="flex flex-1 cursor-pointer flex-col items-center justify-center transition-colors hover:bg-[var(--surface-border)]"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-2 opacity-40"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-xs text-[var(--text-secondary)]">
            Drop audio or click to browse
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            mp3, wav, m4a, webm, ogg
          </p>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className="h-16 w-px bg-[var(--surface-border)]" />
          <span className="my-1 text-xs text-[var(--text-tertiary)]">or</span>
          <div className="h-16 w-px bg-[var(--surface-border)]" />
        </div>

        {/* Desktop audio capture */}
        <div
          className="flex flex-1 cursor-pointer flex-col items-center justify-center transition-colors hover:bg-[var(--surface-border)]"
          onClick={isCapturing ? stopDesktopCapture : startDesktopCapture}
        >
          {isCapturing ? (
            <>
              <span className="mb-2 inline-block h-4 w-4 animate-pulse rounded-full bg-red-500" />
              <p className="text-xs text-red-400">Recording desktop audio...</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Click to stop
              </p>
            </>
          ) : (
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--middleground1)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-2 opacity-40"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <p className="text-xs text-[var(--text-secondary)]">
                Record desktop audio
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Capture from any app
              </p>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_AUDIO_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
      />
    </>
  );
}
