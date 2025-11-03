import { LearningMode, Settings } from "@/constants/settings";
import { playCadence, playChord, playMelody, playNote } from "./webAudio";
import {
  getNextQuestionChord,
  getNextQuestionMelody,
  getNextQuestionNote,
} from "./questions";
import { noteToNoteFile } from "./notes";
import { MusicLearnerContext } from "@/machines/musicLearningProcess";

export const playMusicContext = async (input: MusicLearnerContext) => {
  if (input.settings.playCadence)
    switch (input.settings.learningMode) {
      case LearningMode.Notes:
      case LearningMode.Chords:
      case LearningMode.Melodies:
        playCadence(input.settings.questionKey);
        await new Promise((r) => setTimeout(r, 2000));
        break;
    }
  return;
};

export const playQuestion = async (input: MusicLearnerContext) => {
  switch (input.settings.learningMode) {
    case LearningMode.Notes:
      const note = getNextQuestionNote(
        input.settings.questionNoteWeights,
        input.settings.questionRange
      );
      playNote(noteToNoteFile(note));
      input.questionContext.currentNote = note;
      await new Promise((r) => setTimeout(r, 200));
      break;
    case LearningMode.Chords:
      const chord = getNextQuestionChord(
        input.settings.questionNoteWeights,
        input.settings.questionRange,
        input.settings.chordSize
      );
      playChord(chord);
      input.questionContext.currentChord = chord;
      await new Promise((r) => setTimeout(r, 200));
      break;
    case LearningMode.Melodies:
      const melody = getNextQuestionMelody(
        input.settings.questionNoteWeights,
        input.settings.questionRange,
        input.settings.melodyLength
      );
      await playMelody(melody);
      input.questionContext.currentMelody = melody;

      break;
  }

  return;
};
