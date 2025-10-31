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
    startCountdownTimer: (ms: number) => void;
    pauseCountdownTimer: () => void;
  }
);

const UPDATE_SPEED = 50; //ms
let continueUpdate = true;
let isTimerRunning = false;

export default function CountdownProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [countdownTimer, setCountdownTimer] = useState(initialCountdownTimer);
  const intervalicUpdate = async (totalTime: number, startTime: number) => {
    isTimerRunning = true;
    while (continueUpdate) {
      const timeLeft = totalTime - (audioContext.currentTime - startTime);
      if (timeLeft <= 0) {
        setCountdownTimer((prev) => ({ ...prev, timeLeft: 0 }));
        isTimerRunning = false;

        return;
      }

      setCountdownTimer((prev) => ({ ...prev, timeLeft }));

      await new Promise((r) => setTimeout(r, UPDATE_SPEED));
    }
    continueUpdate = true;
    isTimerRunning = false;
  };

  const startCountdownTimer = async (ms: number) => {
    if (isTimerRunning) await pauseCountdownTimer();
    const startTime = audioContext.currentTime;
    const totalTime = ms / 1000;

    setCountdownTimer(() => ({
      totalTime,
      startTime,
      timeLeft: totalTime,
    }));

    countdownTimer.totalTime = totalTime;
    countdownTimer.startTime = startTime;
    countdownTimer.timeLeft = totalTime;

    await intervalicUpdate(totalTime, startTime);
  };

  const pauseCountdownTimer = async () => {
    continueUpdate = false;
    setCountdownTimer(() => ({
      totalTime: 0,
      startTime: 0,
      timeLeft: 0,
    }));
    await new Promise((g) => setTimeout(g, UPDATE_SPEED));
  };

  const value = { startCountdownTimer, pauseCountdownTimer, countdownTimer };

  return <CountdownContext value={value}>{children}</CountdownContext>;
}
