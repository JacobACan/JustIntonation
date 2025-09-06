import { NoteWeight } from "../constants/keys";
import { noteToMidi } from "../constants/midi";
import { Note } from "../constants/notes";

export const getNextQuestionNote = (
  questionNoteWeights: NoteWeight[],
  questionRange: [Note, Note]
): Note => {
  // Get all notes in the question range with weight > 0
  // Possible to add randomness to choose notes with lower weights(notes outside the scale)
  const questionNotes = questionNoteWeights
    .filter(
      (nw) =>
        nw.weight > 0 &&
        noteToMidi[nw.note] >= noteToMidi[questionRange[0]] &&
        noteToMidi[nw.note] <= noteToMidi[questionRange[1]]
    )
    .map((nw) => nw.note);

  const randomNote =
    questionNotes[Math.floor(Math.random() * questionNotes.length)];
  return randomNote;
};
