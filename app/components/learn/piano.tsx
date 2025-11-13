"use client";

import { noteToMidi } from "@/constants/midi";
import { Note } from "@/constants/notes";

// Helper for random wavy effect
function rectPath(x: number, y: number, w: number, h: number) {
  // Generates a path for a rectangle with wavy sides
  // waviness: max px offset for waviness
  // Top
  const top = [`M ${x} ${y}`, `L ${x + w} ${y}`];
  // Right
  const right = [`L ${x + w} ${y + h}`];
  // Bottom
  const bottom = [`L ${x} ${y + h}`];
  // Left
  const left = [`L ${x} ${y}`];
  return [...top, ...right, ...bottom, ...left, "Z"].join(" ");
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
  className?: string;
}

export default function Piano({
  displayRange = [Note.A0, Note.C8],
  notesDown1 = [],
  notesDown2 = [],
  getFill,
  width,
  className,
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
  const svgWidth = width || numWhiteKeys * 50; // fallback to 22px per key if no width
  const WHITE_KEY_WIDTH = svgWidth / numWhiteKeys;

  const WHITE_KEY_HEIGHT = WHITE_KEY_WIDTH * 5.45;
  const BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.65;
  const BLACK_KEY_HEIGHT = WHITE_KEY_HEIGHT * 0.67;

  const STROKE_WIDTH = 2.2;
  const STROKE_OFFSET = STROKE_WIDTH;
  const WHITE_BLACK_KEY_OFFSET = 2;

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

  const svgHeight = WHITE_KEY_HEIGHT + WHITE_BLACK_KEY_OFFSET;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth + STROKE_WIDTH * 2} ${svgHeight}`}
      className={`${className}`}
    >
      {keys
        // Draw White keys
        .filter((k) => !k.black)
        .map((key, i) => {
          const isDown1 = notesDown1.includes(key.note as Note);
          const isDown2 = notesDown2.includes(key.note as Note);
          const x = i * WHITE_KEY_WIDTH + STROKE_OFFSET;
          const y = 0;
          const w = WHITE_KEY_WIDTH;
          const h = WHITE_KEY_HEIGHT;
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
              // define the svg path for each key
              d={rectPath(x, y + WHITE_BLACK_KEY_OFFSET, w, h)}
              fill={fill}
              stroke="#222"
              strokeWidth={STROKE_WIDTH}
            />
          );
        })}
      {keys
        .filter((k) => k.black)
        .map((key) => {
          const isDown1 = notesDown1.includes(key.note as Note);
          const isDown2 = notesDown2.includes(key.note as Note);
          const x = key.x + STROKE_OFFSET;
          const y = 0;
          const w = BLACK_KEY_WIDTH;
          const h = BLACK_KEY_HEIGHT;
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
              d={rectPath(x, y, w, h)}
              fill={fill}
              stroke="#111"
              strokeWidth={2.2}
            />
          );
        })}
    </svg>
  );
}
