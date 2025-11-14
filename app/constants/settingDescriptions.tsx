/**
 * Setting Descriptions
 *
 * Master bank of descriptions for all settings in the app. These descriptions
 * are designed to be beginner-friendly explanations of what each setting does
 * and why it matters. They are referenced throughout the app and displayed
 * contextually in the UI alongside each setting.
 *
 * Structure:
 * - Main Settings: Core settings for the learning experience
 * - General Settings: Settings that apply across all modes
 * - Chord Settings: Specific to chord guessing
 * - Melody Settings: Specific to melody guessing
 */

export const settingDescriptions = {
  // Main Settings
  LEARNING_MODE_SELECTOR: {
    title: "Learning Mode",
    description:
      "Choose between 3 modes which are what you will be actively guessing on the piano.",
  },
  QUESTION_RANGE_SELECTOR: {
    title: "Question Range",
    description:
      "The range in which the app will give you questions on the piano.",
  },
  MIDI_DEVICE_SELECTOR: {
    title: "MIDI Device",
    description:
      "This is required and the app is built around establishing this connection from sound to piano.",
  },

  // General Settings
  PLAY_CADENCE: {
    title: "Play Cadence",
    description:
      "The volume of the cadence played before and during the session. The cadence helps root you to a center so that you are able to create a reference and guess notes by their relative feeling to the root. The closer this sound is to 0, the more you will have to rely on the previous note as your reference.",
  },
  QUESTION_KEY_SELECTOR: {
    title: "Question Key",
    description:
      "This is the key (note) that questions are centered around. There are 12 different keys on the piano, each with a different feel when referencing notes. It's important to interweave keys to understand how to find notes in any key.",
  },
  QUESTION_SCALE_SELECTOR: {
    title: "Question Scale",
    description:
      "The scale establishes the musical context and vibe of the questions being asked.",
  },

  // Chord Settings
  CHORD_SIZE_SELECTOR: {
    title: "Chord Size",
    description: "Control the types of chords you'll be guessing.",
  },

  // Melody Settings
  MELODY_LENGTH_SELECTOR: {
    title: "Melody Length",
    description: "Control the length of melodies you'll be guessing.",
  },
} as const;

/**
 * Type for accessing setting descriptions
 */
export type SettingDescriptionKey = keyof typeof settingDescriptions;
