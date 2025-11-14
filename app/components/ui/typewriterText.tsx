"use client";

import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // milliseconds before animation starts
  className?: string;
}

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  className = "",
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const startTimer = setTimeout(() => {
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay, isClient]);

  // Return plain text if JavaScript is disabled
  if (!isClient) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{displayedText}</span>;
}
