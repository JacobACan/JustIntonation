import { audioContext } from "@/lib/webAudio";
import { createContext, useRef, useState } from "react";

interface Countdown {
  timeLeft: number;
  totalTime: number;
}

export const CountdownContext = createContext(
  {} as {
    countdown: Countdown;
    startCountdown: (totalMS: number) => void;
    stopCountdown: () => void;
  }
);

const UPDATE_SPEED = 50; //ms

export default function CountdownProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [countdown, setCountdown] = useState<Countdown>({
    timeLeft: 0,
    totalTime: 0,
  });
  let intervalRef = useRef<NodeJS.Timeout>(undefined);

  const startCountdown = (totalMS: number) => {
    const totalSeconds = totalMS / 1000;
    const startTime = audioContext.currentTime;
    stopCountdown();
    intervalRef.current = setInterval(() => {
      const timePassedSinceStart = audioContext.currentTime - startTime;
      const timeLeft = totalSeconds - timePassedSinceStart;
      if (timeLeft <= 0) {
        setCountdown({ ...countdown, timeLeft: 0, totalTime: 0 });
        clearInterval(intervalRef.current);
      }

      setCountdown((c) => {
        return { ...c, timeLeft: timeLeft, totalTime: totalSeconds };
      });
    }, UPDATE_SPEED);
  };

  const stopCountdown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown({ timeLeft: 0, totalTime: 0 });
  };

  const value = { startCountdown, stopCountdown, countdown };

  return <CountdownContext value={value}>{children}</CountdownContext>;
}
