"use client";

import { Note, noteToMidi } from "../constants/notes";
// Helper for random wavy effect
function wavyRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  waviness = 3
) {
  // Generates a path for a rectangle with wavy sides
  // waviness: max px offset for waviness
  // Top
  const top = [
    `M ${x + rand(-waviness, waviness)} ${y + rand(-waviness, waviness)}`,
    `L ${x + w + rand(-waviness, waviness)} ${y + rand(-waviness, waviness)}`,
  ];
  // Right
  const right = [
    `L ${x + w + rand(-waviness, waviness)} ${
      y + h + rand(-waviness, waviness)
    }`,
  ];
  // Bottom
  const bottom = [
    `L ${x + rand(-waviness, waviness)} ${y + h + rand(-waviness, waviness)}`,
  ];
  // Left
  const left = [
    `L ${x + rand(-waviness, waviness)} ${y + rand(-waviness, waviness)}`,
  ];
  return [...top, ...right, ...bottom, ...left, "Z"].join(" ");
}
// Simple pseudo-random function with fixed seed for consistency
let i = 0;
function rand(min: number, max: number) {
  const randomNumbers = [
    0.091666, 0.576795, 0.594139, 0.835166, 0.896007, 0.785177, 0.180279,
    0.218705, 0.260117, 0.782493,
  ];
  const n = randomNumbers[i] * (max - min) + min;
  i = (i + 1) % randomNumbers.length;
  return n;
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
  const notes = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];
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
   * notesDown1: array of Note enums that are currently pressed (primary)
   * notesDown2: array of Note enums that are currently pressed (secondary)
   * getFill: function to determine fill color based on note and which notesDown array contains it
   * width: width of the entire piano in pixels (optional)
   */
  displayRange?: [Note, Note];
  notesDown1?: Note[];
  notesDown2?: Note[];
  getFill?: (note: Note, isDown1: boolean, isDown2: boolean) => string;
  width?: number;
}

export default function Piano({
  displayRange = [Note.A0, Note.C8],
  notesDown1 = [],
  notesDown2 = [],
  getFill,
  width,
}: PianoProps) {
  // Calculate range
  const firstMidi = noteToMidi[displayRange[0]];
  const lastMidi = noteToMidi[displayRange[1]];
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
      x: black
        ? whiteIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
        : whiteIndex * WHITE_KEY_WIDTH,
    });
    if (!black) whiteIndex++;
  }
  const svgHeight = WHITE_KEY_HEIGHT;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth + 10} ${svgHeight + 10}`}
    >
      {/* White keys - cartoony */}
      {keys
        .filter((k) => !k.black)
        .map((key, i) => {
          const isDown1 = notesDown1.includes(key.note as Note);
          const isDown2 = notesDown2.includes(key.note as Note);
          // Add slight random offset to each key for cartoon effect
          const x = i * WHITE_KEY_WIDTH + rand(-2, 2);
          const y = rand(-1, 1);
          const w = WHITE_KEY_WIDTH + rand(-1, 1);
          const h = WHITE_KEY_HEIGHT + rand(-2, 2);
          let fill = "var(--piano-white)";
          if (getFill) {
            fill = getFill(key.note as Note, isDown1, isDown2);
          } else if (isDown1) {
            fill = "var(--piano-white-down1)";
          } else if (isDown2) {
            fill = "var(--piano-white-down2)";
          }
          return (
            <path
              key={key.midi}
              d={wavyRectPath(x, y + 5, w, h, 3)}
              fill={fill}
              stroke="#222"
              strokeWidth={2.2}
            />
          );
        })}
      {/* Black keys - cartoony */}
      {keys
        .filter((k) => k.black)
        .map((key) => {
          const isDown1 = notesDown1.includes(key.note as Note);
          const isDown2 = notesDown2.includes(key.note as Note);
          // Add slight random offset to each key for cartoon effect
          const x = key.x + rand(-1.5, 1.5);
          const y = rand(-1, 1);
          const w = BLACK_KEY_WIDTH + rand(-1, 1);
          const h = BLACK_KEY_HEIGHT + rand(-2, 2);
          let fill = "var(--piano-black)";
          if (getFill) {
            fill = getFill(key.note as Note, isDown1, isDown2);
          } else if (isDown1) {
            fill = "var(--piano-black-down1)";
          } else if (isDown2) {
            fill = "var(--piano-black-down2)";
          }
          return (
            <path
              key={key.midi}
              d={wavyRectPath(x, y, w, h, 2.5)}
              fill={fill}
              stroke="#111"
              strokeWidth={2.2}
            />
          );
        })}
    </svg>
  );
}
