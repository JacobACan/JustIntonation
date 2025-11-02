import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { JIMIDINote } from "@/constants/notes";
import { audioContext } from "@/lib/webAudio";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import { useMIDINote } from "@react-midi/hooks";
import { useSelector } from "@xstate/react";
import { useContext, useEffect, useRef } from "react";

export default function MonitorMelodies() {
  const note = useMIDINote();
  const secondlastNoteHit = useRef(0);
  const numberOfNotesGuessed = useRef(0);
  const secondsOfErrorTolerance = useRef(0.2);

  const learningStateActor = useContext(MusicLearnerContext);
  if (!learningStateActor) return <></>;

  const { questionMelody } = useSelector(learningStateActor, (a) => {
    return { questionMelody: a.context.questionContext.currentMelody };
  });

  const reduceQuestionMelodyToOnEvents = (): JIMIDINote[] => {
    const reducedQuestionMelody: JIMIDINote[] = [];
    let delayBetweenNoteOnEvents = 0;
    questionMelody?.forEach((n) => {
      if (n.on) {
        reducedQuestionMelody.push({
          channel: n.channel,
          note: n.note,
          on: true,
          secondsSinceLastNote: delayBetweenNoteOnEvents,
          velocity: n.velocity,
        });
        delayBetweenNoteOnEvents = 0;
      }
      delayBetweenNoteOnEvents += n.secondsSinceLastNote;
    });
    return reducedQuestionMelody;
  };
  const reducedQuestionMelody = reduceQuestionMelodyToOnEvents();
  const numberOfNotesInMelody = reducedQuestionMelody.length;

  useEffect(() => {
    console.log(reducedQuestionMelody);
    numberOfNotesGuessed.current = 0;
  }, [questionMelody]);

  useEffect(() => {
    if (note && note.on) {
      const i = numberOfNotesGuessed.current;

      numberOfNotesGuessed.current++;

      let timingCorrect = false;
      let noteCorrect = false;

      if (numberOfNotesGuessed.current == 1) {
        console.log("resetting time last note was hit");
        secondlastNoteHit.current = audioContext.currentTime;
      }
      const currentTime = audioContext.currentTime;
      const secondsSinceLastNote = currentTime - secondlastNoteHit.current;

      const JIMidiNote: JIMIDINote = {
        ...note,
        secondsSinceLastNote: secondsSinceLastNote,
      };
      console.log("JIMidiNote created:", JIMidiNote);

      const expectedTiming = reducedQuestionMelody[i].secondsSinceLastNote;
      const tolerance = secondsOfErrorTolerance.current;
      const upperBound = expectedTiming + tolerance;
      const lowerBound = expectedTiming - tolerance;

      console.log("E");
      console.log(expectedTiming);
      console.log(reducedQuestionMelody[i].note);
      console.log("A");
      console.log(secondsSinceLastNote);
      console.log(note.note);
      console.log();

      if (
        secondsSinceLastNote <= upperBound &&
        secondsSinceLastNote >= lowerBound
      ) {
        timingCorrect = true;
      }

      if (reducedQuestionMelody[i].note == note.note) noteCorrect = true;

      if (noteCorrect && timingCorrect) {
        console.log("correct");
        if (numberOfNotesGuessed.current == numberOfNotesInMelody)
          learningStateActor.send({ type: MusicLearnerEvent.CORRECT_GUESS });
      } else {
        learningStateActor.send({ type: MusicLearnerEvent.INCORRECT_GUESS });
      }

      secondlastNoteHit.current = currentTime;
    }
  }, [note]);

  return <></>;
}
