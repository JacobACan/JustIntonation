import { LearningMode, Settings } from "@/constants/settings";
import { playCadence, playChord, playMelody, playNote } from "./webAudio";
import {
  getNextQuestionChord,
  getNextQuestionMelody,
  getNextQuestionNote,
} from "./questions";
import { noteToNoteFile } from "./notes";
import { MusicLearnerContext } from "@/machines/musicLearningProcess";
import { noteWeightsForScale } from "./key";

export const playMusicContext = async (input: MusicLearnerContext) => {
  if (input.settings.playCadence)
    switch (input.settings.learningMode) {
      case LearningMode.Notes:
      case LearningMode.Chords:
      case LearningMode.Melodies:
        playCadence(input.questionContext.currentKey);
        await new Promise((r) => setTimeout(r, 2000));
        break;
    }
  return;
};

export const playQuestion = async (input: MusicLearnerContext) => {
  if (!input.settings.pianoSoundMuted)
    await new Promise((r) => setTimeout(r, 500));
  switch (input.settings.learningMode) {
    case LearningMode.Notes:
      const note = getNextQuestionNote(
        noteWeightsForScale(
          input.questionContext.currentKey,
          input.questionContext.currentScale,
        ),
        input.settings.questionRange,
      );
      playNote(noteToNoteFile(note));
      input.questionContext.currentNote = note;
      await new Promise((r) => setTimeout(r, 200));
      break;
    case LearningMode.Chords:
      const chord = getNextQuestionChord(
        noteWeightsForScale(
          input.questionContext.currentKey,
          input.questionContext.currentScale,
        ),
        input.settings.questionRange,
        input.settings.chordSize,
      );
      playChord(chord);
      input.questionContext.currentChord = chord;
      await new Promise((r) => setTimeout(r, 200));
      break;
    case LearningMode.Melodies:
      const melody = getNextQuestionMelody(
        noteWeightsForScale(
          input.questionContext.currentKey,
          input.questionContext.currentScale,
        ),
        input.settings.questionRange,
        input.settings.melodyLength,
        input.settings.melodyIntervalMin,
        input.settings.melodyIntervalMax,
      );
      input.questionContext.currentMelody = melody;
      input.questionContext.questionTime = (await playMelody(melody)) * 1000;

      break;
  }
  return;
};
