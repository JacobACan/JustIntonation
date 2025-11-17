import { Interval } from "@/constants/intervals";
import { NoteWeight } from "../constants/keys";
import { noteToMidi } from "../constants/midi";
import { Duration, JIMIDINote, Note } from "../constants/notes";
import { isNoteToBeAddedPlayableBy1Hand } from "./notes";

export const getNextQuestionNote = (
  questionNoteWeights: NoteWeight[],
  questionRange: [Note, Note],
): Note => {
  // Get all notes in the question range with weight > 0
  // Possible to add randomness to choose notes with lower weights(notes outside the scale)
  const questionNotes = questionNoteWeights
    .filter(
      (nw) =>
        nw.weight > 0 &&
        noteToMidi[nw.note] >= noteToMidi[questionRange[0]] &&
        noteToMidi[nw.note] <= noteToMidi[questionRange[1]],
    )
    .map((nw) => nw.note);

  const randomNote =
    questionNotes[Math.floor(Math.random() * questionNotes.length)];
  return randomNote;
};

export const getNextQuestionChord = (
  questionNoteWeights: NoteWeight[],
  questionRange: [Note, Note],
  numNotes: number,
): Note[] => {
  const questionNotes = questionNoteWeights
    .filter(
      (nw) =>
        nw.weight > 0 &&
        noteToMidi[nw.note] >= noteToMidi[questionRange[0]] &&
        noteToMidi[nw.note] <= noteToMidi[questionRange[1]],
    )
    .map((nw) => nw.note);
  if (questionNotes.length >= numNotes) {
    const selectedNotes: Note[] = [];
    while (selectedNotes.length < numNotes) {
      const randomNote =
        questionNotes[Math.floor(Math.random() * questionNotes.length)];
      if (isNoteToBeAddedPlayableBy1Hand(randomNote, selectedNotes))
        selectedNotes.push(randomNote);
    }
    return selectedNotes;
  }
  return [];
};

export const getNextQuestionMelody = (
  questionNoteWeights: NoteWeight[],
  questionRange: [Note, Note],
  length: number,
  minInterval: Interval,
  maxInterval: Interval,
): JIMIDINote[] => {
  const qm: JIMIDINote[] = [];

  const questionNotes = questionNoteWeights
    .filter(
      (nw) =>
        nw.weight > 0 &&
        noteToMidi[nw.note] >= noteToMidi[questionRange[0]] &&
        noteToMidi[nw.note] <= noteToMidi[questionRange[1]],
    )
    .map((nw) => nw.note);

  for (let i = 0; i < length; i++) {
    let randomDuration: number = 0;
    if (i != 0) {
      // Frist note in melody starts instantly
      randomDuration = [
        Duration.QuarterNote,
        Duration.EigthNote,
        Duration.SixteenthNote,
      ][Math.floor(Math.random() * 3)];
    }

    const nextQuestionNotes = questionNotes.filter(
      (n) =>
        qm.length == 0 ||
        (Math.abs(noteToMidi[n] - qm[qm.length - 1].note) >= minInterval &&
          Math.abs(noteToMidi[n] - qm[qm.length - 1].note) <= maxInterval),
    );

    const randomNote =
      nextQuestionNotes[Math.floor(nextQuestionNotes.length * Math.random())];

    qm.push({
      secondsSinceLastNote: randomDuration,
      note: noteToMidi[randomNote],
      channel: 1,
      on: true,
      velocity: 1,
    });
  }

  return qm;
};
