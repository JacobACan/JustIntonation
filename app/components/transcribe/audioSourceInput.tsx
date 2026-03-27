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

  const handleFile = useCallback(
    (file: File) => {
      if (!service) return;
      if (!ACCEPTED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|mp4)$/i)) {
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

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <div
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-16 transition-colors ${
          isDragging
            ? "border-[var(--middleground1)] bg-[var(--middleground1)]/10"
            : "border-[var(--middleground1)]/40 hover:border-[var(--middleground1)]/70"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--middleground1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4 opacity-60"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm text-[var(--middleground1)]">
          Drop an audio file here or click to browse
        </p>
        <p className="mt-2 text-xs text-[var(--middleground1)]/60">
          mp3, wav, m4a, webm, ogg
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_AUDIO_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
