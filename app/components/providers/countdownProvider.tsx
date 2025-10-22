import { audioContext } from "@/lib/webAudio";
import { createContext, useState } from "react";

interface Countdown {
  timeLeft: number;
  startTime: number;
  totalTime: number;
}

const initialCountdownTimer: Countdown = {
  timeLeft: 0,
  startTime: 0,
  totalTime: 0,
};

export const CountdownContext = createContext(
  {} as {
    countdownTimer: Countdown;
    startCountdownTimer: (seconds: number, interval: number) => void;
  }
);

export default function CountdownProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [countdownTimer, setCountdownTimer] = useState(initialCountdownTimer);

  const intervalicCheck = async (
    ms: number,
    totalTime: number,
    startTime: number
  ) => {
    while (true) {
      const timeLeft = totalTime - (audioContext.currentTime - startTime);

      if (timeLeft <= 0) {
        setCountdownTimer((prev) => ({ ...prev, timeLeft: 0 }));
        return;
      }

      setCountdownTimer((prev) => ({ ...prev, timeLeft }));

      await new Promise((r) => setTimeout(r, ms));
    }
  };

  const startCountdownTimer = async (seconds: number, interval: number) => {
    console.log("STARTING!!!");
    const startTime = audioContext.currentTime;
    const totalTime = seconds;

    setCountdownTimer({
      totalTime,
      startTime,
      timeLeft: totalTime,
    });

    await intervalicCheck(interval, totalTime, startTime);
  };

  const value = { startCountdownTimer, countdownTimer };

  return (
    <CountdownContext.Provider value={value}>
      {children}
    </CountdownContext.Provider>
  );
}
