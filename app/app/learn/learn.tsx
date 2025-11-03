"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { midiToNote, Note } from "../../constants/notes";
import { useMIDINote, useMIDINotes } from "@react-midi/hooks";
import { SettingsContext } from "../../components/providers/settingsProvider";
import Piano from "@/components/learn/piano";
import { Progress } from "@/components/ui/progress";
import CountdownProvider, {
  CountdownContext,
} from "@/components/providers/countdownProvider";
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

export default function LearnQuestions() {
  const { settings } = useContext(SettingsContext);
  const notes = useMIDINotes();
  const note = useMIDINote();
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

  const getNotesDown2 = () => {
    //Notes User Is Playing
    if (settings.learningMode == LearningMode.Notes) {
      if (note && note.on) return [midiToNote[note.note]];
    }
    if (settings.learningMode == LearningMode.Chords) {
      if (notes.length > 0) return notes.map((n) => midiToNote[n.note]);
    }
    return [];
  };

  const getNotesDown1 = () => {
    if (settings.learningMode == LearningMode.Notes) {
      if (questionContext.currentNote) return [questionContext.currentNote];
    }
    if (settings.learningMode == LearningMode.Chords) {
      if (questionContext.currentChord) return questionContext.currentChord;
    }
    return [];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <LearningUserEvent
        className=" absolute left-5 top-5"
        eventType={MusicLearnerEvent.CHANGE_LEARNING_APPROACH}
      >
        <BackIcon height={40} width={40} />
      </LearningUserEvent>
      {renderUserActions()}
      <CountdownProvider>
        <CountdownVisualization />
      </CountdownProvider>
      <Piano
        displayRange={settings.questionRange}
        notesDown2={getNotesDown2()}
        notesDown1={getNotesDown1()}
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionContext.questionNumber} / {totalQuestions}
      </h2>
      {isGuessing &&
        ((settings.learningMode == LearningMode.Notes && <MonitorNotes />) ||
          (settings.learningMode == LearningMode.Chords && <MonitorChords />) ||
          (settings.learningMode == LearningMode.Melodies && (
            <MonitorMelodies />
          )))}
    </div>
  );
}
