import { Note, QuestionMelody } from "../constants/notes";

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
export let melodyQuestion: QuestionMelody[] = [];

//
export const pushGuess = (note: Note, timeStamp: number) => {
  const notePlayedAtSameTimeAsLastNote =
    melodyGuess[melodyGuess.length - 1].timeStamp + 0.1 >= timeStamp;

  if (notePlayedAtSameTimeAsLastNote) {
    melodyGuess[melodyGuess.length - 1].notes.push(note);
    melodyGuess[melodyGuess.length - 1].timeStamp = timeStamp;
  } else {
    melodyGuess.push({ notes: [note], timeStamp: timeStamp });
  }
};

// returns
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
