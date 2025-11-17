"use client";

import { useContext, useEffect } from "react";
import { SettingsContext } from "../../components/providers/settingsProvider";
import CountdownProvider from "@/components/providers/countdownProvider";
import LearningUserEvent from "@/components/learn/learningUserEvent";
import PlayIcon from "@/components/icon/playIcon";
import {
  MusicLearnerEvent,
  MusicLearnerState,
} from "@/machines/musicLearningProcess";
import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { useSelector } from "@xstate/react";
import ReplayIcon from "@/components/icon/replayIcon";
import ContinueIcon from "@/components/icon/continueIcon";
import BackIcon from "@/components/icon/backIcon";
import MonitorNotes from "@/components/learn/midiInputUserEvents/notes";
import { LearningMode } from "@/constants/settings";
import MonitorChords from "@/components/learn/midiInputUserEvents/chords";
import MonitorMelodies from "@/components/learn/midiInputUserEvents/melodies";
import CountdownVisualization from "@/components/learn/visualizations/countdown";
import GuessingVisualization from "@/components/learn/visualizations/guessing/guessing";

export default function LearnQuestions() {
  const { settings } = useContext(SettingsContext);

  const musicLearner = useContext(MusicLearnerContext);
  if (!musicLearner) return;

  const {
    isIdle,
    isGuessing,
    isReviewing,
    isViewingResults,
    totalQuestions,
    questionContext,
  } = useSelector(musicLearner, (s) => {
    return {
      isIdle: s.matches(MusicLearnerState.IDLE),
      isGuessing: s.matches(MusicLearnerState.GUESSING),
      isReviewing: s.matches(MusicLearnerState.REVIEWING),
      isViewingResults: s.matches(MusicLearnerState.VIEWING_RESULTS),
      totalQuestions: s.context.settings.numberOfQuestions,
      questionContext: s.context.questionContext,
    };
  });

  const renderUserActions = () => {
    return (
      <section className="h-[50px] w-[50px]">
        {isIdle && (
          <LearningUserEvent eventType={MusicLearnerEvent.START}>
            <PlayIcon />
          </LearningUserEvent>
        )}
        {isGuessing && !questionContext.isReplaying && (
          <LearningUserEvent eventType={MusicLearnerEvent.REPLAY}>
            <ReplayIcon />
          </LearningUserEvent>
        )}
        {isReviewing && (
          <div className="flex gap-2">
            <LearningUserEvent eventType={MusicLearnerEvent.REPLAY}>
              <ReplayIcon />
            </LearningUserEvent>
            <LearningUserEvent eventType={MusicLearnerEvent.CONTINUE}>
              <ContinueIcon />
            </LearningUserEvent>
          </div>
        )}
        {isViewingResults && (
          <LearningUserEvent eventType={MusicLearnerEvent.CONTINUE}>
            <ContinueIcon />
          </LearningUserEvent>
        )}
      </section>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <LearningUserEvent
        className="absolute top-5 left-5"
        eventType={MusicLearnerEvent.CHANGE_LEARNING_APPROACH}
      >
        <BackIcon height={40} width={40} />
      </LearningUserEvent>
      {renderUserActions()}
      <CountdownProvider>
        <CountdownVisualization />
      </CountdownProvider>
      <GuessingVisualization />
      <h2 className="mt-8 text-sm font-bold">{totalQuestions} Questions</h2>
      <h3 className="text-[var(--middleground1)]">
        {questionContext.questionsCorrect} / {questionContext.questionNumber}
      </h3>
      {(isGuessing || isReviewing) &&
        ((settings.learningMode == LearningMode.Notes && <MonitorNotes />) ||
          (settings.learningMode == LearningMode.Chords && <MonitorChords />) ||
          (settings.learningMode == LearningMode.Melodies && (
            <MonitorMelodies />
          )))}
    </div>
  );
}
