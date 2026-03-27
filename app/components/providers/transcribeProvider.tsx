"use client";

import { transcribeMachine } from "@/machines/transcribeProcess";
import { useActorRef } from "@xstate/react";
import { createContext } from "react";
import { ActorRefFrom } from "xstate";

type TranscribeService = ActorRefFrom<typeof transcribeMachine>;

export const TranscribeMachineContext = createContext<
  TranscribeService | undefined
>(undefined);

export default function TranscribeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const transcribeService = useActorRef(transcribeMachine);

  return (
    <TranscribeMachineContext value={transcribeService}>
      {children}
    </TranscribeMachineContext>
  );
}
