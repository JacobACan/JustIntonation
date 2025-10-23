import { musicLearner } from "@/machines/musicLearningProcess";
import { useActorRef, useMachine } from "@xstate/react";
import { createContext } from "react";
import { ActorRefFrom } from "xstate";

type MusicService = ActorRefFrom<typeof musicLearner>;

export const MusicLearnerContext = createContext<MusicService | undefined>(
  undefined
);

export default function MusicLearnerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const musicLearnerService = useActorRef(musicLearner);

  return (
    <MusicLearnerContext value={musicLearnerService}>
      {children}
    </MusicLearnerContext>
  );
}
