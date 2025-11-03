import { CountdownContext } from "@/components/providers/countdownProvider";
import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { Progress } from "@/components/ui/progress";
import { MusicLearnerState } from "@/machines/musicLearningProcess";
import { useSelector } from "@xstate/react";
import { useContext, useEffect } from "react";

export default function CountdownVisualization() {
  const { settings } = useContext(SettingsContext);
  const { countdown, startCountdown, stopCountdown } =
    useContext(CountdownContext);
  const musicActor = useContext(MusicLearnerContext);
  if (!musicActor) return <></>;

  const { isGuessing, isReviewing, isViewingResults } = useSelector(
    musicActor,
    (m) => {
      return {
        isGuessing: m.matches(MusicLearnerState.GUESSING),
        isReviewing: m.matches(MusicLearnerState.REVIEWING),
        isViewingResults: m.matches(MusicLearnerState.VIEWING_RESULTS),
      };
    }
  );

  const getProgressValue = (): number => {
    if (isGuessing && countdown.timeLeft != 0) {
      return (countdown.timeLeft / countdown.totalTime) * 100;
    }
    return 100;
  };

  useEffect(() => {
    if (isGuessing) {
      startCountdown(settings.timeToAnswerQuestion);
    }
  }, [isGuessing]);

  useEffect(() => {
    if (isReviewing || isViewingResults) {
      stopCountdown();
    }
  }, [isReviewing, isViewingResults]);
  return (
    <Progress value={getProgressValue()} className="w-[375px] m-2">
      {getProgressValue()}
    </Progress>
  );
}
