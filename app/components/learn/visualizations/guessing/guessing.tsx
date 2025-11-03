import { useMIDINote, useMIDINotes } from "@react-midi/hooks";
import Piano from "../../piano";
import { useContext, useEffect, useRef, useState } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { LearningMode } from "@/constants/settings";
import { midiToNote, Note } from "@/constants/notes";
import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { useSelector } from "@xstate/react";

export default function GuessingVisualization() {
  const { settings } = useContext(SettingsContext);
  const musicActor = useContext(MusicLearnerContext);
  if (!musicActor) return <></>;

  const [currentMelodyNote, setCurrentMelodyNote] = useState<Note>();

  const { questionContext } = useSelector(musicActor, (m) => {
    return {
      questionContext: m.context.questionContext,
    };
  });

  const notes = useMIDINotes();
  const note = useMIDINote();
  const updatingCurrentMelodyVisual = useRef(true);

  useEffect(() => {
    if (questionContext.currentMelody) {
      updateCurrentMelodyNoteVisualInRealTime();
    }
  }, [questionContext.currentMelody]);

  useEffect(() => {
    if (questionContext.numberOfReplays > 0 && questionContext.currentMelody) {
      updateCurrentMelodyNoteVisualInRealTime();
    }
  }, [questionContext.numberOfReplays]);

  const updateCurrentMelodyNoteVisualInRealTime = async () => {
    let i = 0;
    if (questionContext.currentMelody) {
      while (
        updatingCurrentMelodyVisual.current &&
        i < questionContext.currentMelody.length
      ) {
        const currentNoteInMelody = questionContext.currentMelody[i];
        const timeUntilCurrentNote =
          currentNoteInMelody.secondsSinceLastNote * 1000;
        await new Promise((e) => setTimeout(e, timeUntilCurrentNote));
        if (currentNoteInMelody.on) {
          setCurrentMelodyNote(midiToNote[currentNoteInMelody.note]);
        }
        i++;
      }
    }
    await new Promise((e) => setTimeout(e, 1000));
    setCurrentMelodyNote(undefined);
  };

  const getNotesUserIsPlaying = () => {
    //Notes User Is Playing
    switch (settings.learningMode) {
      case LearningMode.Notes:
      case LearningMode.Melodies:
        if (note && note.on) return [midiToNote[note.note]];
        break;
      case LearningMode.Chords:
        if (notes.length > 0) return notes.map((n) => midiToNote[n.note]);
        break;
      default:
        return [];
    }
  };

  const getNotesFromQuestion = () => {
    switch (settings.learningMode) {
      case LearningMode.Notes:
        if (questionContext.currentNote) return [questionContext.currentNote];
        break;
      case LearningMode.Chords:
        if (questionContext.currentChord) return questionContext.currentChord;
        break;
      case LearningMode.Melodies:
        if (questionContext.currentMelody && currentMelodyNote)
          return [currentMelodyNote];
        break;
      default:
        return [];
    }
  };
  return (
    <>
      <Piano
        displayRange={settings.questionRange}
        notesDown1={getNotesUserIsPlaying()}
        notesDown2={getNotesFromQuestion()}
      />
    </>
  );
}
