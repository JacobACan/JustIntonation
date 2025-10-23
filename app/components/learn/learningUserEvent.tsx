import { SettingsContext } from "@/components/providers/settingsProvider";
import {
  musicLearner,
  MusicLearnerEvent,
} from "@/machines/musicLearningProcess";
import { useActorRef } from "@xstate/react";
import { useContext, useEffect, useState } from "react";
import { MusicLearnerContext } from "../providers/learningStateMachineProvider";

interface PlayReplayButtonProps {
  eventType: MusicLearnerEvent;
  icon: React.ReactNode;
}

export default function MusicLearningStateMachineButton({
  eventType,
  icon,
}: PlayReplayButtonProps) {
  const musicLearnerActorRef = useContext(MusicLearnerContext);
  if (!musicLearnerActorRef) return;

  return (
    <>
      <button
        className=" flex items-center justify-center"
        style={{
          background: "none",
          border: "none",
          outline: "none",
          cursor: "pointer",
        }}
        onClick={() => {
          musicLearnerActorRef.send({ type: eventType });
        }}
      >
        {icon}
      </button>
    </>
  );
}

function ReplayIcon() {
  return (
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
  );
}

function PlayIcon() {
  return (
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
  );
}
