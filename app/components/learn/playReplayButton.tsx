import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext, useEffect, useState } from "react";

interface PlayReplayButtonProps {
  onPlay: () => void;
}

export default function PlayReplayButton({ onPlay }: PlayReplayButtonProps) {
  const { settings } = useContext(SettingsContext);
  const [isLearning, setIsLearning] = useState(false);

  useEffect(() => {
    setIsLearning(false);
  }, [settings]);

  return (
    <>
      <button
        className="mb-6 flex items-center justify-center"
        aria-label={isLearning ? "Replay" : "Play"}
        onClick={async () => {
          setIsLearning(true);
          onPlay();
        }}
        style={{
          background: "none",
          border: "none",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {isLearning ? (
          // Replay SVG
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M24 8
                 A16 16 0 1 1 8 24
                 A16 16 0 0 1"
            />
            <polyline points="3,24 14,23 9,18 3,24" />
          </svg>
        ) : (
          // Play SVG
          <svg
            width="48"
            height="48"
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
        )}
      </button>
    </>
  );
}
