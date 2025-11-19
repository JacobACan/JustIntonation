import { Interval } from "./intervals";

export enum SHAPE {
    
    TRAPEZOID
} 

// Basically the shapes you can make with your hand
// Interval.Unison is where the focus is when playing the chord
export const SHAPES = [

  //Diads Root on top
  [-Interval.HALF_STEP, Interval.UNISON],
  [-Interval.WHOLE_STEP, Interval.UNISON],
  [-Interval.MINOR_THIRD, Interval.UNISON],
  [-Interval.MAJOR_THIRD, Interval.UNISON],
  [-Interval.PERFECT_FOURTH, Interval.UNISON],
  [-Interval.TRITONE, Interval.UNISON],
  [-Interval.PERFECT_FIFTH, Interval.UNISON],
  [-Interval.MINOR_SIXTH, Interval.UNISON],
  [-Interval.MAJOR_SIXTH, Interval.UNISON],
  [-Interval.MINOR_SEVENTH, Interval.UNISON],
  [-Interval.MAJOR_SEVENTH, Interval.UNISON],
  [-Interval.OCTAVE, Interval.UNISON],

  //Triads Focus On Top
  [-Interval.DIMINISHED_FIFTH, -Interval.MINOR_SECOND, Interval.UNISON] // Diminished
  []

  CHORD_INVERSIONS[CHORD_TYPES.MINOR].slice(2, 4), //Minor Triad
  CHORD_INVERSIONS[CHORD_TYPES.MINOR].slice(0, 2), //Minor Triad 1rst Inversion
  CHORD_INVERSIONS[CHORD_TYPES.MINOR].slice(1, 3), //Minor Triad 2nd Inversion

  CHORD_INVERSIONS[CHORD_TYPES.MAJOR_SEVENTH].
];

//   [CHORD_SHAPE.MAJOR_DIAD_ROOT_2]: [
//     CHORD_INVERSIONS[CHORD_TYPES.MAJOR][2],
//     CHORD_INVERSIONS[CHORD_TYPES.MAJOR][3],
//   ],

//   [CHORD_SHAPE.MAJOR_DIAD_FIRST_INVERSION]: [
//     CHORD_INVERSIONS[CHORD_TYPES.MAJOR][1],
//     CHORD_INVERSIONS[CHORD_TYPES.MAJOR][3],
//   ],

//   [CHORD_SHAPE.MAJOR_DIAD_SECOND_INVERSION]: [
//     CHORD_INVERSIONS[CHORD_TYPES.MAJOR][0],
//     CHORD_INVERSIONS[CHORD_TYPES.MAJOR][2],
//   ],

//   [CHORD_SHAPE.MINOR_ROOT]: CHORD_INVERSIONS[CHORD_TYPES.MINOR].slice(2, 4),

//   [CHORD_SHAPE.MINOR_FIRST_INVERSION]: CHORD_INVERSIONS[
//     CHORD_TYPES.MINOR
//   ].slice(0, 2),

//   [CHORD_SHAPE.MINOR_SECOND_INVERSION]: CHORD_INVERSIONS[
//     CHORD_TYPES.MINOR
//   ].slice(2, 4),
// };
