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

  const { isGuessing, isReviewing, isViewingResults, questionContext } =
    useSelector(musicActor, (m) => {
      return {
        isGuessing: m.matches(MusicLearnerState.GUESSING),
        isReviewing: m.matches(MusicLearnerState.REVIEWING),
        isViewingResults: m.matches(MusicLearnerState.VIEWING_RESULTS),
        questionContext: m.context.questionContext,
      };
    });

  const getProgressValue = (): number => {
    if (isGuessing && countdown.timeLeft != 0) {
      return (countdown.timeLeft / countdown.totalTime) * 100;
    }
    return 100;
  };

  useEffect(() => {
    if (isGuessing) {
      // This is hacky because the state machine goes to the next state after timeToAnswerQuestion + questionTime * 2
      // but we only want the countdown to run for timeToAnswerQuestion + questionTime so it looks better to the user
      stopCountdown();
      setTimeout(() => {
        startCountdown(
          settings.timeToAnswerQuestion + questionContext.questionTime,
        );
      }, questionContext.questionTime);
    }
  }, [isGuessing]);

  useEffect(() => {
    if (isReviewing || isViewingResults) {
      stopCountdown();
    }
  }, [isReviewing, isViewingResults]);
  return (
    <Progress value={getProgressValue()} className="m-2 w-[375px]">
      {getProgressValue()}
    </Progress>
  );
}
