import { QuestionMelody, Note, NoteFile } from "../constants/notes";
import { keyToCadence } from "../constants/cadences";
import { Key } from "../constants/keys";
import { noteToNoteFile } from "./notes";

console.log("Initializing Web Audio API");

export let audioContext: AudioContext;
export let masterGainNode: GainNode;
export let cadenceGainNode: GainNode;
export let cadence: AudioBufferSourceNode;

try {
  audioContext = new window.AudioContext();
  masterGainNode = audioContext.createGain();
  masterGainNode.connect(audioContext.destination);
  cadenceGainNode = audioContext.createGain();
  cadenceGainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
  cadenceGainNode.connect(audioContext.destination);
  cadence = audioContext.createBufferSource();
} catch (e) {
  // console.error("Web Audio API is not supported in this browser:", e);
}

// Helper to play a note by filename
export const playNote = (noteFile: NoteFile) => {
  const audio = new Audio(`/notes/${noteFile}`);
  audio.play();
};

// Play chord at a precise time all notes together no matter what
export const playChord = async (chord: Note[]) => {
  const noteFiles = chord.map((note) => noteToNoteFile(note));
  if (audioContext) {
    try {
      const audioBuffers = await loadAudioBuffers(noteFiles);

      // Gain Node to Normalize Volume of chord
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1 / audioBuffers.length;
      // Schedule all notes to play at the exact same time
      const startTime = audioContext.currentTime;
      audioBuffers.forEach((buffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);
        source.connect(audioContext.destination);
        // Interesting! Sources play from the start and go through the entire connected chain can can be started at a precise time
        source.start(startTime);
      });
    } catch (error) {
      console.error("Failed to play chord:", error);
    }
  } else {
    // Fallback Less precise timing more consistent accross all browsers
    noteFiles.forEach((noteFile) => {
      const audio = new Audio(`/notes/${noteFile}`);
      audio.play();
    });
  }
};

// Helper to play a note by filename
export const playCadence = async (key: Key) => {
  const cadenceFile = keyToCadence[key];
  const res = await fetch(`/cadences/${cadenceFile}`);

  const resBuffer = await res.arrayBuffer();
  cadence.buffer = await audioContext.decodeAudioData(resBuffer);

  const delay = audioContext.createDelay(10);
  delay.delayTime.setValueAtTime(10, audioContext.currentTime);

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(1, audioContext.currentTime);

  cadence.connect(delay);
  delay.connect(gain);
  gain.connect(delay).connect(cadenceGainNode);

  cadence.connect(cadenceGainNode);

  cadence.start();
};

export const playMelody = async (
  melody: QuestionMelody[],
  relGain: number = 1
) => {
  const bpm = 60;

  const noteDurations = melody.map((n) => n.duration);
  let delay = 0;
  const delayOffset = 60 / bpm;
  for (let j = 0; j < melody.length; j++) {
    const noteFiles = melody[j].notes.map((n) => noteToNoteFile(n));
    const noteDuration = noteDurations[j];

    const audioBuffers = await loadAudioBuffers(noteFiles);
    const noteLength = delayOffset * noteDuration;

    const relativeGain = audioContext.createGain();
    relativeGain.gain.setValueAtTime(relGain, audioContext.currentTime);
    relativeGain.connect(audioContext.destination);

    const decayNode = audioContext.createGain();
    decayNode.connect(relativeGain);
    decayNode.gain.exponentialRampToValueAtTime(
      0.1,
      audioContext.currentTime + delay + noteLength
    );

    audioBuffers.forEach((b) => {
      const source = audioContext.createBufferSource();
      source.buffer = b;
      source.connect(decayNode);
      source.start(audioContext.currentTime + delay);
    });

    delay += noteLength;
  }
};

const loadAudioBuffers = async (noteFiles: NoteFile[]) => {
  return await Promise.all(
    noteFiles.map(async (noteFile) => {
      const response = await fetch(`/notes/${noteFile}`);
      const arrayBuffer = await response.arrayBuffer();
      return audioContext.decodeAudioData(arrayBuffer);
    })
  );
};
