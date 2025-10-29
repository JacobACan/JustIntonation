import { audioContext } from "@/lib/webAudio";
import { createContext, useState } from "react";

interface Countdown {
  timeLeft: number;
  startTime: number;
  totalTime: number;
}

const initialCountdownTimer: Countdown = {
  timeLeft: 1,
  startTime: 0,
  totalTime: 1,
};

export const CountdownContext = createContext(
  {} as {
    countdownTimer: Countdown;
    startCountdownTimer: (seconds: number, interval: number) => void;
  }
);

export default function CountdownProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const startCountdownTimer = async (ms: number, interval: number) => {
    const startTime = audioContext.currentTime;
    const totalTime = ms / 1000;

    setCountdownTimer({
      totalTime,
      startTime,
      timeLeft: totalTime,
    });

    await intervalicCheck(interval, totalTime, startTime);
  };

  const value = { startCountdownTimer, countdownTimer };

  return <CountdownContext value={value}>{children}</CountdownContext>;
}
