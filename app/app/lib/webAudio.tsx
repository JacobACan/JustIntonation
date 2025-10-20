import { MelodicNote, Note, NoteFile } from "../constants/notes";
import { keyToCadence } from "../constants/cadences";
import { Key } from "../constants/keys";
import { noteToNoteFile } from "./notes";

console.log("Initializing Web Audio API");

let audioContext: AudioContext;

try {
  audioContext = new window.AudioContext();
} catch (e) {
  console.error("Web Audio API is not supported in this browser:", e);
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
export const playCadence = (key: Key) => {
  const cadenceFile = keyToCadence[key];
  console.log("Playing cadence in key of ", key);
  const audio = new Audio(`/cadences/${cadenceFile}`);
  audio.play();
};

export const playMelody = async (notes: MelodicNote[]) => {
  const noteFiles = notes.map((n) => noteToNoteFile(n.note));
  const noteDurations = notes.map((n) => n.duration);

  const audioBuffers = await loadAudioBuffers(noteFiles);

  const bpm = 120;
  let delay = 0;
  let i = 0;
  const delayOffset = 60 / bpm;
  audioBuffers.forEach((b) => {
    const noteLength = delayOffset * noteDurations[i];

    const decayNode = audioContext.createGain();
    const source = audioContext.createBufferSource();
    source.buffer = b;

    source.connect(decayNode);
    decayNode.connect(audioContext.destination);

    decayNode.gain.exponentialRampToValueAtTime(
      0.1,
      audioContext.currentTime + delay + noteLength
    );
    source.start(audioContext.currentTime + delay);

    delay += noteLength;
    i++;
  });
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
