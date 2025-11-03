import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { noteToMidi } from "@/constants/midi";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import { useMIDINote } from "@react-midi/hooks";
import { useSelector } from "@xstate/react";
import { useContext, useEffect } from "react";

export default function MonitorNotes() {
  const note = useMIDINote();
  const learningStateActor = useContext(MusicLearnerContext);
  if (!learningStateActor) return <></>;

  const { questionNote } = useSelector(learningStateActor, (a) => {
    return { questionNote: a.context.questionContext.currentNote };
  });

  useEffect(() => {
    if (note && note.on && questionNote) {
      if (note.note == noteToMidi[questionNote]) {
        learningStateActor.send({ type: MusicLearnerEvent.CORRECT_GUESS });
      } else {
        learningStateActor.send({ type: MusicLearnerEvent.INCORRECT_GUESS });
      }
    }
  }, [note]);

  return <></>;
}
