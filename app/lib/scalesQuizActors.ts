import { Scale } from "@/constants/scale";
import { ScalesQuizContext } from "@/machines/scalesQuizProcess";
import {
  noteWeightsForScale,
  getScaleDisplayRange,
  getModeRootKey,
} from "./key";
import { getNextQuestionMelody } from "./questions";
import {
  audioContext,
  learningStateGainNode,
  playCadence,
  playMelody,
  stopActiveNodes,
} from "./webAudio";
import { midiToNote } from "@/constants/notes";
import { noteToMidi } from "@/constants/midi";
import { Key } from "@/constants/keys";
import { ScalesQuizMode } from "@/constants/scalesQuizSettings";

/**
 * Gets all scale notes within the display range, returning them in order.
 */
const getScaleNotesInRange = (
  key: Key,
  startingDegree: number,
  octaves: 1 | 2,
) => {
  const [rangeStart, rangeEnd] = getScaleDisplayRange(
    key,
    Scale.major,
    startingDegree,
    octaves,
  );
  const allWeights = noteWeightsForScale(key, Scale.major);
  const rangeMin = noteToMidi[rangeStart];
  const rangeMax = noteToMidi[rangeEnd];

  return allWeights
    .filter(
      (nw) =>
        nw.weight > 0 &&
        noteToMidi[nw.note] >= rangeMin &&
        noteToMidi[nw.note] <= rangeMax,
    )
    .map((nw) => nw.note);
};

export const playScalesQuizQuestion = async (input: ScalesQuizContext) => {
  // If piano sound is on, wait for the played note to ring out before next question
  if (input.settings.pianoSoundEnabled && input.questionContext.questionNumber > 0) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  learningStateGainNode.gain.cancelScheduledValues(audioContext.currentTime);
  learningStateGainNode.gain.setValueAtTime(1, audioContext.currentTime);

  // Pick a new random key
  const newKey =
    input.settings.questionKeys[
      Math.floor(Math.random() * input.settings.questionKeys.length)
    ];

  const previousKey = input.questionContext.previousKey;
  const isFirstQuestion = previousKey === undefined;
  const keyChanged = previousKey !== newKey;

  // Update key tracking
  input.questionContext.previousKey = input.questionContext.currentKey;
  input.questionContext.currentKey = newKey;

  // On key change (or first question), stop old audio and start cadence for the mode root
  if (isFirstQuestion || keyChanged) {
    stopActiveNodes();
    const cadenceKey = getModeRootKey(newKey, Scale.major, input.settings.startingDegree);
    playCadence(cadenceKey);
  }

  if (input.settings.quizMode === ScalesQuizMode.Degree) {
    const scaleNotes = getScaleNotesInRange(
      newKey,
      input.settings.startingDegree,
      input.settings.octaves,
    );
    const scaleLength = 7;
    const randomDegree = Math.floor(Math.random() * scaleLength);

    const degreeNotes = scaleNotes.filter(
      (_note, i) => i % scaleLength === randomDegree,
    );
    const targetNote =
      degreeNotes[Math.floor(Math.random() * degreeNotes.length)];

    input.questionContext.currentMelody = undefined;
    input.questionContext.expectedDegree = randomDegree;
    input.questionContext.expectedAnswer = targetNote;
    input.questionContext.questionTime = 0;
  } else {
    const questionRange = getScaleDisplayRange(
      newKey,
      Scale.major,
      input.settings.startingDegree,
      input.settings.octaves,
    );
    const noteWeights = noteWeightsForScale(newKey, Scale.major);

    const melody = getNextQuestionMelody(
      noteWeights,
      questionRange,
      input.settings.melodyLength,
      input.settings.melodyIntervalMin,
      input.settings.melodyIntervalMax,
    );

    input.questionContext.currentMelody = melody;
    input.questionContext.expectedDegree = undefined;
    input.questionContext.expectedAnswer = midiToNote[melody[0].note];
    input.questionContext.questionTime = (await playMelody(melody)) * 1000;
  }
};
