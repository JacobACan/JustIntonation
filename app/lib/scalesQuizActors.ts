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
  playNote,
  stopActiveNodes,
} from "./webAudio";
import { noteToNoteFile } from "./notes";
import { midiToNote, Note } from "@/constants/notes";
import { noteToMidi, keyToMidi, midiNotesValues } from "@/constants/midi";
import { Key } from "@/constants/keys";
import { ScalesQuizMode } from "@/constants/scalesQuizSettings";
import {
  SCALES_MASTERY_STORAGE_KEY,
  DEGREE_MASTERY_STORAGE_KEY,
} from "@/constants/masteryConfig";
import {
  getNextMasteryMelody,
  loadMasteryStore,
  loadDegreeMasteryStore,
  getActiveDegrees,
  getMasteredDegrees,
  getMasteredPairs,
  shouldStartDegreeFinalTest,
  createDegreeFinalTestQueue,
  shouldStartMelodyFinalTest,
  createMelodyFinalTestQueue,
  getCurrentMelodyMasteryLevel,
  recordMelodyReviewResult,
} from "./mastery";

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
  if (
    input.settings.pianoSoundEnabled &&
    input.questionContext.questionNumber > 0
  ) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  learningStateGainNode.gain.cancelScheduledValues(audioContext.currentTime);
  learningStateGainNode.gain.setValueAtTime(1, audioContext.currentTime);

  // Pick a new random key
  const newKey =
    input.settings.questionKeys[
      Math.floor(Math.random() * input.settings.questionKeys.length)
    ];

  const isFirstQuestion = input.questionContext.previousKey === undefined;
  const keyChanged = input.questionContext.currentKey !== newKey;

  // Update key tracking
  input.questionContext.previousKey = input.questionContext.currentKey;
  input.questionContext.currentKey = newKey;

  // Only restart cadence if the key/shape actually changed
  if (isFirstQuestion || keyChanged) {
    stopActiveNodes();
    const cadenceKey = getModeRootKey(
      newKey,
      Scale.major,
      input.settings.startingDegree,
    );
    playCadence(cadenceKey);
    // Let the cadence establish before playing the question
    await new Promise((r) => setTimeout(r, 500));
  }

  if (input.settings.quizMode === ScalesQuizMode.Degree) {
    // Pick a random semitone offset from included (or active) degrees
    let included = input.settings.includedDegrees;

    if (input.settings.masteryMode) {
      const degreeStore = loadDegreeMasteryStore(DEGREE_MASTERY_STORAGE_KEY);
      const keyDegreeMastery = degreeStore.keys[newKey] ?? {
        degrees: {},
        fullyMasteredWith: null,
        consecutiveReviewErrors: 0,
      };

      // Check if final test should start
      if (
        shouldStartDegreeFinalTest(keyDegreeMastery, included) &&
        !input.questionContext.finalTestActive
      ) {
        input.questionContext.finalTestActive = true;
        input.questionContext.finalTestQueue =
          createDegreeFinalTestQueue(included);
        input.questionContext.finalTestProgress = 0;
        input.questionContext.finalTestTotal = included.length;
      }

      // If in final test, pick next item from queue
      if (
        input.questionContext.finalTestActive &&
        input.questionContext.finalTestQueue.length > 0
      ) {
        included = [Number(input.questionContext.finalTestQueue[0])];
      } else if (!input.questionContext.finalTestActive) {
        // Normal mastery flow
        const freq = input.settings.masteryReviewFrequency;
        const qNum = input.questionContext.questionNumber;
        const mastered = getMasteredDegrees(keyDegreeMastery, included);
        const isReviewQuestion =
          freq > 0 && mastered.length > 0 && qNum > 0 && qNum % freq === 0;

        if (isReviewQuestion) {
          included = mastered;
        } else {
          const active = getActiveDegrees(keyDegreeMastery, included);
          if (active.length > 0) {
            included = active;
          }
        }
      }
    }

    const randomSemitone =
      included[Math.floor(Math.random() * included.length)];

    // Compute the pitch class of the target note
    const rootPitchClass = keyToMidi[newKey] % 12;
    const targetPitchClass = (rootPitchClass + randomSemitone) % 12;

    // Find a note with that pitch class in the display range
    const [rangeStart, rangeEnd] = getScaleDisplayRange(
      newKey,
      Scale.major,
      input.settings.startingDegree,
      input.settings.octaves,
    );
    const rangeMin = noteToMidi[rangeStart];
    const rangeMax = noteToMidi[rangeEnd];

    const candidates: Note[] = [];
    for (let midi = rangeMin; midi <= rangeMax; midi++) {
      if (midi % 12 === targetPitchClass && midiToNote[midi]) {
        candidates.push(midiToNote[midi]);
      }
    }

    const targetNote =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : midiToNote[rangeMin + randomSemitone];

    input.questionContext.currentMelody = undefined;
    input.questionContext.expectedDegree = randomSemitone;
    input.questionContext.expectedAnswer = targetNote;
    input.questionContext.questionTime = 0;

    if (input.settings.playDegreeAudio && targetNote) {
      playNote(noteToNoteFile(targetNote));
    }
  } else {
    if (input.settings.masteryMode) {
      // Mastery mode: generate degree-constrained melodies
      const store = loadMasteryStore(SCALES_MASTERY_STORAGE_KEY);

      // Check if this question should review mastered pairs
      const freq = input.settings.masteryReviewFrequency;
      const qNum = input.questionContext.questionNumber;
      const keyMasteryData = store.keys[newKey];
      const masteredMelodyPairs = keyMasteryData
        ? getMasteredPairs(keyMasteryData, input.settings.includedDegrees)
        : [];
      const isReviewQuestion =
        freq > 0 &&
        masteredMelodyPairs.length > 0 &&
        qNum > 0 &&
        qNum % freq === 0;

      const result = getNextMasteryMelody(
        newKey,
        input.settings.includedDegrees,
        input.settings.startingDegree,
        input.settings.octaves,
        store,
        input.settings.melodyIntervalMin,
        input.settings.melodyIntervalMax,
        isReviewQuestion,
      );

      input.questionContext.currentMelody = result.melody;
      input.questionContext.currentDegreePairs = result.degreePairs;
      input.questionContext.expectedDegree = undefined;
      input.questionContext.expectedAnswer = midiToNote[result.melody[0].note];
      input.questionContext.questionTime =
        (await playMelody(result.melody)) * 1000;
    } else {
      // Normal mode: random melodies
      const questionRange = getScaleDisplayRange(
        newKey,
        Scale.major,
        input.settings.startingDegree,
        input.settings.octaves,
      );

      // Build note weights from includedDegrees (semitone offsets from root)
      const rootPitchClass = keyToMidi[newKey] % 12;
      const includedPitchClasses = new Set(
        input.settings.includedDegrees.map((s) => (rootPitchClass + s) % 12),
      );
      const noteWeights = midiNotesValues.map((midi) => ({
        note: midiToNote[midi],
        weight: (includedPitchClasses.has(midi % 12) ? 1 : 0) as 0 | 1,
      }));

      const melody = getNextQuestionMelody(
        noteWeights,
        questionRange,
        input.settings.melodyLength,
        input.settings.melodyIntervalMin,
        input.settings.melodyIntervalMax,
      );

      input.questionContext.currentMelody = melody;
      input.questionContext.currentDegreePairs = undefined;
      input.questionContext.expectedDegree = undefined;
      input.questionContext.expectedAnswer = midiToNote[melody[0].note];
      input.questionContext.questionTime = (await playMelody(melody)) * 1000;
    }
  }
};
