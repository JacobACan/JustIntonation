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

    const currentChunk = chunks[currentChunkIndex];
    const textLength = currentChunk.title.length + currentChunk.content.length;
    const speed = 30;
    const totalDisplayTime = textLength * speed + 3000;

    const timer = setTimeout(() => {
      setCurrentChunkIndex((prev) => (prev + 1) % chunks.length);
    }, totalDisplayTime);

    return () => clearTimeout(timer);
  }, [currentChunkIndex, chunks, isClient]);

  const navButtons = (
    <div className="fixed top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-12">
      <button
        className="flex flex-col items-center gap-3 transition-transform hover:scale-110 hover:cursor-pointer active:scale-95"
        onClick={() => (window.location.href = "/conceptualize/scales")}
        aria-label="Conceptualize major scale shapes"
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 48 48"
          fill="none"
          stroke="var(--middleground1)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* White keys - C D E F G A B */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const x = 4 + i * 5.7;
            const diatonic = [0, 1, 2, 3, 4, 5, 6];
            const isHighlighted = diatonic.includes(i);
            return (
              <rect
                key={`w${i}`}
                x={x}
                y={12}
                width={5.2}
                height={24}
                rx={0.5}
                fill={
                  isHighlighted ? "var(--middleground1)" : "var(--background)"
                }
                stroke="var(--middleground1)"
              />
            );
          })}
          {/* Black keys - between C-D, D-E, F-G, G-A, A-B */}
          {[0, 1, 3, 4, 5].map((i) => {
            const whiteX = 4 + i * 5.7;
            const x = whiteX + 3.5;
            return (
              <rect
                key={`b${i}`}
                x={x}
                y={12}
                width={3.8}
                height={15}
                rx={0.5}
                fill="var(--background)"
                stroke="var(--middleground1)"
              />
            );
          })}
        </svg>
        <span className="text-sm font-bold text-[var(--middleground1)]">
          Master Diatonic Shapes
        </span>
      </button>
    </div>
  );

  if (!isClient || chunks.length === 0) {
    return (
      <div className="bg-background1 relative flex min-h-screen flex-col items-center px-4 py-8">
        {navButtons}
      </div>
    );
  }

  const currentChunk = chunks[currentChunkIndex];
  const titleDelay = 0;
  const contentDelay = currentChunk.title.length * 30 + 100;

  return (
    <div className="bg-background1 relative flex min-h-screen flex-col items-center px-4 py-8">
      {navButtons}

      {/* Content above buttons */}
      <div className="flex w-full flex-col items-center justify-center pt-16">
        <div className="flex max-w-2xl flex-col items-center gap-8 pb-64">
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
