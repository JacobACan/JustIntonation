"use client";

import { Note } from "../constants/notes";
import { RandomGenerator } from "../utils/utils";
// Helper for random wavy effect
function wavyRectPath(x: number, y: number, w: number, h: number, waviness = 3) {
  // Generates a path for a rectangle with wavy sides
  // waviness: max px offset for waviness
  // Top
  const top = [
    `M ${x + rand(-waviness, waviness)} ${y + rand(-waviness, waviness)}`,
    `L ${x + w + rand(-waviness, waviness)} ${y + rand(-waviness, waviness)}`
  ];
  // Right
  const right = [
    `L ${x + w + rand(-waviness, waviness)} ${y + h + rand(-waviness, waviness)}`
  ];
  // Bottom
  const bottom = [
    `L ${x + rand(-waviness, waviness)} ${y + h + rand(-waviness, waviness)}`
  ];
  // Left
  const left = [
    `L ${x + rand(-waviness, waviness)} ${y + rand(-waviness, waviness)}`
    ];
  return [...top, ...right, ...bottom, ...left, 'Z'].join(' ');
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const WHITE_KEYS = ["A", "B", "C", "D", "E", "F", "G"];
const BLACK_KEYS = ["Ab", "Cb", "Db", "Fb", "Gb"];

// Helper to determine if a key is black
function isBlackKey(midi: number) {
  const note = midiNoteName(midi);
  return note.includes("b");
}

// MIDI note names for 88 keys (A0 to C8)
function midiNoteName(midi: number) {
  const notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const octave = Math.floor((midi - 12) / 12);
  const note = notes[midi % 12];
  return `${note}${octave}`;
}


/*
Parameters:
displayRange - first and last note to display Notes constants/notes.tsx( names, e.g. "A0" to "C8")
notesDown - an array of Notes(app/app/constants/notes.tsx) that are currently pressed down and visibly pressed down
width - width of the entire piano in pixels takes into account varying displayRanges. changing the width should change how the piano renders, these constants should actually change respectively based on the width of the entire piano. The height should be a ratio of the width of a key so that the piano looks normal no matter what width you put in.
*/
interface PianoProps {
  /**
   * displayRange: [firstNote, lastNote] to display (e.g. ["A0", "C8"])
   * notesDown: array of Note enums that are currently pressed
   * width: width of the entire piano in pixels (optional)
   */
  displayRange?: [Note, Note];
  notesDown?: Note[];
  width?: number;
}


export default function Piano({ displayRange = [Note.A0, Note.C8], notesDown = [], width }: PianoProps) {

  // Helper to get midi number from note name (e.g. "C4" -> 60)
  function noteNameToMidi(noteName: string): number {
    // MIDI note numbers: C-1 = 0, C0 = 12, C4 = 60, A0 = 21
    const regex = /^([A-G][b#]?)(\d)$/;
    const match = noteName.match(regex);
    if (!match) return 0;
    const [_, note, octaveStr] = match;
    const notes = ["C", "Cb", "D", "Db", "E", "F", "Fb", "G", "Gb", "A", "Ab", "B"];
    const noteIndex = notes.indexOf(note);
    const octave = parseInt(octaveStr, 10);
    return (octave + 1) * 12 + noteIndex;
  }


  // Calculate range
  const firstMidi = noteNameToMidi(displayRange[0]);
  const lastMidi = noteNameToMidi(displayRange[1]);
  const keys = [];
  let whiteIndex = 0;
  // First, count number of white keys in range
  let tempWhiteIndex = 0;
  for (let midi = firstMidi; midi <= lastMidi; midi++) {
    if (!isBlackKey(midi)) tempWhiteIndex++;
  }
  const numWhiteKeys = tempWhiteIndex;

  // Calculate dynamic key sizes
  const svgWidth = width || numWhiteKeys * 22; // fallback to 22px per key if no width
  const WHITE_KEY_WIDTH = svgWidth / numWhiteKeys;
  // Height is 5.45 times the width (120/22 from original ratio)
  const WHITE_KEY_HEIGHT = WHITE_KEY_WIDTH * 5.45;
  const BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.65;
  const BLACK_KEY_HEIGHT = WHITE_KEY_HEIGHT * 0.67;

  // Build keys with dynamic positions
  for (let midi = firstMidi; midi <= lastMidi; midi++) {
    const note = midiNoteName(midi);
    const black = isBlackKey(midi);
    keys.push({
      midi,
      note,
      black,
      whiteIndex: black ? whiteIndex - 1 : whiteIndex,
      x: black ? whiteIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 : whiteIndex * WHITE_KEY_WIDTH,
    });
    if (!black) whiteIndex++;
  }
  const svgHeight = WHITE_KEY_HEIGHT;

  return (
    <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth+10} ${svgHeight+10}`}> 
        {/* White keys - cartoony */}
        {keys
          .filter((k) => !k.black)
          .map((key, i) => {
            const isDown = notesDown.includes(key.note as Note);
            // Add slight random offset to each key for cartoon effect
            const x = i * WHITE_KEY_WIDTH + rand(-2, 2);
            const y = rand(-1, 1);
            const w = WHITE_KEY_WIDTH + rand(-1, 1);
            const h = WHITE_KEY_HEIGHT + rand(-2, 2);
            return (
              <path
                key={key.midi}
                d={wavyRectPath(x, y+5, w, h, 3)}
                fill={isDown ? "#aaf" : "#fff"}
                stroke="#222"
                strokeWidth={2.2}
                style={{ filter: 'drop-shadow(0 0 0.5px #0002)' }}
              />
            );
          })}
        {/* Black keys - cartoony */}
        {keys
          .filter((k) => k.black)
          .map((key) => {
            const isDown = notesDown.includes(key.note as Note);
            // Add slight random offset to each key for cartoon effect
            const x = key.x + rand(-1.5, 1.5);
            const y = rand(-1, 1);
            const w = BLACK_KEY_WIDTH + rand(-1, 1);
            const h = BLACK_KEY_HEIGHT + rand(-2, 2);
            return (
              <path
                key={key.midi}
                d={wavyRectPath(x, y, w, h, 2.5)}
                fill={isDown ? "#55f" : "#222"}
                stroke="#111"
                strokeWidth={2.2}
                style={{ filter: 'drop-shadow(0 0 0.5px #0004)' }}
              />
            );
          })}
    </svg>
  );
}