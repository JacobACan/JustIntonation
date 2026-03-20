"use client";

import { useContext } from "react";
import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { ScalesQuizEvent, ScalesQuizState } from "@/machines/scalesQuizProcess";
import { useSelector } from "@xstate/react";
import ScaleVisualization from "./scaleVisualization";
import MonitorScalesAnswer from "./monitorScalesAnswer";
import PlayIcon from "@/components/icon/playIcon";
import ReplayIcon from "@/components/icon/replayIcon";
import ContinueIcon from "@/components/icon/continueIcon";
import BackIcon from "@/components/icon/backIcon";
import { ScalesQuizMode, DEGREE_OPTIONS } from "@/constants/scalesQuizSettings";
import MasteryProgressPanel from "./masteryProgressPanel";
import DegreeMasteryProgressPanel from "./degreeMasteryProgressPanel";
import { midiToNote } from "@/constants/notes";
import { Key } from "@/constants/keys";

const ALL_KEYS: Key[] = [
  Key.C,
  Key.Db,
  Key.D,
  Key.Eb,
  Key.E,
  Key.F,
  Key.Gb,
  Key.G,
  Key.Ab,
  Key.A,
  Key.Bb,
  Key.B,
];

const SEMITONE_TO_LABEL: { [s: number]: string } = {};
DEGREE_OPTIONS.forEach((d) => (SEMITONE_TO_LABEL[d.semitone] = d.label));

export default function ScalesQuiz() {
  const scalesQuizActor = useContext(ScalesQuizMachineContext);
  if (!scalesQuizActor) return null;

  const {
    isIdle,
    isGuessing,
    isReviewing,
    isViewingResults,
    totalQuestions,
    questionContext,
    quizMode,
    playDegreeAudio,
    masteryMode,
    includedDegrees,
    questionKeys,
  } = useSelector(scalesQuizActor, (s) => ({
    isIdle: s.matches(ScalesQuizState.IDLE),
    isGuessing: s.matches(ScalesQuizState.GUESSING),
    isReviewing: s.matches(ScalesQuizState.REVIEWING),
    isViewingResults: s.matches(ScalesQuizState.VIEWING_RESULTS),
    totalQuestions: s.context.settings.numberOfQuestions,
    questionContext: s.context.questionContext,
    quizMode: s.context.settings.quizMode,
    playDegreeAudio: s.context.settings.playDegreeAudio,
    masteryMode: s.context.settings.masteryMode,
    includedDegrees: s.context.settings.includedDegrees,
    questionKeys: s.context.settings.questionKeys,
  }));

  const sendEvent = (type: ScalesQuizEvent) => {
    scalesQuizActor.send({ type });
  };

  const isDegreeMode = quizMode === ScalesQuizMode.Degree;

  const renderUserActions = () => {
    return (
      <section className="h-[50px] w-[50px]">
        {isIdle && (
          <button
            className="flex items-center justify-center"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              cursor: "pointer",
            }}
            onClick={() => sendEvent(ScalesQuizEvent.START)}
          >
            <PlayIcon />
          </button>
        )}
        {isGuessing && !questionContext.isReplaying && !isDegreeMode && (
          <button
            className="flex items-center justify-center"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              cursor: "pointer",
            }}
            onClick={() => sendEvent(ScalesQuizEvent.REPLAY)}
          >
            <ReplayIcon />
          </button>
        )}
        {isReviewing && (
          <div className="flex gap-2">
            <button
              className="flex items-center justify-center"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                cursor: "pointer",
              }}
              onClick={() => sendEvent(ScalesQuizEvent.REPLAY)}
            >
              <ReplayIcon />
            </button>
            <button
              className="flex items-center justify-center"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                cursor: "pointer",
              }}
              onClick={() => sendEvent(ScalesQuizEvent.CONTINUE)}
            >
              <ContinueIcon />
            </button>
          </div>
        )}
        {isViewingResults && (
          <button
            className="flex items-center justify-center"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              cursor: "pointer",
            }}
            onClick={() => sendEvent(ScalesQuizEvent.CONTINUE)}
          >
            <ContinueIcon />
          </button>
        )}
      </section>
    );
  };

  const showMasteryPanel = masteryMode && (isReviewing || isViewingResults);

  return (
    <div className="relative flex min-h-screen">
      {/* Mastery progress side panel */}
      {showMasteryPanel && (
        <aside className="absolute top-0 left-0 z-10 h-full w-[260px] overflow-y-auto p-4 pt-16">
          <div className="via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-10%" />
          <div className="relative z-10">
            {isDegreeMode ? (
              <DegreeMasteryProgressPanel
                currentKey={questionContext.currentKey}
                questionKeys={questionKeys}
                includedDegrees={includedDegrees}
                refreshKey={questionContext.questionNumber}
                finalTestActive={questionContext.finalTestActive}
                finalTestProgress={questionContext.finalTestProgress}
                finalTestTotal={questionContext.finalTestTotal}
              />
            ) : (
              <MasteryProgressPanel
                currentKey={questionContext.currentKey}
                questionKeys={questionKeys}
                includedDegrees={includedDegrees}
                refreshKey={questionContext.questionNumber}
              />
            )}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center py-2">
        <button
          className="absolute top-5 left-5 z-20 flex items-center justify-center"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
          }}
          onClick={() => sendEvent(ScalesQuizEvent.CHANGE_SETTINGS)}
        >
          <BackIcon height={40} width={40} />
        </button>
        {renderUserActions()}
        {isDegreeMode &&
          !playDegreeAudio &&
          isGuessing &&
          questionContext.expectedDegree !== undefined && (
            <h1 className="mb-4 text-4xl font-bold">
              Play the {SEMITONE_TO_LABEL[questionContext.expectedDegree]}
            </h1>
          )}
        {isReviewing &&
          questionContext.expectedDegree !== undefined &&
          isDegreeMode && (
            <h2 className="mb-2 text-lg text-[#60a5fa]">
              {SEMITONE_TO_LABEL[questionContext.expectedDegree]}
            </h2>
          )}
        {!isDegreeMode &&
          questionContext.currentMelody &&
          (isGuessing || isReviewing) && (
            <div className="mb-2 flex gap-1">
              {questionContext.currentMelody.map((melodyNote, i) => {
                const noteName = midiToNote[melodyNote.note];
                const isCorrect = i < questionContext.melodyProgress;
                const isCurrent = i === questionContext.melodyProgress;
                // Only show wrong highlight if user hasn't progressed past it yet
                const isWrong =
                  isReviewing &&
                  questionContext.melodyWrongIndex === i &&
                  questionContext.melodyProgress <= i;

                let bg =
                  "bg-[var(--middleground2)] text-[var(--middleground1)]";
                if (isWrong) bg = "bg-[#f87171] text-white";
                else if (isCorrect) bg = "bg-[#4ade80] text-white";
                else if (isCurrent)
                  bg = "bg-[var(--foreground)] text-[var(--background)]";

                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center rounded px-2 py-1 text-xs font-bold ${bg}`}
                  >
                    <span>{isReviewing || isCorrect ? noteName : i + 1}</span>
                    {isWrong && questionContext.melodyWrongNote && (
                      <span className="text-[0.6rem] opacity-75">
                        played: {questionContext.melodyWrongNote}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        <ScaleVisualization />
        <h2 className="mt-4 text-sm font-bold">
          Diatonic Shape {ALL_KEYS.indexOf(questionContext.currentKey) + 1}
        </h2>
        <h2 className="mt-4 text-sm font-bold">{totalQuestions} Questions</h2>
        <h3 className="text-[var(--middleground1)]">
          {questionContext.questionsCorrect} / {questionContext.questionNumber}
        </h3>
        {(isGuessing || isReviewing) && <MonitorScalesAnswer />}
      </div>
    </div>
  );
}
