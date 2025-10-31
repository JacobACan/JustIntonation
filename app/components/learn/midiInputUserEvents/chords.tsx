import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { noteToMidi } from "@/constants/midi";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import { useMIDINote, useMIDINotes } from "@react-midi/hooks";
import { useSelector } from "@xstate/react";
import { useContext, useEffect } from "react";

export default function MonitorChords() {
  const notes = useMIDINotes();
  const learningStateActor = useContext(MusicLearnerContext);
  if (!learningStateActor) return <></>;

  const { questionChord } = useSelector(learningStateActor, (a) => {
    return { questionChord: a.context.questionContext.currentChord };
  });

  useEffect(() => {
    if (questionChord && notes.length == questionChord.length) {
      const midiNotes = notes.map((n) => n.note);
      console.log(midiNotes);
      console.log(questionChord);
      if (questionChord.every((n) => midiNotes.includes(noteToMidi[n]))) {
        learningStateActor.send({ type: MusicLearnerEvent.CORRECT_GUESS });
      } else {
        learningStateActor.send({ type: MusicLearnerEvent.INCORRECT_GUESS });
      }
    }
  }, [notes]);

  return <></>;
}
