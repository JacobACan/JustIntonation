"use client";

import { useEffect, useState } from "react";
import { TypewriterText } from "@/components/ui/typewriterText";
import { getContent, type ContentChunk } from "@/lib/readmeParser";

export default function Home() {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunks, setChunks] = useState<ContentChunk[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const parsedChunks = getContent();
    setChunks(parsedChunks);
  }, []);

  useEffect(() => {
    if (!isClient || chunks.length === 0) return;

    // Calculate total time for current chunk to display
    const currentChunk = chunks[currentChunkIndex];
    const textLength = currentChunk.title.length + currentChunk.content.length;
    const speed = 30; // milliseconds per character
    const totalDisplayTime = textLength * speed + 3000; // Add 3 second pause before advancing

    const timer = setTimeout(() => {
      setCurrentChunkIndex((prev) => (prev + 1) % chunks.length);
    }, totalDisplayTime);

    return () => clearTimeout(timer);
  }, [currentChunkIndex, chunks, isClient]);

  if (!isClient || chunks.length === 0) {
    return (
      <div className="bg-background1 relative flex min-h-screen flex-col items-center px-4 py-8">
        <button
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
          onClick={() => (window.location.href = "/learn")}
          aria-label="Start learning"
        >
          <svg
            width="200"
            height="200"
            viewBox="0 0 48 48"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon
              points="20,16 34,24 20,32"
              fill="var(--middleground1)"
              stroke="var(--middleground1)"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  const currentChunk = chunks[currentChunkIndex];
  // Stagger the delays so title appears first, then content
  const titleDelay = 0;
  const contentDelay = currentChunk.title.length * 30 + 100;

  return (
    <div className="bg-background1 relative flex min-h-screen flex-col items-center px-4 py-8">
      {/* Fixed Center Play Button */}
      <button
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
        onClick={() => (window.location.href = "/learn")}
        aria-label="Start learning"
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 48 48"
          fill="none"
          stroke="var(--middleground1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            points="20,16 34,24 20,32"
            fill="var(--middleground1)"
            stroke="var(--middleground1)"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Content above play button */}
      <div className="flex w-full flex-col items-center justify-center pt-16">
        <div className="flex max-w-2xl flex-col items-center gap-8 pb-64">
          {/* Dynamic Title and Content with Typewriter Effect */}
          <div className="min-h-40 space-y-4 text-center">
            <h1 className="text-foreground2 text-4xl font-bold">
              <TypewriterText
                key={`title-${currentChunkIndex}`}
                text={currentChunk.title}
                speed={60}
                delay={titleDelay}
              />
            </h1>
            <p className="text-middleground1 text-xl">
              <TypewriterText
                key={`content-${currentChunkIndex}`}
                text={currentChunk.content}
                speed={30}
                delay={contentDelay}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
