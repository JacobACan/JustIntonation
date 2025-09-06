import { Note, NoteFile } from "../constants/notes";
import { keyToCadence } from "../constants/cadences";
import { Key } from "../constants/keys";
import { noteToNoteFile } from "./notes";

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
      // Load all audio buffers
      const audioBuffers = await Promise.all(
        noteFiles.map(async (noteFile) => {
          const response = await fetch(`/notes/${noteFile}`);
          const arrayBuffer = await response.arrayBuffer();
          return audioContext.decodeAudioData(arrayBuffer);
        })
      );

      // Schedule all notes to play at the exact same time
      const startTime = audioContext.currentTime;
      audioBuffers.forEach((buffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
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
