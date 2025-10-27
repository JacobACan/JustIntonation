import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import { useContext } from "react";
import { MusicLearnerContext } from "../providers/learningStateMachineProvider";

interface PlayReplayButtonProps {
  eventType: MusicLearnerEvent;
  children: React.ReactNode;
}

export default function LearningUserEvent({
  eventType,
  children,
}: PlayReplayButtonProps) {
  const musicLearnerActorRef = useContext(MusicLearnerContext);
  if (!musicLearnerActorRef) return;

  return (
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
      {children}
    </button>
  );
}
