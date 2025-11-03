import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import { useContext } from "react";
import { MusicLearnerContext } from "../providers/learningStateMachineProvider";

interface PlayReplayButtonProps {
  eventType: MusicLearnerEvent;
  children: React.ReactNode;
  className?: string;
}

export default function LearningUserEvent({
  eventType,
  children,
  className,
}: PlayReplayButtonProps) {
  const musicLearnerActorRef = useContext(MusicLearnerContext);
  if (!musicLearnerActorRef) return;

  return (
    <button
      className={`flex items-center justify-center ${className}`}
      style={{
        background: "none",
        border: "none",
        outline: "none",
        cursor: "pointer",
      }}
      onClick={() => {
        musicLearnerActorRef.send({
          type: eventType,
        });
      }}
    >
      {children}
    </button>
  );
}
