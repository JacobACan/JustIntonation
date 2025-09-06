import { NoteFile } from "../constants/notes";
import { keyToCadence } from "../constants/cadences";
import { Key } from "../constants/keys";

// Helper to play a note by filename
export const playNote = (noteFile: NoteFile) => {
  const audio = new Audio(`/notes/${noteFile}`);
  audio.play();
};

// Helper to play a note by filename
export const playCadence = (key: Key) => {
  const cadenceFile = keyToCadence[key];
  console.log("Playing cadence in key of ", key);
  const audio = new Audio(`/cadences/${cadenceFile}`);
  audio.play();
};
