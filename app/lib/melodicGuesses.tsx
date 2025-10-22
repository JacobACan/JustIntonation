import { Duration, Note, QuestionMelody } from "../constants/notes";
import { audioContext } from "./webAudio";

export interface GuessMelody {
  notes: Note[];
  timeStamp: number; // double in seconds
}
export enum GuessMelodyStatus {
  Wrong,
  CorrectUpToCurrent,
  CompletelyCorrect,
}
export let melodyGuess: GuessMelody[] = [];
export let melodyQuestion: QuestionMelody[] = [
  { notes: [Note.G3, Note.C3], duration: Duration.EigthNote },
  { notes: [Note.A3], duration: Duration.EigthNote },
  { notes: [Note.C4], duration: Duration.QuarterNote },
  { notes: [Note.D4, Note.G4], duration: Duration.WholeNote },
];

//Pushes next guess to the global guess object list
export const pushGuess = (note: Note) => {
  const timeStamp = audioContext.currentTime;
  let notePlayedAtSameTimeAsLastNote = false;
  if (melodyGuess.length > 0) {
    notePlayedAtSameTimeAsLastNote =
      melodyGuess[melodyGuess.length - 1].timeStamp + 0.1 >= timeStamp;
  }

  if (notePlayedAtSameTimeAsLastNote) {
    melodyGuess[melodyGuess.length - 1].notes.push(note);
    melodyGuess[melodyGuess.length - 1].timeStamp = timeStamp;
  } else {
    melodyGuess.push({ notes: [note], timeStamp: timeStamp });
  }
  console.log(melodyGuess);
};

// Checks the global guess object list
export const checkGuessRealTime = (): GuessMelodyStatus => {
  if (melodyGuess.length < melodyQuestion.length) {
    if (guessMatchesQuestionToCurrent()) {
      return GuessMelodyStatus.CorrectUpToCurrent;
    } else {
      return GuessMelodyStatus.Wrong;
    }
  } else if (melodyGuess.length == melodyQuestion.length) {
    if (guessMatchesQuestionToCurrent()) {
      return GuessMelodyStatus.CompletelyCorrect;
    } else {
      return GuessMelodyStatus.Wrong;
    }
  } else {
    return GuessMelodyStatus.Wrong;
  }
};

export const resetGlobalGuessObject = () => {
  melodyGuess = [];
};

const guessMatchesQuestionToCurrent = (): boolean => {
  for (let i = 1; i < melodyGuess.length; i++) {
    console.log(
      `Comparing guess ${melodyGuess} and question ${melodyQuestion} `
    );
    const prevGuessNotes = melodyGuess[i - 1].notes;
    const currentGuessNotes = melodyGuess[i].notes;

    const prevQuestionNotes = melodyQuestion[i - 1].notes;
    const currentQuestionNotes = melodyQuestion[i].notes;

    currentGuessNotes.forEach((n) => {
      if (!currentQuestionNotes.includes(n)) return false;
    });
  }
  return true;
};
