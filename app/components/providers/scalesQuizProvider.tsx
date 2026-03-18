"use client";

import { scalesQuizMachine } from "@/machines/scalesQuizProcess";
import { useActorRef } from "@xstate/react";
import { createContext } from "react";
import { ActorRefFrom } from "xstate";

type ScalesQuizService = ActorRefFrom<typeof scalesQuizMachine>;

export const ScalesQuizMachineContext = createContext<
  ScalesQuizService | undefined
>(undefined);

export default function ScalesQuizProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scalesQuizService = useActorRef(scalesQuizMachine);

  return (
    <ScalesQuizMachineContext value={scalesQuizService}>
      {children}
    </ScalesQuizMachineContext>
  );
}
