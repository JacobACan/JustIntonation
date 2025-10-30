"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { midiToNote, Note } from "../../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import { SettingsContext } from "../../components/providers/settingsProvider";
import { noteToNoteFile } from "../../lib/notes";
import { playNote } from "../../lib/webAudio";
import { getNextQuestionNote } from "../../lib/questions";
import Piano from "@/components/learn/piano";
import { Progress } from "@/components/ui/progress";
import { CountdownContext } from "@/components/providers/countdownProvider";
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

export default function LearnQuestions() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const { startCountdownTimer, countdownTimer } = useContext(CountdownContext);
  const { settings } = useContext(SettingsContext);
  const notes = useMIDINotes();
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

  useEffect(() => {
    if (isGuessing) startCountdownTimer(settings.timeToAnswerQuestion, 50);
  }, [isGuessing]);

  useEffect(() => {
    handleIncomingMidiNotes(notes);
  }, [notes]);

  const handleIncomingMidiNotes = (notes: MIDINote[]) => {
    if (notes.length > 0) {
      const note = notes[0];
      const notePlayed = midiToNote[note.note];
      setCurrentNote(notePlayed);
    }
  };

  const renderUserActions = () => {
    return (
      <section className="w-[50px] h-[50px]">
        {isIdle && (
          <LearningUserEvent eventType={MusicLearnerEvent.START}>
            <PlayIcon />
          </LearningUserEvent>
        )}
        {isGuessing && (
          <LearningUserEvent eventType={MusicLearnerEvent.REPLAY}>
            <ReplayIcon />
          </LearningUserEvent>
        )}
        {(isReviewing || isViewingResults) && (
          <LearningUserEvent eventType={MusicLearnerEvent.CONTINUE}>
            <ContinueIcon />
          </LearningUserEvent>
        )}
      </section>
    );
  };

  const getProgressValue = (): number => {
    if (isGuessing) {
      return (countdownTimer.timeLeft / countdownTimer.totalTime) * 100;
    }
    return 100;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <LearningUserEvent
        className=" absolute left-3 top-3"
        eventType={MusicLearnerEvent.CHANGE_LEARNING_APPROACH}
      >
        <BackIcon />
      </LearningUserEvent>
      {renderUserActions()}
      <Progress value={getProgressValue()} className="w-[375px] m-2"></Progress>
      <Piano
        displayRange={settings.questionRange}
        notesDown2={[...(currentNote ? [currentNote] : [])]}
        notesDown1={
          questionContext.currentNote ? [questionContext.currentNote] : []
        }
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionContext.questionNumber} / {totalQuestions}
      </h2>
    </div>
  );
}
