/**
 * README and extracts content chunks for display
 */

export interface ContentChunk {
  title: string;
  content: string;
}
export function getContent(): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // Main tagline
  chunks.push({
    title: "JustIntonation",
    content: "Train your ear to hear music and play it back on the piano.",
  });

  // How it works
  chunks.push({
    title: "How It Works",
    content:
      "Listen to a note, melody, or chord played in a key — then play it back on your MIDI keyboard. Immediate feedback tells you if you got it right.",
  });

  chunks.push({
    title: "Why Tonal Context?",
    content:
      "Every exercise is grounded in a key. By always hearing sounds against a tonal center, you develop real relative pitch — not just interval guessing.",
  });

  chunks.push({
    title: "The Goal",
    content:
      "Build the ear-to-hand connection: hear something, know what it is, and play it. That's the skill behind learning songs by ear, improvising, and transcribing.",
  });

  // Training modes
  chunks.push({
    title: "Train with Notes",
    content:
      "Start by identifying individual scale degrees — the foundation of everything you'll hear.",
  });

  chunks.push({
    title: "Train with Melodies",
    content:
      "Hear and play back melodic sequences to develop your ear for longer phrases.",
  });

  chunks.push({
    title: "Train with Chords",
    content:
      "Recognize chord qualities and voicings by ear — the harmonic side of ear training.",
  });

  // Tools
  chunks.push({
    title: "Conceptualize Scales",
    content:
      "Visualize diatonic shapes across the keyboard and quiz yourself on scale patterns.",
  });

  chunks.push({
    title: "Transcribe by Ear",
    content:
      "Upload audio, slow it down, loop sections, and record yourself playing along — a workflow for learning songs by ear.",
  });

  // Features
  chunks.push({
    title: "Immediate Feedback",
    content:
      "Know right away whether you played correctly, so you can adjust and improve in real time.",
  });

  chunks.push({
    title: "Match Your Level",
    content:
      "Control the key, scale, range, and mode so the exercises fit where you are right now.",
  });

  chunks.push({
    title: "No Setup Required",
    content:
      "Runs entirely in your browser. Just connect a MIDI keyboard and start training.",
  });

  // Mission
  chunks.push({
    title: "Why This Exists",
    content:
      "Music is more enjoyable when you can play what you hear. Ear training closes the gap between the music in your head and the music under your fingers.",
  });

  return chunks;
}
