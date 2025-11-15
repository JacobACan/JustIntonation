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

  useEffect(() => {
    setTimeout(() => {
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, speed);

      return;
    }, delay);

    return;
  }, []);

  return <span className={className}>{displayedText}</span>;
}
