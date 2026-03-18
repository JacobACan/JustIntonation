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
import { ScalesQuizMode } from "@/constants/scalesQuizSettings";

const DEGREE_NAMES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

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
  } = useSelector(scalesQuizActor, (s) => ({
    isIdle: s.matches(ScalesQuizState.IDLE),
    isGuessing: s.matches(ScalesQuizState.GUESSING),
    isReviewing: s.matches(ScalesQuizState.REVIEWING),
    isViewingResults: s.matches(ScalesQuizState.VIEWING_RESULTS),
    totalQuestions: s.context.settings.numberOfQuestions,
    questionContext: s.context.questionContext,
    quizMode: s.context.settings.quizMode,
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
            {!isDegreeMode && (
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <button
        className="absolute top-5 left-5 flex items-center justify-center"
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
        isGuessing &&
        questionContext.expectedDegree !== undefined && (
          <h1 className="mb-4 text-4xl font-bold">
            Play the {DEGREE_NAMES[questionContext.expectedDegree]}
          </h1>
        )}
      <ScaleVisualization />
      <h2 className="mt-4 text-sm font-bold">
        {questionContext.currentKey} Major
      </h2>
      <h2 className="mt-4 text-sm font-bold">{totalQuestions} Questions</h2>
      <h3 className="text-[var(--middleground1)]">
        {questionContext.questionsCorrect} / {questionContext.questionNumber}
      </h3>
      {(isGuessing || isReviewing) && <MonitorScalesAnswer />}
    </div>
  );
}
